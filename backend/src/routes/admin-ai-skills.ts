import { Hono } from 'hono'
import { validator } from 'hono-openapi'
import { z } from 'zod'
import { adminMiddleware, authMiddleware } from '../middleware/auth'
import {
  computeContentHash,
  estimateTokenCount,
  parseSkillMd,
  saveSkillContent,
} from '../services/agent/skills/loader'
import { Env } from '../types'

export const adminAiSkillsRoutes = new Hono<{ Bindings: Env }>()

adminAiSkillsRoutes.use('*', authMiddleware, adminMiddleware)

// GET /skills — list all skills with latest version info
adminAiSkillsRoutes.get('/skills', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT
      s.id, s.tenant_id, s.slug, s.display_name, s.scope, s.source, s.created_at,
      sv.id AS version_id, sv.version_number, sv.name, sv.description,
      sv.allowed_tools, sv.status, sv.token_count, sv.published_at,
      sb.enabled AS binding_enabled, sb.pinned_version_id
    FROM skill s
    LEFT JOIN skill_version sv ON sv.id = s.latest_version_id
    LEFT JOIN skill_binding sb ON sb.skill_id = s.id AND sb.subject_type = 'agent' AND sb.subject_id = 'default'
    ORDER BY s.slug`
  ).all()
  return c.json({ success: true, data: results })
})

// POST /skills — create skill + first version
const createSkillSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/),
  display_name: z.string().max(255).optional(),
  scope: z.enum(['personal', 'team', 'org', 'public']).optional().default('org'),
  description: z.string().min(1).max(1024),
  allowed_tools: z.array(z.string()).optional().default([]),
  body: z.string().optional(),
  skill_md: z.string().optional(),
})

adminAiSkillsRoutes.post('/skills', validator('json', createSkillSchema), async (c) => {
  const body = c.req.valid('json')
  const skillId = `sk_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`
  const versionId = `skv_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`
  const bindingId = `sb_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`

  const skillBody = body.body ?? ''
  const contentHash = computeContentHash(body.description + skillBody)
  const tokenCount = estimateTokenCount(body.description + skillBody)

  await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT INTO skill (id, tenant_id, slug, display_name, scope, source, latest_version_id)
       VALUES (?, 'default', ?, ?, ?, 'custom', ?)`
    ).bind(skillId, body.slug, body.display_name ?? null, body.scope, versionId),
    c.env.DB.prepare(
      `INSERT INTO skill_version (id, skill_id, version_number, name, description, body, allowed_tools, content_hash, status, token_count, published_at)
       VALUES (?, ?, 1, ?, ?, ?, ?, ?, 'published', ?, datetime('now'))`
    ).bind(
      versionId,
      skillId,
      body.slug,
      body.description,
      skillBody,
      JSON.stringify(body.allowed_tools),
      contentHash,
      tokenCount
    ),
    c.env.DB.prepare(
      `INSERT INTO skill_binding (id, tenant_id, subject_type, subject_id, skill_id, enabled)
       VALUES (?, 'default', 'agent', 'default', ?, 1)`
    ).bind(bindingId, skillId),
  ])

  if (body.skill_md) {
    await saveSkillContent(c.env.AGENT_STORAGE, body.slug, body.skill_md)
  }

  return c.json({ success: true, data: { id: skillId, version_id: versionId } }, 201)
})

// GET /skills/:id — detail with versions + bindings
adminAiSkillsRoutes.get('/skills/:id', async (c) => {
  const id = c.req.param('id')

  const [skill, versions, bindings, files] = await Promise.all([
    c.env.DB.prepare('SELECT * FROM skill WHERE id = ?').bind(id).first(),
    c.env.DB.prepare('SELECT * FROM skill_version WHERE skill_id = ? ORDER BY version_number DESC')
      .bind(id)
      .all(),
    c.env.DB.prepare('SELECT * FROM skill_binding WHERE skill_id = ?').bind(id).all(),
    c.env.DB.prepare(
      `SELECT sf.* FROM skill_file sf
       JOIN skill_version sv ON sf.version_id = sv.id
       WHERE sv.skill_id = ? ORDER BY sf.path`
    )
      .bind(id)
      .all(),
  ])

  if (!skill) {
    return c.json({ success: false, error: 'NotFound' }, 404)
  }

  let skill_md: string | null = null
  if (skill.slug) {
    try {
      const obj = await c.env.AGENT_STORAGE.get(`skills/${skill.slug}/SKILL.md`)
      if (obj) skill_md = await obj.text()
    } catch {
      /* R2 read failure is non-fatal */
    }
  }

  return c.json({
    success: true,
    data: {
      ...skill,
      versions: versions.results ?? [],
      bindings: bindings.results ?? [],
      files: files.results ?? [],
      skill_md,
    },
  })
})

// PUT /skills/:id — update identity (display_name, scope; slug is immutable)
const updateSkillSchema = z.object({
  display_name: z.string().max(255).nullable().optional(),
  scope: z.enum(['personal', 'team', 'org', 'public']).optional(),
})

adminAiSkillsRoutes.put('/skills/:id', validator('json', updateSkillSchema), async (c) => {
  const id = c.req.param('id')
  const body = c.req.valid('json')

  const sets: string[] = []
  const values: unknown[] = []

  if (body.display_name !== undefined) {
    sets.push('display_name = ?')
    values.push(body.display_name)
  }
  if (body.scope !== undefined) {
    sets.push('scope = ?')
    values.push(body.scope)
  }

  if (sets.length === 0) return c.json({ success: false, error: 'NoChanges' }, 400)

  const result = await c.env.DB.prepare(`UPDATE skill SET ${sets.join(', ')} WHERE id = ?`)
    .bind(...values, id)
    .run()

  if (result.meta.changes === 0) return c.json({ success: false, error: 'NotFound' }, 404)
  return c.json({ success: true })
})

// POST /skills/:id/versions — publish new immutable version
const createVersionSchema = z.object({
  description: z.string().min(1).max(1024),
  body: z.string().optional(),
  allowed_tools: z.array(z.string()).optional().default([]),
  metadata: z.record(z.unknown()).optional(),
  skill_md: z.string().optional(),
})

adminAiSkillsRoutes.post(
  '/skills/:id/versions',
  validator('json', createVersionSchema),
  async (c) => {
    const skillId = c.req.param('id')
    const body = c.req.valid('json')

    const skill = await c.env.DB.prepare('SELECT slug FROM skill WHERE id = ?')
      .bind(skillId)
      .first<{ slug: string }>()
    if (!skill) return c.json({ success: false, error: 'NotFound' }, 404)

    const lastVersion = await c.env.DB.prepare(
      'SELECT MAX(version_number) AS max_ver FROM skill_version WHERE skill_id = ?'
    )
      .bind(skillId)
      .first<{ max_ver: number | null }>()
    const nextVersion = (lastVersion?.max_ver ?? 0) + 1

    const versionId = `skv_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`
    const skillBody = body.body ?? ''
    const contentHash = computeContentHash(body.description + skillBody)
    const tokenCount = estimateTokenCount(body.description + skillBody)

    await c.env.DB.batch([
      c.env.DB.prepare(
        `INSERT INTO skill_version (id, skill_id, version_number, name, description, body, allowed_tools, content_hash, status, token_count, metadata, published_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, ?, datetime('now'))`
      ).bind(
        versionId,
        skillId,
        nextVersion,
        skill.slug,
        body.description,
        skillBody,
        JSON.stringify(body.allowed_tools),
        contentHash,
        tokenCount,
        body.metadata ? JSON.stringify(body.metadata) : null
      ),
      c.env.DB.prepare('UPDATE skill SET latest_version_id = ? WHERE id = ?').bind(
        versionId,
        skillId
      ),
    ])

    if (body.skill_md) {
      await saveSkillContent(c.env.AGENT_STORAGE, skill.slug, body.skill_md)
    }

    return c.json({ success: true, data: { id: versionId, version_number: nextVersion } }, 201)
  }
)

// PUT /skills/:id/versions/:versionId/status — change version status
const updateStatusSchema = z.object({
  status: z.enum(['draft', 'published', 'deprecated']),
})

adminAiSkillsRoutes.put(
  '/skills/:id/versions/:versionId/status',
  validator('json', updateStatusSchema),
  async (c) => {
    const { status } = c.req.valid('json')
    const versionId = c.req.param('versionId')
    const skillId = c.req.param('id')

    const sets: string[] = ['status = ?']
    const values: unknown[] = [status]

    if (status === 'published') {
      sets.push("published_at = datetime('now')")
    }

    const result = await c.env.DB.prepare(
      `UPDATE skill_version SET ${sets.join(', ')} WHERE id = ? AND skill_id = ?`
    )
      .bind(...values, versionId, skillId)
      .run()

    if (result.meta.changes === 0) return c.json({ success: false, error: 'NotFound' }, 404)

    if (status === 'published') {
      await c.env.DB.prepare('UPDATE skill SET latest_version_id = ? WHERE id = ?')
        .bind(versionId, skillId)
        .run()
    }

    return c.json({ success: true })
  }
)

// PUT /skills/:id/binding — update binding (enable/disable, pin version)
const updateBindingSchema = z.object({
  enabled: z.number().int().min(0).max(1).optional(),
  pinned_version_id: z.string().nullable().optional(),
  subject_type: z.string().optional().default('agent'),
  subject_id: z.string().optional().default('default'),
})

adminAiSkillsRoutes.put(
  '/skills/:id/binding',
  validator('json', updateBindingSchema),
  async (c) => {
    const skillId = c.req.param('id')
    const body = c.req.valid('json')

    const sets: string[] = []
    const values: unknown[] = []

    if (body.enabled !== undefined) {
      sets.push('enabled = ?')
      values.push(body.enabled)
    }
    if (body.pinned_version_id !== undefined) {
      sets.push('pinned_version_id = ?')
      values.push(body.pinned_version_id)
    }

    if (sets.length === 0) return c.json({ success: false, error: 'NoChanges' }, 400)

    const result = await c.env.DB.prepare(
      `UPDATE skill_binding SET ${sets.join(', ')} WHERE skill_id = ? AND subject_type = ? AND subject_id = ?`
    )
      .bind(...values, skillId, body.subject_type, body.subject_id)
      .run()

    if (result.meta.changes === 0) {
      return c.json({ success: false, error: 'NotFound' }, 404)
    }
    return c.json({ success: true })
  }
)

// DELETE /skills/:id
adminAiSkillsRoutes.delete('/skills/:id', async (c) => {
  const id = c.req.param('id')
  const skill = await c.env.DB.prepare('SELECT slug, source FROM skill WHERE id = ?')
    .bind(id)
    .first<{ slug: string; source: string }>()

  if (!skill) return c.json({ success: false, error: 'NotFound' }, 404)
  if (skill.source === 'builtin') {
    return c.json(
      { success: false, error: 'CannotDeleteBuiltin', message: '無法刪除內建 skill' },
      400
    )
  }

  await c.env.DB.prepare('DELETE FROM skill WHERE id = ?').bind(id).run()

  try {
    await c.env.AGENT_STORAGE.delete(`skills/${skill.slug}/SKILL.md`)
  } catch {
    /* ignore */
  }

  return c.json({ success: true })
})

// POST /skills/import — import from SKILL.md content
const importSkillSchema = z.object({
  content: z.string().min(10),
})

adminAiSkillsRoutes.post('/skills/import', validator('json', importSkillSchema), async (c) => {
  const { content } = c.req.valid('json')
  const parsed = parseSkillMd(content)

  const name = (parsed.frontmatter.name as string) ?? ''
  const description = (parsed.frontmatter.description as string) ?? ''
  if (!name || !description) {
    return c.json(
      {
        success: false,
        error: 'InvalidSkillMd',
        message: 'SKILL.md 必須包含 name 和 description',
      },
      400
    )
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9-]/g, '-')
  const allowedTools = Array.isArray(parsed.frontmatter['allowed-tools'])
    ? parsed.frontmatter['allowed-tools']
    : []

  const skillId = `sk_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`
  const versionId = `skv_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`
  const bindingId = `sb_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`
  const contentHash = computeContentHash(content)
  const tokenCount = estimateTokenCount(content)

  await saveSkillContent(c.env.AGENT_STORAGE, slug, content)

  await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT OR IGNORE INTO skill (id, tenant_id, slug, display_name, scope, source, latest_version_id)
       VALUES (?, 'default', ?, ?, 'org', 'custom', ?)`
    ).bind(skillId, slug, (parsed.frontmatter.display_name as string) ?? name, versionId),
    c.env.DB.prepare(
      `INSERT INTO skill_version (id, skill_id, version_number, name, description, body, allowed_tools, content_hash, status, token_count, published_at)
       VALUES (?, ?, 1, ?, ?, ?, ?, ?, 'published', ?, datetime('now'))`
    ).bind(
      versionId,
      skillId,
      slug,
      description,
      parsed.body,
      JSON.stringify(allowedTools),
      contentHash,
      tokenCount
    ),
    c.env.DB.prepare(
      `INSERT OR IGNORE INTO skill_binding (id, tenant_id, subject_type, subject_id, skill_id, enabled)
       VALUES (?, 'default', 'agent', 'default', ?, 1)`
    ).bind(bindingId, skillId),
  ])

  return c.json({ success: true, data: { id: skillId, slug } }, 201)
})

// GET /skills/:id/export — export as SKILL.md
adminAiSkillsRoutes.get('/skills/:id/export', async (c) => {
  const id = c.req.param('id')
  const skill = await c.env.DB.prepare('SELECT slug FROM skill WHERE id = ?')
    .bind(id)
    .first<{ slug: string }>()

  if (!skill) return c.json({ success: false, error: 'NotFound' }, 404)

  const obj = await c.env.AGENT_STORAGE.get(`skills/${skill.slug}/SKILL.md`)
  if (!obj) return c.json({ success: false, error: 'NoContent' }, 404)

  const text = await obj.text()
  return new Response(text, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="${skill.slug}-SKILL.md"`,
    },
  })
})

// POST /skills/test-trigger — test which skills would match a query
const testTriggerSchema = z.object({
  query: z.string().min(1),
})

adminAiSkillsRoutes.post(
  '/skills/test-trigger',
  validator('json', testTriggerSchema),
  async (c) => {
    const { query } = c.req.valid('json')

    const { results } = await c.env.DB.prepare(
      `SELECT s.slug, sv.description
     FROM skill_binding sb
     JOIN skill s ON sb.skill_id = s.id
     JOIN skill_version sv ON sv.id = s.latest_version_id
     WHERE sb.subject_type = 'agent' AND sb.subject_id = 'default' AND sb.enabled = 1
       AND sv.status = 'published'`
    ).all()

    const skills = (results ?? []).map((r) => {
      const desc = r.description as string
      const triggerMatch = desc.match(/當使用者[^。]*?([^。]+)觸發/)
      const triggers = triggerMatch
        ? triggerMatch[1]
            .split(/[、，,]/)
            .map((t) => t.trim())
            .filter(Boolean)
        : []
      const matchedTriggers = triggers.filter((t) => query.includes(t))
      return {
        slug: r.slug as string,
        triggers,
        matched_triggers: matchedTriggers,
        matched: matchedTriggers.length > 0,
      }
    })

    return c.json({
      success: true,
      data: {
        query,
        matched: skills.filter((s) => s.matched),
        all: skills,
      },
    })
  }
)

// POST /skills/seed-r2 — upload builtin skill SKILL.md files to R2
adminAiSkillsRoutes.post('/skills/seed-r2', async (c) => {
  const BUILTIN_SKILLS: Record<string, string> = {
    search: `---
name: search
description: 搜尋攀岩路線和岩場（混合向量 + 全文檢索）。當使用者問路線、岩場、搜尋、找、有哪些、在哪、怎麼去時觸發。
allowed-tools:
  - search_routes
  - search_crags
---

# 搜尋路線與岩場

你可以搜尋台灣攀岩路線和岩場資料庫（混合向量 + 全文檢索），根據名稱、難度、類型、位置等條件查找。

## 搜尋策略
- 使用者提到岩場名稱 → search_crags
- 使用者提到路線、難度、類型 → search_routes
- 不確定 → 兩者都搜
`,
    weather: `---
name: weather
description: 查詢岩場天氣預報，判斷是否適合攀岩。當使用者問天氣、下雨、適合攀岩嗎時觸發。
allowed-tools:
  - weather
---

# 天氣查詢

查詢岩場天氣預報，幫助判斷是否適合出發攀岩。

## 判斷規則
- 降雨機率 > 60% → 不建議出發
- 溫度 < 5°C 或 > 35°C → 提醒注意
- 風速 > 30 km/h → 高處路線注意安全
`,
    data: `---
name: data
description: 結構化資料查詢與統計（路線數量、難度分佈、排名等）。當使用者問幾條、有多少、統計、排名、FA、影片時觸發。
allowed-tools:
  - sql_query
  - crag_info
---

# 資料查詢與統計

查詢攀岩資料庫的結構化資料：路線統計、難度分佈、岩場詳細資訊、首攀紀錄、影片等。
`,
    profile: `---
name: profile
description: 使用者個人攀登檔案與記錄。當使用者問我的、我爬過、我的記錄、完攀時觸發。需登入。
allowed-tools:
  - user_profile
---

# 個人攀登檔案

查詢使用者的攀岩歷史、能力等級、近期完攀記錄與偏好，用於個人化建議。
`,
    memory: `---
name: memory
description: 使用者記憶召回。當使用者說記得、之前說過、上次、我的偏好時觸發。需登入。
allowed-tools:
  - recall_memory
---

# 記憶召回

回想使用者過去分享的攀岩經歷、偏好和目標，讓對話更個人化。
`,
    goals: `---
name: goals
description: 攀岩目標設定與追蹤。當使用者說目標、挑戰、想要達到、進度時觸發。需登入。
allowed-tools:
  - manage_goals
---

# 目標追蹤

幫使用者設定攀岩目標（如挑戰某個難度、完攀特定路線），追蹤進度並在接近達成時提醒。
`,
    recommend: `---
name: recommend
description: 個人化路線推薦（根據攀登歷史和能力分析推薦下一條路線）。當使用者說推薦、建議、適合我、下一條時觸發。需登入。
allowed-tools:
  - recommend_agent
  - user_profile
references:
  - references/recommend-rules.md
---

# 路線推薦專家

你是 NobodyClimb 的攀岩路線推薦專家。根據使用者的攀登歷史，產生個人化的路線推薦。

@reference(references/recommend-rules.md)
`,
    coaching: `---
name: coaching
description: 訓練計畫建議（分析弱點、制定針對性訓練計畫）。當使用者說訓練、練習、怎麼進步、弱點、指力時觸發。需登入。
allowed-tools:
  - coaching_agent
  - user_profile
  - suggest_training
references:
  - references/coaching-framework.md
---

# 攀岩教練

你是 NobodyClimb 的攀岩教練。根據使用者的數據，進行系統化分析並提供訓練建議。

@reference(references/coaching-framework.md)
`,
  }

  const BUILTIN_REFERENCES: Record<string, Record<string, string>> = {
    coaching: {
      'references/coaching-framework.md': `# 教練分析框架

## 分析步驟
1. 【現況評估】根據攀登歷史數據，總結目前程度和攀登模式
2. 【弱點識別】基於分析結果指出 1-2 個關鍵弱點
3. 【目標對齊】如果使用者有設定目標，說明弱點如何影響目標達成
4. 【訓練計畫】針對弱點設計 2-3 週的漸進式訓練，每項要具體（頻率、強度、組數）
5. 【下一步行動】本週就能開始做的 1 件事

## 規則
- 分析基於 context 中的真實數據，不可捏造
- 訓練建議要具體（如「每週 2 次指板訓練，7:3 秒掛休比，3 組」）
- 根據程度調整強度（入門者不建議指板）
- 最多 3-4 條核心建議
- 使用繁體中文
- 可引用使用者近期完攀的路線作為依據
- 如果有使用者的攀岩人格型態和對應訓練學派，以該學派的訓練哲學為基底來設計建議
- 如果有訓練進度資料，根據已完成和未完成的部分調整建議重點
- 如果有 AI 微調計畫和訓練歷史模式，據此調整建議（例如用戶常跳過某天，建議簡化該天訓練）
`,
    },
    recommend: {
      'references/recommend-rules.md': `# 推薦規則

- 只推薦 context 中出現的路線，絕對不可捏造
- 路線名稱必須完整複製原文
- 每條路線用一段式描述：「⛰ 路線名稱，難度：X，類型：Y，岩場：Z。推薦理由。」
- 推薦理由要結合使用者的程度和偏好，不只是列出路線
- 若使用者有攀岩性格，可以提及「這條路線很適合你的 X 風格」
- 使用繁體中文
- 攀登類型術語：sport=運攀、trad=傳攀、boulder=抱石、mixed=混合攀登
`,
    },
  }

  let uploaded = 0
  let fileRecords = 0

  for (const [slug, content] of Object.entries(BUILTIN_SKILLS)) {
    await c.env.AGENT_STORAGE.put(`skills/${slug}/SKILL.md`, content, {
      httpMetadata: { contentType: 'text/markdown' },
    })
    uploaded++

    // Upload references
    const refs = BUILTIN_REFERENCES[slug]
    if (refs) {
      for (const [refPath, refContent] of Object.entries(refs)) {
        await c.env.AGENT_STORAGE.put(`skills/${slug}/${refPath}`, refContent, {
          httpMetadata: { contentType: 'text/markdown' },
        })

        // Record in skill_file table
        const skill = await c.env.DB.prepare(
          'SELECT id, latest_version_id FROM skill WHERE slug = ?'
        )
          .bind(slug)
          .first<{ id: string; latest_version_id: string | null }>()
        if (skill?.latest_version_id) {
          const blobKey = `skills/${slug}/${refPath}`
          await c.env.DB.prepare(
            `INSERT OR IGNORE INTO skill_file (id, version_id, path, blob_key, size_bytes, content_type)
             VALUES (?, ?, ?, ?, ?, 'text/markdown')`
          )
            .bind(
              crypto.randomUUID().replace(/-/g, '').slice(0, 24),
              skill.latest_version_id,
              refPath,
              blobKey,
              refContent.length
            )
            .run()
          fileRecords++
        }
      }
    }

    // Also update skill_version body with the SKILL.md body (for DB-level fallback)
    const parsed = parseSkillMd(content)
    const skill = await c.env.DB.prepare('SELECT latest_version_id FROM skill WHERE slug = ?')
      .bind(slug)
      .first<{ latest_version_id: string | null }>()
    if (skill?.latest_version_id) {
      const tokenCount = estimateTokenCount(content)
      const hash = computeContentHash(content)
      await c.env.DB.prepare(
        'UPDATE skill_version SET body = ?, token_count = ?, content_hash = ? WHERE id = ?'
      )
        .bind(parsed.body, tokenCount, hash, skill.latest_version_id)
        .run()
    }
  }

  return c.json({
    success: true,
    data: { skills_uploaded: uploaded, reference_files: fileRecords },
  })
})

// GET /skills/:id/invocations — invocation history
adminAiSkillsRoutes.get('/skills/:id/invocations', async (c) => {
  const skillId = c.req.param('id')
  const limit = Math.min(parseInt(c.req.query('limit') ?? '50', 10), 200)

  const { results } = await c.env.DB.prepare(
    `SELECT si.* FROM skill_invocation si
     JOIN skill_version sv ON si.version_id = sv.id
     WHERE sv.skill_id = ?
     ORDER BY si.triggered_at DESC LIMIT ?`
  )
    .bind(skillId, limit)
    .all()

  const stats = await c.env.DB.prepare(
    `SELECT
      si.outcome, COUNT(*) as count
     FROM skill_invocation si
     JOIN skill_version sv ON si.version_id = sv.id
     WHERE sv.skill_id = ?
     GROUP BY si.outcome`
  )
    .bind(skillId)
    .all()

  return c.json({
    success: true,
    data: {
      invocations: results ?? [],
      stats: stats.results ?? [],
    },
  })
})
