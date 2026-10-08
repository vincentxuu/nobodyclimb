'use client'

import type { PersonalityType } from '@nobodyclimb/types'
import { Mountain } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useLocalizedPersonality } from '@/lib/quiz/personality-i18n'

export function CollectionCard({ personality: rawPersonality }: { personality: PersonalityType }) {
  const t = useTranslations('Quiz.result')
  const personality = useLocalizedPersonality(rawPersonality)

  return (
    <Link
      href={`/quiz/result/${personality.code.toLowerCase()}`}
      className="group rounded-2xl border border-gray-200 p-5 transition-all hover:border-gray-300 hover:shadow-md"
    >
      <div
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ backgroundColor: `${personality.color}15` }}
      >
        <Mountain className="h-8 w-8" style={{ color: personality.color }} />
      </div>

      <div
        className="mb-1 text-xs font-semibold uppercase tracking-wider"
        style={{ color: personality.color }}
      >
        {personality.code}
      </div>
      <h2 className="mb-0.5 text-lg font-bold text-gray-900 group-hover:underline">
        {personality.name}
      </h2>
      {personality.name !== personality.nameEn && (
        <p className="mb-2 text-sm text-gray-500">{personality.nameEn}</p>
      )}
      <p className="text-sm italic text-gray-400">
        {t('taglineQuote', { tagline: personality.tagline })}
      </p>
    </Link>
  )
}
