import { getMemoriesSummary } from '../../repositories/memory'
import type { Env } from '../../types'
import { buildAgentBasePrompt } from '../../utils/ai-prompts'
import type { LangfuseParent } from '../../utils/langfuse'
import { extractMemoriesFromQuery } from '../domain/memory'
import {
  buildAscentContext,
  buildPersonalizedSystemPrompt,
  estimateAbilityLevel,
  getRecentAscents,
} from '../domain/personalization'
import { createProvider } from '../orchestrators/ai-graph/providers'
import type { ProviderName as LegacyProviderName } from '../orchestrators/ai-graph/providers/types'
import { runAgentLoop } from './agent-loop'
import { KVAgentCache } from './cache'
import { classifyQuery, GREETING_RESPONSE, SYSTEM_RESPONSE } from './classifier'
import { createBuiltinHooks } from './hooks/builtins'
import { HookBus } from './hooks/bus'
import { isHookEnabled, loadHookRecords } from './hooks/loader'
import { registerMCPTools } from './mcp/registry'
import { buildProactivePromptSection, gatherProactiveContext } from './proactive'
import { recordSkillInvocation, SkillResolver } from './skills/resolver'
import { createDBToolRegistry, updateToolStats } from './tools/db-registry'
import { DefaultTokenTracker } from './tracker'
import type { AgentResult, ModelConfig, ModelMap, ProviderName, ToolContext } from './types'

// ---------------------------------------------------------------------------
// Default Model Map
// ---------------------------------------------------------------------------

const DEFAULT_MODEL_MAP: ModelMap = {
  orchestrator: {
    provider: 'workers-ai',
    model: '@cf/zai-org/glm-4.7-flash',
    temperature: 0.3,
    maxTokens: 1024,
    fallback: {
      provider: 'workers-ai',
      model: '@cf/qwen/qwen3-4b',
      temperature: 0.3,
      maxTokens: 1024,
    },
  },
  hyde: { provider: 'workers-ai', model: '@cf/zai-org/glm-4.7-flash' },
  multiQuery: { provider: 'workers-ai', model: '@cf/zai-org/glm-4.7-flash' },
  textToSql: { provider: 'workers-ai', model: '@cf/zai-org/glm-4.7-flash' },
  rerank: { provider: 'workers-ai', model: '@cf/baai/bge-reranker-v2-m3' },
  judge: { provider: 'workers-ai', model: '@cf/qwen/qwen3-30b-a3b-fp8' },
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
// 共用：建立 mini HookBus 跑 post_loop gates（供快速路徑使用）
// ---------------------------------------------------------------------------

async function runPostLoopGuards(
  answer: string,
  query: string,
  env: Env,
  models: ModelMap,
  hookRecords?: import('./hooks/types').HookRecord[]
): Promise<string> {
  const records = hookRecords ?? (await loadHookRecords(env.DB))
  const hooks = createBuiltinHooks({ env, userId: null, models, hookRecords: records })
  const bus = new HookBus()
  for (const hook of hooks) {
    if (hook.event === 'post_loop' && isHookEnabled(records, hook.id)) {
      bus.register(hook)
    }
  }
  const result = await bus.runGates('post_loop', { answer, query, models, env })
  return result.replacement ?? answer
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
      const answer = await runPostLoopGuards(response.content, query, env, models)
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

  // 0.8 Skill-based routing — SkillResolver 取代 manifest + detectDirectRoute
  const skillResolver = new SkillResolver()
  await skillResolver.load(env.DB)
  const directSkill = skillResolver.findDirectRoute(query, !!userId)

  if (directSkill && userId) {
    try {
      const models = await loadModelMap(env.DB)
      const tracker = new DefaultTokenTracker((await loadAgentConfig(env.DB)).usdToTwd)
      const cache = new KVAgentCache(env.CACHE)
      const toolCtx: ToolContext = {
        env,
        userId,
        locale: 'zh-TW',
        models,
        langfuseTrace,
        tracker,
        cache,
        availableTools: [],
      }

      let subAgent: import('./sub-agents/types').SubAgent | null = null
      if (directSkill.slug === 'coaching') {
        subAgent = (await import('./sub-agents/coaching-agent')).coachingSubAgent
      } else if (directSkill.slug === 'recommend') {
        subAgent = (await import('./sub-agents/recommend-agent')).recommendSubAgent
      }

      if (subAgent) {
        // Try loading system prompt from R2 SKILL.md (L2+L3), fallback to hardcoded
        let skillSystemPrompt: string | null = null
        try {
          const { loadFullSkillContent } = await import('./skills/loader')
          skillSystemPrompt = await loadFullSkillContent(env.AGENT_STORAGE, directSkill.slug)
        } catch {
          // R2 unavailable — use hardcoded prompt
        }
        if (skillSystemPrompt) {
          subAgent = { ...subAgent, systemPrompt: skillSystemPrompt }
        }

        if (params.onProgress) {
          await params.onProgress({ type: 'progress', tool: subAgent.name, status: 'executing' })
        }

        const context = await subAgent.gatherContext({ query }, toolCtx)
        const result = await subAgent.synthesize(query, context, toolCtx)

        if (params.onProgress) {
          await params.onProgress({ type: 'progress', tool: subAgent.name, status: 'done' })
        }

        const finalAnswer = await runPostLoopGuards(result.answer, query, env, models)

        if (waitUntilCtx && userId) {
          waitUntilCtx.waitUntil(extractMemoriesFromQuery(query, userId, env.DB, env.AI))
        }

        const costSummary = tracker.getCostSummary()
        return {
          answer: finalAnswer,
          sources: [],
          totalTokens: tracker.getTotalTokens(),
          turnCount: 1,
          toolCallCount: 1,
          perModelStats: tracker.getPerModelStats(),
          costUSD: costSummary.totalCostUSD,
          costTWD: costSummary.totalCostTWD,
        }
      }
    } catch (err) {
      console.warn(
        `[agent] direct route to skill ${directSkill.slug} failed, falling through to agent loop:`,
        err
      )
    }
  }

  // 1. Load config + personalization + proactive context（並行）
  const personalizationPromise = userId
    ? Promise.all([getMemoriesSummary(userId, env.DB), getRecentAscents(userId, env.DB)])
    : Promise.resolve([null, []] as [string | null, Awaited<ReturnType<typeof getRecentAscents>>])

  const [models, agentCfg, [memorySummary, ascents], proactiveCtx, hookRecords] = await Promise.all(
    [
      loadModelMap(env.DB),
      loadAgentConfig(env.DB),
      personalizationPromise,
      gatherProactiveContext(env.DB, userId),
      loadHookRecords(env.DB),
    ]
  )

  // Build HookBus with DB-controlled enable/disable
  const hookBus = new HookBus()
  const builtinHooks = createBuiltinHooks({ env, userId, models, langfuseTrace, hookRecords })
  for (const hook of builtinHooks) {
    if (isHookEnabled(hookRecords, `builtin:${hook.name}`)) {
      hookBus.register(hook)
    }
  }

  // 2. Create provider + tracker + registry + context
  const orchestratorProvider = createProviderForConfig(models.orchestrator.provider, env)
  const tracker = new DefaultTokenTracker(agentCfg.usdToTwd)
  const matchedSkills = skillResolver.resolve(query, !!userId)
  const requiredToolNames = skillResolver.getRequiredTools(matchedSkills)
  const { registry } = await createDBToolRegistry(env.DB, {
    isAuthenticated: !!userId,
    requiredTools: requiredToolNames,
  })
  await registerMCPTools(env.DB, registry, env as unknown as Record<string, unknown>)
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

  // 3. Build personalized system prompt（工具說明動態生成，基於 skill bodies + ctx）
  const ascentContext = buildAscentContext(ascents)
  const abilityLevel = estimateAbilityLevel(ascents)
  const toolsSection = registry.toSystemPromptSection(toolCtx)
  // L2+L3: 載入 matched skills 的 SKILL.md body + resolve @reference()
  const skillBodies = await skillResolver.loadSkillBodies(env.AGENT_STORAGE, matchedSkills)
  const capabilitySection =
    skillBodies.size > 0
      ? skillResolver.buildPromptSectionsWithBodies(matchedSkills, skillBodies)
      : skillResolver.buildPromptSections(matchedSkills)
  const baseSystemPrompt = buildPersonalizedSystemPrompt(
    memorySummary,
    ascentContext,
    abilityLevel,
    buildAgentBasePrompt(toolsSection, capabilitySection)
  )
  const proactiveSection = buildProactivePromptSection(proactiveCtx)
  const systemPrompt = proactiveSection
    ? `${baseSystemPrompt}\n\n${proactiveSection}`
    : baseSystemPrompt

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
      stream: params.stream,
      onToken: params.onToken,
      onProgress: params.onProgress,
    }
  )

  // 6. Output guards via HookBus（偵測 + 重生成邏輯都在 builtin:output_guard hook 中）
  const postLoopResult = await hookBus.runGates('post_loop', {
    answer: result.answer,
    query,
    models,
    env,
  })
  const finalAnswer = postLoopResult.replacement ?? result.answer
  if (!postLoopResult.allow) {
    console.warn('[agent] post_loop hook denied', { reason: postLoopResult.reason })
  }

  // 7. Async observers + tool stats（非同步，不擋回應）
  if (waitUntilCtx) {
    waitUntilCtx.waitUntil(
      hookBus.runObservers('post_response', {
        query,
        answer: finalAnswer,
        userId,
        totalTokens: tracker.getTotalTokens(),
      })
    )
    waitUntilCtx.waitUntil(updateToolStats(env.DB, tracker.getTurnRecords()))
    waitUntilCtx.waitUntil(hookBus.flushExecutions(env.DB))
    for (const skill of matchedSkills) {
      const outcome = result.toolCallCount > 0 ? 'used' : 'loaded_unused'
      waitUntilCtx.waitUntil(recordSkillInvocation(env.DB, skill.versionId, null, outcome))
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
    turnTraces: result.turnTraces,
    costUSD: costSummary.totalCostUSD,
    costTWD: costSummary.totalCostTWD,
  }
}
