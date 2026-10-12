'use client'

import { useLocale } from 'next-intl'
import { useCallback } from 'react'
import en from './training-plan.en.json'
import ja from './training-plan.ja.json'

/**
 * 訓練計畫內容（週主題、每日標題與說明、練習項目）的譯文字典。
 * 資料來源是 `@nobodyclimb/constants` 的 `TRAINING_PLANS`（繁中），這裡以「繁中原文 → 譯文」對照，
 * 不改動共用 package 的資料結構；查不到譯文時回退為繁中原文。
 */
const DICTIONARIES: Record<string, Record<string, string>> = { en, ja }

export function translateTrainingText(text: string, locale: string): string {
  return DICTIONARIES[locale]?.[text] ?? text
}

/** 回傳依目前語系翻譯訓練計畫文字的函式 */
export function useTrainingText() {
  const locale = useLocale()
  return useCallback((text: string) => translateTrainingText(text, locale), [locale])
}
