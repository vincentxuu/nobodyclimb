import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import {
  TRAINING_BY_LEVEL,
  getExerciseById,
  getPersonalityType,
  getTrainingSchoolMapping,
} from '@nobodyclimb/constants'
import type { PersonalityTypeCode } from '@nobodyclimb/types'
import { gradeToNumeric } from '../services/core/climbing-schema'
import { analyzeWeaknessesStructured } from '../services/agent/sub-agents/weakness-analysis'
import { authMiddleware } from '../middleware/auth'
import type { Env } from '../types'

export const coachingRoutes = new Hono<{ Bindings: Env }>()

function resolveLevel(maxGrade: number | null): {
  key: 'beginner' | 'intermediate' | 'advanced'
  label: string
} {
  if (!maxGrade || maxGrade < 100) return { key: 'beginner', label: '入門（5.9 以下）' }
  if (maxGrade < 110) return { key: 'beginner', label: '進階入門（5.10）' }
  if (maxGrade < 120) return { key: 'intermediate', label: '中級（5.11）' }
  if (maxGrade < 130) return { key: 'intermediate', label: '中高級（5.12）' }
  return { key: 'advanced', label: '高級（5.13+）' }
}

coachingRoutes.get(
  '/analysis',
  describeRoute({
    tags: ['AI'],
    summary: '取得用戶的教練分析結構化資料',
    description:
      '回傳用戶的攀登等級、人格型態、弱點分析（含推薦練習）、等級訓練建議、訓練進度、目標。純資料組裝，不呼叫 LLM。',
    responses: {
      200: { description: '成功取得教練分析' },
      401: { description: '未授權' },
    },
  }),
  authMiddleware,
  async (c) => {
    const userId = c.get('userId')
    const db = c.env.DB

    const [user, recentAscents, stats, typeDistribution] = await Promise.all([
      db
        .prepare(
          `SELECT u.id, COALESCE(u.display_name, u.username) AS name, u.personality_type
           FROM users u WHERE u.id = ?`
        )
        .bind(userId)
        .first<{ id: string; name: string; personality_type: string | null }>(),

      db
        .prepare(
          `SELECT r.name AS route_name, r.grade, r.route_type, ra.ascent_type AS style,
                  c.name AS crag_name, ra.ascent_date
           FROM user_route_ascents ra
           LEFT JOIN routes r ON ra.route_id = r.id
           LEFT JOIN crags c ON r.crag_id = c.id
           WHERE ra.user_id = ?
           ORDER BY ra.ascent_date DESC LIMIT 20`
        )
        .bind(userId)
        .all<{
          route_name: string
          grade: string
          route_type: string
          style: string
          crag_name: string | null
          ascent_date: string
        }>(),

      db
        .prepare(
          `SELECT COUNT(*) as total_ascents, COUNT(DISTINCT r.crag_id) as unique_crags
           FROM user_route_ascents ra
           LEFT JOIN routes r ON ra.route_id = r.id
           WHERE ra.user_id = ?`
        )
        .bind(userId)
        .first<{ total_ascents: number; unique_crags: number }>(),

      db
        .prepare(
          `SELECT r.route_type, COUNT(*) as cnt
           FROM user_route_ascents ra
           LEFT JOIN routes r ON ra.route_id = r.id
           WHERE ra.user_id = ? AND r.route_type IS NOT NULL
           GROUP BY r.route_type ORDER BY cnt DESC`
        )
        .bind(userId)
        .all<{ route_type: string; cnt: number }>(),
    ])

    const ascents = recentAscents.results ?? []
    const gradeNumerics = ascents.map((a) => gradeToNumeric(a.grade)).filter((n) => n > 0)
    const maxGrade = gradeNumerics.length > 0 ? Math.max(...gradeNumerics) : null

    const { key: levelKey, label: levelLabel } = resolveLevel(maxGrade)

    const styleCount: Record<string, number> = {}
    for (const a of ascents) {
      if (a.style) styleCount[a.style] = (styleCount[a.style] || 0) + 1
    }

    const trainingData = {
      level: levelLabel,
      typeDistribution: (typeDistribution.results ?? []).map((t) => ({
        type: t.route_type,
        count: t.cnt,
      })),
      styleDistribution: styleCount,
      recentAscents: ascents.slice(0, 5).map((a) => ({
        route: a.route_name,
        grade: a.grade,
        type: a.route_type,
        style: a.style,
      })),
    }

    const personalityTypeCode = user?.personality_type ?? null

    // Personality
    let personality = null
    if (personalityTypeCode) {
      const pt = getPersonalityType(personalityTypeCode as PersonalityTypeCode)
      const school = getTrainingSchoolMapping(personalityTypeCode as PersonalityTypeCode)
      if (pt && school) {
        personality = {
          code: pt.code,
          nameZh: pt.nameZh,
          nameEn: pt.nameEn,
          keywords: pt.keywords,
          strengths: pt.strengths,
          blindSpots: pt.blindSpots,
          trainingSchool: school.trainingSchoolZh,
          schoolDescription: school.schoolDescription,
        }
      }
    }

    // Weaknesses
    const weaknesses = analyzeWeaknessesStructured(trainingData, personalityTypeCode)

    // Level recommendation
    const levelRec = TRAINING_BY_LEVEL.find((l) => l.level === levelKey)
    let levelRecommendation = null
    if (levelRec) {
      const exercises = levelRec.recommendedExerciseIds
        .map((id) => {
          const ex = getExerciseById(id)
          if (!ex) return null
          return {
            nameZh: ex.nameZh,
            reps: ex.reps,
            sets: ex.sets,
            sessionsPerWeek: ex.sessionsPerWeek,
          }
        })
        .filter(Boolean)
        .slice(0, 8)

      levelRecommendation = {
        label: levelRec.labelZh,
        daysPerWeek: levelRec.daysPerWeek,
        focusAreas: [...levelRec.focusAreas],
        avoid: [...levelRec.avoid],
        exercises,
      }
    }

    // Training progress
    let trainingProgress = null
    if (personalityTypeCode) {
      try {
        const progress = await db
          .prepare(
            `SELECT week, day, completed FROM training_progress
             WHERE user_id = ? AND personality_type = ? ORDER BY week, day`
          )
          .bind(userId, personalityTypeCode)
          .all<{ week: number; day: number; completed: number }>()

        if (progress.results?.length) {
          const completed = progress.results.filter((p) => p.completed)
          const total = progress.results.length
          const lastCompleted = completed[completed.length - 1] ?? null
          trainingProgress = {
            completed: completed.length,
            total,
            completionRate: total > 0 ? Math.round((completed.length / total) * 100) : 0,
            lastCompleted: lastCompleted
              ? { week: lastCompleted.week, day: lastCompleted.day }
              : null,
          }
        }
      } catch {
        // training_progress table may not exist
      }
    }

    // Goals
    let goals: Array<{
      title: string
      target: string
      currentProgress: string | null
      status: string
    }> = []
    try {
      const goalsResult = await db
        .prepare(
          "SELECT title, target, current_progress, status FROM user_goals WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 5"
        )
        .bind(userId)
        .all<{
          title: string
          target: string
          current_progress: string | null
          status: string
        }>()

      goals = (goalsResult.results ?? []).map((g) => ({
        title: g.title,
        target: g.target,
        currentProgress: g.current_progress,
        status: g.status,
      }))
    } catch {
      // user_goals table may not exist
    }

    return c.json({
      success: true,
      data: {
        level: levelLabel,
        totalAscents: stats?.total_ascents ?? 0,
        uniqueCrags: stats?.unique_crags ?? 0,
        personality,
        weaknesses,
        levelRecommendation,
        trainingProgress,
        goals,
      },
    })
  }
)
