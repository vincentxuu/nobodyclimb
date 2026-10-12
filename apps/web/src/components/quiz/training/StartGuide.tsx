'use client'

import { motion } from 'framer-motion'
import { Calendar, Clock, Sparkles, Target } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { LocalizedPersonality } from '@/lib/quiz/personality-i18n'

interface StartGuideProps {
  personality: LocalizedPersonality
}

export function StartGuide({ personality }: StartGuideProps) {
  const t = useTranslations('Quiz.training')

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 rounded-2xl border-2 border-dashed p-6"
      style={{ borderColor: `${personality.color}40` }}
    >
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5" style={{ color: personality.color }} />
        <h2 className="text-lg font-bold text-gray-900">{t('guideTitle')}</h2>
      </div>

      <p className="mb-4 text-sm text-gray-600">
        {t.rich('guideBody', {
          name: personality.name,
          strong: (chunks) => <strong>{chunks}</strong>,
        })}
      </p>

      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col items-center gap-1 rounded-xl bg-gray-50 p-3">
          <Calendar className="h-5 w-5 text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">{t('statWeeks')}</span>
          <span className="text-xs text-gray-500">{t('statWeeksLabel')}</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-xl bg-gray-50 p-3">
          <Target className="h-5 w-5 text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">{t('statDays')}</span>
          <span className="text-xs text-gray-500">{t('statDaysLabel')}</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-xl bg-gray-50 p-3">
          <Clock className="h-5 w-5 text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">{t('statDuration')}</span>
          <span className="text-xs text-gray-500">{t('statDurationLabel')}</span>
        </div>
      </div>
    </motion.div>
  )
}
