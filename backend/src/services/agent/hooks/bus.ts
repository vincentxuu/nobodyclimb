import type {
  EnrichResult,
  GateResult,
  HookDefinition,
  HookEvent,
  HookExecutionRecord,
} from './types'

export class HookBus {
  private hooks: Map<HookEvent, HookDefinition[]> = new Map()
  private executionBuffer: HookExecutionRecord[] = []

  register(hook: HookDefinition): void {
    const list = this.hooks.get(hook.event) ?? []
    list.push(hook)
    list.sort((a, b) => a.priority - b.priority)
    this.hooks.set(hook.event, list)
  }

  async runGates(event: HookEvent, payload: Record<string, unknown>): Promise<GateResult> {
    const hooks = this.hooks.get(event)?.filter((h) => h.hookType === 'gate' && h.enabled) ?? []
    for (const hook of hooks) {
      if (hook.matcher && payload.toolName) {
        try {
          const re = new RegExp(hook.matcher)
          if (!re.test(payload.toolName as string)) continue
        } catch {
          continue
        }
      }

      const start = Date.now()
      const timeoutMs = hook.timeoutMs ?? 5000
      try {
        const result = (await Promise.race([
          hook.execute(payload),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('hook_timeout')), timeoutMs)
          ),
        ])) as GateResult | undefined

        const durationMs = Date.now() - start
        this.recordExecution(hook.id, result?.allow === false ? 'deny' : 'allow', durationMs, null)

        if (result && !result.allow) {
          return {
            allow: false,
            reason: `${hook.name}: ${result.reason ?? 'denied'}`,
            replacement: result.replacement,
          }
        }
        if (result?.replacement) {
          return { allow: true, replacement: result.replacement }
        }
      } catch (err) {
        const durationMs = Date.now() - start
        this.recordExecution(hook.id, null, durationMs, String(err))

        const onFailure = hook.onFailure ?? 'fail_open'
        if (onFailure === 'fail_closed') {
          return {
            allow: false,
            reason: `${hook.name}: ${err instanceof Error ? err.message : 'hook failed'} (fail_closed)`,
          }
        }
      }
    }
    return { allow: true }
  }

  async runEnrich(event: HookEvent, payload: Record<string, unknown>): Promise<string[]> {
    const hooks = this.hooks.get(event)?.filter((h) => h.hookType === 'enrich' && h.enabled) ?? []
    const results: string[] = []
    for (const hook of hooks) {
      const start = Date.now()
      const timeoutMs = hook.timeoutMs ?? 5000
      try {
        const result = (await Promise.race([
          hook.execute(payload),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('hook_timeout')), timeoutMs)
          ),
        ])) as EnrichResult | undefined
        this.recordExecution(hook.id, 'noop', Date.now() - start, null)
        if (result?.context) results.push(result.context)
      } catch (err) {
        this.recordExecution(hook.id, null, Date.now() - start, String(err))
      }
    }
    return results
  }

  async runObservers(event: HookEvent, payload: Record<string, unknown>): Promise<void> {
    const hooks = this.hooks.get(event)?.filter((h) => h.hookType === 'observe' && h.enabled) ?? []
    const starts = hooks.map(() => Date.now())
    const settled = await Promise.allSettled(hooks.map((h) => h.execute(payload)))
    for (let i = 0; i < hooks.length; i++) {
      const s = settled[i]
      const durationMs = Date.now() - starts[i]
      if (s.status === 'fulfilled') {
        this.recordExecution(hooks[i].id, 'noop', durationMs, null)
      } else {
        this.recordExecution(hooks[i].id, null, durationMs, String(s.reason))
      }
    }
  }

  getHooks(event?: HookEvent): HookDefinition[] {
    if (event) return this.hooks.get(event) ?? []
    return Array.from(this.hooks.values()).flat()
  }

  async flushExecutions(db: D1Database): Promise<void> {
    for (const rec of this.executionBuffer) {
      try {
        await db
          .prepare(
            'INSERT INTO hook_execution (id, hook_id, session_id, decision, duration_ms, error, executed_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
          )
          .bind(
            rec.id,
            rec.hook_id,
            rec.session_id,
            rec.decision,
            rec.duration_ms,
            rec.error,
            rec.executed_at
          )
          .run()
      } catch {
        /* non-blocking */
      }
    }
    this.executionBuffer = []
  }

  private recordExecution(
    hookId: string,
    decision: HookExecutionRecord['decision'],
    durationMs: number,
    error: string | null
  ): void {
    this.executionBuffer.push({
      id: crypto.randomUUID(),
      hook_id: hookId,
      session_id: null,
      decision,
      duration_ms: durationMs,
      error,
      executed_at: new Date().toISOString(),
    })
  }
}
