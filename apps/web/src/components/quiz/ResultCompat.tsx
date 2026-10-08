'use client'

import { getPersonalityType } from '@nobodyclimb/constants'
import type { PersonalityType } from '@nobodyclimb/types'
import { motion } from 'framer-motion'
import { Heart, Mountain, Swords } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { usePersonalityLocalizer } from '@/lib/quiz/personality-i18n'

export function ResultCompat({ personality }: { personality: PersonalityType }) {
  const t = useTranslations('Quiz.result')
  const localize = usePersonalityLocalizer()
  const rawPartner = getPersonalityType(personality.bestPartner)
  const rawRival = getPersonalityType(personality.worstMatch)

  if (!rawPartner || !rawRival) return null

  const partner = localize(rawPartner)
  const rival = localize(rawRival)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="mb-10"
    >
      <h2 className="mb-4 text-lg font-semibold text-gray-900">{t('compatTitle')}</h2>

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href={`/quiz/result/${partner.code.toLowerCase()}`}
          className="group rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 transition-colors hover:bg-emerald-50"
        >
          <div className="mb-3 flex items-center gap-2">
            <Heart className="h-5 w-5 text-emerald-500" />
            <span className="text-sm font-medium text-emerald-700">{t('bestPartner')}</span>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${partner.color}15` }}
            >
              <Mountain className="h-6 w-6" style={{ color: partner.color }} />
            </div>
            <div>
              <div className="font-semibold text-gray-900 group-hover:underline">
                {partner.name}
              </div>
              {partner.name !== partner.nameEn && (
                <div className="text-sm text-gray-500">{partner.nameEn}</div>
              )}
            </div>
          </div>
        </Link>

        <Link
          href={`/quiz/result/${rival.code.toLowerCase()}`}
          className="group rounded-2xl border border-orange-200 bg-orange-50/50 p-5 transition-colors hover:bg-orange-50"
        >
          <div className="mb-3 flex items-center gap-2">
            <Swords className="h-5 w-5 text-orange-500" />
            <span className="text-sm font-medium text-orange-700">{t('worstMatch')}</span>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${rival.color}15` }}
            >
              <Mountain className="h-6 w-6" style={{ color: rival.color }} />
            </div>
            <div>
              <div className="font-semibold text-gray-900 group-hover:underline">{rival.name}</div>
              {rival.name !== rival.nameEn && (
                <div className="text-sm text-gray-500">{rival.nameEn}</div>
              )}
            </div>
          </div>
        </Link>
      </div>
    </motion.div>
  )
}
