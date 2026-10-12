import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import test from 'node:test'
import { loadArticle, migration, newId, root } from './article-lib.mjs'

const id = 'a'.repeat(32)
function source(
  overrides = {},
  body = '## 入門\n\n參閱 [官方規則](https://ifsc-climbing.org/rules)。\n'
) {
  const meta = {
    id,
    slug: 'climbing-guide',
    title: "攀岩 ' 指南",
    excerpt: '認識攀岩規則。',
    category: 'competition',
    tags: ['賽事'],
    cover_image: null,
    status: 'published',
    is_featured: 0,
    author_username: 'nobodyclimb',
    operation: 'create',
    lang: 'zh',
    translation_group: overrides.id || id,
    translations: { zh: overrides.id || id, en: 'b'.repeat(32), ja: 'c'.repeat(32) },
    ...overrides,
  }
  return `---\n${Object.entries(meta)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join('\n')}\n---\n${body}`
}
function database(sql, setup = '', expectedError = false) {
  const schema = readFileSync(resolve(root, 'backend/src/db/schema.sql'), 'utf8').split(
    '-- ============================================\n-- Climbing Gyms'
  )[0]
  const python = `import sqlite3,json,sys\nc=sqlite3.connect(':memory:')\nc.executescript(sys.argv[1])\nc.executescript(sys.argv[2])\ntry:\n c.executescript('BEGIN;\\n'+sys.argv[3]+'\\nCOMMIT;')\n print(json.dumps({'ok':True,'posts':c.execute('select id,author_id,title,published_at,view_count from posts').fetchall(),'tags':c.execute('select * from post_tags').fetchall()}))\nexcept sqlite3.Error as e:\n print(json.dumps({'ok':False,'error':str(e),'posts':c.execute('select id,author_id,title,published_at,view_count from posts').fetchall(),'tags':c.execute('select * from post_tags').fetchall()}))`
  const result = spawnSync('python3', ['-c', python, schema, setup, sql], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  const data = JSON.parse(result.stdout)
  assert.equal(data.ok, !expectedError, JSON.stringify(data))
  return data
}
const author =
  "INSERT INTO users(id,email,username,is_active) VALUES ('staff','staff@local','nobodyclimb',1);"
test('create 使用 crypto hex、SQL escape 與 tags', () => {
  assert.match(newId(), /^[a-f0-9]{32}$/)
  const article = loadArticle(source())
  const data = database(migration(article), author)
  assert.equal(data.posts[0][2], "攀岩 ' 指南")
  assert.deepEqual(data.tags, [[id, '賽事']])
})
test('拒絕 missing/inactive author 與重複文章，不留下 partial writes', () => {
  const sql = migration(loadArticle(source()))
  assert.equal(database(sql, '', true).posts.length, 0)
  assert.equal(
    database(sql, author.replace("'nobodyclimb',1", "'nobodyclimb',0"), true).posts.length,
    0
  )
  const setup = `${author}${sql}`
  const duplicate = database(sql, setup, true)
  assert.equal(duplicate.posts.length, 1)
  assert.equal(duplicate.tags.length, 1)
})
test('拒絕危險 HTML、URL、placeholder、unsupported 和 YAML duplicate keys', () => {
  for (const body of [
    '## 標題\n<script>alert(1)</script>',
    '## 標題\n[x](javascript:alert)',
    '## 標題\n[x](&#106;avascript:alert)',
    '## 標題\n![圖](&#106;avascript:alert)',
    '## 標題\n[x](https://example.com)',
    '## 標題\n![ ](https://ifsc-climbing.org/a.png)',
    '## 標題\n---\n',
    '## 標題\n```mermaid\ngraph TD\n```',
    '# 標題\n',
    '#### 跳級\n',
    '## 標題\nTODO',
    '## 標題\n沒有來源',
  ])
    assert.throws(() => loadArticle(source({}, body)), body)
  assert.throws(() => loadArticle(source().replace('slug:', 'id: "duplicate"\nslug:')))
  assert.throws(() => loadArticle(source({ is_featured: true })))
  assert.throws(() => loadArticle(source({ category: 'invented' })))
})
test('表格及引語保持安全 HTML', () => {
  const article = loadArticle(
    source(
      {},
      '## 標題\n\n| 項目 | 值 |\n| --- | --- |\n| 攀岩 | 1 |\n\n> 引語 & 說明\n\n[協會](https://ifsc-climbing.org)\n'
    )
  )
  assert.match(article.html, /<table>/)
  assert.match(article.html, /&amp;/)
})
test('更新完整 baseline 比較、missing/conflict fail、日期互動保留', () => {
  const dir = mkdtempSync(resolve(root, 'backend/content/blog/test-'))
  try {
    const old = loadArticle(source())
    const create = migration(old)
    const baseline = {
      id,
      author_id: 'staff',
      slug: 'climbing-guide',
      title: "攀岩 ' 指南",
      excerpt: '認識攀岩規則。',
      content: old.html,
      cover_image: null,
      category: 'competition',
      status: 'published',
      is_featured: 0,
      published_at: '2020-01-01',
      updated_at: '2020-01-01',
      tags: ['賽事'],
    }
    writeFileSync(resolve(dir, 'baseline.json'), JSON.stringify(baseline))
    assert.throws(
      () =>
        loadArticle(
          source({ operation: 'update', baseline: 'baseline.json' }),
          resolve(dir, 'source.md')
        ),
      /沒有讀者可見變更/
    )
    const tagsOnly = loadArticle(
      source({ operation: 'update', baseline: 'baseline.json', tags: ['技巧'] }),
      resolve(dir, 'source.md')
    )
    assert.equal(tagsOnly.meta.title, baseline.title)

    const updated = loadArticle(
      source({ operation: 'update', baseline: 'baseline.json', title: '更新標題', tags: ['技巧'] }),
      resolve(dir, 'source.md')
    )
    const setup = `${author}${create}UPDATE posts SET published_at='2020-01-01',updated_at='2020-01-01',view_count=42;`
    const data = database(migration(updated), setup)
    assert.equal(data.posts[0][2], '更新標題')
    assert.equal(data.posts[0][3], '2020-01-01')
    assert.equal(data.posts[0][4], 42)
    assert.deepEqual(data.tags, [[id, '技巧']])
    assert.equal(database(migration(updated), author, true).posts.length, 0)
    const conflict = database(
      migration(updated),
      `${setup}UPDATE posts SET title='線上編輯';`,
      true
    )
    assert.equal(conflict.posts[0][2], '線上編輯')
    assert.deepEqual(conflict.tags, [[id, '賽事']])
    database(migration(updated), `${setup}INSERT INTO post_tags VALUES ('${id}','額外');`, true)
    database(migration(updated), `${setup}UPDATE posts SET author_id='other';`, true)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
mkdirSync(resolve(root, 'backend/content/blog'), { recursive: true })

test('CLI 原稿位置、不可覆蓋、next 編號與 parity', () => {
  const articleId = newId()
  const path = resolve(root, 'backend/content/blog', `${articleId}.md`)
  writeFileSync(path, source({ id: articleId }))
  const cli = (args) =>
    spawnSync(process.execPath, [resolve(root, 'scripts/blog/article.mjs'), ...args], {
      encoding: 'utf8',
    })
  const temporary = resolve(root, 'backend/content/blog', `${articleId}.sql`)
  try {
    assert.equal(cli(['check', path]).status, 0)
    writeFileSync(temporary, migration(loadArticle(readFileSync(path, 'utf8'))))
    assert.equal(cli(['check', path, '--migration', temporary]).status, 0)
    writeFileSync(temporary, '-- stale')
    assert.equal(cli(['check', path, '--migration', temporary]).status, 1)
    assert.equal(cli(['generate', path, '--output', '../escaped.sql']).status, 1)
    assert.equal(cli(['generate', path, '--output', 'backend/migrations/0000_test.sql']).status, 1)
    assert.equal(cli(['check', path, '--unknown', temporary]).status, 1)
    assert.equal(cli(['check', path, '--migration']).status, 1)
  } finally {
    rmSync(path, { force: true })
    rmSync(temporary, { force: true })
  }
})

test('多語 metadata 完整性與本站錨點限制', () => {
  for (const overrides of [
    { lang: 'fr' },
    { translation_group: 'b'.repeat(32) },
    { translations: { zh: id, en: 'b'.repeat(32) } },
    { translations: { zh: id, en: id, ja: 'c'.repeat(32) } },
    { translations: { zh: id, en: 'bad-id', ja: 'c'.repeat(32) } },
    { lang: 'en' },
  ])
    assert.throws(() => loadArticle(source(overrides)))
  const article = loadArticle(
    source({
      id: 'b'.repeat(32),
      lang: 'en',
      translation_group: id,
      translations: { zh: id, en: 'b'.repeat(32), ja: 'c'.repeat(32) },
    })
  )
  assert.equal(article.meta.lang, 'en')
  assert.throws(() =>
    loadArticle(source({}, '## 標題\n[來源](https://ifsc-climbing.org) [錨點](#標題)'))
  )
})
