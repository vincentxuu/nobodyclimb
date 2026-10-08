'use client'

import { useTranslations } from 'next-intl'
import { useCallback } from 'react'
import type { PostCategory } from '@/lib/types'

/**
 * 回傳依目前語系取得文章分類顯示名稱的函式。
 * 分類值（`PostCategory`）維持後端定義；未知的分類值原樣回傳。
 */
export function usePostCategoryLabel() {
  const t = useTranslations('BlogCategories')

  return useCallback(
    (value: PostCategory | null | undefined): string => {
      if (!value) return ''
      return t.has(value) ? t(value) : value
    },
    [t]
  )
}
