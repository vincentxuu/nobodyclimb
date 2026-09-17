'use client'

import type { RankId } from '@nobodyclimb/types'
import { ArrowLeft, Bot, Check, Copy, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
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
import { Reasoning, ReasoningContent, ReasoningTrigger } from '@/components/ai-elements/reasoning'
import { Source, Sources, SourcesContent, SourcesTrigger } from '@/components/ai-elements/sources'
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion'
import { RankBadge } from '@/components/rank/RankBadge'
import type { AIChatHistoryMessage, AISource, AIStreamDoneEvent } from '@/lib/api/ai'
import { askAIStream, useMyQuota } from '@/lib/api/ai'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'

// =============================================
// Types
// =============================================

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: AISource[]
  suggestedQuestions?: string[]
  isStreaming?: boolean
  toolProgress?: { tool: string; status: 'executing' | 'done' }[]
}

// =============================================
// Suggestion Pool
// =============================================

const SUGGESTION_POOL = [
  '推薦 3 條龍洞 5.10 的經典路線',
  '我剛完攀剃刀邊緣 5.10c，推薦類似難度的路線',
  '壽山有什麼 5.9 到 5.10 適合練習的路線？',
  '我想突破 5.11，需要加強什麼？',
  '根據我的攀登記錄，建議我練什麼？',
  '推薦 3 條墾丁 5.10 的路線',
  '我爬了白龍夢和白鯨記，推薦我龍洞下一條',
  '推薦一個針對攀岩的訓練計畫',
]

function getRandomSuggestions(count: number): string[] {
  const shuffled = [...SUGGESTION_POOL].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

// =============================================
// Chat Page
// =============================================

export function ChatClient() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const { data: quota } = useMyQuota({ enabled: isAuthenticated })
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>(() => getRandomSuggestions(3))
  const scrollRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const buildChatHistory = useCallback((): AIChatHistoryMessage[] => {
    return messages
      .filter((m) => !m.isStreaming)
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }))
  }, [messages])

  const handleSend = useCallback(
    async (query: string) => {
      if (!query.trim() || isLoading) return

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: query.trim(),
      }

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        isStreaming: true,
        toolProgress: [],
      }

      setMessages((prev) => [...prev, userMsg, assistantMsg])
      setIsLoading(true)
      setSuggestions([])

      const controller = new AbortController()
      abortRef.current = controller

      const chatHistory = buildChatHistory()

      await askAIStream(
        { query: query.trim(), chat_history: chatHistory, include_sources: true },
        (token) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMsg.id ? { ...m, content: m.content + token } : m))
          )
        },
        (event: AIStreamDoneEvent) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id
                ? {
                    ...m,
                    isStreaming: false,
                    sources: event.sources,
                    suggestedQuestions: event.suggested_questions,
                  }
                : m
            )
          )
          if (event.suggested_questions?.length) {
            setSuggestions(event.suggested_questions)
          }
        },
        (errMsg) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id
                ? { ...m, content: errMsg || '抱歉，AI 服務暫時無法使用。', isStreaming: false }
                : m
            )
          )
        },
        controller.signal,
        (progress) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id
                ? { ...m, toolProgress: [...(m.toolProgress || []), progress] }
                : m
            )
          )
        }
      )

      setIsLoading(false)
      abortRef.current = null
    },
    [isLoading, buildChatHistory]
  )

  const handleStop = useCallback(() => {
    abortRef.current?.abort()
    setIsLoading(false)
    setMessages((prev) => prev.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m)))
  }, [])

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      handleSend(suggestion)
    },
    [handleSend]
  )

  const handleSubmit = useCallback(
    (message: PromptInputMessage) => {
      if (message.text.trim()) {
        handleSend(message.text)
      }
    },
    [handleSend]
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
            aria-label="返回"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-sm font-semibold">NobodyClimb AI</h1>
            <p className="text-xs text-muted-foreground">攀岩助理</p>
          </div>
        </div>
        {isAuthenticated && quota && (
          <div className="flex items-center gap-1.5">
            {quota.daily_limit === -1 ? (
              <span className="text-xs text-muted-foreground">無配額限制</span>
            ) : (
              <>
                <RankBadge tier={quota.tier as RankId} size="sm" />
                <span className="text-xs text-muted-foreground">
                  剩餘 {quota.remaining}/{quota.daily_limit}
                </span>
              </>
            )}
          </div>
        )}
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 ? (
          <EmptyState suggestions={suggestions} onSuggestionClick={handleSuggestionClick} />
        ) : (
          <div className="space-y-6">
            {messages.map((msg) => (
              <ChatMessageItem key={msg.id} message={msg} />
            ))}
          </div>
        )}
      </div>

      {/* Suggestions (when there are messages) */}
      {messages.length > 0 && suggestions.length > 0 && !isLoading && (
        <div className="border-t px-4 py-2">
          <Suggestions>
            {suggestions.map((s) => (
              <Suggestion key={s} suggestion={s} onClick={() => handleSuggestionClick(s)} />
            ))}
          </Suggestions>
        </div>
      )}

      {/* Input */}
      <div className="border-t px-4 py-3">
        {!isAuthenticated ? (
          <p className="text-center text-sm text-muted-foreground">
            請先{' '}
            <a href="/auth/login" className="text-primary underline">
              登入
            </a>{' '}
            使用 AI 攀岩助手
          </p>
        ) : (
          <PromptInput onSubmit={handleSubmit}>
            <PromptInputTextarea placeholder="問我任何攀岩問題..." />
            <PromptInputFooter>
              <PromptInputTools />
              {isLoading ? (
                <button
                  type="button"
                  onClick={handleStop}
                  className="rounded-lg bg-destructive px-3 py-1.5 text-xs text-destructive-foreground"
                >
                  停止
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
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-wb-10">
        <Bot className="h-8 w-8 text-wb-70" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-semibold text-wb-100">AI 攀岩助手</h2>
        <p className="mt-1 text-sm text-wb-60">問我路線推薦、訓練建議、或任何攀岩問題</p>
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

function ChatMessageItem({ message }: { message: ChatMessage }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [message.content])

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
            {/* Tool Progress (Reasoning) */}
            {message.toolProgress && message.toolProgress.length > 0 && (
              <Reasoning isStreaming={message.isStreaming}>
                <ReasoningTrigger />
                <ReasoningContent>
                  {message.toolProgress
                    .map((p) => `${p.status === 'done' ? '✓' : '⟳'} ${p.tool}`)
                    .join('\n')}
                </ReasoningContent>
              </Reasoning>
            )}

            {/* Message Body */}
            {message.content && <MessageResponse>{message.content}</MessageResponse>}

            {/* Streaming indicator */}
            {message.isStreaming && !message.content && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="shimmer inline-block h-4 w-4 rounded-full" />
                思考中...
              </div>
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
              <MessageAction tooltip="複製" label={copied ? '已複製' : '複製'} onClick={handleCopy}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </MessageAction>
            </MessageActions>
          )}
        </div>
      </div>
    </Message>
  )
}
