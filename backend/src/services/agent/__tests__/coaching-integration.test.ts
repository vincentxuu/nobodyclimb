/**
 * Coaching agent integration tests
 *
 * 驗證 gatherContext 完整流程：使用寫實的 DB mock（區分不同 SQL query），
 * 確認各 section（使用者資料、訓練分析、弱點分析、人格學派、等級建議、目標）
 * 的組裝正確性。不打 LLM API。
 */

import { describe, expect, it, vi } from 'vitest'
import type { Env } from '../../../types'
import type { AgentCache } from '../cache'
import { coachingSubAgent } from '../sub-agents/coaching-agent'
import { DefaultTokenTracker } from '../tracker'
import type { ToolContext } from '../types'

// ---------------------------------------------------------------------------
// Mock LLM provider (synthesize 不在本測試範圍)
// ---------------------------------------------------------------------------

vi.mock('../../orchestrators/ai-graph/providers', () => ({
  createProvider: () => ({
    chat: vi.fn().mockResolvedValue({
      content: 'mock LLM response',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    }),
  }),
}))

// ---------------------------------------------------------------------------
// Mock inner tools — 回傳寫實的攀登數據
// ---------------------------------------------------------------------------

vi.mock('../tools/user-profile', () => ({
  userProfileTool: {
    execute: vi.fn().mockResolvedValue({
      user: { name: 'ClimberX', personality_type: 'PGB', rank_id: 'silver', score: 120 },
      recentAscents: [
        { route_name: '飛簷走壁', grade: '5.11a', style: 'redpoint', crag_name: '龍洞' },
        { route_name: '天堂路', grade: '5.10d', style: 'onsight', crag_name: '龍洞' },
      ],
      stats: { total_ascents: 42, unique_crags: 5, highest_grade: '5.11c' },
      personalityInfo: { code: 'PGB', nameZh: '碎岩者', description: '力量、爆發、目標' },
    }),
    formatResult: vi.fn().mockReturnValue({
      content:
        '用戶：ClimberX\n等級：silver（120 分）\n' +
        '人格：碎岩者（力量、爆發、目標）\n' +
        '總完攀：42 條，去過 5 個岩場\n最高難度：5.11c',
    }),
  },
}))

vi.mock('../tools/coaching', () => ({
  suggestTrainingTool: {
    execute: vi.fn().mockResolvedValue({
      level: '中級（5.11）',
      maxGrade: 113,
      avgGrade: 108,
      totalAscents: 42,
      uniqueCrags: 5,
      recentAscents: [
        { route: '飛簷走壁', grade: '5.11a', type: 'sport', style: 'redpoint' },
        { route: '天堂路', grade: '5.10d', type: 'sport', style: 'onsight' },
        { route: '練習牆', grade: '5.10a', type: 'sport', style: 'redpoint' },
        { route: '裂縫', grade: '5.10b', type: 'sport', style: 'redpoint' },
        { route: '大展身手', grade: '5.10c', type: 'sport', style: 'redpoint' },
      ],
      typeDistribution: [
        { type: 'sport', count: 38 },
        { type: 'boulder', count: 4 },
      ],
      styleDistribution: { redpoint: 30, onsight: 8, toprope: 4 },
      focus: null,
    }),
    formatResult: vi.fn().mockReturnValue({
      content:
        '攀登程度：中級（5.11）\n' +
        '總完攀：42 條，去過 5 個岩場\n' +
        '攀登類型分佈：運攀 38 條、抱石 4 條\n' +
        '攀登風格：redpoint 30 次、onsight 8 次、toprope 4 次',
    }),
  },
}))

// ---------------------------------------------------------------------------
// Realistic D1 DB mock — 根據 SQL query 回傳不同結果
// ---------------------------------------------------------------------------

function createRealisticDb(opts: {
  personalityType?: string | null
  trainingProgress?: Array<{ week: number; day: number; completed: number }>
  goals?: Array<{ title: string; target: string; current_progress: string | null; status: string }>
}) {
  return {
    prepare: (sql: string) => ({
      bind: (..._args: unknown[]) => ({
        first: async () => {
          if (sql.includes('personality_type') && sql.includes('users')) {
            return opts.personalityType
              ? { personality_type: opts.personalityType }
              : null
          }
          return null
        },
        all: async () => {
          if (sql.includes('training_progress')) {
            return { results: opts.trainingProgress ?? [] }
          }
          if (sql.includes('user_goals')) {
            return { results: opts.goals ?? [] }
          }
          return { results: [] }
        },
      }),
    }),
  } as unknown as D1Database
}

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

function makeCtx(db: D1Database, userId: string | null = 'user-1'): ToolContext {
  return {
    env: { DB: db } as unknown as Env,
    userId,
    locale: 'zh-TW',
    models: MODELS,
    langfuseTrace: null,
    tracker: new DefaultTokenTracker(),
    cache: mockCache,
    availableTools: [],
  }
}

// ---------------------------------------------------------------------------
// Tests: 完整用戶（有攀登記錄 + 人格 + 訓練進度 + 目標）
// ---------------------------------------------------------------------------

describe('coaching gatherContext integration: 完整用戶', () => {
  const db = createRealisticDb({
    personalityType: 'PGB',
    trainingProgress: [
      { week: 1, day: 1, completed: 1 },
      { week: 1, day: 2, completed: 1 },
      { week: 1, day: 3, completed: 1 },
      { week: 2, day: 1, completed: 1 },
      { week: 2, day: 2, completed: 0 },
      { week: 2, day: 3, completed: 0 },
    ],
    goals: [
      { title: '挑戰 5.12', target: '5.12a', current_progress: '5.11c', status: 'active' },
      { title: '龍洞全路線', target: '完攀 50 條', current_progress: '42 條', status: 'active' },
    ],
  })

  let context: string

  it('gatherContext assembles all sections', async () => {
    const ctx = makeCtx(db)
    context = await coachingSubAgent.gatherContext({}, ctx)

    expect(context).toContain('【使用者資料】')
    expect(context).toContain('【訓練分析】')
    expect(context).toContain('【弱點分析】')
    expect(context).toContain('【攀岩人格與訓練學派】')
    expect(context).toContain('【等級訓練建議】')
    expect(context).toContain('【使用者目標】')
  })

  it('personality section contains correct type and school', async () => {
    const ctx = makeCtx(db)
    context = await coachingSubAgent.gatherContext({}, ctx)

    expect(context).toContain('碎岩者')
    expect(context).toContain('Crusher')
    expect(context).toContain('PGB')
    expect(context).toContain('MacLeod')
  })

  it('personality section contains training progress', async () => {
    const ctx = makeCtx(db)
    context = await coachingSubAgent.gatherContext({}, ctx)

    expect(context).toContain('已完成 4/6')
    expect(context).toContain('第 2 週第 1 天')
  })

  it('weakness analysis includes exercise recommendations', async () => {
    const ctx = makeCtx(db)
    context = await coachingSubAgent.gatherContext({}, ctx)

    expect(context).toContain('類型偏科')
    expect(context).toContain('建議練習')
  })

  it('weakness analysis includes anti-style for PGB personality', async () => {
    const ctx = makeCtx(db)
    context = await coachingSubAgent.gatherContext({}, ctx)

    expect(context).toContain('人格型態弱點')
  })

  it('level exercise context contains intermediate recommendations', async () => {
    const ctx = makeCtx(db)
    context = await coachingSubAgent.gatherContext({}, ctx)

    expect(context).toContain('中級者')
    expect(context).toContain('推薦練習')
    expect(context).toContain('每週')
  })

  it('goals section contains both goals', async () => {
    const ctx = makeCtx(db)
    context = await coachingSubAgent.gatherContext({}, ctx)

    expect(context).toContain('挑戰 5.12')
    expect(context).toContain('龍洞全路線')
    expect(context).toContain('目前進度 5.11c')
  })
})

// ---------------------------------------------------------------------------
// Tests: 新用戶（無攀登記錄、無人格）
// ---------------------------------------------------------------------------

describe('coaching gatherContext integration: 新用戶', () => {
  const db = createRealisticDb({
    personalityType: null,
    trainingProgress: [],
    goals: [],
  })

  it('has basic sections but no personality or goals', async () => {
    const ctx = makeCtx(db)
    const context = await coachingSubAgent.gatherContext({}, ctx)

    expect(context).toContain('【使用者資料】')
    expect(context).toContain('【訓練分析】')
    expect(context).toContain('【弱點分析】')
    expect(context).toContain('【等級訓練建議】')

    expect(context).not.toContain('【攀岩人格與訓練學派】')
    expect(context).not.toContain('【使用者目標】')
  })
})

// ---------------------------------------------------------------------------
// Tests: 有人格但無訓練進度
// ---------------------------------------------------------------------------

describe('coaching gatherContext integration: 有人格無進度', () => {
  const db = createRealisticDb({
    personalityType: 'TFS',
    trainingProgress: [],
    goals: [],
  })

  it('has personality section without progress info', async () => {
    const ctx = makeCtx(db)
    const context = await coachingSubAgent.gatherContext({}, ctx)

    expect(context).toContain('【攀岩人格與訓練學派】')
    expect(context).toContain('禪者')
    expect(context).toContain('Anderson')
    expect(context).not.toContain('訓練進度')
    expect(context).not.toContain('已完成')
  })
})

// ---------------------------------------------------------------------------
// Tests: 未登入用戶
// ---------------------------------------------------------------------------

describe('coaching gatherContext integration: 未登入', () => {
  const db = createRealisticDb({ personalityType: null })

  it('still produces context without personality or goals', async () => {
    const ctx = makeCtx(db, null)
    const context = await coachingSubAgent.gatherContext({}, ctx)

    expect(context).toContain('【使用者資料】')
    expect(context).toContain('【訓練分析】')
    expect(context).not.toContain('【攀岩人格與訓練學派】')
  })
})
