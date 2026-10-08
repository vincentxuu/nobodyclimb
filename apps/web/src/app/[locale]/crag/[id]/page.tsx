import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { assembleCragMetadata, type CragMetadata } from '@/lib/adapters/crag-adapter'
import { fetchCragById } from '@/lib/api/server-fetch'
import { OG_IMAGE, SITE_NAME, SITE_URL } from '@/lib/constants'
import { type CragOverlay, loadCragOverlays, localizeCragText } from '@/lib/data-i18n'
import { amenityLabel, joinLabels, rockTypeLabel, seasonLabel } from '@/lib/data-i18n/enum-labels'
import { buildHreflangAlternates, buildOgLocale } from '@/lib/i18n-metadata'
import CragDetailClient from './CragDetailClient'

// 強制動態渲染，確保在 runtime 取得正確的 API URL
export const dynamic = 'force-dynamic'

type CragFaqT = Awaited<ReturnType<typeof getTranslations<'CragFaq'>>>
type CragDataT = Awaited<ReturnType<typeof getTranslations<'CragData'>>>

/**
 * 把岩場 metadata 轉成當前語系的顯示用文字
 * 說明類欄位走對照檔（日文 → 英文 → 中文），枚舉值走訊息檔
 */
function localizeCragMetadata(
  crag: CragMetadata,
  overlays: CragOverlay[],
  tData: CragDataT
): CragMetadata {
  return {
    ...crag,
    description: localizeCragText(overlays, crag.description),
    parking: localizeCragText(overlays, crag.parking),
    type: rockTypeLabel(tData, crag.type),
    rockType: rockTypeLabel(tData, crag.rockType),
    amenities: crag.amenities.map((amenity) => amenityLabel(tData, amenity)),
    seasons: crag.seasons.map((season) => seasonLabel(tData, season)),
    liveVideoTitle: crag.liveVideoTitle
      ? localizeCragText(overlays, crag.liveVideoTitle)
      : crag.liveVideoTitle,
    liveVideoDescription: crag.liveVideoDescription
      ? localizeCragText(overlays, crag.liveVideoDescription)
      : crag.liveVideoDescription,
  }
}

// 根據岩場資料自動生成 FAQ（rawType 為未翻譯的資料值，供判斷裝備用）
function generateCragFaqs(
  crag: CragMetadata,
  rawType: string,
  t: CragFaqT,
  tData: CragDataT,
  locale: string
) {
  const faqs: { question: string; answer: string }[] = []
  const { name } = crag
  // 英文句子之間需要空白，中日文不需要
  const sentenceGap = locale === 'en' ? ' ' : ''

  // Q1: 怎麼去
  if (crag.location) {
    const parts = [
      t('howToGetLocation', { name, location: crag.location }),
      crag.approach ? t('howToGetApproach', { approach: crag.approach }) : '',
      crag.parking ? t('howToGetParking', { parking: crag.parking }) : '',
    ]
    faqs.push({
      question: t('howToGetQ', { name }),
      answer: parts.filter(Boolean).join(sentenceGap),
    })
  }

  // Q2: 適合初學者嗎（解析難度範圍中的最低難度，支援 5.6、5.10a 等格式）
  if (crag.difficulty && crag.routes) {
    const lowestGradeMatch = crag.difficulty.match(/5\.(\d+)/)
    const isBeginnerFriendly = lowestGradeMatch ? parseInt(lowestGradeMatch[1], 10) <= 7 : false
    faqs.push({
      question: t('beginnerQ', { name }),
      answer: t('beginnerA', {
        name,
        routes: String(crag.routes),
        difficulty: crag.difficulty,
        beginner: isBeginnerFriendly ? 'yes' : 'no',
      }),
    })
  }

  // Q3: 最佳季節
  if (crag.seasons.length > 0) {
    faqs.push({
      question: t('seasonQ', { name }),
      answer: t('seasonA', { name, seasons: joinLabels(tData, crag.seasons) }),
    })
  }

  // Q4: 岩質與類型
  if (crag.rockType) {
    const parts = [
      t('rockA', { name, rockType: crag.rockType, type: crag.type }),
      crag.height ? t('rockHeight', { height: crag.height }) : '',
    ]
    faqs.push({
      question: t('rockQ', { name }),
      answer: parts.filter(Boolean).join(sentenceGap),
    })
  }

  // Q5: 需要什麼裝備
  const needsTradGear = rawType.includes('傳統攀登') || rawType.includes('mixed')
  faqs.push({
    question: t('gearQ', { name }),
    answer: t('gearA', { name, gear: needsTradGear ? 'trad' : 'sport' }),
  })

  return faqs
}

// 生成 FAQPage JSON-LD
function generateFaqJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

// 生成 BreadcrumbList JSON-LD
function generateBreadcrumbJsonLd(crag: CragMetadata, id: string, cragLabel: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'NobodyClimb',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: cragLabel,
        item: `${SITE_URL}/crag`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: crag.name,
        item: `${SITE_URL}/crag/${id}`,
      },
    ],
  }
}

// 生成 VideoObject JSON-LD（即時影像）
function generateVideoJsonLd(
  crag: CragMetadata,
  id: string,
  liveVideoId: string,
  t: CragFaqT,
  liveVideoTitle?: string,
  liveVideoDescription?: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: liveVideoTitle || t('liveVideoName', { name: crag.name }),
    description: liveVideoDescription || t('liveVideoDescription', { name: crag.name }),
    thumbnailUrl: `https://img.youtube.com/vi/${liveVideoId}/maxresdefault.jpg`,
    contentUrl: `https://www.youtube.com/watch?v=${liveVideoId}`,
    embedUrl: `https://www.youtube.com/embed/${liveVideoId}`,
    publication: {
      '@type': 'BroadcastEvent',
      isLiveBroadcast: true,
    },
  }
}

// 生成 Place JSON-LD 結構化數據
function generateCragJsonLd(crag: CragMetadata, id: string, t: CragFaqT) {
  return {
    '@context': 'https://schema.org',
    '@type': ['Place', 'TouristAttraction', 'SportsActivityLocation'],
    '@id': `${SITE_URL}/crag/${id}`,
    name: crag.name,
    alternateName: crag.englishName !== crag.name ? crag.englishName : undefined,
    description: crag.description,
    url: `${SITE_URL}/crag/${id}`,
    image: `${SITE_URL}${OG_IMAGE}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: crag.location,
      addressCountry: 'TW',
    },
    // 地理座標 - 幫助 Google 地圖和本地搜尋
    ...(crag.latitude && crag.longitude
      ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: crag.latitude,
            longitude: crag.longitude,
          },
        }
      : {}),
    hasMap: crag.googleMapsUrl,
    amenityFeature: crag.amenities?.map((amenity) => ({
      '@type': 'LocationFeatureSpecification',
      name: amenity,
      value: true,
    })),
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: t('propCragType'),
        value: crag.type,
      },
      {
        '@type': 'PropertyValue',
        name: t('propRockType'),
        value: crag.rockType,
      },
      {
        '@type': 'PropertyValue',
        name: t('propRouteCount'),
        value: crag.routes,
      },
      {
        '@type': 'PropertyValue',
        name: t('propDifficulty'),
        value: crag.difficulty,
      },
      crag.height && {
        '@type': 'PropertyValue',
        name: t('propHeight'),
        value: crag.height,
      },
      crag.approach && {
        '@type': 'PropertyValue',
        name: t('propApproach'),
        value: crag.approach,
      },
    ].filter(Boolean),
    isAccessibleForFree: true,
    publicAccess: true,
    sport: t('sport'),
  }
}

// 動態生成 metadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; locale: string }>
}): Promise<Metadata> {
  const { id, locale } = await params
  const apiCrag = await fetchCragById(id)

  const t = await getTranslations({ locale, namespace: 'CragPage' })

  if (!apiCrag) {
    return {
      title: t('metaNotFound'),
      description: t('metaNotFoundDesc'),
    }
  }

  const [tFaq, tData, overlays] = await Promise.all([
    getTranslations({ locale, namespace: 'CragFaq' }),
    getTranslations({ locale, namespace: 'CragData' }),
    loadCragOverlays(locale, apiCrag.id),
  ])
  const crag = localizeCragMetadata(assembleCragMetadata(apiCrag), overlays, tData)
  const title = `${crag.name} - ${t('metaTitleSuffix')}`
  const description =
    crag.description?.substring(0, 160) ||
    tFaq('metaDescription', {
      name: crag.name,
      location: crag.location,
      routes: String(crag.routes),
      difficulty: crag.difficulty,
      rockType: crag.rockType,
    })
  const ogLocale = buildOgLocale(locale)

  // Title 模板：包含關鍵資訊提升點擊率
  const pageTitle = crag.routes
    ? tFaq('metaTitleWithRoutes', {
        name: crag.name,
        routes: String(crag.routes),
        difficulty: crag.difficulty,
      })
    : tFaq('metaTitle', { name: crag.name, suffix: t('metaTitleSuffix') })

  return {
    title: pageTitle,
    description,
    keywords: [
      crag.name,
      crag.englishName,
      tFaq('keywordClimbing', { name: crag.name }),
      tFaq('keywordRoutes', { name: crag.name }),
      t('metaKeyword1'),
      t('metaKeyword2'),
      crag.type,
      crag.rockType,
      crag.location,
      tFaq('keywordTaiwan'),
      tFaq('keywordOutdoor'),
    ].filter(Boolean),
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      type: 'website',
      url: `${SITE_URL}/crag/${id}`,
      images: [
        {
          url: `${SITE_URL}${OG_IMAGE}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: ogLocale.locale,
      alternateLocale: ogLocale.alternateLocale,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [`${SITE_URL}${OG_IMAGE}`],
    },
    alternates: {
      canonical: `${SITE_URL}/crag/${id}`,
      languages: buildHreflangAlternates(`/crag/${id}`),
    },
  }
}

export default async function CragDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>
}) {
  const { id, locale } = await params
  const [apiCrag, tFaq, tData, tPage] = await Promise.all([
    fetchCragById(id),
    getTranslations({ locale, namespace: 'CragFaq' }),
    getTranslations({ locale, namespace: 'CragData' }),
    getTranslations({ locale, namespace: 'CragPage' }),
  ])
  const rawCrag = apiCrag ? assembleCragMetadata(apiCrag) : null
  const crag =
    rawCrag && apiCrag
      ? localizeCragMetadata(rawCrag, await loadCragOverlays(locale, apiCrag.id), tData)
      : null
  const faqs = crag && rawCrag ? generateCragFaqs(crag, rawCrag.type, tFaq, tData, locale) : []

  return (
    <>
      {/* Place JSON-LD 結構化數據 */}
      {crag && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateCragJsonLd(crag, id, tFaq)),
          }}
        />
      )}
      {/* BreadcrumbList JSON-LD */}
      {crag && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateBreadcrumbJsonLd(crag, id, tPage('breadcrumbCrag'))),
          }}
        />
      )}
      {/* VideoObject JSON-LD（即時影像） */}
      {crag?.liveVideoId && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              generateVideoJsonLd(
                crag,
                id,
                crag.liveVideoId,
                tFaq,
                crag.liveVideoTitle ?? undefined,
                crag.liveVideoDescription ?? undefined
              )
            ),
          }}
        />
      )}
      {/* FAQPage JSON-LD 結構化數據 */}
      {faqs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateFaqJsonLd(faqs)),
          }}
        />
      )}
      <CragDetailClient params={params} />
      {/* FAQ 區塊 - 頁面上可見的問答內容（Google 要求 FAQ Schema 對應的內容必須可見） */}
      {faqs.length > 0 && crag && (
        <section className="container mx-auto px-4 pb-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-6 text-xl font-medium text-[#1B1A1A]">
              {tFaq('title', { name: crag.name })}
            </h2>
            <div className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
              {faqs.map((faq, index) => (
                <details key={index} className="group">
                  <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-medium text-[#1B1A1A] hover:bg-gray-50">
                    {faq.question}
                    <span className="ml-2 shrink-0 text-gray-400 transition-transform group-open:rotate-180">
                      ▼
                    </span>
                  </summary>
                  <p className="px-5 pb-4 text-sm leading-relaxed text-[#6D6C6C]">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
