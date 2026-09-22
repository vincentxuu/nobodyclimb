import { BORDER_RADIUS, SEMANTIC_COLORS, SPACING, WB_COLORS } from '@nobodyclimb/constants'
import type { AiQuota, ApiResponse } from '@nobodyclimb/types'
import { useRouter } from 'expo-router'
import {
  Bot,
  ChevronDown,
  ChevronLeft,
  ExternalLink,
  History,
  Loader2,
  MessageCircle,
  RefreshCw,
  Send,
  Square,
  SquarePen,
  Trash2,
  User,
  X,
} from 'lucide-react-native'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import {
  KeyboardAvoidingView,
  Linking,
  Modal,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, IconButton, Text } from '@/components/ui'
import type { AIAskRequest } from '@/lib/ai/ask'
import { AIChatError, getAIErrorMessage } from '@/lib/ai/errors'
import type { ToolProgressItem } from '@/lib/ai/toolProgress'
import { apiClient } from '@/lib/api'
import { useAIAskStream } from '@/lib/hooks/useAIAskStream'
import { useAuthStore } from '@/store/authStore'
import { ToolProgressList } from './ToolProgressList'

interface AISource {
  id: string
  type: 'route' | 'crag' | 'video'
  title: string
  excerpt: string
  url?: string
  score: number
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: AISource[]
  queryId?: string
  suggestedQuestions?: string[]
  /** 串流中的工具執行進度 */
  tools?: ToolProgressItem[]
  /** streaming：生成中；stopped：使用者停止；interrupted：連線中斷（後兩者保留已產生的部分內容） */
  status?: 'streaming' | 'stopped' | 'interrupted'
  /** interrupted 時顯示的中斷原因 */
  notice?: string
  /** 前端產生的錯誤提示，後端沒有對應訊息，不可重新生成 */
  isError?: boolean
}

interface ChatSession {
  id: string
  title: string
  created_at: number
  updated_at: number
}

interface SavedChatMessage {
  id: string
  session_id?: string
  role: 'user' | 'assistant'
  content: string
  suggested_questions?: string[] | string
  sources?: AISource[] | null
  /** 'stopped' = 使用者中斷生成，content 為中斷前的部分內容 */
  status?: 'stopped' | null
  query_id?: string
  created_at: number
}

const SUGGESTION_POOL = [
  '推薦 3 條龍洞 5.10 的經典路線',
  '我最高完攀 5.10d，推薦可以突破的路線',
  '關子嶺有哪些 5.9 到 5.10 的練習路線？',
  '我爬了天天天藍，下一條可以試什麼？',
  '墾丁有什麼適合第一次戶外攀岩的路線？',
]

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function getRandomSuggestions() {
  return [...SUGGESTION_POOL].sort(() => Math.random() - 0.5).slice(0, 3)
}

function formatRelativeTime(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000) - timestamp
  if (seconds < 60) return '剛剛'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} 分鐘前`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} 小時前`
  return `${Math.floor(seconds / 86400)} 天前`
}

function parseSuggestedQuestions(value: SavedChatMessage['suggested_questions']) {
  if (!value) return undefined
  if (Array.isArray(value)) return value

  try {
    const parsed = JSON.parse(value) as unknown
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : undefined
  } catch {
    return undefined
  }
}

async function getMyQuota() {
  const response = await apiClient.get<ApiResponse<AiQuota>>('/ai/quota/me')
  return response.data.data ?? null
}

async function createChatSession() {
  const response = await apiClient.post<ApiResponse<ChatSession>>('/ai/sessions')
  if (!response.data.data) throw new Error('無法建立 AI 對話')
  return response.data.data
}

async function getChatSessions() {
  const response = await apiClient.get<ApiResponse<ChatSession[]>>('/ai/sessions')
  return response.data.data ?? []
}

async function getChatMessages(sessionId: string) {
  const response = await apiClient.get<ApiResponse<SavedChatMessage[]>>(
    `/ai/sessions/${sessionId}/messages`
  )
  return response.data.data ?? []
}

async function deleteChatSession(sessionId: string) {
  await apiClient.delete(`/ai/sessions/${sessionId}`)
}

// 只送完整的對話內容：前端產生的錯誤提示、被停止或中斷的不完整回答都不送進 chat_history
function toChatHistory(messages: ChatMessage[]): AIAskRequest['chat_history'] {
  const history = messages
    .filter((message) => !message.isError && !message.status && !!message.content)
    .slice(-6)
    .map((message) => ({ role: message.role, content: message.content }))
  return history.length > 0 ? history : undefined
}

// 重新生成不會新增 user 訊息，所以只開放給「user 訊息已由後端寫入」的回答；
// 前端產生的錯誤提示（429、輸入被擋等）發生在後端寫入之前，不開放
function canRegenerateMessage(message: ChatMessage) {
  return message.role === 'assistant' && !message.isError && message.status !== 'streaming'
}

function toChatMessage(message: SavedChatMessage): ChatMessage {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    sources: Array.isArray(message.sources) ? message.sources : undefined,
    queryId: message.query_id,
    suggestedQuestions: parseSuggestedQuestions(message.suggested_questions),
    status: message.status === 'stopped' ? 'stopped' : undefined,
  }
}

function SourceList({ sources }: { sources: AISource[] }) {
  if (sources.length === 0) return null

  return (
    <View style={styles.sources}>
      <Text variant="small" color="textMuted">
        參考資料
      </Text>
      {sources.slice(0, 3).map((source) => (
        <Pressable
          key={source.id}
          style={styles.sourceCard}
          disabled={!source.url}
          onPress={() => source.url && Linking.openURL(source.url).catch(() => {})}
        >
          <View style={styles.sourceText}>
            <Text variant="small" fontWeight="600" numberOfLines={1}>
              {source.title}
            </Text>
            <Text variant="caption" color="textMuted" numberOfLines={2}>
              {source.excerpt}
            </Text>
          </View>
          {source.url && <ExternalLink size={14} color={SEMANTIC_COLORS.textMuted} />}
        </Pressable>
      ))}
    </View>
  )
}

// memo：串流中只有最後一則訊息物件會變，其餘訊息 props 全部維持同參考、不重繪
// （patchAssistant 只替換該則物件；onRegenerate 只傳給可重新生成的最後一則）
const MessageBubble = memo(function MessageBubble({
  message,
  canRegenerate,
  isPending,
  onRegenerate,
}: {
  message: ChatMessage
  canRegenerate: boolean
  isPending: boolean
  onRegenerate?: () => void
}) {
  const isUser = message.role === 'user'
  const tools = message.tools ?? []

  // 串流剛開始、還沒有文字也沒有工具進度時不畫空泡泡（由下方 loading 列表示）
  if (!isUser && !message.content && tools.length === 0) return null

  return (
    <View style={[styles.messageRow, isUser && styles.userMessageRow]}>
      <View style={[styles.messageIcon, isUser ? styles.userIcon : styles.assistantIcon]}>
        {isUser ? <User size={14} color="#FFFFFF" /> : <Bot size={14} color={WB_COLORS[100]} />}
      </View>
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        {!isUser && <ToolProgressList tools={tools} />}
        {!!message.content && (
          <Text style={isUser ? styles.userMessageText : styles.assistantMessageText}>
            {message.content}
          </Text>
        )}
        {!isUser && message.status && message.status !== 'streaming' && (
          <Text variant="caption" color="textMuted">
            {message.status === 'stopped'
              ? '已停止生成'
              : (message.notice ?? '生成中斷，內容可能不完整')}
          </Text>
        )}
        {!isUser && <SourceList sources={message.sources ?? []} />}
        {!isUser && canRegenerate && (
          <Pressable
            style={[styles.regenerateButton, isPending && styles.disabledButton]}
            disabled={isPending}
            onPress={onRegenerate}
          >
            <RefreshCw size={13} color={SEMANTIC_COLORS.textMuted} />
            <Text variant="caption" color="textMuted">
              重新生成
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  )
})

export function ChatWidget() {
  const router = useRouter()
  const isAuthenticated = useAuthStore((state) => !!state.user)
  const scrollRef = useRef<ScrollView>(null)
  const isNearBottomRef = useRef(true)
  const sessionIdRef = useRef<string | null>(null)
  const { isStreaming, run: runAskStream, stop: stopAskStream } = useAIAskStream()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  // 讓 handleRegenerate 不必依賴 messages，維持穩定參考給 memo 的 MessageBubble
  const messagesRef = useRef(messages)
  messagesRef.current = messages
  const [input, setInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [quota, setQuota] = useState<AiQuota | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>(() => getRandomSuggestions())
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [showConfirmClear, setShowConfirmClear] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  const updateSessionId = useCallback((sessionId: string | null) => {
    sessionIdRef.current = sessionId
    setCurrentSessionId(sessionId)
  }, [])

  useEffect(() => {
    if (!isOpen || !isAuthenticated) return

    let cancelled = false

    Promise.allSettled([getMyQuota(), getChatSessions()]).then(([quotaResult, sessionsResult]) => {
      if (cancelled) return

      if (quotaResult.status === 'fulfilled') {
        setQuota(quotaResult.value)
      }

      if (sessionsResult.status === 'fulfilled') {
        setSessions(sessionsResult.value)
        const latest = sessionsResult.value[0]
        if (latest && !sessionIdRef.current && messages.length === 0) {
          getChatMessages(latest.id)
            .then((savedMessages) => {
              if (cancelled) return
              updateSessionId(latest.id)
              isNearBottomRef.current = true
              setMessages(savedMessages.map(toChatMessage))
            })
            .catch(() => {})
        } else if (!latest && !sessionIdRef.current) {
          createChatSession()
            .then((session) => {
              if (cancelled) return
              updateSessionId(session.id)
            })
            .catch(() => {})
        }
      }
    })

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, isOpen, messages.length, updateSessionId])

  useEffect(() => {
    if (!isOpen) return
    // 只在使用者貼近底部時跟隨，避免往上翻閱時被拉回（含串流結束後的最終更新）；
    // 送出新訊息、載入歷史、切換 session 時會把 isNearBottomRef 重設為 true
    if (!isNearBottomRef.current) return
    // 串流中訊息高頻更新：延遲的 timer 會一直被重設而捲不到底，改為立即、無動畫
    if (isStreaming) {
      scrollRef.current?.scrollToEnd({ animated: false })
      return
    }
    const timer = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
    return () => clearTimeout(timer)
  }, [isOpen, isStreaming, messages])

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent
    isNearBottomRef.current = contentSize.height - layoutMeasurement.height - contentOffset.y < 80
  }, [])

  const handleOpen = () => {
    setSuggestions(getRandomSuggestions())
    setIsOpen(true)
  }

  const ensureSession = useCallback(async () => {
    if (sessionIdRef.current) return sessionIdRef.current
    const session = await createChatSession()
    updateSessionId(session.id)
    return session.id
  }, [updateSessionId])

  // 送出一次問答（新問題與重新生成共用）：先放一則串流中的 assistant 訊息，再隨串流更新
  // 帶 session_id 時 user / assistant 訊息由後端寫入，前端不另外儲存
  // replacedMessage：重新生成時被取代的舊回答；只有後端確實取代了它（done、或有部分文字的
  // stopped / interrupted）才丟棄，否則還原到原位，錯誤另外用錯誤泡泡呈現
  const runAsk = useCallback(
    async (
      request: Pick<AIAskRequest, 'query' | 'chat_history'>,
      isRegenerate: boolean,
      replacedMessage?: ChatMessage
    ) => {
      const assistantId = createMessageId()
      // 只替換該則物件，其餘訊息維持同參考，讓 memo 的 MessageBubble 不重繪
      const patchAssistant = (patch: Partial<ChatMessage>) =>
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId ? { ...message, ...patch } : message
          )
        )
      // 這一輪沒有落地：把佔位訊息換回舊回答（沒有舊回答就移除），錯誤提示接在後面
      const restoreReplaced = (errorMessage?: string) =>
        setMessages((current) => {
          const restored = replacedMessage
            ? current.map((message) => (message.id === assistantId ? replacedMessage : message))
            : current.filter((message) => message.id !== assistantId)
          return errorMessage
            ? [
                ...restored,
                { id: createMessageId(), role: 'assistant', content: errorMessage, isError: true },
              ]
            : restored
        })

      isNearBottomRef.current = true
      setMessages((current) => [
        ...current,
        { id: assistantId, role: 'assistant', content: '', status: 'streaming' },
      ])

      // 重新生成時若原本沒有 session，後端沒有可取代的訊息，改當成一般問答寫入新 session
      const hadSession = !!sessionIdRef.current
      let sessionId: string
      try {
        sessionId = await ensureSession()
      } catch {
        if (replacedMessage) {
          restoreReplaced('無法建立 AI 對話，請稍後再試。')
        } else {
          patchAssistant({
            content: '無法建立 AI 對話，請稍後再試。',
            status: undefined,
            isError: true,
          })
        }
        return
      }

      const outcome = await runAskStream(
        {
          ...request,
          include_sources: true,
          session_id: sessionId,
          ...(isRegenerate && hadSession ? { regenerate: true } : {}),
          ...(isRegenerate ? { no_cache: true } : {}),
        },
        ({ text, tools }) => patchAssistant({ content: text, tools })
      )

      if (outcome.status === 'done') {
        const { result } = outcome
        patchAssistant({
          content: result.answer,
          sources: result.sources,
          queryId: result.queryId,
          suggestedQuestions: result.suggestedQuestions,
          status: undefined,
        })
        setSuggestions(result.suggestedQuestions)
        if (result.quota) {
          setQuota(result.quota)
        } else if (result.quotaRemaining !== undefined) {
          const remaining = result.quotaRemaining
          setQuota((current) => (current ? { ...current, remaining } : current))
        }
        return
      }

      if (outcome.status === 'stopped') {
        if (outcome.partialText) {
          patchAssistant({ content: outcome.partialText, status: 'stopped' })
        } else {
          restoreReplaced()
        }
        // 後端在 client 中止後會退還配額，重新取一次
        getMyQuota()
          .then((latest) => latest && setQuota(latest))
          .catch(() => {})
        return
      }

      const { error } = outcome
      if (error instanceof AIChatError) {
        const quotaData = error.quota
        if (quotaData) {
          setQuota((current) =>
            current
              ? {
                  ...current,
                  daily_limit: quotaData.daily_limit,
                  daily_used: quotaData.daily_used,
                  remaining: Math.max(quotaData.daily_limit - quotaData.daily_used, 0),
                }
              : current
          )
        }
        // session 已不存在：下次送出時重新建立
        if (error.code === 'session_not_found') updateSessionId(null)
      }

      if (outcome.partialText) {
        patchAssistant({
          content: outcome.partialText,
          status: 'interrupted',
          notice: getAIErrorMessage(error),
        })
      } else if (replacedMessage) {
        restoreReplaced(getAIErrorMessage(error))
      } else {
        patchAssistant({ content: getAIErrorMessage(error), status: undefined, isError: true })
      }
    },
    [ensureSession, runAskStream, updateSessionId]
  )

  const handleSubmit = useCallback(
    async (rawQuery: string) => {
      const query = rawQuery.trim()
      if (!query || isSubmitting || isRegenerating) return

      if (!isAuthenticated) {
        setShowLoginPrompt(true)
        return
      }

      const userMessage: ChatMessage = {
        id: createMessageId(),
        role: 'user',
        content: query,
      }

      const chatHistory = toChatHistory(messages)

      setMessages((current) => [...current, userMessage])
      setInput('')
      setSuggestions([])
      setShowLoginPrompt(false)
      setIsSubmitting(true)

      try {
        await runAsk({ query, chat_history: chatHistory }, false)
      } finally {
        setIsSubmitting(false)
      }
    },
    [isAuthenticated, isRegenerating, isSubmitting, messages, runAsk]
  )

  const handleRegenerate = useCallback(async () => {
    if (isSubmitting || isRegenerating) return
    const current = messagesRef.current
    const lastMessage = current[current.length - 1]
    if (!lastMessage || !canRegenerateMessage(lastMessage)) return

    const withoutLastAssistant = current.slice(0, -1)
    const lastUserMessage = [...withoutLastAssistant]
      .reverse()
      .find((message) => message.role === 'user')
    if (!lastUserMessage) return

    // 最後一則 user 訊息就是這次的 query，不重複放進 chat_history
    const lastUserIndex = withoutLastAssistant.lastIndexOf(lastUserMessage)
    const chatHistory = toChatHistory(withoutLastAssistant.slice(0, lastUserIndex))

    // 舊回答先從畫面移除，交給 runAsk 保管：這一輪失敗時會還原
    setMessages(withoutLastAssistant)
    setSuggestions([])
    setIsRegenerating(true)

    try {
      await runAsk({ query: lastUserMessage.content, chat_history: chatHistory }, true, lastMessage)
    } finally {
      setIsRegenerating(false)
    }
  }, [isRegenerating, isSubmitting, runAsk])

  const handleClear = useCallback(async () => {
    stopAskStream()
    const sessionId = sessionIdRef.current
    if (sessionId) {
      try {
        await deleteChatSession(sessionId)
      } catch {}
    }

    setMessages([])
    setSuggestions(getRandomSuggestions())
    setShowLoginPrompt(false)
    setShowConfirmClear(false)
    updateSessionId(null)

    if (isAuthenticated) {
      try {
        const session = await createChatSession()
        updateSessionId(session.id)
        setSessions(await getChatSessions())
      } catch {}
    }
  }, [isAuthenticated, stopAskStream, updateSessionId])

  const handleNewChat = useCallback(async () => {
    stopAskStream()
    setMessages([])
    setSuggestions(getRandomSuggestions())
    setShowLoginPrompt(false)
    setShowConfirmClear(false)
    updateSessionId(null)

    try {
      const session = await createChatSession()
      updateSessionId(session.id)
      setSessions(await getChatSessions())
    } catch {}
  }, [stopAskStream, updateSessionId])

  const handleOpenHistory = useCallback(async () => {
    try {
      setSessions(await getChatSessions())
    } catch {}
    setShowHistory(true)
  }, [])

  const handleSwitchSession = useCallback(
    async (sessionId: string) => {
      try {
        const savedMessages = await getChatMessages(sessionId)
        stopAskStream()
        updateSessionId(sessionId)
        isNearBottomRef.current = true
        setMessages(savedMessages.map(toChatMessage))
        setSuggestions([])
        setShowHistory(false)
        setShowConfirmClear(false)
      } catch {}
    },
    [stopAskStream, updateSessionId]
  )

  const handleLogin = () => {
    setIsOpen(false)
    setShowLoginPrompt(false)
    router.push('/auth/login')
  }

  const lastMessage = messages[messages.length - 1]
  const isBusy = isSubmitting || isRegenerating
  // 串流中的回答已有文字或工具進度時，由泡泡本身呈現，不再顯示 loading 列
  const hasStreamingOutput =
    lastMessage?.status === 'streaming' &&
    (!!lastMessage.content || (lastMessage.tools?.length ?? 0) > 0)

  return (
    <>
      <Pressable style={styles.floatingButton} onPress={handleOpen}>
        <MessageCircle size={24} color="#FFFFFF" />
      </Pressable>

      <Modal visible={isOpen} animationType="slide" onRequestClose={() => setIsOpen(false)}>
        <SafeAreaView style={styles.modal}>
          <KeyboardAvoidingView
            style={styles.keyboardView}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.header}>
              <View>
                <Text variant="h3" fontWeight="700">
                  攀岩 AI 助手
                </Text>
                <Text variant="small" color="textMuted">
                  {quota
                    ? `${quota.tier_display} · 今日剩餘 ${quota.remaining} 次`
                    : '路線推薦與攀岩知識'}
                </Text>
              </View>
              <View style={styles.headerActions}>
                {isAuthenticated && !showHistory && (
                  <>
                    {messages.length > 0 &&
                      (showConfirmClear ? (
                        <View style={styles.confirmClear}>
                          <Text variant="caption" color="textMuted">
                            清除？
                          </Text>
                          <Pressable onPress={handleClear} style={styles.confirmAction}>
                            <Text variant="caption" style={styles.dangerText}>
                              確定
                            </Text>
                          </Pressable>
                          <Pressable
                            onPress={() => setShowConfirmClear(false)}
                            style={styles.confirmAction}
                          >
                            <Text variant="caption" color="textMuted">
                              取消
                            </Text>
                          </Pressable>
                        </View>
                      ) : (
                        <IconButton
                          icon={<Trash2 size={19} color={SEMANTIC_COLORS.textMuted} />}
                          variant="ghost"
                          onPress={() => setShowConfirmClear(true)}
                        />
                      ))}
                    <IconButton
                      icon={<SquarePen size={19} color={SEMANTIC_COLORS.textMuted} />}
                      variant="ghost"
                      onPress={handleNewChat}
                    />
                    <IconButton
                      icon={<History size={19} color={SEMANTIC_COLORS.textMuted} />}
                      variant="ghost"
                      onPress={handleOpenHistory}
                    />
                  </>
                )}
                {showHistory && (
                  <IconButton
                    icon={<ChevronLeft size={20} color={SEMANTIC_COLORS.textMuted} />}
                    variant="ghost"
                    onPress={() => setShowHistory(false)}
                  />
                )}
                <IconButton
                  icon={<X size={22} color={SEMANTIC_COLORS.textMain} />}
                  variant="ghost"
                  onPress={() => {
                    setIsOpen(false)
                    setShowHistory(false)
                    setShowConfirmClear(false)
                  }}
                />
              </View>
            </View>

            {showHistory ? (
              <ScrollView style={styles.messages} contentContainerStyle={styles.historyContent}>
                <Text variant="small" color="textMuted">
                  最近對話
                </Text>
                {sessions.length === 0 ? (
                  <Text variant="body" color="textMuted" style={styles.emptyHistory}>
                    還沒有歷史對話
                  </Text>
                ) : (
                  sessions.map((session) => (
                    <Pressable
                      key={session.id}
                      style={[
                        styles.sessionItem,
                        session.id === currentSessionId && styles.activeSessionItem,
                      ]}
                      onPress={() => handleSwitchSession(session.id)}
                    >
                      <Text variant="bodyBold" numberOfLines={1}>
                        {session.title}
                      </Text>
                      <Text variant="caption" color="textMuted">
                        {formatRelativeTime(session.updated_at)}
                      </Text>
                    </Pressable>
                  ))
                )}
              </ScrollView>
            ) : (
              <>
                <ScrollView
                  ref={scrollRef}
                  style={styles.messages}
                  contentContainerStyle={styles.messagesContent}
                  onScroll={handleScroll}
                  scrollEventThrottle={100}
                >
                  {messages.length === 0 ? (
                    <View style={styles.emptyState}>
                      <View style={styles.emptyIcon}>
                        <MessageCircle size={28} color={WB_COLORS[100]} />
                      </View>
                      <Text variant="h4" fontWeight="700">
                        想找下一條路線？
                      </Text>
                      <Text variant="body" color="textMuted" style={styles.emptyCopy}>
                        詢問岩場、難度、風格或根據完攀紀錄取得建議。
                      </Text>
                    </View>
                  ) : (
                    messages.map((message, index) => {
                      // 只有最後一則可重新生成的回答拿到會變動的 props，其餘維持穩定參考
                      const canRegenerate =
                        index === messages.length - 1 && canRegenerateMessage(message)
                      return (
                        <MessageBubble
                          key={message.id}
                          message={message}
                          canRegenerate={canRegenerate}
                          isPending={canRegenerate && isBusy}
                          onRegenerate={canRegenerate ? handleRegenerate : undefined}
                        />
                      )
                    })
                  )}

                  {isBusy && !hasStreamingOutput && (
                    <View style={styles.loadingRow}>
                      <Loader2 size={16} color={SEMANTIC_COLORS.textMuted} />
                      <Text variant="small" color="textMuted">
                        AI 正在整理建議...
                      </Text>
                    </View>
                  )}

                  {showLoginPrompt && (
                    <View style={styles.loginPrompt}>
                      <Text variant="bodyBold">登入後即可使用 AI 助手</Text>
                      <Text variant="small" color="textMuted">
                        AI 會根據你的攀登紀錄與平台資料給出更準確的推薦。
                      </Text>
                      <Button variant="primary" onPress={handleLogin} style={styles.loginButton}>
                        <Text fontWeight="600" style={styles.primaryText}>
                          前往登入
                        </Text>
                      </Button>
                    </View>
                  )}
                </ScrollView>

                {suggestions.length > 0 && (
                  <View style={styles.suggestions}>
                    <View style={styles.suggestionsHeader}>
                      <Text variant="small" color="textMuted">
                        建議問題
                      </Text>
                      <ChevronDown size={14} color={SEMANTIC_COLORS.textMuted} />
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {suggestions.map((suggestion) => (
                        <Pressable
                          key={suggestion}
                          style={styles.suggestionChip}
                          onPress={() => handleSubmit(suggestion)}
                        >
                          <Text variant="small">{suggestion}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}

                <View style={styles.inputBar}>
                  <TextInput
                    style={styles.input}
                    value={input}
                    onChangeText={setInput}
                    placeholder="輸入問題..."
                    placeholderTextColor={SEMANTIC_COLORS.textMuted}
                    multiline
                    maxLength={500}
                  />
                  {isStreaming ? (
                    <IconButton
                      icon={<Square size={16} color={SEMANTIC_COLORS.buttonPrimaryText} />}
                      variant="primary"
                      onPress={stopAskStream}
                    />
                  ) : (
                    <IconButton
                      icon={<Send size={18} color={SEMANTIC_COLORS.buttonPrimaryText} />}
                      variant="primary"
                      disabled={isBusy || !input.trim()}
                      onPress={() => handleSubmit(input)}
                    />
                  )}
                </View>
              </>
            )}
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    right: SPACING.md,
    bottom: SPACING.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: SEMANTIC_COLORS.textMain,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  modal: {
    flex: 1,
    backgroundColor: SEMANTIC_COLORS.pageBg,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  confirmClear: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  confirmAction: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 4,
  },
  dangerText: {
    color: '#D92D20',
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.sm,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFE70C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCopy: {
    textAlign: 'center',
    lineHeight: 22,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  userMessageRow: {
    flexDirection: 'row-reverse',
  },
  messageIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userIcon: {
    backgroundColor: SEMANTIC_COLORS.textMain,
  },
  assistantIcon: {
    backgroundColor: '#FFE70C',
  },
  messageBubble: {
    maxWidth: '82%',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  userBubble: {
    backgroundColor: SEMANTIC_COLORS.textMain,
  },
  assistantBubble: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  userMessageText: {
    color: '#FFFFFF',
    lineHeight: 22,
  },
  assistantMessageText: {
    color: SEMANTIC_COLORS.textMain,
    lineHeight: 22,
  },
  sources: {
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  sourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: WB_COLORS[5],
  },
  sourceText: {
    flex: 1,
  },
  regenerateButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: SPACING.xs,
  },
  disabledButton: {
    opacity: 0.45,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  loginPrompt: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  loginButton: {
    alignSelf: 'flex-start',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  suggestions: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: SEMANTIC_COLORS.cardBg,
    gap: SPACING.xs,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  suggestionChip: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    marginRight: SPACING.sm,
  },
  historyContent: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  emptyHistory: {
    textAlign: 'center',
    paddingVertical: SPACING.xl,
  },
  sessionItem: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: SEMANTIC_COLORS.cardBg,
    padding: SPACING.md,
    gap: 4,
  },
  activeSessionItem: {
    borderColor: SEMANTIC_COLORS.textMain,
    backgroundColor: WB_COLORS[5],
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: SEMANTIC_COLORS.cardBg,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#D3D3D3',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: SEMANTIC_COLORS.textMain,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
  },
})

export default ChatWidget
