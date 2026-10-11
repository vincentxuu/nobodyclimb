import { buildBlogAlternates, getBlogContentLocale } from '../blog-i18n-metadata'
import { SITE_URL } from '../constants'

const translations = { zh: 'zh-id', en: 'en-id', ja: 'ja-id' }
const registry = {
  'zh-id': { lang: 'zh' as const, translations },
  'en-id': { lang: 'en' as const, translations },
  'ja-id': { lang: 'ja' as const, translations },
}

test('三語 canonical 與 reciprocal hreflang 使用正文 ID', () => {
  const expected = {
    'zh-TW': `${SITE_URL}/blog/zh-id`,
    en: `${SITE_URL}/en/blog/en-id`,
    ja: `${SITE_URL}/ja/blog/ja-id`,
    'x-default': `${SITE_URL}/blog/zh-id`,
  }
  for (const id of Object.keys(registry)) {
    expect(buildBlogAlternates(id, registry).languages).toEqual(expected)
  }
  expect(buildBlogAlternates('en-id', registry).canonical).toBe(`${SITE_URL}/en/blog/en-id`)
  expect(getBlogContentLocale('ja-id', registry)).toBe('ja')
})

test('歷史文章不宣告未存在的翻譯', () => {
  expect(buildBlogAlternates('legacy', registry)).toEqual({ canonical: `${SITE_URL}/blog/legacy` })
  expect(getBlogContentLocale('legacy', registry)).toBeUndefined()
})
