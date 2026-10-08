'use client'

import { useTranslations } from 'next-intl'

/** 編輯器動態載入期間的佔位畫面 */
export function EditorLoading() {
  const t = useTranslations('Editor')

  return (
    <div className="flex h-[300px] items-center justify-center rounded-lg border border-[#E5E5E5] bg-gray-50">
      <span className="text-gray-400">{t('loading')}</span>
    </div>
  )
}
