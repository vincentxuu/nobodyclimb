import { GoalService } from '../../domain/goals'
import type { Tool, ToolContext, ToolResult } from '../types'

export const goalsTool: Tool = {
  name: 'manage_goals',
  tags: ['goals', 'personal'],
  alwaysLoad: false,
  concurrencySafe: false,
  maxResultChars: 2000,
  cacheTTL: 0,
  parameters: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['list', 'create', 'progress', 'achieve'],
        description: '操作類型：list 查看目標、create 建立目標、progress 查看進度、achieve 標記達成',
      },
      goal_type: {
        type: 'string',
        enum: ['grade', 'route', 'volume', 'custom'],
        description: '目標類型（create 時必填）：grade=挑戰難度、route=完攀特定路線、volume=攀登量、custom=自訂',
      },
      title: { type: 'string', description: '目標標題（create 時必填）' },
      target: { type: 'string', description: '目標值（create 時必填），如 5.12a、飛簷、10' },
      goal_id: { type: 'string', description: '目標 ID（achieve 時必填）' },
      target_date: { type: 'string', description: '目標日期（可選），ISO 格式' },
      notes: { type: 'string', description: '備註（可選）' },
    },
    required: ['action'],
  },

  prompt(ctx: ToolContext): string {
    if (!ctx.userId) {
      return '管理攀岩目標（設定、追蹤進度、標記達成）。（目前用戶未登入，無法使用此工具）'
    }
    return '管理使用者的攀岩目標。可以設定新目標（如挑戰 5.12、完攀飛簷、本月爬 10 條），查看目前進度，或標記目標已達成。當使用者提到「我想」「目標」「挑戰」時使用。'
  },

  async execute(input: unknown, ctx: ToolContext): Promise<unknown> {
    if (!ctx.userId) {
      return { error: '用戶未登入，無法管理目標' }
    }

    const { action, goal_type, title, target, goal_id, target_date, notes } = input as {
      action: 'list' | 'create' | 'progress' | 'achieve'
      goal_type?: string
      title?: string
      target?: string
      goal_id?: string
      target_date?: string
      notes?: string
    }

    const service = new GoalService(ctx.env.DB)

    switch (action) {
      case 'list': {
        const goals = await service.getActiveGoals(ctx.userId)
        return { goals, count: goals.length }
      }

      case 'create': {
        if (!goal_type || !title || !target) {
          return { error: '建立目標需要 goal_type、title 和 target' }
        }
        const goal = await service.createGoal(ctx.userId, {
          goal_type: goal_type as 'grade' | 'route' | 'volume' | 'custom',
          title,
          target,
          target_date,
          notes,
        })
        return { created: goal }
      }

      case 'progress': {
        const summary = await service.checkGoalProgress(ctx.userId)
        return summary
      }

      case 'achieve': {
        if (!goal_id) {
          return { error: '標記達成需要 goal_id' }
        }
        await service.achieveGoal(goal_id)
        return { achieved: true, goal_id }
      }

      default:
        return { error: `未知操作：${action}` }
    }
  },

  formatResult(raw: unknown): ToolResult {
    const data = raw as Record<string, unknown>

    if (data.error) {
      return { content: data.error as string }
    }

    if (data.created) {
      const goal = data.created as { title: string; target: string; goal_type: string }
      return {
        content: `已建立目標：${goal.title}（${goal.goal_type}：${goal.target}）`,
        metadata: { action: 'create' },
      }
    }

    if (data.achieved) {
      return {
        content: `目標已標記為達成！`,
        metadata: { action: 'achieve', goal_id: data.goal_id },
      }
    }

    if (data.goals) {
      const goals = data.goals as Array<{ title: string; target: string; goal_type: string; current_value: string | null }>
      if (goals.length === 0) {
        return { content: '目前沒有進行中的目標。', metadata: { count: 0 } }
      }
      const lines = goals.map(
        (g, i) => `${i + 1}. ${g.title}（${g.goal_type}：${g.target}）${g.current_value ? `— 進度：${g.current_value}` : ''}`
      )
      return {
        content: `進行中的目標（${goals.length} 個）：\n${lines.join('\n')}`,
        metadata: { count: goals.length },
      }
    }

    if (data.activeGoals) {
      const active = data.activeGoals as Array<{ title: string; target: string; progressNote?: string }>
      const suggestions = data.suggestions as string[]
      const achieved = data.recentlyAchieved as Array<{ title: string }>

      const lines: string[] = []

      if (active.length > 0) {
        lines.push(`進行中的目標（${active.length} 個）：`)
        for (const g of active) {
          lines.push(`- ${g.title}（目標：${g.target}）`)
          if (g.progressNote) lines.push(`  ${g.progressNote}`)
        }
      } else {
        lines.push('目前沒有進行中的目標。')
      }

      if (achieved.length > 0) {
        lines.push(`\n最近達成：${achieved.map((g) => g.title).join('、')}`)
      }

      if (suggestions.length > 0) {
        lines.push(`\n提示：${suggestions.join(' ')}`)
      }

      return {
        content: lines.join('\n'),
        metadata: { activeCount: active.length, suggestionCount: suggestions.length },
      }
    }

    return { content: JSON.stringify(data) }
  },
}
