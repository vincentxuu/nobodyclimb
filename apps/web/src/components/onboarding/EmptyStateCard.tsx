'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmptyStateCardProps {
  icon?: ReactNode
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
  className?: string
  variant?: 'default' | 'encouragement' | 'minimal'
}

// 針對不同場景的鼓勵文案。
// 值是訊息檔 `Onboarding.emptyStates` 之下的 key，顯示文字請用 useEmptyStateMessage() 取得。
export const EMPTY_STATE_MESSAGES = {
  // 人物誌相關
  biography: {
    noStories: 'biography.noStories',
    noOneLiners: 'biography.noOneLiners',
    noTags: 'biography.noTags',
    noAvatar: 'biography.noAvatar',
  },
  // 社群相關
  social: {
    noFollowing: 'social.noFollowing',
    noLikes: 'social.noLikes',
    noComments: 'social.noComments',
  },
  // 書籤相關
  bookmarks: {
    noBookmarks: 'bookmarks.noBookmarks',
  },
  // 通用
  generic: {
    noContent: 'generic.noContent',
  },
} as const

type EmptyStateGroups = typeof EMPTY_STATE_MESSAGES
export type EmptyStateMessageKey = {
  [G in keyof EmptyStateGroups]: EmptyStateGroups[G][keyof EmptyStateGroups[G]]
}[keyof EmptyStateGroups]

/**
 * 依目前語系取得空狀態文案，可直接展開給 EmptyStateCard：
 * `<EmptyStateCard {...useEmptyStateMessage(EMPTY_STATE_MESSAGES.biography.noStories)} />`
 */
export function useEmptyStateMessage(key: EmptyStateMessageKey) {
  const t = useTranslations('Onboarding.emptyStates')
  return {
    title: t(`${key}.title`),
    description: t(`${key}.description`),
    actionLabel: t(`${key}.actionLabel`),
  }
}

export function EmptyStateCard({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className,
  variant = 'default',
}: EmptyStateCardProps) {
  const variants = {
    default: 'bg-white border border-gray-200 shadow-xs',
    encouragement: 'bg-primary/5 border border-primary/20',
    minimal: 'bg-transparent',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('rounded-lg p-8 text-center', variants[variant], className)}
    >
      {icon && (
        <div className="mb-4 flex justify-center">
          <div
            className={cn(
              'flex h-16 w-16 items-center justify-center rounded-full',
              variant === 'encouragement' ? 'bg-primary/10' : 'bg-gray-100'
            )}
          >
            {icon}
          </div>
        </div>
      )}

      <h3 className="mb-2 text-lg font-medium text-[#1B1A1A]">{title}</h3>
      <p className="mb-6 text-[#6D6C6C]">{description}</p>

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        {actionLabel && onAction && (
          <Button
            onClick={onAction}
            className={cn(
              'min-w-[140px]',
              variant === 'encouragement' ? 'bg-primary text-white hover:bg-primary/90' : ''
            )}
          >
            {actionLabel}
          </Button>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <Button variant="outline" onClick={onSecondaryAction} className="min-w-[140px]">
            {secondaryActionLabel}
          </Button>
        )}
      </div>
    </motion.div>
  )
}

export default EmptyStateCard
