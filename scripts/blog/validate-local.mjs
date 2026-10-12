#!/usr/bin/env node
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { loadArticle, migration, root, sqlValue, validateSourcePath } from './article-lib.mjs'

let temporary
try {
  const [source, option, sqlPath, ...extra] = process.argv.slice(2)
  if (!source || option !== '--migration' || !sqlPath || extra.length)
    throw new Error('用法：validate-local.mjs <source.md> --migration <generated.sql>')
  const path = resolve(source)
  const article = loadArticle(readFileSync(path, 'utf8'), path)
  validateSourcePath(path, article.meta.id)
  const sql = readFileSync(resolve(sqlPath), 'utf8')
  if (sql !== migration(article)) throw new Error('migration 與原稿不一致')
  temporary = mkdtempSync(resolve(tmpdir(), 'nobodyclimb-blog-local-'))
  const migrations = resolve(temporary, 'migrations')
  mkdirSync(migrations)
  writeFileSync(resolve(migrations, '0001_article.sql'), sql)
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
          migrations_dir: migrations,
        },
      ],
    })
  )
  const schema = readFileSync(resolve(root, 'backend/src/db/schema.sql'), 'utf8').split(
    '-- ============================================\n-- Climbing Gyms'
  )[0]
  const q = sqlValue
  const staffId = article.baseline?.author_id || 'local-blog-staff'
  const author = `INSERT INTO users(id,email,username,is_active) VALUES (${q(staffId)},'local-blog@example.invalid','nobodyclimb',1);`
  const existing = article.baseline || {
    ...article.meta,
    author_id: staffId,
    content: article.html,
    published_at: '2020-01-01',
    updated_at: '2020-01-01',
  }
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
    'published_at',
    'updated_at',
  ]
  const seedPost = `INSERT INTO posts (${postFields.join(',')},created_at,view_count) VALUES (${postFields.map((key) => q(existing[key])).join(',')},'2019-01-01',42);\n${existing.tags.map((tag) => `INSERT INTO post_tags VALUES (${q(existing.id)},${q(tag)});`).join('\n')}`
  let calls = 0
  function run(scenario, verb, options, success = true) {
    calls++
    const result = spawnSync(
      'pnpm',
      [
        '--filter',
        '@nobodyclimb/api',
        'exec',
        'wrangler',
        'd1',
        ...verb,
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
        timeout: 60000,
        env: { ...process.env, CI: 'true', WRANGLER_SEND_METRICS: 'false' },
      }
    )
    if (result.error) throw result.error
    if ((result.status === 0) !== success)
      throw new Error(`${scenario} 本地 D1 指令結果不符：${result.stderr}\n${result.stdout}`)
    return result.stdout
  }
  function query(scenario, command) {
    const raw = run(scenario, ['execute'], ['--command', command, '--json'])
    const parsed = JSON.parse(raw.slice(raw.indexOf('[')))
    return parsed.flatMap((entry) => entry.results || [])
  }
  const scenarios = article.baseline
    ? ['positive', 'missing-author', 'baseline-conflict']
    : ['positive', 'missing-author', 'duplicate-id']
  for (const scenario of scenarios) {
    const seed = resolve(temporary, `${scenario}.sql`)
    writeFileSync(
      seed,
      `${schema}\n${scenario === 'missing-author' ? author.replace("'nobodyclimb'", "'other-local-author'") : author}\n${article.baseline || scenario === 'duplicate-id' ? seedPost : ''}\n${scenario === 'baseline-conflict' ? `UPDATE posts SET title='本地衝突';` : ''}`
    )
    run(scenario, ['execute'], ['--file', seed, '--json'])
    const before = query(
      scenario,
      'SELECT * FROM posts ORDER BY id; SELECT * FROM post_tags ORDER BY post_id,tag;'
    )
    run(scenario, ['migrations', 'apply'], [], scenario === 'positive')
    assert.equal(
      query(scenario, "SELECT name FROM sqlite_master WHERE name='_blog_article_guard';").length,
      0,
      'guard table 不得殘留'
    )
    const after = query(
      scenario,
      'SELECT * FROM posts ORDER BY id; SELECT * FROM post_tags ORDER BY post_id,tag;'
    )
    if (scenario !== 'positive')
      assert.deepEqual(after, before, '失敗 migration 不得留下 partial writes')
    else {
      // Wrangler 的一般欄位回傳可能把 SQL NULL 字串化，json_object 保留真正型別。
      const readbackFields = [...postFields, 'created_at', 'view_count']
      const [row] = query(
        scenario,
        `SELECT json_object(${readbackFields.map((key) => `${q(key)},${key}`).join(',')}) AS payload FROM posts WHERE id=${q(article.meta.id)};`
      )
      const post = JSON.parse(row.payload)
      assert.equal(post.author_id, staffId)
      for (const key of [
        'id',
        'slug',
        'title',
        'excerpt',
        'cover_image',
        'category',
        'status',
        'is_featured',
      ])
        assert.equal(post[key], article.meta[key])
      assert.equal(post.content, article.html)
      assert.deepEqual(
        query(
          scenario,
          `SELECT tag FROM post_tags WHERE post_id=${q(article.meta.id)} ORDER BY tag;`
        ).map((row) => row.tag),
        [...article.meta.tags].sort()
      )
      if (article.baseline) {
        assert.equal(post.published_at, existing.published_at)
        assert.equal(post.created_at, '2019-01-01')
        assert.equal(post.view_count, 42)
      }
    }
    process.stdout.write(`本地 D1 ${scenario}：通過\n`)
  }
  process.stdout.write(
    `完成 ${scenarios.length} 個隔離案例、${calls} 次 wrangler --local 呼叫；臨時資料庫已清理。\n`
  )
} catch (error) {
  process.stderr.write(`${error.message}\n`)
  process.exitCode = 1
} finally {
  if (temporary) rmSync(temporary, { recursive: true, force: true })
}
