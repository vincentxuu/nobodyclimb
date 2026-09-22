import { describe, expect, it, vi } from 'vitest'
import type {
  AIProvider,
  ChatWithToolsOptions,
  ToolUseResponse,
} from '../../orchestrators/ai-graph/providers/types'
import { runAgentLoop } from '../agent-loop'
import type { AgentCache } from '../cache'
import { ToolRegistry } from '../registry'
import { DefaultTokenTracker } from '../tracker'
import type { ModelMap, Tool, ToolContext } from '../types'

// 迴圈內答案逐 token 串流、token_reset、client 中斷

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

function makeCtx(): ToolContext {
  return {
    env: {} as ToolContext['env'],
    userId: null,
    locale: 'zh-TW',
    models: MODELS,
    queryService: {} as ToolContext['queryService'],
    langfuseTrace: null,
    tracker: new DefaultTokenTracker(),
    cache: mockCache,
  }
}

function makeRegistry(execute = vi.fn().mockResolvedValue({ results: [] })): ToolRegistry {
  const tool: Tool = {
    name: 'search_routes',
    tags: ['retrieval'],
    alwaysLoad: true,
    concurrencySafe: true,
    maxResultChars: 3000,
    cacheTTL: 0,
    parameters: { type: 'object', properties: { query: { type: 'string' } } },
    prompt: () => 'Search routes',
    execute,
    formatResult: () => ({ content: '找到 2 條路線' }),
  }
  const registry = new ToolRegistry()
  registry.registerTool(tool)
  return registry
}

interface ScriptedTurn {
  /** 這輪若收到 onToken，依序推送的 token */
  tokens?: string[]
  response: ToolUseResponse
}

/** 依腳本回應的 provider；有 onToken 才會推 token，並記下每輪是否以串流模式呼叫 */
function scriptedProvider(turns: ScriptedTurn[]) {
  const streamedTurns: boolean[] = []
  let idx = 0
  const provider: AIProvider = {
    name: 'mock',
    chat: vi.fn(),
    streamChat: vi.fn(),
    embed: vi.fn(),
    embedBatch: vi.fn(),
    chatWithTools: vi.fn(async (_m, _t, opts: ChatWithToolsOptions = {}) => {
      const turn = turns[idx++]
      streamedTurns.push(!!opts.onToken)
      if (opts.onToken) for (const t of turn.tokens ?? []) await opts.onToken(t)
      return turn.response
    }),
  }
  return { provider, streamedTurns }
}

const TOOL_TURN: ToolUseResponse = {
  content: undefined,
  toolCalls: [{ id: 'tc-1', name: 'search_routes', input: { query: '龍洞' } }],
  stopReason: 'tool_use',
  usage: { input: 100, output: 30 },
}

const OPTS = {
  query: '龍洞有什麼路線？',
  systemPrompt: 'You are a climbing assistant.',
  maxTurns: 4,
  tokenBudget: 8000,
}

/** 把 onToken / onTokenReset 還原成前端最後看到的文字 */
function makeSink() {
  let text = ''
  let resets = 0
  return {
    onToken: async (t: string) => {
      text += t
    },
    onTokenReset: async () => {
      text = ''
      resets++
    },
    get text() {
      return text
    },
    get resets() {
      return resets
    },
  }
}

describe('runAgentLoop — 串流', () => {
  it('第一輪不串流；第二輪的最終答案逐 token 推送', async () => {
    const { provider, streamedTurns } = scriptedProvider([
      { tokens: ['我來幫您搜尋'], response: TOOL_TURN },
      {
        tokens: ['龍洞有', '校門口、', '音樂廳等岩區。'],
        response: {
          content: '龍洞有校門口、音樂廳等岩區。',
          toolCalls: [],
          stopReason: 'end_turn',
          usage: { input: 200, output: 40 },
        },
      },
    ])
    const sink = makeSink()
    const result = await runAgentLoop(
      { provider, registry: makeRegistry(), ctx: makeCtx() },
      { ...OPTS, onToken: sink.onToken, onTokenReset: sink.onTokenReset }
    )
    expect(streamedTurns).toEqual([false, true])
    expect(sink.text).toBe('龍洞有校門口、音樂廳等岩區。')
    expect(sink.resets).toBe(0)
    expect(result.answer).toBe('龍洞有校門口、音樂廳等岩區。')
  })

  it('第二輪先吐前導文字再呼叫工具 → reset，最後只留下真正的答案', async () => {
    const { provider } = scriptedProvider([
      { response: TOOL_TURN },
      {
        tokens: ['讓我再查一下', '其他岩區的資料。'],
        response: { ...TOOL_TURN, content: '讓我再查一下其他岩區的資料。' },
      },
      {
        tokens: ['共找到 ', '2 條路線。'],
        response: {
          content: '共找到 2 條路線。',
          toolCalls: [],
          stopReason: 'end_turn',
          usage: { input: 300, output: 20 },
        },
      },
    ])
    const sink = makeSink()
    await runAgentLoop(
      { provider, registry: makeRegistry(), ctx: makeCtx() },
      { ...OPTS, onToken: sink.onToken, onTokenReset: sink.onTokenReset }
    )
    expect(sink.resets).toBe(1)
    expect(sink.text).toBe('共找到 2 條路線。')
  })

  it('模型模仿「[呼叫工具: xxx]」純文字時，不推送也不需要 reset', async () => {
    const { provider } = scriptedProvider([
      { response: TOOL_TURN },
      {
        tokens: ['[呼叫', '工具: user_profile]'],
        response: {
          content: '[呼叫工具: user_profile]',
          toolCalls: [],
          stopReason: 'end_turn',
          usage: { input: 200, output: 8 },
        },
      },
    ])
    ;(provider.streamChat as ReturnType<typeof vi.fn>).mockImplementation(
      async (_m: unknown, o: { onToken: (t: string) => Promise<void> }) => {
        await o.onToken('收尾回答')
        return { content: '收尾回答' }
      }
    )
    const sink = makeSink()
    const result = await runAgentLoop(
      { provider, registry: makeRegistry(), ctx: makeCtx() },
      { ...OPTS, onToken: sink.onToken, onTokenReset: sink.onTokenReset }
    )
    expect(sink.resets).toBe(0)
    expect(sink.text).toBe('收尾回答')
    expect(result.answer).toBe('收尾回答')
  })

  it('比扣住長度還短的答案也會在結束前補送', async () => {
    const { provider } = scriptedProvider([
      { response: TOOL_TURN },
      {
        tokens: ['沒有。'],
        response: {
          content: '沒有。',
          toolCalls: [],
          stopReason: 'end_turn',
          usage: { input: 200, output: 3 },
        },
      },
    ])
    const sink = makeSink()
    await runAgentLoop(
      { provider, registry: makeRegistry(), ctx: makeCtx() },
      { ...OPTS, onToken: sink.onToken, onTokenReset: sink.onTokenReset }
    )
    expect(sink.text).toBe('沒有。')
  })
})

describe('runAgentLoop — 串流中 provider 失敗', () => {
  it('第二輪推了半句後 provider 丟非重試錯誤且無 fallback → 往上丟錯（由 entry.ts 退回 pipeline 前 reset）', async () => {
    let call = 0
    const provider: AIProvider = {
      name: 'mock',
      chat: vi.fn(),
      streamChat: vi.fn(),
      embed: vi.fn(),
      embedBatch: vi.fn(),
      chatWithTools: vi.fn(async (_m, _t, opts: ChatWithToolsOptions = {}) => {
        call++
        if (call === 1) return TOOL_TURN
        await opts.onToken?.('龍洞有校門口、音樂廳等岩區，')
        throw new Error('provider exploded (400)')
      }),
    }
    const sink = makeSink()
    await expect(
      runAgentLoop(
        { provider, registry: makeRegistry(), ctx: makeCtx() },
        { ...OPTS, onToken: sink.onToken, onTokenReset: sink.onTokenReset }
      )
    ).rejects.toThrow('provider exploded')
    // loop 本身沒有下一次嘗試可以觸發 onRetry；半句仍留在 sink，靠 entry.ts 的 fallback 前 reset 清掉
    expect(sink.text).toBe('龍洞有校門口、音樂廳等岩區，')
  })
})

describe('runAgentLoop — client 中斷', () => {
  it('LLM 回 tool call 後才中斷 → 不執行工具，丟 AbortError', async () => {
    const controller = new AbortController()
    const execute = vi.fn().mockResolvedValue({ results: [] })
    const provider: AIProvider = {
      name: 'mock',
      chat: vi.fn(),
      streamChat: vi.fn(),
      embed: vi.fn(),
      embedBatch: vi.fn(),
      chatWithTools: vi.fn(async () => {
        controller.abort()
        return TOOL_TURN
      }),
    }
    await expect(
      runAgentLoop(
        { provider, registry: makeRegistry(execute), ctx: makeCtx() },
        { ...OPTS, signal: controller.signal }
      )
    ).rejects.toMatchObject({ name: 'AbortError' })
    expect(execute).not.toHaveBeenCalled()
  })

  it('provider 因中斷丟 AbortError → 不重試、不換 fallback', async () => {
    const chatWithTools = vi.fn(async () => {
      throw new DOMException('The operation was aborted', 'AbortError')
    })
    const createProvider = vi.fn()
    const provider: AIProvider = {
      name: 'mock',
      chat: vi.fn(),
      streamChat: vi.fn(),
      embed: vi.fn(),
      embedBatch: vi.fn(),
      chatWithTools,
    }
    const ctx = makeCtx()
    ctx.models = {
      ...MODELS,
      orchestrator: {
        ...MODELS.orchestrator,
        fallback: { provider: 'openai', model: 'fallback-model' },
      },
    }
    await expect(
      runAgentLoop({ provider, registry: makeRegistry(), ctx, createProvider }, OPTS)
    ).rejects.toMatchObject({ name: 'AbortError' })
    expect(chatWithTools).toHaveBeenCalledTimes(1)
    expect(createProvider).not.toHaveBeenCalled()
  })
})
