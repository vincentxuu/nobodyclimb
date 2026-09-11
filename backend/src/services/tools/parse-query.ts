/**
 * parse-query 共用工具
 *
 * 從 pipeline/steps/tool-selection.ts 與 ai-graph/nodes/tool-selection.ts 的
 * 共用邏輯抽取而來：regex 安全網 + LLM 查詢分類 + queryType 判定 + 信心三層邏輯。
 *
 * 不包含 sim-route intent 處理（pipeline 用單條、graph 用多條，邏輯不同，留在 wrapper）。
 */

import toolRegistry from '../orchestrators/tool-registry'

// ---------------------------------------------------------------------------
// 共用 regex + helper（原本在兩個檔案各複製一份）
// ---------------------------------------------------------------------------

/** 個人查詢偵測 pattern */
export const PERSONAL_QUERY_PATTERN =
  /我.{0,6}(爬過|完攀|攀了|爬了|評了)|我(有幾條|的路線|的紀錄|的完攀|最高|最難)/

const SQL_COUNT_PATTERN = /有幾條|幾條路線|多少條|共有幾/
const SQL_LIST_PATTERN = /有哪些.*路線|列出.*路線|有什麼.*路線|路線有哪些|路線有什麼/

/** 推薦/類似意圖偵測 */
export const RECOMMENDATION_PATTERN = /推薦|建議|類似|相似|差不多|下一條|下一個|suggest/i

/** 從 query + 岩場名稱推斷 SQL 模板（regex 安全網） */
export function inferSqlQuery(
  query: string,
  cragNames: string[]
): { template: string; params: Record<string, unknown> } | null {
  const isCount = SQL_COUNT_PATTERN.test(query)
  const isList = SQL_LIST_PATTERN.test(query)
  if (!isCount && !isList) return null

  const sorted = [...cragNames].sort((a, b) => b.length - a.length)
  const cragName = sorted.find((name) => query.includes(name))
  if (!cragName) return null

  const params: Record<string, unknown> = { crag_name: cragName }
  const gradeMatch = query.match(/5\.\d+[a-d]?/)
  if (gradeMatch) params.grade = gradeMatch[0]
  if (/運攀|sport/i.test(query)) params.route_type = 'sport'
  else if (/傳攀|trad/i.test(query)) params.route_type = 'trad'
  else if (/抱石|boulder/i.test(query)) params.route_type = 'boulder'

  if (isCount) return { template: 'COUNT_ROUTES_AT_CRAG', params }
  if (!params.grade && !params.route_type) return { template: 'GRADE_DISTRIBUTION', params }
  return { template: 'LIST_ROUTES_BY_CRITERIA', params }
}

/** 從個人查詢推斷 SQL 模板 */
export function inferPersonalTemplate(query: string): string {
  if (/幾條|幾次|多少條/.test(query)) return 'MY_ASCENT_COUNT'
  if (/最高|最難/.test(query)) return 'MY_HIGHEST_GRADE'
  if (/評|星/.test(query)) return 'MY_RATED_ROUTES'
  if (/哪個岩場|在.+爬/.test(query)) return 'MY_ASCENT_AT_CRAG'
  return 'MY_ASCENT_LIST'
}

// ---------------------------------------------------------------------------
// Input / Output
// ---------------------------------------------------------------------------

export interface ParseQueryDeps {
  parseQueryWithLLM: (
    query: string,
    model: string,
    cragNames: string[],
    areaNames: string[],
    regionNames: string[],
    gatewayOptions: { gateway: { id: string } } | undefined,
    prompt: string
  ) => Promise<{ result: ParsedQueryResult | null; usage?: TokenUsageInfo }>
}

export interface ParsedQueryResult {
  tool: string
  query_type?: string
  confidence?: number
  alternative?: string
  template?: string
  params?: Record<string, unknown>
  clarification_type?: string
  retrieval_method?: string
  multi_tool?: {
    steps: Array<{ tool: string; purpose?: string; query?: string; params?: unknown }>
    execution_mode?: string
  }
}

interface TokenUsageInfo {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}

export interface ParseQueryInput {
  query: string
  llmModel: string
  cragNames: string[]
  areaNames: string[]
  regionNames: string[]
  gatewayOptions: { gateway: { id: string } } | undefined
  toolSelectionPromptTemplate: string
  config: {
    lightweight_model: string
    simple_model: string
    rag_strategy: string
    tool_confidence_threshold: number
  }
}

export interface ParseQueryOutput {
  parsedQuery: ParsedQueryResult | null
  queryType: string
  effectiveLlmModel: string
  sqlTemplate?: string
  sqlParams?: Record<string, unknown>
  clarificationType?: string
  toolConfidence: number
  alternativeTool?: string
  strategyHint?: string
  retrievalMethod?: string
  fallbackEnabled: boolean
  multiToolPlan?: {
    steps: Array<{ tool: string; purpose: string; query: string; params?: unknown }>
    execution_mode: 'parallel' | 'sequential'
  }
  trace: {
    query_parsing: Record<string, unknown>
    tool_selection: Record<string, unknown>
  }
  usage?: TokenUsageInfo
}

// ---------------------------------------------------------------------------
// 主函式：LLM 分類 + queryType 判定 + 信心邏輯
// ---------------------------------------------------------------------------

export async function parseQuery(
  deps: ParseQueryDeps,
  input: ParseQueryInput
): Promise<ParseQueryOutput> {
  const { query, llmModel, cragNames, areaNames, regionNames, gatewayOptions, config } = input

  // 動態注入工具描述到 prompt
  const prompt = (input.toolSelectionPromptTemplate || '').replace(
    '{tools}',
    toolRegistry.generatePromptBlock()
  )

  const { result: parsedQuery, usage } = await deps.parseQueryWithLLM(
    query,
    llmModel,
    cragNames,
    areaNames,
    regionNames,
    gatewayOptions,
    prompt
  )

  // 預設值
  const output: ParseQueryOutput = {
    parsedQuery,
    queryType: 'complex',
    effectiveLlmModel: llmModel,
    toolConfidence: parsedQuery?.confidence ?? 1.0,
    alternativeTool: parsedQuery?.alternative,
    fallbackEnabled: false,
    trace: {
      query_parsing: parsedQuery
        ? {
            tool: parsedQuery.tool,
            query_type: parsedQuery.query_type ?? 'complex',
            confidence: parsedQuery.confidence ?? 1.0,
            params: (parsedQuery.params ?? {}) as Record<string, unknown>,
            fallback_used: false,
            confidence_fallback: false,
          }
        : {},
      tool_selection: parsedQuery
        ? {
            selected_tool: parsedQuery.tool,
            confidence: parsedQuery.confidence ?? 1.0,
            ...(parsedQuery.alternative ? { alternative: parsedQuery.alternative } : {}),
            fallback: { triggered: false },
          }
        : {},
    },
    usage,
  }

  // --- queryType 判定 ---
  if (parsedQuery?.tool === 'general_knowledge') {
    output.queryType = 'general-knowledge'
    output.effectiveLlmModel = config.lightweight_model
  } else if (parsedQuery?.tool === 'search_sql') {
    output.queryType = parsedQuery.query_type ?? 'sql'
    output.sqlTemplate = parsedQuery.template
    output.sqlParams = parsedQuery.params as Record<string, unknown>
    output.clarificationType = parsedQuery.clarification_type
    output.effectiveLlmModel = config.lightweight_model
  } else if (parsedQuery?.tool === 'hybrid') {
    output.queryType = 'hybrid'
    output.sqlParams = parsedQuery.params as Record<string, unknown>
    output.effectiveLlmModel = llmModel
  } else if (parsedQuery?.tool === 'multi_tool') {
    const mt = parsedQuery.multi_tool
    const validToolNames = toolRegistry
      .getValidToolNames()
      .filter((t) => t !== 'multi_tool' && t !== 'general_knowledge')
    if (mt?.steps && Array.isArray(mt.steps) && mt.steps.length > 0) {
      const validSteps = mt.steps
        .slice(0, 3)
        .filter((s) => s.tool && validToolNames.includes(s.tool))
      if (validSteps.length > 0) {
        output.queryType = 'multi-tool'
        output.multiToolPlan = {
          steps: validSteps.map((s) => ({
            tool: s.tool,
            purpose: s.purpose || '',
            query: s.query || query,
            params: s.params,
          })),
          execution_mode: mt.execution_mode === 'sequential' ? 'sequential' : 'parallel',
        }
      }
    }
    // validSteps 為空或無 steps → 留 complex
  } else {
    // regex 安全網
    if (PERSONAL_QUERY_PATTERN.test(query) && !RECOMMENDATION_PATTERN.test(query)) {
      output.queryType = 'sql'
      output.sqlTemplate = inferPersonalTemplate(query)
      output.sqlParams = {}
      output.effectiveLlmModel = config.lightweight_model
      output.trace.query_parsing = {
        ...output.trace.query_parsing,
        personal_query_fallback: true,
      }
    } else {
      const sqlOverride = inferSqlQuery(query, cragNames)
      if (sqlOverride) {
        output.queryType = 'sql'
        output.sqlTemplate = sqlOverride.template
        output.sqlParams = sqlOverride.params
        output.effectiveLlmModel = config.lightweight_model
        output.trace.query_parsing = {
          ...output.trace.query_parsing,
          sql_query_fallback: true,
        }
      } else {
        output.queryType = parsedQuery?.query_type ?? 'complex'
        output.effectiveLlmModel = output.queryType === 'simple' ? config.simple_model : llmModel
      }
    }
  }

  // --- auto 模式 strategy_hint ---
  if (config.rag_strategy === 'auto' && parsedQuery) {
    const VALID_HINTS = ['baseline', 'agentic', 'plan-execute'] as const
    const raw = parsedQuery as unknown as Record<string, unknown>
    const rawHint = raw['strategy_hint']
    if (typeof rawHint === 'string' && (VALID_HINTS as readonly string[]).includes(rawHint)) {
      output.strategyHint = rawHint
    }
  }

  // --- retrievalMethod ---
  if (parsedQuery?.retrieval_method) {
    const VALID_METHODS = ['vector', 'bm25', 'hybrid'] as const
    if ((VALID_METHODS as readonly string[]).includes(parsedQuery.retrieval_method)) {
      output.retrievalMethod = parsedQuery.retrieval_method
    }
  }

  // --- 信心三層邏輯 ---
  const regexUsed =
    output.trace.query_parsing.personal_query_fallback ||
    output.trace.query_parsing.sql_query_fallback
  if (!regexUsed && output.queryType !== 'general-knowledge') {
    const confidence = output.toolConfidence
    if (confidence < config.tool_confidence_threshold) {
      const originalTool = parsedQuery?.tool
      output.queryType = 'general-knowledge'
      output.effectiveLlmModel = config.lightweight_model
      if (output.parsedQuery)
        output.parsedQuery = { ...output.parsedQuery, tool: 'general_knowledge' }
      output.trace.query_parsing = {
        ...output.trace.query_parsing,
        confidence_fallback: true,
        original_tool: originalTool,
      }
    } else if (confidence < 0.8) {
      output.fallbackEnabled = true
    }
  }

  return output
}
