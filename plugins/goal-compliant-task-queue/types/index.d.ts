// Shapes of worklog.json, written by `worklog sync` (lib/worklog.mjs syncView/docView).
export type Material = { label?: string; uri: string; emoji?: string; title?: string }
export type Section = {
  id: string
  order: number
  kind?: string
  title: string
  body?: string
  context?: string
  materials?: Material[]
}
export type Review = { checked?: boolean; comment?: string; updated?: string | null }
export type Answer = { at: string; text: string; after_ask: number; yes: boolean }
export type Doc = {
  slug: string
  title: string
  url: string
  status: 'open' | 'answered' | 'resolved'
  task_id?: string | number | null
  opened_at?: string
  asked?: number
  ready_not_asked?: boolean
  answers?: Answer[]
  sections: Section[]
  review: Record<string, Review>
}
export type Log = { synced?: string | null; source?: string; hub_url?: string; active?: string | null; docs: Doc[] }
export type Tick = { checked: boolean; at: string }

declare module 'claude-code' {
  interface PluginState {
    'goal-compliant-task-queue': {
      log: Shaped<Log>
      selected: Shaped<string>
      ticks: Shaped<Record<string, Tick>>
    }
  }
}
