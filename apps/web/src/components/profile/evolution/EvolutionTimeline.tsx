'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Calendar, Cpu, FlaskConical, Timer } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import React from 'react'
import type { EvolutionRecord } from '@/lib/api/evolution'
import { toIntlLocale } from '@/lib/date-locale'

interface EvolutionTimelineProps {
  records: EvolutionRecord[]
}

// 人格類型顏色對應
const PERSONALITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  // P-types: amber/orange tones
  'P-Power': { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' },
  'P-Goal': { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
  'P-Bold': { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  // T-types: blue/indigo tones
  'T-Power': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  'T-Goal': { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-300' },
  'T-Bold': { bg: 'bg-violet-100', text: 'text-violet-800', border: 'border-violet-300' },
}

const DEFAULT_COLOR = { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' }

function getPersonalityColor(type: string) {
  return PERSONALITY_COLORS[type] || DEFAULT_COLOR
}

// 觸發類型標籤（labelKey 為訊息檔 `ProfileEvolution` 的 key）
const TRIGGER_CONFIG: Record<
  string,
  {
    labelKey: 'triggerQuiz' | 'triggerBehavior' | 'triggerCron'
    icon: React.ReactNode
    color: string
  }
> = {
  quiz: {
    labelKey: 'triggerQuiz',
    icon: <FlaskConical className="h-3 w-3" />,
    color: 'bg-blue-50 text-blue-600',
  },
  behavior: {
    labelKey: 'triggerBehavior',
    icon: <Timer className="h-3 w-3" />,
    color: 'bg-emerald-50 text-emerald-600',
  },
  cron: {
    labelKey: 'triggerCron',
    icon: <Cpu className="h-3 w-3" />,
    color: 'bg-gray-50 text-gray-600',
  },
}

function TriggerBadge({ trigger }: { trigger: string }) {
  const t = useTranslations('ProfileEvolution')
  const known = TRIGGER_CONFIG[trigger]
  const config = known || {
    icon: <Cpu className="h-3 w-3" />,
    color: 'bg-gray-50 text-gray-600',
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${config.color}`}
    >
      {config.icon}
      {known ? t(known.labelKey) : trigger}
    </span>
  )
}

function PersonalityTypeBadge({ type }: { type: string }) {
  const color = getPersonalityColor(type)
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${color.bg} ${color.text} ${color.border}`}
    >
      {type}
    </span>
  )
}

function AxisBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-12 text-right text-[11px] text-gray-500">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <span className="w-10 text-right text-[11px] font-medium text-gray-600">{value}%</span>
    </div>
  )
}

function formatDate(dateStr: string, locale: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString(toIntlLocale(locale), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function EvolutionTimeline({ records }: EvolutionTimelineProps) {
  const locale = useLocale()
  const t = useTranslations('ProfileEvolution')

  if (records.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 py-12 text-center">
        <Calendar className="mx-auto mb-2 h-8 w-8 text-gray-300" />
        <p className="text-sm text-gray-400">{t('timelineEmpty')}</p>
        <p className="mt-1 text-xs text-gray-300">{t('timelineEmptyHint')}</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-0 h-full w-0.5 bg-gray-200 md:left-6" />

      <div className="space-y-6">
        {records.map((record, index) => (
          <motion.div
            key={record.id}
            className="relative pl-10 md:pl-14"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            {/* Timeline node */}
            <div className="absolute left-2.5 top-3 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 shadow-xs md:left-4.5" />

            {/* Card */}
            <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-xs">
              {/* Header: date + trigger */}
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(record.calculated_at, locale)}
                </div>
                <TriggerBadge trigger={record.trigger} />
              </div>

              {/* Type change */}
              <div className="mb-3 flex items-center gap-2">
                {record.from_type ? (
                  <>
                    <PersonalityTypeBadge type={record.from_type} />
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                    <PersonalityTypeBadge type={record.to_type} />
                  </>
                ) : (
                  <>
                    <span className="text-xs text-gray-400">{t('initialType')}</span>
                    <PersonalityTypeBadge type={record.to_type} />
                  </>
                )}
                {record.consecutive_count > 1 && (
                  <span className="ml-auto text-[11px] text-gray-400">
                    {t('consecutiveCount', { count: record.consecutive_count })}
                  </span>
                )}
              </div>

              {/* Three-axis bars */}
              <div className="space-y-1.5">
                <AxisBar label={t('axisPower')} value={record.power_pct} color="bg-amber-400" />
                <AxisBar label={t('axisGoal')} value={record.goal_pct} color="bg-blue-400" />
                <AxisBar label={t('axisBold')} value={record.bold_pct} color="bg-rose-400" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
