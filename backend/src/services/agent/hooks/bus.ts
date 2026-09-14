import type { EnrichResult, GateResult, HookDefinition, HookEvent } from './types'

export class HookBus {
  private hooks: Map<HookEvent, HookDefinition[]> = new Map()

  register(hook: HookDefinition): void {
    const list = this.hooks.get(hook.event) ?? []
    list.push(hook)
    list.sort((a, b) => a.priority - b.priority)
    this.hooks.set(hook.event, list)
  }

  async runGates(event: HookEvent, payload: Record<string, unknown>): Promise<GateResult> {
    const hooks = this.hooks.get(event)?.filter((h) => h.hookType === 'gate' && h.enabled) ?? []
    for (const hook of hooks) {
      try {
        const result = (await hook.execute(payload)) as GateResult | undefined
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
        console.error(`[HookBus] gate ${hook.name} error:`, err)
      }
    }
    return { allow: true }
  }

  async runEnrich(event: HookEvent, payload: Record<string, unknown>): Promise<string[]> {
    const hooks = this.hooks.get(event)?.filter((h) => h.hookType === 'enrich' && h.enabled) ?? []
    const results: string[] = []
    for (const hook of hooks) {
      try {
        const result = (await hook.execute(payload)) as EnrichResult | undefined
        if (result?.context) results.push(result.context)
      } catch (err) {
        console.error(`[HookBus] enrich ${hook.name} error:`, err)
      }
    }
    return results
  }

  async runObservers(event: HookEvent, payload: Record<string, unknown>): Promise<void> {
    const hooks = this.hooks.get(event)?.filter((h) => h.hookType === 'observe' && h.enabled) ?? []
    await Promise.allSettled(hooks.map((h) => h.execute(payload)))
  }

  getHooks(event?: HookEvent): HookDefinition[] {
    if (event) return this.hooks.get(event) ?? []
    return Array.from(this.hooks.values()).flat()
  }
}
