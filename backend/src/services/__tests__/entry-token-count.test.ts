import { describe, expect, it, vi } from 'vitest'

// getLastTokenCount：快取命中要回 0（退還預扣 token），一般回合回實際 token 數

vi.mock('../core/cache-log', () => ({
  logQuery: vi.fn(async () => 'log-id'),
  flagResponse: vi.fn(),
}))

import { QueryService } from '../entry'

const env = { DB: {}, CACHE: {}, AI: {} } as never

const baseLog = {
  userId: 'u1',
  query: 'q',
  response: '',
  sources: [],
  latencyMs: 1,
}

describe('QueryService.getLastTokenCount', () => {
  it('尚未寫 log 時為 null', () => {
    expect(new QueryService(env).getLastTokenCount()).toBeNull()
  })

  it('一般回合回實際 token 數', async () => {
    const qs = new QueryService(env)
    await qs.logQuery({ ...baseLog, tokenCount: 321 })
    expect(qs.getLastTokenCount()).toBe(321)
  })

  it('KV / semantic 快取命中記 0，不沿用快取來源的 token 數', async () => {
    const qs = new QueryService(env)
    await qs.logQuery({ ...baseLog, tokenCount: 999, cacheHit: true })
    expect(qs.getLastTokenCount()).toBe(0)
  })
})
