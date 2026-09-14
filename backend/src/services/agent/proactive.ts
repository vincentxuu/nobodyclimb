import { gradeToNumeric } from '../core/climbing-schema'

export interface ProactiveContext {
  recentActivity?: string
  goalHints?: string[]
  memoryHighlights?: string[]
}

interface RecentAscentRow {
  route_name: string
  grade: string | null
  crag_name: string | null
  ascent_date: string
}

interface GoalRow {
  goal_type: string
  target: string
  current_progress: string | null
  status: string
}

async function getRecentWeekAscents(db: D1Database, userId: string): Promise<RecentAscentRow[]> {
  try {
    const result = await db
      .prepare(
        `SELECT r.name AS route_name, r.grade, c.name AS crag_name, a.ascent_date
         FROM user_route_ascents a
         JOIN routes r ON a.route_id = r.id
         LEFT JOIN crags c ON r.crag_id = c.id
         WHERE a.user_id = ? AND a.ascent_date >= date('now', '-7 days')
         ORDER BY a.ascent_date DESC
         LIMIT 10`
      )
      .bind(userId)
      .all<RecentAscentRow>()
    return result.results ?? []
  } catch {
    return []
  }
}

async function getActiveGoals(db: D1Database, userId: string): Promise<GoalRow[]> {
  try {
    const result = await db
      .prepare(
        `SELECT goal_type, target, current_progress, status
         FROM user_goals
         WHERE user_id = ? AND status = 'active'
         ORDER BY created_at DESC
         LIMIT 5`
      )
      .bind(userId)
      .all<GoalRow>()
    return result.results ?? []
  } catch {
    return []
  }
}

export async function gatherProactiveContext(
  db: D1Database,
  userId: string | null
): Promise<ProactiveContext> {
  if (!userId) return {}

  const [weekAscents, goals] = await Promise.all([
    getRecentWeekAscents(db, userId),
    getActiveGoals(db, userId),
  ])

  const ctx: ProactiveContext = {}

  if (weekAscents.length > 0) {
    const maxGrade = weekAscents.reduce((best, a) => {
      const n = gradeToNumeric(a.grade)
      return n > gradeToNumeric(best) ? (a.grade ?? best) : best
    }, '')
    const crags = [...new Set(weekAscents.map((a) => a.crag_name).filter(Boolean))]
    const parts = [`最近 7 天完攀 ${weekAscents.length} 條路線`]
    if (maxGrade) parts[0] += `（最高 ${maxGrade}）`
    if (crags.length > 0) parts.push(`去了${crags.join('、')}`)
    ctx.recentActivity = parts.join('，')
  }

  if (goals.length > 0) {
    ctx.goalHints = goals.map((g) => {
      let hint = `目標：${g.target}`
      if (g.current_progress) hint += `（進度：${g.current_progress}）`
      return hint
    })
  }

  return ctx
}

export function buildProactivePromptSection(ctx: ProactiveContext): string | null {
  const lines: string[] = []

  if (ctx.recentActivity) lines.push(`- ${ctx.recentActivity}`)
  if (ctx.goalHints) {
    for (const hint of ctx.goalHints) lines.push(`- ${hint}`)
  }
  if (ctx.memoryHighlights) {
    for (const h of ctx.memoryHighlights) lines.push(`- ${h}`)
  }

  if (lines.length === 0) return null

  return `【使用者近況（自然相關時可提及，不要每次都主動說）】\n${lines.join('\n')}`
}
