'use client'

import { useTranslations } from 'next-intl'
import { useCallback } from 'react'
import type { Category } from '@/lib/games/rope-system/types'

/**
 * 回傳依目前語系取得題目類別名稱與說明的函式。
 * 類別資料仍以 `lib/games/rope-system/constants.ts` 為準；訊息檔沒有對應 key 時回退為原始文字。
 */
export function useCategoryText() {
  const t = useTranslations('RopeGame.categories')

  return useCallback(
    (category: Pick<Category, 'id' | 'name' | 'description'>) => {
      const nameKey = `${category.id}.name` as Parameters<typeof t>[0]
      const descriptionKey = `${category.id}.description` as Parameters<typeof t>[0]
      return {
        name: t.has(nameKey) ? t(nameKey) : category.name,
        description: t.has(descriptionKey) ? t(descriptionKey) : category.description,
      }
    },
    [t]
  )
}
