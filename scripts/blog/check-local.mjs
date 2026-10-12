#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { root } from './article-lib.mjs'

const managedSource = (sql) =>
  /^-- blog-source: (backend\/content\/blog\/[A-Za-z0-9_-]+\.md)$/m.exec(sql)?.[1]

// 已入庫 migration 不可重寫；更新文章必須新增 migration。
export function selectMigrations(changes, readCurrent, readBase) {
  const selected = []
  const sources = new Set()
  for (const { status, path } of changes) {
    if (!/^backend\/migrations\/\d{4}_[^/]+\.sql$/.test(path)) continue
    const current = status === 'D' ? '' : readCurrent(path)
    const previous = status === 'A' ? '' : readBase(path)
    const source = managedSource(current)
    if (status !== 'A' && (source || managedSource(previous)))
      throw new Error(`不可修改或刪除既有文章 migration：${path}；請新增 migration`)
    if (!source) {
      if (/^-- blog-source:/m.test(current)) throw new Error(`不合法的 blog-source：${path}`)
      continue
    }
    if (sources.has(source)) throw new Error(`同一 PR 不可新增多個相同原稿的 migration：${source}`)
    sources.add(source)
    selected.push({ path, source })
  }
  return selected.sort((a, b) => a.path.localeCompare(b.path))
}

export function parseChanges(raw) {
  const fields = raw.split('\0')
  const changes = []
  for (let i = 0; i + 1 < fields.length; i += 2) {
    if (!['A', 'M', 'D', 'T'].includes(fields[i]))
      throw new Error(`不支援的 Git diff 狀態：${fields[i]}`)
    changes.push({ status: fields[i], path: fields[i + 1] })
  }
  return changes
}

// 每篇仍使用自己的臨時 D1；等待所有已開始的驗證完成，讓 finally 清理生效。
export async function validateBatch(items, validate, concurrency = 4) {
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 4)
    throw new Error('本地 D1 同時驗證數必須為 1–4')
  let cursor = 0
  const failures = []
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (cursor < items.length && failures.length === 0) {
        const item = items[cursor++]
        try {
          await validate(item)
        } catch (error) {
          failures.push(new Error(`${item.path}：${error.message}`))
        }
      }
    })
  )
  if (failures.length) throw new AggregateError(failures, failures.map((e) => e.message).join('\n'))
  return items.length
}

export async function checkLocal(base) {
  if (!base || !/^[a-f0-9]{40}$/.test(base))
    throw new Error('請提供完整 Git base SHA：--base <40 位 SHA> 或 BLOG_BASE_SHA')
  function git(args) {
    const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' })
    if (result.status !== 0) throw new Error(`Git 指令失敗：${result.stderr}`)
    return result.stdout
  }
  git(['cat-file', '-e', `${base}^{commit}`])
  const selected = selectMigrations(
    parseChanges(
      git(['diff', '--no-renames', '--name-status', '-z', base, 'HEAD', '--', 'backend/migrations'])
    ),
    (path) => readFileSync(resolve(root, path), 'utf8'),
    (path) => git(['show', `${base}:${path}`])
  )
  const allMigrations = readdirSync(resolve(root, 'backend/migrations'))
    .filter((name) => /^\d{4}_.*\.sql$/.test(name))
    .sort()
  for (const item of selected) {
    const latest = allMigrations
      .filter(
        (name) =>
          managedSource(readFileSync(resolve(root, 'backend/migrations', name), 'utf8')) ===
          item.source
      )
      .at(-1)
    if (item.path !== `backend/migrations/${latest}`)
      throw new Error(`只可驗證原稿最新 migration：${item.path}`)
  }
  await validateBatch(
    selected,
    (item) =>
      new Promise((resolveDone, reject) => {
        const child = spawn(
          process.execPath,
          [
            resolve(root, 'scripts/blog/validate-local.mjs'),
            resolve(root, item.source),
            '--migration',
            resolve(root, item.path),
          ],
          { cwd: root, stdio: 'inherit' }
        )
        child.once('error', reject)
        child.once('close', (code, signal) => {
          if (code === 0) resolveDone()
          else reject(new Error(`本地 D1 驗證失敗 (${signal || code})`))
        })
      })
  )
  process.stdout.write(
    `Git base 到 HEAD 共 ${selected.length} 個新增文章 migration，隔離 D1 驗證通過。\n`
  )
  return selected.length
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const args = process.argv.slice(2)
    if (args.length && (args.length !== 2 || args[0] !== '--base'))
      throw new Error('用法：check-local.mjs [--base <SHA>]')
    await checkLocal(args[1] || process.env.BLOG_BASE_SHA)
  } catch (error) {
    process.stderr.write(`${error.message}\n`)
    process.exitCode = 1
  }
}
