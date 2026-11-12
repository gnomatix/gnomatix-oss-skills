// Argument parsing and output for scripts/worklog. Every command maps to one function in worklog.mjs.
import fs from 'node:fs'
import * as W from './worklog.mjs'

const USAGE = `worklog <command> [options]   (state: $GCTQ_STATE, default \${XDG_STATE_HOME:-~/.local/state}/goal-compliant-task-queue)

  log --source user|agent|session --text-file F [--session ID] [--key K]   log a prompt verbatim
  open <slug> --subject "<Jira-style subject>" --quote-file F [--task-id N] [--url U]
  link <slug> [--url U] [--task-id N]  |  link --hub --url U                  page URL / session task id
  section <slug> <n> [--title T] [--body-file F] [--context-file F] [--material "label|uri|emoji" ...] [--kind answer|note]
  artifact-payload <slug> | --hub  [--react]                               page + ArtifactData files (--react: React build of the page)
  pull <slug> [--from-dir D] | pull --hub [--from-dir D] | pull --pane  Brett's ticks / USER COMMENTs (default D: <state>/pulls/<slug>|hub)
  asked <slug>                                                              "${W.ASK}" was asked
  answer <slug> --text-file F                                               his reply, verbatim
  resolve <slug> [--repo DIR]                                               bead, only after "yes"
  archive <slug>                                                            decision/clarification work log (.md), only once resolved
  unlock <slug> | --hub                                                     the ArtifactData delete that unlocks a sent page
  sync                                                                      pane / hub data (worklog.json)
  status [--json] [--tasks 1,3,7]
  metrics [--json] [--tasks 1,3,7]
  show <slug>
  config
  snapshot                               <state>/snapshots/<UTC stamp>.tar.gz of the state dir (last 20 kept; also after pull, resolve, archive)
  log-show [--slug S] [--since T]        the event log, <state>/log/events.jsonl
  watch                                  notify this session (worklog-notify) when <state>/questions or <state>/pulls change

Every command takes --json. Exit codes: 0 done, 1 usage error, 2 refused by a rule in Brett's spec.`

const MULTI = new Set(['material'])
const BOOL = new Set(['json', 'hub', 'pane', 'help', 'react'])

export function parse(argv) {
  const pos = [], opt = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith('--')) {
      const k = a.slice(2)
      if (BOOL.has(k)) { opt[k] = true; continue }
      if (i + 1 >= argv.length) throw new W.UsageError(`--${k} needs a value`)
      const v = argv[++i]
      if (MULTI.has(k)) (opt[k] ||= []).push(v)
      else opt[k] = v
    } else pos.push(a)
  }
  return { pos, opt }
}

function readText(f, name) {
  if (f === undefined) return undefined
  try { return fs.readFileSync(f === '-' ? 0 : f, 'utf8') } catch (e) {
    throw new W.UsageError(`cannot read --${name} ${f}: ${e.code || e.message}`)
  }
}

const tasksOpt = o => (o.tasks === undefined ? undefined : String(o.tasks).split(',').map(s => s.trim()).filter(Boolean))
const need = (v, what) => { if (v === undefined) throw new W.UsageError(`${what} is required`); return v }

export function run(argv, env = process.env) {
  const { pos, opt } = parse(argv)
  const [cmd, ...rest] = pos
  if (!cmd || opt.help || cmd === 'help') return { message: USAGE }
  // Every state change appends one line to <state>/log/events.jsonl with the exact arguments (A64).
  const slug = opt.hub ? 'hub' : (cmd === 'log' ? null : rest[0] ?? null)
  return W.dispatch(cmd, { slug, args: argv.filter(a => a !== '--json'), via: 'cli' }, () => exec(cmd, rest, opt, env), env)
}

function exec(cmd, rest, opt, env) {
  switch (cmd) {
    case 'log': return W.log({ source: opt.source, text: readText(need(opt['text-file'], '--text-file'), 'text-file'), session: opt.session, key: opt.key }, env)
    case 'open': return W.open({ slug: need(rest[0], '<slug>'), subject: opt.subject, quote: readText(need(opt['quote-file'], '--quote-file'), 'quote-file'), taskId: opt['task-id'], url: opt.url }, env)
    case 'link': return W.link({ slug: opt.hub ? undefined : need(rest[0], '<slug>'), url: opt.url, taskId: opt['task-id'], hub: opt.hub }, env)
    case 'section': return W.section({
      slug: need(rest[0], '<slug>'), n: need(rest[1], '<n>'), title: opt.title,
      body: readText(opt['body-file'], 'body-file'), context: readText(opt['context-file'], 'context-file'),
      materials: opt.material, kind: opt.kind,
    }, env)
    case 'artifact-payload': return opt.hub ? W.hubPayload({ template: opt.template, react: opt.react }, env) : W.artifactPayload({ slug: need(rest[0], '<slug> or --hub'), template: opt.template, react: opt.react }, env)
    case 'pull': return W.pull({ slug: opt.hub || opt.pane ? undefined : need(rest[0], '<slug>'), fromDir: opt['from-dir'], hub: opt.hub, pane: opt.pane }, env)
    case 'asked': return W.asked({ slug: need(rest[0], '<slug>') }, env)
    case 'answer': return W.answer({ slug: need(rest[0], '<slug>'), text: readText(need(opt['text-file'], '--text-file'), 'text-file') }, env)
    case 'resolve': return W.resolve({ slug: need(rest[0], '<slug>'), repo: opt.repo }, env)
    case 'archive': return W.archive({ slug: need(rest[0], '<slug>') }, env)
    case 'unlock': return W.unlock({ slug: opt.hub ? undefined : need(rest[0], '<slug> or --hub'), hub: opt.hub }, env)
    case 'sync': return W.sync(env)
    case 'snapshot': return W.snapshot(env)
    case 'log-show': return W.logShow({ slug: opt.slug, since: opt.since }, env)
    case 'status': return W.status({ tasks: tasksOpt(opt) }, env)
    case 'metrics': return W.metrics({ tasks: tasksOpt(opt) }, env)
    case 'show': return W.show({ slug: need(rest[0], '<slug>') }, env)
    case 'config': return W.config(env)
    default: throw new W.UsageError(`unknown command: ${cmd}\n\n${USAGE}`)
  }
}

export async function main(argv, env = process.env, out = process.stdout, err = process.stderr) {
  const json = argv.includes('--json')
  try {
    if (argv[0] === 'watch') {
      const { watch } = await import('./watch.mjs')
      const w = watch({ env, log: m => err.write(m + '\n') })
      out.write(`watching ${w.dirs.join(', ')}\n`)
      return new Promise(() => {}) // runs until stopped (PM2)
    }
    const r = run(argv, env)
    for (const w of r.warnings || []) err.write(`warning: ${w}\n`)
    out.write(json ? JSON.stringify({ ok: true, ...r }, null, 2) + '\n' : `${r.message}\n`)
    return 0
  } catch (e) {
    if (e instanceof W.Refusal || e instanceof W.UsageError) {
      if (json) out.write(JSON.stringify({ ok: false, refused: e instanceof W.Refusal, error: e.message }, null, 2) + '\n')
      err.write(`worklog: ${e instanceof W.Refusal ? 'refused: ' : ''}${e.message}\n`)
      return e.code
    }
    throw e
  }
}
