import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { adaptGymToDetail } from '@/lib/adapters/gym-adapter'
import { fetchGymById } from '@/lib/api/server-fetch'
import { OG_IMAGE, SITE_NAME, SITE_URL } from '@/lib/constants'
import { loadGymOverlays, localizeGymDetail } from '@/lib/data-i18n'
import { facilityLabel, gymTypeLabel } from '@/lib/data-i18n/enum-labels'
import type { GymDetailData } from '@/lib/gym-data'
import { buildHreflangAlternates, buildOgLocale } from '@/lib/i18n-metadata'
import GymDetailClient from './GymDetailClient'

type GymDataT = Awaited<ReturnType<typeof getTranslations<'GymData'>>>

/**
 * 取得當前語系的岩館資料：說明類欄位走對照檔（日文 → 英文 → 中文）
 */
async function getLocalizedGym(id: string, locale: string): Promise<GymDetailData | null> {
  const [apiGym, overlays] = await Promise.all([fetchGymById(id), loadGymOverlays(locale)])
  return apiGym ? localizeGymDetail(adaptGymToDetail(apiGym), overlays) : null
}

// 生成 LocalBusiness JSON-LD 結構化數據
function generateGymJsonLd(gym: GymDetailData, id: string, tData: GymDataT) {
  // 格式化營業時間為 schema.org 格式
  const openingHoursSpec = []
  const dayMap: Record<string, string> = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
  }

  for (const [day, hours] of Object.entries(gym.openingHours)) {
    if (hours && hours !== '公休' && hours !== '休息') {
      // 解析時間格式 "10:00-22:00"
      const timeParts = hours.split('-')
      if (timeParts.length === 2) {
        openingHoursSpec.push({
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: dayMap[day],
          opens: timeParts[0].trim(),
          closes: timeParts[1].trim(),
        })
      }
    }
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'SportsActivityLocation',
    '@id': `${SITE_URL}/gym/${id}`,
    name: gym.name,
    alternateName: gym.nameEn !== gym.name ? gym.nameEn : undefined,
    description: gym.description,
    url: `${SITE_URL}/gym/${id}`,
    image: `${SITE_URL}${OG_IMAGE}`,
    telephone: gym.contact.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: gym.location.address,
      addressLocality: gym.location.district || gym.location.city,
      addressRegion: gym.location.city,
      addressCountry: 'TW',
    },
    geo:
      gym.location.latitude && gym.location.longitude
        ? {
            '@type': 'GeoCoordinates',
            latitude: gym.location.latitude,
            longitude: gym.location.longitude,
          }
        : undefined,
    openingHoursSpecification: openingHoursSpec.length > 0 ? openingHoursSpec : undefined,
    priceRange: gym.pricing.singleEntry
      ? `$${gym.pricing.singleEntry.weekday}-$${gym.pricing.singleEntry.weekend}`
      : undefined,
    aggregateRating:
      gym.rating > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: gym.rating,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
    amenityFeature: gym.facilities.map((facility) => ({
      '@type': 'LocationFeatureSpecification',
      name: facilityLabel(tData, facility),
      value: true,
    })),
    sameAs: [gym.contact.facebookUrl, gym.contact.instagramUrl, gym.contact.website].filter(
      Boolean
    ),
  }
}

// 動態生成 metadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; locale: string }>
}): Promise<Metadata> {
  const { id, locale } = await params
  const [gym, tData] = await Promise.all([
    getLocalizedGym(id, locale),
    getTranslations({ locale, namespace: 'GymData' }),
  ])

  if (!gym) {
    return {
      title: tData('metaNotFound'),
      description: tData('metaNotFoundDesc'),
    }
  }

  const typeLabel = gymTypeLabel(tData, gym.type)
  const title = `${gym.name} - ${typeLabel}`
  const description =
    gym.description?.substring(0, 160) ||
    tData('metaDescription', { name: gym.name, address: gym.location.address, type: typeLabel })
  const ogLocale = buildOgLocale(locale)

  return {
    title: gym.name,
    description,
    keywords: [
      gym.name,
      gym.nameEn,
      tData('keywordGym'),
      typeLabel,
      gym.location.city,
      tData('keywordIndoor'),
    ].filter(Boolean),
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      type: 'website',
      url: `${SITE_URL}/gym/${id}`,
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
      canonical: `${SITE_URL}/gym/${id}`,
      languages: buildHreflangAlternates(`/gym/${id}`),
    },
  }
}

export default async function GymDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>
}) {
  const { id, locale } = await params
  const [gym, tData] = await Promise.all([
    getLocalizedGym(id, locale),
    getTranslations({ locale, namespace: 'GymData' }),
  ])

  return (
    <>
      {/* LocalBusiness JSON-LD 結構化數據 */}
      {gym && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateGymJsonLd(gym, id, tData)),
          }}
        />
      )}
      <GymDetailClient params={params} />
    </>
  )
}
