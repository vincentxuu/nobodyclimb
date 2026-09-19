import type { HookRecord } from './types'

export async function loadHookRecords(db: D1Database): Promise<HookRecord[]> {
  const { results } = await db
    .prepare('SELECT * FROM hooks ORDER BY event, priority')
    .all<HookRecord>()
  return results ?? []
}

export function isHookEnabled(records: HookRecord[], implementation: string): boolean {
  const record = records.find((r) => r.implementation === implementation)
  return record ? record.enabled === 1 : true
}
