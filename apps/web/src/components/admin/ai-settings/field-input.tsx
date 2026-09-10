'use client'

import { cn } from '@/lib/utils'
import type { ConfigField } from './sections'

export const ROW_COLS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
}

const INPUT_CLASS =
  'w-full rounded-lg border border-wb-20 bg-white px-3 py-2 text-sm text-wb-100 placeholder:text-wb-40 outline-none focus:border-wb-50 focus:ring-1 focus:ring-wb-50 transition-colors font-mono'

// =============================================
// 單一欄位
// =============================================

interface FieldInputProps {
  field: ConfigField
  value: string | undefined
  dirty: boolean
  onChange: (value: string) => void
}

export function FieldInput({ field, value, dirty, onChange }: FieldInputProps) {
  const inputId = `cfg-${field.key}`
  return (
    <div className="min-w-0">
      <label
        htmlFor={inputId}
        className="mb-1 flex items-center gap-1.5 text-xs font-medium text-wb-70"
      >
        {field.label}
        {dirty && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-label="已修改" />}
      </label>
      {field.kind === 'select' && field.options ? (
        <select
          id={inputId}
          value={value ?? field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={INPUT_CLASS}
        >
          {field.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : field.kind === 'textarea' ? (
        <textarea
          id={inputId}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={4}
          className={cn(INPUT_CLASS, 'resize-y text-xs leading-relaxed')}
        />
      ) : (
        <input
          id={inputId}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={INPUT_CLASS}
        />
      )}
      <p className="mt-1 text-[11px] leading-snug text-wb-60">{field.hint}</p>
      <p className="mt-1 inline-block rounded bg-wb-5 px-1 py-0.5 font-mono text-[10px] text-wb-40">
        {field.key}
      </p>
    </div>
  )
}
