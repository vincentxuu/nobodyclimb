'use client'

import { ChevronDown } from 'lucide-react'
import { Collapsible as CollapsiblePrimitive } from 'radix-ui'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CollapsibleSectionProps {
  /** 同時作為 DOM id，供 URL hash 定位 */
  id: string
  title: string
  desc?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 標題右側的徽章（例如「N 項已修改」） */
  badge?: ReactNode
  children: ReactNode
  className?: string
}

/**
 * 設定頁用的可收合區塊：白底卡片 + 標題列 toggle。
 */
export function CollapsibleSection({
  id,
  title,
  desc,
  open,
  onOpenChange,
  badge,
  children,
  className,
}: CollapsibleSectionProps) {
  return (
    <CollapsiblePrimitive.Root
      id={id}
      open={open}
      onOpenChange={onOpenChange}
      className={cn(
        'scroll-mt-20 rounded-xl border border-wb-20 bg-white overflow-hidden',
        className
      )}
    >
      <CollapsiblePrimitive.Trigger asChild>
        <button
          type="button"
          className={cn(
            'flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-wb-5',
            open && 'border-b border-wb-10'
          )}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-wb-100">{title}</h2>
              {badge}
            </div>
            {desc && <p className="mt-0.5 text-xs text-wb-60">{desc}</p>}
          </div>
          <ChevronDown
            className={cn('h-4 w-4 shrink-0 text-wb-50 transition-transform', open && 'rotate-180')}
          />
        </button>
      </CollapsiblePrimitive.Trigger>
      <CollapsiblePrimitive.Content>{children}</CollapsiblePrimitive.Content>
    </CollapsiblePrimitive.Root>
  )
}
