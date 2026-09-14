import {
  getExerciseById,
  getPersonalityType,
  getTrainingSchoolMapping,
  TRAINING_BY_LEVEL,
} from '@nobodyclimb/constants'
import type { PersonalityTypeCode } from '@nobodyclimb/types'
import { createProvider } from '../../orchestrators/ai-graph/providers'
import type { ProviderName as LegacyProviderName } from '../../orchestrators/ai-graph/providers/types'
import { suggestTrainingTool } from '../tools/coaching'
import { userProfileTool } from '../tools/user-profile'
import type { ToolContext } from '../types'
import type { SubAgent, SubAgentResult } from './types'
import { analyzeWeaknesses } from './weakness-analysis'

const COACHING_SYSTEM_PROMPT = `你是 NobodyClimb 的攀岩教練。你的任務是根據使用者的數據，進行系統化分析並提供訓練建議。

分析框架：
1. 【現況評估】根據攀登歷史數據，總結目前程度和攀登模式
2. 【弱點識別】基於分析結果指出 1-2 個關鍵弱點
3. 【目標對齊】如果使用者有設定目標，說明弱點如何影響目標達成
4. 【訓練計畫】針對弱點設計 2-3 週的漸進式訓練，每項要具體（頻率、強度、組數）
5. 【下一步行動】本週就能開始做的 1 件事

規則：
1. 分析基於 context 中的真實數據，不可捏造
2. 訓練建議要具體（如「每週 2 次指板訓練，7:3 秒掛休比，3 組」）
3. 根據程度調整強度（入門者不建議指板）
4. 最多 3-4 條核心建議
5. 使用繁體中文
6. 可引用使用者近期完攀的路線作為依據
7. 如果有使用者的攀岩人格型態和對應訓練學派，以該學派的訓練哲學為基底來設計建議
8. 如果有訓練進度資料，根據已完成和未完成的部分調整建議重點
9. 如果有 AI 微調計畫和訓練歷史模式，據此調整建議（例如用戶常跳過某天，建議簡化該天訓練）`

async function getUserPersonalityType(ctx: ToolContext): Promise<string | null> {
  if (!ctx.userId) return null
  try {
    const user = await ctx.env.DB.prepare('SELECT personality_type FROM users WHERE id = ?')
      .bind(ctx.userId)
      .first<{ personality_type: string | null }>()
    return user?.personality_type ?? null
  } catch {
    return null
  }
}

function buildLevelExerciseContext(trainingResult: unknown): string | null {
  const data = trainingResult as { level?: string }
  if (!data.level) return null

  let level: 'beginner' | 'intermediate' | 'advanced' = 'beginner'
  if (data.level.includes('5.13') || data.level.includes('高級')) level = 'advanced'
  else if (data.level.includes('5.11') || data.level.includes('5.12') || data.level.includes('中'))
    level = 'intermediate'

  const rec = TRAINING_BY_LEVEL.find((l) => l.level === level)
  if (!rec) return null

  const exercises = rec.recommendedExerciseIds
    .map((id) => {
      const ex = getExerciseById(id)
      if (!ex) return null
      return `- ${ex.nameZh}：${ex.reps}，${ex.sets[0]}-${ex.sets[1]} 組，每週 ${ex.sessionsPerWeek[0]}-${ex.sessionsPerWeek[1]} 次`
    })
    .filter(Boolean)
    .slice(0, 8)

  const lines = [
    `程度：${rec.labelZh}（${rec.sportGradeRange}）`,
    `每週訓練：${rec.daysPerWeek[0]}-${rec.daysPerWeek[1]} 天，每次 ${rec.hoursPerSession[0]}-${rec.hoursPerSession[1]} 小時`,
    `重點：${rec.focusAreas.slice(0, 3).join('；')}`,
    rec.avoid.length > 0 ? `避免：${rec.avoid.join('；')}` : '',
    '',
    '推薦練習：',
    ...exercises,
  ].filter(Boolean)

  return `【等級訓練建議】\n${lines.join('\n')}`
}

async function gatherPersonalityContext(
  ctx: ToolContext,
  typeCodeStr?: string | null
): Promise<string | null> {
  if (!ctx.userId) return null

  try {
    const typeCode = typeCodeStr as PersonalityTypeCode | null
    if (!typeCode) return null

    const personality = getPersonalityType(typeCode)
    const school = getTrainingSchoolMapping(typeCode)
    if (!personality || !school) return null

    const lines: string[] = [
      `人格型態：${personality.nameZh}（${personality.nameEn}, ${typeCode}）`,
      `特質：${personality.keywords.join('、')}`,
      `優勢：${personality.strengths.join('；')}`,
      `盲點：${personality.blindSpots.join('；')}`,
      `對應訓練學派：${school.trainingSchoolZh}`,
      `學派特色：${school.schoolDescription}`,
    ]

    const progress = await ctx.env.DB.prepare(
      `SELECT week, day, completed FROM training_progress
       WHERE user_id = ? AND personality_type = ?
       ORDER BY week, day`
    )
      .bind(ctx.userId, typeCode)
      .all<{ week: number; day: number; completed: number }>()

    if (progress.results?.length) {
      const completed = progress.results.filter((p) => p.completed)
      const total = progress.results.length
      lines.push(`訓練進度：已完成 ${completed.length}/${total} 個訓練日`)
      const lastCompleted = completed[completed.length - 1]
      if (lastCompleted) {
        lines.push(`最新完成：第 ${lastCompleted.week} 週第 ${lastCompleted.day} 天`)
      }
    }

    return `【攀岩人格與訓練學派】\n${lines.join('\n')}`
  } catch {
    return null
  }
}

async function gatherTrainingHistoryContext(
  ctx: ToolContext,
  personalityTypeCode: string | null
): Promise<string | null> {
  if (!ctx.userId || !personalityTypeCode) return null

  try {
    const [latestPlan, progressRows, feedback] = await Promise.all([
      ctx.env.DB.prepare(
        `SELECT week_number, difficulty_level, source, plan_content, generated_at
         FROM ai_training_plans
         WHERE user_id = ? AND personality_type = ?
         ORDER BY generated_at DESC LIMIT 1`
      )
        .bind(ctx.userId, personalityTypeCode)
        .first<{
          week_number: number
          difficulty_level: number
          source: string
          plan_content: string
          generated_at: string
        }>(),

      ctx.env.DB.prepare(
        `SELECT week, day, completed, notes FROM training_progress
         WHERE user_id = ? AND personality_type = ?
         ORDER BY week, day`
      )
        .bind(ctx.userId, personalityTypeCode)
        .all<{ week: number; day: number; completed: number; notes: string | null }>(),

      ctx.env.DB.prepare(
        `SELECT f.rating, f.comment FROM ai_training_feedback f
         JOIN ai_training_plans p ON f.plan_id = p.id
         WHERE f.user_id = ? AND p.personality_type = ?
         ORDER BY f.created_at DESC LIMIT 1`
      )
        .bind(ctx.userId, personalityTypeCode)
        .first<{ rating: string; comment: string | null }>(),
    ])

    const lines: string[] = []

    if (latestPlan) {
      lines.push(
        `最新 AI 計畫：第 ${latestPlan.week_number} 週，難度 ${latestPlan.difficulty_level}/5（${latestPlan.source === 'ai' ? 'AI 微調' : '基礎模板'}）`
      )

      try {
        const plan = JSON.parse(latestPlan.plan_content) as {
          days?: Array<{ title: string; exercises?: Array<{ name: string }> }>
        }
        if (plan.days?.length) {
          const daySummaries = plan.days.map(
            (d, i) =>
              `第${i + 1}天「${d.title}」${d.exercises?.length ? `（${d.exercises.map((e) => e.name).join('、')}）` : ''}`
          )
          lines.push(`計畫內容：${daySummaries.join('；')}`)
        }
      } catch {
        // plan_content parse failed, skip
      }
    }

    if (progressRows.results?.length) {
      const rows = progressRows.results
      const completed = rows.filter((r) => r.completed)
      const skipped = rows.filter((r) => !r.completed)

      lines.push(
        `完成率：${completed.length}/${rows.length}（${Math.round((completed.length / rows.length) * 100)}%）`
      )

      const daySkipCount: Record<number, number> = {}
      for (const r of skipped) {
        daySkipCount[r.day] = (daySkipCount[r.day] ?? 0) + 1
      }
      const frequentSkips = Object.entries(daySkipCount)
        .filter(([, count]) => count >= 2)
        .sort(([, a], [, b]) => b - a)

      if (frequentSkips.length > 0) {
        const skipDescriptions = frequentSkips.map(
          ([day, count]) => `第 ${day} 天（跳過 ${count} 次）`
        )
        lines.push(`常跳過的訓練日：${skipDescriptions.join('、')}`)
      }

      let currentStreak = 0
      for (let i = rows.length - 1; i >= 0; i--) {
        if (rows[i].completed) currentStreak++
        else break
      }
      if (currentStreak > 0) {
        lines.push(`目前連續完成：${currentStreak} 天`)
      }

      const recentNotes = rows
        .filter((r) => r.notes)
        .slice(-2)
        .map((r) => `W${r.week}D${r.day}：${r.notes}`)
      if (recentNotes.length > 0) {
        lines.push(`用戶筆記：${recentNotes.join('；')}`)
      }
    }

    if (feedback) {
      const ratingMap: Record<string, string> = {
        too_easy: '太簡單',
        just_right: '剛好',
        too_hard: '太難',
      }
      lines.push(
        `最新回饋：${ratingMap[feedback.rating] ?? feedback.rating}${feedback.comment ? `（${feedback.comment}）` : ''}`
      )
    }

    if (lines.length === 0) return null
    return `【AI 訓練歷史與回饋】\n${lines.join('\n')}`
  } catch {
    return null
  }
}

export const coachingSubAgent: SubAgent = {
  name: 'coaching_agent',
  description: '攀岩教練訓練建議 sub-agent',
  systemPrompt: COACHING_SYSTEM_PROMPT,
  innerTools: ['suggest_training', 'user_profile'],

  async gatherContext(input: unknown, ctx: ToolContext): Promise<string> {
    const sections: string[] = []

    const profileResult = await userProfileTool.execute({}, ctx)
    const profileFormatted = userProfileTool.formatResult(profileResult)
    sections.push(`【使用者資料】\n${profileFormatted.content}`)

    const trainingResult = await suggestTrainingTool.execute(input, ctx)
    const trainingFormatted = suggestTrainingTool.formatResult(trainingResult)
    sections.push(`【訓練分析】\n${trainingFormatted.content}`)

    const personalityTypeCode = await getUserPersonalityType(ctx)

    const weaknesses = analyzeWeaknesses(trainingResult, personalityTypeCode)
    sections.push(`【弱點分析】\n${weaknesses}`)

    const personalityContext = await gatherPersonalityContext(ctx, personalityTypeCode)
    if (personalityContext) sections.push(personalityContext)

    const levelExercises = buildLevelExerciseContext(trainingResult)
    if (levelExercises) sections.push(levelExercises)

    const trainingHistory = await gatherTrainingHistoryContext(ctx, personalityTypeCode)
    if (trainingHistory) sections.push(trainingHistory)

    try {
      const goals = await ctx.env.DB.prepare(
        "SELECT title, target, current_progress, status FROM user_goals WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 3"
      )
        .bind(ctx.userId)
        .all<{ title: string; target: string; current_progress: string | null; status: string }>()
      if (goals.results?.length) {
        const goalLines = goals.results.map(
          (g) =>
            `- ${g.title}：目標 ${g.target}${g.current_progress ? `，目前進度 ${g.current_progress}` : ''}`
        )
        sections.push(`【使用者目標】\n${goalLines.join('\n')}`)
      }
    } catch {
      // user_goals 表可能尚未建立
    }

    return sections.join('\n\n')
  },

  async synthesize(query: string, context: string, ctx: ToolContext): Promise<SubAgentResult> {
    const provider = createProvider(
      (ctx.models.orchestrator.provider === 'workers-ai'
        ? 'cloudflare'
        : ctx.models.orchestrator.provider) as LegacyProviderName,
      ctx.env
    )

    const response = await provider.chat(
      [
        { role: 'system', content: COACHING_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `${context}\n\n---\n使用者問題：${query}\n\n請按照分析框架（現況評估 → 弱點識別 → 目標對齊 → 訓練計畫 → 下一步行動）回答。`,
        },
      ],
      {
        model: ctx.models.orchestrator.model,
        maxTokens: ctx.models.orchestrator.maxTokens ?? 1024,
        temperature: 0.3,
      }
    )

    const tokensUsed =
      (response.usage?.prompt_tokens ?? 0) + (response.usage?.completion_tokens ?? 0)
    ctx.tracker.record(
      ctx.models.orchestrator.provider,
      ctx.models.orchestrator.model,
      response.usage?.prompt_tokens ?? 0,
      response.usage?.completion_tokens ?? 0
    )

    return { answer: response.content, tokensUsed }
  },
}
