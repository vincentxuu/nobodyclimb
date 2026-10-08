/**
 * askAI 的 fallback 邊界：只有「確定請求沒送達後端」才退回一次性請求（askAIOnce → apiClient.post）
 */
import { TextDecoder, TextEncoder } from 'node:util'
import { type AIAskStreamHandlers, askAI } from '../ask'
import { AIChatError } from '../errors'
import { loadExpoFetch } from '../expoFetch'

// jest-expo 環境沒有 TextEncoder / TextDecoder，串流解碼需要
Object.assign(globalThis, { TextEncoder, TextDecoder })

const mockPost = jest.fn()
// import 會被 hoist 到 mockPost 初始化之前，factory 內需延後取值
jest.mock('@/lib/api', () => ({
  apiClient: {
    defaults: { baseURL: 'https://api.test/api/v1' },
    post: (...args: unknown[]) => mockPost(...args),
  },
}))
jest.mock('@/lib/tokenStorage', () => ({
  tokenStorage: { getAccessToken: () => 'token' },
}))
jest.mock('../expoFetch', () => ({ loadExpoFetch: jest.fn() }))

const mockLoadExpoFetch = jest.mocked(loadExpoFetch)

/** 讓 loadExpoFetch 回傳指定的 fetch 實作 */
function useExpoFetch(expoFetch: jest.Mock) {
  mockLoadExpoFetch.mockResolvedValue({ fetch: expoFetch } as unknown as Awaited<
    ReturnType<typeof loadExpoFetch>
  >)
  return expoFetch
}

const REQUEST = { query: '龍洞', include_sources: true as const }

const handlers = (): AIAskStreamHandlers => ({
  onToken: jest.fn(),
  onTokenReset: jest.fn(),
  onProgress: jest.fn(),
})

/** 模擬 expo/fetch 回傳的 SSE Response：依序吐出 chunks，`readError` 會在 chunks 吐完後丟出 */
function createStreamResponse(chunks: string[], readError?: Error) {
  const encoder = new TextEncoder()
  const queue = [...chunks]
  return {
    ok: true,
    status: 200,
    body: {
      getReader: () => ({
        read: async () => {
          const chunk = queue.shift()
          if (chunk !== undefined) return { done: false, value: encoder.encode(chunk) }
          if (readError) throw readError
          return { done: true, value: undefined }
        },
        cancel: async () => {},
      }),
    },
  }
}

beforeEach(() => {
  mockPost.mockReset()
  mockLoadExpoFetch.mockReset()
})

describe('askAI fallback 範圍', () => {
  it('expo/fetch 載入失敗（請求未送出）→ 退回一次性請求', async () => {
    mockLoadExpoFetch.mockRejectedValue(new Error('native module NetworkFetchModule missing'))
    mockPost.mockResolvedValue({
      status: 200,
      data: { success: true, data: { answer: '一次性回答', sources: [] } },
    })

    const result = await askAI(REQUEST, handlers(), new AbortController().signal)

    expect(result.answer).toBe('一次性回答')
    expect(mockPost).toHaveBeenCalledTimes(1)
    expect(mockPost.mock.calls[0][0]).toBe('/ai/ask')
  })

  it('fetch 被拒（網路錯誤，請求可能已送達）→ 不退回，丟 interrupted', async () => {
    useExpoFetch(jest.fn().mockRejectedValue(new TypeError('Network request failed')))

    const error = await askAI(REQUEST, handlers(), new AbortController().signal).catch((e) => e)

    expect(error).toBeInstanceOf(AIChatError)
    expect(error.code).toBe('interrupted')
    expect(mockPost).not.toHaveBeenCalled()
  })

  it('HTTP 401 → 退回一次性請求，讓 axios interceptor 走 token refresh', async () => {
    useExpoFetch(
      jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ success: false, error: 'unauthorized' }),
      })
    )
    mockPost.mockResolvedValue({
      status: 200,
      data: { success: true, data: { answer: '刷新後的回答', sources: [] } },
    })

    const result = await askAI(REQUEST, handlers(), new AbortController().signal)

    expect(result.answer).toBe('刷新後的回答')
    expect(mockPost).toHaveBeenCalledTimes(1)
  })

  it('HTTP 5xx → 不退回，原樣丟出 AIChatError', async () => {
    useExpoFetch(
      jest.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({ success: false, error: 'circuit_open' }),
      })
    )

    const error = await askAI(REQUEST, handlers(), new AbortController().signal).catch((e) => e)

    expect(error).toBeInstanceOf(AIChatError)
    expect(error).toMatchObject({ code: 'circuit_open', status: 503 })
    expect(mockPost).not.toHaveBeenCalled()
  })

  it('已收到 token 後中途斷線 → 不退回，丟 interrupted', async () => {
    useExpoFetch(
      jest
        .fn()
        .mockResolvedValue(
          createStreamResponse(
            ['data: {"type":"token","token":"龍洞"}\n\n'],
            new Error('connection reset')
          )
        )
    )
    const h = handlers()

    const error = await askAI(REQUEST, h, new AbortController().signal).catch((e) => e)

    expect(error).toBeInstanceOf(AIChatError)
    expect(error.code).toBe('interrupted')
    expect(h.onToken).toHaveBeenCalledWith('龍洞')
    expect(mockPost).not.toHaveBeenCalled()
  })

  it('已收到 token 後收到 SSE error 事件 → 不退回，丟對應錯誤碼', async () => {
    useExpoFetch(
      jest
        .fn()
        .mockResolvedValue(
          createStreamResponse([
            'data: {"type":"token","token":"龍洞"}\n\n',
            'data: {"type":"error","code":"timeout","message":"逾時"}\n\n',
          ])
        )
    )

    const error = await askAI(REQUEST, handlers(), new AbortController().signal).catch((e) => e)

    expect(error).toBeInstanceOf(AIChatError)
    expect(error.code).toBe('timeout')
    expect(mockPost).not.toHaveBeenCalled()
  })

  it('使用者中止 → 原樣丟出，不退回', async () => {
    const controller = new AbortController()
    const abortError = new Error('Aborted')
    useExpoFetch(
      jest.fn().mockImplementation(() => {
        controller.abort()
        return Promise.reject(abortError)
      })
    )

    await expect(askAI(REQUEST, handlers(), controller.signal)).rejects.toBe(abortError)
    expect(mockPost).not.toHaveBeenCalled()
  })

  it('串流正常完成 → 回傳 done 事件內容', async () => {
    useExpoFetch(
      jest
        .fn()
        .mockResolvedValue(
          createStreamResponse([
            'data: {"type":"token","token":"龍"}\n\n',
            'data: {"type":"token","token":"洞"}\n\n',
            'data: {"type":"done","answer":"龍洞（最終版）","query_id":"q1","quota_remaining":4}\n\n',
          ])
        )
    )
    const h = handlers()

    const result = await askAI(REQUEST, h, new AbortController().signal)

    expect(result).toMatchObject({ answer: '龍洞（最終版）', queryId: 'q1', quotaRemaining: 4 })
    expect(h.onToken).toHaveBeenCalledTimes(2)
    expect(mockPost).not.toHaveBeenCalled()
  })
})
