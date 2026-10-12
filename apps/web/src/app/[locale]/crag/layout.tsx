import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { SITE_NAME, SITE_URL } from '@/lib/constants'

// 台灣主要岩場（集中管理，方便新增或修改）；名稱與說明在訊息檔 CragPage.featured
const FEATURED_CRAG_SLUGS = ['longdong', 'kenting', 'guanziling', 'defulan', 'shoushan'] as const

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('CragPage')

  return {
    title: t('title'),
    description: t('layoutDescription'),
    keywords: t('layoutKeywords').split(','),
    openGraph: {
      title: t('layoutOgTitle'),
      description: t('layoutOgDescription'),
      type: 'website',
      url: `${SITE_URL}/crag`,
      siteName: SITE_NAME,
    },
    alternates: {
      canonical: `${SITE_URL}/crag`,
    },
  }
}

export default async function CragLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('CragPage')

  // ItemList JSON-LD - 幫助搜尋引擎呈現豐富搜尋結果
  const cragItemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: t('itemListName'),
    description: t('itemListDescription'),
    url: `${SITE_URL}/crag`,
    numberOfItems: FEATURED_CRAG_SLUGS.length,
    itemListElement: FEATURED_CRAG_SLUGS.map((slug, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: t(`featured.${slug}.name`),
      url: `${SITE_URL}/crag/${slug}`,
      description: t(`featured.${slug}.description`),
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(cragItemListJsonLd) }}
      />
      {children}
    </>
  )
}
