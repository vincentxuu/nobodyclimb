export interface PluginManifest {
  $schema?: string
  name: string
  version?: string
  description?: string
  author?: string
  keywords?: string[]
  skills?: Array<{
    name: string
    description: string
    content?: string
  }>
  mcp_servers?: Array<{
    name: string
    description?: string
    transport: string
    url: string
    auth_type?: string
  }>
}

export interface PluginVersionRow {
  id: string
  plugin_id: string
  name: string
  description: string | null
  semver: string
  manifest: string
  source_type: string | null
  signature: string | null
  created_at: string
}

export interface PluginInstallRow {
  id: string
  tenant_id: string
  subject_type: string
  subject_id: string
  plugin_version_id: string
  installed_at: string
  name?: string
  semver?: string
  description?: string | null
}
