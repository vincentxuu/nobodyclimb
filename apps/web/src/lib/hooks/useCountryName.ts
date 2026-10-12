'use client'

import { useMessages } from 'next-intl'
import { getCountryMessageKey } from '@/lib/utils/country'

/**
 * 回傳一個函式：把資料庫存的中文國名（如「台灣」）轉成目前語系的顯示名稱。
 * 不在對照表內的國名（使用者自行輸入）原樣回傳。
 */
export function useCountryName() {
  const messages = useMessages() as Record<string, unknown>
  const countryMessages = (messages.Countries ?? {}) as Record<string, string>

  return (country: string): string => {
    const key = getCountryMessageKey(country)
    return (key && countryMessages[key]) || country
  }
}
