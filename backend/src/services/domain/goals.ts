import { gradeToNumeric } from '../core/climbing-schema'

export interface UserGoal {
  id: string
  user_id: string
  goal_type: 'grade' | 'route' | 'volume' | 'custom'
  title: string
  target: string
  current_value: string | null
  status: 'active' | 'achieved' | 'paused' | 'abandoned'
  notes: string | null
  target_date: string | null
  achieved_at: string | null
  created_at: string
  updated_at: string
}

export interface GoalProgressSummary {
  activeGoals: Array<UserGoal & { progressNote?: string }>
  recentlyAchieved: UserGoal[]
  suggestions: string[]
}

export class GoalService {
  constructor(private db: D1Database) {}

  async getActiveGoals(userId: string): Promise<UserGoal[]> {
    const result = await this.db
      .prepare("SELECT * FROM user_goals WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC")
      .bind(userId)
      .all<UserGoal>()
    return result.results ?? []
  }

  async createGoal(
    userId: string,
    goal: {
      goal_type: UserGoal['goal_type']
      title: string
      target: string
      target_date?: string
      notes?: string
    }
  ): Promise<UserGoal> {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    await this.db
      .prepare(
        'INSERT INTO user_goals (id, user_id, goal_type, title, target, target_date, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(id, userId, goal.goal_type, goal.title, goal.target, goal.target_date ?? null, goal.notes ?? null, now, now)
      .run()

    return {
      id,
      user_id: userId,
      goal_type: goal.goal_type,
      title: goal.title,
      target: goal.target,
      current_value: null,
      status: 'active',
      notes: goal.notes ?? null,
      target_date: goal.target_date ?? null,
      achieved_at: null,
      created_at: now,
      updated_at: now,
    }
  }

  async updateProgress(goalId: string, currentValue: string): Promise<UserGoal | null> {
    const now = new Date().toISOString()
    await this.db
      .prepare('UPDATE user_goals SET current_value = ?, updated_at = ? WHERE id = ?')
      .bind(currentValue, now, goalId)
      .run()
    return this.db.prepare('SELECT * FROM user_goals WHERE id = ?').bind(goalId).first<UserGoal>()
  }

  async achieveGoal(goalId: string): Promise<void> {
    const now = new Date().toISOString()
    await this.db
      .prepare("UPDATE user_goals SET status = 'achieved', achieved_at = ?, updated_at = ? WHERE id = ?")
      .bind(now, now, goalId)
      .run()
  }

  async checkGoalProgress(userId: string): Promise<GoalProgressSummary> {
    const [activeGoals, recentlyAchieved] = await Promise.all([
      this.getActiveGoals(userId),
      this.db
        .prepare(
          "SELECT * FROM user_goals WHERE user_id = ? AND status = 'achieved' ORDER BY achieved_at DESC LIMIT 3"
        )
        .bind(userId)
        .all<UserGoal>()
        .then((r) => r.results ?? []),
    ])

    const enriched: Array<UserGoal & { progressNote?: string }> = []
    const suggestions: string[] = []

    for (const goal of activeGoals) {
      const entry: UserGoal & { progressNote?: string } = { ...goal }

      if (goal.goal_type === 'grade') {
        const note = await this.checkGradeProgress(userId, goal)
        if (note) entry.progressNote = note.note
        if (note?.suggestion) suggestions.push(note.suggestion)
      } else if (goal.goal_type === 'route') {
        const note = await this.checkRouteProgress(userId, goal)
        if (note) entry.progressNote = note.note
        if (note?.suggestion) suggestions.push(note.suggestion)
      } else if (goal.goal_type === 'volume') {
        const note = await this.checkVolumeProgress(userId, goal)
        if (note) entry.progressNote = note.note
        if (note?.suggestion) suggestions.push(note.suggestion)
      }

      enriched.push(entry)
    }

    return { activeGoals: enriched, recentlyAchieved, suggestions }
  }

  private async checkGradeProgress(
    userId: string,
    goal: UserGoal
  ): Promise<{ note: string; suggestion?: string } | null> {
    const targetNumeric = gradeToNumeric(goal.target)
    if (targetNumeric === 0) return null

    const highest = await this.db
      .prepare(
        `SELECT MAX(r.grade) as max_grade FROM user_route_ascents ra
         LEFT JOIN routes r ON ra.route_id = r.id
         WHERE ra.user_id = ?`
      )
      .bind(userId)
      .first<{ max_grade: string | null }>()

    if (!highest?.max_grade) return { note: '尚無完攀記錄' }

    const currentNumeric = gradeToNumeric(highest.max_grade)
    const diff = targetNumeric - currentNumeric

    if (diff <= 0) {
      return {
        note: `已達成！目前最高 ${highest.max_grade}，目標 ${goal.target}`,
        suggestion: `你已經達到 ${goal.target} 的目標了！考慮設定新的挑戰？`,
      }
    }
    if (diff <= 3) {
      return {
        note: `接近達成！目前最高 ${highest.max_grade}，距離目標 ${goal.target} 差 ${diff} 個子級`,
        suggestion: `你離 ${goal.target} 只差 ${diff} 個子級了，繼續加油！`,
      }
    }
    return {
      note: `目前最高 ${highest.max_grade}，距離目標 ${goal.target} 差 ${diff} 個子級`,
    }
  }

  private async checkRouteProgress(
    userId: string,
    goal: UserGoal
  ): Promise<{ note: string; suggestion?: string } | null> {
    const completed = await this.db
      .prepare(
        `SELECT ra.id FROM user_route_ascents ra
         LEFT JOIN routes r ON ra.route_id = r.id
         WHERE ra.user_id = ? AND r.name LIKE ?
         LIMIT 1`
      )
      .bind(userId, `%${goal.target}%`)
      .first()

    if (completed) {
      return {
        note: `已完攀 ${goal.target}！`,
        suggestion: `恭喜完攀 ${goal.target}！要設定下一個目標路線嗎？`,
      }
    }
    return { note: `尚未完攀 ${goal.target}` }
  }

  private async checkVolumeProgress(
    userId: string,
    goal: UserGoal
  ): Promise<{ note: string; suggestion?: string } | null> {
    const targetCount = parseInt(goal.target, 10)
    if (isNaN(targetCount)) return null

    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const result = await this.db
      .prepare(
        'SELECT COUNT(*) as cnt FROM user_route_ascents WHERE user_id = ? AND ascent_date >= ?'
      )
      .bind(userId, startOfMonth.toISOString())
      .first<{ cnt: number }>()

    const current = result?.cnt ?? 0
    const remaining = targetCount - current

    if (remaining <= 0) {
      return {
        note: `已達成！本月完攀 ${current} 條（目標 ${targetCount} 條）`,
        suggestion: `本月目標 ${targetCount} 條已達成，太強了！`,
      }
    }
    return {
      note: `本月完攀 ${current}/${targetCount} 條，還差 ${remaining} 條`,
      suggestion: remaining <= 2 ? `再 ${remaining} 條就達成本月目標了！` : undefined,
    }
  }
}
