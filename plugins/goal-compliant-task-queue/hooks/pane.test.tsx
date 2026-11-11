import { expect, test } from 'claude-code/testing'

// Fixture: the shape `worklog sync` writes (tests/worklog.test.mjs checks the hub page embeds the same view).
const LOG = {
  synced: '2026-11-05T23:50:00.000Z',
  source: 'goal-compliant-task-queue',
  hub_url: 'https://claude.ai/artifact/hub',
  active: 'q1',
  docs: [
    { slug: 'q1', title: 'Dropped prompts: which were missed', url: 'https://claude.ai/artifact/q1', status: 'open', task_id: '1',
      asked: 0, ready_not_asked: true, answers: [], review: { s1: { checked: true, comment: 'Yes, that one.' } },
      sections: [
        { id: 's1', order: 1, kind: 'question', title: 'Question', body: 'But I asked you a question', context: '',
          materials: [{ label: 'Session log', uri: '/home/x/s.jsonl', emoji: '🧾', title: 'Session log: /home/x/s.jsonl' }] },
        { id: 's2', order: 2, kind: 'answer', title: 'Answer', body: 'Three were dropped.', context: '', materials: [] },
      ] },
    { slug: 'q3', title: 'cc-srv user: which account', url: '', status: 'answered', task_id: '3', asked: 1, ready_not_asked: false,
      answers: [{ at: '2026-11-05T23:00:00Z', text: 'yes', after_ask: 1, yes: true }], review: {},
      sections: [{ id: 's1', order: 1, kind: 'question', title: 'Question', body: 'Was it /root?', context: '', materials: [] }] },
  ],
}

const PANE = {
  plugin: 'goal-compliant-task-queue',
  component: 'Pane',
  requestId: 'goal-compliant-task-queue',
  props: {
    title: 'Open questions',
    isFocused: false,
    bodyColumns: 60,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 60 },
    view: {},
  },
} as const

function wire(on: any) {
  on('command.register', () => ({ value: { command: 'worklog-pane' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('env.get', (_: any, e: any) => ({ value: (e.name ?? e) === 'GCTQ_STATE' ? '/state' : undefined }))
  on('fs.exists', () => ({ value: true }))
  on('fs.stat', () => ({ value: { kind: 'file', size: 1, mtimeMs: 1, isLink: false } }))
  on('fs.read', (_: any, e: any) => ({ value: String(e.path ?? e).includes('pane-ticks') ? '{}' : JSON.stringify(LOG) }))
  on('clock.every', () => ({ value: () => {} }))
  on('session.start', (_: any, e: any) => ({ cwd: e.cwd }))
}

test('one tab per open question, the active one first, its sections with tick, comment, context and materials, on every surface', async ($, on) => {
  wire(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  for (const surface of ['terminal', 'desktop', 'vscode', 'mobile'] as const) {
    const ui = await $.ui.mount({ ...PANE, surface })
    expect(await ui.find({ type: 'Button', key: 'tab-q1' })).toBeTruthy()
    expect(await ui.find({ type: 'Button', key: 'tab-q3' })).toBeTruthy()
    expect((await ui.find({ type: 'Text', text: /1\. Question/ }))?.text).toBe('## 1. Question')
    expect((await ui.find({ type: 'Text', text: /2\. Answer/ }))?.text).toBe('## 2. Answer')
    expect(await ui.find({ type: 'Button', key: 'tick-q1/s1' })).toBeTruthy()
    expect(await ui.find({ type: 'Text', text: /USER COMMENT/ })).toBeTruthy()
    await ui.unmount()
  }
})

test('the pane registers /worklog-pane and opens on it', async ($, on) => {
  wire(on)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  const r = await $.command.run({ command: 'worklog-pane' })
  expect(String((r as any)?.text ?? '')).toMatch(/pane opened/)
})

test('no worklog.json shows the empty state', async ($, on) => {
  on('env.get', () => ({ value: undefined }))
  on('fs.exists', () => ({ value: false }))
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect((await ui.find({ type: 'Text' }))?.text).toMatch(/No open questions/)
  await ui.unmount()
})
