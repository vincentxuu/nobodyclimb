'use client'

import { CheckCircle, Loader2, RotateCcw, Save } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { CostSimulationPanel } from '@/components/admin/ai-settings/cost-simulation-panel'
import { FieldInput, ROW_COLS } from '@/components/admin/ai-settings/field-input'
import { GuardrailTagInput } from '@/components/admin/ai-settings/guardrail-tag-input'
import { PipelineFlowPanel } from '@/components/admin/ai-settings/pipeline-flow-panel'
import { parseTagList, SECTIONS, sectionKeys } from '@/components/admin/ai-settings/sections'
import { CollapsibleSection } from '@/components/admin/collapsible-section'
import { ToggleGrid } from '@/components/admin/toggle-grid'
import { useAIConfig, useUpdateAIConfig } from '@/lib/api/admin-ai'
import { cn } from '@/lib/utils'

// =============================================
// Main Page
// =============================================

export default function AdminAISettingsPage() {
  const { data: config, isLoading } = useAIConfig()
  const { mutate: updateConfig, isPending } = useUpdateAIConfig()

  // draft 只放使用者改過的 key；實際顯示值 = draft ?? config
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openIds, setOpenIds] = useState<Set<string>>(
    () => new Set(SECTIONS.filter((s) => s.defaultOpen).map((s) => s.id))
  )

  // URL hash 對應 section id 時：展開並捲到該區塊
  useEffect(() => {
    const applyHash = () => {
      const hash = window.location.hash.slice(1)
      if (!SECTIONS.some((s) => s.id === hash)) return
      setOpenIds((prev) => new Set(prev).add(hash))
      requestAnimationFrame(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
    applyHash()
    window.addEventListener('hashchange', applyHash)
    return () => window.removeEventListener('hashchange', applyHash)
  }, [])

  const getValue = useCallback(
    (key: string): string | undefined => draft[key] ?? config?.[key],
    [draft, config]
  )

  const dirtyKeys = useMemo(
    () => Object.keys(draft).filter((k) => draft[k] !== (config?.[k] ?? undefined)),
    [draft, config]
  )
  const dirtySet = useMemo(() => new Set(dirtyKeys), [dirtyKeys])

  const setField = useCallback((key: string, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }, [])

  const toggleSection = useCallback((id: string, open: boolean) => {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (open) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])

  const setAll = (open: boolean) => {
    setOpenIds(open ? new Set(SECTIONS.map((s) => s.id)) : new Set())
  }

  const handleDiscard = () => {
    setDraft({})
    setError(null)
  }

  const handleSave = () => {
    if (dirtyKeys.length === 0) return
    const payload: Record<string, string> = {}
    for (const key of dirtyKeys) payload[key] = draft[key]
    setError(null)
    updateConfig(payload, {
      onSuccess: () => {
        setDraft({})
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      },
      onError: (err: unknown) => {
        setError(err instanceof Error ? err.message : '儲存失敗')
      },
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-wb-40" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-wb-100">AI 設定</h1>
          <p className="mt-1 text-sm text-wb-60">
            所有參數儲存後立即生效（無需重啟）；只會送出有修改的欄位
          </p>
        </div>
        <div className="flex gap-1 text-xs">
          <button
            type="button"
            onClick={() => setAll(true)}
            className="rounded-lg px-2.5 py-1.5 text-wb-60 transition-colors hover:bg-wb-10 hover:text-wb-100"
          >
            全部展開
          </button>
          <button
            type="button"
            onClick={() => setAll(false)}
            className="rounded-lg px-2.5 py-1.5 text-wb-60 transition-colors hover:bg-wb-10 hover:text-wb-100"
          >
            全部收合
          </button>
        </div>
      </div>

      {SECTIONS.map((section) => {
        const dirtyCount = sectionKeys(section).filter((k) => dirtySet.has(k)).length
        return (
          <CollapsibleSection
            key={section.id}
            id={section.id}
            title={section.title}
            desc={section.desc}
            open={openIds.has(section.id)}
            onOpenChange={(open) => toggleSection(section.id, open)}
            badge={
              dirtyCount > 0 ? (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                  {dirtyCount} 項已修改
                </span>
              ) : undefined
            }
          >
            <div className="space-y-5 px-5 py-4">
              {section.panel === 'pipeline' && <PipelineFlowPanel />}
              {section.panel === 'cost' && <CostSimulationPanel config={config ?? {}} />}

              {section.toggles && (
                <ToggleGrid
                  items={section.toggles.map((t) => ({
                    key: t.key,
                    label: t.label,
                    hint: t.hint,
                    checked: (getValue(t.key) ?? t.placeholder) === '1',
                  }))}
                  onChange={(key, checked) => setField(key, checked ? '1' : '0')}
                />
              )}

              {section.rows?.map((row, idx) => (
                <div key={row.title ?? `${section.id}-${idx}`}>
                  {row.title && (
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-wb-50">
                      {row.title}
                    </p>
                  )}
                  <div className={cn('grid gap-4', ROW_COLS[Math.min(row.fields.length, 3)])}>
                    {row.fields.map((field) => (
                      <FieldInput
                        key={field.key}
                        field={field}
                        value={getValue(field.key)}
                        dirty={dirtySet.has(field.key)}
                        onChange={(v) => setField(field.key, v)}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {section.guardrails?.map((g) => (
                <GuardrailTagInput
                  key={g.key}
                  label={g.label}
                  desc={g.desc}
                  configKey={g.key}
                  tags={parseTagList(getValue(g.key) ?? '[]')}
                  onChange={(tags) => setField(g.key, JSON.stringify(tags))}
                />
              ))}
            </div>
          </CollapsibleSection>
        )
      })}

      {/* 儲存列：有未儲存變更時固定在底部 */}
      <div
        className={cn(
          'sticky bottom-4 z-20 transition-all',
          dirtyKeys.length > 0 || saved || error
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-4 opacity-0'
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-wb-20 bg-white px-4 py-3 shadow-lg">
          <div className="text-sm">
            {error ? (
              <span className="text-red-600">{error}</span>
            ) : saved ? (
              <span className="flex items-center gap-1.5 text-emerald-600">
                <CheckCircle className="h-4 w-4" />
                已儲存
              </span>
            ) : (
              <span className="text-wb-70">
                <span className="font-semibold text-wb-100">{dirtyKeys.length}</span> 項未儲存
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDiscard}
              disabled={isPending || dirtyKeys.length === 0}
              className="flex items-center gap-2 rounded-xl border border-wb-20 px-4 py-2 text-sm font-medium text-wb-60 transition-colors hover:bg-wb-5 disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
              捨棄
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending || dirtyKeys.length === 0}
              className="flex items-center gap-2 rounded-xl bg-wb-100 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-wb-90 disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              儲存設定
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
