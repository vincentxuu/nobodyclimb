/**
 * 多輪對話的追問支援
 *
 * 解決的問題：chat_history 只帶回答文字，沒帶「參考來源」，而檢索又只看當前 query。
 * 使用者問「這些路線中哪一個看得到風景？」時，「這些路線」指的是上一輪列出的來源，
 * 但 embedding 單獨拿這句去搜，撈到的是描述裡有「風景」的其他路線。
 *
 * 做法（對應 quidproquo「Agent Memory 系統」的 context 注入模式）：
 * 1. 偵測追問（含指代詞或上下文依賴詞）
 * 2. 從 ai_query_logs 找回上一輪的 sources（以 user_id + 回答文字比對，不需前端改動）
 * 3. 把這些來源的完整文件塞進 context 前段（pipeline）或摘要塞進 system prompt（agent）
 * 4. 用輕量模型把追問改寫成獨立問題，讓檢索也吃得到脈絡
 */

import type { AIChatMessage, AIDocument, AIDocumentMetadata, AISource, Env } from '../../types'
import type { LangfuseParent } from '../../utils/langfuse'
import { logGeneration } from '../../utils/langfuse'
import { toTraditionalChinese } from '../../utils/opencc'
import { withTimeout } from '../../utils/timeout'
import type { TokenUsageInfo } from '../orchestrators/pipeline/types'
import { isContextDependentQuery } from './nlp'
import { estimateTokens, extractResponseText, type LLMResponse } from './types'

// 追問常見的指代詞：這些 / 那條 / 其中 / 哪一個 / 上面 / 剛剛 / 它們 / 第二條 ...
const ANAPHORA_PATTERN =
  /這些|那些|這幾|那幾|其中|哪一|哪條|哪個|哪幾|上面|上述|以上|剛剛|剛才|前面|它們|他們|這條|那條|這個|那個|第[一二三四五六七八九十\d]+[條個]|these|those|which one|among them/i

/** 上一輪來源最多帶幾筆進 context（避免撐爆 token） */
const MAX_CARRY_OVER_SOURCES = 10
/** 回答文字比對長度（去掉標點與連結後只比 CJK 開頭） */
const RESPONSE_MATCH_LENGTH = 30
/** 改寫 LLM 的超時（毫秒） */
const REWRITE_TIMEOUT_MS = 4000
/** 改寫結果長度上限；超過視為模型失控，退回原 query */
const REWRITE_MAX_LENGTH = 160

/** 判斷 query 是否為依賴前文的追問 */
export function isFollowUpQuery(query: string, recentHistory: AIChatMessage[]): boolean {
  if (recentHistory.length === 0) return false
  return ANAPHORA_PATTERN.test(query) || isContextDependentQuery(query)
}

/** 只留 CJK 字元，讓「有無 markdown 連結」「簡繁差異」都不影響比對 */
export function normalizeForMatch(text: string): string {
  return toTraditionalChinese(text)
    .replace(/[^一-鿿]/g, '')
    .slice(0, RESPONSE_MATCH_LENGTH)
}

/** 找出歷史中最後一則 assistant 訊息 */
function lastAssistantMessage(recentHistory: AIChatMessage[]): AIChatMessage | null {
  for (let i = recentHistory.length - 1; i >= 0; i--) {
    if (recentHistory[i].role === 'assistant' && recentHistory[i].content.trim()) {
      return recentHistory[i]
    }
  }
  return null
}

/**
 * 從 ai_query_logs 找回上一輪回答的 sources。
 *
 * 匿名使用者無法可靠對應 log（user_id 為 NULL），回傳空陣列。
 * 為避免多分頁或舊對話誤配，會用 log 的 response 與歷史中最後一則 assistant 內容比對開頭。
 */
export async function findPreviousTurnSources(
  db: D1Database,
  userId: string | null | undefined,
  recentHistory: AIChatMessage[]
): Promise<AISource[]> {
  if (!userId) return []
  const lastAssistant = lastAssistantMessage(recentHistory)
  if (!lastAssistant) return []
  const target = normalizeForMatch(lastAssistant.content)
  if (target.length < 8) return []

  try {
    const rows = await db
      .prepare(
        `SELECT response, sources FROM ai_query_logs
         WHERE user_id = ? AND sources IS NOT NULL AND sources != '[]'
         ORDER BY created_at DESC LIMIT 5`
      )
      .bind(userId)
      .all<{ response: string; sources: string }>()

    for (const row of rows.results ?? []) {
      if (normalizeForMatch(row.response ?? '') !== target) continue
      const parsed = JSON.parse(row.sources) as AISource[]
      if (!Array.isArray(parsed)) return []
      return parsed
        .filter((s) => s && typeof s.id === 'string' && (s.type === 'route' || s.type === 'crag'))
        .slice(0, MAX_CARRY_OVER_SOURCES)
    }
  } catch {
    /* 查不到就當沒有，不影響主流程 */
  }
  return []
}

/** 依 sources 取回完整文件（依 sources 順序排列） */
export async function loadCarryOverDocuments(
  db: D1Database,
  sources: AISource[]
): Promise<AIDocument[]> {
  const ids = sources.map((s) => s.id).filter(Boolean)
  if (ids.length === 0) return []
  const placeholders = ids.map(() => '?').join(', ')
  try {
    const rows = await db
      .prepare(
        `SELECT * FROM ai_documents
         WHERE source_id IN (${placeholders}) AND type IN ('route', 'crag')`
      )
      .bind(...ids)
      .all<AIDocument>()
    const bySourceId = new Map<string, AIDocument>()
    for (const doc of rows.results ?? []) bySourceId.set(doc.source_id, doc)
    return ids.map((id) => bySourceId.get(id)).filter((d): d is AIDocument => !!d)
  } catch {
    return []
  }
}

/**
 * Pipeline 用：完整文件區塊，會放在檢索結果前面。
 * 格式與 popularity-rerank 組出的 context 一致（含路線連結），讓 prompt 規則直接適用。
 */
export function buildCarryOverContext(docs: AIDocument[]): string | null {
  if (docs.length === 0) return null
  const body = docs
    .map((d) => {
      let text = d.text
      if (d.type === 'route' && d.metadata) {
        try {
          const meta = JSON.parse(d.metadata) as AIDocumentMetadata
          if (meta.crag_id) text += `\n路線連結：/crag/${meta.crag_id}/route/${d.source_id}`
        } catch {
          /* ignore */
        }
      }
      return text
    })
    .join('\n\n---\n\n')
  return `【上一輪回答提及的路線／岩場】使用者若用「這些」「其中」「哪一條」等指代，指的是以下資料：\n\n${body}`
}

/**
 * Agent 用：精簡清單（名稱 + 摘要），放進 system prompt。
 * 不放完整文件，維持「工具結果才是唯一事實來源」的規則，模型需要細節時自行呼叫工具。
 */
export function buildCarryOverSummary(sources: AISource[]): string | null {
  if (sources.length === 0) return null
  const lines = sources.map((s) => `- ${s.title}${s.excerpt ? `（${s.excerpt}）` : ''}`)
  return [
    '【上一輪回答提及的路線／岩場】',
    '使用者若用「這些」「其中」「哪一條」等指代，指的是以下清單。追問時請針對這些名稱呼叫工具取得細節，不要重新搜尋不相關的路線：',
    ...lines,
  ].join('\n')
}

const REWRITE_PROMPT = `你是攀岩問答系統的查詢改寫助手。使用者的追問依賴前文，請把它改寫成一句不需要對話脈絡也能理解的獨立問題，供檢索使用。

規則：
- 把「這些」「其中」「那條」等指代詞換成具體的路線名稱或岩場名稱
- 保留使用者原本的意圖與條件（難度、地點、類型），不要加入新的條件
- 只輸出改寫後的問題本身，一行，繁體中文，不要解釋、不要加引號

對話歷史：
{history}
{previous_sources}
使用者追問：{query}

改寫後的問題：`

export interface RewriteFollowUpParams {
  env: Env
  query: string
  recentHistory: AIChatMessage[]
  previousSources: AISource[]
  model: string
  gatewayOptions?: { gateway: { id: string } }
  langfuseParent?: LangfuseParent | null
  /** assistant 訊息帶入 prompt 的截斷長度 */
  assistantTruncate?: number
}

export interface RewriteFollowUpResult {
  rewritten: string
  usage: TokenUsageInfo
}

/** 從模型輸出取出一行乾淨的問題；不合格回傳 null */
export function sanitizeRewrittenQuery(raw: string, original: string): string | null {
  const firstLine = raw
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.length > 0)
  if (!firstLine) return null
  const cleaned = firstLine
    .replace(/^改寫後的問題[:：]\s*/, '')
    .replace(/^[「"'『]+|[」"'』]+$/g, '')
    .trim()
  if (cleaned.length < 2 || cleaned.length > REWRITE_MAX_LENGTH) return null
  if (cleaned === original.trim()) return null
  return cleaned
}

/**
 * 用輕量模型把追問改寫成獨立問題。失敗、超時或輸出不合格時回傳 null，呼叫端沿用原 query。
 */
export async function rewriteFollowUpQuery(
  params: RewriteFollowUpParams
): Promise<RewriteFollowUpResult | null> {
  const { env, query, recentHistory, previousSources, model, gatewayOptions } = params
  const truncate = params.assistantTruncate ?? 600

  const historyText = recentHistory
    .slice(-4)
    .map((m) => {
      const content = m.role === 'assistant' ? m.content.slice(0, truncate) : m.content
      return `${m.role === 'user' ? '使用者' : '助理'}：${content}`
    })
    .join('\n')
  const sourcesText =
    previousSources.length > 0
      ? `\n上一輪回答的參考路線：${previousSources.map((s) => s.title).join('、')}\n`
      : ''
  const prompt = REWRITE_PROMPT.replace('{history}', historyText)
    .replace('{previous_sources}', sourcesText)
    .replace('{query}', query)

  try {
    // 與 llm-generation 相同：model 為執行期字串，繞過 Workers AI 的 model 字面型別
    const run = env.AI.run as unknown as (
      model: string,
      inputs: Record<string, unknown>,
      options?: { gateway: { id: string } }
    ) => Promise<LLMResponse>
    const result = await withTimeout(
      run(
        model,
        { messages: [{ role: 'user', content: prompt }], max_tokens: 120 },
        gatewayOptions
      ),
      REWRITE_TIMEOUT_MS,
      'followup-rewrite'
    )
    const raw = extractResponseText(result)
    const rewritten = sanitizeRewrittenQuery(raw, query)
    logGeneration(params.langfuseParent ?? null, {
      name: 'followup-rewrite',
      model,
      input: [{ role: 'user', content: prompt }],
      output: raw,
      usage: result.usage
        ? {
            promptTokens: result.usage.prompt_tokens,
            completionTokens: result.usage.completion_tokens,
            totalTokens: result.usage.total_tokens,
          }
        : undefined,
    })
    if (!rewritten) return null
    const usage: TokenUsageInfo = result.usage
      ? { ...result.usage, estimated: false }
      : { ...estimateTokens(prompt, raw), estimated: true }
    return { rewritten, usage }
  } catch {
    return null
  }
}
