import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import test from 'node:test'
import { baselineFields, root } from './article-lib.mjs'
import { captureBaseline } from './capture-baseline.mjs'

const post = {
  id: 'a'.repeat(32),
  author_id: 'actual-author',
  slug: 'guide',
  title: '指南',
  excerpt: null,
  content: '<p>正文</p>',
  cover_image: null,
  category: 'competition',
  status: 'published',
  is_featured: 0,
  published_at: null,
  updated_at: null,
  tags: ['賽事'],
  username: 'nobodyclimb',
  email: 'private@example.invalid',
  password_hash: 'private',
  view_count: 42,
}
test('公開 API snapshot 僅抽取完整 baseline fields/tags，不保留私人欄位', () => {
  const baseline = captureBaseline({ success: true, data: post })
  assert.deepEqual(Object.keys(baseline), [...baselineFields, 'tags'])
  assert.equal(baseline.author_id, 'actual-author')
  assert.equal(baseline.updated_at, null)
  assert.equal(baseline.email, undefined)
  assert.equal(baseline.password_hash, undefined)
})
test('baseline 缺完整正文/author/tags 或非 NobodyClimb 拒絕', () => {
  for (const override of [
    { content: '' },
    { content: undefined },
    { author_id: '' },
    { tags: undefined },
    { tags: ['同', '同'] },
    { username: 'other' },
    { is_featured: true },
  ])
    assert.throws(() => captureBaseline({ success: true, data: { ...post, ...override } }))
  assert.throws(() => captureBaseline({ success: false, data: post }))
})
test('offline helpers 無效參數非零退出', () => {
  for (const file of ['capture-baseline.mjs', 'validate-local.mjs']) {
    const result = spawnSync(process.execPath, [resolve(root, 'scripts/blog', file)], {
      encoding: 'utf8',
    })
    assert.equal(result.status, 1)
    assert.match(result.stderr, /用法/)
  }
})
