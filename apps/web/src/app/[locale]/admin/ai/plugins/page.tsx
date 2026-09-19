'use client'

import { ChevronDown, ChevronRight, Loader2, Package, Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import {
  type AdminPlugin,
  useAdminPlugins,
  useInstallPlugin,
  useUninstallPlugin,
} from '@/lib/api/admin-ai'

function PluginCard({ plugin }: { plugin: AdminPlugin }) {
  const [expanded, setExpanded] = useState(false)
  const { mutate: uninstall, isPending } = useUninstallPlugin()

  const counts = plugin.component_counts
  const manifestStr = plugin.manifest ? JSON.stringify(plugin.manifest, null, 2) : null

  return (
    <div className="rounded-xl border border-wb-20 bg-white overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50">
          <Package className="h-4 w-4 text-amber-600" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-wb-100">{plugin.name}</span>
            <span className="rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
              v{plugin.semver}
            </span>
          </div>
          {plugin.description && <p className="text-xs text-wb-50 mt-0.5">{plugin.description}</p>}
          <div className="flex items-center gap-3 mt-1">
            {counts && (
              <>
                {counts.skills > 0 && (
                  <span className="text-[10px] text-wb-40">{counts.skills} skills</span>
                )}
                {counts.mcp_servers > 0 && (
                  <span className="text-[10px] text-wb-40">{counts.mcp_servers} MCP servers</span>
                )}
                {counts.hooks > 0 && (
                  <span className="text-[10px] text-wb-40">{counts.hooks} hooks</span>
                )}
              </>
            )}
            <span className="text-[10px] text-wb-30">
              安裝於 {new Date(plugin.installed_at).toLocaleDateString('zh-TW')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="rounded p-1 text-wb-40 hover:text-wb-70"
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-wb-10 px-5 py-4 space-y-3 bg-wb-05/50">
          {manifestStr && (
            <div>
              <p className="text-[11px] font-medium text-wb-50 mb-1">Manifest</p>
              <pre className="rounded border border-wb-20 bg-white p-3 text-[11px] font-mono text-wb-70 overflow-x-auto max-h-60 overflow-y-auto">
                {manifestStr}
              </pre>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (
                  confirm(
                    `確定要解除安裝 Plugin「${plugin.name}」？將移除所有相關 skills、MCP servers 和 hooks。`
                  )
                ) {
                  uninstall(plugin.id)
                }
              }}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              <Trash2 className="h-3 w-3" />
              {isPending ? '解除安裝中...' : '解除安裝'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function InstallDialog({ onClose }: { onClose: () => void }) {
  const [manifestText, setManifestText] = useState('')
  const [parseError, setParseError] = useState<string | null>(null)

  const { mutate: install, isPending } = useInstallPlugin()

  const handleInstall = () => {
    setParseError(null)
    let manifest: Record<string, unknown>
    try {
      manifest = JSON.parse(manifestText)
    } catch {
      setParseError('無效的 JSON 格式')
      return
    }
    if (!manifest.name) {
      setParseError('manifest 缺少 name 欄位')
      return
    }
    install(manifest, {
      onSuccess: (result) => {
        onClose()
        alert(`Plugin 安裝成功：${result.skills} skills, ${result.mcp_servers} MCP servers`)
      },
      onError: (err) => {
        setParseError(err instanceof Error ? err.message : '安裝失敗')
      },
    })
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/30 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-amber-800">安裝 Plugin</h3>
        <button type="button" onClick={onClose} className="text-wb-40 hover:text-wb-70">
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="text-xs text-wb-50">貼入 plugin.json manifest（符合 Agent Plugins 1.0 規格）</p>
      <textarea
        value={manifestText}
        onChange={(e) => {
          setManifestText(e.target.value)
          setParseError(null)
        }}
        rows={12}
        placeholder='{"name": "my-plugin", "version": "1.0.0", "skills": [...], "mcp_servers": [...]}'
        className="w-full rounded border border-wb-20 bg-white px-3 py-2 text-xs font-mono text-wb-80 focus:border-amber-300 focus:outline-hidden resize-y"
      />
      {parseError && <p className="text-xs text-red-600">{parseError}</p>}
      <button
        type="button"
        onClick={handleInstall}
        disabled={!manifestText.trim() || isPending}
        className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
      >
        {isPending ? '安裝中...' : '安裝'}
      </button>
    </div>
  )
}

export default function AdminPluginsPage() {
  const { data: plugins, isLoading, error } = useAdminPlugins()
  const [showInstall, setShowInstall] = useState(false)

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
        載入失敗
      </div>
    )
  }

  const list = plugins ?? []

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-wb-100">Plugins</h1>
          <p className="text-xs text-wb-50 mt-0.5">
            安裝與管理 Plugin 套件（skills + MCP servers + hooks 打包）
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowInstall(!showInstall)}
          className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-medium text-white hover:bg-amber-700"
        >
          <Plus className="h-3.5 w-3.5" />
          安裝 Plugin
        </button>
      </div>

      {showInstall && <InstallDialog onClose={() => setShowInstall(false)} />}

      <div className="rounded-lg border border-wb-20 bg-white px-4 py-2.5 flex items-center gap-4 text-xs">
        <span className="text-wb-50">
          已安裝：<span className="font-semibold text-wb-100">{list.length}</span> 個 Plugin
        </span>
      </div>

      <div className="space-y-3">
        {list.length === 0 ? (
          <div className="rounded-xl border border-wb-20 bg-white p-10 text-center">
            <Package className="h-8 w-8 text-wb-30 mx-auto mb-3" />
            <p className="text-sm text-wb-50">尚未安裝任何 Plugin</p>
            <p className="text-xs text-wb-40 mt-1">
              Plugin 是 skills + MCP servers + hooks 的打包單位，支援一鍵安裝與解除安裝
            </p>
          </div>
        ) : (
          list.map((plugin) => <PluginCard key={plugin.id} plugin={plugin} />)
        )}
      </div>
    </div>
  )
}
