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

  it('thinking: false → GLM 5.x / DeepSeek v4 / Kimi / Qwen3.8 也帶 enable_thinking=false', async () => {
    // 只比對 'glm-4' 曾漏掉 admin 預設的 glm-5.3-flash，thinking 沒關 → 收尾回答為空 → fallback 訊息
    mockAI.run.mockResolvedValue({
      choices: [{ message: { content: 'ok', role: 'assistant' } }],
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
    })
    const provider = await getProvider()
    for (const model of [
      '@cf/zai-org/glm-5.3-flash',
      '@cf/zai-org/glm-5.2',
      '@cf/deepseek-ai/deepseek-v4-flash-0731',
      '@cf/moonshotai/kimi-k2.6',
      '@cf/qwen/qwen3.8-27b',
    ]) {
      await provider.chat([{ role: 'user', content: 'hi' }], { model, thinking: false })
      const params = mockAI.run.mock.calls.at(-1)?.[1]
      expect(params.chat_template_kwargs, model).toEqual({ enable_thinking: false })
      expect(params.budget_tokens, model).toBeUndefined()
    }
    mockAI.run.mockReset()
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

  it('chatWithTools：新 schema 模型（GLM）以 OpenAI 原生 tool_calls / role: tool 送出歷史', async () => {
    mockAI.run.mockReset()
    mockAI.run.mockResolvedValueOnce({
      choices: [{ message: { content: '推薦 Reach around', tool_calls: [] } }],
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
    })
    const provider = await getProvider()
    await provider.chatWithTools(
      [
        { role: 'user', content: '推薦進階路線' },
        {
          role: 'assistant',
          content: '',
          toolCalls: [{ id: 'call_1', name: 'search_routes', input: { crag: '壽山' } }],
        },
        { role: 'tool', toolCallId: 'call_1', name: 'search_routes', content: '1. Reach around' },
      ],
      [{ name: 'search_routes', description: '搜尋', parameters: {} }],
      { model: '@cf/zai-org/glm-4.7-flash' }
    )
    const sent = mockAI.run.mock.calls.at(-1)?.[1].messages
    expect(sent[1]).toEqual({
      role: 'assistant',
      content: null,
      tool_calls: [
        {
          id: 'call_1',
          type: 'function',
          function: { name: 'search_routes', arguments: '{"crag":"壽山"}' },
        },
      ],
    })
    expect(sent[2]).toEqual({ role: 'tool', tool_call_id: 'call_1', content: '1. Reach around' })
  })

  it('chatWithTools：舊 schema 模型（llama-3 / qwen3-30b / gpt-oss）直接攤平成純文字', async () => {
    mockAI.run.mockReset()
    mockAI.run.mockResolvedValue({
      choices: [{ message: { content: 'ok', tool_calls: [] } }],
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
    })
    const provider = await getProvider()
    const history = [
      { role: 'user' as const, content: '推薦進階路線' },
      {
        role: 'assistant' as const,
        content: '',
        toolCalls: [{ id: 'call_1', name: 'search_routes', input: {} }],
      },
      {
        role: 'tool' as const,
        toolCallId: 'call_1',
        name: 'search_routes',
        content: '1. Reach around',
      },
    ]
    for (const model of [
      '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
      '@cf/qwen/qwen3-30b-a3b-fp8',
      '@cf/openai/gpt-oss-20b',
    ]) {
      await provider.chatWithTools(history, [], { model })
      const sent = mockAI.run.mock.calls.at(-1)?.[1].messages
      expect(
        sent.map((m: { role: string }) => m.role),
        model
      ).toEqual(['user', 'assistant', 'user'])
      expect(sent[2].content, model).toContain('<tool_result name="search_routes">')
      expect(
        sent.every((m: object) => !('tool_calls' in m)),
        model
      ).toBe(true)
    }
    expect(mockAI.run).toHaveBeenCalledTimes(3)
    mockAI.run.mockReset()
  })

  it('chatWithTools：未列入舊清單的模型被 Workers AI 以 schema 錯誤拒絕 → 攤平重送一次', async () => {
    mockAI.run.mockReset()
    mockAI.run
      .mockRejectedValueOnce(
        new Error(
          "AiError: 5006: Error: oneOf at '/' not met, Type mismatch of '/messages/2/content'"
        )
      )
      .mockResolvedValueOnce({
        choices: [{ message: { content: 'ok', tool_calls: [] } }],
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      })
    const provider = await getProvider()
    const result = await provider.chatWithTools(
      [
        { role: 'user', content: 'q' },
        { role: 'assistant', content: '', toolCalls: [{ id: 'c1', name: 'weather', input: {} }] },
        { role: 'tool', toolCallId: 'c1', name: 'weather', content: '晴' },
      ],
      [],
      { model: '@cf/some-vendor/unknown-model' }
    )
    expect(result.content).toBe('ok')
    expect(mockAI.run).toHaveBeenCalledTimes(2)
    expect(mockAI.run.mock.calls[0][1].messages[1].tool_calls).toBeDefined()
    expect(mockAI.run.mock.calls[1][1].messages.map((m: { role: string }) => m.role)).toEqual([
      'user',
      'assistant',
      'user',
    ])
    mockAI.run.mockReset()
  })

  it('chatWithTools：沒有 tool 訊息時的錯誤不會觸發重送，直接拋出', async () => {
    mockAI.run.mockReset()
    mockAI.run.mockRejectedValueOnce(new Error('AiError: 5006: Type mismatch'))
    const provider = await getProvider()
    await expect(
      provider.chatWithTools([{ role: 'user', content: 'q' }], [], {
        model: '@cf/zai-org/glm-4.7-flash',
      })
    ).rejects.toThrow('5006')
    expect(mockAI.run).toHaveBeenCalledTimes(1)
    mockAI.run.mockReset()
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
