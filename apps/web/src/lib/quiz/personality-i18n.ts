'use client'

import type { PersonalityType } from '@nobodyclimb/types'
import { useTranslations } from 'next-intl'
import { useCallback } from 'react'

/**
 * 依目前語系在地化後的人格類型。
 * 文字欄位已換成當前語系的內容，`name` 為顯示用名稱（`nameZh` / `nameEn` 保留原值）。
 */
export interface LocalizedPersonality extends PersonalityType {
  name: string
}

/**
 * 回傳把 `@nobodyclimb/constants` 人格類型轉成當前語系的函式。
 * 人格資料（代碼、顏色、相性）仍以 constants 為準，這裡只替換顯示文字。
 */
export function usePersonalityLocalizer() {
  const t = useTranslations('Quiz.personalities')

  return useCallback(
    (personality: PersonalityType): LocalizedPersonality => {
      const { code } = personality
      return {
        ...personality,
        name: t(`${code}.name`),
        tagline: t(`${code}.tagline`),
        description: t(`${code}.description`),
        strengths: t.raw(`${code}.strengths`) as string[],
        blindSpots: t.raw(`${code}.blindSpots`) as string[],
        flowState: t(`${code}.flowState`),
        clutchState: t(`${code}.clutchState`),
      }
    },
    [t]
  )
}

/** 單一人格類型的在地化版本 */
export function useLocalizedPersonality(personality: PersonalityType): LocalizedPersonality {
  const localize = usePersonalityLocalizer()
  return localize(personality)
}
