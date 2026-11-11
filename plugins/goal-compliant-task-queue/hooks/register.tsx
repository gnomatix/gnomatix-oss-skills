// The open-questions pane: a tab per open question, from worklog.json (written by `worklog sync`).
// This module registers the /worklog-pane command, reads files at session start and on that command, and renders the pane.
// It intercepts nothing: no tool-call, prompt or stop hooks.
import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Doc, Log, Material, Tick } from '../types'

const PANE = 'goal-compliant-task-queue'
const TITLE = 'Open questions'
const ASK = 'Have I sufficiently responded to your question?'

const log = atom({ plugin: 'goal-compliant-task-queue', key: 'log' } as const, { docs: [] } as Log, { shape: 'log-1' })
const selected = atom({ plugin: 'goal-compliant-task-queue', key: 'selected' } as const, '', { shape: 'selected-1' })
const ticks = atom({ plugin: 'goal-compliant-task-queue', key: 'ticks' } as const, {} as Record<string, Tick>, { shape: 'ticks-1' })

let lastMtime = 0
let dir = ''

// Same rule as lib/worklog.mjs stateDir(): $GCTQ_STATE, else ${XDG_STATE_HOME:-~/.local/state}/goal-compliant-task-queue.
async function stateDir($: any): Promise<string> {
  if (dir) return dir
  const explicit = await $.env.get('GCTQ_STATE')
  if (explicit) return (dir = explicit)
  const xdg = await $.env.get('XDG_STATE_HOME')
  const home = (await $.env.get('HOME')) ?? (await $.env.get('USERPROFILE')) ?? ''
  const sep = home.includes('\\') && !home.includes('/') ? '\\' : '/'
  const base = xdg || [home, '.local', 'state'].join(sep)
  return (dir = [base, 'goal-compliant-task-queue'].join(sep))
}

const fileIn = (d: string, name: string) => `${d}${d.includes('\\') && !d.includes('/') ? '\\' : '/'}${name}`

async function load($: any): Promise<void> {
  const d = await stateDir($)
  const LOG_FILE = fileIn(d, 'worklog.json')
  const TICK_FILE = fileIn(d, 'pane-ticks.json')
  if (!(await $.fs.exists(LOG_FILE))) return
  const { mtimeMs } = await $.fs.stat(LOG_FILE)
  if (mtimeMs !== lastMtime) {
    lastMtime = mtimeMs
    try {
      const next = JSON.parse(await $.fs.read(LOG_FILE)) as Log
      await update($, log, () => ({ ...next, docs: next.docs ?? [] }))
    } catch {
      $.ui.status('goal-compliant-task-queue: could not read worklog.json')
    }
  }
  if (await $.fs.exists(TICK_FILE)) {
    try {
      const saved = JSON.parse(await $.fs.read(TICK_FILE)) as Record<string, Tick>
      await update($, ticks, () => saved)
    } catch {}
  }
}

const link = (m: Material) => {
  const name = m.label ?? m.uri
  return `${m.emoji ?? '🔗'} ${/^https?:/.test(m.uri) ? `[${name}](${m.uri} "${m.title ?? name}")` : `${m.label ? m.label + ' ' : ''}\`${m.uri}\``}`
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'worklog-pane', description: 'Open the open-questions pane' })
    await load($)

    return next(e)
  })

  on('command.run', { command: 'worklog-pane' }, async $ => {
    await load($)
    await $.ui.open({ id: PANE, title: TITLE })

    return { text: 'Open-questions pane opened.' }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button, Markdown } = $.ui.resolve(e)
    const current = await read($, log)
    const chosen = await read($, selected)
    const marks = await read($, ticks)
    const docs: Doc[] = current.docs
    const doc = docs.find(one => one.slug === chosen) ?? docs[0]
    if (!doc) {
      return <Text dimColor>No open questions. claude-cli opens a document for each one before asking you.</Text>
    }
    const checked = (d: Doc, id: string) => d.review[id]?.checked === true || marks[`${d.slug}/${id}`]?.checked === true

    // Brett's tick in the pane; `worklog pull --pane` merges these into the record.
    const toggle = async (key: string) => {
      const was = marks[key]?.checked === true
      const all = { ...marks, [key]: { checked: !was, at: new Date().toISOString() } }
      await $.fs.write(fileIn(await stateDir($), 'pane-ticks.json'), JSON.stringify(all, null, 2))
      await update($, ticks, () => all)
    }

    const head = [
      `# ${doc.title}`,
      `**${doc.status}**${doc.ready_not_asked ? ' · ⚠️ answer ready, not asked' : ''}${doc.task_id != null ? ` · task #${doc.task_id}` : ''} · asked ${doc.asked ?? 0}×`,
      doc.url ? `🧩 [Working document: tick and comment there](${doc.url} "Open the working document for ${doc.title}")` : '_(document not published yet)_',
      current.hub_url ? `🗂️ [All open questions on claude.ai](${current.hub_url})` : '',
    ].filter(Boolean).join('\n\n')

    return (
      <Box flexDirection="column" gap={1}>
        <Box flexDirection="row" flexWrap="wrap" gap={1}>
          {docs.map((one, i) => (
            <Button key={`tab-${one.slug}`} variant={one.slug === doc.slug ? 'primary' : undefined}
              onPress={() => void update($, selected, () => one.slug)}>
              {`${i === 0 ? '▸ ' : ''}${one.title}${one.ready_not_asked ? ' ⚠️' : ''}${one.status === 'answered' ? ' ✓' : ''}`}
            </Button>
          ))}
        </Box>
        <Markdown key={`head-${doc.slug}`} text={head} />
        {doc.sections.map(s => {
          const key = `${doc.slug}/${s.id}`
          const isChecked = checked(doc, s.id)
          const comment = doc.review[s.id]?.comment ?? ''
          const mats = (s.materials ?? []).map(m => `- ${link(m)}`).join('\n')
          return (
            <Box key={`sec-${key}`} flexDirection="column">
              <Text bold>## {String(s.order)}. {s.title}</Text>
              <Button key={`tick-${key}`} onPress={() => void toggle(key)}>
                - [{isChecked ? 'x' : ' '}] Brett confirms (only Brett ticks this)
              </Button>
              <Markdown key={`body-${key}`} text={s.body || '_not written yet_'} />
              <Text bold>``` USER COMMENT</Text>
              <Markdown key={`comment-${key}`} text={comment || '_(none yet; comment in the working document)_'} />
              <Markdown key={`ctx-${key}`} text={`**# FULL CONTEXT**\n\n${s.context || '_none yet_'}`} />
              <Markdown key={`mat-${key}`} text={`**# SUPPORTING MATERIALS**\n\n${mats || '_none yet_'}`} />
            </Box>
          )
        })}
        {doc.answers?.length ? (
          <Markdown key={`replies-${doc.slug}`} text={`**Brett's replies to "${ASK}"** (verbatim)\n\n${doc.answers.map(a => `- ${a.at.slice(0, 16).replace('T', ' ')} UTC: ${a.text}`).join('\n')}`} />
        ) : null}
        <Text dimColor>synced {current.synced ?? 'never'}</Text>
      </Box>
    )
  })
}
