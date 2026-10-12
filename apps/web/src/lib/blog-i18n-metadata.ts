import { SITE_URL } from '@/lib/constants'
import manifest from '@/lib/data/blog-translations.json'

type ArticleLocale = 'zh' | 'en' | 'ja'
interface ArticleTranslation {
  lang: ArticleLocale
  translations: Record<ArticleLocale, string>
}
// 產生物由 blog:check 驗證語系與完整對照；JSON import 的字串型別需在此收斂。
const articles = manifest.articles as Record<string, ArticleTranslation>
const languageCodes = { zh: 'zh-TW', en: 'en', ja: 'ja' } as const

function articleUrl(id: string, locale: ArticleLocale) {
  return `${SITE_URL}${locale === 'zh' ? '' : `/${locale}`}/blog/${id}`
}

/** 正文語系決定 canonical；未管理文章不宣告不存在的翻譯。 */
export function buildBlogAlternates(id: string, registry = articles) {
  const entry = registry[id]
  if (!entry) return { canonical: `${SITE_URL}/blog/${id}` }
  const languages: Record<string, string> = {}
  for (const locale of ['zh', 'en', 'ja'] as const) {
    languages[languageCodes[locale]] = articleUrl(entry.translations[locale], locale)
  }
  languages['x-default'] = languages['zh-TW']
  return { canonical: articleUrl(id, entry.lang), languages }
}

export function getBlogContentLocale(id: string, registry = articles): ArticleLocale | undefined {
  return registry[id]?.lang
}
