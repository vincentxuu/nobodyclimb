'use client'

import { CheckCircle, Loader2, Pencil, Plus, Save, Trash2 } from 'lucide-react'
import { useCallback, useState } from 'react'
import { type CostProvider, DEFAULT_COST_PROVIDERS, useUpdateAIConfig } from '@/lib/api/admin-ai'

// =============================================
// 費用模擬：LLM 供應商費率表（cost_providers），獨立儲存
// =============================================

export function CostSimulationPanel({ config }: { config: Record<string, string> }) {
  const { mutate: updateConfig, isPending } = useUpdateAIConfig()
  const [providers, setProviders] = useState<CostProvider[]>(() => {
    try {
      const raw = config['cost_providers']
      if (raw) {
        const parsed = JSON.parse(raw) as CostProvider[]
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {
      /* fallback */
    }
    return DEFAULT_COST_PROVIDERS
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Partial<CostProvider>>({})
  const [addingNew, setAddingNew] = useState(false)
  const [newProvider, setNewProvider] = useState<Partial<CostProvider>>({})
  const [saved, setSaved] = useState(false)

  const handleSave = useCallback(() => {
    updateConfig(
      { cost_providers: JSON.stringify(providers) },
      {
        onSuccess: () => {
          setSaved(true)
          setTimeout(() => setSaved(false), 2500)
        },
      }
    )
  }, [providers, updateConfig])

  const startEdit = (provider: CostProvider) => {
    setEditingId(provider.id)
    setEditValues({ ...provider })
    setAddingNew(false)
  }

  const commitEdit = () => {
    if (!editingId) return
    setProviders((prev) =>
      prev.map((p) =>
        p.id === editingId
          ? {
              ...p,
              name: editValues.name ?? p.name,
              input_per_1m: Number(editValues.input_per_1m ?? p.input_per_1m),
              output_per_1m: Number(editValues.output_per_1m ?? p.output_per_1m),
            }
          : p
      )
    )
    setEditingId(null)
  }

  const deleteProvider = (id: string) => {
    setProviders((prev) => prev.filter((p) => p.id !== id))
    if (editingId === id) setEditingId(null)
  }

  const commitAdd = () => {
    if (!newProvider.name?.trim()) return
    const id = `custom-${Date.now()}`
    setProviders((prev) => [
      ...prev,
      {
        id,
        name: newProvider.name!.trim(),
        input_per_1m: Number(newProvider.input_per_1m ?? 0),
        output_per_1m: Number(newProvider.output_per_1m ?? 0),
      },
    ])
    setNewProvider({})
    setAddingNew(false)
  }

  const resetToDefaults = () => {
    setProviders(DEFAULT_COST_PROVIDERS)
    setEditingId(null)
    setAddingNew(false)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-wb-20 bg-white overflow-hidden">
        <div className="border-b border-wb-10 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-wb-100">LLM 供應商費用</h2>
            <p className="mt-0.5 text-xs text-wb-50">
              設定各供應商每百萬 token 的輸入/輸出費用（USD），供 Log 詳情頁費用分析使用
            </p>
          </div>
          <button
            onClick={resetToDefaults}
            className="text-xs text-wb-50 hover:text-wb-80 transition-colors"
          >
            恢復預設
          </button>
        </div>

        {/* 表頭 */}
        <div className="grid grid-cols-[1fr_120px_120px_80px] gap-2 px-5 py-2 bg-wb-05 border-b border-wb-10 text-[10px] font-semibold text-wb-50 uppercase tracking-wider">
          <span>供應商名稱</span>
          <span>Input $/1M</span>
          <span>Output $/1M</span>
          <span></span>
        </div>

        <div className="divide-y divide-wb-10">
          {providers.map((p) =>
            editingId === p.id ? (
              <div
                key={p.id}
                className="grid grid-cols-[1fr_120px_120px_80px] gap-2 px-5 py-3 items-center bg-blue-50/30"
              >
                <input
                  className="rounded border border-wb-30 px-2 py-1 text-sm text-wb-100 outline-hidden focus:border-blue-400 w-full"
                  value={editValues.name ?? ''}
                  onChange={(e) => setEditValues((v) => ({ ...v, name: e.target.value }))}
                  placeholder="供應商名稱"
                />
                <input
                  type="number"
                  className="rounded border border-wb-30 px-2 py-1 text-sm font-mono text-wb-100 outline-hidden focus:border-blue-400 w-full"
                  value={editValues.input_per_1m ?? ''}
                  onChange={(e) =>
                    setEditValues((v) => ({ ...v, input_per_1m: parseFloat(e.target.value) || 0 }))
                  }
                  step="0.001"
                />
                <input
                  type="number"
                  className="rounded border border-wb-30 px-2 py-1 text-sm font-mono text-wb-100 outline-hidden focus:border-blue-400 w-full"
                  value={editValues.output_per_1m ?? ''}
                  onChange={(e) =>
                    setEditValues((v) => ({ ...v, output_per_1m: parseFloat(e.target.value) || 0 }))
                  }
                  step="0.001"
                />
                <div className="flex gap-1">
                  <button
                    onClick={commitEdit}
                    className="rounded px-2 py-1 text-xs bg-wb-100 text-white hover:bg-wb-90 transition-colors"
                  >
                    確認
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="rounded px-2 py-1 text-xs border border-wb-20 text-wb-60 hover:bg-wb-10 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <div
                key={p.id}
                className="grid grid-cols-[1fr_120px_120px_80px] gap-2 px-5 py-3 items-center hover:bg-wb-05 transition-colors"
              >
                <span className="text-sm text-wb-80">{p.name}</span>
                <span className="text-sm font-mono text-wb-70">${p.input_per_1m.toFixed(3)}</span>
                <span className="text-sm font-mono text-wb-70">${p.output_per_1m.toFixed(3)}</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => startEdit(p)}
                    className="p-1.5 rounded text-wb-40 hover:text-wb-80 hover:bg-wb-10 transition-colors"
                    title="編輯"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => deleteProvider(p.id)}
                    className="p-1.5 rounded text-wb-40 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="刪除"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          )}

          {/* 新增列 */}
          {addingNew ? (
            <div className="grid grid-cols-[1fr_120px_120px_80px] gap-2 px-5 py-3 items-center bg-emerald-50/30">
              <input
                className="rounded border border-wb-30 px-2 py-1 text-sm text-wb-100 outline-hidden focus:border-emerald-400 w-full"
                value={newProvider.name ?? ''}
                onChange={(e) => setNewProvider((v) => ({ ...v, name: e.target.value }))}
                placeholder="供應商名稱"
                autoFocus
              />
              <input
                type="number"
                className="rounded border border-wb-30 px-2 py-1 text-sm font-mono text-wb-100 outline-hidden focus:border-emerald-400 w-full"
                value={newProvider.input_per_1m ?? ''}
                onChange={(e) =>
                  setNewProvider((v) => ({ ...v, input_per_1m: parseFloat(e.target.value) || 0 }))
                }
                step="0.001"
                placeholder="0.000"
              />
              <input
                type="number"
                className="rounded border border-wb-30 px-2 py-1 text-sm font-mono text-wb-100 outline-hidden focus:border-emerald-400 w-full"
                value={newProvider.output_per_1m ?? ''}
                onChange={(e) =>
                  setNewProvider((v) => ({ ...v, output_per_1m: parseFloat(e.target.value) || 0 }))
                }
                step="0.001"
                placeholder="0.000"
              />
              <div className="flex gap-1">
                <button
                  onClick={commitAdd}
                  className="rounded px-2 py-1 text-xs bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                >
                  新增
                </button>
                <button
                  onClick={() => {
                    setAddingNew(false)
                    setNewProvider({})
                  }}
                  className="rounded px-2 py-1 text-xs border border-wb-20 text-wb-60 hover:bg-wb-10 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                setAddingNew(true)
                setEditingId(null)
              }}
              className="flex w-full items-center gap-2 px-5 py-3 text-sm text-wb-50 hover:bg-wb-05 hover:text-wb-80 transition-colors"
            >
              <Plus className="h-4 w-4" />
              新增供應商
            </button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-wb-10 bg-wb-05 px-5 py-3">
        <p className="text-xs text-wb-50 leading-relaxed">
          費用資料儲存於{' '}
          <span className="font-mono bg-white border border-wb-15 rounded px-1 py-0.5 text-[10px]">
            cost_providers
          </span>{' '}
          設定鍵，Log 詳情頁依此計算各 stage 費用。 Cloudflare Workers AI 定價請參考官方文件。
        </p>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600">
            <CheckCircle className="h-4 w-4" />
            已儲存
          </span>
        )}
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
