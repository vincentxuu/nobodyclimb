import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { SITE_NAME } from '@/lib/constants'
import { buildHreflangAlternates, buildOgLocale } from '@/lib/i18n-metadata'

/** `Metadata` namespace 內具備 title / description / keywords / ogDescription 的區塊 */
export type MetadataSection =
  | 'about'
  | 'biography'
  | 'gallery'
  | 'blog'
  | 'videos'
  | 'gym'
  | 'ropeSystem'

interface SectionMetadataOptions {
  /** `<title>` 是否附加 ` | NobodyClimb`（OG title 一律附加） */
  titleWithSiteName?: boolean
}

/**
 * 產生區塊層級（列表頁 layout）的在地化 metadata：
 * title / description / keywords 依語系輸出，並附上 hreflang alternates 與 OG locale。
 *
 * @param locale - 路由參數的 locale
 * @param section - `Metadata` namespace 下的區塊 key
 * @param pathname - 不含 locale prefix 的路徑（e.g., '/blog'）
 */
export async function buildSectionMetadata(
  locale: string,
  section: MetadataSection,
  pathname: string,
  { titleWithSiteName = false }: SectionMetadataOptions = {}
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'Metadata' })
  const ogLocale = buildOgLocale(locale)
  const title = t(`${section}.title`)
  const fullTitle = `${title} | ${SITE_NAME}`

  return {
    title: titleWithSiteName ? fullTitle : title,
    description: t(`${section}.description`),
    keywords: t(`${section}.keywords`),
    alternates: {
      languages: buildHreflangAlternates(pathname),
    },
    openGraph: {
      title: fullTitle,
      description: t(`${section}.ogDescription`),
      type: 'website',
      locale: ogLocale.locale,
      alternateLocale: ogLocale.alternateLocale,
    },
  }
}
