import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { QuizLanding } from '@/components/quiz/QuizLanding'
import { SITE_NAME, SITE_URL } from '@/lib/constants'
import { buildHreflangAlternates, buildOgLocale } from '@/lib/i18n-metadata'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Metadata.quizLanding' })
  const ogLocale = buildOgLocale(locale)
  const title = t('title', { siteName: SITE_NAME })

  return {
    title,
    description: t('description'),
    alternates: {
      languages: buildHreflangAlternates('/quiz'),
    },
    openGraph: {
      title,
      description: t('ogDescription'),
      url: `${SITE_URL}/quiz`,
      images: [{ url: `${SITE_URL}/quiz/og/default.png`, width: 1200, height: 628 }],
      type: 'website',
      locale: ogLocale.locale,
      alternateLocale: ogLocale.alternateLocale,
    },
  }
}

export default function QuizPage() {
  return <QuizLanding />
}
