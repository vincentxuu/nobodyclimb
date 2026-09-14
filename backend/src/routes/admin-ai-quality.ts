import { Hono } from 'hono'
import { adminMiddleware, authMiddleware } from '../middleware/auth'
import { Env } from '../types'

export const adminAiQualityRoutes = new Hono<{ Bindings: Env }>()

adminAiQualityRoutes.use('*', authMiddleware, adminMiddleware)

interface ToolUsageRow {
  query_route: string
  cnt: number
}

interface QualityRow {
  avg_groundedness: number | null
  avg_auto_score: number | null
  low_quality_count: number
  total_with_score: number
}

adminAiQualityRoutes.get('/stats', async (c) => {
  const db = c.env.DB

  try {
    const [todayCount, weekCount, monthCount, avgLatency, qualityStats, toolUsage, modeUsage] =
      await Promise.all([
        db
          .prepare(
            "SELECT COUNT(*) as cnt FROM ai_query_logs WHERE created_at >= datetime('now', '-1 day')"
          )
          .first<{ cnt: number }>(),
        db
          .prepare(
            "SELECT COUNT(*) as cnt FROM ai_query_logs WHERE created_at >= datetime('now', '-7 days')"
          )
          .first<{ cnt: number }>(),
        db
          .prepare(
            "SELECT COUNT(*) as cnt FROM ai_query_logs WHERE created_at >= datetime('now', '-30 days')"
          )
          .first<{ cnt: number }>(),
        db
          .prepare(
            "SELECT AVG(latency_ms) as avg FROM ai_query_logs WHERE created_at >= datetime('now', '-7 days') AND latency_ms IS NOT NULL"
          )
          .first<{ avg: number | null }>(),
        db
          .prepare(
            `SELECT
             AVG(groundedness_score) as avg_groundedness,
             AVG(auto_score) as avg_auto_score,
             COUNT(CASE WHEN auto_score IS NOT NULL AND auto_score < 2 THEN 1 END) as low_quality_count,
             COUNT(CASE WHEN auto_score IS NOT NULL THEN 1 END) as total_with_score
           FROM ai_query_logs
           WHERE created_at >= datetime('now', '-7 days')`
          )
          .first<QualityRow>(),
        db
          .prepare(
            `SELECT query_route, COUNT(*) as cnt
           FROM ai_query_logs
           WHERE created_at >= datetime('now', '-7 days') AND query_route IS NOT NULL
           GROUP BY query_route
           ORDER BY cnt DESC
           LIMIT 15`
          )
          .all<ToolUsageRow>(),
        db
          .prepare(
            `SELECT
             COUNT(CASE WHEN query_route = 'agent' THEN 1 END) as agent_count,
             COUNT(CASE WHEN query_route != 'agent' OR query_route IS NULL THEN 1 END) as pipeline_count
           FROM ai_query_logs
           WHERE created_at >= datetime('now', '-7 days')`
          )
          .first<{ agent_count: number; pipeline_count: number }>(),
      ])

    const silentFailureRate =
      qualityStats && qualityStats.total_with_score > 0
        ? Math.round((qualityStats.low_quality_count / qualityStats.total_with_score) * 100)
        : null

    return c.json({
      success: true,
      data: {
        queries: {
          today: todayCount?.cnt ?? 0,
          week: weekCount?.cnt ?? 0,
          month: monthCount?.cnt ?? 0,
        },
        avgLatencyMs: avgLatency?.avg ? Math.round(avgLatency.avg) : null,
        quality: {
          avgGroundedness: qualityStats?.avg_groundedness
            ? Math.round(qualityStats.avg_groundedness * 100) / 100
            : null,
          avgAutoScore: qualityStats?.avg_auto_score
            ? Math.round(qualityStats.avg_auto_score * 100) / 100
            : null,
          silentFailureRate,
        },
        toolUsage: (toolUsage.results ?? []).map((r) => ({
          tool: r.query_route,
          count: r.cnt,
        })),
        modeUsage: {
          agent: modeUsage?.agent_count ?? 0,
          pipeline: modeUsage?.pipeline_count ?? 0,
        },
      },
    })
  } catch {
    return c.json({
      success: true,
      data: {
        _mock: true,
        queries: { today: 42, week: 285, month: 1120 },
        avgLatencyMs: 1850,
        quality: {
          avgGroundedness: 0.82,
          avgAutoScore: 3.2,
          silentFailureRate: 5,
        },
        toolUsage: [
          { tool: 'search_routes', count: 95 },
          { tool: 'search_crags', count: 48 },
          { tool: 'sql_query', count: 62 },
          { tool: 'weather', count: 23 },
          { tool: 'recommend', count: 31 },
          { tool: 'user_profile', count: 18 },
          { tool: 'crag_info', count: 12 },
        ],
        modeUsage: { agent: 210, pipeline: 75 },
      },
    })
  }
})
