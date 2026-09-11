import { getMemoriesSummary } from '../../repositories/memory'
import type { Env } from '../../types'
import { buildAgentBasePrompt } from '../../utils/ai-prompts'
import type { LangfuseParent } from '../../utils/langfuse'
import { createProvider } from '../orchestrators/ai-graph/providers'
import type { ProviderName as LegacyProviderName } from '../orchestrators/ai-graph/providers/types'
import { extractMemoriesFromQuery } from '../domain/memory'
import {
  buildAscentContext,
  buildPersonalizedSystemPrompt,
  estimateAbilityLevel,
  getRecentAscents,
} from '../domain/personalization'
import { runAgentLoop } from './agent-loop'
import { KVAgentCache } from './cache'
import { classifyQuery, GREETING_RESPONSE, SYSTEM_RESPONSE } from './classifier'
import { runAsyncJudge, runOutputGuards } from './guards'
import { createToolRegistry } from './tools'
import { DefaultTokenTracker } from './tracker'
import type { AgentResult, ModelConfig, ModelMap, ProviderName, ToolContext } from './types'

// ---------------------------------------------------------------------------
// Default Model Map
// ---------------------------------------------------------------------------

const DEFAULT_MODEL_MAP: ModelMap = {
  orchestrator: {
    provider: 'workers-ai',
    model: '@cf/meta/llama-4-scout-17b-16e-instruct',
    temperature: 0.3,
    maxTokens: 1024,
    fallback: {
      provider: 'workers-ai',
      model: '@cf/meta/llama-3.1-8b-instruct',
      temperature: 0.3,
      maxTokens: 1024,
    },
  },
  hyde: { provider: 'workers-ai', model: '@cf/meta/llama-3.1-8b-instruct' },
  multiQuery: { provider: 'workers-ai', model: '@cf/meta/llama-3.1-8b-instruct' },
  textToSql: { provider: 'workers-ai', model: '@cf/meta/llama-3.1-8b-instruct' },
  rerank: { provider: 'workers-ai', model: '@cf/baai/bge-reranker-v2-m3' },
  judge: { provider: 'workers-ai', model: '@cf/meta/llama-3.1-8b-instruct' },
  embedding: { provider: 'workers-ai', model: '@cf/baai/bge-m3' },
}

type PartialModelConfig = Partial<ModelConfig> & {
  fallback?: PartialModelConfig
}

function normalizeModelConfig(
  value: PartialModelConfig | undefined,
  fallback: ModelConfig
): ModelConfig {
  return {
    provider: value?.provider ?? fallback.provider,
    model: value?.model ?? fallback.model,
    temperature: value?.temperature ?? fallback.temperature,
    maxTokens: value?.maxTokens ?? fallback.maxTokens,
    fallback: value?.fallback
      ? normalizeModelConfig(value.fallback, fallback.fallback ?? fallback)
      : fallback.fallback,
  }
}

// ---------------------------------------------------------------------------
// Load Model Map from DB
// ---------------------------------------------------------------------------

export async function loadModelMap(db: D1Database): Promise<ModelMap> {
  // 新 key 優先，fallback 到舊 key
  const row = await db
    .prepare(
      "SELECT value FROM ai_config WHERE key IN ('agent_models', 'react_models') ORDER BY CASE key WHEN 'agent_models' THEN 0 ELSE 1 END LIMIT 1"
    )
    .first<{ value: string }>()

  if (!row?.value) return DEFAULT_MODEL_MAP

  try {
    const parsed = JSON.parse(row.value) as Partial<Record<keyof ModelMap, PartialModelConfig>>
    return {
      orchestrator: normalizeModelConfig(parsed.orchestrator, DEFAULT_MODEL_MAP.orchestrator),
      hyde: normalizeModelConfig(parsed.hyde, DEFAULT_MODEL_MAP.hyde),
      multiQuery: normalizeModelConfig(parsed.multiQuery, DEFAULT_MODEL_MAP.multiQuery),
      textToSql: normalizeModelConfig(parsed.textToSql, DEFAULT_MODEL_MAP.textToSql),
      rerank: normalizeModelConfig(parsed.rerank, DEFAULT_MODEL_MAP.rerank),
      judge: normalizeModelConfig(parsed.judge, DEFAULT_MODEL_MAP.judge),
      embedding: normalizeModelConfig(parsed.embedding, DEFAULT_MODEL_MAP.embedding),
    }
  } catch {
    return DEFAULT_MODEL_MAP
  }
}

// ---------------------------------------------------------------------------
// Load Agent Config
// ---------------------------------------------------------------------------

interface AgentConfig {
  maxTurns: number
  tokenBudget: number
  usdToTwd: number
}

async function loadAgentConfig(db: D1Database): Promise<AgentConfig> {
  // 新 key（agent_*）優先，fallback 到舊 key（react_*）以相容未跑 migration 的環境
  const rows = await db
    .prepare(
      "SELECT key, value FROM ai_config WHERE key IN ('agent_max_turns', 'agent_token_budget', 'agent_usd_to_twd', 'react_max_turns', 'react_token_budget', 'react_usd_to_twd')"
    )
    .all<{ key: string; value: string }>()
  const cfg: Record<string, string> = Object.fromEntries(
    (rows.results ?? []).map((r) => [r.key, r.value])
  )
  return {
    maxTurns: parseInt(cfg['agent_max_turns'] ?? cfg['react_max_turns'] ?? '3', 10) || 3,
    tokenBudget:
      parseInt(cfg['agent_token_budget'] ?? cfg['react_token_budget'] ?? '8000', 10) || 8000,
    usdToTwd: parseFloat(cfg['agent_usd_to_twd'] ?? cfg['react_usd_to_twd'] ?? '32.0') || 32.0,
  }
}

// ---------------------------------------------------------------------------
// Create Provider for ModelConfig
// ---------------------------------------------------------------------------

function createProviderForConfig(provider: ProviderName, env: Env) {
  // 將 agent 的 ProviderName 對應到 factory 接受的名稱
  const factoryName = provider === 'workers-ai' ? 'cloudflare' : provider
  return createProvider(factoryName as LegacyProviderName, env)
}

// ---------------------------------------------------------------------------
// runAgent — 主入口
// ---------------------------------------------------------------------------

export interface RunAgentParams {
  query: string
  chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  userId: string | null
  env: Env
  langfuseTrace?: LangfuseParent | null
  waitUntilCtx?: { waitUntil(promise: Promise<unknown>): void }
  stream?: boolean
  onToken?: (token: string) => Promise<void>
  onProgress?: (event: {
    type: 'progress'
    tool: string
    status: 'executing' | 'done'
  }) => Promise<void>
}

export async function runAgent(params: RunAgentParams): Promise<AgentResult> {
  const { query, chatHistory, userId, env, langfuseTrace, waitUntilCtx } = params

  // 0. 查詢分類快速路徑（0 LLM call）
  const category = classifyQuery(query)
  if (category === 'greeting') {
    return {
      answer: GREETING_RESPONSE,
      sources: [],
      totalTokens: 0,
      turnCount: 0,
      toolCallCount: 0,
      perModelStats: [],
    }
  }
  if (category === 'system') {
    return {
      answer: SYSTEM_RESPONSE,
      sources: [],
      totalTokens: 0,
      turnCount: 0,
      toolCallCount: 0,
      perModelStats: [],
    }
  }

  // 0.5 通用知識 → 用 hyde 觸點（小模型）直接回答
  if (category === 'general_knowledge') {
    const models = await loadModelMap(env.DB)
    const hydeProvider = createProviderForConfig(models.hyde.provider, env)
    try {
      const response = await hydeProvider.chat(
        [
          { role: 'system', content: '你是攀岩知識專家，用繁體中文簡潔回答攀岩相關問題。' },
          { role: 'user', content: query },
        ],
        { model: models.hyde.model, maxTokens: 512, temperature: 0.3 }
      )
      // 通用知識也過 output guards
      const guardResult = runOutputGuards(response.content)
      const answer = guardResult.cleanedAnswer ?? response.content
      const tracker = new DefaultTokenTracker()
      tracker.record(
        models.hyde.provider,
        models.hyde.model,
        response.usage?.prompt_tokens ?? 0,
        response.usage?.completion_tokens ?? 0
      )
      return {
        answer,
        sources: [],
        totalTokens: tracker.getTotalTokens(),
        turnCount: 0,
        toolCallCount: 0,
        perModelStats: tracker.getPerModelStats(),
      }
    } catch (err) {
      console.warn('[agent] general_knowledge hyde failed, falling through to agent loop:', err)
    }
  }

  // 1. Load config + personalization（並行）
  const personalizationPromise = userId
    ? Promise.all([getMemoriesSummary(userId, env.DB), getRecentAscents(userId, env.DB)])
    : Promise.resolve([null, []] as [string | null, Awaited<ReturnType<typeof getRecentAscents>>])

  const [models, agentCfg, [memorySummary, ascents]] = await Promise.all([
    loadModelMap(env.DB),
    loadAgentConfig(env.DB),
    personalizationPromise,
  ])

  // 2. Create provider + tracker + registry + context
  const orchestratorProvider = createProviderForConfig(models.orchestrator.provider, env)
  const tracker = new DefaultTokenTracker(agentCfg.usdToTwd)
  const { registry, manifests } = createToolRegistry({ isAuthenticated: !!userId })
  const cache = new KVAgentCache(env.CACHE)
  const toolCtx: ToolContext = {
    env,
    userId,
    locale: 'zh-TW',
    models,
    langfuseTrace,
    tracker,
    cache,
    availableTools: registry.getToolNames(),
  }

  // 3. Build personalized system prompt（工具說明動態生成，基於 manifest + ctx）
  const ascentContext = buildAscentContext(ascents)
  const abilityLevel = estimateAbilityLevel(ascents)
  const toolsSection = registry.toSystemPromptSection(toolCtx)
  const capabilitySection = manifests.map((m) => `- **${m.name}**：${m.promptFragment}`).join('\n')
  const systemPrompt = buildPersonalizedSystemPrompt(
    memorySummary,
    ascentContext,
    abilityLevel,
    buildAgentBasePrompt(toolsSection, capabilitySection)
  )

  // 5. Run agent loop
  const result = await runAgentLoop(
    {
      provider: orchestratorProvider,
      registry,
      ctx: toolCtx,
      langfuseParent: langfuseTrace,
      createProvider: (providerName: string) =>
        createProviderForConfig(providerName as ProviderName, env),
    },
    {
      query,
      chatHistory,
      systemPrompt,
      maxTurns: agentCfg.maxTurns,
      tokenBudget: agentCfg.tokenBudget,
      onProgress: params.onProgress,
    }
  )

  // 6. Output guards（同步）
  const guardResult = runOutputGuards(result.answer)
  if (!guardResult.passed) {
    console.warn('[agent] output guard failed', { qualityFlag: guardResult.qualityFlag })
  }
  const finalAnswer =
    guardResult.qualityFlag === 'tool_call_leak'
      ? '抱歉，AI 助理暫時無法處理您的問題，請稍後再試。'
      : (guardResult.cleanedAnswer ?? result.answer)

  // 7. Async judge + memory extraction（非同步，不擋回應）
  if (waitUntilCtx) {
    waitUntilCtx.waitUntil(runAsyncJudge(env, query, '', finalAnswer, models, langfuseTrace))
    if (userId) {
      waitUntilCtx.waitUntil(extractMemoriesFromQuery(query, userId, env.DB, env.AI))
    }
  }

  const costSummary = tracker.getCostSummary()
  return {
    answer: finalAnswer,
    sources: [],
    totalTokens: tracker.getTotalTokens(),
    turnCount: result.turnCount,
    toolCallCount: result.toolCallCount,
    perModelStats: tracker.getPerModelStats(),
    costUSD: costSummary.totalCostUSD,
    costTWD: costSummary.totalCostTWD,
  }
}
