'use client'

import type { QuizQuestion as QuizQuestionType } from '@nobodyclimb/types'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import { useTranslations } from 'next-intl'

const AXIS_COLORS: Record<string, { bg: string; accent: string }> = {
  body: { bg: 'from-red-50/60 to-orange-50/40', accent: '#E84545' },
  motive: { bg: 'from-amber-50/60 to-yellow-50/40', accent: '#F7B731' },
  mind: { bg: 'from-emerald-50/60 to-teal-50/40', accent: '#27AE60' },
}

const LIKERT_OPTIONS = [
  { value: 1, emoji: '😐' },
  { value: 2, emoji: '🤔' },
  { value: 3, emoji: '😶' },
  { value: 4, emoji: '😊' },
  { value: 5, emoji: '🔥' },
] as const

interface Props {
  question: QuizQuestionType
  selectedValue: number | null
  onAnswer: (value: number) => void
  onPrev?: () => void
  questionIndex: number
}

export function QuizQuestion({ question, selectedValue, onAnswer, onPrev, questionIndex }: Props) {
  const t = useTranslations('Quiz')
  const axisStyle = AXIS_COLORS[question.axis] || AXIS_COLORS.body
  // 題目文字以題目 id 對應訊息檔；查不到時回退為 constants 內的繁中原文
  const questionKey = `questions.${question.id}` as Parameters<typeof t>[0]
  const questionText = t.has(questionKey) ? t(questionKey) : question.textZh

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={questionIndex}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="mb-3 flex justify-center">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
            style={{ backgroundColor: `${axisStyle.accent}15`, color: axisStyle.accent }}
          >
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: axisStyle.accent }}
            />
            {t(`axisLabels.${question.axis}`)}
          </span>
        </div>

        <p className="mb-8 text-center text-xl font-semibold leading-relaxed text-gray-900 md:text-2xl">
          {questionText}
        </p>

        <div className="space-y-2.5">
          {LIKERT_OPTIONS.map((option) => {
            const isSelected = selectedValue === option.value
            return (
              <motion.button
                key={option.value}
                onClick={() => onAnswer(option.value)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className={`flex w-full items-center gap-3 rounded-2xl border-2 px-5 py-4 text-left text-base transition-all duration-200 ${
                  isSelected
                    ? 'border-transparent font-medium text-white shadow-lg'
                    : 'border-gray-100 bg-white text-gray-700 shadow-xs hover:border-gray-200 hover:shadow-md'
                }`}
                style={
                  isSelected
                    ? { backgroundColor: axisStyle.accent, borderColor: axisStyle.accent }
                    : undefined
                }
              >
                <span className="text-lg">{option.emoji}</span>
                <span>{t(`likert.${option.value}`)}</span>
              </motion.button>
            )
          })}
        </div>

        {onPrev && (
          <motion.button
            onClick={onPrev}
            whileHover={{ x: -2 }}
            className="mt-8 flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-gray-600"
          >
            <ChevronLeft className="h-4 w-4" />
            {t('prevQuestion')}
          </motion.button>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
