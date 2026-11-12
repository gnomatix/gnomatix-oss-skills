// worklog MCP server: the same operations as scripts/worklog, over stdio JSON-RPC 2.0 (one message per line).
// Node built-ins only; no network. Same state directory, same refusal rules: it calls lib/worklog.mjs.
import * as W from './worklog.mjs'

const str = (description) => ({ type: 'string', description })
const material = {
  anyOf: [
    { type: 'string', description: '"label|uri|emoji", "label|uri" or "uri"' },
    { type: 'object', properties: { label: { type: 'string' }, uri: { type: 'string' }, emoji: { type: 'string' } }, required: ['uri'] },
  ],
}
const tasks = { type: 'array', items: { type: ['string', 'number'] }, description: 'Session task ids, to find tasks without a document' }

export const TOOLS = [
  { name: 'worklog_log', description: 'Log a prompt verbatim (A22, A25, A27). Returns its id P-YYYYMMDD-NNN-<sess4>.',
    inputSchema: { type: 'object', properties: { source: { enum: ['user', 'agent', 'session'] }, text: str('the prompt, verbatim'), session: str('session id'), key: str('idempotency key') }, required: ['source', 'text'] },
    run: a => W.log({ source: a.source, text: a.text, session: a.session, key: a.key }) },
  { name: 'worklog_open', description: "Open a question and its working document (A1, A5, A8-A11, A14). Refuses a second open of the same slug.",
    inputSchema: { type: 'object', properties: { slug: str('short id'), subject: str('descriptive Jira-style subject (A5)'), quote: str("Brett's question, verbatim"), task_id: { type: ['string', 'number'] }, url: str('published page URL') }, required: ['slug', 'subject', 'quote'] },
    run: a => W.open({ slug: a.slug, subject: a.subject, quote: a.quote, taskId: a.task_id, url: a.url }) },
  { name: 'worklog_link', description: 'Record the published page URL and/or session task id of a question, or with hub=true the hub page URL.',
    inputSchema: { type: 'object', properties: { slug: str('question slug'), url: str('page URL'), task_id: { type: ['string', 'number'] }, hub: { type: 'boolean' } } },
    run: a => W.link({ slug: a.slug, url: a.url, taskId: a.task_id, hub: a.hub }) },
  { name: 'worklog_section', description: 'Write section n of a working document (A9, A15, A16). Section 1 is the verbatim question; section 2 is the answer.',
    inputSchema: { type: 'object', properties: { slug: str('question slug'), n: { type: 'integer', minimum: 1 }, title: str('section title'), body: str('section body (markdown)'), context: str('FULL CONTEXT'), materials: { type: 'array', items: material }, kind: { enum: ['answer', 'note'] } }, required: ['slug', 'n'] },
    run: a => W.section({ slug: a.slug, n: a.n, title: a.title, body: a.body, context: a.context, materials: a.materials, kind: a.kind }) },
  { name: 'worklog_artifact_payload', description: 'Write the page HTML, capabilities and ArtifactData files for a question (slug) or the hub (hub=true). Returns their paths.',
    inputSchema: { type: 'object', properties: { slug: str('question slug'), hub: { type: 'boolean' }, react: { type: 'boolean', description: 'use the React build of the page (templates/working-document.react.html)' } } },
    run: a => (a.hub ? W.hubPayload({ react: a.react }) : W.artifactPayload({ slug: a.slug, react: a.react })) },
  { name: 'worklog_unlock', description: 'The ArtifactData delete call (collection review, doc _lock) that unlocks a page after Brett pressed "Send my updates to Claude" and the agent reviewed it (A58).',
    inputSchema: { type: 'object', properties: { slug: str('question slug'), hub: { type: 'boolean' } } },
    run: a => W.unlock({ slug: a.slug, hub: a.hub }) },
  { name: 'worklog_archive', description: 'Write the decision/clarification work log <state>/archive/<yyyy-mm-dd>-<slug>.md for a resolved question (A59); refused before resolve.',
    inputSchema: { type: 'object', properties: { slug: str('question slug') }, required: ['slug'] },
    run: a => W.archive({ slug: a.slug }) },
  { name: 'worklog_snapshot', description: 'Write <state>/snapshots/<UTC stamp>.tar.gz of the whole state dir; the last 20 are kept (A64). pull, resolve and archive take one automatically.',
    inputSchema: { type: 'object', properties: {} },
    run: () => W.snapshot() },
  { name: 'worklog_log_show', description: 'Read the event log <state>/log/events.jsonl, optionally for one slug and/or since an ISO time (A64).',
    inputSchema: { type: 'object', properties: { slug: str('question slug'), since: str('ISO time') } },
    run: a => W.logShow({ slug: a.slug, since: a.since }) },
  { name: 'worklog_pull', description: "Merge Brett's ticks and USER COMMENTs from an ArtifactData list out_dir into local state, verbatim (A11).",
    inputSchema: { type: 'object', properties: { slug: str('question slug'), from_dir: str('the out_dir of the ArtifactData list of collection review'), hub: { type: 'boolean' }, pane: { type: 'boolean', description: 'merge the ticks Brett made in the Claude Code pane' } } },
    run: a => W.pull({ slug: a.slug, fromDir: a.from_dir, hub: a.hub, pane: a.pane }) },
  { name: 'worklog_asked', description: `Record that "${W.ASK}" was asked (A2). Refused until the answer section is written.`,
    inputSchema: { type: 'object', properties: { slug: str('question slug') }, required: ['slug'] },
    run: a => W.asked({ slug: a.slug }) },
  { name: 'worklog_answer', description: 'Record his reply verbatim (A2, A3). Only an exact "yes" (trimmed, any case) after an ask marks it answered.',
    inputSchema: { type: 'object', properties: { slug: str('question slug'), text: str('his reply, verbatim') }, required: ['slug', 'text'] },
    run: a => W.answer({ slug: a.slug, text: a.text }) },
  { name: 'worklog_resolve', description: 'Create the bead for an answered question and mark it resolved (A2, A7, A13). Refused unless Brett said "yes".',
    inputSchema: { type: 'object', properties: { slug: str('question slug'), repo: str('directory whose beads to use') }, required: ['slug'] },
    run: a => W.resolve({ slug: a.slug, repo: a.repo }) },
  { name: 'worklog_sync', description: 'Rebuild worklog.json, the data the pane and the hub show (A17, A18).',
    inputSchema: { type: 'object', properties: {} }, run: () => W.sync() },
  { name: 'worklog_status', description: 'Open questions oldest first, the active one, answers ready but not asked, orphans, records made before "yes" (A4, A6, A7, A13).',
    inputSchema: { type: 'object', properties: { tasks } }, run: a => W.status({ tasks: a.tasks }) },
  { name: 'worklog_metrics', description: 'Counts for A28/A29: opened, time to first ask, first-ask yes vs rework, orphans, records before yes.',
    inputSchema: { type: 'object', properties: { tasks } }, run: a => W.metrics({ tasks: a.tasks }) },
  { name: 'worklog_show', description: 'The full record of one question.',
    inputSchema: { type: 'object', properties: { slug: str('question slug') }, required: ['slug'] }, run: a => W.show({ slug: a.slug }) },
]

export function handle(msg) {
  const { id, method, params } = msg
  const reply = result => ({ jsonrpc: '2.0', id, result })
  if (method === 'initialize') {
    return reply({ protocolVersion: params?.protocolVersion || '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'goal-compliant-task-queue', version: '0.1.0' } })
  }
  if (method === 'ping') return reply({})
  if (method === 'tools/list') return reply({ tools: TOOLS.map(({ run, ...t }) => t) })
  if (method === 'tools/call') {
    const tool = TOOLS.find(t => t.name === params?.name)
    if (!tool) return { jsonrpc: '2.0', id, error: { code: -32602, message: `unknown tool ${params?.name}` } }
    try {
      const a = params.arguments || {}
      const cmd = tool.name.replace(/^worklog_/, '').replace(/_/g, '-')
      const r = W.dispatch(cmd, { slug: a.hub ? 'hub' : a.slug ?? null, args: a, via: 'mcp' }, () => tool.run(a))
      const { message, ...rest } = r
      return reply({ content: [{ type: 'text', text: message + ((r.warnings || []).length ? `\nwarning: ${r.warnings.join('\nwarning: ')}` : '') }], structuredContent: JSON.parse(JSON.stringify(rest)), isError: false })
    } catch (e) {
      if (e instanceof W.Refusal || e instanceof W.UsageError) return reply({ content: [{ type: 'text', text: `${e instanceof W.Refusal ? 'refused: ' : ''}${e.message}` }], isError: true })
      return reply({ content: [{ type: 'text', text: `error: ${e.message}` }], isError: true })
    }
  }
  if (id === undefined) return null // a notification, e.g. notifications/initialized
  return { jsonrpc: '2.0', id, error: { code: -32601, message: `method not found: ${method}` } }
}

// Split on "\n" only: readline would also break a message at U+2028 inside his text.
const LS = new RegExp(String.fromCharCode(0x2028), 'g'), PS = new RegExp(String.fromCharCode(0x2029), 'g')
const send = obj => process.stdout.write(JSON.stringify(obj).replace(LS, '\\u' + '2028').replace(PS, '\\u' + '2029') + '\n')
function onLine(line) {
  if (!line.trim()) return
  let msg
  try { msg = JSON.parse(line) } catch { send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'parse error' } }); return }
  const out = handle(msg)
  if (out) send(out)
}
let buf = ''
process.stdin.setEncoding('utf8')
process.stdin.on('data', chunk => {
  buf += chunk
  let n
  while ((n = buf.indexOf('\n')) >= 0) { const line = buf.slice(0, n).replace(/\r$/, ''); buf = buf.slice(n + 1); onLine(line) }
})
process.stdin.on('end', () => { if (buf) onLine(buf) })
