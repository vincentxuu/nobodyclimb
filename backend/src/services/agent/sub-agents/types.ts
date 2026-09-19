import type { AgentRouteSource } from '../tools/route-sources'
import type { ToolContext, ToolResult } from '../types'

/** Sub-agent context：純文字，或附帶結構化來源（供連結注入） */
export interface SubAgentContext {
  context: string
  sources: AgentRouteSource[]
}

/** Sub-agent：擁有獨立 system prompt 和專屬 context 的 agent，被 orchestrator 當作 Tool 呼叫 */
export interface SubAgent {
  name: string
  description: string
  /** 專屬 system prompt（聚焦此 capability 的指令） */
  systemPrompt: string
  /** 依賴的底層工具名稱（用於文件和除錯，不影響執行） */
  innerTools: string[]
  /** 收集資料：呼叫底層工具取得 context（可附帶結構化來源） */
  gatherContext(input: unknown, ctx: ToolContext): Promise<string | SubAgentContext>
  /** 用 LLM 根據 context 產生回答 */
  synthesize(query: string, context: string, ctx: ToolContext): Promise<SubAgentResult>
}

export interface SubAgentResult {
  answer: string
  tokensUsed: number
}

/** 把 SubAgent 包裝成 Tool interface 的回傳格式 */
export interface SubAgentToolOutput {
  answer: string
  tokensUsed: number
  subAgent: string
  sources?: AgentRouteSource[]
}

/** Sub-agent formatResult 的統一實作 */
export function formatSubAgentResult(raw: unknown): ToolResult {
  const data = raw as SubAgentToolOutput | { error: string }
  if ('error' in data) {
    return { content: data.error }
  }
  return {
    content: data.answer,
    metadata: {
      subAgent: data.subAgent,
      tokensUsed: data.tokensUsed,
      resultCount: data.sources?.length ?? 0,
      sources: data.sources ?? [],
    },
  }
}

/** gatherContext 回傳正規化：字串或 { context, sources } 統一轉為後者 */
export function normalizeGatheredContext(gathered: string | SubAgentContext): SubAgentContext {
  return typeof gathered === 'string' ? { context: gathered, sources: [] } : gathered
}
