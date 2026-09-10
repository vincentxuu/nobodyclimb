import { endSpan, startSpan } from '../../../utils/langfuse'
import { GraphState } from '../state'

const REWRITE_PROMPT = `你是攀岩知識搜尋系統的查詢改寫助手。

原始查詢搜尋到的結果品質不佳，請根據以下資訊改寫查詢，讓下一次搜尋能找到更相關的內容。

原始查詢：{query}
品質分數：{quality}（1-5，越高越好）
依據性分數：{groundedness}（0-1，越高越好）
搜尋到的文件數：{doc_count}
問題摘要：{issue_summary}

請回傳一個 JSON 物件：
{
  "rewritten_query": "改寫後的查詢（更具體、換角度、或拆解子問題）",
  "relax_filters": true/false（是否建議放寬過濾條件），
  "reason": "改寫原因（一句話）"
}

改寫原則：
- 如果 groundedness 低：原始查詢可能太模糊，改為更具體的關鍵字
- 如果 quality 低但 groundedness 正常：換個角度提問，或補充攀岩術語
- 如果文件數為 0：放寬查詢範圍，移除過度限制的條件
- 不要改變查詢的核心意圖

只回傳 JSON，不要其他文字。`

export async function queryRewriteNode(state: GraphState): Promise<Partial<GraphState>> {
  if (!state.loopBack || state.loopBack.reason === 'tool_fallback') return {}

  const span = startSpan(state.langfuseTrace ?? null, 'query-rewrite', {
    originalQuery: state.request.query,
    quality: state.quality,
    groundedness: state.groundedness,
  })

  try {
    const { pipelineConfig, queryService } = state
    const originalQuery = state.request.query
    const quality = state.quality
    const groundedness = state.groundedness
    const docCount = state.candidateMatches?.length ?? 0

    let issueSummary = ''
    if (docCount === 0) {
      issueSummary = '搜尋結果為空，需要放寬搜尋範圍'
    } else if (groundedness !== null && groundedness !== undefined && groundedness < 0.5) {
      issueSummary = '搜尋到的文件與問題相關性不足'
    } else if (quality !== null && quality !== undefined && quality <= 2) {
      issueSummary = '回答品質偏低，需要更精確的搜尋結果'
    } else {
      issueSummary = '回答品質有改善空間'
    }

    const prompt = REWRITE_PROMPT
      .replace('{query}', originalQuery)
      .replace('{quality}', String(quality ?? 'N/A'))
      .replace('{groundedness}', String(groundedness ?? 'N/A'))
      .replace('{doc_count}', String(docCount))
      .replace('{issue_summary}', issueSummary)

    const llmProvider = state.llmProvider
    if (!llmProvider) {
      endSpan(span, { output: { skipped: true, reason: 'no_llm_provider' } })
      return {}
    }

    const result = await llmProvider.chat(
      [{ role: 'user', content: prompt }],
      {
        model: pipelineConfig.lightweight_model,
        maxTokens: 200,
        gatewayOptions: state.gatewayOptions,
      }
    )

    const newTokenBreakdown = { ...state.tokenBreakdown }
    if (result.usage) {
      newTokenBreakdown.query_rewrite = {
        ...result.usage,
        model: pipelineConfig.lightweight_model,
        estimated: false,
      }
    }

    let rewrittenQuery = originalQuery
    let relaxFilters = false
    let reason = ''

    try {
      const jsonMatch = result.content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        if (parsed.rewritten_query && typeof parsed.rewritten_query === 'string') {
          rewrittenQuery = parsed.rewritten_query
        }
        relaxFilters = !!parsed.relax_filters
        reason = parsed.reason ?? ''
      }
    } catch {
      // JSON 解析失敗，保留原始 query
    }

    const updates: Partial<GraphState> = {
      tokenBreakdown: newTokenBreakdown,
      trace: {
        query_rewrite: {
          original_query: originalQuery,
          rewritten_query: rewrittenQuery,
          relax_filters: relaxFilters,
          reason,
          quality,
          groundedness,
          doc_count: docCount,
        },
      },
    }

    // 如果改寫了 query，更新 request（保留其他欄位）
    if (rewrittenQuery !== originalQuery) {
      updates.request = {
        ...state.request,
        query: rewrittenQuery,
      }
    }

    // 放寬過濾條件：移除 grade_numeric
    if (relaxFilters && state.vectorFilter) {
      const relaxedFilter = { ...state.vectorFilter }
      delete relaxedFilter['grade_numeric']
      updates.vectorFilter = relaxedFilter
    }

    // 重置 embedding 相關狀態，讓重搜用新 query 重新 embed
    updates.queryVector = undefined
    updates.hydeVector = undefined
    updates.expandedVectors = undefined
    updates.hydeDoc = undefined
    updates.expandedQueries = undefined

    endSpan(span, {
      output: {
        rewritten: rewrittenQuery !== originalQuery,
        rewrittenQuery,
        relaxFilters,
        reason,
      },
    })

    return updates
  } catch (err) {
    endSpan(span, { level: 'ERROR', metadata: { error: String(err) } })
    return {}
  }
}
