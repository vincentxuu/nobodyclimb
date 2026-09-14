'use client'

import { Bot, ChevronDown, ChevronRight, Clock, Cpu, Database, Search, Wrench } from 'lucide-react'
import { useState } from 'react'
import type { AILogDetail } from '@/lib/api/admin-ai'
import { KVRow, TraceBadge } from './shared'

type TurnTrace = NonNullable<NonNullable<AILogDetail['pipeline_trace']>['turn_traces']>[number]
type ToolCallData = TurnTrace['tools'][number]

const TOOL_LABELS: Record<string, string> = {
  search_routes: '搜尋路線',
  search_crags: '搜尋岩場',
  sql_query: 'SQL 查詢',
  weather: '天氣查詢',
  'crag-info': '岩場資訊',
  'user-profile': '用戶資料',
  memory: '記憶查詢',
  goals: '目標查詢',
  coaching: '教練分析',
  recommend: '路線推薦',
}

const TOOL_ICONS: Record<string, React.ReactNode> = {
  search_routes: <Search className="h-3.5 w-3.5" />,
  search_crags: <Search className="h-3.5 w-3.5" />,
  sql_query: <Database className="h-3.5 w-3.5" />,
  weather: <Cpu className="h-3.5 w-3.5" />,
}

function ToolTraceDetail({ tool }: { tool: ToolCallData }) {
  const trace = tool.trace
  if (!trace) {
    return <p className="text-[11px] text-wb-40">無工具內部追蹤資料</p>
  }

  return (
    <div className="space-y-3">
      {trace.embedding && (
        <div className="space-y-1">
          <p className="text-[11px] font-medium text-violet-600">向量嵌入</p>
          <div className="rounded border border-violet-100 bg-violet-50/30 px-3 py-2">
            <KVRow label="耗時" value={`${trace.embedding.duration_ms} ms`} />
          </div>
        </div>
      )}

      {trace.filter && Object.keys(trace.filter).length > 0 && (
        <div className="space-y-1">
          <p className="text-[11px] font-medium text-blue-600">Metadata Filter</p>
          <div className="flex flex-wrap gap-1">
            {Object.entries(trace.filter).map(([k, v]) => (
              <span
                key={k}
                className="rounded border border-wb-10 bg-wb-3 px-1.5 py-0.5 text-[10px] text-wb-60 font-mono"
              >
                {k}: {JSON.stringify(v)}
              </span>
            ))}
          </div>
        </div>
      )}

      {trace.retrieval && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium text-emerald-600">混合搜尋</p>
          <div className="rounded border border-emerald-100 bg-emerald-50/30 px-3 py-2 space-y-1.5">
            {trace.retrieval.retrieval_method && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-wb-40">模式</span>
                <TraceBadge text={trace.retrieval.retrieval_method} color="emerald" />
              </div>
            )}
            <div className="flex flex-wrap gap-3 text-[11px]">
              <span className="text-wb-50">
                路徑: <span className="font-mono text-wb-80">{trace.retrieval.paths.length}</span>
              </span>
              {trace.retrieval.rrf && (
                <>
                  <span className="text-wb-50">
                    RRF 合併:{' '}
                    <span className="font-mono text-wb-80">{trace.retrieval.rrf.merged_count}</span>
                  </span>
                  <span className="text-wb-50">
                    通過門檻:{' '}
                    <span className="font-mono text-wb-80">
                      {trace.retrieval.rrf.after_threshold_count}
                    </span>
                  </span>
                </>
              )}
              <span className="text-wb-50">
                最終候選:{' '}
                <span className="font-mono text-wb-80">
                  {trace.retrieval.candidates_after_filter}
                </span>
              </span>
            </div>

            {trace.retrieval.path_counts && (
              <div className="space-y-1 mt-1">
                {Object.entries(trace.retrieval.path_counts).map(([path, count]) => {
                  const pathLabel =
                    path === 'query_vec'
                      ? 'Query Vec'
                      : path === 'hyde_vec'
                        ? 'HyDE Vec'
                        : path === 'bm25'
                          ? 'BM25'
                          : path
                  const color =
                    path === 'query_vec'
                      ? 'blue'
                      : path === 'hyde_vec'
                        ? 'violet'
                        : path === 'bm25'
                          ? 'emerald'
                          : ('default' as const)
                  const docs = trace.retrieval?.path_results?.[path]
                  return (
                    <div key={path} className="flex items-center gap-2">
                      <TraceBadge text={pathLabel} color={color} />
                      <span className="text-[11px] font-mono tabular-nums text-wb-70">
                        {count} 筆
                      </span>
                      {docs && docs.length > 0 && (
                        <span className="text-[10px] text-wb-40">
                          top: {docs[0].score.toFixed(3)}
                          {docs[0].name ? ` (${docs[0].name})` : ''}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {trace.retrieval.crag_fallback && (
              <div className="mt-1 rounded border border-amber-200 bg-amber-50/50 px-2 py-1">
                <span className="text-[10px] text-amber-700 font-medium">CRAG Fallback 觸發</span>
                {trace.retrieval.crag_fallback_detail && (
                  <span className="text-[10px] text-amber-600 ml-2">
                    {trace.retrieval.crag_fallback_detail.trigger_reason}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {trace.text_to_sql && (
        <div className="space-y-1">
          <p className="text-[11px] font-medium text-blue-600">Text-to-SQL</p>
          <div className="rounded border border-blue-100 bg-blue-50/30 px-3 py-2 space-y-1">
            {trace.text_to_sql.template && (
              <KVRow label="Template" value={trace.text_to_sql.template} />
            )}
            {trace.text_to_sql.params && Object.keys(trace.text_to_sql.params).length > 0 && (
              <KVRow
                label="參數"
                value={
                  <span className="font-mono text-[10px]">
                    {JSON.stringify(trace.text_to_sql.params)}
                  </span>
                }
              />
            )}
            {trace.text_to_sql.row_count != null && (
              <KVRow label="結果" value={`${trace.text_to_sql.row_count} 筆`} />
            )}
            {trace.text_to_sql.query_ms != null && (
              <KVRow label="耗時" value={`${trace.text_to_sql.query_ms} ms`} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ToolCard({ tool }: { tool: ToolCallData }) {
  const [expanded, setExpanded] = useState(false)
  const hasTrace = !!tool.trace && Object.keys(tool.trace).length > 0
  const canExpand = hasTrace

  return (
    <div className="rounded-lg border border-wb-10 overflow-hidden">
      <button
        onClick={() => canExpand && setExpanded(!expanded)}
        className={`flex items-center gap-2 w-full px-3 py-2 text-left ${canExpand ? 'cursor-pointer hover:bg-wb-5' : 'cursor-default'} bg-wb-3`}
      >
        <span className="text-violet-500">
          {TOOL_ICONS[tool.name] ?? <Wrench className="h-3.5 w-3.5" />}
        </span>
        <span className="text-[12px] font-medium text-wb-80">
          {TOOL_LABELS[tool.name] ?? tool.name}
        </span>
        {tool.cacheHit && <TraceBadge text="快取" color="blue" />}
        <span className="rounded border border-wb-15 bg-wb-5 px-1.5 py-0.5 text-[10px] tabular-nums text-wb-60">
          {tool.durationMs} ms
        </span>
        {tool.resultCount != null && (
          <span className="rounded border border-wb-15 bg-wb-5 px-1.5 py-0.5 text-[10px] tabular-nums text-wb-60">
            {tool.resultCount} 筆
          </span>
        )}
        {canExpand && (
          <span className="ml-auto text-wb-40">
            {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </span>
        )}
      </button>
      {expanded && (
        <div className="border-t border-wb-10 px-3 py-3 bg-white">
          <ToolTraceDetail tool={tool} />
        </div>
      )}
    </div>
  )
}

function TurnCard({ turn, isLast }: { turn: TurnTrace; isLast: boolean }) {
  const hasTools = turn.tools.length > 0
  const isFinalAnswer = !hasTools
  const totalTurnMs = turn.llmDurationMs + turn.tools.reduce((s, t) => s + t.durationMs, 0)

  return (
    <div className="flex gap-3">
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 mt-2 ${
            isFinalAnswer ? 'border-violet-300 bg-violet-50' : 'border-wb-30 bg-white'
          }`}
        >
          {isFinalAnswer ? (
            <Bot className="h-4 w-4 text-violet-500" />
          ) : (
            <Wrench className="h-4 w-4 text-wb-70" />
          )}
        </div>
        {!isLast && <div className="w-px flex-1 my-1 bg-wb-20" style={{ minHeight: 16 }} />}
      </div>

      {/* Content */}
      <div className="flex-1 pb-4 pt-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-wb-90">Turn {turn.turn}</span>
          {isFinalAnswer ? (
            <TraceBadge text="生成回答" color="violet" />
          ) : (
            <TraceBadge text={`${turn.tools.length} 工具`} color="emerald" />
          )}
          <span className="rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] tabular-nums text-blue-700">
            LLM {turn.llmDurationMs} ms
          </span>
          {hasTools && (
            <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] tabular-nums text-emerald-700">
              工具 {turn.tools.reduce((s, t) => s + t.durationMs, 0)} ms
            </span>
          )}
          <span className="rounded border border-wb-15 bg-wb-5 px-1.5 py-0.5 text-[10px] tabular-nums text-wb-60">
            合計 {totalTurnMs} ms
          </span>
        </div>
        <p className="mt-0.5 text-[11px] font-mono text-wb-50">
          {turn.model.split('/').pop()}
          {turn.usedFallback && <span className="ml-2 text-amber-600">(fallback)</span>}
        </p>

        {hasTools && (
          <div className="mt-2 space-y-1.5">
            {turn.tools.map((tool, i) => (
              <ToolCard key={`${tool.name}-${i}`} tool={tool} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function AgentWaterfallChart({
  turnTraces,
  totalMs,
}: {
  turnTraces: TurnTrace[]
  totalMs: number
}) {
  if (totalMs <= 0) return null

  return (
    <div className="rounded-xl border border-wb-20 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold text-wb-100">延遲分解</h2>

      {/* Stacked bar */}
      <div className="mb-3 flex h-4 w-full overflow-hidden rounded-full bg-wb-10">
        {turnTraces.map((t) => {
          const toolMs = t.tools.reduce((s, tool) => s + tool.durationMs, 0)
          return (
            <div
              key={t.turn}
              className="flex"
              style={{ width: `${((t.llmDurationMs + toolMs) / totalMs) * 100}%` }}
            >
              <div
                className="bg-blue-400"
                style={{
                  width:
                    toolMs + t.llmDurationMs > 0
                      ? `${(t.llmDurationMs / (t.llmDurationMs + toolMs)) * 100}%`
                      : '0%',
                }}
                title={`Turn ${t.turn} LLM: ${t.llmDurationMs} ms`}
              />
              {toolMs > 0 && (
                <div
                  className="bg-emerald-400"
                  style={{ width: `${(toolMs / (t.llmDurationMs + toolMs)) * 100}%` }}
                  title={`Turn ${t.turn} 工具: ${toolMs} ms`}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Per-turn breakdown */}
      <div className="space-y-1.5">
        {turnTraces.map((t) => {
          const toolMs = t.tools.reduce((s, tool) => s + tool.durationMs, 0)
          const turnTotal = t.llmDurationMs + toolMs
          return (
            <div key={t.turn} className="flex items-center gap-2 text-xs">
              <span className="w-16 shrink-0 text-wb-50">Turn {t.turn}</span>
              <div className="flex-1 flex h-2.5 rounded-full bg-wb-10 overflow-hidden">
                <div
                  className="bg-blue-400 rounded-l-full"
                  style={{ width: `${totalMs > 0 ? (t.llmDurationMs / totalMs) * 100 : 0}%` }}
                />
                {toolMs > 0 && (
                  <div
                    className="bg-emerald-400"
                    style={{ width: `${totalMs > 0 ? (toolMs / totalMs) * 100 : 0}%` }}
                  />
                )}
              </div>
              <span className="w-20 shrink-0 text-right font-mono tabular-nums text-wb-70">
                {turnTotal} ms
              </span>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-4">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-blue-400" />
          <span className="text-xs text-wb-60">LLM</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-emerald-400" />
          <span className="text-xs text-wb-60">工具</span>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-wb-50" />
          <span className="text-xs text-wb-60">總計</span>
          <span className="text-xs font-semibold tabular-nums text-wb-100">{totalMs} ms</span>
        </div>
      </div>
    </div>
  )
}

function AgentCostCard({ pipelineTrace }: { pipelineTrace: AILogDetail['pipeline_trace'] }) {
  const stats = pipelineTrace?.per_model_stats
  if (!stats || stats.length === 0) return null

  const totalInput = stats.reduce((s, m) => s + (m.inputTokens ?? m.prompt_tokens ?? 0), 0)
  const totalOutput = stats.reduce((s, m) => s + (m.outputTokens ?? m.completion_tokens ?? 0), 0)
  const totalCalls = stats.reduce((s, m) => s + (m.calls ?? 1), 0)

  return (
    <div className="rounded-xl border border-wb-20 bg-white overflow-hidden">
      <div className="border-b border-wb-10 px-5 py-4">
        <h2 className="text-sm font-semibold text-wb-100">Token 統計</h2>
        {(pipelineTrace?.cost_usd != null || pipelineTrace?.cost_twd != null) && (
          <p className="mt-0.5 text-xs text-wb-50">
            {pipelineTrace.cost_usd != null && `$${pipelineTrace.cost_usd.toFixed(6)} USD`}
            {pipelineTrace.cost_twd != null && ` ≈ NT$${pipelineTrace.cost_twd.toFixed(4)}`}
          </p>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-wb-10 bg-wb-05">
              <th className="px-4 py-2 text-left font-semibold text-wb-60">Provider</th>
              <th className="px-4 py-2 text-left font-semibold text-wb-60">Model</th>
              <th className="px-3 py-2 text-right font-semibold text-wb-60">Input</th>
              <th className="px-3 py-2 text-right font-semibold text-wb-60">Output</th>
              <th className="px-3 py-2 text-right font-semibold text-wb-60">Calls</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-wb-10">
            {stats.map((m, i) => (
              <tr key={i} className="hover:bg-wb-05">
                <td className="px-4 py-2 text-wb-60">{m.provider}</td>
                <td className="px-4 py-2 font-mono text-wb-70">{m.model.split('/').pop()}</td>
                <td className="px-3 py-2 text-right font-mono text-wb-70">
                  {(m.inputTokens ?? m.prompt_tokens ?? 0).toLocaleString()}
                </td>
                <td className="px-3 py-2 text-right font-mono text-wb-70">
                  {(m.outputTokens ?? m.completion_tokens ?? 0).toLocaleString()}
                </td>
                <td className="px-3 py-2 text-right font-mono text-wb-70">{m.calls ?? 1}</td>
              </tr>
            ))}
            <tr className="bg-wb-05 font-semibold border-t-2 border-wb-20">
              <td className="px-4 py-2.5 text-wb-80" colSpan={2}>
                合計
              </td>
              <td className="px-3 py-2.5 text-right font-mono text-wb-80">
                {totalInput.toLocaleString()}
              </td>
              <td className="px-3 py-2.5 text-right font-mono text-wb-80">
                {totalOutput.toLocaleString()}
              </td>
              <td className="px-3 py-2.5 text-right font-mono text-wb-80">{totalCalls}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function AgentTimeline({
  turnTraces,
  latency,
  pipelineTrace,
}: {
  turnTraces: TurnTrace[]
  latency: AILogDetail['latency']
  pipelineTrace: AILogDetail['pipeline_trace']
}) {
  const totalMs = latency.total_ms ?? 0

  return (
    <div className="space-y-6">
      {/* Agent cost */}
      <AgentCostCard pipelineTrace={pipelineTrace} />

      {/* Turn timeline */}
      <div className="rounded-xl border border-wb-20 bg-white p-5">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-sm font-semibold text-wb-100">Agent 流程</h2>
          <span className="rounded-md border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-600">
            {turnTraces.length} turns
          </span>
        </div>
        <p className="mb-4 text-[11px] text-wb-40">
          每個 Turn = 一次 LLM 呼叫 + 工具執行。點擊工具卡片展開內部搜尋/查詢細節。
        </p>
        <div className="space-y-0">
          {turnTraces.map((turn, idx) => (
            <TurnCard key={turn.turn} turn={turn} isLast={idx === turnTraces.length - 1} />
          ))}
        </div>
      </div>

      {/* Waterfall chart */}
      <AgentWaterfallChart turnTraces={turnTraces} totalMs={totalMs} />
    </div>
  )
}
