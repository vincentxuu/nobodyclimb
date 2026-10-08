/**
 * AI 問答串流 hook：封裝 AbortController（停止）、token 節流與工具進度彙整
 *
 * 訊息列表的狀態仍由呼叫端（ChatWidget）持有，這裡只負責一次問答的生命週期。
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { type AIAskRequest, type AIAskResult, askAI } from '../ai/ask'
import { type ToolProgressItem, upsertToolProgress } from '../ai/toolProgress'

// token 逐字到達時不逐一 setState，固定間隔吐一次，避免整個訊息列表高頻重繪
const FLUSH_INTERVAL_MS = 50

export interface AIAskLiveState {
  text: string
  tools: ToolProgressItem[]
}

export type AIAskOutcome =
  | { status: 'done'; result: AIAskResult }
  | { status: 'stopped'; partialText: string }
  | { status: 'error'; error: unknown; partialText: string }

export function useAIAskStream() {
  const [isStreaming, setIsStreaming] = useState(false)
  const controllerRef = useRef<AbortController | null>(null)

  const stop = useCallback(() => {
    controllerRef.current?.abort()
  }, [])

  // 元件卸載時中止進行中的請求（後端會停止生成並退還配額）
  useEffect(() => () => controllerRef.current?.abort(), [])

  const run = useCallback(
    async (
      request: AIAskRequest,
      onUpdate: (state: AIAskLiveState) => void
    ): Promise<AIAskOutcome> => {
      controllerRef.current?.abort()
      const controller = new AbortController()
      controllerRef.current = controller

      let text = ''
      let tools: ToolProgressItem[] = []
      let flushTimer: ReturnType<typeof setTimeout> | null = null

      const flush = () => {
        if (flushTimer) {
          clearTimeout(flushTimer)
          flushTimer = null
        }
        if (!controller.signal.aborted) onUpdate({ text, tools })
      }

      setIsStreaming(true)
      try {
        const result = await askAI(
          request,
          {
            onToken: (token) => {
              text += token
              if (!flushTimer) flushTimer = setTimeout(flush, FLUSH_INTERVAL_MS)
            },
            onTokenReset: () => {
              text = ''
              flush()
            },
            onProgress: (event) => {
              tools = upsertToolProgress(tools, event)
              flush()
            },
          },
          controller.signal
        )
        return { status: 'done', result }
      } catch (error) {
        if (controller.signal.aborted) return { status: 'stopped', partialText: text }
        return { status: 'error', error, partialText: text }
      } finally {
        if (flushTimer) clearTimeout(flushTimer)
        if (controllerRef.current === controller) {
          controllerRef.current = null
          setIsStreaming(false)
        }
      }
    },
    []
  )

  return { isStreaming, run, stop }
}
