export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LLMCallOptions {
  model?: string
  maxTokens?: number
  temperature?: number
  tools?: Array<{
    name: string
    description: string
    parameters: Record<string, unknown>
  }>
  gatewayOptions?: { gateway: { id: string } }
  /**
   * 推理模型（GLM 4.x / Qwen3）的 thinking 開關。
   * undefined = 沿用模型預設（GLM-4.7-flash 預設開啟）；false = 明確關閉，避免思考吃光 max_tokens。
   */
  thinking?: boolean
}

export interface LLMResponse {
  content: string
  /** 推理模型的思考內容（reasoning_content / reasoning）；只供 trace，絕不可當作回答 */
  reasoning?: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  toolCall?: {
    name: string
    arguments: Record<string, unknown>
  }
}

export interface EmbeddingOptions {
  model?: string
}

/** ReAct agent 用的 tool call 統一回傳格式 */
export interface ToolUseResponse {
  content?: string
  /** 推理模型的思考內容；只供 trace，絕不可當作回答 */
  reasoning?: string
  toolCalls: Array<{ id: string; name: string; input: unknown }>
  stopReason: 'tool_use' | 'end_turn'
  usage: { input: number; output: number }
}

export interface ChatWithToolsOptions {
  model?: string
  maxTokens?: number
  temperature?: number
  system?: string
  /** 同 LLMCallOptions.thinking */
  thinking?: boolean
}

export interface ToolSchema {
  name: string
  description: string
  parameters: Record<string, unknown>
}

export interface AIProvider {
  name: string
  /** 呼叫 LLM 生成，支援 tool calling */
  chat(messages: ChatMessage[], opts?: LLMCallOptions): Promise<LLMResponse>
  /** 串流生成，每個 token 觸發 onToken callback */
  streamChat(
    messages: ChatMessage[],
    opts: LLMCallOptions & { onToken: (token: string) => Promise<void> }
  ): Promise<LLMResponse>
  /** 向量嵌入 */
  embed(text: string, opts?: EmbeddingOptions): Promise<number[]>
  /** 批次向量嵌入 */
  embedBatch(texts: string[], opts?: EmbeddingOptions): Promise<number[][]>
  /** ReAct agent 用：tool_use 回傳多個 tool calls 的統一格式（可選，未實作的 provider 會 throw） */
  chatWithTools?(
    messages: ChatMessage[],
    tools: ToolSchema[],
    opts?: ChatWithToolsOptions
  ): Promise<ToolUseResponse>
}

export type ProviderName =
  | 'cloudflare'
  | 'workers-ai'
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'github'
