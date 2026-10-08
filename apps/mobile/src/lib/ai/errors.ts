/**
 * AI 問答錯誤：後端錯誤碼 → 顯示文案
 *
 * mobile 目前沒有 i18n 機制，文案比照 ChatWidget 既有寫法直接用繁體中文。
 */

/** 429 回應 `data` 帶的配額資訊 */
export interface AIQuotaErrorData {
  tier?: string
  tier_display?: string
  daily_limit: number
  daily_used: number
  resets_at?: string
}

export class AIChatError extends Error {
  readonly code: string
  readonly status?: number
  readonly quota?: AIQuotaErrorData
  /** 後端回傳的原始 message（例如 guardrails 攔截原因） */
  readonly serverMessage?: string

  constructor(
    code: string,
    options: { status?: number; quota?: AIQuotaErrorData; serverMessage?: string } = {}
  ) {
    super(options.serverMessage ?? code)
    this.name = 'AIChatError'
    this.code = code
    this.status = options.status
    this.quota = options.quota
    this.serverMessage = options.serverMessage
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function parseQuotaErrorData(value: unknown): AIQuotaErrorData | undefined {
  if (!isRecord(value)) return undefined
  if (typeof value.daily_limit !== 'number' || typeof value.daily_used !== 'number') {
    return undefined
  }
  return {
    tier: typeof value.tier === 'string' ? value.tier : undefined,
    tier_display: typeof value.tier_display === 'string' ? value.tier_display : undefined,
    daily_limit: value.daily_limit,
    daily_used: value.daily_used,
    resets_at: typeof value.resets_at === 'string' ? value.resets_at : undefined,
  }
}

/** 由 HTTP 錯誤回應（`{success:false, error, message, data?}`）組出 AIChatError */
export function createErrorFromResponse(status: number, body: unknown): AIChatError {
  const record = isRecord(body) ? body : {}
  const code =
    typeof record.error === 'string' && record.error
      ? record.error
      : status === 429
        ? 'quota_exceeded'
        : 'internal'
  return new AIChatError(code, {
    status,
    quota: parseQuotaErrorData(record.data),
    serverMessage: typeof record.message === 'string' ? record.message : undefined,
  })
}

const DEFAULT_MESSAGE = '抱歉，AI 服務暫時無法使用，請稍後再試。'

export function getAIErrorMessage(error: unknown): string {
  if (!(error instanceof AIChatError)) return DEFAULT_MESSAGE

  switch (error.code) {
    case 'quota_exceeded':
      return error.quota
        ? `今日 AI 使用配額已用盡（${error.quota.daily_used}/${error.quota.daily_limit} 次）。配額將於明日重置。`
        : '今日 AI 使用配額已用盡。配額將於明日重置。'
    case 'token_quota_exceeded':
      return '今日 AI 用量已達上限，配額將於明日重置。'
    case 'rate_limited':
      return '操作太頻繁了，請稍後再試。'
    case 'InvalidInput':
    case 'invalid_input':
      // 輸入被擋下時後端 message 會說明原因，優先顯示
      return error.serverMessage ?? '這個問題無法處理，請調整內容後再試。'
    case 'session_not_found':
      return '找不到這段對話，請重新送出問題。'
    case 'timeout':
      return 'AI 回應逾時，請稍後再試。'
    case 'circuit_open':
      return 'AI 服務目前忙碌中，請稍後再試。'
    case 'interrupted':
      return '生成中斷，請重試。'
    default:
      return DEFAULT_MESSAGE
  }
}
