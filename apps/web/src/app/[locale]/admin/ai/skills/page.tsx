'use client'

import {
  BookOpen,
  Bot,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  GitBranch,
  Globe,
  Hash,
  Layers,
  Loader2,
  Lock,
  Pin,
  Plus,
  Search,
  Trash2,
  Upload,
  User,
  Users,
  X,
  Zap,
} from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import {
  type AdminSkill,
  exportSkill,
  importSkill,
  type SkillVersionSummary,
  testSkillTrigger,
  useAdminSkills,
  useCreateAdminSkill,
  useDeleteAdminSkill,
  usePublishSkillVersion,
  useUpdateAdminSkill,
  useUpdateSkillBinding,
} from '@/lib/api/admin-ai'

const SCOPE_LABELS: Record<string, string> = {
  personal: '個人',
  team: '團隊',
  org: '組織',
  public: '公開',
}

const SCOPE_ICONS: Record<string, React.ReactNode> = {
  personal: <User className="h-3 w-3" />,
  team: <Users className="h-3 w-3" />,
  org: <Globe className="h-3 w-3" />,
  public: <Globe className="h-3 w-3" />,
}

const SCOPE_COLORS: Record<string, string> = {
  personal: 'bg-blue-50 text-blue-700 border-blue-200',
  team: 'bg-violet-50 text-violet-700 border-violet-200',
  org: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  public: 'bg-amber-50 text-amber-700 border-amber-200',
}

const SOURCE_LABELS: Record<string, string> = {
  builtin: '內建',
  custom: '自訂',
  marketplace: '市集',
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  deprecated: 'bg-wb-10 text-wb-50 border-wb-20',
}

function VersionHistoryRow({
  ver,
  isPinned,
  onPin,
}: {
  ver: SkillVersionSummary
  isPinned: boolean
  onPin: (versionId: string | null) => void
}) {
  return (
    <div className="flex items-center gap-2 py-1.5 text-xs">
      <span className="w-8 shrink-0 font-mono text-wb-50 text-right">v{ver.version_number}</span>
      <span
        className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${STATUS_COLORS[ver.status] ?? ''}`}
      >
        {ver.status}
      </span>
      <span className="flex-1 truncate text-wb-70">{ver.description}</span>
      {ver.published_at && (
        <span className="shrink-0 text-[10px] text-wb-40">
          {new Date(ver.published_at).toLocaleDateString('zh-TW')}
        </span>
      )}
      <button
        onClick={() => onPin(isPinned ? null : ver.id)}
        className={`shrink-0 p-0.5 rounded ${isPinned ? 'text-violet-600' : 'text-wb-30 hover:text-wb-60'}`}
        title={isPinned ? '取消固定' : '固定此版本'}
      >
        <Pin className="h-3 w-3" />
      </button>
    </div>
  )
}

function SkillCard({ skill }: { skill: AdminSkill }) {
  const [expanded, setExpanded] = useState(false)
  const [displayName, setDisplayName] = useState(skill.display_name ?? '')
  const [dirty, setDirty] = useState(false)
  const [showPublish, setShowPublish] = useState(false)
  const [publishDesc, setPublishDesc] = useState('')
  const [publishBody, setPublishBody] = useState('')

  const { mutate: updateSkill, isPending } = useUpdateAdminSkill()
  const { mutate: updateBinding, isPending: isBindingPending } = useUpdateSkillBinding()
  const { mutate: publishVersion, isPending: isPublishing } = usePublishSkillVersion()
  const { mutate: deleteSkill, isPending: isDeleting } = useDeleteAdminSkill()

  const ver = skill.version
  const binding = skill.binding
  const isEnabled = binding?.enabled ?? false
  const allowedTools = ver?.allowed_tools ?? []
  const scopeColor = SCOPE_COLORS[skill.scope] ?? 'bg-wb-10 text-wb-60 border-wb-20'

  const handleToggle = useCallback(() => {
    updateBinding({ id: skill.id, data: { enabled: !isEnabled } })
  }, [skill.id, isEnabled, updateBinding])

  const handleSave = useCallback(() => {
    updateSkill(
      { id: skill.id, data: { display_name: displayName || undefined } },
      { onSuccess: () => setDirty(false) }
    )
  }, [skill.id, displayName, updateSkill])

  const handlePin = useCallback(
    (versionId: string | null) => {
      updateBinding({ id: skill.id, data: { pinned_version_id: versionId } })
    },
    [skill.id, updateBinding]
  )

  const handlePublish = useCallback(() => {
    if (!publishDesc.trim()) return
    publishVersion(
      {
        id: skill.id,
        data: {
          description: publishDesc,
          body: publishBody || undefined,
          allowed_tools: allowedTools.length > 0 ? allowedTools : undefined,
        },
      },
      {
        onSuccess: () => {
          setShowPublish(false)
          setPublishDesc('')
          setPublishBody('')
        },
      }
    )
  }, [skill.id, publishDesc, publishBody, allowedTools, publishVersion])

  const handleExport = useCallback(async () => {
    try {
      const content = await exportSkill(skill.id)
      const blob = new Blob([content], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${skill.slug}.SKILL.md`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      /* ignore */
    }
  }, [skill.id, skill.slug])

  const handleDelete = useCallback(() => {
    if (skill.source === 'builtin') return
    if (confirm(`確定要刪除 Skill「${skill.slug}」嗎？此操作不可復原。`)) {
      deleteSkill(skill.id)
    }
  }, [skill.id, skill.slug, skill.source, deleteSkill])

  return (
    <div
      className={`rounded-xl border bg-white overflow-hidden transition-colors ${
        isEnabled ? 'border-wb-20' : 'border-wb-10 opacity-60'
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-wb-05">
          {skill.source === 'builtin' ? (
            <Layers className="h-4 w-4 text-wb-60" />
          ) : (
            <Bot className="h-4 w-4 text-wb-60" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-wb-100 font-mono">{skill.slug}</span>
            {skill.display_name && <span className="text-xs text-wb-60">{skill.display_name}</span>}
            <span
              className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium flex items-center gap-0.5 ${scopeColor}`}
            >
              {SCOPE_ICONS[skill.scope]}
              {SCOPE_LABELS[skill.scope] ?? skill.scope}
            </span>
            <span className="rounded-md border border-wb-20 bg-wb-05 px-1.5 py-0.5 text-[10px] text-wb-50">
              {SOURCE_LABELS[skill.source] ?? skill.source}
            </span>
            {ver && (
              <span
                className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${STATUS_COLORS[ver.status] ?? ''}`}
              >
                v{ver.version_number}
              </span>
            )}
            {ver?.token_count != null && (
              <span className="text-[10px] text-wb-40">{ver.token_count} tokens</span>
            )}
            {binding?.pinned_version_id && <Pin className="h-3 w-3 text-violet-500" />}
          </div>
          <p className="mt-0.5 text-xs text-wb-60 truncate">
            {ver?.description ?? '（無已發佈版本）'}
          </p>
          {allowedTools.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {allowedTools.slice(0, 5).map((t) => (
                <span
                  key={t}
                  className="rounded border border-wb-10 bg-wb-05 px-1.5 py-0.5 text-[10px] text-wb-60 font-mono"
                >
                  {t}
                </span>
              ))}
              {allowedTools.length > 5 && (
                <span className="text-[10px] text-wb-40">+{allowedTools.length - 5}</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleToggle}
            disabled={isBindingPending}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
              isEnabled ? 'bg-emerald-500' : 'bg-wb-30'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                isEnabled ? 'translate-x-5' : 'translate-x-0'
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

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-wb-10 px-5 py-4 space-y-4">
          {/* Display name */}
          <div>
            <label className="block text-xs font-medium text-wb-60 mb-1">顯示名稱</label>
            <div className="flex gap-2">
              <input
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value)
                  setDirty(true)
                }}
                placeholder={skill.slug}
                className="flex-1 rounded-lg border border-wb-20 bg-white px-3 py-1.5 text-sm text-wb-80 placeholder:text-wb-30 outline-none focus:border-wb-50"
              />
              {dirty && (
                <button
                  onClick={handleSave}
                  disabled={isPending}
                  className="rounded-lg bg-wb-100 px-4 py-1.5 text-xs font-medium text-white hover:bg-wb-90 disabled:opacity-50"
                >
                  儲存
                </button>
              )}
            </div>
          </div>

          {/* Version history */}
          {skill.versions && skill.versions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <GitBranch className="h-3.5 w-3.5 text-wb-50" />
                <label className="text-xs font-medium text-wb-60">
                  版本歷史（{skill.versions.length}）
                </label>
              </div>
              <div className="rounded-lg border border-wb-10 bg-wb-05 px-3 py-2 divide-y divide-wb-10">
                {skill.versions.map((v) => (
                  <VersionHistoryRow
                    key={v.id}
                    ver={v}
                    isPinned={binding?.pinned_version_id === v.id}
                    onPin={handlePin}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Files */}
          {skill.files && skill.files.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-wb-60 mb-1">
                附屬檔案（{skill.files.length}）
              </label>
              <div className="space-y-1">
                {skill.files.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center gap-2 rounded border border-wb-10 bg-wb-05 px-2 py-1 text-xs"
                  >
                    <span className="flex-1 font-mono text-wb-70">{f.path}</span>
                    {f.size_bytes != null && (
                      <span className="text-wb-40">
                        {f.size_bytes < 1024
                          ? `${f.size_bytes} B`
                          : `${(f.size_bytes / 1024).toFixed(1)} KB`}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Publish new version */}
          {!showPublish ? (
            <button
              onClick={() => {
                setPublishDesc(ver?.description ?? '')
                setPublishBody(ver?.body ?? '')
                setShowPublish(true)
              }}
              className="flex items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs text-violet-700 hover:bg-violet-100"
            >
              <Plus className="h-3 w-3" />
              發佈新版本
            </button>
          ) : (
            <div className="rounded-lg border border-violet-200 bg-violet-50/30 p-4 space-y-3">
              <h4 className="text-xs font-semibold text-violet-700">發佈新版本</h4>
              <div>
                <label className="block text-[10px] text-wb-50 mb-0.5">
                  Description（觸發文案）
                </label>
                <textarea
                  value={publishDesc}
                  onChange={(e) => setPublishDesc(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-wb-20 bg-white px-3 py-2 text-sm text-wb-80 outline-none focus:border-wb-50 resize-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-wb-50 mb-0.5">SKILL.md Body</label>
                <textarea
                  value={publishBody}
                  onChange={(e) => setPublishBody(e.target.value)}
                  rows={6}
                  className="w-full rounded-lg border border-wb-20 bg-white px-3 py-2 text-xs text-wb-80 font-mono outline-none focus:border-wb-50 resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePublish}
                  disabled={isPublishing || !publishDesc.trim()}
                  className="rounded-lg bg-violet-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-50"
                >
                  {isPublishing ? '發佈中...' : '發佈'}
                </button>
                <button
                  onClick={() => setShowPublish(false)}
                  className="rounded-lg border border-wb-20 px-3 py-1.5 text-xs text-wb-60 hover:bg-wb-05"
                >
                  取消
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
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
          placeholder={`---\nname: my-skill\ndescription: ...\nallowed-tools:\n  - search_routes\n  - weather\n---\n\n# Skill 指令內容\n...`}
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
  const [matched, setMatched] = useState<Array<{
    slug: string
    description: string
    scope: string
  }> | null>(null)
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
            <p className="text-xs text-wb-40">沒有 skill 被觸發（會 fallback 載入全部）</p>
          ) : (
            <div className="space-y-1">
              {matched.map((s) => (
                <div key={s.slug} className="flex items-center gap-2 text-xs">
                  <span
                    className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${SCOPE_COLORS[s.scope] ?? ''}`}
                  >
                    {SCOPE_LABELS[s.scope]}
                  </span>
                  <span className="font-medium font-mono text-wb-80">{s.slug}</span>
                  <span className="text-wb-50 truncate">{s.description}</span>
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
      const scope = skill.scope
      if (!groups[scope]) groups[scope] = []
      groups[scope].push(skill)
    }
    return groups
  }, [skills])

  const scopeOrder = ['org', 'team', 'personal', 'public']
  const sortedScopes = scopeOrder.filter((s) => grouped[s]?.length)

  const enabledCount = (skills ?? []).filter((s) => s.binding?.enabled).length
  const totalCount = skills?.length ?? 0

  const handleCreate = useCallback(() => {
    createSkill({
      slug: `custom-${Date.now().toString(36)}`,
      description: '新建 Skill — 請編輯 description',
      scope: 'org',
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
            管理 AI Agent 的能力組合。每個 Skill 是不可變版本鏈，可固定特定版本、匯入匯出 SKILL.md。
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
            onClick={handleCreate}
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

      <TriggerTestPanel />

      {sortedScopes.map((scope) => (
        <div key={scope}>
          <div className="mb-3 flex items-center gap-2">
            {SCOPE_ICONS[scope]}
            <h2 className="text-xs font-semibold uppercase tracking-wide text-wb-50">
              {SCOPE_LABELS[scope] ?? scope}
            </h2>
            <span className="text-[10px] text-wb-40">({grouped[scope].length})</span>
          </div>
          <div className="space-y-2">
            {grouped[scope].map((skill) => (
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
