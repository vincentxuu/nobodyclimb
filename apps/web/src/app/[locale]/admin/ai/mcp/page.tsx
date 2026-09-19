'use client'

import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Circle,
  Loader2,
  Plus,
  RefreshCw,
  Server,
  Trash2,
  Wrench,
  X,
} from 'lucide-react'
import { useCallback, useState } from 'react'
import {
  type AdminMCPServer,
  type ToolSnapshot,
  useAdminMCPServers,
  useCreateMCPServer,
  useDeleteMCPServer,
  useDiscoverMCPTools,
  useHealthCheckMCP,
  useMCPTools,
  useUpdateMCPServer,
} from '@/lib/api/admin-ai'

const TRANSPORT_LABELS: Record<string, string> = {
  streamable_http: 'Streamable HTTP',
  http: 'HTTP',
  sse: 'SSE',
  stdio: 'stdio',
}

const HEALTH_CONFIG: Record<string, { color: string; label: string }> = {
  healthy: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: '正常' },
  unhealthy: { color: 'bg-red-50 text-red-700 border-red-200', label: '異常' },
  unknown: { color: 'bg-wb-10 text-wb-60 border-wb-20', label: '未知' },
}

const AUTH_LABELS: Record<string, string> = {
  none: '無',
  api_key: 'API Key',
  oauth: 'OAuth',
  bearer: 'Bearer',
  header: 'Header',
}

function ToolList({ serverId }: { serverId: string }) {
  const { data: tools, isLoading } = useMCPTools(serverId)

  if (isLoading)
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-wb-40" />
      </div>
    )
  if (!tools?.length) return <p className="text-xs text-wb-40 py-2">尚未發現工具</p>

  const active = tools.filter((t) => !t.removed_at)
  const removed = tools.filter((t) => t.removed_at)

  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-medium text-teal-600">已發現工具（{active.length}）</p>
      {active.map((tool) => (
        <div
          key={tool.id}
          className="flex items-center gap-2 rounded border border-teal-100 bg-teal-50/30 px-3 py-2"
        >
          <Wrench className="h-3 w-3 text-teal-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-medium text-wb-80 truncate">
                {tool.qualified_key}
              </span>
              <span className="rounded bg-wb-10 px-1 py-0.5 text-[9px] font-mono text-wb-50 shrink-0">
                {tool.schema_hash.slice(0, 8)}
              </span>
            </div>
            <p className="text-[11px] text-wb-50 truncate">{tool.description}</p>
          </div>
        </div>
      ))}
      {removed.length > 0 && (
        <>
          <p className="text-[11px] font-medium text-wb-40 mt-2">已移除（{removed.length}）</p>
          {removed.map((tool) => (
            <div
              key={tool.id}
              className="flex items-center gap-2 rounded border border-wb-10 bg-wb-05 px-3 py-2 opacity-50"
            >
              <Wrench className="h-3 w-3 text-wb-30 shrink-0" />
              <span className="text-xs font-mono text-wb-40 line-through truncate">
                {tool.qualified_key}
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

function ServerCard({ server }: { server: AdminMCPServer }) {
  const [expanded, setExpanded] = useState(false)
  const [editUrl, setEditUrl] = useState(server.url ?? '')
  const [editTransport, setEditTransport] = useState(server.transport)
  const [editAuthType, setEditAuthType] = useState(server.auth_type)
  const [editSecretRef, setEditSecretRef] = useState(server.secret_ref ?? '')
  const [editDesc, setEditDesc] = useState(server.description ?? '')
  const [dirty, setDirty] = useState(false)

  const { mutate: updateServer, isPending: isUpdating } = useUpdateMCPServer()
  const { mutate: deleteServer, isPending: isDeleting } = useDeleteMCPServer()
  const { mutate: discover, isPending: isDiscovering } = useDiscoverMCPTools()
  const { mutate: healthCheck, isPending: isChecking } = useHealthCheckMCP()

  const health = HEALTH_CONFIG[server.health_status] ?? HEALTH_CONFIG.unknown

  const handleToggle = useCallback(() => {
    updateServer({ id: server.id, data: { enabled: server.enabled ? 0 : 1 } })
  }, [server.id, server.enabled, updateServer])

  const handleSave = useCallback(() => {
    updateServer(
      {
        id: server.id,
        data: {
          url: editUrl,
          transport: editTransport,
          auth_type: editAuthType,
          secret_ref: editSecretRef || undefined,
          description: editDesc || null,
        },
      },
      { onSuccess: () => setDirty(false) }
    )
  }, [server.id, editUrl, editTransport, editAuthType, editSecretRef, editDesc, updateServer])

  return (
    <div
      className={`rounded-xl border bg-white overflow-hidden transition-colors ${server.enabled ? 'border-wb-20' : 'border-wb-10 opacity-60'}`}
    >
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50">
          <Server className="h-4 w-4 text-teal-600" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-wb-100 font-mono">{server.name}</span>
            <span
              className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${health.color}`}
            >
              {health.label}
            </span>
            <span className="rounded-md border border-teal-200 bg-teal-50 px-1.5 py-0.5 text-[10px] font-medium text-teal-700">
              {TRANSPORT_LABELS[server.transport] ?? server.transport}
            </span>
            {server.auth_type !== 'none' && (
              <span className="rounded-md border border-wb-20 bg-wb-10 px-1.5 py-0.5 text-[10px] font-medium text-wb-60">
                {AUTH_LABELS[server.auth_type] ?? server.auth_type}
              </span>
            )}
            {server.source_plugin_id && (
              <span className="rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                Plugin
              </span>
            )}
          </div>
          {server.url && (
            <p className="text-[11px] text-wb-40 font-mono truncate mt-0.5">{server.url}</p>
          )}
          {server.description && <p className="text-xs text-wb-50 mt-0.5">{server.description}</p>}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {server.tool_count != null && (
            <span className="rounded border border-wb-15 bg-wb-05 px-1.5 py-0.5 text-[10px] tabular-nums text-wb-60">
              {server.tool_count} 工具
            </span>
          )}
          <button
            type="button"
            onClick={handleToggle}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${server.enabled ? 'bg-teal-500' : 'bg-wb-30'}`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${server.enabled ? 'translate-x-[18px]' : 'translate-x-[3px]'}`}
            />
          </button>
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
        <div className="border-t border-wb-10 px-5 py-4 space-y-4 bg-wb-05/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-wb-50 block mb-1">URL</label>
              <input
                type="text"
                value={editUrl}
                onChange={(e) => {
                  setEditUrl(e.target.value)
                  setDirty(true)
                }}
                className="w-full rounded border border-wb-20 bg-white px-2.5 py-1.5 text-xs font-mono text-wb-80 focus:border-teal-300 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-wb-50 block mb-1">Transport</label>
              <select
                value={editTransport}
                onChange={(e) => {
                  setEditTransport(e.target.value)
                  setDirty(true)
                }}
                className="w-full rounded border border-wb-20 bg-white px-2.5 py-1.5 text-xs text-wb-80 focus:border-teal-300 focus:outline-hidden"
              >
                <option value="streamable_http">Streamable HTTP</option>
                <option value="http">HTTP</option>
                <option value="sse">SSE</option>
                <option value="stdio">stdio</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-wb-50 block mb-1">Auth Type</label>
              <select
                value={editAuthType}
                onChange={(e) => {
                  setEditAuthType(e.target.value)
                  setDirty(true)
                }}
                className="w-full rounded border border-wb-20 bg-white px-2.5 py-1.5 text-xs text-wb-80 focus:border-teal-300 focus:outline-hidden"
              >
                <option value="none">None</option>
                <option value="api_key">API Key</option>
                <option value="bearer">Bearer Token</option>
                <option value="oauth">OAuth</option>
                <option value="header">Custom Header</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-wb-50 block mb-1">
                Secret Reference
              </label>
              <input
                type="text"
                value={editSecretRef}
                onChange={(e) => {
                  setEditSecretRef(e.target.value)
                  setDirty(true)
                }}
                placeholder="secret manager key"
                className="w-full rounded border border-wb-20 bg-white px-2.5 py-1.5 text-xs font-mono text-wb-80 focus:border-teal-300 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-wb-50 block mb-1">說明</label>
            <input
              type="text"
              value={editDesc}
              onChange={(e) => {
                setEditDesc(e.target.value)
                setDirty(true)
              }}
              className="w-full rounded border border-wb-20 bg-white px-2.5 py-1.5 text-xs text-wb-80 focus:border-teal-300 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2">
            {dirty && (
              <button
                type="button"
                onClick={handleSave}
                disabled={isUpdating}
                className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700 disabled:opacity-50"
              >
                {isUpdating ? '儲存中...' : '儲存'}
              </button>
            )}
            <button
              type="button"
              onClick={() => discover(server.id)}
              disabled={isDiscovering}
              className="flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700 hover:bg-teal-100 disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${isDiscovering ? 'animate-spin' : ''}`} />
              {isDiscovering ? '發現中...' : '重新發現工具'}
            </button>
            <button
              type="button"
              onClick={() => healthCheck(server.id)}
              disabled={isChecking}
              className="flex items-center gap-1.5 rounded-lg border border-wb-20 bg-white px-3 py-1.5 text-xs font-medium text-wb-70 hover:bg-wb-10 disabled:opacity-50"
            >
              <Circle className={`h-3 w-3 ${isChecking ? 'animate-pulse' : ''}`} />
              Health Check
            </button>
            {!server.source_plugin_id && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`確定要刪除 MCP Server「${server.name}」？`)) {
                    deleteServer(server.id)
                  }
                }}
                disabled={isDeleting}
                className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 ml-auto"
              >
                <Trash2 className="h-3 w-3" />
                刪除
              </button>
            )}
          </div>

          <ToolList serverId={server.id} />
        </div>
      )}
    </div>
  )
}

function AddServerDialog({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [transport, setTransport] = useState('streamable_http')
  const [authType, setAuthType] = useState('none')
  const [secretRef, setSecretRef] = useState('')
  const [desc, setDesc] = useState('')

  const { mutate: create, isPending } = useCreateMCPServer()

  const handleSubmit = () => {
    if (!name.trim() || !url.trim()) return
    create(
      {
        name: name.trim(),
        url: url.trim(),
        transport,
        auth_type: authType,
        secret_ref: secretRef || undefined,
        description: desc || undefined,
      },
      { onSuccess: () => onClose() }
    )
  }

  return (
    <div className="rounded-xl border border-teal-200 bg-teal-50/30 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-teal-800">新增 MCP Server</h3>
        <button type="button" onClick={onClose} className="text-wb-40 hover:text-wb-70">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-medium text-wb-50 block mb-1">名稱 *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="weather-api"
            className="w-full rounded border border-wb-20 bg-white px-2.5 py-1.5 text-xs font-mono text-wb-80 focus:border-teal-300 focus:outline-hidden"
          />
        </div>
        <div>
          <label className="text-[11px] font-medium text-wb-50 block mb-1">URL *</label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://mcp.example.com/sse"
            className="w-full rounded border border-wb-20 bg-white px-2.5 py-1.5 text-xs font-mono text-wb-80 focus:border-teal-300 focus:outline-hidden"
          />
        </div>
        <div>
          <label className="text-[11px] font-medium text-wb-50 block mb-1">Transport</label>
          <select
            value={transport}
            onChange={(e) => setTransport(e.target.value)}
            className="w-full rounded border border-wb-20 bg-white px-2.5 py-1.5 text-xs text-wb-80 focus:border-teal-300 focus:outline-hidden"
          >
            <option value="streamable_http">Streamable HTTP</option>
            <option value="http">HTTP</option>
            <option value="sse">SSE</option>
          </select>
        </div>
        <div>
          <label className="text-[11px] font-medium text-wb-50 block mb-1">Auth Type</label>
          <select
            value={authType}
            onChange={(e) => setAuthType(e.target.value)}
            className="w-full rounded border border-wb-20 bg-white px-2.5 py-1.5 text-xs text-wb-80 focus:border-teal-300 focus:outline-hidden"
          >
            <option value="none">None</option>
            <option value="api_key">API Key</option>
            <option value="bearer">Bearer Token</option>
            <option value="oauth">OAuth</option>
          </select>
        </div>
      </div>
      {authType !== 'none' && (
        <div>
          <label className="text-[11px] font-medium text-wb-50 block mb-1">Secret Reference</label>
          <input
            type="text"
            value={secretRef}
            onChange={(e) => setSecretRef(e.target.value)}
            placeholder="MCP_TOKEN_WEATHER"
            className="w-full rounded border border-wb-20 bg-white px-2.5 py-1.5 text-xs font-mono text-wb-80 focus:border-teal-300 focus:outline-hidden"
          />
        </div>
      )}
      <div>
        <label className="text-[11px] font-medium text-wb-50 block mb-1">說明</label>
        <input
          type="text"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="天氣 API MCP Server"
          className="w-full rounded border border-wb-20 bg-white px-2.5 py-1.5 text-xs text-wb-80 focus:border-teal-300 focus:outline-hidden"
        />
      </div>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!name.trim() || !url.trim() || isPending}
        className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-medium text-white hover:bg-teal-700 disabled:opacity-50"
      >
        {isPending ? '建立中...' : '建立'}
      </button>
    </div>
  )
}

export default function AdminMCPPage() {
  const { data: servers, isLoading, error } = useAdminMCPServers()
  const [showAdd, setShowAdd] = useState(false)

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

  const list = servers ?? []
  const enabledCount = list.filter((s) => s.enabled).length
  const healthyCount = list.filter((s) => s.health_status === 'healthy').length

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-wb-100">MCP Servers</h1>
          <p className="text-xs text-wb-50 mt-0.5">管理外部 MCP Server 連線與工具發現</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-2 text-xs font-medium text-white hover:bg-teal-700"
        >
          <Plus className="h-3.5 w-3.5" />
          新增 Server
        </button>
      </div>

      {showAdd && <AddServerDialog onClose={() => setShowAdd(false)} />}

      <div className="rounded-lg border border-wb-20 bg-white px-4 py-2.5 flex items-center gap-4 text-xs">
        <span className="text-wb-50">
          Server：<span className="font-semibold text-wb-100">{enabledCount}</span>/{list.length}{' '}
          啟用
        </span>
        <span className="text-wb-50">
          健康：
          <span
            className={`font-semibold ${healthyCount === enabledCount ? 'text-emerald-600' : 'text-amber-600'}`}
          >
            {healthyCount}
          </span>
          /{enabledCount}
        </span>
      </div>

      <div className="space-y-3">
        {list.length === 0 ? (
          <div className="rounded-xl border border-wb-20 bg-white p-10 text-center">
            <Server className="h-8 w-8 text-wb-30 mx-auto mb-3" />
            <p className="text-sm text-wb-50">尚未設定任何 MCP Server</p>
            <p className="text-xs text-wb-40 mt-1">點擊「新增 Server」連接外部服務</p>
          </div>
        ) : (
          list.map((server) => <ServerCard key={server.id} server={server} />)
        )}
      </div>
    </div>
  )
}
