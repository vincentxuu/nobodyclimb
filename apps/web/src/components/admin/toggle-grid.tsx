'use client'

import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

export interface ToggleGridItem {
  key: string
  label: string
  hint?: string
  checked: boolean
}

interface ToggleGridProps {
  items: ToggleGridItem[]
  onChange: (key: string, checked: boolean) => void
  className?: string
}

/**
 * 開關 grid：手機 1 列、平板 2 列、桌面 3 列，每格 label + switch。
 */
export function ToggleGrid({ items, onChange, className }: ToggleGridProps) {
  return (
    <div className={cn('grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {items.map((item) => {
        const inputId = `toggle-${item.key}`
        return (
          <label
            key={item.key}
            htmlFor={inputId}
            title={item.hint}
            className={cn(
              'flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2.5 transition-colors',
              item.checked ? 'border-wb-30 bg-white' : 'border-wb-20 bg-wb-5'
            )}
          >
            <div className="min-w-0">
              <span
                className={cn(
                  'block truncate text-sm',
                  item.checked ? 'font-medium text-wb-100' : 'text-wb-60'
                )}
              >
                {item.label}
              </span>
              <span className="block font-mono text-[10px] text-wb-40">{item.key}</span>
            </div>
            <Switch
              id={inputId}
              checked={item.checked}
              onCheckedChange={(checked) => onChange(item.key, checked)}
              className="data-[state=checked]:bg-emerald-500"
            />
          </label>
        )
      })}
    </div>
  )
}
