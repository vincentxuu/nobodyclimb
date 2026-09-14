'use client'

import { ChevronDown, ChevronRight, Eye, Loader2, Shield, Sparkles } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import {
  type AdminHook,
  type HookEvent,
  type HookType,
  useAdminHooks,
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
  gate: {
    label: '攔截',
    color: 'bg-red-50 text-red-700 border-red-200',
    icon: Shield,
  },
  enrich: {
    label: '注入',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: Sparkles,
  },
  observe: {
    label: '觀察',
    color: 'bg-wb-10 text-wb-60 border-wb-20',
    icon: Eye,
  },
}

function HookCard({ hook }: { hook: AdminHook }) {
  const [expanded, setExpanded] = useState(false)
  const [priority, setPriority] = useState(hook.priority)
  const [config, setConfig] = useState(hook.config ?? '')
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
        },
      },
      { onSuccess: () => setDirty(false) }
    )
  }, [hook.id, priority, config, updateHook])

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
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-wb-100">{hook.name}</span>
            <span
              className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${typeStyle.color}`}
            >
              {typeStyle.label}
            </span>
            <span className="rounded-md border border-wb-10 bg-wb-05 px-1.5 py-0.5 text-[10px] text-wb-40 font-mono">
              P{hook.priority}
            </span>
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
        <div className="border-t border-wb-10 px-4 py-3 space-y-3">
          <div className="flex items-center gap-4">
            <label className="text-xs text-wb-60">優先序</label>
            <input
              type="number"
              value={priority}
              onChange={(e) => {
                setPriority(Number(e.target.value))
                setDirty(true)
              }}
              min={0}
              max={999}
              className="w-20 rounded border border-wb-20 bg-white px-2 py-1 text-sm text-wb-80 font-mono outline-none focus:border-wb-50"
            />
            <span className="text-[10px] text-wb-40">數字越小越先執行</span>
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

  return (
    <div className="flex gap-4">
      {/* Timeline connector */}
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

      {/* Content */}
      <div className="flex-1 pb-5 pt-0.5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-wb-90">{EVENT_LABELS[event]}</span>
          <span className="text-[10px] font-mono text-wb-40">{event}</span>
          {isAsync && (
            <span className="rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
              async
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

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-wb-100">Hooks 管理</h1>
        <p className="mt-1 text-sm text-wb-60">
          Agent 生命週期攔截點。Hook
          可在查詢處理的各個階段攔截（gate）、注入上下文（enrich）或觀察（observe）。
        </p>
      </div>

      <div className="flex items-center gap-4">
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
      </div>

      {/* Lifecycle timeline */}
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
