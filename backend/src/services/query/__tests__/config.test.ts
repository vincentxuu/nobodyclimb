import { describe, expect, it } from 'vitest'
import { loadPipelineConfig, RAG_STRATEGIES } from '../config'

// 以最小 D1 stub 模擬 ai_config 表
function fakeDb(rows: Record<string, string>): D1Database {
  return {
    prepare: () => ({
      all: async () => ({
        results: Object.entries(rows).map(([key, value]) => ({ key, value })),
      }),
    }),
  } as unknown as D1Database
}

describe('loadPipelineConfig rag_strategy 白名單', () => {
  it.each(RAG_STRATEGIES)('後台可設定的策略 %s 應原樣保留', async (strategy) => {
    const cfg = await loadPipelineConfig(fakeDb({ rag_strategy: strategy }))
    expect(cfg.rag_strategy).toBe(strategy)
  })

  it('未知策略降回 baseline', async () => {
    const cfg = await loadPipelineConfig(fakeDb({ rag_strategy: 'nope' }))
    expect(cfg.rag_strategy).toBe('baseline')
  })

  it('未設定時預設 baseline', async () => {
    const cfg = await loadPipelineConfig(fakeDb({}))
    expect(cfg.rag_strategy).toBe('baseline')
  })
})
