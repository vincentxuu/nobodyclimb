import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import {
  checkEvidence,
  checkReview,
  checkTranslations,
  contentHash,
  discoverPublicationPairs,
} from './check-all.mjs'

const evidence = () => ({
  schema_version: 1,
  article_id: 'article',
  source_sha256: contentHash('draft'),
  checked_at: '2026-10-11T10:00:00Z',
  media: [],
  links: [
    {
      url: 'https://www.ifsc-climbing.org/',
      checked_at: '2026-10-11T09:00:00Z',
      tool: 'Groundlane web_fetch',
      status: 'reachable',
      status_code: 200,
      reason: '已讀取目的頁並核對主題',
    },
  ],
  claims: [
    {
      location: '規則第一段',
      claim: '規則有三項',
      verdict: 'confirmed',
      reason: '已核對原始規則',
      sources: [
        {
          url: 'https://www.ifsc-climbing.org/',
          title: '規則',
          publisher: 'IFSC',
          source_date: null,
          accessed_at: '2026-10-11T09:00:00Z',
          read_scope: 'full',
          evidence: '規則段落位置',
          tool: 'Groundlane web_fetch',
        },
      ],
    },
  ],
})

test('來源台帳要求原文讀取、正確身分與無認證 URL', () => {
  assert.doesNotThrow(() => checkEvidence(evidence(), 'article'))
  const summary = evidence()
  summary.claims[0].sources[0].read_scope = 'summary'
  assert.throws(() => checkEvidence(summary, 'article'), /摘要/)
  assert.throws(() => checkEvidence(evidence(), 'other'), /article_id/)
  const credential = evidence()
  credential.claims[0].sources[0].url = 'https://name:secret@www.ifsc-climbing.org/'
  assert.throws(() => checkEvidence(credential, 'article'), /source/)
  const missing = evidence()
  missing.claims[0].sources = []
  assert.throws(() => checkEvidence(missing, 'article'), /缺來源/)
  assert.throws(
    () => checkEvidence(evidence(), 'article', ['https://www.ifsc-climbing.org/photo.png']),
    /圖片/
  )
})

test('原稿必須配對 migration，歷史版本選最新且不接受遺失原稿', () => {
  const root = mkdtempSync(join(tmpdir(), 'blog-check-'))
  try {
    mkdirSync(join(root, 'backend/content/blog'), { recursive: true })
    mkdirSync(join(root, 'backend/migrations'), { recursive: true })
    assert.deepEqual(discoverPublicationPairs(root), [])
    writeFileSync(join(root, 'backend/content/blog/article.md'), '正文')
    assert.throws(() => discoverPublicationPairs(root), /缺少/)
    const header = '-- blog-source: backend/content/blog/article.md\n'
    writeFileSync(join(root, 'backend/migrations/0001_create.sql'), header)
    writeFileSync(join(root, 'backend/migrations/0002_update.sql'), header)
    const pairs = discoverPublicationPairs(root)
    assert.equal(pairs.length, 1)
    assert.equal(pairs[0].migration, join(root, 'backend/migrations/0002_update.sql'))
    writeFileSync(
      join(root, 'backend/migrations/0003_other.sql'),
      '-- blog-source: backend/content/blog/missing.md\n'
    )
    assert.throws(() => discoverPublicationPairs(root), /不存在/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('三語必須完整、同組資料一致且互相連到正確語系', () => {
  const translations = { zh: 'zh_article', en: 'en_article', ja: 'ja_article' }
  const records = ['zh', 'en', 'ja'].map((lang) => ({
    meta: {
      id: translations[lang],
      lang,
      translation_group: translations.zh,
      translations,
      category: 'competition',
      tags: ['IFSC'],
      cover_image: null,
      status: 'published',
      is_featured: 0,
      author_username: 'nobodyclimb',
    },
    body: ['zh', 'en', 'ja']
      .filter((other) => other !== lang)
      .map(
        (other) => `[${other}](${other === 'zh' ? '' : `/${other}`}/blog/${translations[other]})`
      )
      .join('\n'),
  }))
  assert.doesNotThrow(() => checkTranslations(records))
  assert.throws(() => checkTranslations(records.slice(0, 2)), /三篇/)
  const divergent = structuredClone(records)
  divergent[1].meta.category = 'training'
  assert.throws(() => checkTranslations(divergent), /category/)
  const wrongLink = structuredClone(records)
  wrongLink[2].body = '[中文](/blog/zh_article)'
  assert.throws(() => checkTranslations(wrongLink), /翻譯連結/)
  const sameId = structuredClone(records)
  sameId[0].meta.translations.en = sameId[0].meta.translations.zh
  assert.throws(() => checkTranslations(sameId), /metadata/)
})

const approval = () => ({
  schema_version: 1,
  article_id: 'article',
  source_sha256: contentHash('draft'),
  evidence_sha256: contentHash('evidence'),
  reviewed_at: '2026-10-11T10:00:00Z',
  reviewer: 'independent-review-agent',
  decision: 'approved',
  sections: Object.fromEntries(
    ['factual', 'translation', 'editorial'].map((name) => [
      name,
      { passed: true, notes: '已逐段核對原文及限制' },
    ])
  ),
  findings: [],
})

test('原稿或台帳位元組變動使來源與核准失效', () => {
  assert.doesNotThrow(() => checkEvidence(evidence(), 'article', [], contentHash('draft')))
  assert.throws(
    () => checkEvidence(evidence(), 'article', [], contentHash('changed')),
    /source_sha256/
  )
  const review = approval()
  assert.doesNotThrow(() =>
    checkReview(review, 'article', contentHash('draft'), contentHash('evidence'))
  )
  assert.throws(
    () => checkReview(review, 'article', contentHash('changed'), contentHash('evidence')),
    /source_sha256/
  )
  assert.throws(
    () => checkReview(review, 'article', contentHash('draft'), contentHash('changed')),
    /evidence_sha256/
  )
})

test('未核准、缺少分層審稿或未解必修問題均阻擋發布', () => {
  const check = (review) =>
    checkReview(review, 'article', contentHash('draft'), contentHash('evidence'))
  const rejected = approval()
  rejected.decision = 'changes_requested'
  assert.throws(() => check(rejected), /approved/)
  for (const name of ['factual', 'translation', 'editorial']) {
    const missing = approval()
    delete missing.sections[name]
    assert.throws(() => check(missing), new RegExp(name))
    const failed = approval()
    failed.sections[name].passed = false
    assert.throws(() => check(failed), new RegExp(name))
    failed.sections[name] = { passed: true, notes: '' }
    assert.throws(() => check(failed), new RegExp(name))
  }
  const blocking = approval()
  blocking.findings.push({ severity: 'blocking', resolved: false, notes: '紀錄數字來源衝突' })
  assert.throws(() => check(blocking), /必修/)
  blocking.findings[0].resolved = true
  assert.doesNotThrow(() => check(blocking))
  blocking.findings.push({ severity: 'advisory', resolved: false, notes: '可增加範例' })
  assert.doesNotThrow(() => check(blocking))
  blocking.findings[1].resolved = 'true'
  assert.throws(() => check(blocking), /finding/)
})

test('外部引用需可達性台帳，網路不確定與損壞連結不能核准', () => {
  const absent = evidence()
  absent.links = []
  assert.throws(() => checkEvidence(absent, 'article'), /缺少查核/)
  assert.throws(
    () => checkEvidence(evidence(), 'article', [], undefined, ['https://example.com/additional']),
    /缺少查核/
  )
  for (const status of ['broken', 'uncertain']) {
    const invalid = evidence()
    invalid.links[0].status = status
    assert.throws(() => checkEvidence(invalid, 'article'), new RegExp(status))
  }
  const invalid = evidence()
  invalid.links[0].status_code = 403
  assert.throws(() => checkEvidence(invalid, 'article'), /矛盾/)
  invalid.links[0].status_code = null
  assert.doesNotThrow(() => checkEvidence(invalid, 'article'))
})

test('已知錯誤主張不能發布，未驗主張必須在原稿明示限制', () => {
  for (const verdict of ['contradicted', 'outdated', 'misframed']) {
    const invalid = evidence()
    invalid.claims[0].verdict = verdict
    assert.throws(() => checkEvidence(invalid, 'article'), new RegExp(verdict))
  }
  const uncertain = evidence()
  uncertain.claims[0].verdict = 'unverifiable'
  assert.throws(() => checkEvidence(uncertain, 'article'), /qualification/)
  uncertain.claims[0].disposition = 'qualified'
  uncertain.claims[0].qualification = '目前尚未確認是否適用本季賽事。'
  assert.throws(
    () => checkEvidence(uncertain, 'article', [], undefined, [], '無限定的正文'),
    /qualification/
  )
  assert.doesNotThrow(() =>
    checkEvidence(uncertain, 'article', [], undefined, [], uncertain.claims[0].qualification)
  )
})
