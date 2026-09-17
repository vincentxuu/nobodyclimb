'use client'

import { useQuery } from '@tanstack/react-query'
import { Activity, AlertTriangle, Clock, Loader2, Search, TrendingUp } from 'lucide-react'
import apiClient from '@/lib/api/client'

interface QualityStats {
  _mock?: boolean
  queries: { today: number; week: number; month: number }
  avgLatencyMs: number | null
  quality: {
    avgGroundedness: number | null
    avgAutoScore: number | null
    silentFailureRate: number | null
  }
  toolUsage: Array<{ tool: string; count: number }>
  modeUsage: { agent: number; pipeline: number }
}

const TOOL_LABELS: Record<string, string> = {
  search_routes: '路線搜尋',
  search_crags: '岩場搜尋',
  sql_query: 'SQL 查詢',
  weather: '天氣查詢',
  recommend: '個人推薦',
  recommend_agent: '推薦 Agent',
  user_profile: '個人檔案',
  crag_info: '岩場資訊',
  recall_memory: '記憶召回',
  suggest_training: '訓練分析',
  coaching_agent: '教練 Agent',
  manage_goals: '目標管理',
  agent: 'Agent 路由',
}

function useQualityStats() {
  return useQuery({
    queryKey: ['admin-ai-quality-stats'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: QualityStats }>(
        '/admin/ai/quality/stats'
      )
      return res.data.data
    },
    staleTime: 60 * 1000,
  })
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  color,
}: {
  icon: typeof Activity
  label: string
  value: string
  subtitle?: string
  color: string
}) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-xs">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Icon className={`h-4 w-4 ${color}`} />
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold text-gray-900">{value}</div>
      {subtitle && <div className="mt-0.5 text-xs text-gray-400">{subtitle}</div>}
    </div>
  )
}

function ToolBar({ name, count, maxCount }: { name: string; count: number; maxCount: number }) {
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0
  const label = TOOL_LABELS[name] ?? name
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-right text-xs text-gray-500">{label}</span>
      <div className="relative h-5 flex-1 rounded bg-gray-100">
        <div
          className="absolute inset-y-0 left-0 rounded bg-emerald-500 transition-all"
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
        <span className="absolute inset-y-0 left-2 flex items-center text-xs font-medium text-white mix-blend-difference">
          {count}
        </span>
      </div>
    </div>
  )
}

export default function AIQualityPage() {
  const { data, isLoading } = useQualityStats()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!data) {
    return <div className="py-12 text-center text-gray-400">無法載入品質資料</div>
  }

  const maxToolCount = Math.max(...(data.toolUsage.map((t) => t.count) || [1]))
  const totalMode = data.modeUsage.agent + data.modeUsage.pipeline
  const agentPct = totalMode > 0 ? Math.round((data.modeUsage.agent / totalMode) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">AI 品質監控</h1>
        {data._mock && (
          <span className="rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-600">模擬資料</span>
        )}
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Search}
          label="今日查詢"
          value={String(data.queries.today)}
          subtitle={`本週 ${data.queries.week} / 本月 ${data.queries.month}`}
          color="text-blue-500"
        />
        <StatCard
          icon={TrendingUp}
          label="平均品質"
          value={data.quality.avgAutoScore?.toFixed(1) ?? '—'}
          subtitle={`滿分 4.0 | Groundedness ${data.quality.avgGroundedness?.toFixed(2) ?? '—'}`}
          color="text-emerald-500"
        />
        <StatCard
          icon={Clock}
          label="平均回應"
          value={data.avgLatencyMs ? `${(data.avgLatencyMs / 1000).toFixed(1)}s` : '—'}
          subtitle="過去 7 天"
          color="text-purple-500"
        />
        <StatCard
          icon={AlertTriangle}
          label="Silent Failure"
          value={
            data.quality.silentFailureRate !== null ? `${data.quality.silentFailureRate}%` : '—'
          }
          subtitle="品質 < 2 的比例"
          color={
            data.quality.silentFailureRate !== null && data.quality.silentFailureRate > 10
              ? 'text-red-500'
              : 'text-gray-400'
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 工具使用分佈 */}
        <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-xs">
          <h2 className="mb-3 text-sm font-medium text-gray-700">工具使用分佈（7 天）</h2>
          <div className="space-y-2">
            {data.toolUsage.length > 0 ? (
              data.toolUsage.map((t) => (
                <ToolBar key={t.tool} name={t.tool} count={t.count} maxCount={maxToolCount} />
              ))
            ) : (
              <div className="py-4 text-center text-sm text-gray-400">尚無資料</div>
            )}
          </div>
        </div>

        {/* Agent vs Pipeline */}
        <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-xs">
          <h2 className="mb-3 text-sm font-medium text-gray-700">Agent vs Pipeline（7 天）</h2>
          {totalMode > 0 ? (
            <>
              <div className="mb-2 flex h-6 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="flex items-center justify-center bg-emerald-500 text-xs font-medium text-white transition-all"
                  style={{ width: `${agentPct}%` }}
                >
                  {agentPct > 15 && `${agentPct}%`}
                </div>
                <div
                  className="flex items-center justify-center bg-blue-400 text-xs font-medium text-white transition-all"
                  style={{ width: `${100 - agentPct}%` }}
                >
                  {100 - agentPct > 15 && `${100 - agentPct}%`}
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Agent {data.modeUsage.agent}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-400" />
                  Pipeline {data.modeUsage.pipeline}
                </span>
              </div>
            </>
          ) : (
            <div className="py-4 text-center text-sm text-gray-400">尚無資料</div>
          )}

          <div className="mt-6">
            <h3 className="mb-2 text-xs font-medium text-gray-500">品質指標說明</h3>
            <ul className="space-y-1 text-xs text-gray-400">
              <li>- Groundedness：回答有多少比例基於工具結果（0-1）</li>
              <li>- Auto Score：judge 自動評分（1-4，4 最好）</li>
              <li>- Silent Failure：回答了但品質 &lt; 2 的比例</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
