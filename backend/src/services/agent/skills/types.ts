export interface SkillRecord {
  id: string
  name: string
  description: string
  triggers: string[]
  execution_mode: 'tool_group' | 'sub_agent' | 'multi_step'
  required_tools: string[]
  requires_auth: boolean
  version: number
  source: string
  enabled: boolean
  priority: number
  r2_key: string | null
}

export interface SkillContent {
  frontmatter: Record<string, unknown>
  body: string
}
