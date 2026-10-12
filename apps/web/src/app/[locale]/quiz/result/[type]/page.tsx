import { getPersonalityType, PERSONALITY_TYPES } from '@nobodyclimb/constants'
import type { PersonalityTypeCode } from '@nobodyclimb/types'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { ResultPageClient } from '@/components/quiz/ResultPageClient'
import { SITE_NAME, SITE_URL } from '@/lib/constants'
import { buildHreflangAlternates, buildOgLocale } from '@/lib/i18n-metadata'

const VALID_CODES = PERSONALITY_TYPES.map((t) => t.code.toLowerCase())

// 描述摘要的字數上限：英文字元資訊密度較低，取較長的片段
const EXCERPT_LENGTH: Record<string, number> = { en: 160 }
const DEFAULT_EXCERPT_LENGTH = 100

export function generateStaticParams() {
  const locales = ['zh', 'en', 'ja']
  return locales.flatMap((locale) => VALID_CODES.map((type) => ({ locale, type })))
}

type Props = {
  params: Promise<{ locale: string; type: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, type } = await params
  const code = type.toUpperCase() as PersonalityTypeCode
  const personality = getPersonalityType(code)
  const t = await getTranslations({ locale, namespace: 'Metadata.quizResult' })

  if (!personality) {
    return { title: t('notFound') }
  }

  const tPersonality = await getTranslations({ locale, namespace: 'Quiz.personalities' })
  const ogLocale = buildOgLocale(locale)
  const title = t('title', {
    name: tPersonality(`${code}.name`),
    nameEn: personality.nameEn,
    siteName: SITE_NAME,
  })
  const description = t('description', {
    tagline: tPersonality(`${code}.tagline`),
    excerpt: tPersonality(`${code}.description`).slice(
      0,
      EXCERPT_LENGTH[locale] ?? DEFAULT_EXCERPT_LENGTH
    ),
  })

  return {
    title,
    description,
    alternates: {
      languages: buildHreflangAlternates(`/quiz/result/${type}`),
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/quiz/result/${type}`,
      images: [{ url: `${SITE_URL}/quiz/og/${type}.png`, width: 1200, height: 628 }],
      type: 'website',
      locale: ogLocale.locale,
      alternateLocale: ogLocale.alternateLocale,
    },
  }
}

export default async function ResultPage({ params }: Props) {
  const { type } = await params
  const code = type.toUpperCase() as PersonalityTypeCode
  const personality = getPersonalityType(code)

  if (!personality) {
    notFound()
  }

  return <ResultPageClient personality={personality} />
}
