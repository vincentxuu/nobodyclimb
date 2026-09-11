import { describe, expect, it, vi } from 'vitest'
import type { Env } from '../../../types'
import type { AgentCache } from '../cache'
import { DefaultTokenTracker } from '../tracker'
import type { ToolContext } from '../types'
import { suggestTrainingTool } from '../tools/coaching'
import { recallMemoryTool } from '../tools/memory'

// ---------------------------------------------------------------------------
// Mock repositories/memory
// ---------------------------------------------------------------------------

vi.mock('../../../repositories/memory', () => ({
  getUserMemories: vi.fn(),
  getMemoriesSummary: vi.fn(),
}))

import { getMemoriesSummary, getUserMemories } from '../../../repositories/memory'

const mockedGetUserMemories = vi.mocked(getUserMemories)
const mockedGetMemoriesSummary = vi.mocked(getMemoriesSummary)

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

function stubEnv(dbOverride?: D1Database): Env {
  const db: D1Database =
    dbOverride ??
    ({
      prepare: () => ({
        bind: () => ({ all: async () => ({ results: [] }), first: async () => null }),
      }),
    } as unknown as D1Database)
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
// recallMemoryTool
// ---------------------------------------------------------------------------

describe('recallMemoryTool', () => {
  it('prompt: 未登入顯示無法使用', () => {
    const ctx = makeCtx({ userId: null })
    expect(recallMemoryTool.prompt(ctx)).toContain('未登入')
  })

  it('prompt: 已登入顯示正常描述', () => {
    const ctx = makeCtx({ userId: 'user-1' })
    const desc = recallMemoryTool.prompt(ctx)
    expect(desc).toContain('偏好')
    expect(desc).not.toContain('未登入')
  })

  it('execute: 未登入回傳 error', async () => {
    const ctx = makeCtx({ userId: null })
    const result = await recallMemoryTool.execute({}, ctx)
    expect(result).toEqual({ error: '用戶未登入，無法查詢記憶' })
  })

  it('execute: 無 query 回傳摘要', async () => {
    mockedGetMemoriesSummary.mockResolvedValueOnce('喜歡運攀，目標 5.12')
    const ctx = makeCtx({ userId: 'user-1' })
    const result = (await recallMemoryTool.execute({}, ctx)) as {
      summary: string
      hasMemories: boolean
    }
    expect(result.summary).toBe('喜歡運攀，目標 5.12')
    expect(result.hasMemories).toBe(true)
    expect(mockedGetMemoriesSummary).toHaveBeenCalledWith('user-1', ctx.env.DB)
  })

  it('execute: 無 query 且無記憶', async () => {
    mockedGetMemoriesSummary.mockResolvedValueOnce(null)
    const ctx = makeCtx({ userId: 'user-1' })
    const result = (await recallMemoryTool.execute({}, ctx)) as {
      summary: string | null
      hasMemories: boolean
    }
    expect(result.hasMemories).toBe(false)
  })

  it('execute: 有 query 過濾記憶', async () => {
    mockedGetUserMemories.mockResolvedValueOnce([
      {
        id: '1',
        user_id: 'user-1',
        memory_key: 'climbing_preference',
        memory_type: 'preference',
        content: '喜歡運攀',
        updated_at: '2026-01-01',
      },
      {
        id: '2',
        user_id: 'user-1',
        memory_key: 'goal',
        memory_type: 'fact',
        content: '目標是完攀 5.12',
        updated_at: '2026-01-01',
      },
    ])
    const ctx = makeCtx({ userId: 'user-1' })
    const result = (await recallMemoryTool.execute({ query: '運攀' }, ctx)) as {
      memories: unknown[]
      count: number
      totalMemories: number
    }
    expect(result.count).toBe(1)
    expect(result.totalMemories).toBe(2)
  })

  it('formatResult: error', () => {
    const r = recallMemoryTool.formatResult({ error: '用戶未登入' })
    expect(r.content).toBe('用戶未登入')
  })

  it('formatResult: 有記憶摘要', () => {
    const r = recallMemoryTool.formatResult({
      summary: '喜歡運攀',
      hasMemories: true,
    })
    expect(r.content).toContain('喜歡運攀')
  })

  it('formatResult: 無記憶', () => {
    const r = recallMemoryTool.formatResult({
      summary: null,
      hasMemories: false,
    })
    expect(r.content).toContain('沒有儲存任何記憶')
  })

  it('formatResult: filtered memories 有結果', () => {
    const r = recallMemoryTool.formatResult({
      memories: [{ key: 'pref', type: 'preference', content: '喜歡傳攀' }],
      count: 1,
      totalMemories: 3,
    })
    expect(r.content).toContain('1 筆')
    expect(r.content).toContain('喜歡傳攀')
  })

  it('formatResult: filtered memories 無結果', () => {
    const r = recallMemoryTool.formatResult({
      memories: [],
      count: 0,
      totalMemories: 5,
    })
    expect(r.content).toContain('未找到')
    expect(r.content).toContain('5')
  })
})

// ---------------------------------------------------------------------------
// suggestTrainingTool
// ---------------------------------------------------------------------------

describe('suggestTrainingTool', () => {
  it('prompt: 未登入顯示無法使用', () => {
    const ctx = makeCtx({ userId: null })
    expect(suggestTrainingTool.prompt(ctx)).toContain('未登入')
  })

  it('prompt: 已登入顯示正常描述', () => {
    const ctx = makeCtx({ userId: 'user-1' })
    const desc = suggestTrainingTool.prompt(ctx)
    expect(desc).toContain('訓練')
    expect(desc).not.toContain('未登入')
  })

  it('execute: 未登入回傳 error', async () => {
    const ctx = makeCtx({ userId: null })
    const result = await suggestTrainingTool.execute({}, ctx)
    expect(result).toEqual({ error: '用戶未登入，無法產生訓練建議' })
  })

  it('execute: 有 userId 回傳分析結果', async () => {
    let queryIdx = 0
    const db = {
      prepare: () => ({
        bind: () => ({
          all: async () => {
            const results = [
              {
                results: [
                  {
                    route_name: '一陽指',
                    grade: '5.10a',
                    route_type: 'sport',
                    style: 'redpoint',
                    crag_name: '龍洞',
                    ascent_date: '2026-08-01',
                  },
                  {
                    route_name: '飛簷',
                    grade: '5.11b',
                    route_type: 'trad',
                    style: 'onsight',
                    crag_name: '龍洞',
                    ascent_date: '2026-07-15',
                  },
                ],
              },
              {
                results: [
                  { route_type: 'sport', cnt: 5 },
                  { route_type: 'trad', cnt: 2 },
                ],
              },
            ]
            return results[queryIdx++] ?? { results: [] }
          },
          first: async () => ({ total_ascents: 7, unique_crags: 2 }),
        }),
      }),
    } as unknown as D1Database

    const ctx = makeCtx({
      userId: 'user-1',
      env: stubEnv(db),
    })

    const result = (await suggestTrainingTool.execute({}, ctx)) as {
      level: string
      maxGrade: number
      totalAscents: number
      typeDistribution: Array<{ type: string; count: number }>
      focus: string | null
    }

    expect(result.level).toBe('中級（5.11）')
    expect(result.maxGrade).toBe(111)
    expect(result.totalAscents).toBe(7)
    expect(result.typeDistribution).toEqual([
      { type: 'sport', count: 5 },
      { type: 'trad', count: 2 },
    ])
    expect(result.focus).toBeNull()
  })

  it('execute: focus 參數正確傳遞', async () => {
    const ctx = makeCtx({
      userId: 'user-1',
      env: stubEnv(),
    })

    const result = (await suggestTrainingTool.execute({ focus: '指力' }, ctx)) as {
      focus: string | null
    }
    expect(result.focus).toBe('指力')
  })

  it('formatResult: error', () => {
    const r = suggestTrainingTool.formatResult({ error: '用戶未登入' })
    expect(r.content).toBe('用戶未登入')
  })

  it('formatResult: 完整結果', () => {
    const r = suggestTrainingTool.formatResult({
      level: '中級（5.11）',
      maxGrade: 111,
      avgGrade: 105,
      totalAscents: 10,
      uniqueCrags: 3,
      recentAscents: [
        { route: '一陽指', grade: '5.10a', type: 'sport', style: 'redpoint' },
      ],
      typeDistribution: [
        { type: 'sport', count: 7 },
        { type: 'trad', count: 3 },
      ],
      styleDistribution: { redpoint: 6, onsight: 4 },
      focus: '指力',
    })

    expect(r.content).toContain('中級（5.11）')
    expect(r.content).toContain('10 條')
    expect(r.content).toContain('3 個岩場')
    expect(r.content).toContain('運攀 7 條')
    expect(r.content).toContain('傳攀 3 條')
    expect(r.content).toContain('redpoint 6 次')
    expect(r.content).toContain('一陽指')
    expect(r.content).toContain('指力')
  })

  it('formatResult: 無攀登記錄', () => {
    const r = suggestTrainingTool.formatResult({
      level: '入門（5.9 以下）',
      maxGrade: null,
      avgGrade: null,
      totalAscents: 0,
      uniqueCrags: 0,
      recentAscents: [],
      typeDistribution: [],
      styleDistribution: {},
      focus: null,
    })

    expect(r.content).toContain('入門')
    expect(r.content).toContain('0 條')
    expect(r.content).not.toContain('近期完攀')
    expect(r.content).not.toContain('訓練重點')
  })
})
