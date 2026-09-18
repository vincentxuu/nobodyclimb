import { loadFullSkillContent, resolveReferences } from './loader'
import type { ResolvedSkill } from './types'

const ALWAYS_LOAD_SKILLS = ['search', 'data']

export class SkillResolver {
  private skills: ResolvedSkill[] = []

  async load(db: D1Database, userId?: string | null): Promise<void> {
    const query = `SELECT
        s.id AS skillId,
        s.slug,
        s.display_name AS displayName,
        s.source,
        sv.id AS versionId,
        sv.version_number AS versionNumber,
        sv.name,
        sv.description,
        sv.body,
        sv.allowed_tools AS allowedToolsJson,
        sv.content_hash AS contentHash,
        sv.token_count AS tokenCount
      FROM skill_binding sb
      JOIN skill s ON sb.skill_id = s.id
      JOIN skill_version sv ON sv.id = COALESCE(sb.pinned_version_id, s.latest_version_id)
      WHERE sb.enabled = 1 AND sv.status = 'published'
        AND (
          (sb.subject_type = 'agent' AND sb.subject_id = 'default')
          ${userId ? "OR (sb.subject_type = 'user' AND sb.subject_id = ?)" : ''}
        )
      ORDER BY sv.name`

    const stmt = userId ? db.prepare(query).bind(userId) : db.prepare(query)
    const { results } = await stmt.all()

    const seen = new Set<string>()
    this.skills = (results ?? [])
      .map((r) => ({
        skillId: r.skillId as string,
        slug: r.slug as string,
        displayName: r.displayName as string | null,
        versionId: r.versionId as string,
        versionNumber: r.versionNumber as number,
        name: r.name as string,
        description: r.description as string,
        body: r.body as string | null,
        allowedTools: JSON.parse((r.allowedToolsJson as string) ?? '[]') as string[],
        contentHash: r.contentHash as string,
        tokenCount: r.tokenCount as number | null,
        source: r.source as string,
      }))
      .filter((s) => {
        if (seen.has(s.slug)) return false
        seen.add(s.slug)
        return true
      })
  }

  resolve(query: string, _isAuthenticated: boolean): ResolvedSkill[] {
    const alwaysLoad = this.skills.filter((s) => ALWAYS_LOAD_SKILLS.includes(s.slug))
    const rest = this.skills.filter((s) => !ALWAYS_LOAD_SKILLS.includes(s.slug))

    const matched = rest.filter((s) => {
      const triggerMatch = s.description.match(/當使用者[^。]*?([^。]+)觸發/)
      if (triggerMatch) {
        const triggers = triggerMatch[1].split(/[、，,]/).map((t) => t.trim())
        return triggers.some((t) => t.length > 0 && query.includes(t))
      }
      return false
    })

    if (matched.length > 0) {
      const seen = new Set<string>()
      return [...alwaysLoad, ...matched].filter((s) => {
        if (seen.has(s.slug)) return false
        seen.add(s.slug)
        return true
      })
    }

    return this.skills
  }

  getRequiredTools(skills: ResolvedSkill[]): string[] {
    return [...new Set(skills.flatMap((s) => s.allowedTools))]
  }

  buildPromptSections(skills: ResolvedSkill[]): string {
    return skills.map((s) => `- **${s.displayName ?? s.name}**：${s.description}`).join('\n')
  }

  findDirectRoute(query: string, _isAuthenticated: boolean): ResolvedSkill | null {
    const subAgentSkills = this.skills.filter((s) =>
      s.allowedTools.some((t) => t.endsWith('_agent'))
    )
    const matched = subAgentSkills.filter((s) => {
      const triggerMatch = s.description.match(/當使用者[^。]*?([^。]+)觸發/)
      if (!triggerMatch) return false
      const triggers = triggerMatch[1].split(/[、，,]/).map((t) => t.trim())
      return triggers.some((t) => t.length > 0 && query.includes(t))
    })
    return matched.length === 1 ? matched[0] : null
  }

  getAllSkills(): ResolvedSkill[] {
    return this.skills
  }

  async loadSkillBodies(storage: R2Bucket, skills: ResolvedSkill[]): Promise<Map<string, string>> {
    const bodies = new Map<string, string>()
    for (const skill of skills) {
      try {
        if (skill.body) {
          const resolved = await resolveReferences(storage, skill.slug, skill.body)
          bodies.set(skill.slug, resolved)
        } else {
          const content = await loadFullSkillContent(storage, skill.slug)
          if (content) bodies.set(skill.slug, content)
        }
      } catch {
        // R2 unavailable (e.g. local dev) — skip silently
      }
    }
    return bodies
  }

  buildPromptSectionsWithBodies(skills: ResolvedSkill[], bodies: Map<string, string>): string {
    return skills
      .map((s) => {
        const body = bodies.get(s.slug)
        if (body) {
          return `## ${s.displayName ?? s.name}\n\n${body}`
        }
        return `- **${s.displayName ?? s.name}**：${s.description}`
      })
      .join('\n\n')
  }
}

export async function recordSkillInvocation(
  db: D1Database,
  versionId: string,
  sessionId: string | null,
  outcome: 'used' | 'loaded_unused' | 'error'
): Promise<void> {
  try {
    await db
      .prepare(
        'INSERT INTO skill_invocation (id, version_id, session_id, outcome) VALUES (?, ?, ?, ?)'
      )
      .bind(crypto.randomUUID().replace(/-/g, ''), versionId, sessionId, outcome)
      .run()
  } catch {
    /* non-blocking */
  }
}
