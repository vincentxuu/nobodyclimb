#!/usr/bin/env node
import { readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { baselineFields, brandAuthorIds, root, validateBaseline } from './article-lib.mjs'

export function captureBaseline(response) {
  if (response?.success !== true || !response.data || typeof response.data !== 'object')
    throw new Error('必須為 success=true 的公開文章 API 回應')
  const post = response.data
  if (post.author_id !== brandAuthorIds.nobodyclimb)
    throw new Error('公開回應的 author_id 必須為 NobodyClimb 品牌帳號')
  const baseline = Object.fromEntries([...baselineFields, 'tags'].map((key) => [key, post[key]]))
  validateBaseline(baseline)
  if (
    !/^(?:[a-f0-9]{32}|post_[a-zA-Z0-9_-]+)$/.test(baseline.id) ||
    !baseline.author_id ||
    !baseline.content.trim()
  )
    throw new Error('公開回應必須提供真實 id/author_id 與完整正文')
  return baseline
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [input, option, output, ...extra] = process.argv.slice(2)
    if (!input || option !== '--output' || !output || extra.length)
      throw new Error(
        '用法：capture-baseline.mjs <saved-public-api-response.json> --output backend/content/blog/<id>[suffix].baseline.json'
      )
    const baseline = captureBaseline(JSON.parse(readFileSync(resolve(input), 'utf8')))
    const target = resolve(output)
    const directory = resolve(root, 'backend/content/blog')
    if (
      dirname(target) !== directory ||
      realpathSync(dirname(target)) !== directory ||
      !basename(target).startsWith(baseline.id) ||
      !/^(?:[a-f0-9]{32}|post_[a-zA-Z0-9_-]+)(?:[._-][a-zA-Z0-9_-]+)?\.baseline\.json$/.test(
        basename(target)
      )
    )
      throw new Error('output 必須為 backend/content/blog/<id>[suffix].baseline.json')
    writeFileSync(target, `${JSON.stringify(baseline, null, 2)}\n`, { flag: 'wx' })
    process.stdout.write(`已保存 ${output}；僅含文章 baseline 與 tags，沒有 users 私人欄位。\n`)
  } catch (error) {
    process.stderr.write(`${error.message}\n`)
    process.exitCode = 1
  }
}
