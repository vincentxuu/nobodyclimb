import { PERSONALITY_TYPES } from '@nobodyclimb/constants'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { CollectionCard } from '@/components/quiz/CollectionCard'
import { SITE_NAME, SITE_URL } from '@/lib/constants'
import { buildHreflangAlternates, buildOgLocale } from '@/lib/i18n-metadata'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Metadata.quizCollection' })
  const ogLocale = buildOgLocale(locale)
  const title = t('title', { siteName: SITE_NAME })

  return {
    title,
    description: t('description'),
    alternates: {
      languages: buildHreflangAlternates('/quiz/collection'),
    },
    openGraph: {
      title,
      description: t('ogDescription'),
      url: `${SITE_URL}/quiz/collection`,
      images: [{ url: `${SITE_URL}/quiz/og/default.png`, width: 1200, height: 628 }],
      type: 'website',
      locale: ogLocale.locale,
      alternateLocale: ogLocale.alternateLocale,
    },
  }
}

export default async function CollectionPage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Quiz.collection' })

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:py-12">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold text-gray-900 md:text-4xl">{t('title')}</h1>
        <p className="text-gray-500">{t('subtitle')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PERSONALITY_TYPES.map((type) => (
          <CollectionCard key={type.code} personality={type} />
        ))}
      </div>
    </div>
  )
}
