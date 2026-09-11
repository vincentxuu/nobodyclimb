import { describe, expect, it } from 'vitest'
import { buildProactivePromptSection, gatherProactiveContext } from '../proactive'

function stubDb(
  ascents: Array<{ route_name: string; grade: string | null; crag_name: string | null; ascent_date: string }> = [],
  goals: Array<{ goal_type: string; target: string; current_progress: string | null; status: string }> = [],
  goalsTableExists = true
): D1Database {
  let callIndex = 0
  return {
    prepare: () => ({
      bind: () => ({
        all: async () => {
          const idx = callIndex++
          if (idx === 0) return { results: ascents }
          if (!goalsTableExists) throw new Error('no such table: user_goals')
          return { results: goals }
        },
      }),
    }),
  } as unknown as D1Database
}

// ---------------------------------------------------------------------------
// gatherProactiveContext
// ---------------------------------------------------------------------------

describe('gatherProactiveContext', () => {
  it('userId 為 null → 回傳空 context', async () => {
    const ctx = await gatherProactiveContext(stubDb(), null)
    expect(ctx).toEqual({})
  })

  it('有近期完攀 → recentActivity 有值', async () => {
    const db = stubDb([
      { route_name: '飛簷', grade: '5.11a', crag_name: '龍洞', ascent_date: '2026-09-11' },
      { route_name: '天天天藍', grade: '5.10d', crag_name: '龍洞', ascent_date: '2026-09-10' },
    ])
    const ctx = await gatherProactiveContext(db, 'user-1')
    expect(ctx.recentActivity).toBeDefined()
    expect(ctx.recentActivity).toContain('2 條路線')
    expect(ctx.recentActivity).toContain('5.11a')
    expect(ctx.recentActivity).toContain('龍洞')
  })

  it('無完攀 → recentActivity 為 undefined', async () => {
    const ctx = await gatherProactiveContext(stubDb(), 'user-1')
    expect(ctx.recentActivity).toBeUndefined()
  })

  it('user_goals 表不存在 → graceful fallback', async () => {
    const db = stubDb([], [], false)
    const ctx = await gatherProactiveContext(db, 'user-1')
    expect(ctx.goalHints).toBeUndefined()
  })

  it('有 active 目標 → goalHints 有值', async () => {
    const db = stubDb([], [
      { goal_type: 'grade', target: '5.12a', current_progress: '5.11c', status: 'active' },
    ])
    const ctx = await gatherProactiveContext(db, 'user-1')
    expect(ctx.goalHints).toBeDefined()
    expect(ctx.goalHints).toHaveLength(1)
    expect(ctx.goalHints![0]).toContain('5.12a')
    expect(ctx.goalHints![0]).toContain('5.11c')
  })

  it('多個岩場 → recentActivity 列出所有岩場', async () => {
    const db = stubDb([
      { route_name: '飛簷', grade: '5.11a', crag_name: '龍洞', ascent_date: '2026-09-11' },
      { route_name: '小精靈', grade: '5.10a', crag_name: '墾丁', ascent_date: '2026-09-10' },
    ])
    const ctx = await gatherProactiveContext(db, 'user-1')
    expect(ctx.recentActivity).toContain('龍洞')
    expect(ctx.recentActivity).toContain('墾丁')
  })

  it('多個目標 → goalHints 多項', async () => {
    const db = stubDb([], [
      { goal_type: 'grade', target: '5.12a', current_progress: null, status: 'active' },
      { goal_type: 'route', target: '飛簷', current_progress: null, status: 'active' },
    ])
    const ctx = await gatherProactiveContext(db, 'user-1')
    expect(ctx.goalHints).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// buildProactivePromptSection
// ---------------------------------------------------------------------------

describe('buildProactivePromptSection', () => {
  it('空 context → 回傳 null', () => {
    expect(buildProactivePromptSection({})).toBeNull()
  })

  it('有 recentActivity → 包含活動內容', () => {
    const result = buildProactivePromptSection({ recentActivity: '最近 7 天完攀 3 條路線' })
    expect(result).toContain('最近 7 天完攀 3 條路線')
  })

  it('有 goalHints → 包含目標內容', () => {
    const result = buildProactivePromptSection({ goalHints: ['目標：5.12a（進度：5.11c）'] })
    expect(result).toContain('目標：5.12a')
  })

  it('結果包含自然提及的 guard 文字', () => {
    const result = buildProactivePromptSection({ recentActivity: '完攀 1 條' })
    expect(result).toContain('自然相關')
  })

  it('有 memoryHighlights → 包含記憶內容', () => {
    const result = buildProactivePromptSection({ memoryHighlights: ['喜歡運攀'] })
    expect(result).toContain('喜歡運攀')
  })

  it('同時有多種 context → 全部包含', () => {
    const result = buildProactivePromptSection({
      recentActivity: '完攀 2 條',
      goalHints: ['目標：5.12'],
      memoryHighlights: ['偏好龍洞'],
    })
    expect(result).toContain('完攀 2 條')
    expect(result).toContain('目標：5.12')
    expect(result).toContain('偏好龍洞')
  })
})
