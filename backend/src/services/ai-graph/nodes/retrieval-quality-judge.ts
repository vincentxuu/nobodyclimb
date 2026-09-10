import { endSpan, startSpan } from '../../../utils/langfuse'
import { GraphState } from '../state'

const RETRIEVAL_JUDGE_PROMPT = `你是攀岩知識搜尋系統的檢索品質評估員。

使用者問題：{query}
檢索到的文件摘要：
{doc_summaries}

請評估檢索結果是否足以回答使用者問題，回傳 JSON：
{
  "recall_sufficient": true/false,
  "confidence": 0.0-1.0,
  "gaps": ["缺少的資訊1", "缺少的資訊2"],
  "suggestion": "改善建議（一句話）"
}

評估標準：
- 文件數為 0 → recall_sufficient: false
- 文件內容與問題無關 → recall_sufficient: false
- 文件部分相關但缺少關鍵資訊 → recall_sufficient: false，列出 gaps
- 文件充分覆蓋問題 → recall_sufficient: true

只回傳 JSON，不要其他文字。`

export async function retrievalQualityJudgeNode(
  state: GraphState
): Promise<Partial<GraphState>> {
  const candidateMatches = state.candidateMatches ?? []
  const documents = state.documents ?? new Map()

  // 有足夠文件時不需要跑 judge（省成本）
  if (candidateMatches.length >= 3) {
    return {
      trace: {
        retrieval_quality: {
          skipped: true,
          reason: 'sufficient_candidates',
          candidate_count: candidateMatches.length,
        },
      },
    }
  }

  const span = startSpan(state.langfuseTrace ?? null, 'retrieval-quality-judge', {
    candidateCount: candidateMatches.length,
  })

  try {
    const { pipelineConfig, queryService } = state
    const query = state.request.query

    // 零結果直接判定不足
    if (candidateMatches.length === 0) {
      endSpan(span, { output: { recall_sufficient: false, reason: 'no_candidates' } })
      return {
        trace: {
          retrieval_quality: {
            recall_sufficient: false,
            confidence: 1.0,
            gaps: ['搜尋結果為空'],
            candidate_count: 0,
          },
        },
      }
    }

    // 組合文件摘要
    const docSummaries = candidateMatches
      .slice(0, 5)
      .map((m, i) => {
        const doc = documents.get(m.id)
        if (!doc) return `${i + 1}. [文件不可用]`
        const title = queryService.extractTitle(doc)
        const excerpt = doc.text.slice(0, 200)
        return `${i + 1}. ${title}\n   ${excerpt}...`
      })
      .join('\n')

    const prompt = RETRIEVAL_JUDGE_PROMPT
      .replace('{query}', query)
      .replace('{doc_summaries}', docSummaries)

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
      newTokenBreakdown.retrieval_quality_judge = {
        ...result.usage,
        model: pipelineConfig.lightweight_model,
        estimated: false,
      }
    }

    let recallSufficient = true
    let confidence = 0.5
    let gaps: string[] = []
    let suggestion = ''

    try {
      const jsonMatch = result.content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        recallSufficient = parsed.recall_sufficient !== false
        confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.5
        gaps = Array.isArray(parsed.gaps) ? parsed.gaps : []
        suggestion = parsed.suggestion ?? ''
      }
    } catch {
      // JSON 解析失敗，預設為足夠（不阻擋 pipeline）
    }

    endSpan(span, {
      output: {
        recall_sufficient: recallSufficient,
        confidence,
        gaps_count: gaps.length,
      },
    })

    return {
      tokenBreakdown: newTokenBreakdown,
      trace: {
        retrieval_quality: {
          recall_sufficient: recallSufficient,
          confidence,
          gaps,
          suggestion,
          candidate_count: candidateMatches.length,
          raw_response: result.content.slice(0, 500),
        },
      },
    }
  } catch (err) {
    endSpan(span, { level: 'ERROR', metadata: { error: String(err) } })
    return {
      trace: {
        retrieval_quality: {
          skipped: true,
          reason: 'error',
          error: String(err),
        },
      },
    }
  }
}
