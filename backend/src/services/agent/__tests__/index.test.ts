import { describe, expect, it } from 'vitest'
import { loadModelMap } from '../index'

describe('loadModelMap', () => {
  it('returns default model map when react_models is missing', async () => {
    const db = {
      prepare: () => ({
        first: async () => null,
      }),
    } as unknown as D1Database

    const result = await loadModelMap(db)

    expect(result.orchestrator.provider).toBe('workers-ai')
    expect(result.orchestrator.model).toBe('@cf/glm-5.3-flash')
    expect(result.orchestrator.fallback?.model).toBe('@cf/glm-4.7-flash')
    expect(result.hyde.model).toBe('@cf/glm-4.7-flash')
  })

  it('merges partial react_models config with defaults', async () => {
    const db = {
      prepare: () => ({
        first: async () => ({
          value: JSON.stringify({
            orchestrator: {
              model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
            },
          }),
        }),
      }),
    } as unknown as D1Database

    const result = await loadModelMap(db)

    expect(result.orchestrator.provider).toBe('workers-ai')
    expect(result.orchestrator.model).toBe('@cf/meta/llama-3.3-70b-instruct-fp8-fast')
    expect(result.orchestrator.temperature).toBe(0.3)
    expect(result.orchestrator.maxTokens).toBe(1024)
    expect(result.orchestrator.fallback?.model).toBe('@cf/glm-4.7-flash')
    expect(result.judge.model).toBe('@cf/qwen3-30b-a3b-fp8')
  })
})
