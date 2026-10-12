#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { loadArticle, syncStatements, validateSourcePath } from './article-lib.mjs'

try {
  const [command, source, ...extra] = process.argv.slice(2)
  if (command !== 'check' || !source || extra.length)
    throw new Error('用法：article.mjs check <article.md>')
  const path = resolve(source)
  const article = loadArticle(readFileSync(path, 'utf8'), path)
  validateSourcePath(path, article.meta.id)
  syncStatements(article)
  process.stdout.write(
    `機械檢查通過；source-sha256 ${article.hash}；尚需事實、連結可用性及本地資料庫驗證\n`
  )
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
