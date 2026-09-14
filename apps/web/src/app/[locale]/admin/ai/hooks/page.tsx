'use client'

import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Clock,
  Eye,
  Filter,
  Loader2,
  Lock,
  Shield,
  ShieldOff,
  Sparkles,
} from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import {
  type AdminHook,
  type HookEvent,
  type HookExecution,
  type HookType,
  useAdminHooks,
  useHookExecutions,
  useUpdateAdminHook,
} from '@/lib/api/admin-ai'

const EVENT_ORDER: HookEvent[] = [
  'pre_loop',
  'pre_turn',
  'pre_tool',
  'post_tool',
  'post_loop',
  'post_response',
]

const EVENT_LABELS: Record<HookEvent, string> = {
  pre_loop: '進入前',
  pre_turn: '輪次前',
  pre_tool: '工具前',
  post_tool: '工具後',
  post_loop: '生成後',
  post_response: '回應後（非同步）',
}

const EVENT_DESCRIPTIONS: Record<HookEvent, string> = {
  pre_loop: 'Agent loop 啟動前，可攔截無效查詢',
  pre_turn: '每個 LLM 呼叫前，可檢查 token 預算',
  pre_tool: '工具執行前，可阻擋特定工具呼叫',
  post_tool: '工具執行後，可處理工具錯誤',
  post_loop: 'Agent 生成回答後，可過濾敏感內容',
  post_response: '回應送出後（非同步），用於品質評估等',
}

const TYPE_STYLES: Record<HookType, { label: string; color: string; icon: typeof Shield }> = {
  gate: { label: '攔截', color: 'bg-red-50 text-red-700 border-red-200', icon: Shield },
  enrich: { label: '注入', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Sparkles },
  observe: { label: '觀察', color: 'bg-wb-10 text-wb-60 border-wb-20', icon: Eye },
}

const DECISION_STYLES: Record<string, string> = {
  allow: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  deny: 'bg-red-50 text-red-700 border-red-200',
  modify: 'bg-blue-50 text-blue-700 border-blue-200',
  noop: 'bg-wb-10 text-wb-60 border-wb-20',
}

function ExecutionHistory({ hookId }: { hookId: string }) {
  const { data: executions, isLoading } = useHookExecutions(hookId)

  if (isLoading) {
    return <Loader2 className="h-3 w-3 animate-spin text-wb-40" />
  }

  const items = (executions ?? []).slice(0, 10)
  if (items.length === 0) {
    return <p className="text-[11px] text-wb-30 italic">尚無執行記錄</p>
  }

  return (
    <div className="space-y-1">
      {items.map((ex: HookExecution) => (
        <div
          key={ex.id}
          className={`flex items-center gap-2 rounded px-2 py-1 text-[11px] ${
            ex.error ? 'bg-red-50/50' : 'bg-wb-05'
          }`}
        >
          {ex.decision && (
            <span
              className={`rounded border px-1.5 py-0.5 text-[9px] font-medium ${
                DECISION_STYLES[ex.decision] ?? DECISION_STYLES.noop
              }`}
            >
              {ex.decision}
            </span>
          )}
          {ex.duration_ms != null && (
            <span className="text-wb-50 font-mono tabular-nums">{ex.duration_ms}ms</span>
          )}
          {ex.error && (
            <span className="flex-1 truncate text-red-600" title={ex.error}>
              {ex.error}
            </span>
          )}
          <span className="ml-auto text-wb-30 shrink-0">
            {new Date(ex.executed_at).toLocaleTimeString('zh-TW', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </span>
        </div>
      ))}
    </div>
  )
}

function HookCard({ hook }: { hook: AdminHook }) {
  const [expanded, setExpanded] = useState(false)
  const [priority, setPriority] = useState(hook.priority)
  const [config, setConfig] = useState(hook.config ?? '')
  const [matcher, setMatcher] = useState(hook.matcher ?? '')
  const [timeoutMs, setTimeoutMs] = useState(hook.timeout_ms)
  const [onFailure, setOnFailure] = useState(hook.on_failure)
  const [blocking, setBlocking] = useState(hook.blocking)
  const [dirty, setDirty] = useState(false)
  const { mutate: updateHook, isPending } = useUpdateAdminHook()

  const handleToggle = useCallback(() => {
    updateHook({ id: hook.id, data: { enabled: hook.enabled ? 0 : 1 } })
  }, [hook.id, hook.enabled, updateHook])

  const handleSave = useCallback(() => {
    updateHook(
      {
        id: hook.id,
        data: {
          priority,
          config: config || null,
          matcher: matcher || null,
          timeout_ms: timeoutMs,
          on_failure: onFailure,
          blocking,
        },
      },
      { onSuccess: () => setDirty(false) }
    )
  }, [hook.id, priority, config, matcher, timeoutMs, onFailure, blocking, updateHook])

  const typeStyle = TYPE_STYLES[hook.hook_type]
  const TypeIcon = typeStyle.icon

  return (
    <div
      className={`rounded-lg border bg-white overflow-hidden transition-colors ${
        hook.enabled ? 'border-wb-20' : 'border-wb-10 opacity-60'
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-wb-05">
          <TypeIcon className="h-3.5 w-3.5 text-wb-60" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-wb-100">{hook.name}</span>
            <span
              className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${typeStyle.color}`}
            >
              {typeStyle.label}
            </span>
            <span className="rounded-md border border-wb-10 bg-wb-05 px-1.5 py-0.5 text-[10px] text-wb-40 font-mono">
              P{hook.priority}
            </span>
            {hook.blocking ? (
              <span title="Blocking">
                <Lock className="h-3 w-3 text-red-500" />
              </span>
            ) : null}
            <span
              className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${
                hook.on_failure === 'fail_closed'
                  ? 'bg-red-50 text-red-600 border-red-200'
                  : 'bg-emerald-50 text-emerald-600 border-emerald-200'
              }`}
            >
              {hook.on_failure === 'fail_closed' ? '失敗阻斷' : '失敗放行'}
            </span>
            <span className="text-[10px] text-wb-30 font-mono">{hook.timeout_ms}ms</span>
            {hook.matcher && (
              <span className="rounded border border-wb-10 bg-wb-05 px-1.5 py-0.5 text-[10px] text-wb-50 font-mono flex items-center gap-1">
                <Filter className="h-2.5 w-2.5" />
                {hook.matcher}
              </span>
            )}
          </div>
          {hook.description && (
            <p className="mt-0.5 text-xs text-wb-60 truncate">{hook.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-wb-40 font-mono hidden sm:block">
            {hook.implementation}
          </span>

          <button
            onClick={handleToggle}
            disabled={isPending}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
              hook.enabled ? 'bg-emerald-500' : 'bg-wb-30'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                hook.enabled ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>

          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded hover:bg-wb-05 text-wb-40"
          >
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-wb-10 px-4 py-3 space-y-4">
          {/* Settings grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-wb-60 mb-1">優先序</label>
              <input
                type="number"
                value={priority}
                onChange={(e) => {
                  setPriority(Number(e.target.value))
                  setDirty(true)
                }}
                min={0}
                max={999}
                className="w-full rounded border border-wb-20 bg-white px-2 py-1 text-sm text-wb-80 font-mono outline-none focus:border-wb-50"
              />
            </div>
            <div>
              <label className="block text-xs text-wb-60 mb-1">超時（ms）</label>
              <input
                type="number"
                value={timeoutMs}
                onChange={(e) => {
                  setTimeoutMs(Number(e.target.value))
                  setDirty(true)
                }}
                min={100}
                max={30000}
                step={100}
                className="w-full rounded border border-wb-20 bg-white px-2 py-1 text-sm text-wb-80 font-mono outline-none focus:border-wb-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-wb-60 mb-1">失敗行為</label>
              <select
                value={onFailure}
                onChange={(e) => {
                  setOnFailure(e.target.value as 'fail_open' | 'fail_closed')
                  setDirty(true)
                }}
                className="w-full rounded border border-wb-20 bg-white px-2 py-1.5 text-sm text-wb-80 outline-none focus:border-wb-50"
              >
                <option value="fail_open">Fail Open（放行）</option>
                <option value="fail_closed">Fail Closed（阻斷）</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-wb-60 mb-1">Blocking</label>
              <button
                onClick={() => {
                  setBlocking(blocking ? 0 : 1)
                  setDirty(true)
                }}
                className={`flex items-center gap-2 w-full rounded border px-2 py-1.5 text-sm transition-colors ${
                  blocking
                    ? 'border-red-200 bg-red-50 text-red-700'
                    : 'border-wb-20 bg-white text-wb-60'
                }`}
              >
                {blocking ? (
                  <>
                    <Lock className="h-3.5 w-3.5" />
                    可否決 / 改寫
                  </>
                ) : (
                  <>
                    <ShieldOff className="h-3.5 w-3.5" />
                    僅觀察
                  </>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-wb-60 mb-1">
              Matcher（正則或 glob，比對 tool qualified_key）
            </label>
            <input
              type="text"
              value={matcher}
              onChange={(e) => {
                setMatcher(e.target.value)
                setDirty(true)
              }}
              placeholder="例：search_* 或 mcp_weather_.*"
              className="w-full rounded border border-wb-20 bg-white px-2 py-1 text-sm text-wb-80 font-mono placeholder:text-wb-30 outline-none focus:border-wb-50"
            />
          </div>

          <div>
            <label className="block text-xs text-wb-60 mb-1">設定（JSON）</label>
            <textarea
              value={config}
              onChange={(e) => {
                setConfig(e.target.value)
                setDirty(true)
              }}
              placeholder="{}"
              rows={3}
              className="w-full rounded-lg border border-wb-20 bg-white px-3 py-2 text-xs text-wb-80 font-mono placeholder:text-wb-30 outline-none focus:border-wb-50 resize-none"
            />
          </div>

          {dirty && (
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={isPending}
                className="rounded-lg bg-wb-100 px-4 py-1.5 text-xs font-medium text-white hover:bg-wb-90 disabled:opacity-50"
              >
                儲存
              </button>
            </div>
          )}

          {/* Execution history */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-3.5 w-3.5 text-wb-50" />
              <span className="text-xs font-medium text-wb-70">最近執行記錄</span>
            </div>
            <ExecutionHistory hookId={hook.id} />
          </div>
        </div>
      )}
    </div>
  )
}

function EventGroup({
  event,
  hooks,
  isLast,
}: {
  event: HookEvent
  hooks: AdminHook[]
  isLast: boolean
}) {
  const sortedHooks = useMemo(() => [...hooks].sort((a, b) => a.priority - b.priority), [hooks])
  const isAsync = event === 'post_response'
  const hasBlocking = hooks.some((h) => h.blocking)

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
            hooks.length > 0 ? 'border-wb-50 bg-wb-10' : 'border-wb-20 bg-white'
          }`}
        >
          <span className="text-[10px] font-bold text-wb-60">{hooks.length}</span>
        </div>
        {!isLast && <div className="w-px flex-1 my-1 bg-wb-20" style={{ minHeight: 16 }} />}
      </div>

      <div className="flex-1 pb-5 pt-0.5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-wb-90">{EVENT_LABELS[event]}</span>
          <span className="text-[10px] font-mono text-wb-40">{event}</span>
          {isAsync && (
            <span className="rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
              async
            </span>
          )}
          {hasBlocking && (
            <span className="rounded-md border border-red-200 bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-600 flex items-center gap-0.5">
              <AlertTriangle className="h-2.5 w-2.5" />
              blocking
            </span>
          )}
        </div>
        <p className="text-[11px] text-wb-50 mb-3">{EVENT_DESCRIPTIONS[event]}</p>

        {sortedHooks.length > 0 ? (
          <div className="space-y-1.5">
            {sortedHooks.map((hook) => (
              <HookCard key={hook.id} hook={hook} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-wb-30 italic">無 hook</p>
        )}
      </div>
    </div>
  )
}

export default function AdminHooksPage() {
  const { data: hooks, isLoading, error } = useAdminHooks()

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
        載入 Hooks 列表失敗
      </div>
    )
  }

  const grouped = useMemo(() => {
    const map: Record<HookEvent, AdminHook[]> = {
      pre_loop: [],
      pre_turn: [],
      pre_tool: [],
      post_tool: [],
      post_loop: [],
      post_response: [],
    }
    for (const hook of hooks ?? []) {
      if (map[hook.event]) {
        map[hook.event].push(hook)
      }
    }
    return map
  }, [hooks])

  const enabledCount = (hooks ?? []).filter((h) => h.enabled).length
  const totalCount = hooks?.length ?? 0
  const blockingCount = (hooks ?? []).filter((h) => h.blocking).length

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-wb-100">Hooks 管理</h1>
        <p className="mt-1 text-sm text-wb-60">
          Agent 生命週期攔截點。Hook
          可在查詢處理的各個階段攔截（gate）、注入上下文（enrich）或觀察（observe）。
        </p>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <span className="rounded-xl border border-wb-20 bg-white px-4 py-2 text-sm text-wb-80">
          <span className="font-semibold text-emerald-600">{enabledCount}</span>
          <span className="text-wb-40"> / {totalCount} 啟用</span>
        </span>
        <div className="flex gap-2">
          {(['gate', 'enrich', 'observe'] as const).map((type) => {
            const style = TYPE_STYLES[type]
            const count = (hooks ?? []).filter((h) => h.hook_type === type).length
            return (
              <span
                key={type}
                className={`rounded-md border px-2 py-1 text-[11px] font-medium ${style.color}`}
              >
                {style.label} {count}
              </span>
            )
          })}
        </div>
        {blockingCount > 0 && (
          <span className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-medium text-red-600 flex items-center gap-1">
            <Lock className="h-3 w-3" />
            {blockingCount} blocking
          </span>
        )}
      </div>

      <div className="rounded-xl border border-wb-20 bg-white p-5">
        <h2 className="text-sm font-semibold text-wb-100 mb-4">Agent 生命週期</h2>
        <div>
          {EVENT_ORDER.map((event, idx) => (
            <EventGroup
              key={event}
              event={event}
              hooks={grouped[event]}
              isLast={idx === EVENT_ORDER.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
