'use client'

import {
  BookOpen,
  Bot,
  ChevronDown,
  ChevronRight,
  Download,
  Layers,
  Loader2,
  Plus,
  Search,
  Trash2,
  Upload,
  Wrench,
  X,
  Zap,
} from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import {
  type AdminSkill,
  exportSkill,
  importSkill,
  testSkillTrigger,
  useAdminSkills,
  useCreateAdminSkill,
  useDeleteAdminSkill,
  useUpdateAdminSkill,
} from '@/lib/api/admin-ai'

const MODE_LABELS: Record<string, string> = {
  tool_group: '工具組',
  sub_agent: 'Sub-Agent',
  multi_step: '多步驟',
}

const MODE_COLORS: Record<string, string> = {
  tool_group: 'bg-blue-50 text-blue-700 border-blue-200',
  sub_agent: 'bg-violet-50 text-violet-700 border-violet-200',
  multi_step: 'bg-amber-50 text-amber-700 border-amber-200',
}

const SOURCE_COLORS: Record<string, string> = {
  builtin: 'bg-wb-10 text-wb-60 border-wb-20',
  admin: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  plugin: 'bg-blue-50 text-blue-700 border-blue-200',
}

const MODE_ICONS: Record<string, React.ReactNode> = {
  tool_group: <Layers className="h-4 w-4 text-wb-60" />,
  sub_agent: <Bot className="h-4 w-4 text-wb-60" />,
  multi_step: <Zap className="h-4 w-4 text-wb-60" />,
}

function parseTriggers(raw: string | null): string[] {
  if (!raw) return []
  try {
    return JSON.parse(raw) as string[]
  } catch {
    return []
  }
}

function parseTools(raw: string): string[] {
  try {
    return JSON.parse(raw) as string[]
  } catch {
    return []
  }
}

function SkillCard({ skill }: { skill: AdminSkill }) {
  const [expanded, setExpanded] = useState(false)
  const [description, setDescription] = useState(skill.description)
  const [triggersText, setTriggersText] = useState('')
  const [priority, setPriority] = useState(skill.priority)
  const [dirty, setDirty] = useState(false)
  const { mutate: updateSkill, isPending } = useUpdateAdminSkill()
  const { mutate: deleteSkill, isPending: isDeleting } = useDeleteAdminSkill()

  const triggers = parseTriggers(skill.triggers)
  const tools = parseTools(skill.required_tools)
  const [localTriggers, setLocalTriggers] = useState<string[]>(triggers)

  const handleToggle = useCallback(() => {
    updateSkill({ id: skill.id, data: { enabled: skill.enabled ? 0 : 1 } })
  }, [skill.id, skill.enabled, updateSkill])

  const handleSave = useCallback(() => {
    updateSkill(
      {
        id: skill.id,
        data: {
          description,
          triggers: JSON.stringify(localTriggers),
          priority,
        },
      },
      { onSuccess: () => setDirty(false) }
    )
  }, [skill.id, description, localTriggers, priority, updateSkill])

  const handleAddTrigger = useCallback(() => {
    const trimmed = triggersText.trim()
    if (trimmed && !localTriggers.includes(trimmed)) {
      setLocalTriggers([...localTriggers, trimmed])
      setTriggersText('')
      setDirty(true)
    }
  }, [triggersText, localTriggers])

  const handleRemoveTrigger = useCallback(
    (trigger: string) => {
      setLocalTriggers(localTriggers.filter((t) => t !== trigger))
      setDirty(true)
    },
    [localTriggers]
  )

  const handleExport = useCallback(async () => {
    try {
      const content = await exportSkill(skill.id)
      const blob = new Blob([content], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${skill.name}.SKILL.md`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      /* ignore */
    }
  }, [skill.id, skill.name])

  const handleDelete = useCallback(() => {
    if (skill.source === 'builtin') return
    if (confirm(`確定要刪除 Skill「${skill.name}」嗎？`)) {
      deleteSkill(skill.id)
    }
  }, [skill.id, skill.name, skill.source, deleteSkill])

  const modeColor = MODE_COLORS[skill.execution_mode] ?? 'bg-wb-10 text-wb-60 border-wb-20'
  const sourceColor = SOURCE_COLORS[skill.source] ?? 'bg-wb-10 text-wb-60 border-wb-20'

  return (
    <div
      className={`rounded-xl border bg-white overflow-hidden transition-colors ${
        skill.enabled ? 'border-wb-20' : 'border-wb-10 opacity-60'
      }`}
    >
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-wb-05">
          {MODE_ICONS[skill.execution_mode] ?? <Wrench className="h-4 w-4 text-wb-60" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-wb-100">{skill.name}</span>
            <span
              className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${modeColor}`}
            >
              {MODE_LABELS[skill.execution_mode] ?? skill.execution_mode}
            </span>
            <span
              className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${sourceColor}`}
            >
              {skill.source}
            </span>
            {skill.requires_auth === 1 && <span className="text-[10px] text-wb-40">🔒</span>}
            <span className="text-[10px] text-wb-40">v{skill.version}</span>
          </div>
          <p className="mt-0.5 text-xs text-wb-60 truncate">{skill.description}</p>
          {triggers.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {triggers.slice(0, 5).map((t) => (
                <span
                  key={t}
                  className="rounded border border-wb-10 bg-wb-05 px-1.5 py-0.5 text-[10px] text-wb-50"
                >
                  {t}
                </span>
              ))}
              {triggers.length > 5 && (
                <span className="text-[10px] text-wb-40">+{triggers.length - 5}</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleToggle}
            disabled={isPending}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
              skill.enabled ? 'bg-emerald-500' : 'bg-wb-30'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                skill.enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>

          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded hover:bg-wb-05 text-wb-40"
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-wb-10 px-5 py-4 space-y-4">
          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-wb-60 mb-1">描述</label>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                setDirty(true)
              }}
              rows={2}
              className="w-full rounded-lg border border-wb-20 bg-white px-3 py-2 text-sm text-wb-80 placeholder:text-wb-30 outline-none focus:border-wb-50 resize-none"
            />
          </div>

          {/* Triggers */}
          <div>
            <label className="block text-xs font-medium text-wb-60 mb-1">
              觸發關鍵字（{localTriggers.length}）
            </label>
            <div className="flex flex-wrap gap-1 mb-2">
              {localTriggers.map((t) => (
                <span
                  key={t}
                  className="flex items-center gap-1 rounded-md border border-violet-200 bg-violet-50 px-2 py-0.5 text-xs text-violet-700"
                >
                  {t}
                  <button
                    onClick={() => handleRemoveTrigger(t)}
                    className="hover:text-violet-900"
                    type="button"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={triggersText}
                onChange={(e) => setTriggersText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTrigger()
                  }
                }}
                placeholder="輸入關鍵字後按 Enter"
                className="flex-1 rounded-lg border border-wb-20 bg-white px-3 py-1.5 text-sm text-wb-80 placeholder:text-wb-30 outline-none focus:border-wb-50"
              />
              <button
                onClick={handleAddTrigger}
                type="button"
                className="rounded-lg border border-wb-20 px-3 py-1.5 text-xs text-wb-60 hover:bg-wb-05"
              >
                新增
              </button>
            </div>
          </div>

          {/* Required Tools */}
          <div>
            <label className="block text-xs font-medium text-wb-60 mb-1">
              使用工具（{tools.length}）
            </label>
            <div className="flex flex-wrap gap-1">
              {tools.map((t) => (
                <span
                  key={t}
                  className="rounded border border-wb-10 bg-wb-05 px-1.5 py-0.5 text-[10px] text-wb-60 font-mono"
                >
                  {t}
                </span>
              ))}
              {tools.length === 0 && <span className="text-[10px] text-wb-40">（無）</span>}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-medium text-wb-60 mb-1">優先級</label>
            <input
              type="number"
              value={priority}
              onChange={(e) => {
                setPriority(Number(e.target.value))
                setDirty(true)
              }}
              min={1}
              max={999}
              className="w-24 rounded-lg border border-wb-20 bg-white px-3 py-1.5 text-sm text-wb-80 outline-none focus:border-wb-50"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            {dirty && (
              <button
                onClick={handleSave}
                disabled={isPending}
                className="rounded-lg bg-wb-100 px-4 py-1.5 text-xs font-medium text-white hover:bg-wb-90 disabled:opacity-50"
              >
                儲存
              </button>
            )}
            <button
              onClick={handleExport}
              className="flex items-center gap-1 rounded-lg border border-wb-20 px-3 py-1.5 text-xs text-wb-60 hover:bg-wb-05"
            >
              <Download className="h-3 w-3" />
              匯出
            </button>
            {skill.source !== 'builtin' && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="h-3 w-3" />
                刪除
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ImportDialog({
  open,
  onClose,
  onImported,
}: {
  open: boolean
  onClose: () => void
  onImported: () => void
}) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleImport = async () => {
    if (!content.trim()) return
    setLoading(true)
    setError(null)
    try {
      await importSkill(content)
      setContent('')
      onImported()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '匯入失敗')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
        aria-label="關閉"
      />
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-wb-20 bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-wb-100">匯入 SKILL.md</h3>
          <button onClick={onClose} className="text-wb-40 hover:text-wb-70">
            <X className="h-4 w-4" />
          </button>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`---\nname: my-skill\ndescription: ...\ntriggers: [...]\nrequired_tools: [...]\nexecution_mode: tool_group\n---\n\n# Skill 指令內容\n...`}
          rows={12}
          className="w-full rounded-lg border border-wb-20 bg-white px-3 py-2 text-sm text-wb-80 font-mono placeholder:text-wb-30 outline-none focus:border-wb-50 resize-none"
        />
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-wb-20 px-4 py-1.5 text-xs text-wb-60 hover:bg-wb-05"
          >
            取消
          </button>
          <button
            onClick={handleImport}
            disabled={loading || !content.trim()}
            className="rounded-lg bg-wb-100 px-4 py-1.5 text-xs font-medium text-white hover:bg-wb-90 disabled:opacity-50"
          >
            {loading ? '匯入中...' : '匯入'}
          </button>
        </div>
      </div>
    </div>
  )
}

function TriggerTestPanel() {
  const [query, setQuery] = useState('')
  const [matched, setMatched] = useState<AdminSkill[] | null>(null)
  const [loading, setLoading] = useState(false)

  const handleTest = async () => {
    if (!query.trim()) return
    setLoading(true)
    try {
      const result = await testSkillTrigger(query)
      setMatched(result.matched)
    } catch {
      setMatched([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-wb-20 bg-white p-5">
      <h2 className="mb-3 text-sm font-semibold text-wb-100">Trigger 測試</h2>
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleTest()
          }}
          placeholder="輸入查詢測試哪些 skill 會被觸發..."
          className="flex-1 rounded-lg border border-wb-20 bg-white px-3 py-2 text-sm text-wb-80 placeholder:text-wb-30 outline-none focus:border-wb-50"
        />
        <button
          onClick={handleTest}
          disabled={loading}
          className="flex items-center gap-1 rounded-lg bg-violet-600 px-4 py-2 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-50"
        >
          <Search className="h-3 w-3" />
          測試
        </button>
      </div>
      {matched !== null && (
        <div className="mt-3">
          {matched.length === 0 ? (
            <p className="text-xs text-wb-40">沒有 skill 被觸發</p>
          ) : (
            <div className="space-y-1">
              {matched.map((s) => (
                <div key={s.id} className="flex items-center gap-2 text-xs">
                  <span
                    className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${MODE_COLORS[s.execution_mode] ?? ''}`}
                  >
                    {MODE_LABELS[s.execution_mode]}
                  </span>
                  <span className="font-medium text-wb-80">{s.name}</span>
                  <span className="text-wb-50">{s.description}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function AdminSkillsPage() {
  const { data: skills, isLoading, error, refetch } = useAdminSkills()
  const [importOpen, setImportOpen] = useState(false)
  const { mutate: createSkill, isPending: isCreating } = useCreateAdminSkill()

  const grouped = useMemo(() => {
    const groups: Record<string, AdminSkill[]> = {}
    for (const skill of skills ?? []) {
      const mode = skill.execution_mode
      if (!groups[mode]) groups[mode] = []
      groups[mode].push(skill)
    }
    return groups
  }, [skills])

  const modeOrder = ['tool_group', 'sub_agent', 'multi_step']
  const sortedModes = modeOrder.filter((m) => grouped[m]?.length)

  const enabledCount = (skills ?? []).filter((s) => s.enabled).length
  const totalCount = skills?.length ?? 0

  const handleCreateSample = useCallback(() => {
    createSkill({
      name: `custom-skill-${Date.now().toString(36)}`,
      description: '新建 Skill',
      triggers: [],
      required_tools: [],
      execution_mode: 'tool_group',
    })
  }, [createSkill])

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
        載入 Skill 列表失敗
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-wb-100">Skill 管理</h1>
          <p className="mt-1 text-sm text-wb-60">
            管理 AI Agent 的能力組合。Skill 定義工具分群、觸發條件和專屬 prompt。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-1 rounded-lg border border-wb-20 bg-white px-3 py-2 text-xs text-wb-60 hover:bg-wb-05"
          >
            <Upload className="h-3 w-3" />
            匯入
          </button>
          <button
            onClick={handleCreateSample}
            disabled={isCreating}
            className="flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-2 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-50"
          >
            <Plus className="h-3 w-3" />
            新增
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="rounded-xl border border-wb-20 bg-white px-4 py-2 text-sm text-wb-80">
          <span className="font-semibold text-emerald-600">{enabledCount}</span>
          <span className="text-wb-40"> / {totalCount} 啟用</span>
        </span>
      </div>

      {/* Trigger Test */}
      <TriggerTestPanel />

      {/* Skills by execution mode */}
      {sortedModes.map((mode) => (
        <div key={mode}>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-wb-50">
              {MODE_LABELS[mode] ?? mode}
            </h2>
            <span className="text-[10px] text-wb-40">({grouped[mode].length})</span>
          </div>
          <div className="space-y-2">
            {grouped[mode].map((skill) => (
              <SkillCard key={skill.id} skill={skill} />
            ))}
          </div>
        </div>
      ))}

      {totalCount === 0 && (
        <div className="rounded-xl border border-wb-20 bg-white p-8 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-wb-30" />
          <p className="mt-2 text-sm text-wb-50">尚未設定任何 Skill</p>
          <p className="mt-1 text-xs text-wb-40">新增或匯入 SKILL.md 開始使用</p>
        </div>
      )}

      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} onImported={refetch} />
    </div>
  )
}
