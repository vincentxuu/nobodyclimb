'use client'

import { useLocale, useMessages } from 'next-intl'
import { routing } from '@/i18n/routing'

interface StoryTextMessages {
  categories?: Record<string, { name?: string; description?: string }>
  questions?: Record<string, { title?: string; subtitle?: string; placeholder?: string }>
}

/**
 * 依目前語系取得 `lib/constants/biography-stories.ts` 中故事題目／分類的顯示文字。
 *
 * 題目的 `field`（如 `climbing_origin`）與分類 `id`（如 `growth`）是資料欄位名，不可翻譯；
 * 這裡只用它們去訊息檔 `BiographyStories` 查顯示文字，查不到時回傳 fallback（常數原文字）。
 *
 * 預設語系（繁中）一律直接回傳 fallback：同一組 id 也會從 API（資料庫種子資料）帶回文字，
 * 且用字與常數檔不盡相同，繁中沿用呼叫端手上的原文才不會改變既有畫面。
 */
export function useBiographyStoryText() {
  const locale = useLocale()
  const messages = useMessages() as Record<string, unknown>
  const storyMessages: StoryTextMessages =
    locale === routing.defaultLocale ? {} : ((messages.BiographyStories ?? {}) as StoryTextMessages)

  const categoryName = (categoryId: string, fallback: string): string =>
    storyMessages.categories?.[categoryId]?.name ?? fallback

  const categoryDescription = (categoryId: string, fallback: string): string =>
    storyMessages.categories?.[categoryId]?.description ?? fallback

  const questionTitle = (field: string, fallback: string): string =>
    storyMessages.questions?.[field]?.title ?? fallback

  const questionSubtitle = (field: string, fallback: string): string =>
    storyMessages.questions?.[field]?.subtitle ?? fallback

  const questionPlaceholder = (field: string, fallback: string): string =>
    storyMessages.questions?.[field]?.placeholder ?? fallback

  return { categoryName, categoryDescription, questionTitle, questionSubtitle, questionPlaceholder }
}
