#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { marked } from 'marked'
import { parseDocument } from 'yaml'
import { checkTranslationManifest } from './translation-manifest.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const fail = (message) => {
  throw new Error(message)
}
const nonempty = (value) => typeof value === 'string' && Boolean(value.trim())
const timestamp = (value) =>
  nonempty(value) && /T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value))
const publicUrl = (value) => {
  try {
    const parsed = new URL(value)
    return ['https:', 'http:'].includes(parsed.protocol) && !parsed.username && !parsed.password
  } catch {
    return false
  }
}

export const contentHash = (content) => createHash('sha256').update(content).digest('hex')
const hash = (value) => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)

// 僅驗證證據紀錄的結構；來源是否支持主張仍由 verify-blog 判斷。
export function checkEvidence(
  evidence,
  id,
  mediaUrls = [],
  sourceHash,
  externalUrls = [],
  sourceText
) {
  if (
    !evidence ||
    evidence.schema_version !== 1 ||
    evidence.article_id !== id ||
    !timestamp(evidence.checked_at) ||
    !hash(evidence.source_sha256)
  )
    fail(`${id}：來源台帳版本、article_id 或 checked_at 無效`)
  if (sourceHash && evidence.source_sha256 !== sourceHash)
    fail(`${id}：來源台帳 source_sha256 過期，請重新查證原稿`)
  if (!Array.isArray(evidence.claims) || !evidence.claims.length || !Array.isArray(evidence.media))
    fail(`${id}：claims 必須非空，media 必須為陣列`)
  for (const claim of evidence.claims) {
    if (
      !nonempty(claim.location) ||
      !nonempty(claim.claim) ||
      !nonempty(claim.reason) ||
      !['confirmed', 'outdated', 'contradicted', 'unverifiable', 'misframed'].includes(
        claim.verdict
      ) ||
      !Array.isArray(claim.sources)
    )
      fail(`${id}：claim 紀錄不完整`)
    if (['outdated', 'contradicted', 'misframed'].includes(claim.verdict))
      fail(`${id}：claim ${claim.verdict} 尚未修正`)
    if (
      claim.verdict === 'unverifiable' &&
      (claim.disposition !== 'qualified' ||
        !nonempty(claim.qualification) ||
        typeof sourceText !== 'string' ||
        !sourceText.includes(claim.qualification))
    )
      fail(`${id}：unverifiable 必須在原稿明示 qualification`)
    if (claim.verdict === 'confirmed' && !claim.sources.length) fail(`${id}：confirmed 缺來源`)
    for (const source of claim.sources) {
      if (
        !publicUrl(source.url) ||
        !nonempty(source.title) ||
        !nonempty(source.publisher) ||
        !(
          source.source_date === null ||
          (nonempty(source.source_date) && Number.isFinite(Date.parse(source.source_date)))
        ) ||
        !timestamp(source.accessed_at) ||
        !['full', 'partial', 'summary'].includes(source.read_scope) ||
        !nonempty(source.evidence) ||
        !nonempty(source.tool)
      )
        fail(`${id}：source 紀錄不完整`)
    }
    if (
      claim.verdict === 'confirmed' &&
      claim.sources.every((source) => source.read_scope === 'summary')
    )
      fail(`${id}：搜尋摘要不能作 confirmed 證據`)
  }
  if (!Array.isArray(evidence.links)) fail(`${id}：links 必須為陣列`)
  const requiredUrls = new Set([
    ...externalUrls,
    ...evidence.claims.flatMap((claim) => claim.sources.map((source) => source.url)),
    ...evidence.media.map((media) => media.source_url),
  ])
  const linkUrls = new Set()
  for (const link of evidence.links) {
    if (
      !link ||
      !publicUrl(link.url) ||
      !timestamp(link.checked_at) ||
      !nonempty(link.tool) ||
      !['reachable', 'broken', 'uncertain'].includes(link.status) ||
      !nonempty(link.reason) ||
      !(
        link.status_code === null ||
        (Number.isInteger(link.status_code) && link.status_code >= 100 && link.status_code <= 599)
      )
    )
      fail(`${id}：link 查核紀錄不完整`)
    if (linkUrls.has(link.url)) fail(`${id}：link URL 重複`)
    linkUrls.add(link.url)
    if (link.status !== 'reachable')
      fail(`${id}：link ${link.status}，需修復或重新確認 ${link.url}`)
    if (link.status_code !== null && (link.status_code < 200 || link.status_code >= 400))
      fail(`${id}：reachable 與 HTTP 狀態矛盾`)
  }
  for (const url of requiredUrls) if (!linkUrls.has(url)) fail(`${id}：外部連結缺少查核紀錄 ${url}`)
  for (const media of evidence.media) {
    if (
      !nonempty(media.url) ||
      !nonempty(media.purpose) ||
      typeof media.alt !== 'string' ||
      !publicUrl(media.source_url) ||
      !nonempty(media.usage_basis)
    )
      fail(`${id}：媒體來源與使用依據不完整`)
  }
  for (const url of mediaUrls)
    if (!evidence.media.some((media) => media.url === url))
      fail(`${id}：圖片 ${url} 缺少來源與使用依據`)
}

// 審查宣告綁定精確位元組；CI 無法證明 reviewer 實際讀過來源或翻譯品質。
export function checkReview(review, id, sourceHash, evidenceHash) {
  if (
    !review ||
    review.schema_version !== 1 ||
    review.article_id !== id ||
    !timestamp(review.reviewed_at) ||
    !nonempty(review.reviewer)
  )
    fail(`${id}：review 身分或日期不完整`)
  if (!hash(review.source_sha256) || review.source_sha256 !== sourceHash)
    fail(`${id}：review source_sha256 過期`)
  if (!hash(review.evidence_sha256) || review.evidence_sha256 !== evidenceHash)
    fail(`${id}：review evidence_sha256 過期`)
  if (review.decision !== 'approved') fail(`${id}：review 未 approved`)
  for (const name of ['factual', 'translation', 'editorial']) {
    const section = review.sections?.[name]
    if (!section || section.passed !== true || !nonempty(section.notes))
      fail(`${id}：review ${name} 未完成或未通過`)
  }
  if (!Array.isArray(review.findings)) fail(`${id}：review findings 必須為陣列`)
  for (const finding of review.findings) {
    if (
      !finding ||
      !['blocking', 'advisory'].includes(finding.severity) ||
      typeof finding.resolved !== 'boolean' ||
      !nonempty(finding.notes)
    )
      fail(`${id}：review finding 不完整`)
    if (finding.severity === 'blocking' && !finding.resolved) fail(`${id}：review 尚有未解必修問題`)
  }
}

// 確認三語有共同身分與可到達的互連；翻譯語意與事實須由人工審稿。
export function checkTranslations(records) {
  const groups = new Map()
  for (const record of records) {
    const { meta } = record
    if (
      !['zh', 'en', 'ja'].includes(meta.lang) ||
      !nonempty(meta.translation_group) ||
      !meta.translations ||
      Object.keys(meta.translations).sort().join(',') !== 'en,ja,zh' ||
      Object.values(meta.translations).some((id) => !nonempty(id)) ||
      new Set(Object.values(meta.translations)).size !== 3 ||
      meta.translations[meta.lang] !== meta.id ||
      meta.translation_group !== meta.translations.zh
    )
      fail(`${meta.id}：多語 metadata 不完整`)
    if (!groups.has(meta.translation_group)) groups.set(meta.translation_group, [])
    groups.get(meta.translation_group).push(record)
  }
  for (const [group, siblings] of groups) {
    if (
      siblings.length !== 3 ||
      siblings
        .map(({ meta }) => meta.lang)
        .sort()
        .join(',') !== 'en,ja,zh'
    )
      fail(`${group}：必須一起提供 zh/en/ja 三篇`)
    const reference = siblings.find(({ meta }) => meta.lang === 'zh').meta
    for (const { meta, body } of siblings) {
      for (const field of [
        'translation_group',
        'category',
        'tags',
        'cover_image',
        'status',
        'is_featured',
        'author_username',
      ])
        if (JSON.stringify(meta[field]) !== JSON.stringify(reference[field]))
          fail(`${group}：${field} 三語不一致`)
      for (const lang of ['zh', 'en', 'ja']) {
        if (meta.translations[lang] !== reference.translations[lang])
          fail(`${group}：translations 三語不一致`)
        const sibling = siblings.find((entry) => entry.meta.lang === lang)
        if (sibling.meta.id !== meta.translations[lang]) fail(`${group}：翻譯 ID 對應錯誤`)
      }
      const links = new Set()
      marked.walkTokens(marked.lexer(body), (token) => {
        if (token.type === 'link') links.add(token.href)
      })
      for (const lang of ['zh', 'en', 'ja'].filter((lang) => lang !== meta.lang)) {
        const expected = `${lang === 'zh' ? '' : `/${lang}`}/blog/${meta.translations[lang]}`
        if (!links.has(expected)) fail(`${meta.id}：缺少翻譯連結 ${expected}`)
      }
    }
  }
}

export function discoverPublicationPairs(workspaceRoot) {
  const content = join(workspaceRoot, 'backend/content/blog')
  const migrations = join(workspaceRoot, 'backend/migrations')
  const drafts = existsSync(content)
    ? readdirSync(content)
        .filter((name) => name.endsWith('.md') && !name.endsWith('.review.md'))
        .sort()
    : []
  const latest = new Map()
  const migrationNames = readdirSync(migrations)
    .filter((name) => /^\d{4}_.*\.sql$/.test(name))
    .sort()
  for (const name of migrationNames) {
    const path = join(migrations, name)
    const sql = readFileSync(path, 'utf8')
    const headers = [...sql.matchAll(/^-- blog-source: (.+)$/gm)]
    if (
      headers.length &&
      migrationNames.filter((other) => other.slice(0, 4) === name.slice(0, 4)).length !== 1
    )
      fail(`${name}：文章 migration 編號重複，請重新編號`)
    for (const [, source] of headers) {
      if (!/^backend\/content\/blog\/[a-zA-Z0-9_-]+\.md$/.test(source))
        fail(`無效 blog-source：${name}`)
      if (!existsSync(join(workspaceRoot, source))) fail(`${name}：原稿不存在 ${source}`)
      latest.set(basename(source), path)
    }
  }
  return drafts.map((name) => {
    if (!latest.has(name)) fail(`${name}：缺少生成的 publication migration`)
    return { source: join(content, name), migration: latest.get(name) }
  })
}

export function checkAll(workspaceRoot = root) {
  const pairs = discoverPublicationPairs(workspaceRoot)
  const translations = []
  for (const { source, migration } of pairs) {
    const id = basename(source, '.md')
    const stem = source.slice(0, -3)
    const sourceBytes = readFileSync(source)
    const sourceHash = contentHash(sourceBytes)
    const evidenceBytes = readFileSync(`${stem}.sources.json`)
    const evidence = JSON.parse(evidenceBytes.toString('utf8'))
    checkEvidence(evidence, id, [], sourceHash, [], sourceBytes.toString('utf8'))
    const approval = JSON.parse(readFileSync(`${stem}.review.json`, 'utf8'))
    checkReview(approval, id, sourceHash, contentHash(evidenceBytes))
    const review = readFileSync(`${stem}.review.md`, 'utf8')
    for (const heading of ['機械檢查', '事實查證', '內容與語氣', '未驗範圍'])
      if (!new RegExp(`^## ${heading}\\s*$`, 'm').test(review))
        fail(`${id}：review 缺少 ${heading}`)
    if (/\b(?:TODO|TBD|FIXME)\b|待填|填寫此處|\{\{/.test(review))
      fail(`${id}：review 仍有 placeholder`)
    const match = sourceBytes.toString('utf8').match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]+)$/)
    if (!match) fail(`${id}：缺 frontmatter 或正文`)
    const document = parseDocument(match[1], { schema: 'core', uniqueKeys: true })
    if (document.errors.length) fail(`${id}：無效 YAML`)
    const meta = document.toJS({ maxAliasCount: 0 })
    const mediaUrls = meta.cover_image ? [meta.cover_image] : []
    const externalUrls = []
    marked.walkTokens(marked.lexer(match[2]), (token) => {
      if (token.type === 'image') mediaUrls.push(token.href)
      if (token.type === 'link' && publicUrl(token.href)) externalUrls.push(token.href)
    })
    checkEvidence(evidence, id, mediaUrls, sourceHash, externalUrls, sourceBytes.toString('utf8'))
    translations.push({ meta, body: match[2] })
    const result = spawnSync(
      process.execPath,
      [join(root, 'scripts/blog/article.mjs'), 'check', source, '--migration', migration],
      { cwd: workspaceRoot, encoding: 'utf8' }
    )
    if (result.error || result.status !== 0)
      fail(`${id}：${result.error?.message || result.stderr || result.stdout}`)
  }
  checkTranslations(translations)
  checkTranslationManifest(workspaceRoot)
  return pairs.length
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const count = checkAll()
    process.stdout.write(
      `Blog Content：${count} 篇原稿、來源台帳、綁定原稿/台帳的審稿核准與最新 migration 一致性檢查通過。事實與公開頁需另驗。\n`
    )
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
