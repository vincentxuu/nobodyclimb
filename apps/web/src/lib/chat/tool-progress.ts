import type { AIStreamProgressEvent } from '@/lib/api/ai'

// progress 事件以 invocation id 彙整：同一 tool 並行呼叫時各自獨立。
// 保留首次出現順序，取最新狀態；done 事件不帶 input 時保留舊值。
export function mergeToolProgress(events: AIStreamProgressEvent[]): AIStreamProgressEvent[] {
  const order: string[] = []
  const latestById = new Map<string, AIStreamProgressEvent>()
  for (const e of events) {
    if (!latestById.has(e.id)) order.push(e.id)
    const prev = latestById.get(e.id)
    latestById.set(e.id, {
      ...e,
      input: e.input ?? prev?.input,
      output: e.output ?? prev?.output,
    })
  }
  return order.map((id) => latestById.get(id) as AIStreamProgressEvent)
}

// 單一事件併入既有列表（給 setState 用，避免每次重算整份 merge）
export function upsertToolProgress(
  list: AIStreamProgressEvent[] | undefined,
  event: AIStreamProgressEvent
): AIStreamProgressEvent[] {
  const next = [...(list ?? [])]
  const idx = next.findIndex((p) => p.id === event.id)
  if (idx >= 0) {
    next[idx] = {
      ...next[idx],
      ...event,
      input: event.input ?? next[idx].input,
      output: event.output ?? next[idx].output,
    }
  } else {
    next.push(event)
  }
  return next
}

// 從 input 取出一句摘要顯示在工具列（仿 Claude「Web search  今日新聞…」）
const SUMMARY_KEYS = [
  'query',
  'q',
  'question',
  'crag',
  'crag_name',
  'crag_id',
  'route',
  'route_name',
  'name',
  'region',
  'grade',
  'sql',
  'action',
  'topic',
]
const SUMMARY_MAX = 60

export function getToolSummary(input: unknown): string {
  if (input === undefined || input === null) return ''
  if (typeof input === 'string') return truncate(input)
  if (typeof input !== 'object' || Array.isArray(input)) return truncate(JSON.stringify(input))
  const obj = input as Record<string, unknown>
  for (const key of SUMMARY_KEYS) {
    const v = obj[key]
    if (typeof v === 'string' && v.trim()) return truncate(v)
    if (typeof v === 'number') return String(v)
  }
  const firstString = Object.values(obj).find((v) => typeof v === 'string' && v.trim())
  if (typeof firstString === 'string') return truncate(firstString)
  return ''
}

function truncate(text: string): string {
  const oneLine = text.replace(/\s+/g, ' ').trim()
  return oneLine.length > SUMMARY_MAX ? `${oneLine.slice(0, SUMMARY_MAX)}…` : oneLine
}

export function formatDuration(ms: number | undefined): string | null {
  if (ms === undefined) return null
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`
}
