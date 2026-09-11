/** 規則式弱點分析：從訓練數據中識別攀登模式弱點 */

interface TrainingData {
  level?: string
  typeDistribution?: Array<{ type: string; count: number }>
  styleDistribution?: Record<string, number>
  recentAscents?: Array<{ route: string; grade: string; type: string; style: string }>
}

export function analyzeWeaknesses(trainingResult: unknown): string {
  const data = trainingResult as TrainingData
  const insights: string[] = []

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
      insights.push(
        `類型偏科：${name}佔 ${Math.round((dominant.count / total) * 100)}%，建議嘗試其他類型拓展能力`
      )
    }
  }

  if (data.styleDistribution) {
    const entries = Object.entries(data.styleDistribution)
    const total = entries.reduce((s, [, c]) => s + c, 0)
    const hasOnsight = entries.some(([s]) => s === 'onsight')
    const hasRedpoint = entries.some(([s]) => s === 'redpoint')
    if (hasRedpoint && !hasOnsight) {
      insights.push('缺少 onsight 經驗：多嘗試第一次就完攀，訓練讀線能力和心理素質')
    }
    if (total > 0) {
      const topRopeRatio = (data.styleDistribution['toprope'] ?? 0) / total
      if (topRopeRatio > 0.5) {
        insights.push('top-rope 比例偏高：建議多練先鋒攀登，訓練墜落承受和放置保護')
      }
    }
  }

  if (data.recentAscents && data.recentAscents.length >= 5) {
    const grades = data.recentAscents
      .map((a) => a.grade?.match(/5\.(\d+)/)?.[1])
      .filter(Boolean)
    const unique = new Set(grades)
    if (unique.size === 1 && grades.length >= 5) {
      insights.push(
        `難度可能停滯：最近完攀都在 5.${[...unique][0]}，考慮嘗試更高難度或不同風格突破`
      )
    }
  }

  return insights.length > 0 ? insights.join('\n') : '目前數據不足以判斷明顯弱點'
}
