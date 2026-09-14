export interface Skill {
  id: string
  tenant_id: string
  slug: string
  display_name: string | null
  scope: string
  owner_id: string | null
  source: string
  latest_version_id: string | null
  created_at: string
}

export interface SkillVersion {
  id: string
  skill_id: string
  version_number: number
  name: string
  description: string
  body: string | null
  allowed_tools: string[]
  content_hash: string
  status: 'draft' | 'published' | 'deprecated'
  token_count: number | null
  metadata: Record<string, unknown> | null
  published_at: string | null
  created_at: string
}

export interface SkillFile {
  id: string
  version_id: string
  path: string
  blob_key: string
  size_bytes: number | null
  content_type: string | null
}

export interface SkillBinding {
  id: string
  tenant_id: string
  subject_type: string
  subject_id: string
  skill_id: string
  pinned_version_id: string | null
  enabled: boolean
}

export interface SkillInvocation {
  id: string
  version_id: string
  session_id: string | null
  triggered_at: string
  outcome: 'used' | 'loaded_unused' | 'error' | null
}

export interface ResolvedSkill {
  skillId: string
  slug: string
  displayName: string | null
  versionId: string
  versionNumber: number
  name: string
  description: string
  body: string | null
  allowedTools: string[]
  contentHash: string
  tokenCount: number | null
  source: string
}

export interface SkillContent {
  frontmatter: Record<string, unknown>
  body: string
}
