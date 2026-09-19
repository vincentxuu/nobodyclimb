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
  // 推理模型（GLM 4.7 / GLM 5.3 / Qwen3 / DeepSeek R1）會另外回 reasoning_content 或 reasoning。
  // 思考內容只能進 reasoning 欄位供 trace，絕不可 fallback 成 content：
  // 一旦 thinking 吃光 max_tokens，content 為空，若 fallback 就會把整段推理當成回答送給使用者。
  const choice = (raw.choices as Array<{ message?: Record<string, unknown> }>)?.[0]
  const content = (raw.response as string) || (choice?.message?.content as string) || ''
  const reasoning =
    (choice?.message?.reasoning_content as string) || (choice?.message?.reasoning as string) || ''

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

  return { content, reasoning, usage, rawToolCalls }
}

/**
 * 依模型家族產生「關閉 thinking」的 Workers AI 參數。
 * - GLM 4.x：官方 schema 的 chat_template_kwargs.enable_thinking（預設 true）
 * - Qwen3：沿用 pipeline（llm-generation.ts）的 budget_tokens: 0 慣例
 * thinking 為 undefined / true 時不加任何參數，沿用模型預設。
 */
export function buildThinkingParams(model: string, thinking?: boolean): Record<string, unknown> {
  if (thinking !== false) return {}
  const m = model.toLowerCase()
  if (m.includes('glm-4')) {
    return { chat_template_kwargs: { enable_thinking: false } }
  }
  if (m.includes('qwen3')) {
    return { budget_tokens: 0 }
  }
  return {}
}

/** content 空但 reasoning 有值 = thinking 吃光了 max_tokens，記錄以便從 log 追查 */
function warnIfThinkingConsumedBudget(model: string, content: string, reasoning: string) {
  if (!content && reasoning) {
    console.warn(
      `[CloudflareProvider] THINKING_CONSUMED_BUDGET model=${model} reasoning_chars=${reasoning.length}`
    )
  }
}

export class CloudflareProvider implements AIProvider {
  readonly name = 'cloudflare'
  constructor(
    private readonly ai: Env['AI'],
    private readonly defaultModel = '@cf/meta/llama-3.1-8b-instruct',
    private readonly defaultEmbeddingModel = '@cf/baai/bge-m3'
  ) {}

  async chat(messages: ChatMessage[], opts: LLMCallOptions = {}): Promise<LLMResponse> {
    const model = opts.model ?? this.defaultModel
    const response = await this.ai.run(
      model,
      {
        messages,
        max_tokens: opts.maxTokens,
        tools: opts.tools,
        ...buildThinkingParams(model, opts.thinking),
      } as Parameters<typeof this.ai.run>[1],
      opts.gatewayOptions
    )
    const parsed = parseWorkersAIResponse(response)
    warnIfThinkingConsumedBudget(model, parsed.content, parsed.reasoning)
    if (!parsed.content && !parsed.reasoning) {
      console.error(
        '[CloudflareProvider] EMPTY_CONTENT model=' + model,
        'keys=' + Object.keys(response as object).join(','),
        'raw=' + JSON.stringify(response).slice(0, 800)
      )
    }
    return {
      content: parsed.content,
      ...(parsed.reasoning ? { reasoning: parsed.reasoning } : {}),
      usage: parsed.usage as LLMResponse['usage'],
    }
  }

  async streamChat(
    messages: ChatMessage[],
    opts: LLMCallOptions & { onToken: (token: string) => Promise<void> }
  ): Promise<LLMResponse> {
    const model = opts.model ?? this.defaultModel
    const stream = (await (this.ai.run as Function)(
      model,
      {
        messages,
        max_tokens: opts.maxTokens,
        stream: true,
        ...buildThinkingParams(model, opts.thinking),
      },
      opts.gatewayOptions
    )) as ReadableStream<Uint8Array>

    const reader = stream.getReader()
    const decoder = new TextDecoder()
    let fullText = ''
    // 推理模型的思考 delta 只收集不推送，避免整段推理串流到使用者畫面
    let reasoningText = ''
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
            const reasoningDelta =
              (delta?.reasoning_content as string) || (delta?.reasoning as string) || ''
            if (reasoningDelta) reasoningText += reasoningDelta
            const token = (parsed.response as string) || (delta?.content as string) || ''
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

    warnIfThinkingConsumedBudget(model, fullText, reasoningText)
    return { content: fullText, ...(reasoningText ? { reasoning: reasoningText } : {}) }
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
      ...buildThinkingParams(model, opts.thinking),
    } as Parameters<typeof this.ai.run>[1])

    const { content, reasoning, usage, rawToolCalls } = parseWorkersAIResponse(response)
    // 有 tool calls 的輪次 content 本來就常是空的，只在「沒有 tool calls 也沒有正文」時才算預算被吃光
    if (rawToolCalls.length === 0) warnIfThinkingConsumedBudget(model, content, reasoning)

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
      ...(reasoning ? { reasoning } : {}),
      toolCalls,
      stopReason: toolCalls.length > 0 ? 'tool_use' : 'end_turn',
      usage: {
        input: usage.prompt_tokens ?? 0,
        output: usage.completion_tokens ?? 0,
      },
    }
  }
}
