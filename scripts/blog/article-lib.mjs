import { createHash, randomBytes } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, realpathSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { marked } from 'marked'
import { parseDocument } from 'yaml'

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
export const newId = () => randomBytes(16).toString('hex')
const fail = (message) => {
  throw new Error(message)
}
export const baselineFields = [
  'id',
  'author_id',
  'slug',
  'title',
  'excerpt',
  'content',
  'cover_image',
  'category',
  'status',
  'is_featured',
  'published_at',
  'updated_at',
]
const fields = baselineFields
const editable = ['title', 'excerpt', 'content', 'cover_image', 'category', 'status', 'is_featured']
export const sqlValue = (value) =>
  value === null
    ? 'NULL'
    : typeof value === 'number'
      ? String(value)
      : `'${value.replaceAll("'", "''")}'`
function url(value) {
  if (typeof value !== 'string' || !value || /[\s\u0000-\u001f\u007f\\]/u.test(value))
    fail(`無效 URL：${value}`)
  if (value.startsWith('#')) fail('本站不保留標題 id，不支援頁內錨點連結')
  if (/^\/(?!\/)/.test(value)) return
  let parsed
  try {
    parsed = new URL(value)
  } catch {
    fail(`無效 URL：${value}`)
  }
  if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password)
    fail(`不安全 URL：${value}`)
  if (/^(example\.(com|org|net)|localhost)$/i.test(parsed.hostname)) fail('不得保留範例 URL')
}
export function validateBaseline(baseline) {
  if (!baseline || typeof baseline !== 'object' || Array.isArray(baseline))
    fail('baseline 必須為物件')
  if (
    Object.keys(baseline).some((key) => ![...fields, 'tags'].includes(key)) ||
    fields.some((key) => !(key in baseline))
  )
    fail('baseline 只接受完整 posts 必要欄位與 tags')
  for (const key of fields)
    if (
      key === 'is_featured'
        ? ![0, 1].includes(baseline[key])
        : !(
            ['excerpt', 'cover_image', 'category', 'published_at', 'updated_at'].includes(key) &&
            baseline[key] === null
          ) && typeof baseline[key] !== 'string'
    )
      fail(`baseline ${key} 型別無效`)
  if (
    !Array.isArray(baseline.tags) ||
    baseline.tags.some((tag) => typeof tag !== 'string') ||
    new Set(baseline.tags).size !== baseline.tags.length
  )
    fail('baseline tags 無效')
  return baseline
}
export function loadArticle(source, sourcePath) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]+)$/)
  if (!match) fail('需要 YAML frontmatter 與正文')
  const doc = parseDocument(match[1], { schema: 'core', uniqueKeys: true })
  if (doc.errors.length) fail(doc.errors.map((error) => error.message).join('\n'))
  const meta = doc.toJS({ maxAliasCount: 0 })
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) fail('metadata 必須為物件')
  const allowed = [
    'id',
    'slug',
    'title',
    'excerpt',
    'category',
    'tags',
    'cover_image',
    'status',
    'is_featured',
    'author_username',
    'operation',
    'baseline',
    'lang',
    'translation_group',
    'translations',
  ]
  for (const key of Object.keys(meta)) if (!allowed.includes(key)) fail(`未知 metadata：${key}`)
  for (const key of allowed.filter((key) => key !== 'baseline'))
    if (!(key in meta)) fail(`缺少 metadata：${key}`)
  for (const key of ['id', 'slug', 'title', 'excerpt', 'category'])
    if (typeof meta[key] !== 'string' || !meta[key].trim() || meta[key] !== meta[key].trim())
      fail(`無效 ${key}`)
  if (!['create', 'update'].includes(meta.operation)) fail('operation 必須 create/update')
  if (
    !(
      meta.operation === 'create' ? /^[a-f0-9]{32}$/ : /^(?:[a-f0-9]{32}|post_[a-zA-Z0-9_-]+)$/
    ).test(meta.id)
  )
    fail('id 必須使用 32 位 crypto hex；update 可保留 legacy post_ ID')
  const languages = ['zh', 'en', 'ja']
  const validTranslationId = (value) =>
    typeof value === 'string' && /^(?:[a-f0-9]{32}|post_[a-zA-Z0-9_-]+)$/.test(value)
  if (!languages.includes(meta.lang)) fail('lang 必須為 zh/en/ja')
  if (
    !meta.translations ||
    typeof meta.translations !== 'object' ||
    Array.isArray(meta.translations) ||
    Object.keys(meta.translations).length !== 3 ||
    languages.some((lang) => !validTranslationId(meta.translations[lang])) ||
    new Set(Object.values(meta.translations)).size !== 3
  )
    fail('translations 必須完整列出 zh/en/ja，且 ID 各自唯一')
  if (meta.translation_group !== meta.translations.zh || meta.id !== meta.translations[meta.lang])
    fail('translation_group 必須為中文 ID；目前 ID 必須對應 translations[lang]')
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(meta.slug)) fail('slug 必須為小寫 kebab-case')
  const categories = readFileSync(resolve(root, 'packages/types/src/content.ts'), 'utf8')
    .match(/export type PostCategory =([\s\S]*?)\/\*\*/)[1]
    .match(/'[^']+'/g)
    .map((item) => item.slice(1, -1))
  if (!categories.includes(meta.category)) fail('category 不在共用 PostCategory')
  if (
    meta.author_username !== 'nobodyclimb' ||
    meta.status !== 'published' ||
    ![0, 1].includes(meta.is_featured)
  )
    fail('作者/status/is_featured 無效')
  if (
    !Array.isArray(meta.tags) ||
    !meta.tags.length ||
    meta.tags.some((tag) => typeof tag !== 'string' || !tag.trim() || tag !== tag.trim()) ||
    new Set(meta.tags).size !== meta.tags.length
  )
    fail('tags 必須為不重複非空字串陣列')
  if (meta.cover_image !== null) url(meta.cover_image)
  if (
    Object.values(meta)
      .flat()
      .some((value) => typeof value === 'string' && /[\u0000-\u001f\u007f]/u.test(value))
  )
    fail('metadata 不得包含控制字元')
  if (/\b(?:TODO|TBD|FIXME)\b|待補|待查證|填寫此處/u.test(source)) fail('不得保留 placeholder')
  const tokens = marked.lexer(match[2])
  let depth = 1
  let sourceLinks = 0
  marked.walkTokens(tokens, (token) => {
    if (token.type === 'html' || token.type === 'hr' || token.type === 'del')
      fail(`本站不支援 ${token.type}`)
    if (token.type === 'code' && /^(mermaid|youtube|iframe)\b/i.test(token.lang || ''))
      fail('不支援特殊 fence')
    if (token.type === 'list' && token.items.some((item) => item.task)) fail('不支援 task list')
    if (token.type === 'heading') {
      if (token.depth < 2 || token.depth > depth + 1 || !token.text.trim())
        fail('正文標題從 h2 開始且不得跳級')
      depth = token.depth
    }
    if (['link', 'image'].includes(token.type)) {
      url(token.href)
      if (!token.text.trim()) fail('連結文字／圖片 alt 不得為空')
      if (token.type === 'link' && /^https?:/.test(token.href)) sourceLinks++
    }
  })
  if (!sourceLinks) fail('正文必須包含外部來源連結；機械檢查不代表事實驗證')
  const html = marked.parser(tokens, { async: false })
  let baseline = null
  if (meta.operation === 'update') {
    if (typeof meta.baseline !== 'string' || !sourcePath)
      fail('update 必須提供 baseline JSON 相對路徑')
    const basePath = resolve(dirname(sourcePath), meta.baseline)
    if (relative(resolve(root, 'backend/content/blog'), realpathSync(basePath)).startsWith('..'))
      fail('baseline 必須位於 backend/content/blog')
    baseline = JSON.parse(readFileSync(basePath, 'utf8'))
    validateBaseline(baseline)
    if (baseline.id !== meta.id || baseline.slug !== meta.slug) fail('update 不得更改 id/slug')
    const values = { ...meta, content: html }
    if (
      editable.every((key) => baseline[key] === values[key]) &&
      baseline.tags.length === meta.tags.length &&
      baseline.tags.every((tag) => meta.tags.includes(tag))
    )
      fail('update 沒有讀者可見變更；不得只刷新 updated_at')
  } else if ('baseline' in meta) fail('create 不得提供 baseline')
  return { meta, html, baseline, hash: createHash('sha256').update(source).digest('hex') }
}
// 品牌帳號以 users.id 對應；各環境的 username 不保證與原稿別名相同。
export const brandAuthorIds = { nobodyclimb: '5f9aa93810d7b05267c9e56fab68593b' }
// D1 單一 statement 上限為 100,000 bytes。
const statementLimit = 100000
// 可重複執行：新文章新增；既有文章只在內容不同時更新，保留 slug、首次發表日期與互動數。
// lang 只影響列表篩選，單獨補上時不刷新 updated_at。
export function syncStatements({ meta, html }) {
  const q = sqlValue
  const authorId = brandAuthorIds[meta.author_username]
  if (!authorId) fail(`${meta.id}：未知作者別名 ${meta.author_username}`)
  const values = { ...meta, content: html }
  const changed = editable.map((key) => `posts.${key} IS NOT excluded.${key}`).join(' OR ')
  const statements = [
    `INSERT INTO posts (id, author_id, slug, ${editable.join(', ')}, lang, published_at, created_at, updated_at) VALUES (${q(meta.id)}, (SELECT id FROM users WHERE id = ${q(authorId)} AND is_active = 1), ${q(meta.slug)}, ${editable.map((key) => q(values[key])).join(', ')}, ${q(meta.lang)}, datetime('now'), datetime('now'), datetime('now')) ON CONFLICT(id) DO UPDATE SET updated_at = CASE WHEN ${changed} OR posts.published_at IS NULL THEN datetime('now') ELSE posts.updated_at END, ${editable.map((key) => `${key} = excluded.${key}`).join(', ')}, lang = excluded.lang, published_at = COALESCE(posts.published_at, excluded.published_at) WHERE ${changed} OR posts.lang IS NOT excluded.lang OR posts.published_at IS NULL;`,
    `DELETE FROM post_tags WHERE post_id = ${q(meta.id)} AND tag NOT IN (${meta.tags.map(q).join(', ')});`,
    `INSERT OR IGNORE INTO post_tags (post_id, tag) VALUES ${meta.tags.map((tag) => `(${q(meta.id)}, ${q(tag)})`).join(', ')};`,
  ]
  for (const statement of statements)
    if (Buffer.byteLength(statement) > statementLimit)
      fail(`${meta.id}：單一 SQL statement 超過 D1 的 ${statementLimit} bytes 上限`)
  return statements
}
export function syncSql(articles) {
  const ids = articles.map(({ meta }) => meta.id)
  const slugs = articles.map(({ meta }) => meta.slug)
  if (new Set(ids).size !== ids.length || new Set(slugs).size !== slugs.length)
    fail('原稿 id 或 slug 重複')
  return [
    '-- 自動生成，不納入版控；請修改 Markdown 原稿後重新同步。',
    ...articles.flatMap((article) => [
      `-- blog-source: backend/content/blog/${article.meta.id}.md (${article.hash})`,
      ...syncStatements(article),
    ]),
    '',
  ].join('\n')
}
export function listSources(workspaceRoot = root) {
  const directory = resolve(workspaceRoot, 'backend/content/blog')
  return existsSync(directory)
    ? readdirSync(directory)
        .filter((name) => name.endsWith('.md') && !name.endsWith('.review.md'))
        .sort()
        .map((name) => resolve(directory, name))
    : []
}
export function loadSources() {
  return listSources().map((path) => {
    const article = loadArticle(readFileSync(path, 'utf8'), path)
    validateSourcePath(path, article.meta.id)
    return article
  })
}
export function validateSourcePath(path, id) {
  if (
    resolve(path) !== resolve(root, 'backend/content/blog', `${id}.md`) ||
    realpathSync(path) !== resolve(root, 'backend/content/blog', `${id}.md`)
  )
    fail('原稿必須為 backend/content/blog/<id>.md，不接受 symlink 或其他位置')
}
