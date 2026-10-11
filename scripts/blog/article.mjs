#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { loadArticle, migration, validateOutput, validateSourcePath } from './article-lib.mjs'

try {
  const [command, source, ...args] = process.argv.slice(2)
  if (!['check', 'generate'].includes(command) || !source)
    throw new Error(
      '用法：article.mjs check <article.md> [--migration path] | generate <article.md> --output backend/migrations/NNNN_name.sql'
    )
  const option = command === 'check' ? '--migration' : '--output'
  if (
    (args.length !== 0 && args.length !== 2) ||
    (args.length && args[0] !== option) ||
    (command === 'generate' && args.length !== 2)
  )
    throw new Error('無效參數')
  const path = resolve(source)
  const article = loadArticle(readFileSync(path, 'utf8'), path)
  validateSourcePath(path, article.meta.id)
  const sql = migration(article)
  if (command === 'generate') {
    const output = resolve(args[1])
    validateOutput(output)
    writeFileSync(output, sql, { flag: 'wx' })
    process.stdout.write(`已產生 ${args[1]}；source-sha256 ${article.hash}\n`)
  } else {
    if (args.length && readFileSync(resolve(args[1]), 'utf8') !== sql)
      throw new Error('migration 與目前原稿不一致，請生成新的 migration')
    process.stdout.write(
      `機械檢查通過；source-sha256 ${article.hash}；尚需事實、連結可用性及本地資料庫驗證\n`
    )
  }
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
