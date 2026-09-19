import { describe, expect, it, vi } from 'vitest'

// 直接測試 parseWorkersAIResponse
// 因為它是模組內的函式，我們透過 CloudflareProvider 間接測試

const mockAI = {
  run: vi.fn(),
}

async function getProvider() {
  const { CloudflareProvider } = await import('../providers/cloudflare')
  return new CloudflareProvider(mockAI as any)
}

describe('CloudflareProvider response format', () => {
  it('解析舊格式（Llama）: { response, usage }', async () => {
    mockAI.run.mockResolvedValueOnce({
      response: '這是回答',
      usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
    })
    const provider = await getProvider()
    const result = await provider.chat([{ role: 'user', content: 'hi' }])
    expect(result.content).toBe('這是回答')
    expect(result.usage?.prompt_tokens).toBe(10)
  })

  it('解析新格式（GLM/Qwen）: { choices, usage }', async () => {
    mockAI.run.mockResolvedValueOnce({
      choices: [{ message: { content: 'GLM 回答', role: 'assistant' } }],
      usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
    })
    const provider = await getProvider()
    const result = await provider.chat([{ role: 'user', content: 'hi' }])
    expect(result.content).toBe('GLM 回答')
    expect(result.usage?.prompt_tokens).toBe(100)
  })

  it('chatWithTools 解析新格式的 tool_calls', async () => {
    mockAI.run.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: '',
            tool_calls: [
              {
                id: 'call_1',
                function: { name: 'search_routes', arguments: '{"query":"龍洞"}' },
              },
            ],
          },
        },
      ],
      usage: { prompt_tokens: 200, completion_tokens: 30, total_tokens: 230 },
    })
    const provider = await getProvider()
    const result = await provider.chatWithTools(
      [{ role: 'user', content: '搜尋龍洞' }],
      [{ name: 'search_routes', description: '搜尋路線', parameters: {} }]
    )
    expect(result.stopReason).toBe('tool_use')
    expect(result.toolCalls).toHaveLength(1)
    expect(result.toolCalls[0].name).toBe('search_routes')
    expect(result.toolCalls[0].input).toEqual({ query: '龍洞' })
  })

  it('chatWithTools 解析舊格式的 tool_calls', async () => {
    mockAI.run.mockResolvedValueOnce({
      response: '',
      tool_calls: [
        {
          name: 'weather',
          arguments: '{"location":"龍洞"}',
        },
      ],
      usage: { prompt_tokens: 50, completion_tokens: 10 },
    })
    const provider = await getProvider()
    const result = await provider.chatWithTools(
      [{ role: 'user', content: '天氣' }],
      [{ name: 'weather', description: '天氣', parameters: {} }]
    )
    expect(result.stopReason).toBe('tool_use')
    expect(result.toolCalls[0].name).toBe('weather')
  })

  it('新格式 + response 空字串 fallback 到 choices', async () => {
    mockAI.run.mockResolvedValueOnce({
      response: '',
      choices: [{ message: { content: 'GLM 實際回答', role: 'assistant' } }],
      usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
    })
    const provider = await getProvider()
    const result = await provider.chat([{ role: 'user', content: 'hi' }])
    expect(result.content).toBe('GLM 實際回答')
  })

  it('推理模型 content 空但有 reasoning_content → content 保持空，推理只進 reasoning', async () => {
    // thinking 吃光 max_tokens 的情境；以前會把推理當回答送給使用者（2026-09-19 preview 事故）
    mockAI.run.mockResolvedValueOnce({
      choices: [
        { message: { content: '', reasoning_content: '推理過程和回答', role: 'assistant' } },
      ],
      usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 },
    })
    const provider = await getProvider()
    const result = await provider.chat([{ role: 'user', content: '分析弱點' }])
    expect(result.content).toBe('')
    expect(result.reasoning).toBe('推理過程和回答')
  })

  it('content 與 reasoning_content 並存時各自回傳', async () => {
    mockAI.run.mockResolvedValueOnce({
      choices: [{ message: { content: '正文', reasoning_content: '思考', role: 'assistant' } }],
      usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 },
    })
    const provider = await getProvider()
    const result = await provider.chat([{ role: 'user', content: 'hi' }])
    expect(result.content).toBe('正文')
    expect(result.reasoning).toBe('思考')
  })

  it('thinking: false → GLM 4.x 帶 chat_template_kwargs.enable_thinking=false', async () => {
    mockAI.run.mockResolvedValueOnce({
      choices: [{ message: { content: 'ok', role: 'assistant' } }],
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
    })
    const provider = await getProvider()
    await provider.chat([{ role: 'user', content: 'hi' }], {
      model: '@cf/zai-org/glm-4.7-flash',
      thinking: false,
    })
    const params = mockAI.run.mock.calls.at(-1)?.[1]
    expect(params.chat_template_kwargs).toEqual({ enable_thinking: false })
  })

  it('thinking: false → Qwen3 帶 budget_tokens: 0；其他模型不加參數', async () => {
    mockAI.run.mockResolvedValue({
      choices: [{ message: { content: 'ok', role: 'assistant' } }],
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
    })
    const provider = await getProvider()
    await provider.chat([{ role: 'user', content: 'hi' }], {
      model: '@cf/qwen/qwen3-4b',
      thinking: false,
    })
    expect(mockAI.run.mock.calls.at(-1)?.[1].budget_tokens).toBe(0)

    await provider.chat([{ role: 'user', content: 'hi' }], {
      model: '@cf/meta/llama-4-scout-17b-16e-instruct',
      thinking: false,
    })
    const llamaParams = mockAI.run.mock.calls.at(-1)?.[1]
    expect(llamaParams.chat_template_kwargs).toBeUndefined()
    expect(llamaParams.budget_tokens).toBeUndefined()
    mockAI.run.mockReset()
  })

  it('thinking 未指定 → 沿用模型預設，不加參數', async () => {
    mockAI.run.mockResolvedValueOnce({
      choices: [{ message: { content: 'ok', role: 'assistant' } }],
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
    })
    const provider = await getProvider()
    await provider.chat([{ role: 'user', content: 'hi' }], { model: '@cf/zai-org/glm-4.7-flash' })
    expect(mockAI.run.mock.calls.at(-1)?.[1].chat_template_kwargs).toBeUndefined()
  })

  it('chatWithTools 也套用 thinking 參數並分離 reasoning', async () => {
    mockAI.run.mockResolvedValueOnce({
      choices: [{ message: { content: '', reasoning_content: '思考', tool_calls: [] } }],
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
    })
    const provider = await getProvider()
    const result = await provider.chatWithTools(
      [{ role: 'user', content: 'hi' }],
      [{ name: 'search_routes', description: '搜尋', parameters: {} }],
      { model: '@cf/zai-org/glm-4.7-flash', thinking: false }
    )
    expect(mockAI.run.mock.calls.at(-1)?.[1].chat_template_kwargs).toEqual({
      enable_thinking: false,
    })
    expect(result.content).toBeUndefined()
    expect(result.reasoning).toBe('思考')
    expect(result.stopReason).toBe('end_turn')
  })

  it('新格式 tool_calls 在 choices[0].message 裡 + 空頂層 tool_calls', async () => {
    mockAI.run.mockResolvedValueOnce({
      response: '',
      tool_calls: [],
      choices: [
        {
          message: {
            content: '',
            tool_calls: [
              {
                id: 'call_2',
                function: { name: 'coaching_agent', arguments: '{"query":"訓練"}' },
              },
            ],
          },
        },
      ],
      usage: { prompt_tokens: 200, completion_tokens: 30, total_tokens: 230 },
    })
    const provider = await getProvider()
    const result = await provider.chatWithTools(
      [{ role: 'user', content: '訓練' }],
      [{ name: 'coaching_agent', description: '教練', parameters: {} }]
    )
    expect(result.stopReason).toBe('tool_use')
    expect(result.toolCalls).toHaveLength(1)
    expect(result.toolCalls[0].name).toBe('coaching_agent')
  })

  it('Qwen thinking 模型用 reasoning key（非 reasoning_content）→ 同樣只進 reasoning', async () => {
    mockAI.run.mockResolvedValueOnce({
      choices: [{ message: { content: null, reasoning: 'Qwen 思考過程', role: 'assistant' } }],
      usage: { prompt_tokens: 50, completion_tokens: 100, total_tokens: 150 },
    })
    const provider = await getProvider()
    const result = await provider.chat([{ role: 'user', content: 'hi' }])
    expect(result.content).toBe('')
    expect(result.reasoning).toBe('Qwen 思考過程')
  })

  it('空回應不 crash', async () => {
    mockAI.run.mockResolvedValueOnce({})
    const provider = await getProvider()
    const result = await provider.chat([{ role: 'user', content: 'hi' }])
    expect(result.content).toBe('')
  })
})

function createSSEStream(events: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  const sseText = events.map((e) => `data: ${e}\n\n`).join('') + 'data: [DONE]\n\n'
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(sseText))
      controller.close()
    },
  })
}

describe('CloudflareProvider streamChat SSE format', () => {
  it('舊格式 SSE: { response }', async () => {
    mockAI.run.mockResolvedValueOnce(
      createSSEStream(['{"response":"你"}', '{"response":"好"}', '{"response":"嗎"}'])
    )
    const provider = await getProvider()
    const tokens: string[] = []
    const result = await provider.streamChat([{ role: 'user', content: 'hi' }], {
      onToken: async (t) => {
        tokens.push(t)
      },
    })
    expect(result.content).toBe('你好嗎')
    expect(tokens.join('')).toBe('你好嗎')
  })

  it('新格式 SSE: choices[0].delta.content', async () => {
    mockAI.run.mockResolvedValueOnce(
      createSSEStream([
        '{"choices":[{"delta":{"content":"Hello"}}]}',
        '{"choices":[{"delta":{"content":" world"}}]}',
      ])
    )
    const provider = await getProvider()
    const tokens: string[] = []
    const result = await provider.streamChat([{ role: 'user', content: 'hi' }], {
      onToken: async (t) => {
        tokens.push(t)
      },
    })
    expect(result.content).toBe('Hello world')
    expect(tokens.join('')).toBe('Hello world')
  })

  it('推理模型 SSE: reasoning_content delta 不推送給使用者，只收進 reasoning', async () => {
    mockAI.run.mockResolvedValueOnce(
      createSSEStream([
        '{"choices":[{"delta":{"content":"","reasoning_content":"思考"}}]}',
        '{"choices":[{"delta":{"content":"","reasoning_content":"過程"}}]}',
        '{"choices":[{"delta":{"content":"正文"}}]}',
      ])
    )
    const provider = await getProvider()
    const tokens: string[] = []
    const result = await provider.streamChat([{ role: 'user', content: '分析' }], {
      onToken: async (t) => {
        tokens.push(t)
      },
    })
    expect(result.content).toBe('正文')
    expect(result.reasoning).toBe('思考過程')
    expect(tokens.join('')).toBe('正文')
  })

  it('streamChat thinking: false → 帶 enable_thinking=false 且 stream: true', async () => {
    mockAI.run.mockResolvedValueOnce(createSSEStream(['{"choices":[{"delta":{"content":"ok"}}]}']))
    const provider = await getProvider()
    await provider.streamChat([{ role: 'user', content: 'hi' }], {
      model: '@cf/zai-org/glm-4.7-flash',
      thinking: false,
      onToken: async () => {},
    })
    const params = mockAI.run.mock.calls.at(-1)?.[1]
    expect(params.stream).toBe(true)
    expect(params.chat_template_kwargs).toEqual({ enable_thinking: false })
  })

  it('混合格式：content 優先於 reasoning_content', async () => {
    mockAI.run.mockResolvedValueOnce(
      createSSEStream(['{"choices":[{"delta":{"content":"正文","reasoning_content":"推理"}}]}'])
    )
    const provider = await getProvider()
    const tokens: string[] = []
    const result = await provider.streamChat([{ role: 'user', content: 'hi' }], {
      onToken: async (t) => {
        tokens.push(t)
      },
    })
    expect(result.content).toBe('正文')
  })

  it('空 delta 不推送 token', async () => {
    mockAI.run.mockResolvedValueOnce(
      createSSEStream(['{"choices":[{"delta":{}}]}', '{"choices":[{"delta":{"content":"有值"}}]}'])
    )
    const provider = await getProvider()
    const tokens: string[] = []
    const result = await provider.streamChat([{ role: 'user', content: 'hi' }], {
      onToken: async (t) => {
        tokens.push(t)
      },
    })
    expect(result.content).toBe('有值')
  })

  it('---SUGGESTIONS--- marker 在新格式下也正確切割', async () => {
    mockAI.run.mockResolvedValueOnce(
      createSSEStream([
        '{"choices":[{"delta":{"content":"回答內容"}}]}',
        '{"choices":[{"delta":{"content":"---SUGGESTIONS---"}}]}',
        '{"choices":[{"delta":{"content":"建議1"}}]}',
      ])
    )
    const provider = await getProvider()
    const tokens: string[] = []
    const result = await provider.streamChat([{ role: 'user', content: 'hi' }], {
      onToken: async (t) => {
        tokens.push(t)
      },
    })
    expect(result.content).toBe('回答內容---SUGGESTIONS---建議1')
    expect(tokens.join('')).toBe('回答內容')
  })
})
