// 封裝現有的 Cloudflare Workers AI binding 呼叫

import { Env } from '../../../../types'
import {
  AIProvider,
  ChatMessage,
  ChatWithToolsOptions,
  EmbeddingOptions,
  LLMCallOptions,
  LLMResponse,
  ToolSchema,
  ToolUseResponse,
} from './types'

/**
 * Workers AI 回傳格式解析
 * 舊模型（Llama）回 { response, tool_calls, usage }
 * 新模型（GLM/Qwen/DeepSeek/Kimi）回 OpenAI 相容 { choices: [{ message: { content, tool_calls } }], usage }
 */
function parseWorkersAIResponse(response: unknown) {
  const raw = response as Record<string, unknown>

  // content: 舊格式 response → 新格式 choices[0].message.content
  // 推理模型（GLM 5.3、DeepSeek R1）可能把內容放在 reasoning_content
  const choice = (raw.choices as Array<{ message?: Record<string, unknown> }>)?.[0]
  const content =
    (raw.response as string) ||
    (choice?.message?.content as string) ||
    (choice?.message?.reasoning_content as string) ||
    (choice?.message?.reasoning as string) ||
    ''

  // usage: 頂層 usage 或 choices 旁邊的 usage
  const usage = (raw.usage as { prompt_tokens?: number; completion_tokens?: number }) ?? {}

  // tool_calls: 頂層 tool_calls / toolCalls 或 choices[0].message.tool_calls
  // 用 length 判斷：空陣列也要 fallback
  const topToolCalls =
    (raw.tool_calls as Array<Record<string, unknown>>) ??
    (raw.toolCalls as Array<Record<string, unknown>>)
  const choiceToolCalls = choice?.message?.tool_calls as Array<Record<string, unknown>>
  const rawToolCalls =
    (topToolCalls?.length ? topToolCalls : null) ??
    (choiceToolCalls?.length ? choiceToolCalls : null) ??
    []

  return { content, usage, rawToolCalls }
}

export class CloudflareProvider implements AIProvider {
  readonly name = 'cloudflare'
  constructor(
    private readonly ai: Env['AI'],
    private readonly defaultModel = '@cf/meta/llama-3.1-8b-instruct',
    private readonly defaultEmbeddingModel = '@cf/baai/bge-m3'
  ) {}

  async chat(messages: ChatMessage[], opts: LLMCallOptions = {}): Promise<LLMResponse> {
    const response = await this.ai.run(
      opts.model ?? this.defaultModel,
      {
        messages,
        max_tokens: opts.maxTokens,
        tools: opts.tools,
      } as Parameters<typeof this.ai.run>[1],
      opts.gatewayOptions
    )
    const parsed = parseWorkersAIResponse(response)
    if (!parsed.content) {
      console.error(
        '[CloudflareProvider] EMPTY_CONTENT model=' + (opts.model ?? 'default'),
        'keys=' + Object.keys(response as object).join(','),
        'raw=' + JSON.stringify(response).slice(0, 800)
      )
    }
    return { content: parsed.content, usage: parsed.usage as LLMResponse['usage'] }
  }

  async streamChat(
    messages: ChatMessage[],
    opts: LLMCallOptions & { onToken: (token: string) => Promise<void> }
  ): Promise<LLMResponse> {
    const stream = (await (this.ai.run as Function)(
      opts.model ?? this.defaultModel,
      { messages, max_tokens: opts.maxTokens, stream: true },
      opts.gatewayOptions
    )) as ReadableStream<Uint8Array>

    const reader = stream.getReader()
    const decoder = new TextDecoder()
    let fullText = ''
    let sseBuffer = ''
    // 偵測 ---SUGGESTIONS--- 標記，標記之前推送給 onToken，之後收集但不推送
    let slideBuffer = ''
    let suggestionsStarted = false
    const MARKER = '---SUGGESTIONS---'

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        sseBuffer += decoder.decode(value, { stream: true })
        const lines = sseBuffer.split('\n')
        sseBuffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6).trim()
          if (payload === '[DONE]') break
          try {
            const parsed = JSON.parse(payload) as Record<string, unknown>
            const delta = (parsed.choices as Array<{ delta?: Record<string, unknown> }>)?.[0]?.delta
            const token =
              (parsed.response as string) ||
              (delta?.content as string) ||
              (delta?.reasoning_content as string) ||
              ''
            if (!token) continue

            fullText += token
            if (suggestionsStarted) continue

            slideBuffer += token
            const markerIdx = slideBuffer.indexOf(MARKER)
            if (markerIdx !== -1) {
              const beforeMarker = slideBuffer.slice(0, markerIdx)
              if (beforeMarker) await opts.onToken(beforeMarker)
              suggestionsStarted = true
            } else {
              const safeLen = slideBuffer.length - (MARKER.length - 1)
              if (safeLen > 0) {
                await opts.onToken(slideBuffer.slice(0, safeLen))
                slideBuffer = slideBuffer.slice(safeLen)
              }
            }
          } catch {
            /* 忽略格式錯誤的 SSE 行 */
          }
        }
      }
      if (!suggestionsStarted && slideBuffer) await opts.onToken(slideBuffer)
    } finally {
      reader.releaseLock()
    }

    return { content: fullText }
  }

  async embed(text: string, opts: EmbeddingOptions = {}): Promise<number[]> {
    const result = await this.ai.run(opts.model ?? this.defaultEmbeddingModel, {
      text: [text],
    } as Parameters<typeof this.ai.run>[1])
    const data = (result as { data?: number[][] }).data
    if (!data || !data[0]) throw new Error('CloudflareProvider embed: unexpected response shape')
    return data[0]
  }

  async embedBatch(texts: string[], opts: EmbeddingOptions = {}): Promise<number[][]> {
    const result = await this.ai.run(opts.model ?? this.defaultEmbeddingModel, {
      text: texts,
    } as Parameters<typeof this.ai.run>[1])
    const data = (result as { data?: number[][] }).data
    if (!data) throw new Error('CloudflareProvider embedBatch: unexpected response shape')
    return data
  }

  /**
   * Workers AI chatWithTools — 防禦性解析 tool_use 格式
   * Workers AI 的 function calling 回傳格式可能不穩定（多空格、string input、markdown 包裹 JSON）
   */
  async chatWithTools(
    messages: ChatMessage[],
    tools: ToolSchema[],
    opts: ChatWithToolsOptions = {}
  ): Promise<ToolUseResponse> {
    const model = opts.model ?? this.defaultModel
    const apiMessages = [...messages]
    if (opts.system) {
      apiMessages.unshift({ role: 'system', content: opts.system })
    }

    const response = await this.ai.run(model, {
      messages: apiMessages,
      max_tokens: opts.maxTokens,
      temperature: opts.temperature,
      tools: tools.map((t) => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      })),
    } as Parameters<typeof this.ai.run>[1])

    const { content, usage, rawToolCalls } = parseWorkersAIResponse(response)

    const toolCalls = rawToolCalls
      .map((tc, idx) => {
        try {
          const name = ((tc.name as string) ?? (tc.function as Record<string, unknown>)?.name ?? '')
            .trim()
            .replace(/\s+/g, '_')
          let input: unknown =
            tc.arguments ?? tc.input ?? (tc.function as Record<string, unknown>)?.arguments
          if (typeof input === 'string') {
            // 嘗試解析 markdown 包裹的 JSON 或純 JSON string
            const cleaned = input.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
            try {
              input = JSON.parse(cleaned)
            } catch {
              input = {}
            }
          }
          if (!name) return null
          return { id: tc.id ? String(tc.id) : `wai-tc-${idx}`, name, input: input ?? {} }
        } catch {
          return null
        }
      })
      .filter((tc): tc is NonNullable<typeof tc> => tc !== null)

    return {
      content: content || undefined,
      toolCalls,
      stopReason: toolCalls.length > 0 ? 'tool_use' : 'end_turn',
      usage: {
        input: usage.prompt_tokens ?? 0,
        output: usage.completion_tokens ?? 0,
      },
    }
  }
}
