export type HookEvent =
  | 'pre_loop'
  | 'pre_turn'
  | 'pre_tool'
  | 'post_tool'
  | 'post_loop'
  | 'post_response'

export type HookType = 'gate' | 'enrich' | 'observe'

export type OnFailure = 'fail_open' | 'fail_closed'

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
  matcher?: string
  timeoutMs?: number
  onFailure?: OnFailure
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
  matcher: string | null
  handler_type: string
  handler_ref: string | null
  blocking: number
  timeout_ms: number
  on_failure: OnFailure
  source_plugin_id: string | null
  created_at: string
  updated_at: string
}

export interface HookExecutionRecord {
  id: string
  hook_id: string
  session_id: string | null
  decision: 'allow' | 'deny' | 'modify' | 'noop' | null
  duration_ms: number | null
  error: string | null
  executed_at: string
}
