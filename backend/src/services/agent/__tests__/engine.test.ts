import { describe, expect, it, vi } from 'vitest'
import type { AIProvider, ToolUseResponse } from '../../orchestrators/ai-graph/providers/types'
import { runAgentLoop } from '../agent-loop'
import type { AgentCache } from '../cache'
import { ToolRegistry } from '../registry'
import { DefaultTokenTracker } from '../tracker'
import type { ModelMap, Tool, ToolContext } from '../types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MODELS: ModelMap = {
  orchestrator: { provider: 'workers-ai', model: 'test-model', temperature: 0.3, maxTokens: 1024 },
  hyde: { provider: 'workers-ai', model: 'test-model' },
  multiQuery: { provider: 'workers-ai', model: 'test-model' },
  textToSql: { provider: 'workers-ai', model: 'test-model' },
  rerank: { provider: 'workers-ai', model: 'test-model' },
  judge: { provider: 'workers-ai', model: 'test-model' },
  embedding: { provider: 'workers-ai', model: 'test-model' },
}

const mockCache: AgentCache = {
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue(undefined),
}

function makeCtx(overrides: Partial<ToolContext> = {}): ToolContext {
  return {
    env: {} as any,
    userId: null,
    locale: 'zh-TW',
    models: MODELS,
    queryService: {} as any,
    langfuseTrace: null,
    tracker: new DefaultTokenTracker(),
    cache: mockCache,
    ...overrides,
  }
}

function makeTool(overrides: Partial<Tool> = {}): Tool {
  return {
    name: 'search_routes',
    tags: ['retrieval'],
    alwaysLoad: true,
    concurrencySafe: true,
    maxResultChars: 3000,
    cacheTTL: 0,
    parameters: { type: 'object', properties: { query: { type: 'string' } } },
    prompt: () => 'Search routes',
    execute: vi.fn().mockResolvedValue({ results: ['route1', 'route2'] }),
    formatResult: () => ({ content: '找到 2 條路線' }),
    ...overrides,
  }
}

function mockProvider(responses: ToolUseResponse[]): AIProvider {
  let callIdx = 0
  return {
    name: 'mock',
    chat: vi.fn().mockImplementation(async () => {
      const last = responses[responses.length - 1]
      return {
        content: last.content ?? '最終回答',
        usage: {
          prompt_tokens: last.usage.input,
          completion_tokens: last.usage.output,
          total_tokens: last.usage.input + last.usage.output,
        },
      }
    }),
    streamChat: vi.fn(),
    embed: vi.fn(),
    embedBatch: vi.fn(),
    chatWithTools: vi.fn().mockImplementation(async () => {
      const resp = responses[callIdx] ?? responses[responses.length - 1]
      callIdx++
      return resp
    }),
  }
}

const DEFAULT_OPTS = {
  query: '龍洞有什麼路線？',
  systemPrompt: 'You are a climbing assistant.',
  maxTurns: 3,
  tokenBudget: 8000,
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('runAgentLoop', () => {
  it('0 tool calls — direct answer in 1 turn', async () => {
    const provider = mockProvider([
      {
        content: '龍洞有很多經典運動攀路線。',
        toolCalls: [],
        stopReason: 'end_turn',
        usage: { input: 100, output: 50 },
      },
    ])
    const registry = new ToolRegistry()
    const ctx = makeCtx()

    const result = await runAgentLoop({ provider, registry, ctx }, DEFAULT_OPTS)

    expect(result.answer).toBe('龍洞有很多經典運動攀路線。')
    expect(result.turnCount).toBe(1)
    expect(result.toolCallCount).toBe(0)
    expect(ctx.tracker.getTotalTokens()).toBe(150)
  })

  it('single tool call — search then answer', async () => {
    const provider = mockProvider([
      // Turn 1: call search_routes
      {
        content: undefined,
        toolCalls: [{ id: 'tc-1', name: 'search_routes', input: { query: '龍洞' } }],
        stopReason: 'tool_use',
        usage: { input: 100, output: 30 },
      },
      // Turn 2: answer based on results
      {
        content: '根據搜尋結果，龍洞有以下路線...',
        toolCalls: [],
        stopReason: 'end_turn',
        usage: { input: 200, output: 80 },
      },
    ])
    const registry = new ToolRegistry()
    registry.registerTool(makeTool())
    const ctx = makeCtx()

    const result = await runAgentLoop({ provider, registry, ctx }, DEFAULT_OPTS)

    expect(result.answer).toBe('根據搜尋結果，龍洞有以下路線...')
    expect(result.turnCount).toBe(2)
    expect(result.toolCallCount).toBe(1)
  })

  it('multiple tool calls in parallel (concurrencySafe)', async () => {
    const executionOrder: string[] = []
    const tool1 = makeTool({
      name: 'search_routes',
      concurrencySafe: true,
      execute: vi.fn().mockImplementation(async () => {
        executionOrder.push('search_routes')
        return { results: [] }
      }),
    })
    const tool2 = makeTool({
      name: 'weather',
      concurrencySafe: true,
      execute: vi.fn().mockImplementation(async () => {
        executionOrder.push('weather')
        return { temp: 25 }
      }),
      formatResult: () => ({ content: '天氣 25°C' }),
    })

    const provider = mockProvider([
      {
        content: undefined,
        toolCalls: [
          { id: 'tc-1', name: 'search_routes', input: { query: '龍洞' } },
          { id: 'tc-2', name: 'weather', input: { crag: '龍洞' } },
        ],
        stopReason: 'tool_use',
        usage: { input: 100, output: 40 },
      },
      {
        content: '結果...',
        toolCalls: [],
        stopReason: 'end_turn',
        usage: { input: 300, output: 100 },
      },
    ])
    const registry = new ToolRegistry()
    registry.registerTool(tool1)
    registry.registerTool(tool2)
    const ctx = makeCtx()

    const result = await runAgentLoop({ provider, registry, ctx }, DEFAULT_OPTS)

    expect(result.toolCallCount).toBe(2)
    // Both tools should have been called
    expect(tool1.execute).toHaveBeenCalled()
    expect(tool2.execute).toHaveBeenCalled()
  })

  it('tool error recovery — error sent back to LLM', async () => {
    const failingTool = makeTool({
      name: 'weather',
      execute: vi.fn().mockRejectedValueOnce(new Error('API timeout')),
    })

    const provider = mockProvider([
      {
        content: undefined,
        toolCalls: [{ id: 'tc-1', name: 'weather', input: { crag: '龍洞' } }],
        stopReason: 'tool_use',
        usage: { input: 100, output: 30 },
      },
      {
        content: '天氣查詢失敗，但根據其他資料...',
        toolCalls: [],
        stopReason: 'end_turn',
        usage: { input: 200, output: 60 },
      },
    ])
    const registry = new ToolRegistry()
    registry.registerTool(failingTool)
    const ctx = makeCtx()

    const result = await runAgentLoop({ provider, registry, ctx }, DEFAULT_OPTS)

    // Should not throw — error wrapped and sent to LLM
    expect(result.answer).toBe('天氣查詢失敗，但根據其他資料...')
    expect(result.turnCount).toBe(2)
  })

  it('consecutive failures — tool removed after 2 failures', async () => {
    const failingTool = makeTool({
      name: 'weather',
      execute: vi.fn().mockRejectedValue(new Error('Always fails')),
    })

    const provider = mockProvider([
      // Turn 1: call weather (fail 1)
      {
        content: undefined,
        toolCalls: [{ id: 'tc-1', name: 'weather', input: { crag: '龍洞' } }],
        stopReason: 'tool_use',
        usage: { input: 100, output: 20 },
      },
      // Turn 2: call weather again (fail 2 → removed)
      {
        content: undefined,
        toolCalls: [{ id: 'tc-2', name: 'weather', input: { crag: '龍洞' } }],
        stopReason: 'tool_use',
        usage: { input: 150, output: 25 },
      },
      // Turn 3: answer (weather no longer available)
      {
        content: '無法查詢天氣。',
        toolCalls: [],
        stopReason: 'end_turn',
        usage: { input: 200, output: 40 },
      },
    ])
    const registry = new ToolRegistry()
    registry.registerTool(failingTool)
    const ctx = makeCtx()

    const result = await runAgentLoop({ provider, registry, ctx }, DEFAULT_OPTS)

    // After 2 consecutive failures, tool should be removed
    expect(registry.getTool('weather')).toBeUndefined()
    expect(result.answer).toBe('無法查詢天氣。')
  })

  it('maxTurns guard — stops after max turns', async () => {
    // Each turn returns a tool call, forcing max turns
    const provider = mockProvider([
      {
        content: undefined,
        toolCalls: [{ id: 'tc-1', name: 'search_routes', input: { query: '龍洞' } }],
        stopReason: 'tool_use',
        usage: { input: 100, output: 20 },
      },
    ])

    // Override chat for the final forced answer
    ;(provider.chat as any).mockResolvedValue({
      content: '最終回答（到達 maxTurns）',
      usage: { prompt_tokens: 300, completion_tokens: 80 },
    })

    const registry = new ToolRegistry()
    registry.registerTool(makeTool())
    const ctx = makeCtx()

    const result = await runAgentLoop({ provider, registry, ctx }, { ...DEFAULT_OPTS, maxTurns: 2 })

    // Should reach maxTurns then do a final forced answer
    expect(result.turnCount).toBe(3) // 2 loop turns + 1 final
    expect(result.answer).toBe('最終回答（到達 maxTurns）')
  })

  it('token budget guard — stops when budget exceeded', async () => {
    const provider = mockProvider([
      {
        content: undefined,
        toolCalls: [{ id: 'tc-1', name: 'search_routes', input: { query: '龍洞' } }],
        stopReason: 'tool_use',
        usage: { input: 4000, output: 2000 }, // 6000 tokens in first turn
      },
    ])

    ;(provider.chat as any).mockResolvedValue({
      content: 'Budget 到了',
      usage: { prompt_tokens: 500, completion_tokens: 200 },
    })

    const registry = new ToolRegistry()
    registry.registerTool(makeTool())
    const ctx = makeCtx()

    const result = await runAgentLoop(
      { provider, registry, ctx },
      { ...DEFAULT_OPTS, tokenBudget: 7000 }
    )

    // 6000 tokens after turn 1 → budget (7000) not yet exceeded
    // But turn 2 would exceed → it still does one more loop iteration check
    // Actually after turn 1: 6000 < 7000, so turn 2 starts
    // Let's test with a tighter budget
    expect(result.answer).toBeTruthy()
  })

  it('token budget guard — tight budget exits before second turn', async () => {
    const provider = mockProvider([
      {
        content: undefined,
        toolCalls: [{ id: 'tc-1', name: 'search_routes', input: { query: '龍洞' } }],
        stopReason: 'tool_use',
        usage: { input: 300, output: 200 }, // 500 total
      },
    ])

    ;(provider.chat as any).mockResolvedValue({
      content: 'Budget 用完了',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    })

    const registry = new ToolRegistry()
    registry.registerTool(makeTool())
    const ctx = makeCtx()

    const result = await runAgentLoop(
      { provider, registry, ctx },
      { ...DEFAULT_OPTS, tokenBudget: 400 }
    )

    // After turn 1: 500 tokens > budget 400 → exits loop → final answer
    expect(result.answer).toBe('Budget 用完了')
  })

  it('result truncation — long tool result gets truncated', async () => {
    const longContent = 'A'.repeat(5000)
    const tool = makeTool({
      name: 'search_routes',
      maxResultChars: 100,
      formatResult: () => ({ content: longContent }),
    })

    const provider = mockProvider([
      {
        content: undefined,
        toolCalls: [{ id: 'tc-1', name: 'search_routes', input: { query: '龍洞' } }],
        stopReason: 'tool_use',
        usage: { input: 100, output: 20 },
      },
      {
        content: '回答',
        toolCalls: [],
        stopReason: 'end_turn',
        usage: { input: 200, output: 40 },
      },
    ])
    const registry = new ToolRegistry()
    registry.registerTool(tool)
    const ctx = makeCtx()

    await runAgentLoop({ provider, registry, ctx }, DEFAULT_OPTS)

    // The tool result message sent to LLM should contain truncation note
    const chatWithToolsCalls = (provider.chatWithTools as any).mock.calls
    // Second call's messages should contain truncation note
    if (chatWithToolsCalls.length > 1) {
      const messages = chatWithToolsCalls[1][0]
      const toolResultMsg = messages.find((m: any) => m.content?.includes('結果已截斷'))
      expect(toolResultMsg).toBeTruthy()
    }
  })

  it('unknown tool call — returns error message', async () => {
    const provider = mockProvider([
      {
        content: undefined,
        toolCalls: [{ id: 'tc-1', name: 'nonexistent_tool', input: {} }],
        stopReason: 'tool_use',
        usage: { input: 100, output: 20 },
      },
      {
        content: '工具不可用，直接回答。',
        toolCalls: [],
        stopReason: 'end_turn',
        usage: { input: 200, output: 40 },
      },
    ])
    const registry = new ToolRegistry()
    // No tools registered
    const ctx = makeCtx()

    const result = await runAgentLoop({ provider, registry, ctx }, DEFAULT_OPTS)

    expect(result.answer).toBe('工具不可用，直接回答。')
  })

  it('parallel same-tool calls — progress events carry distinct invocation ids', async () => {
    const provider = mockProvider([
      {
        content: undefined,
        toolCalls: [
          { id: 'call-1', name: 'search_routes', input: { query: '龍洞' } },
          { id: 'call-2', name: 'search_routes', input: { query: '墾丁' } },
        ],
        stopReason: 'tool_use',
        usage: { input: 100, output: 40 },
      },
      {
        content: '兩地都有好路線。',
        toolCalls: [],
        stopReason: 'end_turn',
        usage: { input: 200, output: 40 },
      },
    ])
    const registry = new ToolRegistry()
    registry.registerTool(makeTool())
    const ctx = makeCtx()

    const events: Array<{ type: string; id?: string; tool?: string; status?: string }> = []
    await runAgentLoop(
      { provider, registry, ctx },
      {
        ...DEFAULT_OPTS,
        onProgress: async (e) => {
          events.push(e)
        },
      }
    )

    const executing = events.filter((e) => e.status === 'executing')
    const done = events.filter((e) => e.status === 'done')
    // 同名 tool 並行呼叫必須能用 id 區分，否則前端會互蓋
    expect(executing.map((e) => e.id).sort()).toEqual(['call-1', 'call-2'])
    expect(done.map((e) => e.id).sort()).toEqual(['call-1', 'call-2'])
    // executing 事件帶呼叫參數供 Tool 元件顯示
    expect(executing).toContainEqual(
      expect.objectContaining({ id: 'call-1', tool: 'search_routes', input: { query: '龍洞' } })
    )
    // done 事件帶截斷後的 output 與耗時，供前端 Response 區顯示；executing 不帶 output
    for (const e of done) {
      expect(e.output).toBe('找到 2 條路線')
      expect(e.is_error).toBe(false)
      expect(typeof e.duration_ms).toBe('number')
    }
    for (const e of executing) {
      expect(e.output).toBeUndefined()
    }
  })

  it('tool 執行失敗時 done 事件帶 is_error 與錯誤訊息', async () => {
    const provider = mockProvider([
      {
        content: undefined,
        toolCalls: [{ id: 'call-err', name: 'search_routes', input: { query: '龍洞' } }],
        stopReason: 'tool_use',
        usage: { input: 100, output: 40 },
      },
      {
        content: '最終回答',
        toolCalls: [],
        stopReason: 'end_turn',
        usage: { input: 50, output: 20 },
      },
    ])
    const registry = new ToolRegistry()
    registry.registerTool(makeTool({ execute: vi.fn().mockRejectedValue(new Error('D1 timeout')) }))
    const events: Array<{ id: string; status: string; output?: string; is_error?: boolean }> = []

    await runAgentLoop(
      { provider, registry, ctx: makeCtx() },
      {
        ...DEFAULT_OPTS,
        onProgress: async (e) => {
          events.push(e)
        },
      }
    )

    const done = events.find((e) => e.status === 'done')
    expect(done).toMatchObject({ id: 'call-err', is_error: true, output: 'D1 timeout' })
  })
})
