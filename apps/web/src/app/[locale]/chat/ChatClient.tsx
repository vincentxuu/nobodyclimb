'use client'

import type { RankId } from '@nobodyclimb/types'
import {
  ArrowLeft,
  Bot,
  Check,
  ChevronLeft,
  Copy,
  History,
  Loader2,
  RefreshCw,
  SquarePen,
  ThumbsDown,
  ThumbsUp,
  User,
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message'
import type { PromptInputMessage } from '@/components/ai-elements/prompt-input'
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input'
import { Source, Sources, SourcesContent, SourcesTrigger } from '@/components/ai-elements/sources'
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion'
import { ToolActivity } from '@/components/ai-elements/tool-activity'
import { RankBadge } from '@/components/rank/RankBadge'
import { useChatAutoScroll } from '@/hooks/useChatAutoScroll'
import { useChatSession } from '@/hooks/useChatSession'
import { Link, useRouter } from '@/i18n/navigation'
import type { AiLocale } from '@/lib/api/ai'
import { useSubmitFeedback } from '@/lib/api/ai'
import type { ChatMessageData } from '@/lib/chat/messages'
import { formatChatError } from '@/lib/chat/messages'
import { pickRandomSuggestions } from '@/lib/chat/suggestions'
import { cn } from '@/lib/utils'

// widget「展開」時帶過來的 session，全頁接續同一段對話
const SESSION_PARAM = 'session'

// =============================================
// Chat Page
// =============================================

export function ChatClient() {
  const t = useTranslations('Chat')
  const locale = useLocale() as AiLocale
  const router = useRouter()
  const searchParams = useSearchParams()
  // 只取進頁當下的值：之後網址由下方 effect 跟著 session 改寫，不應再觸發初始載入
  const [initialSessionId] = useState(() => searchParams.get(SESSION_PARAM))
  const [showHistory, setShowHistory] = useState(false)
  const [emptySuggestions] = useState<string[]>(() =>
    pickRandomSuggestions(t.raw('suggestionPool') as string[], 3)
  )

  // 對話狀態（送出 / 停止 / 重新生成 / session / 配額）與浮動 widget 共用同一個 hook
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
    send,
    stop,
    regenerate,
    newChat,
    loadSessions,
    loadMoreSessions,
    switchSession,
  } = useChatSession({ locale, initialSessionId })

  const { containerRef, handleScroll } = useChatAutoScroll<HTMLDivElement>(
    messages,
    `${suggestedQuestions.length}:${showHistory}`
  )

  // 把目前 session 寫進網址（重新整理後接續同一段對話）；用 history API 只改 query，不觸發導頁
  const hadSessionRef = useRef(false)
  const writtenSessionRef = useRef<string | null>(null)
  useEffect(() => {
    if (!sessionId && !hadSessionRef.current) return
    hadSessionRef.current = true
    writtenSessionRef.current = sessionId
    const url = new URL(window.location.href)
    if (sessionId) url.searchParams.set(SESSION_PARAM, sessionId)
    else url.searchParams.delete(SESSION_PARAM)
    window.history.replaceState(null, '', url)
  }, [sessionId])

  // 已在 /chat 時又從 widget「展開」別的 session：網址參數被外部改掉，切到該 session。
  // 只在參數值變動時反應，且排除上面自己寫進網址的值
  const paramSessionId = searchParams.get(SESSION_PARAM)
  const prevParamRef = useRef(paramSessionId)
  useEffect(() => {
    const changed = prevParamRef.current !== paramSessionId
    prevParamRef.current = paramSessionId
    if (!changed || !paramSessionId) return
    if (paramSessionId === sessionId || paramSessionId === writtenSessionRef.current) return
    void switchSession(paramSessionId)
  }, [paramSessionId, sessionId, switchSession])

  const handleSubmit = useCallback(
    (message: PromptInputMessage) => {
      send(message.text)
    },
    [send]
  )

  const handleOpenHistory = useCallback(async () => {
    await loadSessions()
    setShowHistory(true)
  }, [loadSessions])

  const handleSwitchSession = useCallback(
    async (targetId: string) => {
      if (await switchSession(targetId)) setShowHistory(false)
    },
    [switchSession]
  )

  return (
    <div className="mx-auto flex h-screen max-w-3xl flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label={t('back')}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-sm font-semibold">NobodyClimb AI</h1>
            <p className="text-xs text-muted-foreground">{t('subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isAuthenticated && quota && (
            <div className="flex items-center gap-1.5">
              {quota.daily_limit === -1 ? (
                <span className="text-xs text-muted-foreground">{t('noQuotaLimit')}</span>
              ) : (
                <>
                  <RankBadge tier={quota.tier as RankId} size="sm" />
                  <span className="text-xs text-muted-foreground">
                    {t('remaining', { remaining: quota.remaining, limit: quota.daily_limit })}
                  </span>
                </>
              )}
            </div>
          )}
          {isAuthenticated && (
            <div className="flex items-center gap-1">
              {showHistory ? (
                <button
                  type="button"
                  onClick={() => setShowHistory(false)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  aria-label={t('backToChat')}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={newChat}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    aria-label={t('newChat')}
                  >
                    <SquarePen className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenHistory}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    aria-label={t('history')}
                  >
                    <History className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {showHistory ? (
        /* 歷史面板 */
        <div className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
          <p className="px-1 pb-1 text-xs text-muted-foreground">{t('recentChats')}</p>
          {sessions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t('noHistory')}</p>
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
                <p className="truncate text-sm font-medium">{session.title}</p>
              </button>
            ))
          )}
          {hasMoreSessions && (
            <button
              type="button"
              onClick={loadMoreSessions}
              disabled={isLoadingSessions}
              className="w-full rounded-lg px-3 py-2 text-center text-xs text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              {t('loadMore')}
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Messages */}
          <div
            ref={containerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-4 py-6"
          >
            {messages.length === 0 ? (
              <EmptyState suggestions={emptySuggestions} onSuggestionClick={send} />
            ) : (
              <div className="space-y-6">
                {messages.map((msg, index) => (
                  <ChatMessageItem
                    key={msg.id}
                    message={msg}
                    isLast={canRegenerate && index === messages.length - 1}
                    onRegenerate={regenerate}
                    isBusy={isBusy}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Suggestions (when there are messages) */}
          {messages.length > 0 && suggestedQuestions.length > 0 && !isBusy && (
            <div className="border-t px-4 py-2">
              <Suggestions>
                {suggestedQuestions.map((s) => (
                  <Suggestion key={s} suggestion={s} onClick={send} />
                ))}
              </Suggestions>
            </div>
          )}
        </>
      )}

      {/* Input */}
      <div className="border-t px-4 py-3">
        {!isAuthenticated ? (
          <p className="text-center text-sm text-muted-foreground">
            {t.rich('loginRequired', {
              link: (chunks) => (
                <Link href="/auth/login" className="text-primary underline">
                  {chunks}
                </Link>
              ),
            })}
          </p>
        ) : (
          <PromptInput onSubmit={handleSubmit}>
            <PromptInputTextarea placeholder={t('inputPlaceholderPage')} />
            <PromptInputFooter>
              <PromptInputTools />
              {isBusy ? (
                <button
                  type="button"
                  onClick={stop}
                  className="rounded-lg bg-destructive px-3 py-1.5 text-xs text-destructive-foreground"
                >
                  {t('stop')}
                </button>
              ) : (
                <PromptInputSubmit />
              )}
            </PromptInputFooter>
          </PromptInput>
        )}
      </div>
    </div>
  )
}

// =============================================
// Empty State
// =============================================

function EmptyState({
  suggestions,
  onSuggestionClick,
}: {
  suggestions: string[]
  onSuggestionClick: (s: string) => void
}) {
  const t = useTranslations('Chat')
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-wb-10">
        <Bot className="h-8 w-8 text-wb-70" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-semibold text-wb-100">{t('emptyTitle')}</h2>
        <p className="mt-1 text-sm text-wb-60">{t('emptyDesc')}</p>
      </div>
      <Suggestions>
        {suggestions.map((s) => (
          <Suggestion key={s} suggestion={s} onClick={() => onSuggestionClick(s)} />
        ))}
      </Suggestions>
    </div>
  )
}

// =============================================
// Chat Message Item
// =============================================

interface ChatMessageItemProps {
  message: ChatMessageData
  isLast: boolean
  onRegenerate: () => void
  isBusy: boolean
}

// memo：串流時只有內容變動的那一則（最後一則）重繪；onRegenerate 需為穩定參考
const ChatMessageItem = memo(function ChatMessageItem({
  message,
  isLast,
  onRegenerate,
  isBusy,
}: ChatMessageItemProps) {
  const t = useTranslations('Chat')
  const [copied, setCopied] = useState(false)
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
  const { mutate: submitFeedback } = useSubmitFeedback()

  // 錯誤 / 中斷提示依 status 顯示，不寫進 content（content 會進對話歷史）
  const errorText = message.error ? formatChatError(t, message.error) : null

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [message.content])

  // 回饋邏輯沿用 widget 的 ChatMessage：讚 = 5 分、倒讚 = 1 分，送出後不可再改
  const handleFeedback = useCallback(
    (score: 1 | 5) => {
      if (!message.queryId || feedbackSubmitted) return
      submitFeedback(
        { query_id: message.queryId, score },
        { onSuccess: () => setFeedbackSubmitted(true) }
      )
    },
    [message.queryId, feedbackSubmitted, submitFeedback]
  )

  return (
    <Message from={message.role === 'user' ? 'user' : 'assistant'}>
      <div className="flex gap-3">
        {/* Avatar */}
        <div
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
            message.role === 'user' ? 'bg-wb-100 text-white' : 'bg-wb-10 text-wb-70'
          )}
        >
          {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <MessageContent>
            {/* 工具使用過程（仿 Claude 摺疊列，可展開看 Request / Response） */}
            {message.toolProgress && message.toolProgress.length > 0 && (
              <ToolActivity
                events={message.toolProgress}
                isStreaming={!!message.isStreaming}
                className="mb-3"
              />
            )}

            {/* Message Body */}
            {message.content && <MessageResponse>{message.content}</MessageResponse>}

            {/* Streaming indicator */}
            {/* 工具執行中由 ToolActivity 摺疊列負責 loading，其餘等待時間顯示思考中 */}
            {message.isStreaming &&
              !message.content &&
              !message.toolProgress?.some((p) => p.status === 'executing') && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Loader2 className="size-3.5 shrink-0 animate-spin" />
                  <span className="text-shimmer">
                    {message.toolProgress?.length ? t('composing') : t('thinking')}
                  </span>
                </div>
              )}

            {/* 錯誤（含 429 配額用盡）/ 使用者中斷 */}
            {errorText && (
              <p
                className={cn(
                  'whitespace-pre-wrap',
                  message.content ? 'mt-2 text-xs text-muted-foreground' : 'text-sm'
                )}
              >
                {errorText}
              </p>
            )}
            {message.status === 'stopped' && (
              <p className="mt-2 text-xs text-muted-foreground">{t('stopped')}</p>
            )}

            {/* Sources */}
            {message.sources && message.sources.length > 0 && (
              <Sources>
                <SourcesTrigger count={message.sources.length} />
                <SourcesContent>
                  {message.sources.map((source) => (
                    <Source
                      key={source.id}
                      href={source.url || '#'}
                      title={`${source.title} (${source.type})`}
                    />
                  ))}
                </SourcesContent>
              </Sources>
            )}
          </MessageContent>

          {/* Actions (only for assistant, non-streaming) */}
          {message.role === 'assistant' && !message.isStreaming && message.content && (
            <MessageActions>
              <MessageAction
                tooltip={t('copy')}
                label={copied ? t('copied') : t('copy')}
                onClick={handleCopy}
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </MessageAction>
              {/* 重新生成（僅最後一則 AI 訊息；錯誤訊息不提供，後端可能沒有寫入這一輪） */}
              {isLast && message.status !== 'error' && (
                <MessageAction
                  tooltip={t('regenerateAria')}
                  label={t('regenerateAria')}
                  onClick={onRegenerate}
                  disabled={isBusy}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </MessageAction>
              )}
              {/* 回饋（需有 queryId） */}
              {message.queryId &&
                (feedbackSubmitted ? (
                  <span className="text-xs text-muted-foreground">{t('thanksFeedback')}</span>
                ) : (
                  <>
                    <MessageAction
                      tooltip={t('goodAria')}
                      label={t('goodAria')}
                      onClick={() => handleFeedback(5)}
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                    </MessageAction>
                    <MessageAction
                      tooltip={t('badAria')}
                      label={t('badAria')}
                      onClick={() => handleFeedback(1)}
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />
                    </MessageAction>
                  </>
                ))}
            </MessageActions>
          )}
        </div>
      </div>
    </Message>
  )
})
