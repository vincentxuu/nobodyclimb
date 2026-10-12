#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseDocument } from 'yaml'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const target = 'apps/web/src/lib/data/blog-translations.json'

// 只納入完整的三語文章組；完整文章品質由 blog:check 驗證。
export function buildTranslationManifest(workspaceRoot) {
  const directory = join(workspaceRoot, 'backend/content/blog')
  const records = []
  if (existsSync(directory)) {
    for (const name of readdirSync(directory).sort()) {
      if (!name.endsWith('.md') || name.endsWith('.review.md')) continue
      const source = readFileSync(join(directory, name), 'utf8')
      const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/)
      if (!match) throw new Error(`${name}：缺少 frontmatter`)
      const doc = parseDocument(match[1], { schema: 'core', uniqueKeys: true })
      if (doc.errors.length) throw new Error(`${name}：無效 frontmatter`)
      const meta = doc.toJS({ maxAliasCount: 0 })
      if (!meta || !['zh', 'en', 'ja'].includes(meta.lang) || meta.status !== 'published')
        throw new Error(`${name}：無效文章語系或狀態`)
      if (name !== `${meta.id}.md`) throw new Error(`${name}：文章 ID 與檔名不一致`)
      records.push(meta)
    }
  }
  const articles = {}
  for (const meta of records) {
    const ids = meta.translations
    if (
      !ids ||
      Object.keys(ids).sort().join(',') !== 'en,ja,zh' ||
      new Set(Object.values(ids)).size !== 3 ||
      meta.translation_group !== ids.zh ||
      ids[meta.lang] !== meta.id
    )
      throw new Error(`${meta.id}：無效三語對照`)
    for (const lang of ['zh', 'en', 'ja']) {
      if (
        typeof ids[lang] !== 'string' ||
        !/^(?:[a-f0-9]{32}|post_[a-zA-Z0-9_-]+)$/.test(ids[lang])
      )
        throw new Error(`${meta.id}：無效翻譯 ID`)
      const sibling = records.find((entry) => entry.id === ids[lang] && entry.lang === lang)
      if (
        !sibling ||
        sibling.translation_group !== meta.translation_group ||
        ['zh', 'en', 'ja'].some((key) => sibling.translations?.[key] !== ids[key])
      )
        throw new Error(`${meta.id}：三語文章不完整或對照不一致`)
    }
    articles[meta.id] = { lang: meta.lang, translations: { zh: ids.zh, en: ids.en, ja: ids.ja } }
  }
  return { schema_version: 1, articles }
}

export function checkTranslationManifest(workspaceRoot = root) {
  const expected = `${JSON.stringify(buildTranslationManifest(workspaceRoot), null, 2)}\n`
  const path = join(workspaceRoot, target)
  if (!existsSync(path) || readFileSync(path, 'utf8') !== expected)
    throw new Error(
      '三語 SEO manifest 過期；執行 node scripts/blog/translation-manifest.mjs --write'
    )
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv[2] === '--write') {
      const path = join(root, target)
      mkdirSync(dirname(path), { recursive: true })
      writeFileSync(path, `${JSON.stringify(buildTranslationManifest(root), null, 2)}\n`)
      process.stdout.write('已更新三語 SEO manifest\n')
    } else if (!process.argv[2] || process.argv[2] === '--check') {
      checkTranslationManifest()
      process.stdout.write('三語 SEO manifest 一致\n')
    } else throw new Error('用法：translation-manifest.mjs [--write|--check]')
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
