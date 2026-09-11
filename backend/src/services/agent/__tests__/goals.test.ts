import { describe, expect, it, vi } from 'vitest'
import { GoalService } from '../../domain/goals'
import type { UserGoal } from '../../domain/goals'
import { goalsTool } from '../tools/goals'
import type { Env } from '../../../types'
import type { AgentCache } from '../cache'
import { DefaultTokenTracker } from '../tracker'
import type { ToolContext } from '../types'

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

function makeGoal(overrides: Partial<UserGoal> = {}): UserGoal {
  return {
    id: 'goal-1',
    user_id: 'user-1',
    goal_type: 'grade',
    title: '挑戰 5.12a',
    target: '5.12a',
    current_value: null,
    status: 'active',
    notes: null,
    target_date: null,
    achieved_at: null,
    created_at: '2026-09-01T00:00:00.000Z',
    updated_at: '2026-09-01T00:00:00.000Z',
    ...overrides,
  }
}

function makePrepareChain(options: {
  allResults?: unknown[]
  firstResult?: unknown
  runResult?: unknown
} = {}) {
  return () => ({
    bind: () => ({
      all: async () => ({ results: options.allResults ?? [] }),
      first: async () => options.firstResult ?? null,
      run: async () => options.runResult ?? { meta: { changes: 1 } },
    }),
  })
}

function stubDb(prepare?: ReturnType<typeof makePrepareChain>): D1Database {
  return {
    prepare: prepare ?? makePrepareChain(),
  } as unknown as D1Database
}

function stubEnv(dbOverride?: D1Database): Env {
  return { DB: dbOverride ?? stubDb() } as unknown as Env
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
// GoalService
// ---------------------------------------------------------------------------

describe('GoalService', () => {
  describe('getActiveGoals', () => {
    it('returns active goals from DB', async () => {
      const goals = [makeGoal(), makeGoal({ id: 'goal-2', title: '完攀飛簷' })]
      const db = stubDb(makePrepareChain({ allResults: goals }))
      const service = new GoalService(db)

      const result = await service.getActiveGoals('user-1')
      expect(result).toHaveLength(2)
      expect(result[0].title).toBe('挑戰 5.12a')
    })

    it('returns empty array when no goals', async () => {
      const db = stubDb(makePrepareChain({ allResults: [] }))
      const service = new GoalService(db)

      const result = await service.getActiveGoals('user-1')
      expect(result).toEqual([])
    })
  })

  describe('createGoal', () => {
    it('creates a goal and returns it with id', async () => {
      const db = stubDb()
      const service = new GoalService(db)

      const result = await service.createGoal('user-1', {
        goal_type: 'grade',
        title: '挑戰 5.12a',
        target: '5.12a',
      })

      expect(result.id).toBeTruthy()
      expect(result.user_id).toBe('user-1')
      expect(result.goal_type).toBe('grade')
      expect(result.title).toBe('挑戰 5.12a')
      expect(result.target).toBe('5.12a')
      expect(result.status).toBe('active')
      expect(result.current_value).toBeNull()
    })

    it('includes optional target_date and notes', async () => {
      const db = stubDb()
      const service = new GoalService(db)

      const result = await service.createGoal('user-1', {
        goal_type: 'route',
        title: '完攀飛簷',
        target: '飛簷',
        target_date: '2026-12-31',
        notes: '先練指力',
      })

      expect(result.target_date).toBe('2026-12-31')
      expect(result.notes).toBe('先練指力')
    })
  })

  describe('updateProgress', () => {
    it('updates current_value and returns updated goal', async () => {
      const updated = makeGoal({ current_value: '5.11b' })
      const db = stubDb(makePrepareChain({ firstResult: updated }))
      const service = new GoalService(db)

      const result = await service.updateProgress('goal-1', '5.11b')
      expect(result).not.toBeNull()
      expect(result!.current_value).toBe('5.11b')
    })
  })

  describe('achieveGoal', () => {
    it('does not throw', async () => {
      const db = stubDb()
      const service = new GoalService(db)

      await expect(service.achieveGoal('goal-1')).resolves.toBeUndefined()
    })
  })

  describe('checkGoalProgress', () => {
    it('enriches grade goal with progress note when close', async () => {
      const gradeGoal = makeGoal({ goal_type: 'grade', target: '5.12a' })
      let callCount = 0
      const db = {
        prepare: () => ({
          bind: () => ({
            all: async () => {
              callCount++
              if (callCount === 1) return { results: [gradeGoal] }
              return { results: [] }
            },
            first: async () => {
              return { max_grade: '5.11c' }
            },
          }),
        }),
      } as unknown as D1Database

      const service = new GoalService(db)
      const result = await service.checkGoalProgress('user-1')

      expect(result.activeGoals).toHaveLength(1)
      expect(result.activeGoals[0].progressNote).toContain('5.11c')
      expect(result.activeGoals[0].progressNote).toContain('5.12a')
    })

    it('detects grade goal already achieved', async () => {
      const gradeGoal = makeGoal({ goal_type: 'grade', target: '5.11a' })
      let callCount = 0
      const db = {
        prepare: () => ({
          bind: () => ({
            all: async () => {
              callCount++
              if (callCount === 1) return { results: [gradeGoal] }
              return { results: [] }
            },
            first: async () => ({ max_grade: '5.11b' }),
          }),
        }),
      } as unknown as D1Database

      const service = new GoalService(db)
      const result = await service.checkGoalProgress('user-1')

      expect(result.activeGoals[0].progressNote).toContain('已達成')
      expect(result.suggestions.length).toBeGreaterThan(0)
    })

    it('handles route goal completion check', async () => {
      const routeGoal = makeGoal({ goal_type: 'route', target: '飛簷', title: '完攀飛簷' })
      let callCount = 0
      const db = {
        prepare: () => ({
          bind: () => ({
            all: async () => {
              callCount++
              if (callCount === 1) return { results: [routeGoal] }
              return { results: [] }
            },
            first: async () => ({ id: 'ascent-1' }),
          }),
        }),
      } as unknown as D1Database

      const service = new GoalService(db)
      const result = await service.checkGoalProgress('user-1')

      expect(result.activeGoals[0].progressNote).toContain('已完攀')
      expect(result.suggestions.some((s) => s.includes('飛簷'))).toBe(true)
    })

    it('handles volume goal with monthly count', async () => {
      const volumeGoal = makeGoal({ goal_type: 'volume', target: '10', title: '本月 10 條' })
      let callCount = 0
      const db = {
        prepare: () => ({
          bind: () => ({
            all: async () => {
              callCount++
              if (callCount === 1) return { results: [volumeGoal] }
              return { results: [] }
            },
            first: async () => ({ cnt: 8 }),
          }),
        }),
      } as unknown as D1Database

      const service = new GoalService(db)
      const result = await service.checkGoalProgress('user-1')

      expect(result.activeGoals[0].progressNote).toContain('8/10')
      expect(result.suggestions.length).toBeGreaterThan(0)
      expect(result.suggestions[0]).toContain('2')
    })

    it('returns empty suggestions when no ascent records for grade goal', async () => {
      const gradeGoal = makeGoal({ goal_type: 'grade', target: '5.12a' })
      let callCount = 0
      const db = {
        prepare: () => ({
          bind: () => ({
            all: async () => {
              callCount++
              if (callCount === 1) return { results: [gradeGoal] }
              return { results: [] }
            },
            first: async () => null,
          }),
        }),
      } as unknown as D1Database

      const service = new GoalService(db)
      const result = await service.checkGoalProgress('user-1')

      expect(result.activeGoals[0].progressNote).toContain('尚無完攀記錄')
    })
  })
})

// ---------------------------------------------------------------------------
// goalsTool (manage_goals)
// ---------------------------------------------------------------------------

describe('goalsTool (manage_goals)', () => {
  describe('prompt', () => {
    it('shows login required when not authenticated', () => {
      const ctx = makeCtx({ userId: null })
      expect(goalsTool.prompt(ctx)).toContain('未登入')
    })

    it('shows full description when authenticated', () => {
      const ctx = makeCtx({ userId: 'user-1' })
      expect(goalsTool.prompt(ctx)).toContain('攀岩目標')
    })
  })

  describe('execute', () => {
    it('returns error when not authenticated', async () => {
      const ctx = makeCtx({ userId: null })
      const result = await goalsTool.execute({ action: 'list' }, ctx)
      expect(result).toEqual({ error: '用戶未登入，無法管理目標' })
    })

    it('action: list returns goals', async () => {
      const goals = [makeGoal()]
      const db = stubDb(makePrepareChain({ allResults: goals }))
      const ctx = makeCtx({ userId: 'user-1', env: stubEnv(db) })

      const result = (await goalsTool.execute({ action: 'list' }, ctx)) as {
        goals: UserGoal[]
        count: number
      }
      expect(result.count).toBe(1)
      expect(result.goals[0].title).toBe('挑戰 5.12a')
    })

    it('action: create returns error when missing fields', async () => {
      const ctx = makeCtx({ userId: 'user-1' })
      const result = await goalsTool.execute({ action: 'create' }, ctx)
      expect(result).toEqual({ error: '建立目標需要 goal_type、title 和 target' })
    })

    it('action: create returns created goal', async () => {
      const db = stubDb()
      const ctx = makeCtx({ userId: 'user-1', env: stubEnv(db) })

      const result = (await goalsTool.execute(
        { action: 'create', goal_type: 'grade', title: '挑戰 5.12', target: '5.12a' },
        ctx
      )) as { created: UserGoal }

      expect(result.created).toBeDefined()
      expect(result.created.title).toBe('挑戰 5.12')
      expect(result.created.status).toBe('active')
    })

    it('action: achieve returns error when missing goal_id', async () => {
      const ctx = makeCtx({ userId: 'user-1' })
      const result = await goalsTool.execute({ action: 'achieve' }, ctx)
      expect(result).toEqual({ error: '標記達成需要 goal_id' })
    })

    it('action: achieve returns success', async () => {
      const db = stubDb()
      const ctx = makeCtx({ userId: 'user-1', env: stubEnv(db) })

      const result = (await goalsTool.execute(
        { action: 'achieve', goal_id: 'goal-1' },
        ctx
      )) as { achieved: boolean; goal_id: string }

      expect(result.achieved).toBe(true)
      expect(result.goal_id).toBe('goal-1')
    })
  })

  describe('formatResult', () => {
    it('formats error', () => {
      const result = goalsTool.formatResult({ error: '用戶未登入' })
      expect(result.content).toBe('用戶未登入')
    })

    it('formats created goal', () => {
      const result = goalsTool.formatResult({
        created: { title: '挑戰 5.12', target: '5.12a', goal_type: 'grade' },
      })
      expect(result.content).toContain('挑戰 5.12')
      expect(result.content).toContain('5.12a')
    })

    it('formats achieved', () => {
      const result = goalsTool.formatResult({ achieved: true, goal_id: 'goal-1' })
      expect(result.content).toContain('達成')
    })

    it('formats empty goal list', () => {
      const result = goalsTool.formatResult({ goals: [], count: 0 })
      expect(result.content).toContain('沒有進行中的目標')
    })

    it('formats goal list with items', () => {
      const result = goalsTool.formatResult({
        goals: [
          { title: '挑戰 5.12', target: '5.12a', goal_type: 'grade', current_value: '5.11c' },
          { title: '完攀飛簷', target: '飛簷', goal_type: 'route', current_value: null },
        ],
        count: 2,
      })
      expect(result.content).toContain('2 個')
      expect(result.content).toContain('挑戰 5.12')
      expect(result.content).toContain('5.11c')
      expect(result.content).toContain('完攀飛簷')
    })

    it('formats progress summary with suggestions', () => {
      const result = goalsTool.formatResult({
        activeGoals: [
          { title: '挑戰 5.12', target: '5.12a', progressNote: '差 2 個子級' },
        ],
        recentlyAchieved: [{ title: '完攀飛簷' }],
        suggestions: ['你離 5.12a 只差 2 個子級了！'],
      })
      expect(result.content).toContain('挑戰 5.12')
      expect(result.content).toContain('差 2 個子級')
      expect(result.content).toContain('完攀飛簷')
      expect(result.content).toContain('只差 2 個子級')
    })
  })
})
