'use client'

import {
  ChevronLeft,
  Expand,
  History,
  MessageCircle,
  RefreshCw,
  Send,
  Square,
  SquarePen,
  Trash2,
  X,
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { RankBadge } from '@/components/rank/RankBadge'
import { useChatAutoScroll } from '@/hooks/useChatAutoScroll'
import { useChatSession } from '@/hooks/useChatSession'
import { Link, useRouter } from '@/i18n/navigation'
import type { AiLocale } from '@/lib/api/ai'
import { pickRandomSuggestions } from '@/lib/chat/suggestions'
import { cn } from '@/lib/utils'
import { ChatMessage } from './ChatMessage'

// textarea 自動長高的上限
const INPUT_MAX_HEIGHT = 120

type ChatT = ReturnType<typeof useTranslations<'Chat'>>

function formatRelativeTime(timestamp: number, t: ChatT): string {
  const seconds = Math.floor(Date.now() / 1000) - timestamp
  if (seconds < 60) return t('time.justNow')
  if (seconds < 3600) return t('time.minutesAgo', { count: Math.floor(seconds / 60) })
  if (seconds < 86400) return t('time.hoursAgo', { count: Math.floor(seconds / 3600) })
  return t('time.daysAgo', { count: Math.floor(seconds / 86400) })
}

export function ChatWidget() {
  const t = useTranslations('Chat')
  const locale = useLocale() as AiLocale
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [input, setInput] = useState('')
  const [displaySuggestions, setDisplaySuggestions] = useState<string[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [showConfirmClear, setShowConfirmClear] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // 對話狀態（送出 / 停止 / 重新生成 / session / 配額）與全頁 /chat 共用同一個 hook
  const {
    messages,
    suggestedQuestions,
    sessionId,
    canRegenerate,
    sessions,
    hasMoreSessions,
    isLoadingSessions,
    quota,
    isAuthenticated,
    isBusy,
    showLoginPrompt,
    dismissLoginPrompt,
    send,
    stop,
    regenerate,
    newChat,
    clearChat,
    loadSessions,
    loadMoreSessions,
    switchSession,
  } = useChatSession({ locale, enabled: isOpen })

  const { containerRef, handleScroll } = useChatAutoScroll<HTMLDivElement>(
    messages,
    `${suggestedQuestions.length}:${isOpen}:${showHistory}`
  )

  // 開啟時：隨機取建議問題、聚焦輸入框（session 與配額由 hook 載入）
  useEffect(() => {
    if (!isOpen) return
    setDisplaySuggestions(pickRandomSuggestions(t.raw('suggestionPool') as string[]))

    const timer = setTimeout(() => inputRef.current?.focus(), 100)

    return () => {
      clearTimeout(timer)
      dismissLoginPrompt()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // Escape 鍵關閉
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (showHistory) setShowHistory(false)
        else setIsOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, showHistory])

  useEffect(() => {
    setMounted(true)
  }, [])

  // textarea 隨內容自動長高（上限 INPUT_MAX_HEIGHT，超過改為捲動）
  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, INPUT_MAX_HEIGHT)}px`
  }, [input, isOpen, showHistory])

  const handleSubmit = useCallback(
    (query: string) => {
      if (!query.trim() || isBusy) return
      // 未登入時 hook 只會顯示登入引導，保留輸入內容
      if (isAuthenticated) setInput('')
      send(query)
    },
    [isBusy, isAuthenticated, send]
  )

  // 清除對話
  const handleClear = useCallback(async () => {
    setShowConfirmClear(false)
    await clearChat()
  }, [clearChat])

  // 開啟歷史面板
  const handleOpenHistory = useCallback(async () => {
    await loadSessions()
    setShowHistory(true)
  }, [loadSessions])

  // 切換 session
  const handleSwitchSession = useCallback(
    async (targetId: string) => {
      if (await switchSession(targetId)) setShowHistory(false)
    },
    [switchSession]
  )

  // 展開全頁：帶著目前 session，讓 /chat 接續同一段對話
  const handleExpand = useCallback(() => {
    setIsOpen(false)
    router.push(sessionId ? `/chat?session=${encodeURIComponent(sessionId)}` : '/chat')
  }, [router, sessionId])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleSubmit(input)
    }
  }

  const widget = (
    <>
      {/* 浮動觸發按鈕 */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-6 right-6 z-[20000] flex h-14 w-14 items-center justify-center rounded-full pointer-events-auto',
          'bg-primary text-primary-foreground shadow-lg',
          'hover:bg-primary/90 hover:scale-105 transition-all',
          isOpen && 'hidden'
        )}
        aria-label={t('openWidget')}
        aria-haspopup="dialog"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {/* 對話視窗 */}
      {isOpen && (
        <div
          role="dialog"
          aria-label={t('widgetAria')}
          aria-modal="true"
          className={cn(
            'fixed z-[20000] flex flex-col bg-background shadow-2xl pointer-events-auto',
            'md:top-auto md:left-auto md:bottom-6 md:right-6 md:rounded-2xl md:border md:border-border',
            'md:h-[600px] md:max-h-[calc(100vh-5rem)] md:w-[400px]',
            'inset-0'
          )}
        >
          {/* 標題列 */}
          <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold">NobodyClimb AI</h2>
              {quota ? (
                <div className="flex items-center gap-1.5 mt-0.5">
                  {quota.daily_limit === -1 ? (
                    <span className="text-xs text-muted-foreground">{t('noQuotaLimit')}</span>
                  ) : (
                    <>
                      <RankBadge
                        tier={quota.tier as import('@nobodyclimb/types').RankId}
                        size="sm"
                      />
                      <span className="text-xs text-muted-foreground">
                        {t('remaining', { remaining: quota.remaining, limit: quota.daily_limit })}
                      </span>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">{t('subtitle')}</p>
              )}
            </div>
            <div className="flex items-center gap-1">
              {isAuthenticated && !showHistory && (
                <>
                  {/* 清除按鈕 */}
                  {messages.length > 0 &&
                    (showConfirmClear ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">{t('confirmClear')}</span>
                        <button
                          type="button"
                          onClick={handleClear}
                          className="rounded px-1.5 py-0.5 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          {t('confirm')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowConfirmClear(false)}
                          className="rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted transition-colors"
                        >
                          {t('cancel')}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowConfirmClear(true)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        aria-label={t('clearChat')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ))}
                  {/* 新對話按鈕 */}
                  <button
                    type="button"
                    onClick={newChat}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    aria-label={t('newChat')}
                  >
                    <SquarePen className="h-4 w-4" />
                  </button>
                  {/* 歷史按鈕 */}
                  <button
                    type="button"
                    onClick={handleOpenHistory}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    aria-label={t('history')}
                  >
                    <History className="h-4 w-4" />
                  </button>
                </>
              )}
              {showHistory && (
                <button
                  type="button"
                  onClick={() => setShowHistory(false)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  aria-label={t('backToChat')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={handleExpand}
                // 串流中導頁的話，全頁向後端載入時 assistant 訊息還沒寫入，會看不到這一輪回答
                disabled={isBusy}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
                aria-label={t('expand')}
              >
                <Expand className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  setShowHistory(false)
                  setShowConfirmClear(false)
                  dismissLoginPrompt()
                }}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label={t('closeWidget')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* 歷史面板 */}
          {showHistory ? (
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <p className="text-xs text-muted-foreground px-1 pb-1">{t('recentChats')}</p>
              {sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">{t('noHistory')}</p>
              ) : (
                sessions.map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => handleSwitchSession(session.id)}
                    className={cn(
                      'w-full rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted',
                      session.id === sessionId && 'bg-muted'
                    )}
                  >
                    <p className="text-sm font-medium truncate">{session.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatRelativeTime(session.updated_at, t)}
                    </p>
                  </button>
                ))
              )}
              {hasMoreSessions && (
                <button
                  type="button"
                  onClick={loadMoreSessions}
                  disabled={isLoadingSessions}
                  className="w-full rounded-lg px-3 py-2 text-center text-xs text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
                >
                  {t('loadMore')}
                </button>
              )}
            </div>
          ) : (
            <>
              {/* 訊息區 */}
              <div
                ref={containerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 space-y-4"
              >
                {messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                    <p className="text-sm text-muted-foreground px-4">{t('welcome')}</p>
                    <div className="w-full space-y-2">
                      {displaySuggestions.map((suggestion) => (
                        <button
                          type="button"
                          key={suggestion}
                          onClick={() => handleSubmit(suggestion)}
                          className="w-full rounded-lg border border-border px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          setDisplaySuggestions(
                            pickRandomSuggestions(t.raw('suggestionPool') as string[])
                          )
                        }
                        className="mx-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <RefreshCw className="h-3 w-3" />
                        {t('shuffle')}
                      </button>
                    </div>
                    {showLoginPrompt && (
                      <div className="w-full text-left rounded-xl border border-border bg-muted/50 p-4 space-y-3">
                        <p className="text-sm text-foreground font-medium">
                          {t('loginPromptTitle')}
                        </p>
                        <p className="text-xs text-muted-foreground">{t('loginPromptDesc')}</p>
                        <Link
                          href="/auth/login"
                          className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                          {t('goLogin')}
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {messages.map((message, index) => (
                      <ChatMessage
                        key={message.id}
                        message={message}
                        isLast={canRegenerate && index === messages.length - 1}
                        onRegenerate={regenerate}
                        isPending={isBusy}
                      />
                    ))}
                    {/* 後續建議按鈕列 */}
                    {!isBusy && suggestedQuestions.length > 0 && (
                      <div className="space-y-1.5 pl-1">
                        <p className="text-xs text-muted-foreground">{t('youMightAsk')}</p>
                        {suggestedQuestions.map((q) => (
                          <button
                            key={q}
                            type="button"
                            onClick={() => handleSubmit(q)}
                            className="w-full rounded-lg border border-border px-3 py-1.5 text-left text-xs hover:bg-muted transition-colors"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* 輸入區 */}
              <div className="shrink-0 border-t border-border p-3">
                <div className="flex items-end gap-2 rounded-xl border border-border bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-ring">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('inputPlaceholder')}
                    rows={1}
                    className="flex-1 resize-none bg-transparent text-sm outline-hidden placeholder:text-muted-foreground"
                    style={{ maxHeight: `${INPUT_MAX_HEIGHT}px` }}
                    aria-label={t('inputAria')}
                  />
                  {isBusy ? (
                    <button
                      type="button"
                      onClick={stop}
                      className="rounded-lg bg-muted p-1.5 text-foreground hover:bg-muted/80 transition-colors"
                      aria-label={t('stopAria')}
                    >
                      <Square className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSubmit(input)}
                      disabled={!input.trim()}
                      className="rounded-lg bg-primary p-1.5 text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-colors"
                      aria-label={t('sendAria')}
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )

  if (!mounted) return null

  return createPortal(widget, document.body)
}
