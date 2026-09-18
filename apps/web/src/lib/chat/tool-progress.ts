import type { AIStreamProgressEvent } from '@/lib/api/ai'

// progress 事件以 invocation id 彙整：同一 tool 並行呼叫時各自獨立。
// 保留首次出現順序，取最新狀態；done 事件不帶 input 時保留舊值。
export function mergeToolProgress(events: AIStreamProgressEvent[]): AIStreamProgressEvent[] {
  const order: string[] = []
  const latestById = new Map<string, AIStreamProgressEvent>()
  for (const e of events) {
    if (!latestById.has(e.id)) order.push(e.id)
    const prev = latestById.get(e.id)
    latestById.set(e.id, { ...e, input: e.input ?? prev?.input })
  }
  return order.map((id) => latestById.get(id) as AIStreamProgressEvent)
}
