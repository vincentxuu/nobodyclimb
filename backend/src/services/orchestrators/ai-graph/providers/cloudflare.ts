// 封裝現有的 Cloudflare Workers AI binding 呼叫

import { Env } from '../../../../types'
import { flattenToolMessages, toOpenAIMessages } from './tool-messages'
import { readToolUseStream } from './tool-stream'
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
 * Workers AI 官方 input schema（<model>/sync-input.json）宣告 `chat_template_kwargs.enable_thinking`
 * 的模型家族，2026-09-19 逐一查證 admin 頁可選的模型：
 * GLM 4.7 / 5.2 / 5.3(-flash)、DeepSeek v4、Kimi k2.x、Qwen3.8、Nemotron 3、Gemma 4 都有；
 * gpt-oss / Llama / Mistral / qwen3-30b-a3b 沒有（舊版 schema，只有 max_tokens 等基本參數）。
 * 這些模型 enable_thinking 預設 true，1024 max_tokens 會被推理吃光讓正文為空。
 */
const ENABLE_THINKING_MODEL_FAMILIES = [
  'glm-',
  'deepseek-v4',
  'kimi-',
  'qwen3.8',
  'nemotron-3',
  'gemma-4',
]

/**
 * 依模型家族產生「關閉 thinking」的 Workers AI 參數。
 * - 上述家族：chat_template_kwargs.enable_thinking=false
 * - 其他 Qwen3（qwen3-4b / qwen3-30b）：沿用 pipeline（llm-generation.ts）的 budget_tokens: 0 慣例
 * thinking 為 undefined / true 時不加任何參數，沿用模型預設。
 * 注意：只比對 'glm-4' 曾漏掉 glm-5.3-flash（admin 預設 orchestrator），thinking 沒關導致
 * 收尾回答為空、output_guard 退回 fallback 訊息。
 */
export function buildThinkingParams(model: string, thinking?: boolean): Record<string, unknown> {
  if (thinking !== false) return {}
  const m = model.toLowerCase()
  if (ENABLE_THINKING_MODEL_FAMILIES.some((family) => m.includes(family))) {
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

/**
 * Workers AI 舊版 input schema 的模型（content 只能是 string、沒有 role: 'tool'）：
 * llama-3.x、qwen2.5 / qwen3-30b、gpt-oss、mistral。2026-09-19 實測會回 AiError 5006 schema 錯誤。
 * 新版 schema（GLM、DeepSeek、Kimi、llama-4）接受 OpenAI 格式的 tool_calls / tool 訊息。
 */
const LEGACY_MESSAGE_SCHEMA_PATTERN = /llama-3|qwen2\.5|qwen3-|gpt-oss|mistral/i

function hasToolMessages(messages: ChatMessage[]): boolean {
  return messages.some((m) => m.role === 'tool' || (m.role === 'assistant' && m.toolCalls?.length))
}

/** Workers AI 對訊息格式的驗證錯誤（oneOf / Type mismatch），用來判斷要不要降級成純文字重送 */
function isMessageSchemaError(err: unknown): boolean {
  const text = String(err)
  return /5006|oneOf at|Type mismatch|required properties/.test(text)
}

/**
 * 依模型決定 tool 訊息的送法：新 schema 走 OpenAI 原生格式（模型看到真正的 tool call 區段，
 * 不會再模仿「[呼叫工具: xxx]」文字），舊 schema 攤平成 user / assistant 純文字。
 */
export function prepareWorkersAIMessages(
  model: string,
  messages: ChatMessage[],
  forceFlatten = false
): unknown[] {
  if (forceFlatten || LEGACY_MESSAGE_SCHEMA_PATTERN.test(model)) {
    return flattenToolMessages(messages)
  }
  return toOpenAIMessages(messages)
}

export class CloudflareProvider implements AIProvider {
  readonly name = 'cloudflare'
  constructor(
    private readonly ai: Env['AI'],
    private readonly defaultModel = '@cf/meta/llama-3.1-8b-instruct',
    private readonly defaultEmbeddingModel = '@cf/baai/bge-m3'
  ) {}

  /**
   * 先用原生 tool 訊息格式送；沒列在舊 schema 清單卻仍被 Workers AI 以 schema 錯誤拒絕時，
   * 攤平成純文字重送一次（失敗的那次不產生 token 費用）。
   */
  private async runWithToolMessageFallback(
    model: string,
    messages: ChatMessage[],
    buildParams: (apiMessages: unknown[]) => Record<string, unknown>,
    gatewayOptions?: Parameters<typeof this.ai.run>[2]
  ): Promise<unknown> {
    // gatewayOptions 沒給時維持兩個參數的呼叫（chatWithTools 原本就沒有 gateway）
    const run = (params: Record<string, unknown>) =>
      gatewayOptions === undefined
        ? this.ai.run(model, params as Parameters<typeof this.ai.run>[1])
        : this.ai.run(model, params as Parameters<typeof this.ai.run>[1], gatewayOptions)
    try {
      return await run(buildParams(prepareWorkersAIMessages(model, messages)))
    } catch (err) {
      if (!hasToolMessages(messages) || !isMessageSchemaError(err)) throw err
      console.warn(
        `[CloudflareProvider] TOOL_MESSAGES_REJECTED model=${model} — retrying with flattened text`,
        String(err).slice(0, 200)
      )
      return await run(buildParams(prepareWorkersAIMessages(model, messages, true)))
    }
  }

  async chat(messages: ChatMessage[], opts: LLMCallOptions = {}): Promise<LLMResponse> {
    const model = opts.model ?? this.defaultModel
    const response = await this.runWithToolMessageFallback(
      model,
      messages,
      (apiMessages) => ({
        messages: apiMessages,
        max_tokens: opts.maxTokens,
        tools: opts.tools,
        ...buildThinkingParams(model, opts.thinking),
      }),
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
    const stream = (await this.runWithToolMessageFallback(
      model,
      messages,
      (apiMessages) => ({
        messages: apiMessages,
        max_tokens: opts.maxTokens,
        stream: true,
        ...buildThinkingParams(model, opts.thinking),
      }),
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
    const allMessages = [...messages]
    if (opts.system) {
      allMessages.unshift({ role: 'system', content: opts.system })
    }

    // 舊版 schema 的模型（llama-3 等）串流時的 tool call 格式未經實測，維持非串流
    const useStream = !!opts.onToken && !LEGACY_MESSAGE_SCHEMA_PATTERN.test(model)

    const response = await this.runWithToolMessageFallback(model, allMessages, (apiMessages) => ({
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
      ...(useStream ? { stream: true } : {}),
      ...buildThinkingParams(model, opts.thinking),
    }))

    // 串流模式：正文逐 token 推送，tool call 讀完後一次回傳。
    // 模型不支援串流而回一般物件時，落到下方的非串流解析。
    if (useStream && opts.onToken && response instanceof ReadableStream) {
      const streamed = await readToolUseStream(response as ReadableStream<Uint8Array>, {
        onToken: opts.onToken,
        signal: opts.signal,
        idPrefix: 'wai-tc',
      })
      if (streamed.toolCalls.length === 0) {
        warnIfThinkingConsumedBudget(model, streamed.content ?? '', streamed.reasoning ?? '')
      }
      return streamed
    }

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
