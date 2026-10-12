'use client'

import { useMessages } from 'next-intl'

interface TagTextMessages {
  dimensions?: Record<string, { name?: string; description?: string }>
  options?: Record<string, { label?: string; description?: string }>
  templates?: Record<string, string>
}

/**
 * 依目前語系取得系統標籤／維度的顯示文字。
 *
 * 標籤與維度的 id（如 `sys_style_cult_crack`）是存進資料庫的值，不可翻譯；
 * 這裡只用 id 去訊息檔 `BiographyTags` 查顯示文字。
 * 查不到（自訂標籤、未知 id）時回傳 fallback，也就是常數或 API 給的原文字。
 */
export function useBiographyTagText() {
  const messages = useMessages() as Record<string, unknown>
  const tagMessages = (messages.BiographyTags ?? {}) as TagTextMessages

  const dimensionName = (dimensionId: string, fallback: string): string =>
    tagMessages.dimensions?.[dimensionId]?.name ?? fallback

  const dimensionDescription = (dimensionId: string, fallback: string): string =>
    tagMessages.dimensions?.[dimensionId]?.description ?? fallback

  const tagLabel = (optionId: string, fallback: string): string =>
    tagMessages.options?.[optionId]?.label ?? fallback

  const tagDescription = (optionId: string, fallback: string): string =>
    tagMessages.options?.[optionId]?.description ?? fallback

  /** 動態標籤的顯示模板（含 `{value}` 佔位符，由呼叫端自行 replace） */
  const tagTemplate = (optionId: string, fallback: string): string =>
    tagMessages.templates?.[optionId] ?? fallback

  return { dimensionName, dimensionDescription, tagLabel, tagDescription, tagTemplate }
}
