export type HookEvent =
  | 'pre_loop'
  | 'pre_turn'
  | 'pre_tool'
  | 'post_tool'
  | 'post_loop'
  | 'post_response'

export type HookType = 'gate' | 'enrich' | 'observe'

export interface GateResult {
  allow: boolean
  reason?: string
  replacement?: string
}

export interface EnrichResult {
  context?: string
}

export interface HookDefinition {
  id: string
  name: string
  event: HookEvent
  hookType: HookType
  priority: number
  enabled: boolean
  execute(payload: Record<string, unknown>): Promise<GateResult | EnrichResult | void>
}

export interface HookRecord {
  id: string
  name: string
  description: string | null
  event: HookEvent
  hook_type: HookType
  implementation: string
  config: string | null
  priority: number
  enabled: number
  created_at: string
  updated_at: string
}
