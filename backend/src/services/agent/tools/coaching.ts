import { gradeToNumeric } from '../../core/climbing-schema'
import type { Tool, ToolContext, ToolResult } from '../types'

export const suggestTrainingTool: Tool = {
  name: 'suggest_training',
  tags: ['coaching', 'personal'],
  alwaysLoad: false,
  concurrencySafe: true,
  maxResultChars: 3000,
  cacheTTL: 300,
  parameters: {
    type: 'object',
    properties: {
      focus: {
        type: 'string',
        description: '訓練重點（可選），如「指力」「耐力」「腳法」「柔軟度」「核心」',
      },
    },
    required: [],
  },

  prompt(ctx: ToolContext): string {
    if (!ctx.userId) {
      return '根據攀登歷史建議訓練計畫。（目前用戶未登入，無法使用此工具）'
    }
    return '根據使用者的攀登歷史和能力等級，分析攀登模式並建議針對性的訓練方向。適合「怎麼進步」「要練什麼」「如何加強」等問題。'
  },

  async execute(input: unknown, ctx: ToolContext): Promise<unknown> {
    if (!ctx.userId) {
      return { error: '用戶未登入，無法產生訓練建議' }
    }

    const { focus } = input as { focus?: string }
    const db = ctx.env.DB

    const [recentAscents, stats, typeDistribution] = await Promise.all([
      db
        .prepare(
          `SELECT r.name AS route_name, r.grade, r.route_type, ra.ascent_type AS style,
                  c.name AS crag_name, ra.ascent_date
           FROM user_route_ascents ra
           LEFT JOIN routes r ON ra.route_id = r.id
           LEFT JOIN crags c ON r.crag_id = c.id
           WHERE ra.user_id = ?
           ORDER BY ra.ascent_date DESC
           LIMIT 20`
        )
        .bind(ctx.userId)
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
          `SELECT COUNT(*) as total_ascents,
                  COUNT(DISTINCT r.crag_id) as unique_crags
           FROM user_route_ascents ra
           LEFT JOIN routes r ON ra.route_id = r.id
           WHERE ra.user_id = ?`
        )
        .bind(ctx.userId)
        .first<{ total_ascents: number; unique_crags: number }>(),

      db
        .prepare(
          `SELECT r.route_type, COUNT(*) as cnt
           FROM user_route_ascents ra
           LEFT JOIN routes r ON ra.route_id = r.id
           WHERE ra.user_id = ? AND r.route_type IS NOT NULL
           GROUP BY r.route_type
           ORDER BY cnt DESC`
        )
        .bind(ctx.userId)
        .all<{ route_type: string; cnt: number }>(),
    ])

    const ascents = recentAscents.results ?? []

    // 分析難度分佈
    const gradeNumerics = ascents.map((a) => gradeToNumeric(a.grade)).filter((n) => n > 0)
    const maxGrade = gradeNumerics.length > 0 ? Math.max(...gradeNumerics) : null
    const avgGrade =
      gradeNumerics.length > 0
        ? Math.round(gradeNumerics.reduce((a, b) => a + b, 0) / gradeNumerics.length)
        : null

    // 分析攀登風格分佈
    const styleCount: Record<string, number> = {}
    for (const a of ascents) {
      if (a.style) styleCount[a.style] = (styleCount[a.style] || 0) + 1
    }

    // 判斷程度（基於最高難度 numeric）
    let level: string
    if (!maxGrade || maxGrade < 100) level = '入門（5.9 以下）'
    else if (maxGrade < 110) level = '進階入門（5.10）'
    else if (maxGrade < 120) level = '中級（5.11）'
    else if (maxGrade < 130) level = '中高級（5.12）'
    else level = '高級（5.13+）'

    return {
      level,
      maxGrade,
      avgGrade,
      totalAscents: stats?.total_ascents ?? 0,
      uniqueCrags: stats?.unique_crags ?? 0,
      recentAscents: ascents.slice(0, 5).map((a) => ({
        route: a.route_name,
        grade: a.grade,
        type: a.route_type,
        style: a.style,
      })),
      typeDistribution: (typeDistribution.results ?? []).map((t) => ({
        type: t.route_type,
        count: t.cnt,
      })),
      styleDistribution: styleCount,
      focus: focus ?? null,
    }
  },

  formatResult(raw: unknown): ToolResult {
    const data = raw as {
      error?: string
      level?: string
      maxGrade?: number | null
      avgGrade?: number | null
      totalAscents?: number
      uniqueCrags?: number
      recentAscents?: Array<{
        route: string
        grade: string
        type: string
        style: string
      }>
      typeDistribution?: Array<{ type: string; count: number }>
      styleDistribution?: Record<string, number>
      focus?: string | null
    }

    if (data.error) {
      return { content: data.error }
    }

    const lines: string[] = []
    lines.push(`攀登程度：${data.level}`)
    lines.push(`總完攀：${data.totalAscents} 條，去過 ${data.uniqueCrags} 個岩場`)

    if (data.typeDistribution?.length) {
      const typeMap: Record<string, string> = {
        sport: '運攀',
        trad: '傳攀',
        boulder: '抱石',
        mixed: '混合',
      }
      const types = data.typeDistribution.map(
        (t) => `${typeMap[t.type] ?? t.type} ${t.count} 條`
      )
      lines.push(`攀登類型分佈：${types.join('、')}`)
    }

    if (data.styleDistribution && Object.keys(data.styleDistribution).length > 0) {
      const styles = Object.entries(data.styleDistribution)
        .sort(([, a], [, b]) => b - a)
        .map(([s, c]) => `${s} ${c} 次`)
      lines.push(`攀登風格：${styles.join('、')}`)
    }

    if (data.recentAscents?.length) {
      lines.push('\n近期完攀：')
      for (const a of data.recentAscents) {
        lines.push(`- ${a.route} (${a.grade}, ${a.type ?? '未知'})`)
      }
    }

    if (data.focus) {
      lines.push(`\n訓練重點需求：${data.focus}`)
    }

    return {
      content: lines.join('\n'),
      metadata: {
        level: data.level,
        totalAscents: data.totalAscents,
        focus: data.focus,
      },
    }
  },
}
