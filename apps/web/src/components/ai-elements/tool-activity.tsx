'use client'

import { ChevronRightIcon, Loader2Icon, XCircleIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { AIStreamProgressEvent } from '@/lib/api/ai'
import { formatDuration, getToolSummary, mergeToolProgress } from '@/lib/chat/tool-progress'
import { cn } from '@/lib/utils'

// 仿 Claude 的工具使用過程 UI：
// 1. 摺疊列「正在搜尋路線…」/「已完成 N 個查詢步驟 ›」
// 2. 展開後每個工具一列「搜尋路線  龍洞 5.10 ›」
// 3. 每列再展開顯示 Request（參數）與 Response（截斷後的回傳）
// 所有文案取自 messages 的 Chat namespace，依 locale 切換。

interface ToolActivityProps {
  events: AIStreamProgressEvent[]
  isStreaming?: boolean
  className?: string
}

// 後端 tool 名稱 → 該語言的標籤（Chat.tools），沒有對應時回傳原名
function useToolLabel() {
  const t = useTranslations('Chat')
  const labels = t.raw('tools') as Record<string, string>
  return (tool: string) => labels[tool] ?? tool
}

// 摺疊列標題：執行中顯示「正在 X…」，完成顯示步驟數
function useToolActivityTitle(steps: AIStreamProgressEvent[], isStreaming: boolean) {
  const t = useTranslations('Chat')
  const getLabel = useToolLabel()
  const running = steps.filter((s) => s.status === 'executing')
  const doneCount = steps.length - running.length
  if (steps.length === 0) return ''
  if (isStreaming && running.length > 0) {
    const label = getLabel(running[running.length - 1].tool)
    return steps.length > 1
      ? t('toolActivity.runningProgress', { label, done: doneCount, total: steps.length })
      : t('toolActivity.running', { label })
  }
  if (steps.length === 1) return t('toolActivity.doneOne', { label: getLabel(steps[0].tool) })
  return t('toolActivity.doneMany', { count: steps.length })
}

export function ToolActivity({ events, isStreaming = false, className }: ToolActivityProps) {
  const t = useTranslations('Chat')
  const [open, setOpen] = useState(false)
  const steps = mergeToolProgress(events)
  const title = useToolActivityTitle(steps, isStreaming)
  if (steps.length === 0) return null

  const isRunning = isStreaming && steps.some((s) => s.status === 'executing')

  return (
    <Collapsible open={open} onOpenChange={setOpen} className={cn('not-prose w-full', className)}>
      <CollapsibleTrigger
        className="group flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        aria-label={open ? t('toolActivity.collapse') : t('toolActivity.expand')}
      >
        {isRunning && <Loader2Icon className="size-3.5 shrink-0 animate-spin" />}
        <span className={cn('text-left', isRunning && 'text-shimmer')}>{title}</span>
        <ChevronRightIcon
          className={cn('size-4 shrink-0 transition-transform', open && 'rotate-90')}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-1 data-[state=open]:slide-in-from-top-1 outline-none data-[state=closed]:animate-out data-[state=open]:animate-in">
        <div className="mt-2 divide-y divide-border overflow-hidden rounded-lg border border-border">
          {steps.map((step) => (
            <ToolActivityItem key={step.id} step={step} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function ToolActivityItem({ step }: { step: AIStreamProgressEvent }) {
  const t = useTranslations('Chat')
  const getLabel = useToolLabel()
  const [open, setOpen] = useState(false)
  const label = getLabel(step.tool)
  const summary = getToolSummary(step.input)
  const isExecuting = step.status === 'executing'
  const duration = formatDuration(step.duration_ms)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/60">
        <span className="shrink-0 text-muted-foreground">{label}</span>
        {summary ? (
          <span className="min-w-0 flex-1 truncate text-foreground">{summary}</span>
        ) : (
          <span className="flex-1" />
        )}
        {isExecuting && (
          <Loader2Icon className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
        )}
        {step.is_error && <XCircleIcon className="size-3.5 shrink-0 text-destructive" />}
        <ChevronRightIcon
          className={cn(
            'size-4 shrink-0 text-muted-foreground transition-transform',
            open && 'rotate-90'
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 border-t border-border bg-muted/30 px-3 py-2.5">
        {step.input !== undefined && (
          <ToolActivitySection title={t('toolActivity.request')}>
            <pre className="whitespace-pre-wrap break-all">{formatInput(step.input)}</pre>
          </ToolActivitySection>
        )}
        {step.output !== undefined ? (
          <ToolActivitySection
            title={step.is_error ? t('toolActivity.error') : t('toolActivity.response')}
            tone={step.is_error ? 'error' : 'default'}
          >
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all">
              {step.output}
            </pre>
          </ToolActivitySection>
        ) : (
          isExecuting && (
            <p className="text-xs text-muted-foreground">{t('toolActivity.waiting')}</p>
          )
        )}
        {duration && (
          <p className="text-[11px] text-muted-foreground">
            {t('toolActivity.duration', { duration })}
          </p>
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}

function ToolActivitySection({
  title,
  tone = 'default',
  children,
}: {
  title: string
  tone?: 'default' | 'error'
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <div
        className={cn(
          'rounded-md bg-background px-2.5 py-2 font-mono text-xs leading-relaxed text-foreground',
          tone === 'error' && 'bg-destructive/10 text-destructive'
        )}
      >
        {children}
      </div>
    </div>
  )
}

function formatInput(input: unknown): string {
  if (typeof input === 'string') return input
  try {
    return JSON.stringify(input, null, 2)
  } catch {
    return String(input)
  }
}
