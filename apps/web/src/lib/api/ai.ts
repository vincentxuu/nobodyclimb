import type { AiLocale, AiQuota, PaginationInfo } from '@nobodyclimb/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from './client'

export type { AiLocale, AiQuota }

// =============================================
// TypeScript 介面
// =============================================

export interface AISource {
  id: string
  type: 'route' | 'crag' | 'video'
  title: string
  excerpt: string
  url?: string
  score: number
  latestVideoUrl?: string // 路線最新影片 YouTube URL（僅 route 類型）
}

export interface AIChatHistoryMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AIAskRequest {
  query: string
  limit?: number
  include_sources?: boolean
  chat_history?: AIChatHistoryMessage[]
  no_cache?: boolean
  /** 介面語言，後端據此決定回答語言 */
  locale?: AiLocale
  /** 帶了就由後端寫入 user / assistant 訊息並更新 session 標題（前端不可再呼叫 saveMessage） */
  session_id?: string
  /** 搭配 session_id：不新增 user 訊息，以新回答取代該 session 最後一則 assistant 訊息 */
  regenerate?: boolean
}

export interface AIAskResponse {
  answer: string
  sources: AISource[]
  query_id: string
  suggested_questions: string[]
  quota?: AiQuota
  clarification_needed?: boolean
  clarification_options?: string[]
  query_route?: string
}

export interface AISearchRequest {
  query: string
  type?: 'route' | 'crag' | 'video'
  limit?: number
  filters?: {
    region?: string
    grade_min?: number
    grade_max?: number
    route_type?: string
    crag_id?: string
  }
}

export interface AISearchResponse {
  results: AISource[]
  count: number
}

export interface AIFeedbackRequest {
  query_id: string
  score: 1 | 2 | 3 | 4 | 5
  text?: string
}

export interface AIHealthResponse {
  status: 'healthy' | 'unhealthy'
  ai: boolean
}

export interface RecommendationPayload {
  answer: string
  sources: AISource[]
  query: string
  context_ascents: Array<{ route_name: string; grade: string; crag_name: string }>
}

export interface Recommendation {
  id: string
  triggered_by: 'ascent' | 'manual'
  status: 'success' | 'failed'
  recommendation: RecommendationPayload
  created_at: string
}

export interface RecommendationsResponse {
  data: Recommendation[]
  total: number
}

export interface ChatSession {
  id: string
  title: string
  created_at: number
  updated_at: number
}

export interface ChatMessage {
  id: string
  session_id?: string
  role: 'user' | 'assistant'
  content: string
  /** 後端可能回 JSON 字串或陣列，解析見 lib/chat/messages.ts 的 mapStoredMessages */
  suggested_questions?: string[] | string | null
  sources?: AISource[] | null
  /** 'stopped' = 使用者中斷生成，content 為中斷前的部分內容 */
  status?: string | null
  query_id?: string
  created_at: number
}

export interface ChatSessionsPage {
  sessions: ChatSession[]
  pagination: PaginationInfo
}

export interface SaveMessageRequest {
  role: 'user' | 'assistant'
  content: string
  suggested_questions?: string[]
  query_id?: string
}

// =============================================
// API 函式
// =============================================

export interface AIStreamDoneEvent {
  query_id: string
  answer?: string
  sources: AISource[]
  suggested_questions: string[]
  quota_remaining: number
}

// 後端 progress 事件：同名 tool 並行時以 id 區分 invocation
// executing 事件帶 input（Request）；done 事件帶截斷後的 output（Response）、is_error、duration_ms
export interface AIStreamProgressEvent {
  id: string
  tool: string
  status: 'executing' | 'done'
  input?: unknown
  output?: string
  is_error?: boolean
  duration_ms?: number
}

// 機器可讀錯誤碼：後端 HTTP 錯誤 / SSE error 事件的 code，另加前端自訂的 network、unknown
// 顯示文字由元件以 Chat.errors.<code> 翻譯，這一層不放任何語系字串
export const AI_ERROR_CODES = [
  'rate_limited',
  'quota_exceeded',
  'token_quota_exceeded',
  'invalid_input',
  'session_not_found',
  'timeout',
  'circuit_open',
  'internal',
  'network',
  'unknown',
] as const

export type AIErrorCode = (typeof AI_ERROR_CODES)[number]

// 429 回應的 data（配額耗盡時後端附帶的配額現況）
export interface AIQuotaErrorData {
  tier?: string
  tier_display?: string
  daily_limit?: number
  daily_used?: number
  resets_at?: string
}

export interface AIRequestError {
  code: AIErrorCode
  status?: number
  data?: AIQuotaErrorData
}

// 後端 400 的 code 是 PascalCase 的 InvalidInput，這裡統一成 snake_case；不認得的一律 unknown
export function normalizeAIErrorCode(raw: unknown): AIErrorCode {
  if (raw === 'InvalidInput') return 'invalid_input'
  return (AI_ERROR_CODES as readonly unknown[]).includes(raw) ? (raw as AIErrorCode) : 'unknown'
}

// HTTP 錯誤回應 { success:false, error:<code>, message, data? } → 結構化錯誤
export function parseAIErrorResponse(status: number | undefined, body: unknown): AIRequestError {
  const json = (body && typeof body === 'object' ? body : {}) as { error?: unknown; data?: unknown }
  let code = normalizeAIErrorCode(json.error)
  // 舊後端的 429 可能沒帶 code，視為次數配額用盡（原本的行為）
  if (code === 'unknown' && status === 429) code = 'quota_exceeded'
  const data =
    json.data && typeof json.data === 'object' ? (json.data as AIQuotaErrorData) : undefined
  return { code, status, ...(data ? { data } : {}) }
}

// 非串流（axios）錯誤 → 結構化錯誤；沒有 response 代表連不上或逾時
export function toAIRequestError(error: unknown): AIRequestError {
  const response = (error as { response?: { status?: number; data?: unknown } } | null)?.response
  if (!response) return { code: 'network' }
  return parseAIErrorResponse(response.status, response.data)
}

function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === 'AbortError'
}

// SSE 串流問答：使用 fetch + ReadableStream 接收，支援 AbortController 取消
// 使用者主動取消（abort）時靜默結束，不呼叫 onDone / onError
export async function askAIStream(
  request: AIAskRequest,
  onToken: (_token: string) => void,
  onDone: (_event: AIStreamDoneEvent) => void,
  onError: (_error: AIRequestError) => void,
  signal?: AbortSignal,
  onProgress?: (_event: AIStreamProgressEvent) => void,
  // 後端作廢先前推送的 token（agent 該輪改為呼叫工具、或 LLM 呼叫重試）：呼叫端要清空已累積的文字
  onReset?: () => void
): Promise<void> {
  const { API_BASE_URL } = await import('../constants')
  const { getAccessToken } = await import('@nobodyclimb/api-client/web')
  const token = getAccessToken()

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}/ai/ask?stream=true`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(request),
      signal,
    })
  } catch (err) {
    if (!isAbortError(err)) onError({ code: 'network' })
    return
  }

  if (!response.ok || !response.body) {
    // 讀取後端回傳的錯誤碼（如 guardrails 攔截、配額耗盡等）
    let body: unknown
    try {
      body = await response.json()
    } catch {
      body = undefined
    }
    onError(parseAIErrorResponse(response.status, body))
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  // 是否已收到 done / error：串流沒有結尾事件就斷線時要補一個 network 錯誤，避免訊息卡在串流中
  let settled = false

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const jsonStr = line.slice(6).trim()
        if (!jsonStr) continue
        try {
          const event = JSON.parse(jsonStr) as {
            type: string
            token?: string
            id?: string
            tool?: string
            status?: string
            input?: unknown
            output?: string
            is_error?: boolean
            duration_ms?: number
          } & Partial<AIStreamDoneEvent> & { code?: string }
          if (event.type === 'token' && event.token !== undefined) {
            onToken(event.token)
          } else if (event.type === 'done') {
            settled = true
            onDone(event as AIStreamDoneEvent)
          } else if (event.type === 'progress' && onProgress) {
            onProgress({
              // 舊後端可能沒送 id，退回以 tool 名合併（舊行為）
              id: typeof event.id === 'string' && event.id ? event.id : (event.tool as string),
              tool: event.tool as string,
              status: event.status as 'executing' | 'done',
              input: event.input,
              output: event.output,
              is_error: event.is_error,
              duration_ms: event.duration_ms,
            })
          } else if (event.type === 'token_reset') {
            onReset?.()
          } else if (event.type === 'error') {
            settled = true
            onError({ code: normalizeAIErrorCode(event.code) })
          }
        } catch {
          // 忽略無法解析的行
        }
      }
    }
    if (!settled && !signal?.aborted) onError({ code: 'network' })
  } catch (err) {
    // AbortError 是用戶主動取消，靜默結束；其他錯誤呼叫 onError
    if (!settled && !isAbortError(err)) onError({ code: 'network' })
  } finally {
    reader.releaseLock()
  }
}

export async function askAI(request: AIAskRequest, signal?: AbortSignal): Promise<AIAskResponse> {
  // AI 推理包含 embedding + 向量搜尋 + 多次 LLM，最多需要 60 秒
  const response = await apiClient.post<{ success: boolean; data: AIAskResponse }>(
    '/ai/ask',
    request,
    { timeout: 60000, signal }
  )
  return response.data.data
}

export async function searchAI(request: AISearchRequest): Promise<AISearchResponse> {
  const params = new URLSearchParams({ q: request.query })
  if (request.type) params.set('type', request.type)
  if (request.limit) params.set('limit', String(request.limit))
  if (request.filters?.region) params.set('region', request.filters.region)
  if (request.filters?.grade_min !== undefined)
    params.set('grade_min', String(request.filters.grade_min))
  if (request.filters?.grade_max !== undefined)
    params.set('grade_max', String(request.filters.grade_max))
  if (request.filters?.route_type) params.set('route_type', request.filters.route_type)
  if (request.filters?.crag_id) params.set('crag_id', request.filters.crag_id)

  const response = await apiClient.get<{ success: boolean; data: AISearchResponse }>(
    `/ai/search?${params.toString()}`
  )
  return response.data.data
}

export async function submitFeedback(request: AIFeedbackRequest): Promise<void> {
  await apiClient.post('/ai/feedback', request)
}

export async function checkAIHealth(): Promise<AIHealthResponse> {
  const response = await apiClient.get<{ success: boolean } & AIHealthResponse>('/ai/health')
  return response.data
}

// =============================================
// TanStack Query Hooks
// =============================================

export function useAskAI() {
  return useMutation({
    mutationFn: (request: AIAskRequest) => askAI(request),
  })
}

export function useSearchAI(request: AISearchRequest, enabled = true) {
  return useQuery({
    queryKey: ['ai-search', request],
    queryFn: () => searchAI(request),
    enabled: enabled && request.query.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 分鐘
    gcTime: 10 * 60 * 1000,
  })
}

export function useSubmitFeedback() {
  return useMutation({
    mutationFn: submitFeedback,
  })
}

export async function getMyQuota(): Promise<AiQuota> {
  const response = await apiClient.get<{ success: boolean; data: AiQuota }>('/ai/quota/me')
  return response.data.data
}

export function useMyQuota(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['ai-quota-me'],
    queryFn: getMyQuota,
    staleTime: 30 * 1000,
    retry: false,
    enabled: options?.enabled ?? true,
  })
}

// =============================================
// Chat Session API 函式
// =============================================

export async function createChatSession(): Promise<ChatSession> {
  const response = await apiClient.post<{ success: boolean; data: ChatSession }>('/ai/sessions')
  return response.data.data
}

export async function getChatSessions(): Promise<ChatSession[]> {
  const response = await apiClient.get<{ success: boolean; data: ChatSession[] }>('/ai/sessions')
  return response.data.data
}

// 分頁版：GET /ai/sessions?page=&limit=，回傳 pagination 信封
export async function getChatSessionsPage(page = 1, limit = 20): Promise<ChatSessionsPage> {
  const response = await apiClient.get<{
    success: boolean
    data: ChatSession[]
    pagination?: PaginationInfo
  }>('/ai/sessions', { params: { page, limit } })
  const sessions = response.data.data
  return {
    sessions,
    // 舊後端不回 pagination：視為只有這一頁
    pagination: response.data.pagination ?? {
      page,
      limit,
      total: sessions.length,
      total_pages: 1,
    },
  }
}

export async function getChatMessages(sessionId: string): Promise<ChatMessage[]> {
  const response = await apiClient.get<{ success: boolean; data: ChatMessage[] }>(
    `/ai/sessions/${sessionId}/messages`
  )
  return response.data.data
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  await apiClient.delete(`/ai/sessions/${sessionId}`)
}

// 注意：/ai/ask 帶 session_id 時訊息由後端寫入，聊天流程不可再呼叫這支（會重複寫入）
export async function saveMessage(
  sessionId: string,
  message: SaveMessageRequest
): Promise<{ id: string }> {
  const response = await apiClient.post<{ success: boolean; data: { id: string } }>(
    `/ai/sessions/${sessionId}/messages`,
    message
  )
  return response.data.data
}

export function useCreateChatSession() {
  return useMutation({ mutationFn: createChatSession })
}

export function useGetChatSessions() {
  return useQuery({
    queryKey: ['chat-sessions'],
    queryFn: getChatSessions,
    staleTime: 30 * 1000,
  })
}

export function useDeleteChatSession() {
  return useMutation({ mutationFn: deleteChatSession })
}

export function useSaveMessage(sessionId: string) {
  return useMutation({
    mutationFn: (message: SaveMessageRequest) => saveMessage(sessionId, message),
  })
}

// =============================================
// Recommendations API 函式
// =============================================

export async function fetchRecommendations(params: {
  limit?: number
  offset?: number
}): Promise<RecommendationsResponse> {
  const { limit = 10, offset = 0 } = params
  const response = await apiClient.get<{ success: boolean; data: Recommendation[]; total: number }>(
    `/ai/recommendations?limit=${limit}&offset=${offset}`
  )
  return { data: response.data.data, total: response.data.total }
}

export async function triggerManualRecommendation(): Promise<Recommendation> {
  // AI 推薦包含完整 RAG pipeline，最多需要 60 秒
  const response = await apiClient.post<{ success: boolean; data: Recommendation }>(
    '/ai/recommendations',
    undefined,
    { timeout: 60000 }
  )
  return response.data.data
}

export function useRecommendations(params: { limit?: number; offset?: number } = {}) {
  return useQuery({
    queryKey: ['ai-recommendations', params],
    queryFn: () => fetchRecommendations(params),
    staleTime: 30 * 1000,
  })
}

export function useTriggerRecommendation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: triggerManualRecommendation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-recommendations'] })
    },
  })
}

// =============================================
// Goals API 函式
// =============================================

export interface UserGoal {
  id: string
  goal_type: 'grade' | 'route' | 'volume' | 'custom'
  title: string
  target: string
  current_value: string | null
  status: 'active' | 'achieved' | 'paused' | 'abandoned'
  notes: string | null
  target_date: string | null
  achieved_at: string | null
  created_at: string
  updated_at: string
}

export async function getGoals(): Promise<UserGoal[]> {
  const res = await apiClient.get<{ success: boolean; data: UserGoal[] }>('/ai/goals')
  return res.data.data
}

export async function createGoal(goal: {
  goal_type: string
  title: string
  target: string
  target_date?: string
}): Promise<UserGoal> {
  const res = await apiClient.post<{ success: boolean; data: UserGoal }>('/ai/goals', goal)
  return res.data.data
}

export async function achieveGoal(goalId: string): Promise<void> {
  await apiClient.post(`/ai/goals/${goalId}/achieve`)
}

export async function deleteGoal(goalId: string): Promise<void> {
  await apiClient.delete(`/ai/goals/${goalId}`)
}

// =============================================
// Coaching Analysis API
// =============================================

export interface CoachingExercise {
  nameZh: string
  reps: string
  sets: [number, number]
  sessionsPerWeek: [number, number]
}

export interface CoachingWeakness {
  id: string
  description: string
  exercises: string[]
}

export interface CoachingPersonality {
  code: string
  nameZh: string
  nameEn: string
  keywords: string[]
  strengths: string[]
  blindSpots: string[]
  trainingSchool: string
  schoolDescription: string
}

export interface CoachingLevelRecommendation {
  label: string
  daysPerWeek: [number, number]
  focusAreas: string[]
  avoid: string[]
  exercises: CoachingExercise[]
}

export interface CoachingTrainingProgress {
  completed: number
  total: number
  completionRate: number
  lastCompleted: { week: number; day: number } | null
}

export interface CoachingGoal {
  title: string
  target: string
  currentProgress: string | null
  status: string
}

export interface CoachingAnalysis {
  level: string
  totalAscents: number
  uniqueCrags: number
  personality: CoachingPersonality | null
  weaknesses: CoachingWeakness[]
  levelRecommendation: CoachingLevelRecommendation | null
  trainingProgress: CoachingTrainingProgress | null
  goals: CoachingGoal[]
}

export async function getCoachingAnalysis(): Promise<CoachingAnalysis> {
  const res = await apiClient.get<{ success: boolean; data: CoachingAnalysis }>(
    '/coaching/analysis',
    { timeout: 30000 }
  )
  return res.data.data
}

export function useCoachingAnalysis() {
  return useQuery({
    queryKey: ['coaching-analysis'],
    queryFn: getCoachingAnalysis,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}
