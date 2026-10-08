'use client'

import { useCallback, useEffect, useRef } from 'react'
import type { ChatMessageData } from '@/lib/chat/messages'

// 距離底部多近算「貼近底部」
const NEAR_BOTTOM_PX = 80

export function isNearBottom(
  metrics: { scrollHeight: number; scrollTop: number; clientHeight: number },
  threshold = NEAR_BOTTOM_PX
): boolean {
  return metrics.scrollHeight - metrics.scrollTop - metrics.clientHeight < threshold
}

// 聊天訊息區的自動捲動：只在使用者貼近底部時跟著新內容往下捲，往上翻閱時不打擾；
// 串流中每個 tick 都會觸發，用 'auto' 避免 smooth 動畫互相堆疊，非串流的新訊息才用 'smooth'。
// extraDep：訊息以外也會撐高內容的東西（如後續建議問題）
export function useChatAutoScroll<T extends HTMLElement>(
  messages: ChatMessageData[],
  extraDep?: unknown
) {
  const containerRef = useRef<T | null>(null)
  const stickRef = useRef(true)
  const lastElementRef = useRef<T | null>(null)
  const lastScrollTopRef = useRef(0)
  const prevRef = useRef<{ firstId: string | undefined; userCount: number }>({
    firstId: undefined,
    userCount: 0,
  })

  // 掛在捲動容器的 onScroll：往上捲離底部就解除跟隨，捲回底部附近再恢復。
  // 只看「往上」是因為 smooth 動畫期間的 scroll 事件距底也會 > 門檻，不能因此解除
  const handleScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    if (isNearBottom(el)) stickRef.current = true
    else if (el.scrollTop < lastScrollTopRef.current) stickRef.current = false
    lastScrollTopRef.current = el.scrollTop
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    // 使用者自己送出新訊息、或整份對話被換掉（切換 session）時，一律回到底部
    const firstId = messages[0]?.id
    const userCount = messages.reduce((n, m) => (m.role === 'user' ? n + 1 : n), 0)
    const prev = prevRef.current
    // 容器重新掛載（widget 重開、從歷史面板返回）也視為整份換掉
    const replaced = firstId !== prev.firstId || el !== lastElementRef.current
    if (replaced || userCount > prev.userCount) stickRef.current = true
    prevRef.current = { firstId, userCount }
    lastElementRef.current = el

    if (!stickRef.current) return
    const isStreaming = messages.some((m) => m.isStreaming)
    const behavior: ScrollBehavior = isStreaming || replaced ? 'auto' : 'smooth'
    if (typeof el.scrollTo === 'function') el.scrollTo({ top: el.scrollHeight, behavior })
    else el.scrollTop = el.scrollHeight
  }, [messages, extraDep])

  return { containerRef, handleScroll }
}
