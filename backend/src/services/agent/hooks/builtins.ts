import type { Env } from '../../../types'
import { checkInput, checkOutput, GuardrailError } from '../../../utils/guardrails'
import type { LangfuseParent } from '../../../utils/langfuse'
import { extractMemoriesFromQuery } from '../../domain/memory'
import { createProvider } from '../../orchestrators/ai-graph/providers'
import type { ProviderName as LegacyProviderName } from '../../orchestrators/ai-graph/providers/types'
import { runAsyncJudge } from '../guards'
import type { ModelMap } from '../types'
import type { GateResult, HookDefinition, HookRecord } from './types'

// ---------------------------------------------------------------------------
// Config 解析（從 DB hook record 的 config JSON 讀取參數）
// ---------------------------------------------------------------------------

function parseConfig<T>(records: HookRecord[], hookName: string, defaults: T): T {
  const record = records.find((r) => r.name === hookName)
  if (!record?.config) return defaults
  try {
    return { ...defaults, ...JSON.parse(record.config) }
  } catch {
    return defaults
  }
}

// ---------------------------------------------------------------------------
// 通用引擎：pattern guard（regex 匹配偵測）
// ---------------------------------------------------------------------------

function runPatternGuard(answer: string, patterns: string[], threshold: number): boolean {
  const regexps = patterns.map((p) => new RegExp(p))
  const matchCount = regexps.filter((r) => r.test(answer)).length
  return matchCount >= threshold
}

// ---------------------------------------------------------------------------
// 通用引擎：repetition guard（重複偵測）
// ---------------------------------------------------------------------------

function runRepetitionGuard(
  answer: string,
  minLineLen: number,
  minLines: number,
  repeatThreshold: number,
  fingerprintLen: number
): boolean {
  const lines = answer.split('\n').filter((l) => l.trim().length > minLineLen)
  if (lines.length < minLines) return false
  const seen = new Map<string, number>()
  for (const line of lines) {
    seen.set(line.trim(), (seen.get(line.trim()) ?? 0) + 1)
  }
  for (const count of seen.values()) {
    if (count >= repeatThreshold) return true
  }
  const paragraphs = answer
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > minLineLen * 2)
  if (paragraphs.length >= minLines) {
    const paraSet = new Map<string, number>()
    for (const p of paragraphs) {
      paraSet.set(p.slice(0, fingerprintLen), (paraSet.get(p.slice(0, fingerprintLen)) ?? 0) + 1)
    }
    for (const count of paraSet.values()) {
      if (count >= repeatThreshold) return true
    }
  }
  return false
}

// ---------------------------------------------------------------------------
// 通用引擎：retry generation（偵測失敗時用 LLM 重生成）
// ---------------------------------------------------------------------------

async function retryGeneration(
  answer: string,
  query: string,
  retryPrompt: string,
  models: ModelMap,
  hookEnv: Env
): Promise<string | null> {
  try {
    const factoryName =
      models.orchestrator.provider === 'workers-ai' ? 'cloudflare' : models.orchestrator.provider
    const retryProvider = createProvider(factoryName as LegacyProviderName, hookEnv)
    const retryResponse = await retryProvider.chat(
      [
        { role: 'system', content: retryPrompt },
        {
          role: 'user',
          content: `使用者問：${query}\n\n以下是查到的資料摘要，請直接回答使用者：\n${answer.slice(0, 2000)}`,
        },
      ],
      {
        model: models.orchestrator.model,
        maxTokens: models.orchestrator.maxTokens,
        temperature: 0.3,
      }
    )
    return retryResponse.content
  } catch (err) {
    console.warn('[hook] retryGeneration failed:', err)
    return null
  }
}

// ---------------------------------------------------------------------------
// Builtin Hook 工廠
// ---------------------------------------------------------------------------

const DEFAULT_FALLBACK = '抱歉，AI 助理暫時無法處理您的問題，請稍後再試。'
const DEFAULT_RETRY_PROMPT = `你是 NobodyClimb 攀岩助理。用繁體中文回答。只輸出給使用者看的最終回答，禁止輸出任何內部推理、分析過程或重複內容。

格式規則：
- 推薦路線格式：「⛰ 路線名稱，難度等級：5.10a，類型：運攀，岩場：龍洞。描述。」（一段式）
- 若資料有路線連結，用 [路線名稱](連結) 格式
- 列表用 - 符號，禁止 ## 標題
- 回答結尾加建議問題，格式：---SUGGESTIONS---\\n1. 問句？\\n2. 問句？\\n3. 問句？`

export function createBuiltinHooks(deps: {
  env: Env
  userId: string | null
  models?: ModelMap
  langfuseTrace?: LangfuseParent | null
  hookRecords?: HookRecord[]
}): HookDefinition[] {
  const { env, userId } = deps
  const records = deps.hookRecords ?? []

  // ── 從 DB config 讀取各 hook 的參數 ──────────────────────────────

  const thinkingLeakCfg = parseConfig(records, 'thinking_leak_guard', {
    patterns: [
      '我需要根據',
      '我應該推薦',
      '我必須根據',
      '讓我看看',
      '讓我分析',
      '現在我需要',
      '這與使用者說的.*有矛盾',
      '根據規則\\s*\\d+',
      '不過，根據規則',
    ],
    threshold: 3,
    retry_prompt: DEFAULT_RETRY_PROMPT,
    fallback_message: DEFAULT_FALLBACK,
  })

  const repetitionCfg = parseConfig(records, 'repetition_guard', {
    min_line_length: 20,
    min_lines: 4,
    repeat_threshold: 3,
    fingerprint_length: 60,
    retry_prompt: DEFAULT_RETRY_PROMPT,
    fallback_message: DEFAULT_FALLBACK,
  })

  const outputGuardCfg = parseConfig(records, 'output_guard', {
    min_answer_length: 50,
    tool_call_pattern: '^\\[呼叫工具:',
    fallback_message: DEFAULT_FALLBACK,
  })

  return [
    // ── pre_loop ──────────────────────────────────────────────────────
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
        try {
          await checkInput(payload.query as string, env.DB)
          return { allow: true }
        } catch (err) {
          if (err instanceof GuardrailError) return { allow: false, reason: err.message }
          throw err
        }
      },
    },

    // ── pre_turn ──────────────────────────────────────────────────────
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
        if (totalTokens >= tokenBudget) return { allow: false, reason: 'Token budget exceeded' }
        return { allow: true }
      },
    },

    // ── post_loop gates（依 priority 執行，第一個 deny 就短路）───────

    // Gate 1: 基礎輸出檢查（太短、工具呼叫洩漏、prompt 洩漏）
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
        if (answer.length < outputGuardCfg.min_answer_length) {
          return { allow: false, reason: 'too_short', replacement: outputGuardCfg.fallback_message }
        }
        if (new RegExp(outputGuardCfg.tool_call_pattern).test(answer.trim())) {
          return {
            allow: false,
            reason: 'tool_call_leak',
            replacement: outputGuardCfg.fallback_message,
          }
        }
        const outputCheck = checkOutput(answer)
        if (outputCheck.trace.system_prompt_leaked) {
          return { allow: true, replacement: outputCheck.output }
        }
        return { allow: true }
      },
    },

    // Gate 2: 思考過程洩漏偵測（patterns + threshold 來自 DB config）
    {
      id: 'builtin:thinking_leak_guard',
      name: 'thinking_leak_guard',
      event: 'post_loop',
      hookType: 'gate',
      priority: 20,
      enabled: true,
      timeoutMs: 10000,
      onFailure: 'fail_open',
      async execute(payload): Promise<GateResult> {
        const answer = payload.answer as string
        if (!runPatternGuard(answer, thinkingLeakCfg.patterns, thinkingLeakCfg.threshold)) {
          return { allow: true }
        }
        const models = payload.models as ModelMap | undefined
        const hookEnv = payload.env as Env | undefined
        const query = payload.query as string | undefined
        if (models && hookEnv && query) {
          const cleaned = await retryGeneration(
            answer,
            query,
            thinkingLeakCfg.retry_prompt,
            models,
            hookEnv
          )
          if (cleaned) return { allow: true, replacement: cleaned }
        }
        return {
          allow: false,
          reason: 'thinking_leak',
          replacement: thinkingLeakCfg.fallback_message,
        }
      },
    },

    // Gate 3: 重複內容偵測（thresholds 來自 DB config）
    {
      id: 'builtin:repetition_guard',
      name: 'repetition_guard',
      event: 'post_loop',
      hookType: 'gate',
      priority: 30,
      enabled: true,
      timeoutMs: 10000,
      onFailure: 'fail_open',
      async execute(payload): Promise<GateResult> {
        const answer = payload.answer as string
        if (
          !runRepetitionGuard(
            answer,
            repetitionCfg.min_line_length,
            repetitionCfg.min_lines,
            repetitionCfg.repeat_threshold,
            repetitionCfg.fingerprint_length
          )
        ) {
          return { allow: true }
        }
        const models = payload.models as ModelMap | undefined
        const hookEnv = payload.env as Env | undefined
        const query = payload.query as string | undefined
        if (models && hookEnv && query) {
          const cleaned = await retryGeneration(
            answer,
            query,
            repetitionCfg.retry_prompt,
            models,
            hookEnv
          )
          if (cleaned) return { allow: true, replacement: cleaned }
        }
        return {
          allow: false,
          reason: 'repetition',
          replacement: repetitionCfg.fallback_message,
        }
      },
    },

    // ── post_response observers（非阻塞）───────────────────────────
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
