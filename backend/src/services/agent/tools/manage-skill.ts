import { computeContentHash, estimateTokenCount, serializeSkillMd } from '../skills/loader'
import type { Tool, ToolContext, ToolResult } from '../types'

function r2Path(slug: string, userId: string | null): string {
  return userId ? `skills/personal/${userId}/${slug}` : `skills/${slug}`
}

export const manageSkillTool: Tool = {
  name: 'manage_skill',
  tags: ['system', 'skill'],
  alwaysLoad: false,
  concurrencySafe: false,
  maxResultChars: 2000,
  cacheTTL: 0,
  parameters: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['create', 'update', 'delete'],
        description: '操作類型',
      },
      name: {
        type: 'string',
        description: '技能的 kebab-case 名稱（如 weather-advisor）',
      },
      description: {
        type: 'string',
        description: '一行描述，用於觸發判斷（create/update 必填）',
      },
      body: {
        type: 'string',
        description: 'SKILL.md 的正文內容，markdown 格式（create/update 必填）',
      },
      allowed_tools: {
        type: 'array',
        items: { type: 'string' },
        description: '此 skill 可使用的工具名稱列表（選填）',
      },
    },
    required: ['action', 'name'],
  },

  prompt(ctx: ToolContext): string {
    return ctx.userId
      ? '建立、更新或刪除你的個人 skill。建立的 skill 只有你看得到，不會影響其他使用者。'
      : '建立、更新或刪除 managed skill（需登入才能使用）。'
  },

  async execute(input: unknown, ctx: ToolContext): Promise<unknown> {
    const { action, name, description, body, allowed_tools } = input as {
      action: 'create' | 'update' | 'delete'
      name: string
      description?: string
      body?: string
      allowed_tools?: string[]
    }

    if (!ctx.userId) {
      return { error: '需要登入才能管理 skill' }
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    if (!slug || slug.length > 64) {
      return { error: 'name 必須是 1-64 字元的 kebab-case 字串' }
    }

    const db = ctx.env.DB
    const storage = ctx.env.AGENT_STORAGE
    const userId = ctx.userId
    const r2Prefix = r2Path(slug, userId)

    if (action === 'delete') {
      const existing = await db
        .prepare(
          "SELECT id, source, owner_id FROM skill WHERE tenant_id = 'default' AND slug = ? AND scope = 'personal' AND owner_id = ?"
        )
        .bind(slug, userId)
        .first<{ id: string; source: string; owner_id: string }>()

      if (!existing) {
        return { error: `找不到你的 personal skill: ${slug}` }
      }

      await db.prepare('DELETE FROM skill WHERE id = ?').bind(existing.id).run()

      try {
        const listed = await storage.list({ prefix: `${r2Prefix}/` })
        for (const obj of listed.objects) {
          await storage.delete(obj.key)
        }
      } catch {
        /* R2 cleanup best-effort */
      }

      return { action: 'deleted', slug }
    }

    // create / update
    if (!description) {
      return { error: `${action} 操作需要 description` }
    }
    if (!body) {
      return { error: `${action} 操作需要 body` }
    }

    const frontmatter: Record<string, unknown> = { name: slug, description }
    if (allowed_tools?.length) {
      frontmatter['allowed-tools'] = allowed_tools
    }
    const skillMdContent = serializeSkillMd(frontmatter, body)
    const contentHash = computeContentHash(skillMdContent)
    const tokenCount = estimateTokenCount(description + body)

    // 存 R2（personal 路徑隔離）
    await storage.put(`${r2Prefix}/SKILL.md`, skillMdContent, {
      httpMetadata: { contentType: 'text/markdown' },
    })

    // 查現有 personal skill
    const existing = await db
      .prepare(
        "SELECT id FROM skill WHERE tenant_id = 'default' AND slug = ? AND scope = 'personal' AND owner_id = ?"
      )
      .bind(slug, userId)
      .first<{ id: string }>()

    if (action === 'create' && existing) {
      return { error: `你已有 skill「${slug}」，請用 update` }
    }

    const skillId = existing?.id ?? crypto.randomUUID()
    const versionId = crypto.randomUUID()

    if (!existing) {
      await db
        .prepare(
          `INSERT INTO skill (id, tenant_id, slug, display_name, scope, owner_id, source, latest_version_id, created_at)
           VALUES (?, 'default', ?, ?, 'personal', ?, 'custom', ?, datetime('now'))`
        )
        .bind(skillId, slug, name, userId, versionId)
        .run()

      await db
        .prepare(
          `INSERT OR IGNORE INTO skill_binding (id, tenant_id, subject_type, subject_id, skill_id, enabled)
           VALUES (?, 'default', 'user', ?, ?, 1)`
        )
        .bind(crypto.randomUUID(), userId, skillId)
        .run()
    }

    const lastVer = await db
      .prepare('SELECT MAX(version_number) AS max_ver FROM skill_version WHERE skill_id = ?')
      .bind(skillId)
      .first<{ max_ver: number | null }>()
    const nextVersion = (lastVer?.max_ver ?? 0) + 1

    await db
      .prepare(
        `INSERT INTO skill_version (id, skill_id, version_number, name, description, body, allowed_tools, content_hash, status, token_count, published_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, datetime('now'), datetime('now'))`
      )
      .bind(
        versionId,
        skillId,
        nextVersion,
        slug,
        description,
        body,
        JSON.stringify(allowed_tools ?? []),
        contentHash,
        tokenCount
      )
      .run()

    await db
      .prepare('UPDATE skill SET latest_version_id = ? WHERE id = ?')
      .bind(versionId, skillId)
      .run()

    return {
      action: action === 'create' ? 'created' : 'updated',
      slug,
      version: nextVersion,
      tokenCount,
      scope: 'personal',
    }
  },

  formatResult(raw: unknown): ToolResult {
    const data = raw as Record<string, unknown>
    if (data.error) {
      return { content: `錯誤：${data.error}`, metadata: { error: true } }
    }
    if (data.action === 'deleted') {
      return { content: `已刪除你的 skill「${data.slug}」。` }
    }
    return {
      content: `已${data.action === 'created' ? '建立' : '更新'}你的個人 skill「${data.slug}」（版本 ${data.version}，約 ${data.tokenCount} tokens）。下次對話即可使用。`,
    }
  },
}
