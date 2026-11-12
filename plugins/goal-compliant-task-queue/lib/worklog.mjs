// goal-compliant-task-queue: the programmatic half of Brett Whitty's question / task spec.
// Node built-ins only. Every write is temp-file + rename inside the state directory, under a lock.
// Brett's words are stored exactly as read (no trim, no newline normalisation); only comparisons trim.
//
// The CLI (scripts/worklog) and the MCP server (lib/mcp-server.mjs) both call these functions, so the
// same state and the same refusal rules apply whichever one the agent uses.

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import zlib from 'node:zlib'

export const PLUGIN_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const ASK = 'Have I sufficiently responded to your question?'

/** A rule in Brett's spec stops the operation. Exit code 2. */
export class Refusal extends Error {
  constructor(message) { super(message); this.name = 'Refusal'; this.code = 2 }
}
/** The caller passed bad arguments. Exit code 1. */
export class UsageError extends Error {
  constructor(message) { super(message); this.name = 'UsageError'; this.code = 1 }
}

// ---------------------------------------------------------------- environment, paths, config

function home(env) { return env.HOME || env.USERPROFILE || os.homedir() }

export function stateDir(env = process.env) {
  if (env.GCTQ_STATE) return path.resolve(env.GCTQ_STATE)
  const base = env.XDG_STATE_HOME || path.join(home(env), '.local', 'state')
  return path.join(base, 'goal-compliant-task-queue')
}

export function configPath(env = process.env) {
  if (env.GCTQ_CONFIG) return path.resolve(env.GCTQ_CONFIG)
  const base = env.XDG_CONFIG_HOME || path.join(home(env), '.config')
  return path.join(base, 'goal-compliant-task-queue', 'config.json')
}

export const CONFIG_DEFAULTS = Object.freeze({
  enabled: true,
  required_skills: [],
  optional_skills: [],
  subagents: [],
  curator: { enabled: false, subagent: 'task-queue-curator' },
})

/**
 * Read and validate Brett's config. Only Brett edits it; this never writes it.
 * Returns { path, exists, config, errors }. A config with errors disables mutating commands.
 */
export function loadConfig(env = process.env) {
  const p = configPath(env)
  const out = { path: p, exists: false, config: structuredClone(CONFIG_DEFAULTS), errors: [] }
  let raw
  try { raw = fs.readFileSync(p, 'utf8'); out.exists = true } catch (e) {
    if (e.code === 'ENOENT') return out
    out.errors.push(`cannot read ${p}: ${e.code || e.message}`)
    return out
  }
  let j
  try { j = JSON.parse(raw) } catch (e) { out.errors.push(`${p} is not valid JSON: ${e.message}`); return out }
  if (!j || typeof j !== 'object' || Array.isArray(j)) { out.errors.push(`${p}: top level must be an object`); return out }
  const strList = k => {
    if (j[k] === undefined) return
    if (!Array.isArray(j[k]) || !j[k].every(x => typeof x === 'string')) out.errors.push(`${k} must be an array of strings`)
    else out.config[k] = j[k]
  }
  if (j.enabled !== undefined) {
    if (typeof j.enabled !== 'boolean') out.errors.push('enabled must be true or false')
    else out.config.enabled = j.enabled
  }
  strList('required_skills'); strList('optional_skills')
  if (j.subagents !== undefined) {
    if (!Array.isArray(j.subagents)) out.errors.push('subagents must be an array')
    else out.config.subagents = j.subagents
  }
  if (j.curator !== undefined) {
    if (!j.curator || typeof j.curator !== 'object' || Array.isArray(j.curator)) out.errors.push('curator must be an object')
    else {
      if (j.curator.enabled !== undefined && typeof j.curator.enabled !== 'boolean') out.errors.push('curator.enabled must be true or false')
      if (j.curator.subagent !== undefined && typeof j.curator.subagent !== 'string') out.errors.push('curator.subagent must be a string')
      if (!out.errors.some(e => e.startsWith('curator'))) out.config.curator = { ...CONFIG_DEFAULTS.curator, ...j.curator }
    }
  }
  for (const k of Object.keys(j)) if (!(k in CONFIG_DEFAULTS)) out.errors.push(`unknown key: ${k}`)
  return out
}

export function requireEnabled(env) {
  const c = loadConfig(env)
  if (c.errors.length) throw new Refusal(`config ${c.path} has errors (Brett edits it; nothing was written):\n- ${c.errors.join('\n- ')}`)
  if (!c.config.enabled) throw new Refusal(`goal-compliant-task-queue is disabled by ${c.path} ("enabled": false); nothing was written`)
  return c.config
}

function now(env) {
  const t = env.GCTQ_NOW ? new Date(env.GCTQ_NOW) : new Date()
  if (Number.isNaN(t.getTime())) throw new UsageError(`GCTQ_NOW is not a date: ${env.GCTQ_NOW}`)
  return t.toISOString()
}

const SLUG = /^[a-z0-9][a-z0-9_-]{0,63}$/ // A42: lowercase, no spaces, URL-safe
function checkSlug(slug) {
  if (typeof slug !== 'string' || !SLUG.test(slug)) throw new UsageError(`bad slug ${JSON.stringify(slug)}: lowercase letters, digits, _ and -, up to 64, starting with a letter or digit (A42: cross-platform and URL safe)`)
  return slug
}

// ---------------------------------------------------------------- filesystem: atomic writes and a lock

function mkdirp(dir) { fs.mkdirSync(dir, { recursive: true }) }

function sleepMs(ms) { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms) }

export function atomicWrite(target, contents) {
  mkdirp(path.dirname(target))
  const tmp = `${target}.tmp.${process.pid}.${Date.now()}`
  let lastErr
  for (const wait of [0, 50, 200, 1000]) {
    if (wait) sleepMs(wait)
    try {
      fs.writeFileSync(tmp, contents)
      fs.renameSync(tmp, target)
      return
    } catch (e) {
      lastErr = e
      try { fs.unlinkSync(tmp) } catch { /* best effort */ }
      if (!['EBUSY', 'EPERM', 'EACCES'].includes(e.code)) break
    }
  }
  throw lastErr
}

function readJson(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')) } catch (e) {
    if (e.code === 'ENOENT') return fallback
    throw e
  }
}

function withLock(S, fn) {
  mkdirp(S)
  const lock = path.join(S, '.lock')
  const start = Date.now()
  for (;;) {
    try { fs.writeFileSync(lock, String(process.pid), { flag: 'wx' }); break } catch (e) {
      if (e.code !== 'EEXIST') throw e
      try { if (Date.now() - fs.statSync(lock).mtimeMs > 60000) { fs.unlinkSync(lock); continue } } catch { /* raced */ }
      if (Date.now() - start > 10000) throw new Error(`state is locked by ${lock}; another worklog is running`)
      sleepMs(25)
    }
  }
  try { return fn() } finally { try { fs.unlinkSync(lock) } catch { /* gone */ } }
}

// ---------------------------------------------------------------- question records

const qPath = (S, slug) => path.join(S, 'questions', `${slug}.json`)

export function listQuestions(S) {
  let names = []
  try { names = fs.readdirSync(path.join(S, 'questions')) } catch (e) { if (e.code !== 'ENOENT') throw e }
  return names.filter(n => n.endsWith('.json')).map(n => readJson(path.join(S, 'questions', n)))
    .filter(Boolean).sort((a, b) => a.opened_at.localeCompare(b.opened_at) || a.slug.localeCompare(b.slug))
}

function loadQ(S, slug) {
  checkSlug(slug)
  const q = readJson(qPath(S, slug), null)
  if (!q) throw new Refusal(`no question "${slug}"; open it first (worklog open ${slug} …)`)
  return q
}

function saveQ(S, q) { atomicWrite(qPath(S, q.slug), JSON.stringify(q, null, 2) + '\n') }

const isYes = text => String(text).trim().toLowerCase() === 'yes'
const answerSection = q => q.sections.find(s => s.kind === 'answer')
const answerReady = q => { const a = answerSection(q); return !!(a && a.body && a.body.trim()) }

// ---------------------------------------------------------------- materials (A9, A15)

/** Emoji for a link, by what it points at (A15: emoji in preference to ids). */
export function iconFor(uri) {
  const u = String(uri || '')
  if (/drive\.google|gdrive:/.test(u)) return '📄'
  if (/claude\.ai\/(code\/)?artifact/.test(u)) return '🧩'
  if (/gnomatix-org-tracker|vault/i.test(u)) return '📚'
  if (/\/pulls?\//.test(u)) return '🔀'
  if (/\/issues\//.test(u)) return '🎫'
  if (/gitea\.|github\.com/.test(u)) return '🐙'
  if (/^bd[: ]|beads/.test(u)) return '🔖'
  if (/\.jsonl$|log/i.test(u)) return '🧾'
  if (/memory[\\/]/.test(u)) return '🧠'
  if (/SKILL|skills[\\/]/.test(u)) return '🛠️'
  if (/^https?:\/\//.test(u)) return '🔗'
  return '💾'
}

/** "label|uri|emoji", "label|uri" or "uri" → { label, uri, emoji, title } (title is the hover text). */
export function parseMaterial(spec) {
  if (spec && typeof spec === 'object') return normMaterial(spec)
  const parts = String(spec).split('|')
  let label, uri, emoji
  if (parts.length === 1) [uri] = parts
  else if (parts.length === 2) [label, uri] = parts
  else { label = parts[0]; emoji = parts[parts.length - 1]; uri = parts.slice(1, -1).join('|') }
  return normMaterial({ label, uri, emoji })
}

function normMaterial(m) {
  if (!m.uri) throw new UsageError(`material needs a uri: ${JSON.stringify(m)}`)
  const label = m.label || undefined
  const out = { uri: m.uri, emoji: m.emoji || iconFor(m.uri), title: m.title || (label ? `${label}: ${m.uri}` : m.uri) }
  if (label) out.label = label
  return out
}

// ---------------------------------------------------------------- log (A22, A25, A27)

/**
 * Append a prompt verbatim to prompts/YYYY-MM-DD.jsonl with id P-YYYYMMDD-NNN-<sess4>.
 * With key, a second call with the same key returns the first entry instead of appending.
 */
export function log({ source, text, session, key }, env = process.env) {
  requireEnabled(env)
  if (!['user', 'agent', 'session'].includes(source)) throw new UsageError('--source must be user, agent or session')
  if (typeof text !== 'string') throw new UsageError('text is required')
  const S = stateDir(env)
  return withLock(S, () => {
    const dir = path.join(S, 'prompts')
    if (key) {
      let files = []
      try { files = fs.readdirSync(dir).filter(f => f.endsWith('.jsonl')) } catch { /* none */ }
      for (const f of files) for (const line of fs.readFileSync(path.join(dir, f), 'utf8').split(/\r?\n/)) {
        if (!line) continue
        const e = JSON.parse(line)
        if (e.key === key) return { ...e, duplicate: true, message: `${e.id} (already logged with key ${key})` }
      }
    }
    const t = now(env)
    const day = t.slice(0, 10)
    const file = path.join(dir, `${day}.jsonl`)
    let existing = ''
    try { existing = fs.readFileSync(file, 'utf8') } catch (e) { if (e.code !== 'ENOENT') throw e }
    const n = existing.split(/\r?\n/).filter(Boolean).length + 1
    const sess = session || env.GCTQ_SESSION || env.CLAUDE_SESSION_ID || ''
    const sess4 = (sess.replace(/[^A-Za-z0-9]/g, '').slice(0, 4) || '0000')
    const id = `P-${day.replace(/-/g, '')}-${String(n).padStart(3, '0')}-${sess4}`
    const entry = { id, time: t, source, session: sess || null, text }
    if (key) entry.key = key
    atomicWrite(file, existing + JSON.stringify(entry) + '\n')
    return { ...entry, file, message: id }
  })
}

export function prompts(env = process.env) {
  const dir = path.join(stateDir(env), 'prompts')
  let files = []
  try { files = fs.readdirSync(dir).filter(f => f.endsWith('.jsonl')).sort() } catch { return [] }
  return files.flatMap(f => fs.readFileSync(path.join(dir, f), 'utf8').split(/\r?\n/).filter(Boolean).map(l => JSON.parse(l)))
}

// ---------------------------------------------------------------- open (A1, A5, A8–A11, A14)

export function open({ slug, subject, quote, taskId, url }, env = process.env) {
  requireEnabled(env)
  checkSlug(slug)
  if (typeof subject !== 'string' || !subject.trim()) throw new UsageError('--subject is required: say what the question is about, Jira-style (A5)')
  if (typeof quote !== 'string' || !quote.trim()) throw new UsageError("--quote-file is required: Brett's question, verbatim")
  if (subject.trim() === quote.trim()) throw new Refusal('the subject only repeats his words; write a descriptive Jira-style subject and keep the quote in the description (A5)')
  const S = stateDir(env)
  return withLock(S, () => {
    if (fs.existsSync(qPath(S, slug))) throw new Refusal(`question "${slug}" is already open; one document per open question (A14). Use section/link to update it.`)
    const t = now(env)
    const q = {
      slug, subject, quote, task_id: taskId ?? null, url: url ?? null,
      status: 'open', opened_at: t, updated_at: t,
      sections: [
        { id: 's1', order: 1, kind: 'question', title: 'Question', body: quote, context: '', materials: [], updated_at: t },
        { id: 's2', order: 2, kind: 'answer', title: 'Answer', body: '', context: '', materials: [], updated_at: t },
      ],
      review: {}, review_history: [], asked: [], answers: [],
      answered_at: null, resolved_at: null, records: [],
    }
    saveQ(S, q)
    const waiting = listQuestions(S).filter(o => o.slug !== slug && o.status === 'open' && readyNotAsked(o))
    const warnings = waiting.map(o => `"${o.slug}" has an answer ready and Brett has not been asked "${ASK}" (A6)`)
    return { question: q, warnings, message: `opened ${slug}: ${subject}` }
  })
}

// ---------------------------------------------------------------- link (page URL / task id, set after publishing)

export function link({ slug, url, taskId, hub }, env = process.env) {
  requireEnabled(env)
  const S = stateDir(env)
  if (hub) {
    if (!url) throw new UsageError('--url is required with --hub')
    return withLock(S, () => {
      const f = path.join(S, 'hub.json')
      const cur = readJson(f, {})
      if (cur.url === url) return { changed: false, message: 'hub unchanged' }
      atomicWrite(f, JSON.stringify({ ...cur, url }, null, 2) + '\n')
      return { changed: true, message: `hub linked: ${url}` }
    })
  }
  return withLock(S, () => {
    const q = loadQ(S, slug)
    let changed = false
    if (url !== undefined && q.url !== url) { q.url = url; changed = true }
    if (taskId !== undefined && q.task_id !== taskId) { q.task_id = taskId; changed = true }
    if (changed) { q.updated_at = now(env); saveQ(S, q) }
    return { question: q, changed, message: changed ? `linked ${slug}` : `${slug} unchanged` }
  })
}

// ---------------------------------------------------------------- section (A9, A15, A16)

export function section({ slug, n, title, body, context, materials, kind }, env = process.env) {
  requireEnabled(env)
  const order = Number(n)
  if (!Number.isInteger(order) || order < 1) throw new UsageError('section number must be a whole number from 1')
  const S = stateDir(env)
  return withLock(S, () => {
    const q = loadQ(S, slug)
    if (q.status === 'resolved') throw new Refusal(`"${slug}" is resolved; open a new question for follow-up work (A2)`)
    let s = q.sections.find(x => x.order === order)
    if (order === 1 && body !== undefined && body !== q.quote) throw new Refusal("section 1 holds Brett's question verbatim and its body cannot be changed; add context or materials, or write another section")
    if (!s && body === undefined) throw new UsageError(`section ${order} is new: --body-file is required`)
    if (!s && !title) throw new UsageError(`section ${order} is new: --title is required`)
    const next = s ? { ...s } : { id: `s${order}`, order, kind: kind || 'note', title, body: '', context: '', materials: [] }
    if (title !== undefined) next.title = title
    if (body !== undefined) next.body = body
    if (context !== undefined) next.context = context
    if (materials !== undefined) next.materials = materials.map(parseMaterial)
    if (kind !== undefined && order > 1) next.kind = kind
    const same = s && ['title', 'body', 'context', 'kind'].every(k => next[k] === s[k]) && JSON.stringify(next.materials) === JSON.stringify(s.materials)
    if (same) return { question: q, changed: false, message: `${slug} section ${order} unchanged` }
    const t = now(env)
    next.updated_at = t
    if (next.kind === 'answer') for (const o of q.sections) if (o !== s && o.kind === 'answer') o.kind = 'note'
    q.sections = [...q.sections.filter(x => x.order !== order), next].sort((a, b) => a.order - b.order)
    q.updated_at = t
    saveQ(S, q)
    return { question: q, changed: true, message: `${slug} section ${order} ${s ? 'updated' : 'added'}: ${next.title}` }
  })
}

// ---------------------------------------------------------------- the working-document page and ArtifactData payload

/** One question as both front ends show it: the pane (worklog.json), the hub page and the document page. */
export function docView(q) {
  return {
    slug: q.slug, title: q.subject, url: q.url || '', status: q.status, task_id: q.task_id,
    opened_at: q.opened_at, asked: q.asked.length, ready_not_asked: readyNotAsked(q),
    answers: q.answers,
    sections: q.sections.map(s => ({ id: s.id, order: s.order, kind: s.kind, title: s.title, body: s.body, context: s.context, materials: s.materials })),
    review: q.review,
  }
}

/** The sync view: open questions oldest first (the first is the active one), plus the hub's own URL. */
function syncView(S) {
  const all = listQuestions(S)
  const docs = all.filter(q => q.status !== 'resolved').map(docView)
  const synced = all.reduce((m, q) => (q.updated_at > m ? q.updated_at : m), '') || null
  const hub = readJson(path.join(S, 'hub.json'), {})
  return { synced, source: 'goal-compliant-task-queue', hub_url: hub.url || '', active: docs[0]?.slug ?? null, docs }
}

const escHtml = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

/** The pages: the dependency-free HTML template (default) and its React/Tailwind/shadcn build (--react), same contract. */
export const TEMPLATES = Object.freeze({
  html: path.join(PLUGIN_ROOT, 'templates', 'working-document.html'),
  react: path.join(PLUGIN_ROOT, 'templates', 'working-document.react.html'),
})
const pickTemplate = (template, react) => template || (react ? TEMPLATES.react : TEMPLATES.html)

/** Fill the bundled page template: content goes in as JSON inside <script type="application/json" id="gctq-data">. */
export function renderPage(data, title, templatePath = TEMPLATES.html) {
  const tpl = fs.readFileSync(templatePath, 'utf8')
  const LS = new RegExp(String.fromCharCode(0x2028), 'g'), PS = new RegExp(String.fromCharCode(0x2029), 'g')
  const json = JSON.stringify(data).replace(/</g, '\\u003c').replace(LS, '\\u' + '2028').replace(PS, '\\u' + '2029')
  const re = /(<script type="application\/json" id="gctq-data">)[\s\S]*?(<\/script>)/
  if (!re.test(tpl)) throw new Error(`template ${templatePath} lacks <script type="application/json" id="gctq-data">`)
  let html = tpl.replace(re, (_, a, b) => a + json + b)
  html = html.replace(/<title>[^<]*<\/title>/, () => `<title>${escHtml(title)}</title>`)
  return html
}

/**
 * Write what the agent needs to publish the page and fill its store:
 *   page.html: the working document with content embedded (publish with the Artifact tool, capability db)
 *   items/<sid>.json: one per section (order, title, body, context, materials, kind)
 *   batch.json: { writes: [...] } for one ArtifactData "batch" call on collection "items"
 * Brett's ticks and USER COMMENTs live in collection "review", which only the page writes.
 */
export function artifactPayload({ slug, template, react }, env = process.env) {
  requireEnabled(env)
  const S = stateDir(env)
  return withLock(S, () => {
    const q = loadQ(S, slug)
    const dir = path.join(S, 'docs', slug, 'payload')
    const page = path.join(dir, 'page.html')
    const html = renderPage({ mode: 'doc', hub_url: syncView(S).hub_url, doc: docView(q) }, q.subject, pickTemplate(template, react))
    atomicWrite(page, html)
    atomicWrite(pageCopy(S, slug), html)
    atomicWrite(path.join(dir, 'capabilities.json'), JSON.stringify(CAPABILITIES, null, 2) + '\n')
    const items = []
    for (const s of q.sections) {
      const f = path.join(dir, 'items', `${s.id}.json`)
      atomicWrite(f, JSON.stringify({ order: s.order, kind: s.kind, title: s.title, body: s.body, context: s.context, materials: s.materials }, null, 2) + '\n')
      items.push({ id: s.id, file: f })
    }
    // Remove item files for sections that no longer exist.
    try {
      for (const f of fs.readdirSync(path.join(dir, 'items'))) if (f.endsWith('.json') && !items.some(i => i.id === f.slice(0, -5))) fs.unlinkSync(path.join(dir, 'items', f))
    } catch { /* none */ }
    const batch = { writes: items.map(i => ({ op: 'set', collection: 'items', doc_id: i.id, file_path: i.file })) }
    const batchFile = path.join(dir, 'batch.json')
    atomicWrite(batchFile, JSON.stringify(batch, null, 2) + '\n')
    return {
      page, local_copy: pageCopy(S, slug), pulls: pullDir(S, slug), items, batch: batchFile, capabilities: path.join(dir, 'capabilities.json'), url: q.url,
      message: [
        `page: ${page}`,
        `items: ${items.map(i => i.file).join(' ')}`,
        `batch: ${batchFile}`,
        q.url ? `publish page.html to ${q.url}, then ArtifactData batch with batch.json's writes (add if_version for items that already exist)`
          : `publish page.html (new artifact) with the capabilities in capabilities.json, then: worklog link ${slug} --url <url>; then ArtifactData batch with batch.json's writes`,
      ].join('\n'),
    }
  })
}

/**
 * What each page is published with. Only the owner (Brett) can write ticks and comments ("review", A9);
 * the agent's ArtifactData writes act as the owner too, so "items" is owner-only as well; viewers read.
 * user: who ticked or commented. comments (composer only): Brett anchors a comment on any section.
 */
export const CAPABILITIES = Object.freeze({
  db: { rules: [{ path: 'review', read: 'view', write: 'owner' }, { path: 'items', read: 'view', write: 'owner' }] },
  user: {},
  comments: {}, // full form: sendToClaude needs the write verbs; composer_only grants only openComposer and anchorFor
})

/** The hub page: the claude.ai equivalent of the pane, built from the same sync view as worklog.json. */
export function hubPayload({ template, react } = {}, env = process.env) {
  requireEnabled(env)
  const S = stateDir(env)
  const r = sync(env)
  return withLock(S, () => {
    const view = JSON.parse(fs.readFileSync(r.file, 'utf8'))
    const dir = path.join(S, 'hub')
    const page = path.join(dir, 'page.html')
    const html = renderPage({ mode: 'hub', ...view }, 'Open questions', pickTemplate(template, react))
    atomicWrite(page, html)
    atomicWrite(pageCopy(S, 'hub'), html)
    const caps = path.join(dir, 'capabilities.json')
    atomicWrite(caps, JSON.stringify(CAPABILITIES, null, 2) + '\n')
    return {
      page, local_copy: pageCopy(S, 'hub'), pulls: pullDir(S, 'hub'), capabilities: caps, url: view.hub_url || null, docs: view.docs.length,
      message: [`page: ${page}`, `capabilities: ${caps}`, `${view.docs.length} open question(s)`,
        view.hub_url ? `publish page.html to ${view.hub_url}` : 'publish page.html (new artifact), then: worklog link --hub --url <url>'].join('\n'),
    }
  })
}

// ---------------------------------------------------------------- pull (A11): Brett's ticks and comments, verbatim

function readReviewDir(fromDir) {
  const revDir = path.join(path.resolve(fromDir), 'review')
  let files = []
  try { files = fs.readdirSync(revDir).filter(f => f.endsWith('.json') && f !== `${LOCK_ID}.json`).sort() } catch (e) {
    if (e.code !== 'ENOENT') throw e
  }
  return files.map(f => {
    const j = JSON.parse(fs.readFileSync(path.join(revDir, f), 'utf8'))
    const d = j && typeof j.data === 'object' && j.data !== null ? j.data : j
    return { id: f.slice(0, -5), checked: d.checked === true, comment: typeof d.comment === 'string' ? d.comment : '', updated: d.updated ?? null }
  })
}

/** Local-first (A60-A62): where the agent points ArtifactData list out_dir for a page's store, and where pull reads by default. */
export function pullDir(S, name) { return path.join(S, 'pulls', name) }
/** Every page the agent publishes is also kept locally. */
export function pageCopy(S, name) { return path.join(S, 'pages', `${name}.html`) }

/** The page's lock doc (A58): review/_lock, written by the page before "Send my updates to Claude", deleted by the agent. */
export const LOCK_ID = '_lock'

/**
 * Unlock a page after reviewing what Brett sent (A58). The CLI cannot reach claude.ai, so this returns the
 * ArtifactData call for the agent to make: delete doc _lock in collection review of the page.
 */
export function unlock({ slug, hub }, env = process.env) {
  const S = stateDir(env)
  const url = hub ? (readJson(path.join(S, 'hub.json'), {}).url || null) : (loadQ(S, slug).url || null)
  const call = { action: 'delete', url, collection: 'review', doc_id: LOCK_ID }
  const what = hub ? 'the hub page' : slug
  return {
    call,
    message: url
      ? `unlock ${what}: ArtifactData ${JSON.stringify(call)}`
      : `${what} has no page URL yet (worklog link ${hub ? '--hub' : slug} --url <url>); nothing to unlock`,
  }
}

/** Merge one review row into a question; his words verbatim. The later 'updated' wins when both pages carry one. */
function mergeReview(q, sid, r, t, from) {
  const cur = q.review[sid] || { checked: false, comment: '', updated: null }
  if (cur.updated && r.updated && r.updated < cur.updated) return false
  if (cur.checked === r.checked && cur.comment === r.comment && (!r.updated || r.updated === cur.updated)) return false
  q.review[sid] = { checked: r.checked, comment: r.comment, updated: r.updated }
  q.review_history.push({ at: t, section: sid, checked: r.checked, comment: r.comment, updated: r.updated, from })
  return true
}

/**
 * Merge Brett's ticks and USER COMMENTs into local state (A11) from an ArtifactData "list" out_dir dump:
 * <from-dir>/review/<sid>.json for a document page, or with hub, <from-dir>/review/<slug>~<sid>.json from the hub page.
 * Rows in items/ are the agent's own writes and are ignored.
 */
export function pull({ slug, fromDir, hub, pane }, env = process.env) {
  requireEnabled(env)
  const S = stateDir(env)
  if (pane) return pullPane(S, env)
  if (!hub) checkSlug(slug)
  const dir = fromDir || pullDir(S, hub ? 'hub' : slug)
  const incoming = readReviewDir(dir)
  const locked = fs.existsSync(path.join(path.resolve(dir), 'review', `${LOCK_ID}.json`))
  return withLock(S, () => {
    const t = now(env)
    const changes = []
    const touched = new Map()
    for (const r of incoming) {
      let qslug = slug, sid = r.id
      if (hub) { const i = r.id.indexOf('~'); if (i < 1) continue; qslug = r.id.slice(0, i); sid = r.id.slice(i + 1) }
      const q = touched.get(qslug) || (hub ? readJson(qPath(S, checkSlug(qslug)), null) : loadQ(S, qslug))
      if (!q) continue
      if (mergeReview(q, sid, r, t, hub ? 'hub' : 'document')) { changes.push(`${qslug}/${sid}`); touched.set(qslug, q) }
    }
    for (const q of touched.values()) { q.updated_at = t; saveQ(S, q) }
    return { changed: changes, locked, from_dir: path.resolve(dir), message: (changes.length ? `Brett's review updated: ${changes.join(', ')}` : 'no new ticks or comments') + (locked ? '\nthe page is locked (sent to Claude): review, act, then worklog unlock' : '') }
  })
}

/** Brett's ticks made in the Claude Code pane (<state>/pane-ticks.json, keyed "slug/sid"); comments are kept as they are. */
function pullPane(S, env) {
  const marks = readJson(path.join(S, 'pane-ticks.json'), {})
  return withLock(S, () => {
    const t = now(env)
    const changes = []
    const touched = new Map()
    for (const [key, m] of Object.entries(marks)) {
      const i = key.indexOf('/')
      if (i < 1 || !m || typeof m.checked !== 'boolean') continue
      const qslug = key.slice(0, i), sid = key.slice(i + 1)
      if (!SLUG.test(qslug)) continue
      const q = touched.get(qslug) || readJson(qPath(S, qslug), null)
      if (!q) continue
      const cur = q.review[sid] || {}
      if (mergeReview(q, sid, { checked: m.checked, comment: cur.comment || '', updated: m.at || null }, t, 'pane')) { changes.push(key); touched.set(qslug, q) }
    }
    for (const q of touched.values()) { q.updated_at = t; saveQ(S, q) }
    return { changed: changes, message: changes.length ? `Brett's pane ticks merged: ${changes.join(', ')}` : 'no new pane ticks' }
  })
}

// ---------------------------------------------------------------- asked / answer (A2, A3, A6)

function readyNotAsked(q) {
  if (q.status !== 'open' || !answerReady(q)) return false
  const a = answerSection(q)
  const last = q.asked.at(-1)
  return !last || last.at < a.updated_at
}

export function asked({ slug }, env = process.env) {
  requireEnabled(env)
  const S = stateDir(env)
  return withLock(S, () => {
    const q = loadQ(S, slug)
    if (q.status === 'resolved') throw new Refusal(`"${slug}" is already resolved`)
    if (q.status === 'answered') throw new Refusal(`"${slug}": Brett already answered "yes"; run worklog resolve ${slug}`)
    if (!answerReady(q)) throw new Refusal(`"${slug}" has no answer written yet (section ${answerSection(q)?.order ?? 2}); ask "${ASK}" only once the evidence shows it is answered (A2)`)
    const t = now(env)
    q.asked.push({ at: t })
    q.updated_at = t
    saveQ(S, q)
    return { question: q, message: `${slug}: asked "${ASK}" at ${t} (ask #${q.asked.length})` }
  })
}

export function answer({ slug, text }, env = process.env) {
  requireEnabled(env)
  if (typeof text !== 'string') throw new UsageError('--text-file is required (his reply, verbatim)')
  const S = stateDir(env)
  return withLock(S, () => {
    const q = loadQ(S, slug)
    if (q.status === 'resolved') throw new Refusal(`"${slug}" is resolved; record follow-up as a new question (A2)`)
    const t = now(env)
    const yes = isYes(text)
    q.answers.push({ at: t, text, after_ask: q.asked.length, yes })
    const warnings = []
    if (yes && q.asked.length > 0) { q.status = 'answered'; q.answered_at = t }
    else if (yes) warnings.push(`"yes" recorded, but "${ASK}" was never asked for "${slug}" (worklog asked); the question stays open`)
    else if (q.status === 'answered') { q.status = 'open'; q.answered_at = null; warnings.push(`"${slug}" reopened: his latest reply is not "yes"`) }
    q.updated_at = t
    saveQ(S, q)
    return { question: q, warnings, message: `${slug}: reply recorded; status ${q.status}` }
  })
}

// ---------------------------------------------------------------- resolve (A2, A7, A13): the bead, only after "yes"

function beadBody(q) {
  const L = []
  L.push(`Question (Brett Whitty, verbatim):`, '', ...q.quote.split(/\r?\n/).map(l => `> ${l}`), '')
  if (q.task_id != null) L.push(`Session task: #${q.task_id}`)
  if (q.url) L.push(`Working document: ${q.url}`)
  L.push(`Opened: ${q.opened_at}`, '')
  L.push('## Work log', '')
  for (const s of q.sections) {
    L.push(`### ${s.order}. ${s.title}`, '', s.body || '(empty)', '')
    if (s.context) L.push('FULL CONTEXT:', '', s.context, '')
    if (s.materials?.length) L.push('SUPPORTING MATERIALS:', ...s.materials.map(m => `- ${m.emoji} ${m.label ? m.label + ': ' : ''}${m.uri}`), '')
    const r = q.review[s.id]
    if (r) L.push(`Brett confirms: ${r.checked ? 'yes' : 'no'}`, ...(r.comment ? ['USER COMMENT (verbatim):', '', r.comment, ''] : ['']))
  }
  L.push('## Asked and answered', '')
  for (const a of q.asked) L.push(`- ${a.at}: asked "${ASK}"`)
  for (const a of q.answers) L.push(`- ${a.at}: Brett replied (verbatim): ${JSON.stringify(a.text)}`)
  return L.join('\n') + '\n'
}

export function resolve({ slug, repo }, env = process.env) {
  requireEnabled(env)
  const S = stateDir(env)
  return withLock(S, () => {
    const q = loadQ(S, slug)
    if (q.status === 'resolved') {
      const b = q.records.find(r => r.kind === 'bead')
      return { question: q, bead: b?.id, changed: false, message: `${slug} already resolved; bead ${b?.id}` }
    }
    if (q.records.some(r => r.status === 'creating')) throw new Refusal(`"${slug}": an earlier resolve started a bead and did not finish; check beads for "${q.subject}" before trying again`)
    if (q.status !== 'answered') {
      throw new Refusal(`"${slug}" is ${q.status}: a bead is created only after Brett answers "yes" to "${ASK}" (A2, A7). ` +
        (q.asked.length ? 'His latest reply was not "yes".' : 'He has not been asked yet.'))
    }
    const bodyFile = path.join(S, 'docs', slug, 'bead-body.md')
    atomicWrite(bodyFile, beadBody(q))
    const t = now(env)
    q.records.push({ kind: 'bead', status: 'creating', at: t })
    saveQ(S, q)
    const bd = env.GCTQ_BD || 'bd'
    const actor = env.GCTQ_ACTOR || 'claude-cli'
    const args = ['create', '--actor', actor, '--title', q.subject, '--body-file', bodyFile,
      '--type', 'task', '--status', 'in_progress', '--labels', 'question', '--silent']
    if (q.url) args.push('--external-ref', q.url)
    const r = spawnSync(bd, args, { encoding: 'utf8', cwd: repo ? path.resolve(repo) : process.cwd(), env })
    const id = (r.stdout || '').trim().split(/\r?\n/).filter(Boolean).at(-1)
    if (r.error || r.status !== 0 || !id) {
      q.records = q.records.filter(x => x.status !== 'creating')
      saveQ(S, q)
      throw new Refusal(`bd create failed (${r.error ? r.error.message : `exit ${r.status}`}): ${(r.stderr || '').trim()}; "${slug}" stays answered, nothing recorded`)
    }
    q.records = q.records.map(x => x.status === 'creating' ? { kind: 'bead', id, at: t } : x)
    q.status = 'resolved'
    q.resolved_at = t
    q.updated_at = t
    saveQ(S, q)
    return {
      question: q, bead: id, changed: true,
      message: `${slug} resolved: bead ${id} created (in_progress). Now log the work, save memories, review for anything to clarify; then bd close ${id} (A2).`,
    }
  })
}

// ---------------------------------------------------------------- archive (A59): the decision / clarification record

/**
 * A fenced block holding text byte-exact: the fence is longer than any backtick run in the text, and the content is
 * everything between the opening fence line and the newline before the closing fence (that one newline is added).
 */
export function verbatimBlock(text) {
  const run = Math.max(0, ...(String(text).match(/`+/g) || []).map(m => m.length))
  const fence = '`'.repeat(Math.max(3, run + 1))
  return `${fence}text\n${text}\n${fence}`
}

const yamlStr = v => (v === null || v === undefined ? 'null' : JSON.stringify(String(v)))

/** The archive file's text: YAML front matter, then the whole work log; Brett's words in verbatim blocks. */
export function archiveMarkdown(q) {
  const bead = q.records.find(r => r.kind === 'bead' && r.id)?.id ?? null
  const finalYes = [...q.answers].reverse().find(a => a.yes) || null
  const fm = [
    '---',
    'kind: decision-clarification',
    `key: ${yamlStr(q.slug)}`,
    `subject: ${yamlStr(q.subject)}`,
    `status: ${yamlStr(q.status)}`,
    `opened_at: ${yamlStr(q.opened_at)}`,
    `asked_at: [${q.asked.map(a => yamlStr(a.at)).join(', ')}]`,
    `answered_at: ${yamlStr(q.answered_at)}`,
    `resolved_at: ${yamlStr(q.resolved_at)}`,
    `bead: ${yamlStr(bead)}`,
    `document_url: ${yamlStr(q.url)}`,
    `session_task: ${yamlStr(q.task_id)}`,
    'author: claude-cli',
    'reporter: Brett Whitty',
    'tags: [decision-clarification, question, work-log, goal-compliant-task-queue]',
    '---',
  ]
  const L = [...fm, '', `# ${q.subject}`, '',
    "Brett Whitty's words are in fenced blocks exactly as written: a block's content is everything between its opening fence line and the newline before its closing fence.", '',
    '## Question (Brett Whitty, verbatim)', '', verbatimBlock(q.quote), '']
  for (const sec of q.sections) {
    const r = q.review[sec.id] || {}
    L.push(`## ${sec.order}. ${sec.title}`, '', `- Brett confirms: [${r.checked ? 'x' : ' '}]${r.updated ? ` (${r.updated})` : ''}`, '')
    if (sec.order === 1) L.push('Body: the question above, verbatim.', '')
    else L.push(sec.body || '_not written_', '')
    L.push('### FULL CONTEXT', '', sec.context || '_none_', '', '### SUPPORTING MATERIALS', '')
    if (sec.materials && sec.materials.length) for (const m of sec.materials) L.push(`- ${m.emoji || '🔗'} ${/^https?:\/\//.test(m.uri) ? `[${m.label || m.uri}](${m.uri})` : `${m.label ? m.label + ': ' : ''}\`${m.uri}\``}`)
    else L.push('_none_')
    L.push('', '### USER COMMENT (Brett Whitty, verbatim)', '')
    L.push(r.comment ? verbatimBlock(r.comment) : '_none_', '')
  }
  L.push('## Ask / answer history', '')
  const events = [...q.asked.map(a => ({ at: a.at, ask: true })), ...q.answers.map(a => ({ at: a.at, a }))]
    .sort((x, y) => (x.at < y.at ? -1 : x.at > y.at ? 1 : (x.ask ? -1 : 1)))
  for (const e of events) {
    if (e.ask) L.push(`### ${e.at}: claude-cli asked`, '', `> ${ASK}`, '')
    else L.push(`### ${e.a.at}: Brett Whitty replied${e.a.yes ? ' ("yes")' : ''}`, '', verbatimBlock(e.a.text), '')
  }
  L.push('## Final answer (Brett Whitty, verbatim)', '', finalYes ? `${finalYes.at}\n\n${verbatimBlock(finalYes.text)}` : '_none_', '')
  return L.join('\n')
}

/**
 * Write <state>/archive/<yyyy-mm-dd>-<slug>.md for a resolved question (A59): only after "yes" and the bead.
 * No network: the agent copies the file to the vault Inbox and the Drive worklog/archive/ folder.
 */
export function archive({ slug }, env = process.env) {
  requireEnabled(env)
  const S = stateDir(env)
  return withLock(S, () => {
    const q = loadQ(S, slug)
    if (q.status !== 'resolved') throw new Refusal(`"${slug}" is ${q.status}: the archive is written only once the question is resolved (after "yes" and worklog resolve) (A59)`)
    const day = String(q.resolved_at || now(env)).slice(0, 10)
    const file = path.join(S, 'archive', `${day}-${slug}.md`.toLowerCase())
    const text = archiveMarkdown(q)
    let same = false
    try { same = fs.readFileSync(file, 'utf8') === text } catch (e) { if (e.code !== 'ENOENT') throw e }
    if (!same) atomicWrite(file, text)
    return { file, changed: !same, message: `archive: ${file}\ncopy it to the vault Inbox and the Drive worklog/archive/ folder` }
  })
}

// ---------------------------------------------------------------- sync (A17, A18): the pane's data file

export function sync(env = process.env) {
  requireEnabled(env)
  const S = stateDir(env)
  return withLock(S, () => {
    const out = syncView(S)
    const docs = out.docs
    const file = path.join(S, 'worklog.json')
    const text = JSON.stringify(out, null, 2) + '\n'
    let prev = null
    try { prev = fs.readFileSync(file, 'utf8') } catch { /* first sync */ }
    if (prev !== text) atomicWrite(file, text)
    return { file, docs: docs.length, changed: prev !== text, message: `${file}: ${docs.length} open question(s)${prev === text ? ' (unchanged)' : ''}` }
  })
}

// ---------------------------------------------------------------- status (A4, A6, A7, A13)

export function status({ tasks } = {}, env = process.env) {
  const S = stateDir(env)
  const all = listQuestions(S)
  const open = all.filter(q => q.status !== 'resolved')
  const recordsBeforeYes = all.flatMap(q => q.records.filter(r => !q.answered_at || r.at < q.answered_at).map(r => ({ slug: q.slug, record: r })))
  const taskIds = (tasks || []).map(String)
  const known = new Set(all.map(q => q.task_id).filter(x => x != null).map(String))
  const res = {
    state: S,
    open: open.map(q => ({ slug: q.slug, subject: q.subject, status: q.status, task_id: q.task_id, url: q.url, opened_at: q.opened_at, asked: q.asked.length, answer_ready: answerReady(q) })),
    active: open[0]?.slug ?? null,
    ready_not_asked: open.filter(readyNotAsked).map(q => q.slug),
    answered_not_resolved: open.filter(q => q.status === 'answered').map(q => q.slug),
    orphans: {
      without_task: open.filter(q => q.task_id == null).map(q => q.slug),
      without_page: open.filter(q => !q.url).map(q => q.slug),
      tasks_without_document: taskIds.filter(t => !known.has(t)),
    },
    records_before_yes: recordsBeforeYes,
  }
  const L = []
  if (!open.length) L.push('No open questions.')
  for (const q of res.open) L.push(`${q.slug === res.active ? '*' : ' '} ${q.slug}  [${q.status}]  ${q.subject}  task ${q.task_id ?? '-'}  asked ${q.asked}  ${q.url ?? '(no page)'}`)
  if (res.ready_not_asked.length) L.push(`Answer ready, Brett not asked "${ASK}": ${res.ready_not_asked.join(', ')} (A6)`)
  if (res.answered_not_resolved.length) L.push(`Brett said "yes", not yet resolved: ${res.answered_not_resolved.join(', ')}`)
  const o = res.orphans
  if (o.without_task.length) L.push(`No session task: ${o.without_task.join(', ')}`)
  if (o.without_page.length) L.push(`No published page: ${o.without_page.join(', ')}`)
  if (o.tasks_without_document.length) L.push(`Tasks without a document: ${o.tasks_without_document.join(', ')}`)
  if (!tasks) L.push('(Task-without-document check needs --tasks <ids>: the session task list is not visible to this tool.)')
  L.push(`Records made before "yes": ${recordsBeforeYes.length}`)
  res.message = L.join('\n')
  return res
}

// ---------------------------------------------------------------- metrics (A28, A29)

export function metrics({ tasks } = {}, env = process.env) {
  const S = stateDir(env)
  const all = listQuestions(S)
  const mins = (a, b) => Math.round((new Date(b) - new Date(a)) / 6000) / 10
  const toAsk = all.filter(q => q.asked.length).map(q => ({ slug: q.slug, minutes: mins(q.opened_at, q.asked[0].at) }))
  const firstReplies = all.map(q => q.answers.find(a => a.after_ask >= 1)).filter(Boolean)
  const st = status({ tasks }, env)
  const ps = prompts(env)
  const sorted = toAsk.map(x => x.minutes).sort((a, b) => a - b)
  const res = {
    opened: all.length,
    open: all.filter(q => q.status === 'open').length,
    answered: all.filter(q => q.status === 'answered').length,
    resolved: all.filter(q => q.status === 'resolved').length,
    time_open_to_first_ask_minutes: { per_question: toAsk, median: sorted.length ? sorted[Math.floor((sorted.length - 1) / 2)] : null },
    first_ask_yes: firstReplies.filter(a => a.yes).length,
    first_ask_rework: firstReplies.filter(a => !a.yes).length,
    asks_total: all.reduce((n, q) => n + q.asked.length, 0),
    ready_not_asked: st.ready_not_asked.length,
    orphans: st.orphans.without_task.length + st.orphans.without_page.length + st.orphans.tasks_without_document.length,
    orphan_detail: st.orphans,
    records_before_yes: st.records_before_yes.length,
    prompts_logged: { user: ps.filter(p => p.source === 'user').length, agent: ps.filter(p => p.source === 'agent').length, session: ps.filter(p => p.source === 'session').length },
  }
  res.message = [
    `opened ${res.opened} (open ${res.open}, answered ${res.answered}, resolved ${res.resolved})`,
    `time open → first ask (min): median ${res.time_open_to_first_ask_minutes.median ?? '-'} over ${toAsk.length}`,
    `first ask: yes ${res.first_ask_yes}, rework ${res.first_ask_rework}; asks total ${res.asks_total}`,
    `answer ready but not asked: ${res.ready_not_asked}`,
    `orphans: ${res.orphans}`,
    `records before yes: ${res.records_before_yes} (should be 0)`,
    `prompts logged: user ${res.prompts_logged.user}, agent ${res.prompts_logged.agent}, session ${res.prompts_logged.session}`,
  ].join('\n')
  return res
}

export function show({ slug }, env = process.env) {
  const q = loadQ(stateDir(env), slug)
  return { question: q, message: JSON.stringify(q, null, 2) }
}

export function config(env = process.env) {
  const c = loadConfig(env)
  return { ...c, message: `${c.path}${c.exists ? '' : ' (absent; defaults)'}\n${JSON.stringify(c.config, null, 2)}${c.errors.length ? `\nerrors:\n- ${c.errors.join('\n- ')}` : ''}` }
}

// ---------------------------------------------------------------- event log and snapshots (A64): core, always on

/** <state>/log/events.jsonl: one JSON line per state change, appended, never rewritten. */
export function eventsPath(env = process.env) { return path.join(stateDir(env), 'log', 'events.jsonl') }

export function appendEvent(env, ev) {
  requireEnabled(env)
  const f = eventsPath(env)
  mkdirp(path.dirname(f))
  const line = { at: now(env), actor: env.GCTQ_ACTOR || 'claude-cli', ...ev }
  fs.appendFileSync(f, JSON.stringify(line) + '\n')
  return line
}

export function readEvents(env = process.env) {
  let text = ''
  try { text = fs.readFileSync(eventsPath(env), 'utf8') } catch (e) { if (e.code !== 'ENOENT') throw e }
  return text.split('\n').filter(Boolean).map(l => { try { return JSON.parse(l) } catch { return { unreadable: l } } })
}

/** worklog log-show [--slug S] [--since T] */
export function logShow({ slug, since } = {}, env = process.env) {
  const events = readEvents(env).filter(e => (!slug || e.slug === slug) && (!since || String(e.at) >= String(since)))
  return { events, file: eventsPath(env), message: events.length ? events.map(e => JSON.stringify(e)).join('\n') : `no events in ${eventsPath(env)}` }
}

// A minimal ustar writer (files only), so a snapshot needs no tar binary on any platform.
function tarHeader(name, size, mtime) {
  const h = Buffer.alloc(512)
  let prefix = ''
  if (Buffer.byteLength(name) > 100) {
    // ustar: split at a "/" so the prefix is at most 155 bytes and the name at most 100.
    let cut = -1
    for (let j = name.indexOf('/'); j !== -1 && j <= 155; j = name.indexOf('/', j + 1)) if (Buffer.byteLength(name.slice(j + 1)) <= 100) { cut = j; break }
    if (cut < 0) throw new Error(`path too long for a snapshot: ${name}`)
    prefix = name.slice(0, cut); name = name.slice(cut + 1)
  }
  const put = (str, off, len) => h.write(str, off, len, 'utf8')
  const oct = (n, len) => n.toString(8).padStart(len - 1, '0') + '\0'
  put(name, 0, 100); put(oct(0o644, 8), 100, 8); put(oct(0, 8), 108, 8); put(oct(0, 8), 116, 8)
  put(oct(size, 12), 124, 12); put(oct(Math.floor(mtime / 1000), 12), 136, 12)
  put('        ', 148, 8); put('0', 156, 1); put('ustar\u000000', 257, 8); put(prefix, 345, 155)
  let sum = 0
  for (const byte of h) sum += byte
  put(sum.toString(8).padStart(6, '0') + '\0 ', 148, 8)
  return h
}

function stateFiles(S, rel = '') {
  const out = []
  let entries = []
  try { entries = fs.readdirSync(path.join(S, rel), { withFileTypes: true }) } catch (e) { if (e.code === 'ENOENT') return out; throw e }
  for (const d of entries.sort((a, b) => (a.name < b.name ? -1 : 1))) {
    const r = rel ? `${rel}/${d.name}` : d.name
    if (!rel && d.name === 'snapshots') continue
    if (d.name.includes('.tmp.') || d.name === '.lock') continue
    if (d.isDirectory()) out.push(...stateFiles(S, r))
    else if (d.isFile()) out.push(r)
  }
  return out
}

export const SNAPSHOT_KEEP = 20

/** worklog snapshot: <state>/snapshots/<UTC stamp>.tar.gz of the whole state dir (snapshots excluded); keeps the last 20. */
export function snapshot(env = process.env) {
  requireEnabled(env)
  const S = stateDir(env)
  const dir = path.join(S, 'snapshots')
  mkdirp(dir)
  const stamp = now(env).replace(/[:.]/g, '-')
  let file = path.join(dir, `${stamp}.tar.gz`)
  for (let n = 1; fs.existsSync(file); n++) file = path.join(dir, `${stamp}-${n}.tar.gz`)
  const parts = []
  const files = stateFiles(S)
  for (const rel of files) {
    let data
    try { data = fs.readFileSync(path.join(S, ...rel.split('/'))) } catch (e) { if (e.code === 'ENOENT') continue; throw e }
    const st = fs.statSync(path.join(S, ...rel.split('/')))
    parts.push(tarHeader(`goal-compliant-task-queue/${rel}`, data.length, st.mtimeMs), data, Buffer.alloc((512 - (data.length % 512)) % 512))
  }
  parts.push(Buffer.alloc(1024))
  atomicWrite(file, zlib.gzipSync(Buffer.concat(parts)))
  const all = fs.readdirSync(dir).filter(f => f.endsWith('.tar.gz')).sort()
  const pruned = all.slice(0, Math.max(0, all.length - SNAPSHOT_KEEP))
  for (const f of pruned) { try { fs.unlinkSync(path.join(dir, f)) } catch (e) { if (e.code !== 'ENOENT') throw e } }
  return { file, files: files.length, pruned, message: `snapshot: ${file} (${files.length} files${pruned.length ? `, pruned ${pruned.length}` : ''})` }
}

/** Commands that change state: each successful call appends exactly one event; these three also take a snapshot. */
export const MUTATING = new Set(['log', 'open', 'link', 'section', 'artifact-payload', 'pull', 'asked', 'answer', 'resolve', 'archive', 'unlock', 'sync', 'snapshot'])
const SNAPSHOT_AFTER = new Set(['resolve', 'archive', 'pull'])

/** Run one command the way both front ends do: the work, then the event line, then the automatic snapshot. */
export function dispatch(cmd, { slug, args, via }, fn, env = process.env) {
  if (MUTATING.has(cmd)) requireEnabled(env)
  const r = fn()
  if (!MUTATING.has(cmd)) return r
  if (SNAPSHOT_AFTER.has(cmd)) r.snapshot = snapshot(env).file
  const detail = {}
  if (r.changed !== undefined) detail.changed = r.changed
  if (r.bead !== undefined) detail.bead = r.bead
  if (r.locked !== undefined) detail.locked = r.locked
  if (r.file !== undefined) detail.file = r.file
  if (r.page !== undefined) detail.page = r.page
  if (r.call !== undefined) detail.call = r.call
  if (r.snapshot !== undefined) detail.snapshot = r.snapshot
  if (cmd === 'snapshot') detail.file = r.file
  appendEvent(env, { cmd, slug: slug ?? null, via, args, ...detail })
  return r
}
