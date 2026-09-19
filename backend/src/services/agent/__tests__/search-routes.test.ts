import { beforeEach, describe, expect, it, vi } from 'vitest'
import { hybridSearch } from '../../tools/hybrid-search'
import { searchRoutesTool } from '../tools/search-routes'
import type { ToolContext } from '../types'

vi.mock('../../tools/hybrid-search', () => ({
  hybridSearch: vi.fn().mockResolvedValue({
    candidateMatches: [],
    documents: new Map(),
    retrievalScore: 0,
    trace: {},
  }),
}))
vi.mock('../../core/embedding', () => ({
  EmbeddingService: class {
    embed = vi.fn().mockResolvedValue([0.1, 0.2])
  },
}))
vi.mock('../../core/config', () => ({
  loadPipelineConfig: vi.fn().mockResolvedValue({
    bm25_top_k: 10,
    merge_top_k: 10,
    min_rrf_score: 0.005,
    min_rrf_score_filtered: 0.002,
  }),
}))
vi.mock('../tools/route-sources', () => ({
  fetchLatestVideoMap: vi.fn().mockResolvedValue(new Map()),
}))

const mockedHybridSearch = vi.mocked(hybridSearch)

function makeCtx(): ToolContext {
  const first = vi.fn().mockResolvedValue({ id: 'crag-longdong' })
  const db = { prepare: vi.fn(() => ({ bind: vi.fn(() => ({ first })) })) }
  return { env: { DB: db } } as unknown as ToolContext
}

describe('searchRoutesTool vector filter', () => {
  beforeEach(() => {
    mockedHybridSearch.mockClear()
  })

  it('含「路線」「5.」的查詢不可產生 route_type = route（regression：龍洞 5.11 查無結果）', async () => {
    await searchRoutesTool.execute({ query: '5.11 經典路線', crag: '龍洞' }, makeCtx())

    const filter = mockedHybridSearch.mock.calls[0][1].vectorFilter as Record<string, unknown>
    expect(filter.route_type).toBeUndefined()
    expect(filter.type).toEqual({ $eq: 'route' })
    expect(filter.crag_id).toEqual({ $eq: 'crag-longdong' })
    // 5.11 無 a-d 後綴 → 涵蓋 5.11a ~ 5.11d（110 ~ 113）
    expect(filter.grade_numeric).toEqual({ $gte: 110, $lte: 113 })
  })

  it('沒有難度字樣時不加 grade filter', async () => {
    await searchRoutesTool.execute({ query: '適合新手' }, makeCtx())

    const filter = mockedHybridSearch.mock.calls[0][1].vectorFilter as Record<string, unknown>
    expect(filter).toEqual({ type: { $eq: 'route' } })
  })
})
