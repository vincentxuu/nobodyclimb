'use client'

import { getTrainingPlan } from '@nobodyclimb/constants'
import type { PersonalityType } from '@nobodyclimb/types'
import { motion } from 'framer-motion'
import { ArrowRight, Dumbbell, Lock } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { useTrainingText } from '@/lib/quiz/training-i18n'

export function ResultTraining({ personality }: { personality: PersonalityType }) {
  const t = useTranslations('Quiz.result')
  const tt = useTrainingText()
  const { isSignedIn } = useAuth()
  const plan = getTrainingPlan(personality.code)
  if (!plan || plan.weeks.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="mb-10"
    >
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
        <Dumbbell className="h-5 w-5" style={{ color: personality.color }} />
        {t('trainingTitle')}
      </h2>

      <div className="space-y-3">
        {plan.weeks.map((week) => {
          const isLocked = !isSignedIn && week.weekNumber > 1

          return (
            <div
              key={week.weekNumber}
              className={`rounded-xl border border-gray-200 p-4 ${isLocked ? 'relative overflow-hidden' : ''}`}
            >
              {isLocked && <div className="absolute inset-0 z-10 backdrop-blur-xs" />}
              <h3 className="mb-2 text-sm font-semibold text-gray-700">
                {t('weekHeading', { week: week.weekNumber, theme: tt(week.theme) })}
              </h3>
              <div className="space-y-1.5">
                {week.days.map((day) => (
                  <div
                    key={day.dayNumber}
                    className="flex items-center gap-2 text-sm text-gray-600"
                  >
                    <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300" />
                    {t('dayHeading', { day: day.dayNumber, title: tt(day.title) })}
                    <span className="ml-auto text-xs text-gray-400">
                      {t('minutes', { count: day.duration })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4">
        {isSignedIn ? (
          <Link
            href={`/quiz/training/${personality.code.toLowerCase()}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: personality.color }}
          >
            {t('goTraining')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <Link
            href="/auth/login"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Lock className="h-4 w-4" />
            {t('loginUnlock')}
          </Link>
        )}
      </div>
    </motion.div>
  )
}
