import { describe, expect, it, vi } from 'vitest'
import type { Env } from '../../../types'
import type { AgentCache } from '../cache'
import { coachingAgentTool, recommendAgentTool } from '../sub-agents'
import { coachingSubAgent } from '../sub-agents/coaching-agent'
import { recommendSubAgent } from '../sub-agents/recommend-agent'
import { formatSubAgentResult } from '../sub-agents/types'
import { analyzeWeaknesses, analyzeWeaknessesStructured } from '../sub-agents/weakness-analysis'
import { DefaultTokenTracker } from '../tracker'
import type { ToolContext } from '../types'

// ---------------------------------------------------------------------------
// Mock provider (for synthesize)
// ---------------------------------------------------------------------------

vi.mock('../../orchestrators/ai-graph/providers', () => ({
  createProvider: () => ({
    chat: vi.fn().mockResolvedValue({
      content: 'mock LLM response',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    }),
  }),
}))

// mock the inner tools so gatherContext doesn't hit real DB
vi.mock('../tools/recommend', () => ({
  recommendTool: {
    execute: vi.fn().mockResolvedValue({ recommendations: [], count: 0 }),
    formatResult: vi.fn().mockReturnValue({ content: '目前沒有推薦路線。' }),
  },
}))

vi.mock('../tools/user-profile', () => ({
  userProfileTool: {
    execute: vi.fn().mockResolvedValue({ user: { name: 'TestUser' }, stats: { total_ascents: 5 } }),
    formatResult: vi.fn().mockReturnValue({ content: '用戶：TestUser\n總完攀：5 條' }),
  },
}))

vi.mock('../tools/coaching', () => ({
  suggestTrainingTool: {
    execute: vi.fn().mockResolvedValue({
      level: '進階入門（5.10）',
      typeDistribution: [
        { type: 'sport', count: 8 },
        { type: 'trad', count: 2 },
      ],
      styleDistribution: { redpoint: 6, onsight: 2 },
      recentAscents: [
        { route: 'A', grade: '5.10a', type: 'sport', style: 'redpoint' },
        { route: 'B', grade: '5.10b', type: 'sport', style: 'redpoint' },
      ],
    }),
    formatResult: vi.fn().mockReturnValue({ content: '攀登程度：進階入門（5.10）\n總完攀：10 條' }),
  },
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MODELS = {
  orchestrator: { provider: 'workers-ai' as const, model: 'test-model' },
  hyde: { provider: 'workers-ai' as const, model: 'test-model' },
  multiQuery: { provider: 'workers-ai' as const, model: 'test-model' },
  textToSql: { provider: 'workers-ai' as const, model: 'test-model' },
  rerank: { provider: 'workers-ai' as const, model: 'test-model' },
  judge: { provider: 'workers-ai' as const, model: 'test-model' },
  embedding: { provider: 'workers-ai' as const, model: 'test-model' },
}

const mockCache: AgentCache = {
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue(undefined),
}

function stubEnv(dbOverride?: Partial<D1Database>): Env {
  const db = {
    prepare: () => ({
      bind: () => ({
        all: async () => ({ results: [] }),
        first: async () => null,
      }),
    }),
    ...dbOverride,
  } as unknown as D1Database
  return { DB: db } as unknown as Env
}

function makeCtx(overrides: Partial<ToolContext> = {}): ToolContext {
  return {
    env: stubEnv(),
    userId: null,
    locale: 'zh-TW',
    models: MODELS,
    langfuseTrace: null,
    tracker: new DefaultTokenTracker(),
    cache: mockCache,
    availableTools: [],
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// formatSubAgentResult
// ---------------------------------------------------------------------------

describe('formatSubAgentResult', () => {
  it('formats a successful sub-agent result', () => {
    const result = formatSubAgentResult({
      answer: '推薦你爬飛簷',
      tokensUsed: 150,
      subAgent: 'recommend_agent',
    })
    expect(result.content).toBe('推薦你爬飛簷')
    expect(result.metadata).toEqual({ subAgent: 'recommend_agent', tokensUsed: 150 })
  })

  it('formats an error result', () => {
    const result = formatSubAgentResult({ error: '用戶未登入' })
    expect(result.content).toBe('用戶未登入')
    expect(result.metadata).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// wrapAsTools: recommendAgentTool
// ---------------------------------------------------------------------------

describe('recommendAgentTool (wrapped)', () => {
  it('has correct name, tags, and parameters', () => {
    expect(recommendAgentTool.name).toBe('recommend_agent')
    expect(recommendAgentTool.tags).toContain('sub-agent')
    expect(recommendAgentTool.tags).toContain('personal')
    expect(recommendAgentTool.parameters).toHaveProperty('properties')
  })

  it('prompt: 未登入顯示無法使用', () => {
    const ctx = makeCtx({ userId: null })
    expect(recommendAgentTool.prompt(ctx)).toContain('未登入')
  })

  it('prompt: 已登入顯示功能描述', () => {
    const ctx = makeCtx({ userId: 'user-1' })
    const desc = recommendAgentTool.prompt(ctx)
    expect(desc).not.toContain('未登入')
    expect(desc).toContain('推薦')
  })

  it('execute: 未登入回傳 error', async () => {
    const ctx = makeCtx({ userId: null })
    const result = await recommendAgentTool.execute({ query: '推薦路線' }, ctx)
    expect(result).toEqual({ error: '用戶未登入，無法使用此工具' })
  })

  it('execute: 已登入回傳 SubAgentToolOutput', async () => {
    const ctx = makeCtx({ userId: 'user-1' })
    const result = (await recommendAgentTool.execute({ query: '推薦路線' }, ctx)) as {
      answer: string
      subAgent: string
      tokensUsed: number
    }
    expect(result.subAgent).toBe('recommend_agent')
    expect(result.answer).toBe('mock LLM response')
    expect(result.tokensUsed).toBe(150)
  })
})

// ---------------------------------------------------------------------------
// wrapAsTools: coachingAgentTool
// ---------------------------------------------------------------------------

describe('coachingAgentTool (wrapped)', () => {
  it('has correct name and tags', () => {
    expect(coachingAgentTool.name).toBe('coaching_agent')
    expect(coachingAgentTool.tags).toContain('sub-agent')
    expect(coachingAgentTool.tags).toContain('coaching')
  })

  it('execute: 未登入回傳 error', async () => {
    const ctx = makeCtx({ userId: null })
    const result = await coachingAgentTool.execute({ query: '怎麼進步' }, ctx)
    expect(result).toEqual({ error: '用戶未登入，無法使用此工具' })
  })

  it('execute: 已登入回傳含 coaching_agent 標記', async () => {
    const ctx = makeCtx({ userId: 'user-1' })
    const result = (await coachingAgentTool.execute({ query: '怎麼進步' }, ctx)) as {
      subAgent: string
    }
    expect(result.subAgent).toBe('coaching_agent')
  })
})

// ---------------------------------------------------------------------------
// recommendSubAgent.gatherContext
// ---------------------------------------------------------------------------

describe('recommendSubAgent.gatherContext', () => {
  it('calls recommend + user_profile and returns combined context', async () => {
    const ctx = makeCtx({ userId: 'user-1' })
    const context = await recommendSubAgent.gatherContext({}, ctx)
    expect(context).toContain('使用者資料')
    expect(context).toContain('推薦路線')
    expect(context).toContain('TestUser')
  })
})

// ---------------------------------------------------------------------------
// coachingSubAgent.gatherContext
// ---------------------------------------------------------------------------

describe('coachingSubAgent.gatherContext', () => {
  it('calls suggest_training + user_profile and includes weakness analysis', async () => {
    const ctx = makeCtx({ userId: 'user-1' })
    const context = await coachingSubAgent.gatherContext({}, ctx)
    expect(context).toContain('使用者資料')
    expect(context).toContain('訓練分析')
    expect(context).toContain('弱點分析')
  })

  it('gracefully handles missing user_goals table', async () => {
    const errDb = {
      prepare: () => ({
        bind: () => ({
          all: async () => {
            throw new Error('no such table: user_goals')
          },
          first: async () => null,
        }),
      }),
    } as unknown as D1Database
    const ctx = makeCtx({ userId: 'user-1', env: { DB: errDb } as unknown as Env })
    const context = await coachingSubAgent.gatherContext({}, ctx)
    expect(context).toContain('弱點分析')
    expect(context).not.toContain('使用者目標')
  })

  it('includes goals section when user_goals exist', async () => {
    const goalsDb = {
      prepare: () => ({
        bind: () => ({
          all: async () => ({
            results: [
              { title: '挑戰 5.12', target: '5.12a', current_progress: '5.11c', status: 'active' },
            ],
          }),
          first: async () => null,
        }),
      }),
    } as unknown as D1Database
    const ctx = makeCtx({ userId: 'user-1', env: { DB: goalsDb } as unknown as Env })
    const context = await coachingSubAgent.gatherContext({}, ctx)
    expect(context).toContain('使用者目標')
    expect(context).toContain('挑戰 5.12')
  })

  it('includes personality and training school when user has quiz result', async () => {
    let queryCount = 0
    const personalityDb = {
      prepare: () => ({
        bind: () => ({
          all: async () => {
            queryCount++
            if (queryCount === 1) {
              // training_progress query
              return {
                results: [
                  { week: 1, day: 1, completed: 1 },
                  { week: 1, day: 2, completed: 1 },
                  { week: 1, day: 3, completed: 0 },
                ],
              }
            }
            // user_goals query
            return { results: [] }
          },
          first: async () => {
            // users personality_type query
            return { personality_type: 'PGB' }
          },
        }),
      }),
    } as unknown as D1Database
    const ctx = makeCtx({ userId: 'user-1', env: { DB: personalityDb } as unknown as Env })
    const context = await coachingSubAgent.gatherContext({}, ctx)
    expect(context).toContain('攀岩人格與訓練學派')
    expect(context).toContain('碎岩者')
    expect(context).toContain('MacLeod')
    expect(context).toContain('已完成 2/3')
  })

  it('omits personality section when user has no quiz result', async () => {
    const ctx = makeCtx({ userId: 'user-1' })
    const context = await coachingSubAgent.gatherContext({}, ctx)
    expect(context).not.toContain('攀岩人格與訓練學派')
  })
})

// ---------------------------------------------------------------------------
// analyzeWeaknesses
// ---------------------------------------------------------------------------

describe('analyzeWeaknesses', () => {
  it('detects type imbalance (>80% one type)', () => {
    const result = analyzeWeaknesses({
      typeDistribution: [
        { type: 'sport', count: 9 },
        { type: 'trad', count: 1 },
      ],
    })
    expect(result).toContain('類型偏科')
    expect(result).toContain('90%')
  })

  it('no type imbalance when balanced', () => {
    const result = analyzeWeaknesses({
      typeDistribution: [
        { type: 'sport', count: 5 },
        { type: 'trad', count: 5 },
      ],
    })
    expect(result).not.toContain('類型偏科')
  })

  it('detects missing onsight when redpoint exists', () => {
    const result = analyzeWeaknesses({
      styleDistribution: { redpoint: 10 },
    })
    expect(result).toContain('onsight')
  })

  it('detects high toprope ratio', () => {
    const result = analyzeWeaknesses({
      styleDistribution: { toprope: 8, lead: 2 },
    })
    expect(result).toContain('top-rope')
  })

  it('detects grade plateau', () => {
    const ascents = Array.from({ length: 5 }, (_, i) => ({
      route: `R${i}`,
      grade: '5.10a',
      type: 'sport',
      style: 'redpoint',
    }))
    const result = analyzeWeaknesses({ recentAscents: ascents })
    expect(result).toContain('停滯')
  })

  it('returns default message when data insufficient', () => {
    const result = analyzeWeaknesses({})
    expect(result).toContain('數據不足')
  })

  it('includes exercise recommendations for sport-heavy type imbalance', () => {
    const result = analyzeWeaknesses({
      typeDistribution: [
        { type: 'sport', count: 9 },
        { type: 'boulder', count: 1 },
      ],
    })
    expect(result).toContain('建議練習')
  })

  it('includes anti-style exercises when personality type is provided', () => {
    const result = analyzeWeaknesses(
      {
        typeDistribution: [
          { type: 'sport', count: 5 },
          { type: 'boulder', count: 5 },
        ],
      },
      'PGB'
    )
    expect(result).toContain('人格型態弱點')
    expect(result).toContain('建議練習')
  })

  it('structured output contains exercise arrays', () => {
    const insights = analyzeWeaknessesStructured({
      typeDistribution: [
        { type: 'boulder', count: 9 },
        { type: 'sport', count: 1 },
      ],
      styleDistribution: { redpoint: 10 },
    })
    expect(insights.length).toBeGreaterThanOrEqual(2)
    const typeInsight = insights.find((i) => i.id === 'type_imbalance')
    expect(typeInsight).toBeDefined()
    expect(typeInsight!.exercises.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// gatherContext: level exercise context
// ---------------------------------------------------------------------------

describe('coachingSubAgent level exercise context', () => {
  it('includes level training recommendations when level is present', async () => {
    const ctx = makeCtx({ userId: 'user-1' })
    const context = await coachingSubAgent.gatherContext({}, ctx)
    expect(context).toContain('等級訓練建議')
  })
})

// ---------------------------------------------------------------------------
// gatherContext: AI training history
// ---------------------------------------------------------------------------

describe('coachingSubAgent AI training history context', () => {
  it('includes training history when AI plans and progress exist', async () => {
    const historyDb = {
      prepare: (sql: string) => ({
        bind: () => ({
          all: async () => {
            if (sql.includes('training_progress')) {
              return {
                results: [
                  { week: 1, day: 1, completed: 1, notes: null },
                  { week: 1, day: 2, completed: 1, notes: '感覺很好' },
                  { week: 1, day: 3, completed: 0, notes: null },
                  { week: 2, day: 1, completed: 1, notes: null },
                  { week: 2, day: 2, completed: 0, notes: null },
                  { week: 2, day: 3, completed: 0, notes: null },
                ],
              }
            }
            return { results: [] }
          },
          first: async () => {
            if (sql.includes('personality_type') && sql.includes('users')) {
              return { personality_type: 'PGB' }
            }
            if (sql.includes('ai_training_feedback')) {
              return { rating: 'too_easy', comment: '可以再難一點' }
            }
            if (sql.includes('ai_training_plans')) {
              return {
                week_number: 2,
                difficulty_level: 3,
                source: 'ai',
                plan_content: JSON.stringify({
                  days: [
                    { title: '最大力量', exercises: [{ name: '指力板' }, { name: '核心' }] },
                    { title: '抱石循環', exercises: [{ name: '抱石' }] },
                    { title: '恢復', exercises: [{ name: '伸展' }] },
                  ],
                }),
                generated_at: '2026-09-14T00:00:00Z',
              }
            }
            return null
          },
        }),
      }),
    } as unknown as D1Database
    const ctx = makeCtx({ userId: 'user-1', env: { DB: historyDb } as unknown as Env })
    const context = await coachingSubAgent.gatherContext({}, ctx)
    expect(context).toContain('AI 訓練歷史與回饋')
    expect(context).toContain('難度 3/5')
    expect(context).toContain('AI 微調')
    expect(context).toContain('完成率')
    expect(context).toContain('常跳過的訓練日')
    expect(context).toContain('第 3 天')
    expect(context).toContain('太簡單')
    expect(context).toContain('可以再難一點')
  })

  it('omits training history when no AI plans exist', async () => {
    const ctx = makeCtx({ userId: 'user-1' })
    const context = await coachingSubAgent.gatherContext({}, ctx)
    expect(context).not.toContain('AI 訓練歷史與回饋')
  })
})
