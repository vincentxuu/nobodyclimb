'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  AIAskRequest,
  AIRequestError,
  AISource,
  AiLocale,
  AiQuota,
  ChatSession,
} from '@/lib/api/ai'
import {
  askAI,
  askAIStream,
  createChatSession,
  deleteChatSession,
  getChatMessages,
  getChatSessionsPage,
  getMyQuota,
  toAIRequestError,
} from '@/lib/api/ai'
import type { ChatMessageData } from '@/lib/chat/messages'
import {
  applyQuotaExceeded,
  applyQuotaRemaining,
  buildChatHistory,
  getQuotaExceededUsage,
  getRegenerateTarget,
  mapStoredMessages,
} from '@/lib/chat/messages'
import { DRAIN_INTERVAL_MS, getDrainBatchSize } from '@/lib/chat/token-queue'
import { upsertToolProgress } from '@/lib/chat/tool-progress'
import { useAuthStore } from '@/store/authStore'

const ENABLE_STREAMING = process.env.NEXT_PUBLIC_ENABLE_AI_STREAMING === 'true'

const SESSIONS_PAGE_SIZE = 20

interface UseChatSessionOptions {
  /** 介面語言，後端據此決定回答語言 */
  locale: AiLocale
  /** false 時不做初始載入（widget 關閉時）；預設 true */
  enabled?: boolean
  /** 指定要接續的 session（全頁的 ?session=<id>）；沒給就載入最近一個 */
  initialSessionId?: string | null
}

interface AnswerResult {
  answer?: string
  sources: AISource[]
  queryId: string
  suggestedQuestions: string[]
}

// 佔位的 assistant 訊息：串流 / 非串流都先放一則，由訊息元件顯示思考中與工具過程
function createPlaceholder(): ChatMessageData {
  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    content: '',
    isStreaming: true,
    toolProgress: [],
  }
}

// 浮動 widget 與全頁 /chat 共用的對話狀態：送訊息（串流 / 非串流）、停止、重新生成、
// session 載入 / 切換 / 新增 / 刪除、配額與錯誤處理。
// 訊息持久化由後端負責（/ai/ask 帶 session_id），這裡不呼叫 saveMessage。
// 錯誤只記錯誤碼（message.error），顯示文字由 UI 翻譯，hook 本身不依賴 i18n。
export function useChatSession({
  locale,
  enabled = true,
  initialSessionId = null,
}: UseChatSessionOptions) {
  const isAuthenticated = useAuthStore((s) => s.user) !== null

  const [messages, setMessages] = useState<ChatMessageData[]>([])
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [hasMoreSessions, setHasMoreSessions] = useState(false)
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)
  const [quota, setQuota] = useState<AiQuota | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  // ref 讓穩定的 callback（deps 不含 state）永遠讀到最新值，避免 stale closure；
  // callback 穩定才能讓 memo 過的訊息元件在串流時不跟著重繪
  const messagesRef = useRef(messages)
  messagesRef.current = messages
  const quotaRef = useRef(quota)
  quotaRef.current = quota
  const localeRef = useRef(locale)
  localeRef.current = locale
  const isAuthenticatedRef = useRef(isAuthenticated)
  isAuthenticatedRef.current = isAuthenticated
  const sessionIdRef = useRef<string | null>(null)
  // ref 確保多次快速點擊時 guard 是同步的
  const busyRef = useRef(false)
  // 每次送出 / 停止 / 切換對話都換一個 run id，過期的非同步 callback 一律丟棄
  const runIdRef = useRef(0)
  // session 載入（初始 / 切換）的序號，後發先至時丟棄舊結果
  const loadSeqRef = useRef(0)
  const sessionsPageRef = useRef(0)
  const abortControllerRef = useRef<AbortController | null>(null)
  const tokenQueueRef = useRef<string[]>([])
  const drainTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // 停止時要把佇列剩餘的字補進哪一則訊息
  const activeMessageIdRef = useRef<string | null>(null)

  const updateSessionId = useCallback((id: string | null) => {
    sessionIdRef.current = id
    setSessionId(id)
  }, [])

  const setBusy = useCallback((busy: boolean) => {
    busyRef.current = busy
    setIsBusy(busy)
  }, [])

  const patchMessage = useCallback(
    (id: string, patch: (_message: ChatMessageData) => ChatMessageData) => {
      // 只換被更新的那一則，其餘維持同一個物件參考（memo 才有效）
      setMessages((prev) => prev.map((m) => (m.id === id ? patch(m) : m)))
    },
    []
  )

  // 把佇列剩餘的 token 一次補進訊息並停掉 drain timer
  const flushTokenQueue = useCallback(
    (messageId: string | null) => {
      if (drainTimerRef.current) {
        clearTimeout(drainTimerRef.current)
        drainTimerRef.current = null
      }
      const rest = tokenQueueRef.current.join('')
      tokenQueueRef.current = []
      if (rest && messageId) patchMessage(messageId, (m) => ({ ...m, content: m.content + rest }))
    },
    [patchMessage]
  )

  // 中止進行中的請求。markStopped：把該則訊息標成使用者中斷（切換 / 清除對話時訊息會整批換掉，不需要）
  const cancelRun = useCallback(
    (markStopped: boolean) => {
      runIdRef.current++
      abortControllerRef.current?.abort()
      abortControllerRef.current = null
      const messageId = activeMessageIdRef.current
      activeMessageIdRef.current = null
      // 後端會把中斷前已產生的內容存進 session，這裡也把還沒吐完的字補上，兩邊一致
      flushTokenQueue(markStopped ? messageId : null)
      if (markStopped && messageId) {
        patchMessage(messageId, (m) => ({ ...m, isStreaming: false, status: 'stopped' }))
      }
      setBusy(false)
    },
    [flushTokenQueue, patchMessage, setBusy]
  )

  const stop = useCallback(() => {
    if (!busyRef.current) return
    cancelRun(true)
  }, [cancelRun])

  const resetConversation = useCallback(() => {
    cancelRun(false)
    loadSeqRef.current++
    setMessages([])
    setSuggestedQuestions([])
    setShowLoginPrompt(false)
    updateSessionId(null)
  }, [cancelRun, updateSessionId])

  // 錯誤統一處理：串流 / 非串流、送出 / 重新生成共用這一份
  const handleRequestError = useCallback(
    (messageId: string, error: AIRequestError) => {
      let messageError: ChatMessageData['error'] = { code: error.code }
      if (error.code === 'quota_exceeded') {
        messageError = { code: error.code, ...getQuotaExceededUsage(quotaRef.current, error.data) }
        setQuota((prev) => applyQuotaExceeded(prev, error.data))
      } else if (error.status === 429) {
        // rate_limited / token_quota_exceeded：回應沒有完整配額，向後端重取
        getMyQuota()
          .then(setQuota)
          .catch(() => {})
      } else if (error.code === 'session_not_found') {
        // session 已被刪除或不屬於目前使用者：丟掉，下次送出時會建立新的
        updateSessionId(null)
      }
      patchMessage(messageId, (m) => ({
        ...m,
        isStreaming: false,
        status: 'error',
        error: messageError,
      }))
    },
    [patchMessage, updateSessionId]
  )

  // 送出與重新生成共用的請求流程；呼叫前 busy 已鎖定、訊息列表已含佔位的 assistant 訊息
  const runQuery = useCallback(
    async (
      query: string,
      history: ChatMessageData[],
      assistantId: string,
      regenerate: boolean
    ): Promise<void> => {
      const runId = ++runIdRef.current
      const isStale = () => runIdRef.current !== runId
      const abortController = new AbortController()
      abortControllerRef.current = abortController
      activeMessageIdRef.current = assistantId

      // regenerate 旗標只在這一輪之前就有 session 時才帶：剛建立的空 session 沒有可取代的回答
      const replaceLastAnswer = regenerate && !!sessionIdRef.current

      // 還沒有 session 就先建立，讓後端能持久化這一輪；建立失敗仍可對話，只是不會保存
      if (!sessionIdRef.current) {
        try {
          const created = await createChatSession()
          if (isStale()) return
          updateSessionId(created.id)
        } catch {
          if (isStale()) return
        }
      }

      const sid = sessionIdRef.current
      const chatHistory = buildChatHistory(history)
      const request: AIAskRequest = {
        query,
        include_sources: true,
        chat_history: chatHistory.length > 0 ? chatHistory : undefined,
        locale: localeRef.current,
        ...(sid ? { session_id: sid } : {}),
        ...(regenerate ? { no_cache: true } : {}),
        ...(replaceLastAnswer ? { regenerate: true } : {}),
      }

      const finish = () => {
        abortControllerRef.current = null
        activeMessageIdRef.current = null
        setBusy(false)
      }

      const finalize = (result: AnswerResult) => {
        patchMessage(assistantId, (m) => ({
          ...m,
          isStreaming: false,
          // 用後端後處理版本（guard、已注入路線 / 影片連結、剝離 SUGGESTIONS）替換串流累積文字；
          // agent loop 內產生的答案可能不經過 token 事件，只在這裡送達
          ...(result.answer ? { content: result.answer } : {}),
          sources: result.sources,
          queryId: result.queryId,
          suggestedQuestions: result.suggestedQuestions,
        }))
        setSuggestedQuestions(result.suggestedQuestions)
        finish()
      }

      if (!ENABLE_STREAMING) {
        try {
          const data = await askAI(request, abortController.signal)
          if (isStale()) return
          if (data.quota) setQuota(data.quota)
          finalize({
            answer: data.answer,
            sources: data.sources,
            queryId: data.query_id,
            suggestedQuestions: data.suggested_questions ?? [],
          })
        } catch (error) {
          if (isStale()) return
          handleRequestError(assistantId, toAIRequestError(error))
          finish()
        }
        return
      }

      // 串流模式：用 token queue + setTimeout drain 解耦網路到達與畫面更新
      tokenQueueRef.current = []
      const drainQueue = () => {
        drainTimerRef.current = null
        if (isStale()) return
        const batch = tokenQueueRef.current.splice(
          0,
          getDrainBatchSize(tokenQueueRef.current.length)
        )
        if (batch.length === 0) return
        const text = batch.join('')
        patchMessage(assistantId, (m) => ({ ...m, content: m.content + text }))
        if (tokenQueueRef.current.length > 0) {
          drainTimerRef.current = setTimeout(drainQueue, DRAIN_INTERVAL_MS)
        }
      }

      await askAIStream(
        request,
        (token) => {
          if (isStale()) return
          tokenQueueRef.current.push(token)
          if (!drainTimerRef.current) drainTimerRef.current = setTimeout(drainQueue, 0)
        },
        (doneEvent) => {
          if (isStale()) return
          // done 帶的是完整答案，佇列剩餘的字不必再逐批吐，直接收尾
          flushTokenQueue(null)
          setQuota((prev) => applyQuotaRemaining(prev, doneEvent.quota_remaining))
          finalize({
            answer: doneEvent.answer,
            sources: doneEvent.sources,
            queryId: doneEvent.query_id,
            suggestedQuestions: doneEvent.suggested_questions ?? [],
          })
        },
        (error) => {
          if (isStale()) return
          // 已收到的字保留在訊息裡，錯誤提示由 UI 依 status 顯示
          flushTokenQueue(assistantId)
          handleRequestError(assistantId, error)
          finish()
        },
        abortController.signal,
        (progressEvent) => {
          if (isStale()) return
          // 以 invocation id 併入該則訊息的工具過程，供 ToolActivity 顯示
          patchMessage(assistantId, (m) => ({
            ...m,
            toolProgress: upsertToolProgress(m.toolProgress, progressEvent),
          }))
        },
        () => {
          if (isStale()) return
          // 已推送的文字作廢（例如呼叫工具前的前導句）：丟掉佇列並清空內容，工具過程與串流狀態不動
          flushTokenQueue(null)
          patchMessage(assistantId, (m) => ({ ...m, content: '' }))
        }
      )
    },
    [flushTokenQueue, handleRequestError, patchMessage, setBusy, updateSessionId]
  )

  const send = useCallback(
    (query: string) => {
      const trimmed = query.trim()
      if (!trimmed || busyRef.current) return

      // 未登入：顯示引導卡片，不送出
      if (!isAuthenticatedRef.current) {
        setShowLoginPrompt(true)
        return
      }

      setBusy(true)
      // 使用者已開始對話，進行中的 session 載入結果不可再覆蓋訊息
      loadSeqRef.current++
      const history = messagesRef.current
      const userMessage: ChatMessageData = {
        id: crypto.randomUUID(),
        role: 'user',
        content: trimmed,
      }
      const placeholder = createPlaceholder()
      setSuggestedQuestions([]) // 清除前一輪建議
      setMessages((prev) => [...prev, userMessage, placeholder])
      void runQuery(trimmed, history, placeholder.id, false)
    },
    [runQuery, setBusy]
  )

  // 重新生成最後一則 AI 回應：與一般送出走同一條路徑（串流時會顯示工具過程）
  const regenerate = useCallback(() => {
    if (busyRef.current) return
    const target = getRegenerateTarget(messagesRef.current)
    if (!target) return

    setBusy(true)
    loadSeqRef.current++
    const placeholder = createPlaceholder()
    setSuggestedQuestions([])
    setMessages([...target.kept, placeholder])
    void runQuery(target.query, target.before, placeholder.id, true)
  }, [runQuery, setBusy])

  // 開新對話（保留舊對話在歷史）；session 等第一次送出時才建立，避免留下空對話
  const newChat = useCallback(() => {
    resetConversation()
  }, [resetConversation])

  // 清除對話：刪除目前 session
  const clearChat = useCallback(async () => {
    const sid = sessionIdRef.current
    resetConversation()
    if (!sid) return
    try {
      await deleteChatSession(sid)
      setSessions((prev) => prev.filter((s) => s.id !== sid))
    } catch {
      // 靜默失敗：畫面已清空，舊對話仍留在歷史
    }
  }, [resetConversation])

  const loadSessionsPage = useCallback(async (page: number) => {
    setIsLoadingSessions(true)
    try {
      const result = await getChatSessionsPage(page, SESSIONS_PAGE_SIZE)
      sessionsPageRef.current = page
      setSessions((prev) => {
        if (page === 1) return result.sessions
        const seen = new Set(prev.map((s) => s.id))
        return [...prev, ...result.sessions.filter((s) => !seen.has(s.id))]
      })
      setHasMoreSessions(page < result.pagination.total_pages)
    } catch {
      // 靜默失敗，保留已載入的列表
    } finally {
      setIsLoadingSessions(false)
    }
  }, [])

  // 歷史面板：重新載入第一頁 / 載入下一頁
  const loadSessions = useCallback(() => loadSessionsPage(1), [loadSessionsPage])
  const loadMoreSessions = useCallback(
    () => loadSessionsPage(sessionsPageRef.current + 1),
    [loadSessionsPage]
  )

  // 切換 session；回傳是否成功，讓 UI 決定要不要關閉歷史面板
  const switchSession = useCallback(
    async (targetId: string): Promise<boolean> => {
      const seq = ++loadSeqRef.current
      try {
        const stored = await getChatMessages(targetId)
        if (loadSeqRef.current !== seq) return false
        cancelRun(false)
        updateSessionId(targetId)
        setMessages(mapStoredMessages(stored))
        setSuggestedQuestions([])
        return true
      } catch {
        return false
      }
    },
    [cancelRun, updateSessionId]
  )

  // 初始載入：指定的 session，否則最近一個 session；同時取得配額
  useEffect(() => {
    if (!enabled || !isAuthenticated) return

    getMyQuota()
      .then(setQuota)
      .catch(() => {})

    if (sessionIdRef.current || messagesRef.current.length > 0) return
    const seq = ++loadSeqRef.current
    const load = async () => {
      let targetId = initialSessionId
      if (!targetId) {
        const latest = await getChatSessionsPage(1, 1)
        targetId = latest.sessions[0]?.id ?? null
      }
      if (!targetId || loadSeqRef.current !== seq) return
      const stored = await getChatMessages(targetId)
      // 若使用者已搶先送出訊息或切到別的對話，不覆蓋既有 state
      if (loadSeqRef.current !== seq) return
      updateSessionId(targetId)
      setMessages(mapStoredMessages(stored))
    }
    load().catch(() => {
      // API 失敗或指定的 session 不存在：從空對話開始，送出時再建立 session
    })
  }, [enabled, isAuthenticated, initialSessionId, updateSessionId])

  // 登出：清掉上一位使用者的對話
  const wasAuthenticatedRef = useRef(isAuthenticated)
  useEffect(() => {
    const wasAuthenticated = wasAuthenticatedRef.current
    wasAuthenticatedRef.current = isAuthenticated
    if (!wasAuthenticated || isAuthenticated) return
    resetConversation()
    setSessions([])
    setQuota(null)
  }, [isAuthenticated, resetConversation])

  // 卸載：只停掉畫面更新，不中止請求，讓後端把這一輪跑完並寫入 session
  useEffect(() => {
    return () => {
      runIdRef.current++
      if (drainTimerRef.current) clearTimeout(drainTimerRef.current)
    }
  }, [])

  const dismissLoginPrompt = useCallback(() => setShowLoginPrompt(false), [])

  return {
    messages,
    suggestedQuestions,
    sessionId,
    sessions,
    hasMoreSessions,
    isLoadingSessions,
    quota,
    isAuthenticated,
    /** 有請求進行中（串流或非串流） */
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
  }
}
