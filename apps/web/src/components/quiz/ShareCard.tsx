'use client'

import type { PersonalityType } from '@nobodyclimb/types'
import type { DecodedScores } from '@/lib/quiz/decode-scores'
import type { LocalizedPersonality } from '@/lib/quiz/personality-i18n'
import { drawRadar } from './ResultRadar'

export type ShareCardSize = 'square' | 'story' | 'og'

/** 圖卡上已翻譯好的文字（canvas 繪製無法使用 hook，由呼叫端傳入） */
export interface ShareCardLabels {
  indexLabel: string
  tagline: string
  axisLabels: readonly [string, string, string]
}

const SIZES: Record<ShareCardSize, { width: number; height: number; label: string }> = {
  square: { width: 1080, height: 1080, label: 'IG/FB Post (1:1)' },
  story: { width: 1080, height: 1920, label: 'IG Story (9:16)' },
  og: { width: 1200, height: 628, label: 'OG/Twitter' },
}

function getDefaultPercents(code: string): [number, number, number] {
  const body = code[0] === 'P' ? 72 : 28
  const motive = code[1] === 'G' ? 72 : 28
  const mind = code[2] === 'B' ? 72 : 28
  return [body, motive, mind]
}

export async function generateShareCard(
  personality: LocalizedPersonality,
  scores: DecodedScores | null,
  size: ShareCardSize,
  labels: ShareCardLabels
): Promise<Blob> {
  const { width, height } = SIZES[size]
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, personality.color + '20')
  gradient.addColorStop(1, '#ffffff')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  // Accent bar
  ctx.fillStyle = personality.color
  ctx.fillRect(0, 0, width, 6)

  await document.fonts.ready

  const scale = width / 1080
  const isOg = size === 'og'
  const contentX = isOg ? width * 0.05 : width / 2
  const radarSize = isOg ? 280 : Math.min(360, height * 0.28) * scale

  // Radar chart
  const radarCanvas = document.createElement('canvas')
  radarCanvas.width = radarSize
  radarCanvas.height = radarSize
  const radarCtx = radarCanvas.getContext('2d')!
  const defaults = getDefaultPercents(personality.code)
  const percents: [number, number, number] = scores
    ? [scores.bodyPercent, scores.motivePercent, scores.mindPercent]
    : defaults
  drawRadar(radarCtx, radarSize, radarSize, percents, personality.color, labels.axisLabels)

  if (isOg) {
    ctx.drawImage(radarCanvas, width - radarSize - 40, (height - radarSize) / 2)
  } else {
    ctx.drawImage(radarCanvas, (width - radarSize) / 2, height * 0.38)
  }

  // Text
  const textX = isOg ? contentX + 40 : width / 2
  const textAlign = isOg ? 'left' : 'center'
  ctx.textAlign = textAlign as CanvasTextAlign

  // Code
  ctx.font = `600 ${24 * scale}px "Noto Sans TC", sans-serif`
  ctx.fillStyle = personality.color
  const codeY = isOg ? height * 0.25 : height * 0.1
  ctx.fillText(personality.code, textX, codeY)

  // Localized name
  ctx.font = `700 ${48 * scale}px "Noto Sans TC", sans-serif`
  ctx.fillStyle = '#1f2937'
  ctx.fillText(personality.name, textX, codeY + 56 * scale)

  // English name（與顯示名稱相同時不重複繪製）
  if (personality.name !== personality.nameEn) {
    ctx.font = `500 ${24 * scale}px "Noto Sans TC", sans-serif`
    ctx.fillStyle = '#6b7280'
    ctx.fillText(personality.nameEn, textX, codeY + 90 * scale)
  }

  // Tagline
  ctx.font = `italic ${20 * scale}px "Noto Sans TC", sans-serif`
  ctx.fillStyle = personality.color
  ctx.fillText(labels.tagline, textX, codeY + 130 * scale)

  // Grit/Flow index
  const isGoal = personality.code[1] === 'G'
  const indexValue = scores ? (isGoal ? scores.gritIndex : scores.flowIndex) : 72

  const indexY = isOg ? height * 0.75 : height * 0.75
  ctx.font = `500 ${18 * scale}px "Noto Sans TC", sans-serif`
  ctx.fillStyle = '#6b7280'
  ctx.fillText(`${labels.indexLabel}: ${Math.round(indexValue)}`, textX, indexY)

  // URL
  ctx.font = `400 ${16 * scale}px "Noto Sans TC", sans-serif`
  ctx.fillStyle = '#9ca3af'
  ctx.fillText('nobodyclimb.cc/quiz', isOg ? textX : width / 2, height - 30 * scale)

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png')
  })
}

export function getShareCardFilename(personality: PersonalityType): string {
  return `nobodyclimb-${personality.code}-${personality.nameEn.toLowerCase()}.png`
}

export { SIZES as SHARE_CARD_SIZES }
