'use client'

import { ChevronDown, ChevronRight, Database, Loader2, Search, Wrench, Zap } from 'lucide-react'
import { useCallback, useState } from 'react'
import { type AdminTool, useAdminTools, useUpdateAdminTool } from '@/lib/api/admin-ai'

const CATEGORY_LABELS: Record<string, string> = {
  search: '搜尋',
  data: '資料',
  personal: '個人',
  external: '外部',
  'sub-agent': 'Sub-Agent',
}

const CATEGORY_COLORS: Record<string, string> = {
  search: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  data: 'bg-blue-50 text-blue-700 border-blue-200',
  personal: 'bg-violet-50 text-violet-700 border-violet-200',
  external: 'bg-amber-50 text-amber-700 border-amber-200',
  'sub-agent': 'bg-rose-50 text-rose-700 border-rose-200',
}

const SOURCE_LABELS: Record<string, string> = {
  builtin: '內建',
  mcp: 'MCP',
  plugin: 'Plugin',
}

function ToolCard({ tool }: { tool: AdminTool }) {
  const [expanded, setExpanded] = useState(false)
  const [override, setOverride] = useState(tool.description_override ?? '')
  const [dirty, setDirty] = useState(false)
  const { mutate: updateTool, isPending } = useUpdateAdminTool()

  const handleToggle = useCallback(() => {
    updateTool({ name: tool.name, data: { enabled: tool.enabled ? 0 : 1 } })
  }, [tool.name, tool.enabled, updateTool])

  const handleSaveOverride = useCallback(() => {
    updateTool(
      { name: tool.name, data: { description_override: override || null } },
      { onSuccess: () => setDirty(false) }
    )
  }, [tool.name, override, updateTool])

  const errorRate =
    tool.stats_call_count > 0
      ? ((tool.stats_error_count / tool.stats_call_count) * 100).toFixed(1)
      : null

  const categoryColor = CATEGORY_COLORS[tool.category ?? ''] ?? 'bg-wb-10 text-wb-60 border-wb-20'

  return (
    <div
      className={`rounded-xl border bg-white overflow-hidden transition-colors ${
        tool.enabled ? 'border-wb-20' : 'border-wb-10 opacity-60'
      }`}
    >
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-wb-05">
          {tool.category === 'search' ? (
            <Search className="h-4 w-4 text-wb-60" />
          ) : tool.category === 'data' ? (
            <Database className="h-4 w-4 text-wb-60" />
          ) : tool.category === 'sub-agent' ? (
            <Zap className="h-4 w-4 text-wb-60" />
          ) : (
            <Wrench className="h-4 w-4 text-wb-60" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-wb-100 font-mono">{tool.name}</span>
            <span
              className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${categoryColor}`}
            >
              {CATEGORY_LABELS[tool.category ?? ''] ?? tool.category}
            </span>
            {tool.source !== 'builtin' && (
              <span className="rounded-md border border-wb-20 bg-wb-05 px-1.5 py-0.5 text-[10px] text-wb-50">
                {SOURCE_LABELS[tool.source] ?? tool.source}
              </span>
            )}
            {tool.requires_auth === 1 && <span className="text-[10px] text-wb-40">🔒</span>}
          </div>
          <p className="mt-0.5 text-xs text-wb-60 truncate">
            {tool.description_override || tool.description || '—'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {tool.stats_call_count > 0 && (
            <div className="text-right hidden sm:block">
              <p className="text-xs font-mono text-wb-50">
                {tool.stats_call_count.toLocaleString()} 次
              </p>
              {tool.stats_avg_latency_ms != null && (
                <p className="text-[10px] text-wb-40">
                  {Math.round(tool.stats_avg_latency_ms)} ms avg
                </p>
              )}
            </div>
          )}

          <button
            onClick={handleToggle}
            disabled={isPending}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
              tool.enabled ? 'bg-emerald-500' : 'bg-wb-30'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                tool.enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>

          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded hover:bg-wb-05 text-wb-40"
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-wb-10 px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-wb-60 mb-1">
              描述覆寫（留空使用程式碼預設）
            </label>
            <textarea
              value={override}
              onChange={(e) => {
                setOverride(e.target.value)
                setDirty(true)
              }}
              placeholder={tool.description ?? '工具描述...'}
              rows={2}
              className="w-full rounded-lg border border-wb-20 bg-white px-3 py-2 text-sm text-wb-80 placeholder:text-wb-30 outline-none focus:border-wb-50 resize-none"
            />
            {dirty && (
              <div className="mt-2 flex justify-end">
                <button
                  onClick={handleSaveOverride}
                  disabled={isPending}
                  className="rounded-lg bg-wb-100 px-4 py-1.5 text-xs font-medium text-white hover:bg-wb-90 disabled:opacity-50"
                >
                  儲存
                </button>
              </div>
            )}
          </div>

          {tool.stats_call_count > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-wb-10 bg-wb-05 px-3 py-2">
                <p className="text-[10px] text-wb-40">呼叫次數</p>
                <p className="text-sm font-mono font-semibold text-wb-100">
                  {tool.stats_call_count.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg border border-wb-10 bg-wb-05 px-3 py-2">
                <p className="text-[10px] text-wb-40">錯誤率</p>
                <p
                  className={`text-sm font-mono font-semibold ${errorRate && parseFloat(errorRate) > 5 ? 'text-red-600' : 'text-wb-100'}`}
                >
                  {errorRate ?? '0'}%
                </p>
              </div>
              <div className="rounded-lg border border-wb-10 bg-wb-05 px-3 py-2">
                <p className="text-[10px] text-wb-40">平均延遲</p>
                <p className="text-sm font-mono font-semibold text-wb-100">
                  {tool.stats_avg_latency_ms != null
                    ? `${Math.round(tool.stats_avg_latency_ms)} ms`
                    : '—'}
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-1">
            {(() => {
              try {
                const tags = JSON.parse(tool.tags ?? '[]') as string[]
                return tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded border border-wb-10 bg-wb-05 px-1.5 py-0.5 text-[10px] text-wb-50 font-mono"
                  >
                    {tag}
                  </span>
                ))
              } catch {
                return null
              }
            })()}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminToolsPage() {
  const { data: tools, isLoading, error } = useAdminTools()

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-wb-50" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
        載入工具列表失敗
      </div>
    )
  }

  const grouped = (tools ?? []).reduce(
    (acc, tool) => {
      const cat = tool.category ?? 'other'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(tool)
      return acc
    },
    {} as Record<string, AdminTool[]>
  )

  const categoryOrder = ['search', 'data', 'personal', 'external', 'sub-agent', 'other']
  const sortedCategories = categoryOrder.filter((c) => grouped[c]?.length)

  const enabledCount = (tools ?? []).filter((t) => t.enabled).length
  const totalCount = tools?.length ?? 0

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-wb-100">工具管理</h1>
        <p className="mt-1 text-sm text-wb-60">
          管理 AI Agent 可用的工具。停用工具後 Agent 將無法使用該工具。
        </p>
      </div>

      <div className="flex items-center gap-4">
        <span className="rounded-xl border border-wb-20 bg-white px-4 py-2 text-sm text-wb-80">
          <span className="font-semibold text-emerald-600">{enabledCount}</span>
          <span className="text-wb-40"> / {totalCount} 啟用</span>
        </span>
      </div>

      {sortedCategories.map((cat) => (
        <div key={cat}>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-wb-50">
            {CATEGORY_LABELS[cat] ?? cat}
          </h2>
          <div className="space-y-2">
            {grouped[cat].map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
