'use client'

import { Check, Copy, Download, ImageIcon, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useMemo, useState } from 'react'
import type { DecodedScores } from '@/lib/quiz/decode-scores'
import type { LocalizedPersonality } from '@/lib/quiz/personality-i18n'
import {
  generateShareCard,
  getShareCardFilename,
  SHARE_CARD_SIZES,
  type ShareCardLabels,
  type ShareCardSize,
} from './ShareCard'

interface Props {
  open: boolean
  onClose: () => void
  personality: LocalizedPersonality
  scores: DecodedScores | null
}

export function ShareModal({ open, onClose, personality, scores }: Props) {
  const t = useTranslations('Quiz.share')
  const tResult = useTranslations('Quiz.result')
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  const resultUrl =
    typeof window !== 'undefined'
      ? window.location.href
      : `https://nobodyclimb.cc/quiz/result/${personality.code.toLowerCase()}`

  // 圖卡上的文字（畫在 canvas 上，需事先翻好傳入）
  const cardLabels = useMemo<ShareCardLabels>(
    () => ({
      indexLabel: personality.code[1] === 'G' ? tResult('gritIndex') : tResult('flowIndex'),
      tagline: tResult('taglineQuote', { tagline: personality.tagline }),
      axisLabels: [
        tResult('radarAxes.body'),
        tResult('radarAxes.motive'),
        tResult('radarAxes.mind'),
      ],
    }),
    [personality.code, personality.tagline, tResult]
  )

  const handleDownload = useCallback(
    async (size: ShareCardSize) => {
      setGenerating(true)
      try {
        const blob = await generateShareCard(personality, scores, size, cardLabels)
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = getShareCardFilename(personality)
        a.click()
        URL.revokeObjectURL(url)
      } finally {
        setGenerating(false)
      }
    },
    [personality, scores, cardLabels]
  )

  const handleWebShare = useCallback(async () => {
    if (!navigator.share) return
    setGenerating(true)
    try {
      const blob = await generateShareCard(personality, scores, 'story', cardLabels)
      const file = new File([blob], getShareCardFilename(personality), { type: 'image/png' })
      await navigator.share({
        title: t('title', { name: personality.name }),
        text: personality.tagline,
        url: resultUrl,
        files: [file],
      })
    } catch {
      // User cancelled share
    } finally {
      setGenerating(false)
    }
  }, [personality, scores, resultUrl, cardLabels, t])

  const handleCopyLink = useCallback(async () => {
    await navigator.clipboard.writeText(resultUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [resultUrl])

  if (!open) return null

  const canWebShare = typeof navigator !== 'undefined' && !!navigator.share

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-2xl bg-white p-6 sm:rounded-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{t('modalTitle')}</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-2">
          {canWebShare && (
            <button
              onClick={handleWebShare}
              disabled={generating}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              <ImageIcon className="h-5 w-5 text-purple-500" />
              <span className="text-sm font-medium">{t('toSocial')}</span>
            </button>
          )}

          <button
            onClick={() => handleDownload('story')}
            disabled={generating}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            <Download className="h-5 w-5 text-pink-500" />
            <div>
              <div className="text-sm font-medium">{SHARE_CARD_SIZES.story.label}</div>
              <div className="text-xs text-gray-400">
                {SHARE_CARD_SIZES.story.width}x{SHARE_CARD_SIZES.story.height}
              </div>
            </div>
          </button>

          <button
            onClick={() => handleDownload('square')}
            disabled={generating}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            <Download className="h-5 w-5 text-blue-500" />
            <div>
              <div className="text-sm font-medium">{SHARE_CARD_SIZES.square.label}</div>
              <div className="text-xs text-gray-400">
                {SHARE_CARD_SIZES.square.width}x{SHARE_CARD_SIZES.square.height}
              </div>
            </div>
          </button>

          <button
            onClick={() => handleDownload('og')}
            disabled={generating}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            <Download className="h-5 w-5 text-green-500" />
            <div>
              <div className="text-sm font-medium">{SHARE_CARD_SIZES.og.label}</div>
              <div className="text-xs text-gray-400">
                {SHARE_CARD_SIZES.og.width}x{SHARE_CARD_SIZES.og.height}
              </div>
            </div>
          </button>

          <button
            onClick={handleCopyLink}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-gray-50"
          >
            {copied ? (
              <Check className="h-5 w-5 text-emerald-500" />
            ) : (
              <Copy className="h-5 w-5 text-gray-500" />
            )}
            <span className="text-sm font-medium">{copied ? t('copied') : t('copyLink')}</span>
          </button>
        </div>

        {generating && (
          <div className="mt-3 text-center text-xs text-gray-400">{t('generating')}</div>
        )}
      </div>
    </div>
  )
}
