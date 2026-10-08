'use client'

import { useTranslations } from 'next-intl'
import { ImageProcessError } from '@/lib/utils/image'

/**
 * 回傳一個函式：把圖片上傳／處理流程拋出的錯誤轉成目前語系的顯示文字。
 *
 * - `ImageProcessError`（`lib/utils/image.ts` 拋出）依 `code` 查 `LibMisc.imageErrors.*`
 * - 其他 `Error` 沿用原本行為，顯示 `error.message`
 * - 其餘情況回傳呼叫端給的 fallback
 */
export function useImageErrorMessage() {
  const t = useTranslations('LibMisc')

  return (error: unknown, fallback: string): string => {
    if (error instanceof ImageProcessError) return t(`imageErrors.${error.code}`)
    if (error instanceof Error) return error.message
    return fallback
  }
}
