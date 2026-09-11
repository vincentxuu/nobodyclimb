import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { authMiddleware } from '../middleware/auth'
import { GoalService } from '../services/domain/goals'
import type { Env } from '../types'

export const goalsRoutes = new Hono<{ Bindings: Env }>()

goalsRoutes.get(
  '/',
  describeRoute({
    tags: ['Goals'],
    summary: '取得使用者的 active 目標',
    responses: {
      200: { description: '成功取得目標列表' },
      401: { description: '未授權' },
    },
  }),
  authMiddleware,
  async (c) => {
    const userId = c.get('userId')
    const service = new GoalService(c.env.DB)
    const goals = await service.getActiveGoals(userId)
    return c.json({ success: true, data: goals })
  }
)

goalsRoutes.get(
  '/progress',
  describeRoute({
    tags: ['Goals'],
    summary: '取得目標進度摘要',
    responses: {
      200: { description: '成功取得目標進度' },
      401: { description: '未授權' },
    },
  }),
  authMiddleware,
  async (c) => {
    const userId = c.get('userId')
    const service = new GoalService(c.env.DB)
    const progress = await service.checkGoalProgress(userId)
    return c.json({ success: true, data: progress })
  }
)

goalsRoutes.post(
  '/',
  describeRoute({
    tags: ['Goals'],
    summary: '建立新目標',
    responses: {
      201: { description: '成功建立目標' },
      400: { description: '參數錯誤' },
      401: { description: '未授權' },
    },
  }),
  authMiddleware,
  async (c) => {
    const userId = c.get('userId')
    const body = await c.req.json<{
      goal_type: 'grade' | 'route' | 'volume' | 'custom'
      title: string
      target: string
      target_date?: string
      notes?: string
    }>()

    if (!body.goal_type || !body.title || !body.target) {
      return c.json(
        { success: false, error: 'Bad Request', message: 'goal_type, title, target are required' },
        400
      )
    }

    const validTypes = ['grade', 'route', 'volume', 'custom']
    if (!validTypes.includes(body.goal_type)) {
      return c.json(
        {
          success: false,
          error: 'Bad Request',
          message: `Invalid goal_type. Must be one of: ${validTypes.join(', ')}`,
        },
        400
      )
    }

    const service = new GoalService(c.env.DB)
    const goal = await service.createGoal(userId, body)
    return c.json({ success: true, data: goal }, 201)
  }
)

goalsRoutes.post(
  '/:id/achieve',
  describeRoute({
    tags: ['Goals'],
    summary: '標記目標為已達成',
    responses: {
      200: { description: '成功標記達成' },
      401: { description: '未授權' },
    },
  }),
  authMiddleware,
  async (c) => {
    const goalId = c.req.param('id')
    const service = new GoalService(c.env.DB)
    await service.achieveGoal(goalId)
    return c.json({ success: true, message: 'Goal achieved' })
  }
)

goalsRoutes.delete(
  '/:id',
  describeRoute({
    tags: ['Goals'],
    summary: '刪除目標',
    responses: {
      200: { description: '成功刪除目標' },
      401: { description: '未授權' },
    },
  }),
  authMiddleware,
  async (c) => {
    const goalId = c.req.param('id')
    const userId = c.get('userId')
    await c.env.DB.prepare('DELETE FROM user_goals WHERE id = ? AND user_id = ?')
      .bind(goalId, userId)
      .run()
    return c.json({ success: true, message: 'Goal deleted' })
  }
)
