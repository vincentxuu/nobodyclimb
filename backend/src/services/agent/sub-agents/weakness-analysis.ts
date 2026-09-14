/** 規則式弱點分析：從訓練數據中識別攀登模式弱點，並推薦對應練習 */

import {
  ANTI_STYLE_PROTOCOLS,
  TRAINING_BY_LEVEL,
  getExerciseById,
  getTrainingSchoolMapping,
} from '@nobodyclimb/constants'
import type { PersonalityTypeCode } from '@nobodyclimb/types'

interface TrainingData {
  level?: string
  typeDistribution?: Array<{ type: string; count: number }>
  styleDistribution?: Record<string, number>
  recentAscents?: Array<{ route: string; grade: string; type: string; style: string }>
}

export interface WeaknessInsight {
  id: string
  description: string
  exercises: string[]
}

function resolveTrainingLevel(level?: string): 'beginner' | 'intermediate' | 'advanced' {
  if (!level) return 'beginner'
  if (level.includes('5.13') || level.includes('高級')) return 'advanced'
  if (level.includes('5.11') || level.includes('5.12') || level.includes('中')) return 'intermediate'
  return 'beginner'
}

function formatExerciseNames(ids: string[]): string[] {
  return ids
    .map((id) => {
      const ex = getExerciseById(id)
      return ex ? ex.nameZh : null
    })
    .filter((n): n is string => n !== null)
}

export function analyzeWeaknessesStructured(
  trainingResult: unknown,
  personalityTypeCode?: string | null
): WeaknessInsight[] {
  const data = trainingResult as TrainingData
  const insights: WeaknessInsight[] = []
  const level = resolveTrainingLevel(data.level)
  const levelRec = TRAINING_BY_LEVEL.find((l) => l.level === level)
  const avoidIds = new Set(levelRec?.avoid ?? [])

  if (data.typeDistribution?.length) {
    const total = data.typeDistribution.reduce((s, t) => s + t.count, 0)
    const dominant = data.typeDistribution[0]
    if (total > 0 && dominant && dominant.count / total > 0.8) {
      const typeNames: Record<string, string> = {
        sport: '運攀',
        trad: '傳攀',
        boulder: '抱石',
        mixed: '混合',
      }
      const name = typeNames[dominant.type] ?? dominant.type

      const antiStyleId =
        dominant.type === 'boulder'
          ? 'boulder_to_sport_transition'
          : dominant.type === 'sport'
            ? 'sport_to_boulder_transition'
            : null

      const protocol = antiStyleId
        ? ANTI_STYLE_PROTOCOLS.find((p) => p.id === antiStyleId)
        : null

      const exerciseNames = protocol
        ? formatExerciseNames([...protocol.emphasisExerciseIds].slice(0, 3))
        : []

      insights.push({
        id: 'type_imbalance',
        description: `類型偏科：${name}佔 ${Math.round((dominant.count / total) * 100)}%，建議嘗試其他類型拓展能力`,
        exercises: exerciseNames,
      })
    }
  }

  if (data.styleDistribution) {
    const entries = Object.entries(data.styleDistribution)
    const total = entries.reduce((s, [, c]) => s + c, 0)
    const hasOnsight = entries.some(([s]) => s === 'onsight')
    const hasRedpoint = entries.some(([s]) => s === 'redpoint')
    if (hasRedpoint && !hasOnsight) {
      insights.push({
        id: 'missing_onsight',
        description: '缺少 onsight 經驗：多嘗試第一次就完攀，訓練讀線能力和心理素質',
        exercises: formatExerciseNames(['mental_visualization', 'technique_varied_terrain']),
      })
    }
    if (total > 0) {
      const topRopeRatio = (data.styleDistribution['toprope'] ?? 0) / total
      if (topRopeRatio > 0.5) {
        insights.push({
          id: 'toprope_heavy',
          description: 'top-rope 比例偏高：建議多練先鋒攀登，訓練墜落承受和放置保護',
          exercises: formatExerciseNames(['mental_progressive_relaxation', 'mental_visualization']),
        })
      }
    }
  }

  if (data.recentAscents && data.recentAscents.length >= 5) {
    const grades = data.recentAscents
      .map((a) => a.grade?.match(/5\.(\d+)/)?.[1])
      .filter(Boolean)
    const unique = new Set(grades)
    if (unique.size === 1 && grades.length >= 5) {
      const levelExercises = levelRec?.recommendedExerciseIds ?? []
      const strengthExercises = levelExercises
        .filter((id) => id.startsWith('hangboard') || id.startsWith('campus') || id.startsWith('pullups'))
        .slice(0, 3)
      insights.push({
        id: 'grade_plateau',
        description: `難度可能停滯：最近完攀都在 5.${[...unique][0]}，考慮嘗試更高難度或不同風格突破`,
        exercises: formatExerciseNames(strengthExercises),
      })
    }
  }

  if (personalityTypeCode) {
    const school = getTrainingSchoolMapping(personalityTypeCode as PersonalityTypeCode)
    if (school?.antiStyleProtocolId) {
      const protocol = ANTI_STYLE_PROTOCOLS.find((p) => p.id === school.antiStyleProtocolId)
      if (protocol) {
        const safeExercises = protocol.emphasisExerciseIds
          .filter((id) => !avoidIds.has(id))
          .slice(0, 4)
        insights.push({
          id: 'anti_style',
          description: `人格型態弱點（${protocol.nameZh}）：${protocol.targetProfile}`,
          exercises: formatExerciseNames(safeExercises),
        })
      }
    }
  }

  return insights
}

/** 向後相容：回傳純文字格式 */
export function analyzeWeaknesses(
  trainingResult: unknown,
  personalityTypeCode?: string | null
): string {
  const insights = analyzeWeaknessesStructured(trainingResult, personalityTypeCode)
  if (insights.length === 0) return '目前數據不足以判斷明顯弱點'

  return insights
    .map((i) => {
      const base = i.description
      if (i.exercises.length === 0) return base
      return `${base}\n  → 建議練習：${i.exercises.join('、')}`
    })
    .join('\n')
}
