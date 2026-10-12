import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import test from 'node:test'
import { brandAuthorIds, loadArticle, newId, root, syncSql } from './article-lib.mjs'

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
  const python = `import sqlite3,json,sys\nc=sqlite3.connect(':memory:')\nc.executescript(sys.argv[1])\nc.executescript(sys.argv[2])\ntry:\n c.executescript('BEGIN;\\n'+sys.argv[3]+'\\nCOMMIT;')\n print(json.dumps({'ok':True,'posts':c.execute('select id,author_id,title,published_at,view_count,updated_at from posts').fetchall(),'tags':c.execute('select * from post_tags').fetchall()}))\nexcept sqlite3.Error as e:\n print(json.dumps({'ok':False,'error':str(e),'posts':c.execute('select id,author_id,title,published_at,view_count,updated_at from posts').fetchall(),'tags':c.execute('select * from post_tags').fetchall()}))`
  const result = spawnSync('python3', ['-c', python, schema, setup, sql], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  const data = JSON.parse(result.stdout)
  assert.equal(data.ok, !expectedError, JSON.stringify(data))
  return data
}
const authorId = brandAuthorIds.nobodyclimb
// 線上品牌帳號的 username 帶後綴，同步必須只靠 id 對應。
const author = `INSERT INTO users(id,email,username,is_active) VALUES ('${authorId}','staff@local','nobodyclimb_5f9aa938',1);`
const sync = (...articles) => syncSql(articles)
test('新增使用 crypto hex、SQL escape、tags 與品牌帳號 id', () => {
  assert.match(newId(), /^[a-f0-9]{32}$/)
  const data = database(sync(loadArticle(source())), author)
  assert.equal(data.posts[0][1], authorId)
  assert.equal(data.posts[0][2], "攀岩 ' 指南")
  assert.deepEqual(data.tags, [[id, '賽事']])
})
test('拒絕 missing/inactive author，不留下 partial writes', () => {
  const sql = sync(loadArticle(source()))
  assert.equal(database(sql, '', true).posts.length, 0)
  assert.equal(database(sql, author.replace(',1);', ',0);'), true).posts.length, 0)
  const existing = `${author}${sql}UPDATE users SET is_active=0;`
  assert.equal(database(sql, existing, true).posts.length, 1)
})
test('重跑不改動資料；內容變更才更新並保留日期與瀏覽數', () => {
  const sql = sync(loadArticle(source()))
  const stamped = `${author}${sql}UPDATE posts SET published_at='2020-01-01',updated_at='2020-01-01',view_count=42;`
  const same = database(sql, stamped)
  assert.equal(same.posts[0][5], '2020-01-01')
  const changed = database(
    sync(loadArticle(source({ title: '更新標題', tags: ['技巧'] }))),
    `${stamped}UPDATE posts SET title='線上編輯';`
  )
  assert.equal(changed.posts[0][2], '更新標題')
  assert.equal(changed.posts[0][3], '2020-01-01')
  assert.equal(changed.posts[0][4], 42)
  assert.notEqual(changed.posts[0][5], '2020-01-01')
  assert.deepEqual(changed.tags, [[id, '技巧']])
})
test('同批原稿 id/slug 重複或 slug 已被其他文章佔用時失敗', () => {
  const article = loadArticle(source())
  assert.throws(() => sync(article, article), /重複/)
  const taken = `${author}INSERT INTO posts(id,author_id,title,slug,content) VALUES ('other','${authorId}','他','climbing-guide','x');`
  assert.equal(database(sync(article), taken, true).posts.length, 1)
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
test('update 必須有相對 baseline 的讀者可見變更', () => {
  const dir = mkdtempSync(resolve(root, 'backend/content/blog/test-'))
  try {
    const old = loadArticle(source())
    const baseline = {
      id,
      author_id: authorId,
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
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
mkdirSync(resolve(root, 'backend/content/blog'), { recursive: true })

test('CLI 只接受位於內容目錄的原稿檢查', () => {
  const articleId = newId()
  const path = resolve(root, 'backend/content/blog', `${articleId}.md`)
  const outside = resolve(root, 'backend/content', `${articleId}.md`)
  writeFileSync(path, source({ id: articleId }))
  writeFileSync(outside, source({ id: articleId }))
  const cli = (args) =>
    spawnSync(process.execPath, [resolve(root, 'scripts/blog/article.mjs'), ...args], {
      encoding: 'utf8',
    })
  try {
    assert.equal(cli(['check', path]).status, 0)
    assert.equal(cli(['check', outside]).status, 1)
    assert.equal(cli(['check', path, '--migration', path]).status, 1)
    assert.equal(cli(['generate', path]).status, 1)
  } finally {
    rmSync(path, { force: true })
    rmSync(outside, { force: true })
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
