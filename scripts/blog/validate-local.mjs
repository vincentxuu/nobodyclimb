#!/usr/bin/env node
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { brandAuthorIds, loadSources, root, sqlValue, syncSql } from './article-lib.mjs'

let temporary
try {
  if (process.argv.length > 2) throw new Error('用法：validate-local.mjs')
  const articles = loadSources()
  if (!articles.length) {
    process.stdout.write('沒有文章原稿，略過本地 D1 同步驗證。\n')
  } else {
    temporary = mkdtempSync(resolve(tmpdir(), 'nobodyclimb-blog-local-'))
    const config = resolve(temporary, 'wrangler.json')
    writeFileSync(
      config,
      JSON.stringify({
        name: 'nobodyclimb-blog-test',
        compatibility_date: '2024-12-01',
        d1_databases: [
          {
            binding: 'DB',
            database_name: 'nobodyclimb-blog-test',
            database_id: '00000000-0000-0000-0000-000000000000',
          },
        ],
      })
    )
    const schema = readFileSync(resolve(root, 'backend/src/db/schema.sql'), 'utf8').split(
      '-- ============================================\n-- Climbing Gyms'
    )[0]
    const q = sqlValue
    const authorId = brandAuthorIds.nobodyclimb
    const author = (id) =>
      `INSERT INTO users(id,email,username,is_active) VALUES (${q(id)},'local-blog@example.invalid','local-brand',1);`
    const sync = resolve(temporary, 'sync.sql')
    writeFileSync(sync, syncSql(articles))
    let calls = 0
    function run(scenario, options, success = true) {
      calls++
      const result = spawnSync(
        'pnpm',
        [
          '--filter',
          '@nobodyclimb/api',
          'exec',
          'wrangler',
          'd1',
          'execute',
          'nobodyclimb-blog-test',
          '--config',
          config,
          '--local',
          '--persist-to',
          resolve(temporary, scenario),
          ...options,
        ],
        {
          cwd: root,
          encoding: 'utf8',
          timeout: 120000,
          maxBuffer: 256 * 1024 * 1024,
          env: { ...process.env, CI: 'true', WRANGLER_SEND_METRICS: 'false' },
        }
      )
      if (result.error) throw result.error
      if ((result.status === 0) !== success)
        throw new Error(`${scenario} 本地 D1 指令結果不符：${result.stderr}\n${result.stdout}`)
      return result.stdout
    }
    function seed(scenario, sql) {
      const file = resolve(temporary, `${scenario}-${calls}.sql`)
      writeFileSync(file, sql)
      run(scenario, ['--file', file, '--json'])
    }
    function query(scenario, command) {
      const raw = run(scenario, ['--command', command, '--json'])
      const parsed = JSON.parse(raw.slice(raw.indexOf('[')))
      return parsed.flatMap((entry) => entry.results || [])
    }
    // Wrangler 的一般欄位回傳可能把 SQL NULL 字串化，json_object 保留真正型別。
    const postFields = [
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
      'view_count',
      'published_at',
      'created_at',
      'updated_at',
    ]
    const snapshot = (scenario) => ({
      posts: query(
        scenario,
        `SELECT json_object(${postFields.map((key) => `${q(key)},${key}`).join(',')}) AS payload FROM posts ORDER BY id;`
      ).map((row) => JSON.parse(row.payload)),
      tags: query(scenario, 'SELECT post_id, tag FROM post_tags ORDER BY post_id, tag;'),
    })
    const expectedTags = articles
      .flatMap(({ meta }) => meta.tags.map((tag) => ({ post_id: meta.id, tag })))
      .sort((a, b) => a.post_id.localeCompare(b.post_id) || (a.tag < b.tag ? -1 : 1))
    function assertContent(state) {
      assert.equal(state.posts.length, articles.length)
      for (const { meta, html } of articles) {
        const post = state.posts.find((row) => row.id === meta.id)
        assert.ok(post, `${meta.id} 未入庫`)
        assert.equal(post.author_id, authorId)
        for (const key of [
          'slug',
          'title',
          'excerpt',
          'cover_image',
          'category',
          'status',
          'is_featured',
        ])
          assert.equal(post[key], meta[key], `${meta.id} ${key}`)
        assert.equal(post.content, html, `${meta.id} content`)
      }
      assert.deepEqual(
        [...state.tags].sort(
          (a, b) => a.post_id.localeCompare(b.post_id) || (a.tag < b.tag ? -1 : 1)
        ),
        expectedTags
      )
    }

    seed('sync', `${schema}\n${author(authorId)}`)
    run('sync', ['--file', sync, '--json'])
    const created = snapshot('sync')
    assertContent(created)
    process.stdout.write('本地 D1 新增：通過\n')

    run('sync', ['--file', sync, '--json'])
    assert.deepEqual(snapshot('sync'), created, '內容未變時重跑不得改動任何資料')
    process.stdout.write('本地 D1 重跑無變動：通過\n')

    seed(
      'sync',
      `UPDATE posts SET title='本地舊標題', published_at='2020-01-01', created_at='2019-01-01', updated_at='2020-01-01', view_count=42;\nINSERT INTO post_tags SELECT id, '本地舊標籤' FROM posts;`
    )
    run('sync', ['--file', sync, '--json'])
    const updated = snapshot('sync')
    assertContent(updated)
    for (const post of updated.posts) {
      assert.equal(post.published_at, '2020-01-01', '更新必須保留首次發表日期')
      assert.equal(post.created_at, '2019-01-01')
      assert.equal(post.view_count, 42)
      assert.notEqual(post.updated_at, '2020-01-01', '內容變更必須刷新 updated_at')
    }
    process.stdout.write('本地 D1 更新並保留日期與瀏覽數：通過\n')

    seed('missing-author', `${schema}\n${author('other-local-author')}`)
    run('missing-author', ['--file', sync, '--json'], false)
    assert.deepEqual(snapshot('missing-author'), { posts: [], tags: [] }, '缺作者不得留下文章')
    process.stdout.write('本地 D1 缺作者失敗：通過\n')

    process.stdout.write(
      `${articles.length} 篇文章同步驗證完成、${calls} 次 wrangler --local 呼叫；臨時資料庫已清理。\n`
    )
  }
} catch (error) {
  process.stderr.write(`${error.message}\n`)
  process.exitCode = 1
} finally {
  if (temporary) rmSync(temporary, { recursive: true, force: true })
}
