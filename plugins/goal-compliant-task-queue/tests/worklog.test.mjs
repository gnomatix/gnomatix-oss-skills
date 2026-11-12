// node --test plugins/goal-compliant-task-queue/tests/
// Every test runs the real CLI (or MCP server) in a sandbox: its own HOME, XDG dirs, cwd and GCTQ_STATE,
// with bd replaced by a mock that records its argv. After each test, nothing exists outside GCTQ_STATE
// except the files the test itself made.
import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CLI = path.join(ROOT, 'scripts', 'worklog')
const MCP = path.join(ROOT, 'lib', 'mcp-server.mjs')
const ASK = 'Have I sufficiently responded to your question?'

// Brett's words as test text: profanity, both quote kinds, backticks, CRLF, trailing whitespace,
// characters that would break a page (</script>, U+2028) and non-ASCII.
const NASTY = 'How the fuck did we get to 5 open "questions" without you asking me if the first has been answered yet?\r\n' +
  "It's 'quoted' and ```fenced``` and </script><script>alert(1)</script> and \u2028 line sep — naïve 🧩  \n\n"

const roots = []
after(() => { for (const r of roots) fs.rmSync(r, { recursive: true, force: true }) })

function sandbox() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gctq-'))
  roots.push(root)
  const dirs = { home: path.join(root, 'home'), xdg: path.join(root, 'xdg'), cfg: path.join(root, 'cfg'), cwd: path.join(root, 'cwd'), state: path.join(root, 'state'), files: path.join(root, 'files') }
  for (const d of Object.values(dirs)) fs.mkdirSync(d, { recursive: true })
  const bdLog = path.join(dirs.files, 'bd-argv.json')
  const bd = path.join(dirs.files, 'mock-bd')
  fs.writeFileSync(bd, `#!${process.execPath}\n` +
    `const fs=require('fs');const f=${JSON.stringify(bdLog)};const all=fs.existsSync(f)?JSON.parse(fs.readFileSync(f,'utf8')):[];` +
    `all.push(process.argv.slice(2));fs.writeFileSync(f,JSON.stringify(all));` +
    `if(process.env.MOCK_BD_FAIL){process.stderr.write('dolt is down');process.exit(3)}` +
    `process.stdout.write('gnox-q'+all.length+'\\n')\n`)
  fs.chmodSync(bd, 0o755)
  const env = {
    PATH: process.env.PATH, HOME: dirs.home, USERPROFILE: dirs.home,
    XDG_STATE_HOME: dirs.xdg, XDG_CONFIG_HOME: dirs.cfg, GCTQ_STATE: dirs.state,
    GCTQ_BD: bd, GCTQ_ACTOR: 'claude-cli', GCTQ_SESSION: '5151eca2-a847-4f35-813f-4b485afc5bcc',
  }
  const file = (name, text) => { const p = path.join(dirs.files, name); fs.writeFileSync(p, text); return p }
  const run = (args, extra = {}) => {
    const r = spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', cwd: dirs.cwd, env: { ...env, ...extra } })
    return { code: r.status, out: r.stdout, err: r.stderr, json: () => JSON.parse(r.stdout) }
  }
  const ok = (args, extra) => { const r = run(args, extra); assert.equal(r.code, 0, `worklog ${args.join(' ')} → ${r.code}\n${r.err}`); return r }
  const q = slug => JSON.parse(fs.readFileSync(path.join(dirs.state, 'questions', `${slug}.json`), 'utf8'))
  const bdCalls = () => (fs.existsSync(bdLog) ? JSON.parse(fs.readFileSync(bdLog, 'utf8')) : null)
  const untouched = () => {
    for (const k of ['home', 'xdg', 'cfg', 'cwd']) assert.deepEqual(fs.readdirSync(dirs[k]), [], `${k} was written to`)
  }
  return { root, dirs, env, file, run, ok, q, bdCalls, untouched }
}

// open q1 with a written answer, ready to ask
function ready(t, slug = 'q1', extra = {}) {
  t.ok(['open', slug, '--subject', `Subject for ${slug}`, '--quote-file', t.file(`${slug}.txt`, NASTY), '--task-id', '1'], extra)
  t.ok(['section', slug, '2', '--body-file', t.file(`${slug}-a.txt`, 'Three were dropped.\n')], extra)
}

// The page's executable scripts must parse; the embedded data must round-trip.
function pageScripts(html) {
  const scripts = [...html.matchAll(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/g)]
  const json = scripts.filter(m => /type="application\/json"/.test(m[1] || ''))
  const code = scripts.filter(m => !/type="application\/json"/.test(m[1] || ''))
  return { data: JSON.parse(json[0][2]), code: code.map(m => m[2]), jsonCount: json.length }
}

test('log: verbatim, id P-YYYYMMDD-NNN-<sess4>, sequence, idempotency key', () => {
  const t = sandbox()
  const f = t.file('p.txt', NASTY)
  const a = t.ok(['log', '--source', 'user', '--text-file', f, '--json'], { GCTQ_NOW: '2026-11-05T23:22:00Z' }).json()
  assert.equal(a.id, 'P-20261105-001-5151')
  const b = t.ok(['log', '--source', 'agent', '--text-file', f, '--key', 'k1', '--json'], { GCTQ_NOW: '2026-11-05T23:23:00Z' }).json()
  assert.equal(b.id, 'P-20261105-002-5151')
  const c = t.ok(['log', '--source', 'agent', '--text-file', f, '--key', 'k1', '--json'], { GCTQ_NOW: '2026-11-05T23:24:00Z' }).json()
  assert.equal(c.id, b.id); assert.equal(c.duplicate, true)
  const lines = fs.readFileSync(path.join(t.dirs.state, 'prompts', '2026-11-05.jsonl'), 'utf8').trim().split('\n')
  assert.equal(lines.length, 2)
  assert.equal(JSON.parse(lines[0]).text, NASTY)
  assert.equal(t.run(['log', '--source', 'robot', '--text-file', f]).code, 1)
  t.untouched()
})

test('open: creates the question and its document; refuses a duplicate and a subject that only repeats his words', () => {
  const t = sandbox()
  const f = t.file('q.txt', NASTY)
  const r = t.ok(['open', 'q1', '--subject', 'Five questions left unasked: why', '--quote-file', f, '--task-id', '6', '--json']).json()
  assert.equal(r.question.status, 'open')
  assert.deepEqual(r.question.sections.map(s => [s.order, s.kind, s.title]), [[1, 'question', 'Question'], [2, 'answer', 'Answer']])
  assert.equal(r.question.quote, NASTY)
  assert.equal(r.question.sections[0].body, NASTY)
  const before = fs.readFileSync(path.join(t.dirs.state, 'questions', 'q1.json'))
  const dup = t.run(['open', 'q1', '--subject', 'Another', '--quote-file', f])
  assert.equal(dup.code, 2); assert.match(dup.err, /already open/)
  assert.deepEqual(fs.readFileSync(path.join(t.dirs.state, 'questions', 'q1.json')), before)
  const same = t.run(['open', 'q2', '--subject', NASTY.trim(), '--quote-file', f])
  assert.equal(same.code, 2); assert.match(same.err, /A5/)
  assert.equal(t.run(['open', 'q3', '--quote-file', f]).code, 1)
  assert.equal(t.run(['open', '../evil', '--subject', 'x', '--quote-file', f]).code, 1)
  t.untouched()
})

test('open warns when another question has an answer ready and Brett was not asked (A6)', () => {
  const t = sandbox()
  ready(t, 'q1')
  const r = t.ok(['open', 'q2', '--subject', 'Second question', '--quote-file', t.file('q2.txt', 'and this?')])
  assert.match(r.err, /"q1" has an answer ready/)
})

test('section: adds, updates idempotently, materials get emoji and hover title; section 1 body is his and fixed', () => {
  const t = sandbox()
  t.ok(['open', 'q1', '--subject', 'S', '--quote-file', t.file('q.txt', 'Q?')])
  const body = t.file('b.txt', NASTY)
  const ctx = t.file('c.txt', 'context\n')
  const args = ['section', 'q1', '3', '--title', 'Findings', '--body-file', body, '--context-file', ctx,
    '--material', 'Session log|/home/x/s.jsonl', '--material', 'Page|https://claude.ai/artifact/abc', '--material', 'Bead|bd:gnox-1|🔖']
  t.ok(args)
  const s = t.q('q1').sections.find(x => x.order === 3)
  assert.equal(s.body, NASTY)
  assert.deepEqual(s.materials, [
    { uri: '/home/x/s.jsonl', emoji: '🧾', title: 'Session log: /home/x/s.jsonl', label: 'Session log' },
    { uri: 'https://claude.ai/artifact/abc', emoji: '🧩', title: 'Page: https://claude.ai/artifact/abc', label: 'Page' },
    { uri: 'bd:gnox-1', emoji: '🔖', title: 'Bead: bd:gnox-1', label: 'Bead' },
  ])
  const before = fs.readFileSync(path.join(t.dirs.state, 'questions', 'q1.json'))
  assert.match(t.ok(args).out, /unchanged/)
  assert.deepEqual(fs.readFileSync(path.join(t.dirs.state, 'questions', 'q1.json')), before)
  assert.equal(t.run(['section', 'q1', '1', '--body-file', body]).code, 2)
  t.ok(['section', 'q1', '1', '--context-file', ctx])
  assert.equal(t.q('q1').sections[0].body, 'Q?')
  assert.equal(t.run(['section', 'q1', '9', '--title', 'no body']).code, 1)
  assert.equal(t.run(['section', 'nope', '2', '--body-file', body]).code, 2)
  t.untouched()
})

test('artifact-payload: page with content embedded and a script that parses, items, batch, capabilities', () => {
  const t = sandbox()
  ready(t)
  t.ok(['link', 'q1', '--url', 'https://claude.ai/artifact/q1page'])
  const r = t.ok(['artifact-payload', 'q1', '--json']).json()
  const html = fs.readFileSync(r.page, 'utf8')
  const { data, code, jsonCount } = pageScripts(html)
  assert.equal(jsonCount, 1)
  for (const c of code) assert.doesNotThrow(() => new Function(c), 'page script must parse')
  assert.equal(data.mode, 'doc')
  assert.equal(data.doc.sections[0].body, NASTY, 'embedded content is verbatim')
  assert.ok(!html.includes('</script><script>alert(1)'), 'his text cannot close the data script')
  const batch = JSON.parse(fs.readFileSync(r.batch, 'utf8'))
  assert.deepEqual(batch.writes.map(w => [w.op, w.collection, w.doc_id]), [['set', 'items', 's1'], ['set', 'items', 's2']])
  for (const w of batch.writes) assert.equal(JSON.parse(fs.readFileSync(w.file_path, 'utf8')).order, Number(w.doc_id.slice(1)))
  const caps = JSON.parse(fs.readFileSync(r.capabilities, 'utf8'))
  assert.deepEqual(caps.db.rules.find(x => x.path === 'review'), { path: 'review', read: 'view', write: 'owner' })
  assert.ok(caps.user && caps.comments)
  for (const f of [r.page, r.batch, r.capabilities]) assert.ok(f.startsWith(t.dirs.state))
  t.untouched()
})

test('the template itself parses, and every generated page (doc and hub) parses', () => {
  const tpl = fs.readFileSync(path.join(ROOT, 'templates', 'working-document.html'), 'utf8')
  for (const c of pageScripts(tpl).code) new Function(c)
  const t = sandbox()
  ready(t, 'q1'); ready(t, 'q2')
  for (const slug of ['q1', 'q2']) {
    const r = t.ok(['artifact-payload', slug, '--json']).json()
    for (const c of pageScripts(fs.readFileSync(r.page, 'utf8')).code) new Function(c)
  }
  const h = t.ok(['artifact-payload', '--hub', '--json']).json()
  for (const c of pageScripts(fs.readFileSync(h.page, 'utf8')).code) new Function(c)
})

test('--react: the React template parses; generated doc and hub pages embed the data verbatim and parse', () => {
  const tpl = fs.readFileSync(path.join(ROOT, 'templates', 'working-document.react.html'), 'utf8')
  assert.ok(tpl.includes('<script type="application/json" id="gctq-data">'), 'same data placeholder as the HTML template')
  assert.match(tpl, /<title>[^<]*<\/title>/)
  const p = pageScripts(tpl)
  assert.equal(p.jsonCount, 1)
  assert.equal(p.data.mode, 'doc')
  assert.ok(p.code.length >= 1)
  for (const c of p.code) assert.doesNotThrow(() => new Function(c), 'react template script must parse')
  const t = sandbox()
  ready(t, 'q1'); ready(t, 'q2')
  t.ok(['link', '--hub', '--url', 'https://claude.ai/artifact/hub'])
  for (const slug of ['q1', 'q2']) {
    const r = t.ok(['artifact-payload', slug, '--react', '--json']).json()
    const html = fs.readFileSync(r.page, 'utf8')
    const { data, code, jsonCount } = pageScripts(html)
    assert.equal(jsonCount, 1)
    for (const c of code) assert.doesNotThrow(() => new Function(c), 'generated react page script must parse')
    assert.equal(data.mode, 'doc')
    assert.equal(data.doc.slug, slug)
    assert.equal(data.doc.sections[0].body, NASTY, 'embedded content is verbatim')
    assert.equal(data.hub_url, 'https://claude.ai/artifact/hub')
    assert.ok(!html.includes('</script><script>alert(1)'), 'his text cannot close the data script')
    assert.ok(html.includes(`<title>Subject for ${slug}</title>`))
    assert.ok(html.length > tpl.length - 1000 && html.includes(code[0].slice(0, 200)), 'the React bundle is in the page')
    assert.deepEqual(JSON.parse(fs.readFileSync(r.capabilities, 'utf8')).db.rules.find(x => x.path === 'review'), { path: 'review', read: 'view', write: 'owner' })
  }
  const h = t.ok(['artifact-payload', '--hub', '--react', '--json']).json()
  const hp = pageScripts(fs.readFileSync(h.page, 'utf8'))
  for (const c of hp.code) assert.doesNotThrow(() => new Function(c))
  assert.equal(hp.data.mode, 'hub')
  assert.deepEqual(hp.data.docs.map(d => d.slug), ['q1', 'q2'])
  assert.equal(hp.data.docs[0].sections[0].body, NASTY)
  // The default stays the dependency-free HTML template.
  const d = t.ok(['artifact-payload', 'q1', '--json']).json()
  assert.ok(!fs.readFileSync(d.page, 'utf8').includes('gctq-react'), 'without --react the HTML template is used')
  for (const f of [h.page, d.page]) assert.ok(f.startsWith(t.dirs.state))
  t.untouched()
})

test('hub and pane render the same data from one sync (A17, A31)', () => {
  const t = sandbox()
  ready(t, 'q1'); ready(t, 'q2')
  t.ok(['link', '--hub', '--url', 'https://claude.ai/artifact/hub'])
  const h = t.ok(['artifact-payload', '--hub', '--json']).json()
  const pane = JSON.parse(fs.readFileSync(path.join(t.dirs.state, 'worklog.json'), 'utf8'))
  const { data } = pageScripts(fs.readFileSync(h.page, 'utf8'))
  assert.equal(data.mode, 'hub')
  const { mode, ...hubView } = data
  assert.deepEqual(hubView, pane)
  assert.equal(pane.hub_url, 'https://claude.ai/artifact/hub')
  assert.deepEqual(pane.docs.map(d => d.slug), ['q1', 'q2'])
  assert.equal(pane.active, 'q1')
})

test('pull: merges his ticks and comments verbatim, both dump shapes, idempotent; hub dump keyed slug~sid', () => {
  const t = sandbox()
  ready(t)
  const dump = path.join(t.dirs.files, 'dump')
  fs.mkdirSync(path.join(dump, 'review'), { recursive: true })
  fs.mkdirSync(path.join(dump, 'items'), { recursive: true })
  fs.writeFileSync(path.join(dump, 'review', 's1.json'), JSON.stringify({ id: 's1', version: 3, data: { checked: true, comment: NASTY, updated: '2026-11-05T23:40:00Z' } }))
  fs.writeFileSync(path.join(dump, 'review', 's2.json'), JSON.stringify({ checked: false, comment: 'No, wrong file.', updated: '2026-11-05T23:41:00Z' }))
  fs.writeFileSync(path.join(dump, 'items', 's1.json'), JSON.stringify({ data: { body: 'tampered' } }))
  const r = t.ok(['pull', 'q1', '--from-dir', dump, '--json']).json()
  assert.deepEqual(r.changed, ['q1/s1', 'q1/s2'])
  const q = t.q('q1')
  assert.equal(q.review.s1.comment, NASTY)
  assert.equal(q.review.s1.checked, true)
  assert.equal(q.review.s2.comment, 'No, wrong file.')
  assert.equal(q.sections[0].body, NASTY, 'items/ in the dump are ignored')
  const before = fs.readFileSync(path.join(t.dirs.state, 'questions', 'q1.json'))
  assert.deepEqual(t.ok(['pull', 'q1', '--from-dir', dump, '--json']).json().changed, [])
  assert.deepEqual(fs.readFileSync(path.join(t.dirs.state, 'questions', 'q1.json')), before)
  const hub = path.join(t.dirs.files, 'hubdump', 'review')
  fs.mkdirSync(hub, { recursive: true })
  fs.writeFileSync(path.join(hub, 'q1~s2.json'), JSON.stringify({ data: { checked: true, comment: 'OK now.', updated: '2026-11-05T23:50:00Z' } }))
  fs.writeFileSync(path.join(hub, 'q1~s1.json'), JSON.stringify({ data: { checked: false, comment: 'older', updated: '2026-11-05T23:00:00Z' } }))
  assert.deepEqual(t.ok(['pull', '--hub', '--from-dir', path.join(t.dirs.files, 'hubdump'), '--json']).json().changed, ['q1/s2'])
  assert.equal(t.q('q1').review.s2.comment, 'OK now.')
  assert.equal(t.q('q1').review.s1.comment, NASTY, 'an older row does not overwrite a newer one')
  t.untouched()
})

test('pull: a newer identical review prevents an older hub comment from replacing it', () => {
  const t = sandbox()
  ready(t)
  const dump = path.join(t.dirs.files, 'dump', 'review')
  const hub = path.join(t.dirs.files, 'hubdump', 'review')
  fs.mkdirSync(dump, { recursive: true })
  fs.mkdirSync(hub, { recursive: true })
  for (const hour of ['10', '12']) {
    fs.writeFileSync(path.join(dump, 's2.json'), JSON.stringify({ checked: true, comment: NASTY, updated: `2026-11-06T${hour}:00:00Z` }))
    t.ok(['pull', 'q1', '--from-dir', path.dirname(dump)])
  }
  assert.equal(t.q('q1').review.s2.updated, '2026-11-06T12:00:00Z')
  fs.writeFileSync(path.join(hub, 'q1~s2.json'), JSON.stringify({ checked: false, comment: 'stale', updated: '2026-11-06T11:00:00Z' }))
  assert.deepEqual(t.ok(['pull', '--hub', '--from-dir', path.dirname(hub), '--json']).json().changed, [])
  assert.equal(t.q('q1').review.s2.comment, NASTY)
  assert.equal(t.q('q1').review.s2.checked, true)
})

test('asked / answer: ask only with an answer written; only an exact "yes" after an ask marks it answered', () => {
  const t = sandbox()
  t.ok(['open', 'q1', '--subject', 'S', '--quote-file', t.file('q.txt', 'Q?')])
  const early = t.run(['asked', 'q1'])
  assert.equal(early.code, 2); assert.match(early.err, /no answer written/)
  const yes = t.file('yes.txt', '  YES \n')
  assert.match(t.ok(['answer', 'q1', '--text-file', yes]).err, /never asked/)
  assert.equal(t.q('q1').status, 'open')
  t.ok(['section', 'q1', '2', '--body-file', t.file('a.txt', 'Answer.')])
  t.ok(['asked', 'q1'])
  const notyet = t.file('n.txt', 'yes, but also check the other log')
  t.ok(['answer', 'q1', '--text-file', notyet])
  assert.equal(t.q('q1').status, 'open', 'anything except "yes" keeps it open (A2, A3)')
  t.ok(['asked', 'q1'])
  t.ok(['answer', 'q1', '--text-file', yes])
  const q = t.q('q1')
  assert.equal(q.status, 'answered')
  assert.deepEqual(q.answers.map(a => a.text), ['  YES \n', 'yes, but also check the other log', '  YES \n'])
  assert.equal(t.run(['asked', 'q1']).code, 2)
  t.ok(['answer', 'q1', '--text-file', t.file('re.txt', 'Actually no.')])
  assert.equal(t.q('q1').status, 'open', 'a later non-yes reopens it')
  t.untouched()
})

test('resolve: refused before "yes" and bd never runs; after "yes" one bead, in progress, with --actor; idempotent', () => {
  const t = sandbox()
  ready(t)
  const r1 = t.run(['resolve', 'q1'])
  assert.equal(r1.code, 2); assert.match(r1.err, /only after Brett answers "yes"/)
  t.ok(['asked', 'q1'])
  assert.equal(t.run(['resolve', 'q1']).code, 2)
  t.ok(['answer', 'q1', '--text-file', t.file('no.txt', 'no')])
  assert.equal(t.run(['resolve', 'q1']).code, 2)
  assert.equal(t.bdCalls(), null, 'bd was never invoked before "yes"')
  t.ok(['asked', 'q1'])
  t.ok(['answer', 'q1', '--text-file', t.file('y.txt', 'yes')])
  const r = t.ok(['resolve', 'q1', '--json']).json()
  assert.equal(r.bead, 'gnox-q1')
  const calls = t.bdCalls()
  assert.equal(calls.length, 1)
  const argv = calls[0]
  const flag = k => argv[argv.indexOf(k) + 1]
  assert.equal(argv[0], 'create')
  assert.equal(flag('--actor'), 'claude-cli')
  assert.equal(flag('--title'), 'Subject for q1')
  assert.equal(flag('--status'), 'in_progress')
  const bodyFile = flag('--body-file')
  assert.ok(bodyFile.startsWith(t.dirs.state))
  const body = fs.readFileSync(bodyFile, 'utf8')
  assert.ok(body.includes('Three were dropped.'))
  assert.ok(body.includes(ASK))
  for (const line of NASTY.split(/\r?\n/)) assert.ok(body.includes(line), `bead body keeps his words: ${JSON.stringify(line)}`)
  const q = t.q('q1')
  assert.equal(q.status, 'resolved')
  assert.ok(q.records[0].at >= q.answered_at)
  assert.match(t.ok(['resolve', 'q1']).out, /already resolved/)
  assert.equal(t.bdCalls().length, 1, 'a second resolve does not create a second bead')
  assert.equal(t.run(['section', 'q1', '2', '--body-file', t.file('z.txt', 'more')]).code, 2)
  t.untouched()
})

test('resolve: a failing bd leaves the question answered with no record', () => {
  const t = sandbox()
  ready(t)
  t.ok(['asked', 'q1']); t.ok(['answer', 'q1', '--text-file', t.file('y.txt', 'yes')])
  const r = t.run(['resolve', 'q1'], { MOCK_BD_FAIL: '1' })
  assert.equal(r.code, 2); assert.match(r.err, /dolt is down/)
  const q = t.q('q1')
  assert.equal(q.status, 'answered'); assert.deepEqual(q.records, [])
  t.ok(['resolve', 'q1'])
  assert.equal(t.q('q1').status, 'resolved')
})

test('sync: pane data from local state, byte-identical on re-run, resolved questions dropped', () => {
  const t = sandbox()
  ready(t, 'q1'); ready(t, 'q2')
  const f = path.join(t.dirs.state, 'worklog.json')
  t.ok(['sync'])
  const a = fs.readFileSync(f)
  assert.match(t.ok(['sync']).out, /unchanged/)
  assert.deepEqual(fs.readFileSync(f), a)
  const log = JSON.parse(a)
  assert.deepEqual(log.docs.map(d => [d.slug, d.status, d.ready_not_asked]), [['q1', 'open', true], ['q2', 'open', true]])
  assert.equal(log.docs[0].sections[0].body, NASTY)
  t.ok(['asked', 'q1']); t.ok(['answer', 'q1', '--text-file', t.file('y.txt', 'yes')]); t.ok(['resolve', 'q1'])
  t.ok(['sync'])
  assert.deepEqual(JSON.parse(fs.readFileSync(f, 'utf8')).docs.map(d => d.slug), ['q2'])
  t.untouched()
})

test('status: oldest first, active, answers ready but not asked, orphans, records before yes', () => {
  const t = sandbox()
  ready(t, 'q1', { GCTQ_NOW: '2026-11-05T21:00:00Z' })
  t.ok(['open', 'q2', '--subject', 'S2', '--quote-file', t.file('q2.txt', 'Q2?'), '--url', 'https://claude.ai/artifact/q2'], { GCTQ_NOW: '2026-11-05T22:00:00Z' })
  const s = t.ok(['status', '--json', '--tasks', '1,7']).json()
  assert.deepEqual(s.open.map(q => q.slug), ['q1', 'q2'])
  assert.equal(s.active, 'q1')
  assert.deepEqual(s.ready_not_asked, ['q1'])
  assert.deepEqual(s.orphans, { without_task: ['q2'], without_page: ['q1'], tasks_without_document: ['7'] })
  assert.deepEqual(s.records_before_yes, [])
  assert.match(t.ok(['status']).out, /Answer ready, Brett not asked/)
  t.untouched()
})

test('metrics: opened, time to first ask, first-ask yes vs rework, orphans, records before yes', () => {
  const t = sandbox()
  ready(t, 'q1', { GCTQ_NOW: '2026-11-05T21:00:00Z' })
  ready(t, 'q2', { GCTQ_NOW: '2026-11-05T21:00:00Z' })
  t.ok(['asked', 'q1'], { GCTQ_NOW: '2026-11-05T21:10:00Z' })
  t.ok(['answer', 'q1', '--text-file', t.file('y.txt', 'yes')], { GCTQ_NOW: '2026-11-05T21:11:00Z' })
  t.ok(['asked', 'q2'], { GCTQ_NOW: '2026-11-05T21:30:00Z' })
  t.ok(['answer', 'q2', '--text-file', t.file('n.txt', 'no, redo it')], { GCTQ_NOW: '2026-11-05T21:31:00Z' })
  t.ok(['log', '--source', 'user', '--text-file', t.file('p.txt', 'hi')])
  const m = t.ok(['metrics', '--json']).json()
  assert.equal(m.opened, 2); assert.equal(m.answered, 1); assert.equal(m.open, 1)
  assert.deepEqual(m.time_open_to_first_ask_minutes.per_question, [{ slug: 'q1', minutes: 10 }, { slug: 'q2', minutes: 30 }])
  assert.equal(m.first_ask_yes, 1); assert.equal(m.first_ask_rework, 1)
  assert.equal(m.records_before_yes, 0)
  assert.equal(m.prompts_logged.user, 1)
  t.untouched()
})

test('config: "enabled": false or an invalid config stops every write; reads still work; config is never written', () => {
  const t = sandbox()
  const cfgDir = path.join(t.dirs.cfg, 'goal-compliant-task-queue')
  fs.mkdirSync(cfgDir, { recursive: true })
  const cfg = path.join(cfgDir, 'config.json')
  fs.writeFileSync(cfg, JSON.stringify({ enabled: false, required_skills: [], optional_skills: [], subagents: [], curator: { enabled: false, subagent: 'task-queue-curator' } }))
  const r = t.run(['open', 'q1', '--subject', 'S', '--quote-file', t.file('q.txt', 'Q?')])
  assert.equal(r.code, 2); assert.match(r.err, /disabled/)
  assert.equal(fs.existsSync(path.join(t.dirs.state, 'questions')), false)
  t.ok(['status'])
  fs.writeFileSync(cfg, JSON.stringify({ enabled: 'yes', curator: { enabled: 1 }, extra: 1 }))
  const bad = t.run(['log', '--source', 'user', '--text-file', t.file('p.txt', 'x')])
  assert.equal(bad.code, 2); assert.match(bad.err, /enabled must be true or false/); assert.match(bad.err, /unknown key: extra/)
  const c = t.ok(['config', '--json']).json()
  assert.equal(c.errors.length, 3)
  fs.writeFileSync(cfg, JSON.stringify({ enabled: true, curator: { enabled: true } }))
  t.ok(['open', 'q1', '--subject', 'S', '--quote-file', t.file('q.txt', 'Q?')])
  assert.equal(t.ok(['config', '--json']).json().config.curator.subagent, 'task-queue-curator')
  assert.deepEqual(fs.readdirSync(cfgDir), ['config.json'])
})

test('config: disabled or invalid settings block sync, snapshots, unlock events and watchers without writes', async () => {
  const W = await import(path.join(ROOT, 'lib', 'worklog.mjs'))
  const { watch } = await import(path.join(ROOT, 'lib', 'watch.mjs'))
  const t = sandbox()
  for (const config of [{ enabled: false }, { enabled: 'yes' }, '{invalid']) {
    const cfg = t.file('config.json', typeof config === 'string' ? config : JSON.stringify(config))
    const env = { ...t.env, GCTQ_CONFIG: cfg }
    for (const args of [['sync'], ['snapshot'], ['unlock', '--hub'], ['watch']]) {
      const r = t.run(args, env)
      assert.equal(r.code, 2, `${args}: ${r.err}`)
    }
    for (const fn of [() => W.sync(env), () => W.snapshot(env), () => W.appendEvent(env, { cmd: 'notify' }), () => watch({ env })]) {
      assert.throws(fn, W.Refusal)
    }
    assert.deepEqual(fs.readdirSync(t.dirs.state), [], 'disabled commands must not create state or event files')
    for (const cmd of ['status', 'metrics', 'config', 'log-show']) t.ok([cmd], env)
  }
})

test('default state dir is ${XDG_STATE_HOME}/goal-compliant-task-queue when GCTQ_STATE is unset', () => {
  const t = sandbox()
  const env = { GCTQ_STATE: '' }
  t.ok(['log', '--source', 'user', '--text-file', t.file('p.txt', 'x')], env)
  assert.deepEqual(fs.readdirSync(t.dirs.xdg), ['goal-compliant-task-queue'])
  assert.deepEqual(fs.readdirSync(t.dirs.state), [])
})

test('a full run writes nothing outside GCTQ_STATE and leaves no temp or lock files', () => {
  const t = sandbox()
  ready(t)
  t.ok(['log', '--source', 'user', '--text-file', t.file('p.txt', NASTY)])
  t.ok(['link', 'q1', '--url', 'https://claude.ai/artifact/x'])
  t.ok(['artifact-payload', 'q1']); t.ok(['artifact-payload', '--hub'])
  t.ok(['asked', 'q1']); t.ok(['answer', 'q1', '--text-file', t.file('y.txt', 'yes')]); t.ok(['resolve', 'q1'])
  t.ok(['sync']); t.ok(['status']); t.ok(['metrics']); t.ok(['show', 'q1'])
  t.untouched()
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => (e.isDirectory() ? walk(path.join(d, e.name)) : [e.name]))
  const names = walk(t.dirs.state)
  assert.ok(!names.some(n => /\.tmp\.|^\.lock$/.test(n)), names.join(' '))
})

test('MCP server: JSON-RPC stdio round trip with the same state and refusals', () => {
  const t = sandbox()
  const msgs = [
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '0' } } },
    { jsonrpc: '2.0', method: 'notifications/initialized' },
    { jsonrpc: '2.0', id: 2, method: 'tools/list' },
    { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'worklog_open', arguments: { slug: 'q1', subject: 'Via MCP', quote: NASTY, task_id: 3 } } },
    { jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'worklog_open', arguments: { slug: 'q1', subject: 'Again', quote: 'x' } } },
    { jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'worklog_resolve', arguments: { slug: 'q1' } } },
    { jsonrpc: '2.0', id: 6, method: 'tools/call', params: { name: 'worklog_section', arguments: { slug: 'q1', n: 2, body: 'Done.', materials: ['Log|/a.jsonl', { label: 'Page', uri: 'https://claude.ai/artifact/p' }] } } },
    { jsonrpc: '2.0', id: 7, method: 'tools/call', params: { name: 'worklog_asked', arguments: { slug: 'q1' } } },
    { jsonrpc: '2.0', id: 8, method: 'tools/call', params: { name: 'worklog_answer', arguments: { slug: 'q1', text: 'Yes' } } },
    { jsonrpc: '2.0', id: 9, method: 'tools/call', params: { name: 'worklog_resolve', arguments: { slug: 'q1' } } },
    { jsonrpc: '2.0', id: 10, method: 'tools/call', params: { name: 'worklog_status', arguments: {} } },
  ]
  const r = spawnSync(process.execPath, [MCP], { input: msgs.map(m => JSON.stringify(m)).join('\n') + '\n', encoding: 'utf8', cwd: t.dirs.cwd, env: t.env })
  assert.equal(r.status, 0, r.stderr)
  const out = Object.fromEntries(r.stdout.trim().split('\n').map(l => JSON.parse(l)).map(m => [m.id, m]))
  assert.equal(Object.keys(out).length, 10, 'the notification gets no reply')
  assert.equal(out[1].result.serverInfo.name, 'goal-compliant-task-queue')
  const names = out[2].result.tools.map(x => x.name)
  for (const n of ['worklog_log', 'worklog_open', 'worklog_section', 'worklog_status', 'worklog_answer', 'worklog_resolve', 'worklog_pull', 'worklog_artifact_payload', 'worklog_sync', 'worklog_metrics', 'worklog_asked', 'worklog_link']) assert.ok(names.includes(n), n)
  assert.equal(out[3].result.isError, false)
  assert.equal(out[4].result.isError, true); assert.match(out[4].result.content[0].text, /already open/)
  assert.equal(out[5].result.isError, true); assert.match(out[5].result.content[0].text, /only after Brett answers "yes"/)
  assert.equal(out[9].result.isError, false); assert.equal(out[9].result.structuredContent.bead, 'gnox-q1')
  assert.equal(t.bdCalls().length, 1)
  assert.equal(t.q('q1').quote, NASTY)
  assert.equal(out[10].result.structuredContent.open.length, 0)
  t.untouched()
})

test('pull --pane: ticks Brett made in the Claude Code pane are merged; his comments are kept', () => {
  const t = sandbox()
  ready(t)
  const dump = path.join(t.dirs.files, 'dump', 'review')
  fs.mkdirSync(dump, { recursive: true })
  fs.writeFileSync(path.join(dump, 's1.json'), JSON.stringify({ data: { checked: false, comment: NASTY, updated: '2026-11-05T23:00:00Z' } }))
  t.ok(['pull', 'q1', '--from-dir', path.join(t.dirs.files, 'dump')])
  fs.writeFileSync(path.join(t.dirs.state, 'pane-ticks.json'), JSON.stringify({ 'q1/s1': { checked: true, at: '2026-11-05T23:30:00Z' }, 'nope/s1': { checked: true, at: 'x' } }))
  assert.deepEqual(t.ok(['pull', '--pane', '--json']).json().changed, ['q1/s1'])
  const r = t.q('q1').review.s1
  assert.equal(r.checked, true); assert.equal(r.comment, NASTY)
  assert.deepEqual(t.ok(['pull', '--pane', '--json']).json().changed, [])
  t.untouched()
})

// ---------------------------------------------------------------- pages in a real browser (A58): lock, read-only, archived
// Uses headless Chromium when one is found (GCTQ_CHROME, chromium on PATH, or the Playwright cache); skipped otherwise.
function findChrome() {
  if (process.env.GCTQ_CHROME) return process.env.GCTQ_CHROME
  for (const name of ['chromium', 'chromium-browser', 'google-chrome']) {
    const r = spawnSync('which', [name], { encoding: 'utf8' })
    if (r.status === 0 && r.stdout.trim()) return r.stdout.trim()
  }
  const pw = path.join(os.homedir(), '.cache', 'ms-playwright')
  try {
    for (const d of fs.readdirSync(pw).filter(d => d.startsWith('chromium-')).sort().reverse()) {
      const p = path.join(pw, d, 'chrome-linux', 'chrome')
      if (fs.existsSync(p)) return p
    }
  } catch { /* none */ }
  return null
}
const CHROME = findChrome()

// A fake claude.ai runtime: owner, a review store (optionally already locked), comments that can send. Every call is
// recorded in <html data-log>, so the dumped DOM shows the order of writes and sends.
function mockRuntime({ locked = false, click = false, unlockAfter = 0 } = {}) {
  return `<script>(function(){
var log=[];function rec(x){log.push(x);document.documentElement.setAttribute('data-log',JSON.stringify(log))}
var store={};${locked ? "store['review/_lock']={locked:true,at:'2026-11-06T00:50:00Z'};" : ''}
var docSubs={},colSubs=[];
function snapDoc(p){var v=store[p];return {id:p.split('/').pop(),exists:!!v,data:function(){return v}}}
function emit(p){(docSubs[p]||[]).forEach(function(f){f(snapDoc(p))});colSubs.forEach(function(f){f({docs:Object.keys(store).filter(function(k){return k.indexOf('review/')===0}).map(snapDoc)})})}
var db={doc:function(p){return {set:async function(v){rec('set '+p);store[p]=v;emit(p)},delete:async function(){rec('delete '+p);delete store[p];emit(p)},
  onSnapshot:function(f){(docSubs[p]=docSubs[p]||[]).push(f);setTimeout(function(){f(snapDoc(p))},0);return function(){}}}},
  collection:function(){return {onSnapshot:function(f){colSubs.push(f);setTimeout(function(){emit('')},0);return function(){}}}}};
var comments={openComposer:async function(){return {opened:true}},anchorFor:async function(){return {}},canSendToClaude:async function(){return 'available'},
  sendToClaude:async function(t){rec('send '+t.text.slice(0,13))}};
window.claude={use:async function(n){return n==='user'?{isOwner:async function(){return true}}:n==='db'?db:n==='comments'?comments:null}};
${click ? "setTimeout(function(){var b=document.getElementById('send');rec(b?(b.disabled?'button disabled':'click'):'no button');if(b&&!b.disabled)b.click()},400);" : ''}
${unlockAfter ? `setTimeout(function(){db.doc('review/_lock').delete()},${unlockAfter});` : ''}
})()</script>`
}

function renderInChrome(t, pageFile, mock) {
  const html = fs.readFileSync(pageFile, 'utf8').replace('<script type="application/json" id="gctq-data">', m => mock + m)
  const f = path.join(t.dirs.files, `render-${path.basename(path.dirname(pageFile))}-${Math.random().toString(36).slice(2)}.html`)
  fs.writeFileSync(f, html)
  const r = spawnSync(CHROME, ['--headless=new', '--no-sandbox', '--disable-gpu', '--no-first-run', `--user-data-dir=${path.join(t.root, 'chrome')}`,
    '--virtual-time-budget=3000', '--dump-dom', 'file://' + f], { encoding: 'utf8', timeout: 60000 })
  assert.ok(r.stdout && r.stdout.includes('</html>'), `chrome rendered nothing: ${r.stderr}`)
  const dom = r.stdout
  const log = JSON.parse((dom.match(/data-log="([^"]*)"/) || [, '[]'])[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&'))
  const inputs = [...dom.matchAll(/<input[^>]*type="checkbox"[^>]*>/g)].map(m => m[0])
  const areas = [...dom.matchAll(/<textarea[^>]*>/g)].map(m => m[0])
  const send = (dom.match(/<button[^>]*id="send"[^>]*>/) || [''])[0]
  return { dom, log, inputs, areas, send }
}

// the disabled attribute itself, not a Tailwind "disabled:" class
const DIS = /\sdisabled(?:=""|(?=[\s>/]))/
const TEMPLATE_FLAGS = [['html', []], ['react', ['--react']]]

test('page lock (A58): Send writes review/_lock before sendToClaude, then the page is read-only; both templates', { skip: !CHROME && 'no headless Chromium found' }, () => {
  const t = sandbox()
  ready(t)
  for (const [name, flags] of TEMPLATE_FLAGS) {
    const r = t.ok(['artifact-payload', 'q1', ...flags, '--json']).json()
    const v = renderInChrome(t, r.page, mockRuntime({ click: true }))
    assert.deepEqual(v.log, ['click', 'set review/_lock', 'send BRETT-UPDATES'], `${name}: the lock is written before the send`)
    assert.match(v.dom, /Sent to Claude at \d{4}-\d\d-\d\d \d\d:\d\d UTC: read-only until Claude has reviewed it\./, `${name}: lock banner`)
    assert.ok(v.inputs.length >= 2 && v.inputs.every(i => DIS.test(i)), `${name}: every tick disabled`)
    assert.ok(v.areas.every(a => / readonly/.test(a)), `${name}: every comment box read-only`)
    assert.ok(!/>Save comment</.test(v.dom), `${name}: no Save comment while locked`)
    assert.match(v.send, DIS, `${name}: send disabled while locked`)
  }
})

test('page lock (A58): a page opened while review/_lock exists is read-only and unlocks live when the doc is deleted', { skip: !CHROME && 'no headless Chromium found' }, () => {
  const t = sandbox()
  ready(t)
  for (const [name, flags] of TEMPLATE_FLAGS) {
    const r = t.ok(['artifact-payload', 'q1', ...flags, '--json']).json()
    const locked = renderInChrome(t, r.page, mockRuntime({ locked: true }))
    assert.match(locked.dom, /Sent to Claude at 2026-11-06 00:50 UTC: read-only until Claude has reviewed it\./, `${name}: banner`)
    assert.ok(locked.inputs.every(i => DIS.test(i)) && locked.areas.every(a => / readonly/.test(a)), `${name}: read-only`)
    assert.match(locked.send, DIS)
    const unlocked = renderInChrome(t, r.page, mockRuntime({ locked: true, unlockAfter: 600 }))
    assert.deepEqual(unlocked.log, ['delete review/_lock'])
    assert.ok(!/id="lock-banner"/.test(unlocked.dom), `${name}: banner gone after unlock`)
    assert.ok(unlocked.inputs.every(i => !DIS.test(i)), `${name}: ticks enabled again`)
    assert.doesNotMatch(unlocked.send, DIS)
  }
})

test('archived (A58): a resolved question renders "Archived work log" and is read-only; both templates', { skip: !CHROME && 'no headless Chromium found' }, () => {
  const t = sandbox()
  ready(t)
  t.ok(['asked', 'q1']); t.ok(['answer', 'q1', '--text-file', t.file('yes.txt', 'yes')]); t.ok(['resolve', 'q1'])
  for (const [name, flags] of TEMPLATE_FLAGS) {
    const r = t.ok(['artifact-payload', 'q1', ...flags, '--json']).json()
    const v = renderInChrome(t, r.page, mockRuntime({ click: true }))
    assert.match(v.dom, /<p[^>]*role="note"[^>]*>Archived work log/, `${name}: archived banner`)
    assert.ok(v.inputs.every(i => DIS.test(i)) && v.areas.every(a => / readonly/.test(a)), `${name}: read-only`)
    assert.ok(!v.log.includes('set review/_lock'), `${name}: an archived page never locks or sends`)
  }
})

test('pull ignores review/_lock; unlock prints the ArtifactData delete; pull defaults to <state>/pulls/<slug>', () => {
  const t = sandbox()
  ready(t)
  t.ok(['link', 'q1', '--url', 'https://claude.ai/artifact/q1page'])
  const dir = path.join(t.dirs.state, 'pulls', 'q1', 'review')
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, '_lock.json'), JSON.stringify({ data: { locked: true, at: '2026-11-06T00:50:00Z' } }))
  fs.writeFileSync(path.join(dir, 's2.json'), JSON.stringify({ data: { checked: true, comment: NASTY, updated: '2026-11-06T00:49:00Z' } }))
  const r = t.ok(['pull', 'q1', '--json']).json()
  assert.deepEqual(r.changed, ['q1/s2'])
  assert.ok(!('_lock' in t.q('q1').review), '_lock is not a section review')
  assert.equal(t.q('q1').review.s2.comment, NASTY)
  const u = t.ok(['unlock', 'q1', '--json']).json()
  assert.deepEqual(u.call, { action: 'delete', url: 'https://claude.ai/artifact/q1page', collection: 'review', doc_id: '_lock' })
  assert.match(u.message, /ArtifactData/)
  t.ok(['link', '--hub', '--url', 'https://claude.ai/artifact/hub'])
  assert.equal(t.ok(['unlock', '--hub', '--json']).json().call.url, 'https://claude.ai/artifact/hub')
  const p = t.ok(['artifact-payload', 'q1', '--json']).json()
  assert.equal(p.pulls, path.join(t.dirs.state, 'pulls', 'q1'))
  assert.equal(fs.readFileSync(p.local_copy, 'utf8'), fs.readFileSync(p.page, 'utf8'))
  assert.equal(p.local_copy, path.join(t.dirs.state, 'pages', 'q1.html'))
  t.untouched()
})

test('archive (A59): refused before resolve; after it, front matter and Brett\'s words byte-exact; idempotent', () => {
  const t = sandbox()
  ready(t)
  t.ok(['link', 'q1', '--url', 'https://claude.ai/artifact/q1page'])
  const dump = path.join(t.dirs.state, 'pulls', 'q1', 'review')
  fs.mkdirSync(dump, { recursive: true })
  fs.writeFileSync(path.join(dump, 's2.json'), JSON.stringify({ data: { checked: true, comment: NASTY + '````', updated: '2026-11-06T00:49:00Z' } }))
  t.ok(['pull', 'q1'])
  assert.equal(t.run(['archive', 'q1']).code, 2, 'refused while open')
  t.ok(['asked', 'q1'], { GCTQ_NOW: '2026-11-06T01:00:00Z' })
  t.ok(['answer', 'q1', '--text-file', t.file('r1.txt', NASTY)], { GCTQ_NOW: '2026-11-06T01:01:00Z' })
  t.ok(['asked', 'q1'], { GCTQ_NOW: '2026-11-06T01:02:00Z' })
  t.ok(['answer', 'q1', '--text-file', t.file('yes.txt', ' Yes \r\n')], { GCTQ_NOW: '2026-11-06T01:03:00Z' })
  assert.equal(t.run(['archive', 'q1']).code, 2, 'refused while answered but not resolved')
  t.ok(['resolve', 'q1'], { GCTQ_NOW: '2026-11-06T01:04:00Z' })
  const r = t.ok(['archive', 'q1', '--json']).json()
  assert.equal(r.file, path.join(t.dirs.state, 'archive', '2026-11-06-q1.md'))
  const md = fs.readFileSync(r.file, 'utf8')
  const fm = md.split('\n---\n')[0]
  for (const line of ['---\nkind: decision-clarification', 'key: "q1"', 'subject: "Subject for q1"', 'status: "resolved"',
    'asked_at: ["2026-11-06T01:00:00.000Z", "2026-11-06T01:02:00.000Z"]', 'answered_at: "2026-11-06T01:03:00.000Z"', 'resolved_at: "2026-11-06T01:04:00.000Z"',
    'bead: "gnox-q1"', 'document_url: "https://claude.ai/artifact/q1page"', 'author: claude-cli', 'reporter: Brett Whitty', 'tags: [decision-clarification'])
    assert.ok(fm.includes(line), `front matter has ${line}`)
  // Every verbatim block: content is everything between the opening fence line and the newline before the closing fence.
  const blocks = [...md.matchAll(/^(`{3,})text\n([\s\S]*?)\n\1$/gm)].map(m => m[2])
  assert.equal(blocks[0], NASTY, 'question byte-exact')
  assert.ok(blocks.includes(NASTY + '````'), 'USER COMMENT byte-exact, even with a backtick run')
  assert.equal(blocks.filter(b => b === NASTY).length, 2, 'question and the first reply')
  assert.equal(blocks.at(-1), ' Yes \r\n', 'the final "yes" byte-exact')
  assert.match(md, /- Brett confirms: \[x\] \(2026-11-06T00:49:00Z\)/)
  assert.match(md, /claude-cli asked\n\n> Have I sufficiently responded to your question\?/)
  assert.equal(t.ok(['archive', 'q1', '--json']).json().changed, false)
  t.untouched()
})

test('worklog-notify: auth line with the token first, then the text, over the session socket', async () => {
  const net = await import('node:net')
  const t = sandbox()
  const sock = path.join(t.root, 'm.sock')
  const got = []
  const server = net.createServer(c => { let buf = ''; c.on('data', d => { buf += d }); c.on('end', () => { got.push(buf); c.end() }) })
  await new Promise(r => server.listen(sock, r))
  try {
    const { spawn } = await import('node:child_process')
    const p = spawn(process.execPath, [path.join(ROOT, 'scripts', 'worklog-notify'), 'worklog: q1 changed'],
      { env: { ...t.env, CLAUDE_CODE_MESSAGING_SOCKET: sock, CLAUDE_CODE_MESSAGING_TOKEN: 'tok-123' } })
    let stderr = ''
    p.stderr.on('data', d => { stderr += d })
    const code = await new Promise(res => p.on('close', res))
    assert.equal(code, 0, stderr)
    assert.deepEqual(got, ['{"type":"auth","token":"tok-123"}\nworklog: q1 changed\n'])
    const bad = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'worklog-notify'), 'x'], { encoding: 'utf8', env: t.env })
    assert.equal(bad.status, 1)
    assert.match(bad.stderr, /CLAUDE_CODE_MESSAGING_SOCKET/)
    const ev = fs.readFileSync(path.join(t.dirs.state, 'log', 'events.jsonl'), 'utf8').trim().split('\n').map(l => JSON.parse(l))
    assert.deepEqual(ev.map(e => [e.cmd, e.ok, e.args.text]), [['notify', true, 'worklog: q1 changed'], ['notify', false, 'x']])
    t.untouched()
  } finally { server.close() }
})

test('worklog watch: fs.watch on questions and pulls, one debounced notice per slug', async () => {
  const { watch, slugOf } = await import(path.join(ROOT, 'lib', 'watch.mjs'))
  assert.equal(slugOf('questions', 'q1.json'), 'q1')
  assert.equal(slugOf('questions', 'q1.json.tmp.1.2'), null)
  assert.equal(slugOf('pulls', path.join('q2', 'review', 's1.json')), 'q2')
  const t = sandbox()
  const sent = []
  const w = watch({ env: { GCTQ_STATE: t.dirs.state }, debounceMs: 300, notify: m => { sent.push(m) } })
  try {
    for (let i = 0; i < 5; i++) { fs.writeFileSync(path.join(t.dirs.state, 'questions', 'q1.json'), `{"n":${i}}`); await new Promise(r => setTimeout(r, 40)) }
    fs.mkdirSync(path.join(t.dirs.state, 'pulls', 'q2', 'review'), { recursive: true })
    await new Promise(r => setTimeout(r, 50))
    fs.writeFileSync(path.join(t.dirs.state, 'pulls', 'q2', 'review', 's1.json'), '{}')
    await new Promise(r => setTimeout(r, 150))
    assert.deepEqual(sent, [], 'nothing before the debounce runs out')
    await new Promise(r => setTimeout(r, 600))
    assert.deepEqual(sent.sort(), ['worklog: q1 changed', 'worklog: q2 changed'])
  } finally { w.close() }
})

test('event log (A64): every mutating command appends exactly one well-formed line; reads append none; log-show filters', () => {
  const t = sandbox()
  const ev = () => { try { return fs.readFileSync(path.join(t.dirs.state, 'log', 'events.jsonl'), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)) } catch { return [] } }
  const steps = [
    ['log', '--source', 'user', '--text-file', t.file('p.txt', NASTY)],
    ['open', 'q1', '--subject', 'Subject for q1', '--quote-file', t.file('q1.txt', NASTY), '--task-id', '1'],
    ['section', 'q1', '2', '--body-file', t.file('a.txt', 'Three were dropped.\n')],
    ['link', 'q1', '--url', 'https://claude.ai/artifact/q1page'],
    ['artifact-payload', 'q1'],
    ['pull', 'q1'],
    ['unlock', 'q1'],
    ['asked', 'q1'],
    ['answer', 'q1', '--text-file', t.file('y.txt', 'yes')],
    ['resolve', 'q1'],
    ['archive', 'q1'],
    ['sync'],
    ['snapshot'],
  ]
  for (const args of steps) {
    const before = ev().length
    t.ok([...args, '--json'])
    const all = ev()
    assert.equal(all.length, before + 1, `${args[0]} appends exactly one event`)
    const e = all.at(-1)
    assert.equal(e.cmd, args[0])
    assert.equal(e.actor, 'claude-cli')
    assert.equal(e.via, 'cli')
    assert.ok(!Number.isNaN(Date.parse(e.at)), 'ISO time')
    assert.deepEqual(e.args, args, 'the exact arguments')
    if (args[0] !== 'log' && args[0] !== 'sync' && args[0] !== 'snapshot') assert.equal(e.slug, 'q1')
  }
  const byCmd = Object.fromEntries(ev().map(e => [e.cmd, e]))
  assert.equal(byCmd.resolve.bead, 'gnox-q1', 'resolve records the bead id')
  assert.ok(byCmd.resolve.snapshot && byCmd.pull.snapshot && byCmd.archive.snapshot, 'pull, resolve and archive snapshot automatically')
  assert.ok(byCmd['artifact-payload'].page && byCmd.archive.file && byCmd.unlock.call)
  assert.deepEqual(byCmd.pull.changed, [])
  const lines = fs.readFileSync(path.join(t.dirs.state, 'log', 'events.jsonl'), 'utf8')
  for (const args of [['status'], ['show', 'q1'], ['metrics'], ['config'], ['log-show']]) t.ok(args)
  assert.equal(fs.readFileSync(path.join(t.dirs.state, 'log', 'events.jsonl'), 'utf8'), lines, 'reads append nothing; earlier lines never rewritten')
  assert.equal(t.run(['asked', 'q1']).code, 2)
  assert.equal(fs.readFileSync(path.join(t.dirs.state, 'log', 'events.jsonl'), 'utf8'), lines, 'a refusal changes nothing and logs nothing')
  const shown = t.ok(['log-show', '--slug', 'q1', '--json']).json().events
  assert.ok(shown.length >= 10 && shown.every(e => e.slug === 'q1'))
  assert.deepEqual(t.ok(['log-show', '--since', '2999-01-01', '--json']).json().events, [])
  t.untouched()
})

test('snapshot (A64): a tar.gz of the state dir that extracts to the same files; the last 20 are kept', () => {
  const t = sandbox()
  ready(t)
  const r = t.ok(['snapshot', '--json'], { GCTQ_NOW: '2026-11-06T01:00:00Z' }).json()
  assert.ok(r.file.startsWith(path.join(t.dirs.state, 'snapshots')) && r.file.endsWith('.tar.gz'))
  const out = path.join(t.root, 'x')
  fs.mkdirSync(out)
  const x = spawnSync('tar', ['xzf', r.file, '-C', out], { encoding: 'utf8' })
  if (x.status === 0) {
    assert.deepEqual(fs.readFileSync(path.join(out, 'goal-compliant-task-queue', 'questions', 'q1.json')), fs.readFileSync(path.join(t.dirs.state, 'questions', 'q1.json')))
    assert.ok(!fs.existsSync(path.join(out, 'goal-compliant-task-queue', 'snapshots')), 'snapshots are not nested')
  }
  for (let i = 0; i < 22; i++) t.ok(['snapshot'], { GCTQ_NOW: `2026-11-06T02:${String(i).padStart(2, '0')}:00Z` })
  const left = fs.readdirSync(path.join(t.dirs.state, 'snapshots')).sort()
  assert.equal(left.length, 20)
  assert.equal(left.at(-1), '2026-11-06T02-21-00-000Z.tar.gz')
  t.untouched()
})
