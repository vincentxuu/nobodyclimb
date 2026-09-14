import type { Env } from '../../../types'
import { checkInput, GuardrailError } from '../../../utils/guardrails'
import type { LangfuseParent } from '../../../utils/langfuse'
import { extractMemoriesFromQuery } from '../../domain/memory'
import { runAsyncJudge, runOutputGuards } from '../guards'
import type { ModelMap } from '../types'
import type { GateResult, HookDefinition } from './types'

export function createBuiltinHooks(deps: {
  env: Env
  userId: string | null
  models?: ModelMap
  langfuseTrace?: LangfuseParent | null
}): HookDefinition[] {
  const { env, userId } = deps

  return [
    {
      id: 'builtin:input_guard',
      name: 'input_guard',
      event: 'pre_loop',
      hookType: 'gate',
      priority: 10,
      enabled: true,
      timeoutMs: 5000,
      onFailure: 'fail_closed',
      async execute(payload): Promise<GateResult> {
        const query = payload.query as string
        try {
          await checkInput(query, env.DB)
          return { allow: true }
        } catch (err) {
          if (err instanceof GuardrailError) {
            return { allow: false, reason: err.message }
          }
          throw err
        }
      },
    },
    {
      id: 'builtin:token_budget',
      name: 'token_budget',
      event: 'pre_turn',
      hookType: 'gate',
      priority: 10,
      enabled: true,
      timeoutMs: 100,
      onFailure: 'fail_open',
      async execute(payload): Promise<GateResult> {
        const totalTokens = payload.totalTokens as number
        const tokenBudget = payload.tokenBudget as number
        if (totalTokens >= tokenBudget) {
          return { allow: false, reason: 'Token budget exceeded' }
        }
        return { allow: true }
      },
    },
    {
      id: 'builtin:output_guard',
      name: 'output_guard',
      event: 'post_loop',
      hookType: 'gate',
      priority: 10,
      enabled: true,
      timeoutMs: 5000,
      onFailure: 'fail_closed',
      async execute(payload): Promise<GateResult> {
        const answer = payload.answer as string
        const guardResult = runOutputGuards(answer)
        if (guardResult.qualityFlag === 'tool_call_leak') {
          return {
            allow: false,
            reason: 'tool_call_leak',
            replacement: '抱歉，AI 助理暫時無法處理您的問題，請稍後再試。',
          }
        }
        if (guardResult.cleanedAnswer && guardResult.cleanedAnswer !== answer) {
          return { allow: true, replacement: guardResult.cleanedAnswer }
        }
        return { allow: true }
      },
    },
    {
      id: 'builtin:async_judge',
      name: 'async_judge',
      event: 'post_response',
      hookType: 'observe',
      priority: 100,
      enabled: true,
      timeoutMs: 10000,
      onFailure: 'fail_open',
      async execute(payload): Promise<void> {
        if (!deps.models) return
        await runAsyncJudge(
          env,
          payload.query as string,
          '',
          payload.answer as string,
          deps.models,
          deps.langfuseTrace
        )
      },
    },
    {
      id: 'builtin:memory_extraction',
      name: 'memory_extraction',
      event: 'post_response',
      hookType: 'observe',
      priority: 200,
      enabled: true,
      timeoutMs: 10000,
      onFailure: 'fail_open',
      async execute(payload): Promise<void> {
        if (!userId) return
        await extractMemoriesFromQuery(payload.query as string, userId, env.DB, env.AI)
      },
    },
  ]
}
