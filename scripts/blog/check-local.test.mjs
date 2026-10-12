import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseChanges, selectMigrations } from './check-local.mjs'

const path = 'backend/migrations/0999_article.sql'
const source = 'backend/content/blog/post_test.md'
const managed = `-- blog-source: ${source}\nSQL`

test('只選新增文章 migration，忽略非文章 migration', () => {
  assert.deepEqual(
    selectMigrations(
      [
        { status: 'A', path },
        { status: 'A', path: 'backend/migrations/0998_schema.sql' },
      ],
      (p) => (p === path ? managed : 'CREATE TABLE x;'),
      () => {
        throw new Error('新增不應讀取 base')
      }
    ),
    [{ path, source }]
  )
})

test('拒絕改寫、移除標記與刪除歷史文章 migration', () => {
  for (const status of ['M', 'D', 'T'])
    assert.throws(
      () =>
        selectMigrations(
          [{ status, path }],
          () => 'SQL',
          () => managed
        ),
      /不可修改或刪除/
    )
  assert.throws(
    () =>
      selectMigrations(
        [{ status: 'M', path }],
        () => managed,
        () => 'SQL'
      ),
    /不可修改或刪除/
  )
})

test('拒絕錯誤來源與同原稿重複新增', () => {
  assert.throws(
    () =>
      selectMigrations(
        [{ status: 'A', path }],
        () => '-- blog-source: ../../secret.md',
        () => ''
      ),
    /不合法/
  )
  assert.throws(
    () =>
      selectMigrations(
        [
          { status: 'A', path },
          { status: 'A', path: 'backend/migrations/1000_article.sql' },
        ],
        () => managed,
        () => ''
      ),
    /多個相同原稿/
  )
})

test('解析 NUL 分隔狀態與路徑並拒絕非預期狀態', () => {
  assert.deepEqual(parseChanges(`A\0${path}\0M\0file.sql\0`), [
    { status: 'A', path },
    { status: 'M', path: 'file.sql' },
  ])
  assert.throws(() => parseChanges('R100\0old\0new\0'), /不支援/)
})
