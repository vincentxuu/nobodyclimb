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

  it('推理模型 content 空但有 reasoning_content（GLM 5.3 / DeepSeek R1）', async () => {
    mockAI.run.mockResolvedValueOnce({
      choices: [
        { message: { content: '', reasoning_content: '推理過程和回答', role: 'assistant' } },
      ],
      usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 },
    })
    const provider = await getProvider()
    const result = await provider.chat([{ role: 'user', content: '分析弱點' }])
    expect(result.content).toBe('推理過程和回答')
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

  it('Qwen thinking 模型用 reasoning key（非 reasoning_content）', async () => {
    mockAI.run.mockResolvedValueOnce({
      choices: [{ message: { content: null, reasoning: 'Qwen 思考過程', role: 'assistant' } }],
      usage: { prompt_tokens: 50, completion_tokens: 100, total_tokens: 150 },
    })
    const provider = await getProvider()
    const result = await provider.chat([{ role: 'user', content: 'hi' }])
    expect(result.content).toBe('Qwen 思考過程')
  })

  it('空回應不 crash', async () => {
    mockAI.run.mockResolvedValueOnce({})
    const provider = await getProvider()
    const result = await provider.chat([{ role: 'user', content: 'hi' }])
    expect(result.content).toBe('')
  })
})
