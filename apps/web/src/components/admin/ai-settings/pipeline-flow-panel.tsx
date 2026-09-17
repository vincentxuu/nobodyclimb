'use client'

import { AlertTriangle, CheckCircle, GripVertical, Loader2, RotateCcw, Save } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  type PipelineStepInfo,
  type PipelineStepUpdate,
  usePipelineSteps,
  useUpdatePipelineSteps,
} from '@/lib/api/admin-ai'

// =============================================
// Pipeline Flow Panel：各 stage 開關與同 phase 內拖曳排序，獨立儲存
// =============================================

const PHASE_LABELS: Record<string, string> = {
  'pre-retrieval': 'Pre-retrieval',
  retrieval: 'Retrieval',
  'post-retrieval': 'Post-retrieval',
  generation: 'Generation',
  evaluation: 'Evaluation',
}

const PHASE_COLORS: Record<string, string> = {
  'pre-retrieval': 'border-blue-200 bg-blue-50/50',
  retrieval: 'border-emerald-200 bg-emerald-50/50',
  'post-retrieval': 'border-amber-200 bg-amber-50/50',
  generation: 'border-purple-200 bg-purple-50/50',
  evaluation: 'border-rose-200 bg-rose-50/50',
}

export function PipelineFlowPanel() {
  const { data: steps, isLoading } = usePipelineSteps()
  const { mutate: updateSteps, isPending } = useUpdatePipelineSteps()
  const [localSteps, setLocalSteps] = useState<PipelineStepInfo[]>([])
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragItem, setDragItem] = useState<string | null>(null)

  useEffect(() => {
    if (steps) {
      setLocalSteps([...steps])
    }
  }, [steps])

  const _hasChanges = useMemo(() => {
    if (!steps || steps.length !== localSteps.length) return false
    return localSteps.some((local) => {
      const original = steps.find((s) => s.id === local.id)
      if (!original) return true
      return local.enabled !== original.enabled || local.order !== original.order
    })
  }, [steps, localSteps])

  const toggleStep = (stepId: string) => {
    setLocalSteps((prev) => prev.map((s) => (s.id === stepId ? { ...s, enabled: !s.enabled } : s)))
  }

  // 檢查 step 的依賴是否被滿足（上游 provides 是否涵蓋 requires）
  const getMissingDeps = (stepId: string): string[] => {
    const step = localSteps.find((s) => s.id === stepId)
    if (!step || !step.enabled) return []
    const EXEC_PHASE_ORDER = [
      'pre-retrieval',
      'retrieval',
      'post-retrieval',
      'generation',
      'evaluation',
    ]
    // 按實際執行順序排序
    const sorted = [...localSteps].sort((a, b) => {
      const pa = EXEC_PHASE_ORDER.indexOf(a.phase)
      const pb = EXEC_PHASE_ORDER.indexOf(b.phase)
      if (pa !== pb) return pa - pb
      return a.order - b.order
    })
    // 初始 context 已提供的欄位
    const providedBefore = new Set([
      'env',
      'request',
      'pipelineConfig',
      'prompts',
      'trace',
      'tokenBreakdown',
      'queryService',
      'startTime',
      'cacheKey',
      'recentHistory',
      'isAnonymousNoHistory',
      'earlyQueryVector',
      'memorySummary',
      'ascentContext',
      'abilityLevel',
      'streamingMode',
      'vectorFilter',
      'hydeDoc',
      'expandedQueries',
    ])
    for (const other of sorted) {
      if (other.id === stepId) break
      if (!other.enabled) continue
      for (const p of other.provides) providedBefore.add(p)
    }
    return step.requires.filter((r) => !providedBefore.has(r))
  }

  const handleDragStart = (stepId: string) => {
    setDragItem(stepId)
  }

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!dragItem || dragItem === targetId) return
    const dragStep = localSteps.find((s) => s.id === dragItem)
    const targetStep = localSteps.find((s) => s.id === targetId)
    if (!dragStep || !targetStep || dragStep.phase !== targetStep.phase) return
  }

  const handleDrop = (targetId: string) => {
    if (!dragItem || dragItem === targetId) {
      setDragItem(null)
      return
    }
    const dragStep = localSteps.find((s) => s.id === dragItem)
    const targetStep = localSteps.find((s) => s.id === targetId)
    if (!dragStep || !targetStep || dragStep.phase !== targetStep.phase) {
      setDragItem(null)
      return
    }

    setLocalSteps((prev) => {
      const phaseSteps = prev.filter((s) => s.phase === dragStep.phase)
      const otherSteps = prev.filter((s) => s.phase !== dragStep.phase)
      const dragIdx = phaseSteps.findIndex((s) => s.id === dragItem)
      const targetIdx = phaseSteps.findIndex((s) => s.id === targetId)
      const [moved] = phaseSteps.splice(dragIdx, 1)
      phaseSteps.splice(targetIdx, 0, moved)
      // 重新排序 order
      phaseSteps.forEach((s, i) => {
        s.order = i
      })
      return [...otherSteps, ...phaseSteps].sort((a, b) => {
        const phases = ['pre-retrieval', 'retrieval', 'post-retrieval', 'generation', 'evaluation']
        const pa = phases.indexOf(a.phase)
        const pb = phases.indexOf(b.phase)
        if (pa !== pb) return pa - pb
        return a.order - b.order
      })
    })

    setDragItem(null)
  }

  const handleSave = () => {
    const payload: PipelineStepUpdate[] = localSteps.map((s) => ({
      id: s.id,
      enabled: s.enabled,
      order: s.order,
    }))
    setError(null)
    updateSteps(payload, {
      onSuccess: () => {
        setSaved(true)

        setTimeout(() => setSaved(false), 2500)
      },
      onError: (err: unknown) => {
        const msg = err instanceof Error ? err.message : '儲存失敗'
        setError(msg)
      },
    })
  }

  const handleReset = () => {
    if (steps) {
      setLocalSteps([...steps])
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-wb-40" />
      </div>
    )
  }

  // 按 phase 分組
  const phases = [
    'pre-retrieval',
    'retrieval',
    'post-retrieval',
    'generation',
    'evaluation',
  ] as const
  const grouped = phases.map((phase) => ({
    phase,
    steps: localSteps.filter((s) => s.phase === phase).sort((a, b) => a.order - b.order),
  }))

  return (
    <div className="space-y-6">
      {grouped.map(({ phase, steps: phaseSteps }) => (
        <div key={phase} className={`rounded-xl border ${PHASE_COLORS[phase]} overflow-hidden`}>
          <div className="border-b border-inherit px-5 py-3">
            <h2 className="text-sm font-semibold text-wb-100">{PHASE_LABELS[phase]}</h2>
            <p className="text-xs text-wb-50">{phaseSteps.length} steps</p>
          </div>
          <div className="divide-y divide-inherit">
            {phaseSteps.map((step) => {
              const missing = getMissingDeps(step.id)
              return (
                <div
                  key={step.id}
                  draggable
                  onDragStart={() => handleDragStart(step.id)}
                  onDragOver={(e) => handleDragOver(e, step.id)}
                  onDrop={() => handleDrop(step.id)}
                  className={`flex items-center gap-3 px-5 py-3 transition-colors ${
                    dragItem === step.id ? 'opacity-50' : ''
                  } ${step.enabled ? '' : 'opacity-60'}`}
                >
                  <GripVertical className="h-4 w-4 text-wb-30 cursor-grab shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-wb-100">{step.name}</span>
                      <span className="font-mono text-[10px] text-wb-40">{step.id}</span>
                    </div>
                    <p className="text-xs text-wb-50 truncate">{step.description}</p>
                    {step.skipWhen.length > 0 && (
                      <p className="text-[10px] text-wb-40 mt-0.5">
                        skipWhen:{' '}
                        {step.skipWhen
                          .map((c) => `${c.field} ${c.operator} ${String(c.value)}`)
                          .join(', ')}
                      </p>
                    )}
                    {missing.length > 0 && (
                      <p className="text-[10px] text-red-500 mt-0.5 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 inline shrink-0" />
                        缺少依賴: {missing.join(', ')}
                      </p>
                    )}
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={step.enabled}
                      onChange={() => toggleStep(step.id)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-wb-20 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600">
            <CheckCircle className="h-4 w-4" />
            已儲存
          </span>
        )}
        <button
          onClick={handleReset}
          className="flex items-center gap-2 rounded-xl border border-wb-20 px-4 py-2.5 text-sm font-medium text-wb-60 hover:bg-wb-05 transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          重設
        </button>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 rounded-xl bg-wb-100 px-5 py-2.5 text-sm font-medium text-white hover:bg-wb-90 disabled:opacity-50 transition-colors"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          儲存設定
        </button>
      </div>
    </div>
  )
}
