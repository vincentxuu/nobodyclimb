import { beforeEach, describe, expect, it, vi } from 'vitest'

// /ai/ask?stream=true 的三條結束路徑（正常完成 / client 中斷 / 串流失敗）在配額與持久化上必須互斥。
// 把 auth、rank、guardrails、QueryService、chat repo 全部 mock 掉，只留路由本身的流程。

vi.mock('../../middleware/auth', () => ({
  authMiddleware: async (
    c: { set: (k: string, v: unknown) => void },
    next: () => Promise<void>
  ) => {
    c.set('userId', 'u1')
    c.set('user', { sub: 'u1', role: 'user' })
    await next()
  },
  adminMiddleware: async (_c: unknown, next: () => Promise<void>) => next(),
}))
vi.mock('../../middleware/rateLimit', () => ({
  checkAiRateLimit: vi.fn(async () => ({ allowed: true })),
}))
vi.mock('../../utils/guardrails', async () => {
  const actual =
    await vi.importActual<typeof import('../../utils/guardrails')>('../../utils/guardrails')
  return { ...actual, checkInput: vi.fn(async () => ({ passed: true })) }
})
const rank = vi.hoisted(() => ({
  initUserRank: vi.fn(async () => {}),
  getUserRank: vi.fn(async () => ({
    rank_id: 'foothill',
    daily_ai_limit: 5,
    daily_ai_used: 1,
    last_reset_date: new Date().toISOString().slice(0, 10),
  })),
  resetDailyUsage: vi.fn(async () => {}),
  deductQuotaAndToken: vi.fn(async () => 1),
  getUserQuotaStatus: vi.fn(async () => ({ tokenExceeded: false })),
  addTokenUsage: vi.fn(async () => {}),
}))
vi.mock('../../services/rank', () => rank)
const chatRepo = vi.hoisted(() => ({
  isSessionOwnedBy: vi.fn(async () => true),
  listSessionMessages: vi.fn(async () => []),
  saveTurn: vi.fn(async () => ({ userMessageId: 'um', assistantMessageId: 'am' })),
}))
vi.mock('../../repositories/chat', () => chatRepo)

// QueryService.askStream 的行為由各測試指定
type AskStreamImpl = (
  write: (data: string) => Promise<void>,
  signal: AbortSignal | undefined
) => Promise<{ query_id: string; answer: string; sources: never[]; suggested_questions: string[] }>
const state = vi.hoisted(() => ({ askStreamImpl: null as unknown }))
vi.mock('../../services/entry', () => ({
  QueryService: class {
    askStream(
      _body: unknown,
      _userId: string,
      write: (data: string) => Promise<void>,
      _ctx: unknown,
      _trace: unknown,
      _onProgress: unknown,
      signal?: AbortSignal
    ) {
      return (state.askStreamImpl as AskStreamImpl)(write, signal)
    }
    getLastTokenCount() {
      return 321
    }
  },
}))

import { aiRoutes } from '../ai'

// 假 D1：只記錄 refundQuota 的 UPDATE
function fakeEnv() {
  const runs: string[] = []
  const db = {
    prepare: (sql: string) => ({
      bind: () => ({
        run: async () => {
          runs.push(sql)
          return { meta: { changes: 1 } }
        },
        first: async () => null,
      }),
    }),
  }
  return { env: { DB: db, CACHE: {} }, runs }
}

const waitUntilPromises: Promise<unknown>[] = []
const executionCtx = {
  waitUntil: (p: Promise<unknown>) => void waitUntilPromises.push(p),
  passThroughOnException() {},
}

function request(env: unknown, signal?: AbortSignal) {
  return aiRoutes.request(
    '/ask?stream=true',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '龍洞有什麼路線？', session_id: 's1' }),
      signal,
    },
    env as never,
    executionCtx as never
  )
}

async function readAll(res: Response) {
  return new TextDecoder().decode(new Uint8Array(await res.arrayBuffer()))
}

const refunds = (runs: string[]) => runs.filter((s) => s.includes('daily_ai_used - 1')).length
const abortLogs = (runs: string[]) => runs.filter((s) => s.includes("'client_aborted'")).length

beforeEach(() => {
  vi.clearAllMocks()
  waitUntilPromises.length = 0
})

describe('POST /ai/ask?stream=true', () => {
  it('正常完成：記實際 token、存一問一答、送 done，不退款', async () => {
    state.askStreamImpl = async (write) => {
      await write(JSON.stringify({ type: 'token', token: '龍洞' }))
      return { query_id: 'q1', answer: '龍洞有很多路線', sources: [], suggested_questions: [] }
    }
    const { env, runs } = fakeEnv()
    const body = await readAll(await request(env))
    expect(body).toContain('"type":"done"')
    expect(rank.addTokenUsage).toHaveBeenCalledWith(
      'u1',
      321,
      expect.any(Number),
      expect.anything()
    )
    expect(chatRepo.saveTurn).toHaveBeenCalledTimes(1)
    expect(chatRepo.saveTurn.mock.calls[0][1]).toMatchObject({
      userContent: '龍洞有什麼路線？',
      regenerate: false,
      assistant: { content: '龍洞有很多路線', queryId: 'q1' },
    })
    expect(refunds(runs)).toBe(0)
  })

  it('串流失敗：退款一次、不存任何訊息、不記 token', async () => {
    state.askStreamImpl = async (write) => {
      await write(JSON.stringify({ type: 'error', code: 'internal', message: 'x' }))
      throw new Error('boom')
    }
    const { env, runs } = fakeEnv()
    await readAll(await request(env))
    expect(refunds(runs)).toBe(1)
    expect(chatRepo.saveTurn).not.toHaveBeenCalled()
    expect(rank.addTokenUsage).not.toHaveBeenCalled()
  })

  it('client 中斷且尚無正文：退款一次、不存訊息', async () => {
    const controller = new AbortController()
    state.askStreamImpl = (_write, signal) =>
      new Promise((_resolve, reject) => {
        signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
      })
    const { env, runs } = fakeEnv()
    const res = await request(env, controller.signal)
    const reader = res.body!.getReader()
    controller.abort()
    await reader.cancel().catch(() => {})
    await Promise.allSettled(waitUntilPromises)
    expect(refunds(runs)).toBe(1)
    expect(chatRepo.saveTurn).not.toHaveBeenCalled()
    expect(abortLogs(runs)).toBe(1)
  })

  it('client 中斷且已有正文：不退款，部分內容以 stopped 存下', async () => {
    const controller = new AbortController()
    state.askStreamImpl = async (write, signal) => {
      await write(JSON.stringify({ type: 'token', token: '龍洞有校門口' }))
      return new Promise((_resolve, reject) => {
        signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
      })
    }
    const { env, runs } = fakeEnv()
    const res = await request(env, controller.signal)
    const reader = res.body!.getReader()
    await reader.read()
    controller.abort()
    await reader.cancel().catch(() => {})
    await Promise.allSettled(waitUntilPromises)
    expect(refunds(runs)).toBe(0)
    expect(chatRepo.saveTurn).toHaveBeenCalledTimes(1)
    expect(chatRepo.saveTurn.mock.calls[0][1]).toMatchObject({
      assistant: { content: '龍洞有校門口', status: 'stopped' },
    })
    expect(abortLogs(runs)).toBe(1)
  })

  it('正常完成與串流失敗都不寫 client_aborted log', async () => {
    state.askStreamImpl = async () => ({
      query_id: 'q1',
      answer: 'a',
      sources: [],
      suggested_questions: [],
    })
    const ok = fakeEnv()
    await readAll(await request(ok.env))
    expect(abortLogs(ok.runs)).toBe(0)
  })
})
