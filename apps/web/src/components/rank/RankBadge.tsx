'use client'

import type { RankId } from '@nobodyclimb/types'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

interface RankConfig {
  bg: string
  text: string
  border: string
}

// 等級名稱與說明由訊息檔（RankBadge.tiers）提供，這裡只保留樣式
type RankTierKey = 'foothill' | 'wall' | 'ridge' | 'summit' | 'admin'

const RANK_CONFIG: Record<RankTierKey, RankConfig> = {
  foothill: {
    bg: 'bg-stone-100',
    text: 'text-stone-700',
    border: 'border-stone-300',
  },
  wall: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
  },
  ridge: {
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    border: 'border-amber-300',
  },
  summit: {
    bg: 'bg-indigo-100',
    text: 'text-indigo-800',
    border: 'border-indigo-300',
  },
  admin: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    border: 'border-purple-300',
  },
}

const SIZE_CLASSES = {
  sm: 'text-xs px-1.5 py-0.5 rounded',
  md: 'text-sm px-2 py-1 rounded-md font-medium',
  lg: 'text-base px-3 py-1.5 rounded-lg font-semibold',
}

interface RankBadgeProps {
  tier: RankId
  size?: 'sm' | 'md' | 'lg'
  showTooltip?: boolean
  className?: string
}

export function RankBadge({ tier, size = 'sm', showTooltip = false, className }: RankBadgeProps) {
  const t = useTranslations('RankBadge')
  const tierKey: RankTierKey = tier in RANK_CONFIG ? (tier as RankTierKey) : 'foothill'
  const config = RANK_CONFIG[tierKey]
  const display = t(`tiers.${tierKey}.display`)

  const badge = (
    <span
      className={cn(
        'inline-flex items-center border font-medium',
        config.bg,
        config.text,
        config.border,
        SIZE_CLASSES[size],
        className
      )}
    >
      {display}
    </span>
  )

  if (!showTooltip) return badge

  return (
    <span className="group relative inline-flex">
      {badge}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-48 -translate-x-1/2 rounded-lg border border-border bg-white px-3 py-2 text-xs text-text-subtle shadow-lg opacity-0 transition-opacity group-hover:opacity-100">
        <span className="mb-1 block font-semibold text-text-main">
          {t('levelLabel', { rank: display })}
        </span>
        <span className="block">{t(`tiers.${tierKey}.description`)}</span>
        <span className="mt-1 block text-text-subtle">{t('levelUpHint')}</span>
      </span>
    </span>
  )
}
