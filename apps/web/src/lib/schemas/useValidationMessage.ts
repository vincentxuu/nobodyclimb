'use client'

import { useTranslations } from 'next-intl'

/**
 * 把 Zod schema 的錯誤訊息翻成目前語系。
 *
 * `lib/schemas/*` 的 schema 定義在模組層級、拿不到 `t`，所以錯誤訊息存的是
 * 訊息檔 `Validation` namespace 的 key（如 `bucketListTitleRequired`）。
 * 顯示錯誤的表單元件用這個 hook 回傳的函式翻譯；不是已知 key 的訊息
 * （例如 Zod 內建訊息）原樣回傳。
 */
export function useValidationMessage() {
  const t = useTranslations('Validation')

  return (message: string | undefined): string | undefined => {
    if (!message) return message
    const key = message as Parameters<typeof t>[0]
    return t.has(key) ? t(key) : message
  }
}
