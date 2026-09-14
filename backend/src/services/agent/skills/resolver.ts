import type { SkillRecord } from './types'

const ALWAYS_LOAD_SKILLS = ['search', 'data']

export class SkillResolver {
  private skills: SkillRecord[] = []

  async load(db: D1Database): Promise<void> {
    const { results } = await db
      .prepare('SELECT * FROM skills WHERE enabled = 1 ORDER BY priority')
      .all()
    this.skills = (results ?? []).map((r) => ({
      ...(r as Record<string, unknown>),
      triggers: JSON.parse((r.triggers as string) ?? '[]') as string[],
      required_tools: JSON.parse((r.required_tools as string) ?? '[]') as string[],
      requires_auth: (r.requires_auth as number) === 1,
      enabled: (r.enabled as number) === 1,
    })) as SkillRecord[]
  }

  resolve(query: string, isAuthenticated: boolean): SkillRecord[] {
    const eligible = this.skills.filter((s) => !s.requires_auth || isAuthenticated)
    const alwaysLoad = eligible.filter((s) => ALWAYS_LOAD_SKILLS.includes(s.name))

    const matched = eligible.filter((s) => {
      if (ALWAYS_LOAD_SKILLS.includes(s.name)) return false
      return s.triggers.some((t) => query.includes(t))
    })

    if (matched.length > 0) {
      const seen = new Set<string>()
      return [...alwaysLoad, ...matched].filter((s) => {
        if (seen.has(s.name)) return false
        seen.add(s.name)
        return true
      })
    }

    return eligible
  }

  getRequiredTools(skills: SkillRecord[]): string[] {
    return [...new Set(skills.flatMap((s) => s.required_tools))]
  }

  buildPromptSections(skills: SkillRecord[]): string {
    return skills.map((s) => `- **${s.name}**：${s.description}`).join('\n')
  }

  findDirectRoute(query: string, isAuthenticated: boolean): SkillRecord | null {
    const eligible = this.skills.filter(
      (s) => s.execution_mode === 'sub_agent' && (!s.requires_auth || isAuthenticated)
    )
    const matched = eligible.filter((s) => s.triggers.some((t) => query.includes(t)))
    return matched.length === 1 ? matched[0] : null
  }
}
