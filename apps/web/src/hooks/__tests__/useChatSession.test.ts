import { act, renderHook, waitFor } from '@testing-library/react'
import type { AIAskRequest, AIRequestError, AIStreamDoneEvent } from '@/lib/api/ai'

const mockUser: { current: { id: string } | null } = { current: { id: 'u1' } }
jest.mock('@/store/authStore', () => ({
  useAuthStore: (selector: (_s: { user: { id: string } | null }) => unknown) =>
    selector({ user: mockUser.current }),
}))

jest.mock('@/lib/api/ai', () => ({
  askAI: jest.fn(),
  askAIStream: jest.fn(),
  createChatSession: jest.fn(),
  deleteChatSession: jest.fn(),
  getChatMessages: jest.fn(),
  getChatSessionsPage: jest.fn(),
  getMyQuota: jest.fn(),
  saveMessage: jest.fn(),
  toAIRequestError: jest.fn(),
}))

import * as api from '@/lib/api/ai'

// ENABLE_STREAMING 在 module 載入時讀 env；import 會被 hoist 到最前面，所以 hook 改用 require 在設定之後載入
process.env.NEXT_PUBLIC_ENABLE_AI_STREAMING = 'true'
const { useChatSession } =
  require('@/hooks/useChatSession') as typeof import('@/hooks/useChatSession')

const mocked = api as jest.Mocked<typeof api>

const QUOTA = {
  tier: 'foothill' as const,
  tier_display: '麓',
  daily_limit: 5,
  daily_used: 1,
  remaining: 4,
  score: 0,
  resets_at: '',
  token_limit: 0,
  token_used: 0,
  token_remaining: 0,
}

const DONE: AIStreamDoneEvent = {
  query_id: 'q1',
  answer: '龍洞在新北',
  sources: [],
  suggested_questions: ['還有呢'],
  quota_remaining: 3,
}

interface StreamCall {
  request: AIAskRequest
  onToken: (_t: string) => void
  onDone: (_e: AIStreamDoneEvent) => void
  onError: (_e: AIRequestError) => void
  signal?: AbortSignal
  onReset?: () => void
  finish: () => void
}

// 攔下 askAIStream 的 callback，讓測試自己決定何時送 token / done / error
function captureStream(): StreamCall[] {
  const calls: StreamCall[] = []
  mocked.askAIStream.mockImplementation(
    (request, onToken, onDone, onError, signal, _onProgress, onReset) =>
      new Promise<void>((resolve) => {
        calls.push({ request, onToken, onDone, onError, signal, onReset, finish: resolve })
      })
  )
  return calls
}

async function setup(sessionsOnServer: { id: string }[] = [{ id: 's1' }]) {
  mocked.getMyQuota.mockResolvedValue(QUOTA)
  mocked.getChatSessionsPage.mockResolvedValue({
    sessions: sessionsOnServer.map((s) => ({ ...s, title: 't', created_at: 1, updated_at: 1 })),
    pagination: { page: 1, limit: 1, total: sessionsOnServer.length, total_pages: 1 },
  })
  mocked.getChatMessages.mockResolvedValue([])
  mocked.createChatSession.mockResolvedValue({ id: 'new', title: '', created_at: 1, updated_at: 1 })
  const calls = captureStream()
  const hook = renderHook(() => useChatSession({ locale: 'zh' }))
  await waitFor(() => expect(hook.result.current.quota).not.toBeNull())
  if (sessionsOnServer.length > 0) {
    await waitFor(() => expect(hook.result.current.sessionId).toBe(sessionsOnServer[0].id))
  }
  return { hook, calls }
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.useRealTimers()
  mockUser.current = { id: 'u1' }
})

describe('useChatSession', () => {
  it('送出時帶 session_id、由後端持久化（不呼叫 saveMessage），done 後更新訊息 / 建議 / 配額', async () => {
    const { hook, calls } = await setup()

    act(() => hook.result.current.send('  龍洞在哪  '))
    await waitFor(() => expect(calls).toHaveLength(1))
    expect(calls[0].request).toMatchObject({ query: '龍洞在哪', session_id: 's1', locale: 'zh' })
    expect(calls[0].request.regenerate).toBeUndefined()
    expect(hook.result.current.isBusy).toBe(true)
    expect(hook.result.current.messages.map((m) => m.role)).toEqual(['user', 'assistant'])
    expect(hook.result.current.messages[1].isStreaming).toBe(true)

    act(() => calls[0].onDone(DONE))
    const [, answer] = hook.result.current.messages
    expect(answer).toMatchObject({
      content: '龍洞在新北',
      isStreaming: false,
      queryId: 'q1',
    })
    expect(hook.result.current.suggestedQuestions).toEqual(['還有呢'])
    expect(hook.result.current.quota).toMatchObject({ remaining: 3, daily_used: 2 })
    expect(hook.result.current.isBusy).toBe(false)
    expect(mocked.saveMessage).not.toHaveBeenCalled()
  })

  it('沒有 session 時先建立再送出', async () => {
    const { hook, calls } = await setup([])

    act(() => hook.result.current.send('hi'))
    await waitFor(() => expect(calls).toHaveLength(1))
    expect(mocked.createChatSession).toHaveBeenCalledTimes(1)
    expect(calls[0].request.session_id).toBe('new')
    expect(hook.result.current.sessionId).toBe('new')
  })

  it('token 經佇列批次吐出，done 到達時不被佇列拖延', async () => {
    const { hook, calls } = await setup()
    act(() => hook.result.current.send('hi'))
    await waitFor(() => expect(calls).toHaveLength(1))

    jest.useFakeTimers()
    act(() => {
      for (const ch of 'abcdefghij') calls[0].onToken(ch)
    })
    act(() => {
      jest.advanceTimersByTime(0)
    })
    expect(hook.result.current.messages[1].content).toBe('a')

    // 佇列還有 9 個 token，done 一到就直接收尾
    act(() => calls[0].onDone({ ...DONE, answer: 'abcdefghij!' }))
    expect(hook.result.current.messages[1]).toMatchObject({
      content: 'abcdefghij!',
      isStreaming: false,
    })
    expect(jest.getTimerCount()).toBe(0)
  })

  it('token_reset：作廢已累積的文字與佇列，之後的 token 從空字串重新累積', async () => {
    const { hook, calls } = await setup()
    act(() => hook.result.current.send('hi'))
    await waitFor(() => expect(calls).toHaveLength(1))

    jest.useFakeTimers()
    // 呼叫工具前的前導句：一部分已吐到畫面、一部分還在佇列
    act(() => {
      for (const ch of '我來幫您搜尋') calls[0].onToken(ch)
    })
    act(() => {
      jest.advanceTimersByTime(0)
    })
    expect(hook.result.current.messages[1].content).toBe('我')

    act(() => calls[0].onReset?.())
    expect(hook.result.current.messages[1]).toMatchObject({ content: '', isStreaming: true })
    expect(jest.getTimerCount()).toBe(0)

    act(() => {
      calls[0].onToken('龍')
      calls[0].onToken('洞')
    })
    act(() => {
      jest.advanceTimersByTime(100)
    })
    expect(hook.result.current.messages[1].content).toBe('龍洞')
    expect(hook.result.current.isBusy).toBe(true)
  })

  it('停止：中止請求、保留已收到的字、以 status 標記而不是把「已停止」接進 content', async () => {
    const { hook, calls } = await setup()
    act(() => hook.result.current.send('hi'))
    await waitFor(() => expect(calls).toHaveLength(1))

    act(() => {
      calls[0].onToken('半')
      calls[0].onToken('截')
    })
    act(() => hook.result.current.stop())

    expect(calls[0].signal?.aborted).toBe(true)
    expect(hook.result.current.messages[1]).toMatchObject({
      content: '半截',
      isStreaming: false,
      status: 'stopped',
    })
    expect(hook.result.current.isBusy).toBe(false)

    // 中止後才到的事件一律丟棄
    act(() => calls[0].onDone(DONE))
    expect(hook.result.current.messages[1].content).toBe('半截')

    // 下一輪的 chat_history 只含模型實際產生的文字
    act(() => hook.result.current.send('再問'))
    await waitFor(() => expect(calls).toHaveLength(2))
    expect(calls[1].request.chat_history).toEqual([
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: '半截' },
    ])
  })

  it('串流 429 quota_exceeded：更新配額並以錯誤碼標記訊息', async () => {
    const { hook, calls } = await setup()
    act(() => hook.result.current.send('hi'))
    await waitFor(() => expect(calls).toHaveLength(1))

    act(() =>
      calls[0].onError({
        code: 'quota_exceeded',
        status: 429,
        data: { tier: 'foothill', daily_limit: 5, daily_used: 5 },
      })
    )
    expect(hook.result.current.quota).toMatchObject({ remaining: 0, daily_used: 5 })
    expect(hook.result.current.messages[1]).toMatchObject({
      content: '',
      isStreaming: false,
      status: 'error',
      error: { code: 'quota_exceeded', used: 5, limit: 5 },
    })
    expect(hook.result.current.isBusy).toBe(false)
  })

  it('session_not_found：丟掉 session，下次送出時重新建立', async () => {
    const { hook, calls } = await setup()
    act(() => hook.result.current.send('hi'))
    await waitFor(() => expect(calls).toHaveLength(1))

    act(() => calls[0].onError({ code: 'session_not_found', status: 404 }))
    expect(hook.result.current.sessionId).toBeNull()

    act(() => hook.result.current.send('again'))
    await waitFor(() => expect(calls).toHaveLength(2))
    expect(calls[1].request.session_id).toBe('new')
    // 錯誤提示訊息不進 chat_history
    expect(calls[1].request.chat_history).toEqual([{ role: 'user', content: 'hi' }])
  })

  it('重新生成：走同一條串流路徑，帶 regenerate + no_cache，不重複 user 訊息', async () => {
    const { hook, calls } = await setup()
    act(() => hook.result.current.send('q1'))
    await waitFor(() => expect(calls).toHaveLength(1))
    act(() => calls[0].onDone(DONE))

    act(() => hook.result.current.regenerate())
    await waitFor(() => expect(calls).toHaveLength(2))
    expect(calls[1].request).toMatchObject({
      query: 'q1',
      session_id: 's1',
      regenerate: true,
      no_cache: true,
    })
    expect(calls[1].request.chat_history).toBeUndefined()
    expect(hook.result.current.messages.map((m) => m.role)).toEqual(['user', 'assistant'])
    expect(hook.result.current.messages[1].isStreaming).toBe(true)
  })

  it('忙碌中不可重複送出', async () => {
    const { hook, calls } = await setup()
    act(() => {
      hook.result.current.send('a')
      hook.result.current.send('b')
    })
    await waitFor(() => expect(calls).toHaveLength(1))
    expect(hook.result.current.messages).toHaveLength(2)
  })

  it('未登入：顯示登入引導，不送出', async () => {
    mockUser.current = null
    const calls = captureStream()
    const hook = renderHook(() => useChatSession({ locale: 'zh' }))

    act(() => hook.result.current.send('hi'))
    expect(hook.result.current.showLoginPrompt).toBe(true)
    expect(hook.result.current.messages).toEqual([])
    expect(calls).toHaveLength(0)
    expect(mocked.getMyQuota).not.toHaveBeenCalled()
  })

  it('指定 initialSessionId 時載入該 session 的訊息與來源', async () => {
    mocked.getMyQuota.mockResolvedValue(QUOTA)
    mocked.getChatMessages.mockResolvedValue([
      { id: 'm1', role: 'user', content: 'q', created_at: 1 },
      {
        id: 'm2',
        role: 'assistant',
        content: 'a',
        sources: [{ id: 'r1', type: 'route', title: '路線', excerpt: '', score: 1 }],
        suggested_questions: '["x"]',
        created_at: 2,
      },
    ])
    const hook = renderHook(() => useChatSession({ locale: 'zh', initialSessionId: 's9' }))
    await waitFor(() => expect(hook.result.current.sessionId).toBe('s9'))
    expect(mocked.getChatSessionsPage).not.toHaveBeenCalled()
    expect(mocked.getChatMessages).toHaveBeenCalledWith('s9')
    expect(hook.result.current.messages[1].sources).toHaveLength(1)
    expect(hook.result.current.messages[1].suggestedQuestions).toEqual(['x'])
  })

  it('歷史列表分頁載入更多', async () => {
    const { hook } = await setup()
    const page = (n: number, ids: string[]) => ({
      sessions: ids.map((id) => ({ id, title: id, created_at: 1, updated_at: 1 })),
      pagination: { page: n, limit: 20, total: 3, total_pages: 2 },
    })
    mocked.getChatSessionsPage.mockResolvedValueOnce(page(1, ['s1', 's2']))
    await act(() => hook.result.current.loadSessions())
    expect(hook.result.current.hasMoreSessions).toBe(true)

    mocked.getChatSessionsPage.mockResolvedValueOnce(page(2, ['s2', 's3']))
    await act(() => hook.result.current.loadMoreSessions())
    expect(mocked.getChatSessionsPage).toHaveBeenLastCalledWith(2, 20)
    expect(hook.result.current.sessions.map((s) => s.id)).toEqual(['s1', 's2', 's3'])
    expect(hook.result.current.hasMoreSessions).toBe(false)
  })
})
