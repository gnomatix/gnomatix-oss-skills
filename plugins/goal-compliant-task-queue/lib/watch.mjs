// worklog watch (A60-A62): fs.watch over <state>/questions and <state>/pulls, no polling. Each slug's changes are
// debounced (30 s by default, GCTQ_WATCH_DEBOUNCE_MS to change it), then "worklog: <slug> changed" goes to the
// session through worklog-notify's socket protocol.
import fs from 'node:fs'
import path from 'node:path'
import { stateDir, appendEvent, requireEnabled } from './worklog.mjs'
import { notify as send } from './notify.mjs'

/** Which question a changed path belongs to: questions/<slug>.json, or pulls/<slug>/… */
export function slugOf(kind, rel) {
  if (!rel) return null
  const first = String(rel).split(/[\\/]/)[0]
  if (kind === 'questions') return first.endsWith('.json') && !first.includes('.tmp') ? first.slice(0, -5) : null
  return first || null
}

export function watch({ env = process.env, debounceMs, notify = t => send(t, env), log = () => {} } = {}) {
  requireEnabled(env)
  const S = stateDir(env)
  const wait = debounceMs ?? Number(env.GCTQ_WATCH_DEBOUNCE_MS || 30000)
  const timers = new Map()
  const watchers = []
  const fire = slug => {
    timers.delete(slug)
    try { requireEnabled(env) } catch (e) { log(e.message); return }
    const text = `worklog: ${slug} changed`
    const record = (ok, error) => { try { appendEvent(env, { cmd: 'notify', slug, via: 'watch', args: { text }, ok, ...(error ? { error } : {}) }) } catch (e) { log(`event log: ${e.code || e.message}`) } }
    Promise.resolve().then(() => notify(text)).then(() => { record(true); log(`notified: ${slug}`) }, e => { record(false, e && e.message); log(`notify failed for ${slug}: ${e && e.message}`) })
  }
  const touch = slug => {
    if (!slug) return
    clearTimeout(timers.get(slug))
    timers.set(slug, setTimeout(fire, wait, slug))
  }
  const dirs = []
  for (const kind of ['questions', 'pulls']) {
    const dir = path.join(S, kind)
    try { fs.mkdirSync(dir, { recursive: true }) } catch (e) { log(`cannot create ${dir}: ${e.code || e.message}`); continue }
    try {
      watchers.push(fs.watch(dir, { recursive: kind === 'pulls' }, (_ev, rel) => touch(slugOf(kind, rel))))
      dirs.push(dir)
    } catch (e) { log(`cannot watch ${dir}: ${e.code || e.message}`) }
  }
  return { dirs, close() { for (const w of watchers) w.close(); for (const t of timers.values()) clearTimeout(t); timers.clear() } }
}
