#!/usr/bin/env node
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { loadSources, syncSql } from './article-lib.mjs'

// 只產生 SQL；是否對遠端 D1 執行由部署 workflow 決定。
try {
  const [option, output, ...extra] = process.argv.slice(2)
  if (option !== '--output' || !output || extra.length)
    throw new Error('用法：sync.mjs --output <sync.sql>')
  const articles = loadSources()
  if (articles.length) writeFileSync(resolve(output), syncSql(articles))
  process.stdout.write(
    articles.length
      ? `已產生 ${articles.length} 篇文章的同步 SQL：${output}\n`
      : '沒有文章原稿，未產生同步 SQL。\n'
  )
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
