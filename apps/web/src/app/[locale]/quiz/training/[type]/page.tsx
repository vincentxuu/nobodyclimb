import { getPersonalityType, PERSONALITY_TYPES } from '@nobodyclimb/constants'
import type { PersonalityTypeCode } from '@nobodyclimb/types'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { TrainingPageClient } from '@/components/quiz/training/TrainingPageClient'
import { SITE_NAME } from '@/lib/constants'

const VALID_CODES = PERSONALITY_TYPES.map((t) => t.code.toLowerCase())

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
  const t = await getTranslations({ locale, namespace: 'Metadata.quizTraining' })

  if (!personality) {
    return { title: t('notFound') }
  }

  const tPersonality = await getTranslations({ locale, namespace: 'Quiz.personalities' })
  const name = tPersonality(`${code}.name`)

  return {
    title: t('title', { name, siteName: SITE_NAME }),
    description: t('description', { name }),
  }
}

export default async function TrainingPage({ params }: Props) {
  const { type } = await params
  const code = type.toUpperCase() as PersonalityTypeCode
  const personality = getPersonalityType(code)

  if (!personality) {
    notFound()
  }

  return <TrainingPageClient personality={personality} />
}
