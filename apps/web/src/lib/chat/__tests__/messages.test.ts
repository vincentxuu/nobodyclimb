import type { AiQuota } from '@/lib/api/ai'
import type { ChatMessageData } from '@/lib/chat/messages'
import {
  applyQuotaExceeded,
  applyQuotaRemaining,
  buildChatHistory,
  formatChatError,
  getQuotaExceededUsage,
  getRegenerateTarget,
  mapStoredMessages,
} from '@/lib/chat/messages'

const user = (id: string, content: string): ChatMessageData => ({ id, role: 'user', content })
const assistant = (
  id: string,
  content: string,
  extra: Partial<ChatMessageData> = {}
): ChatMessageData => ({ id, role: 'assistant', content, ...extra })

const QUOTA: AiQuota = {
  tier: 'foothill',
  tier_display: '麓',
  daily_limit: 5,
  daily_used: 2,
  remaining: 3,
  score: 10,
  resets_at: '2026-01-01T16:00:00Z',
  token_limit: 1000,
  token_used: 100,
  token_remaining: 900,
}

describe('buildChatHistory', () => {
  it('只取最近 6 則', () => {
    const messages = Array.from({ length: 10 }, (_, i) =>
      i % 2 === 0 ? user(`u${i}`, `q${i}`) : assistant(`a${i}`, `r${i}`)
    )
    const history = buildChatHistory(messages)
    expect(history).toHaveLength(6)
    expect(history[0]).toEqual({ role: 'user', content: 'q4' })
    expect(history[5]).toEqual({ role: 'assistant', content: 'r9' })
  })

  it('排除串流中的訊息', () => {
    const history = buildChatHistory([
      user('u1', '龍洞有什麼路線'),
      assistant('a1', '半截', { isStreaming: true }),
    ])
    expect(history).toEqual([{ role: 'user', content: '龍洞有什麼路線' }])
  })

  it('排除沒有內容的錯誤提示訊息', () => {
    const history = buildChatHistory([
      user('u1', 'q1'),
      assistant('a1', '', {
        status: 'error',
        error: { code: 'quota_exceeded', used: 2, limit: 2 },
      }),
    ])
    expect(history).toEqual([{ role: 'user', content: 'q1' }])
  })

  it('被中斷的訊息只送模型實際產生的文字，不含「已停止」字樣', () => {
    const history = buildChatHistory([
      user('u1', 'q1'),
      assistant('a1', '龍洞位於', { status: 'stopped' }),
    ])
    expect(history[1]).toEqual({ role: 'assistant', content: '龍洞位於' })
  })

  it('只輸出 role 與 content', () => {
    const history = buildChatHistory([assistant('a1', 'hi', { queryId: 'q', sources: [] })])
    expect(history).toEqual([{ role: 'assistant', content: 'hi' }])
  })
})

describe('getRegenerateTarget', () => {
  it('取最後一則 user 訊息重問，移除其後的 assistant 訊息', () => {
    const messages = [
      user('u1', 'q1'),
      assistant('a1', 'r1'),
      user('u2', 'q2'),
      assistant('a2', 'r2'),
    ]
    const target = getRegenerateTarget(messages)
    expect(target?.query).toBe('q2')
    expect(target?.kept.map((m) => m.id)).toEqual(['u1', 'a1', 'u2'])
    // chat_history 不含要重問的那一則，避免同一個問題出現兩次
    expect(target?.before.map((m) => m.id)).toEqual(['u1', 'a1'])
  })

  it('使用者中斷的訊息可以重新生成', () => {
    const target = getRegenerateTarget([
      user('u1', 'q1'),
      assistant('a1', '半', { status: 'stopped' }),
    ])
    expect(target?.query).toBe('q1')
  })

  it('錯誤訊息、串流中、最後一則不是 assistant、沒有 user 訊息時不可重新生成', () => {
    expect(
      getRegenerateTarget([
        user('u1', 'q1'),
        assistant('a1', '', { status: 'error', error: { code: 'timeout' } }),
      ])
    ).toBeNull()
    expect(
      getRegenerateTarget([user('u1', 'q1'), assistant('a1', '', { isStreaming: true })])
    ).toBeNull()
    expect(getRegenerateTarget([user('u1', 'q1')])).toBeNull()
    expect(getRegenerateTarget([assistant('a1', 'r1')])).toBeNull()
    expect(getRegenerateTarget([])).toBeNull()
  })
})

describe('mapStoredMessages', () => {
  it('suggested_questions 相容 JSON 字串與陣列，壞資料視為沒有', () => {
    const mapped = mapStoredMessages([
      { id: '1', role: 'assistant', content: 'a', suggested_questions: '["x","y"]', created_at: 1 },
      { id: '2', role: 'assistant', content: 'b', suggested_questions: ['z'], created_at: 2 },
      { id: '3', role: 'assistant', content: 'c', suggested_questions: '{壞掉', created_at: 3 },
      { id: '4', role: 'user', content: 'd', suggested_questions: null, created_at: 4 },
    ])
    expect(mapped.map((m) => m.suggestedQuestions)).toEqual([
      ['x', 'y'],
      ['z'],
      undefined,
      undefined,
    ])
  })

  it('帶出 sources 與 query_id；sources 為 null 或空陣列時不帶', () => {
    const source = { id: 's1', type: 'route' as const, title: '路線', excerpt: '', score: 0.9 }
    const mapped = mapStoredMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'a',
        sources: [source],
        query_id: 'q1',
        created_at: 1,
      },
      { id: '2', role: 'assistant', content: 'b', sources: null, created_at: 2 },
      { id: '3', role: 'assistant', content: 'c', sources: [], created_at: 3 },
    ])
    expect(mapped[0].sources).toEqual([source])
    expect(mapped[0].queryId).toBe('q1')
    expect(mapped[1].sources).toBeUndefined()
    expect(mapped[2].sources).toBeUndefined()
  })
})

describe('mapStoredMessages status', () => {
  it("後端標記為 'stopped' 的訊息還原中斷狀態，其餘不帶 status", () => {
    const mapped = mapStoredMessages([
      { id: '1', role: 'assistant', content: '半截', status: 'stopped', created_at: 1 },
      { id: '2', role: 'assistant', content: '完整', status: null, created_at: 2 },
    ])
    expect(mapped[0].status).toBe('stopped')
    expect(mapped[1].status).toBeUndefined()
  })
})

describe('配額', () => {
  it('429 帶 data：以後端資料更新並把剩餘歸零，其餘欄位沿用', () => {
    const next = applyQuotaExceeded(QUOTA, {
      tier: 'crag',
      tier_display: '岩',
      daily_limit: 8,
      daily_used: 8,
      resets_at: '2026-01-02T16:00:00Z',
    })
    expect(next).toMatchObject({
      tier: 'crag',
      daily_limit: 8,
      daily_used: 8,
      remaining: 0,
      resets_at: '2026-01-02T16:00:00Z',
      score: 10,
      token_remaining: 900,
    })
  })

  it('429 沒帶 data：剩餘歸零；尚未取得配額時維持 null', () => {
    expect(applyQuotaExceeded(QUOTA, undefined)).toMatchObject({ remaining: 0, daily_used: 5 })
    expect(applyQuotaExceeded(null, undefined)).toBeNull()
  })

  it('尚未取得配額但 429 帶 data：仍能建立配額狀態', () => {
    expect(applyQuotaExceeded(null, { daily_limit: 2, daily_used: 2 })).toMatchObject({
      daily_limit: 2,
      daily_used: 2,
      remaining: 0,
    })
  })

  it('getQuotaExceededUsage：後端資料優先，其次目前配額，最後 fallback', () => {
    expect(getQuotaExceededUsage(QUOTA, { daily_limit: 8, daily_used: 7 })).toEqual({
      used: 7,
      limit: 8,
    })
    expect(getQuotaExceededUsage(QUOTA, undefined)).toEqual({ used: 5, limit: 5 })
    expect(getQuotaExceededUsage(null, undefined)).toEqual({ used: 2, limit: 2 })
  })

  it('done 的 quota_remaining：更新剩餘與已用；-1（無限制）不更新', () => {
    expect(applyQuotaRemaining(QUOTA, 1)).toMatchObject({ remaining: 1, daily_used: 4 })
    expect(applyQuotaRemaining(QUOTA, -1)).toBe(QUOTA)
    expect(applyQuotaRemaining(null, 1)).toBeNull()
  })
})

describe('formatChatError', () => {
  it('以 Chat.errors.<code> 翻譯；quota_exceeded 帶已用 / 上限', () => {
    const t = jest.fn((key: string) => key)
    expect(formatChatError(t, { code: 'timeout' })).toBe('errors.timeout')
    formatChatError(t, { code: 'quota_exceeded', used: 2, limit: 5 })
    expect(t).toHaveBeenLastCalledWith('errors.quota_exceeded', { used: 2, limit: 5 })
  })
})
