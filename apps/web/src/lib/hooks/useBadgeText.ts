'use client'

import { useMessages } from 'next-intl'

interface BadgeTextMessages {
  categories?: Record<string, string>
  items?: Record<string, { name?: string; description?: string }>
}

/**
 * 依目前語系取得徽章／徽章分類的顯示文字。
 *
 * 徽章 id（如 `story_beginner`）與分類 id 是與後端對應的值，不可翻譯；
 * 這裡只用 id 去訊息檔 `Badges` 查顯示文字，查不到時回傳 fallback（常數原文字）。
 */
export function useBadgeText() {
  const messages = useMessages() as Record<string, unknown>
  const badgeMessages = (messages.Badges ?? {}) as BadgeTextMessages

  const badgeName = (badgeId: string, fallback: string): string =>
    badgeMessages.items?.[badgeId]?.name ?? fallback

  const badgeDescription = (badgeId: string, fallback: string): string =>
    badgeMessages.items?.[badgeId]?.description ?? fallback

  const categoryLabel = (categoryId: string, fallback: string): string =>
    badgeMessages.categories?.[categoryId] ?? fallback

  return { badgeName, badgeDescription, categoryLabel }
}
