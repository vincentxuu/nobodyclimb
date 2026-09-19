/**
 * cross-encoder 共用工具
 *
 * 使用 bge-reranker-base 對候選文件重新評分，
 * 閾值過濾 + min_keep 安全網。
 */

import type { AIDocument, Env } from '../../types'
import { extractTitle } from '../core/documents'
import type { SearchResult } from '../orchestrators/pipeline/types'

// ---------------------------------------------------------------------------
// Input / Output
// ---------------------------------------------------------------------------

export interface CrossEncoderInput {
  query: string
  candidateMatches: SearchResult[]
  documents: Map<string, AIDocument>
  config: {
    reranker_relevance_threshold: number
    reranker_min_keep: number
  }
}

export interface CrossEncoderOutput {
  scoredCandidates: SearchResult[]
  trace: {
    reranker_used: boolean
    reranker: Record<string, unknown>
  }
}

// ---------------------------------------------------------------------------
// 主函式
// ---------------------------------------------------------------------------

export async function crossEncoderRerank(
  env: Env,
  input: CrossEncoderInput
): Promise<CrossEncoderOutput> {
  const { query, candidateMatches, documents, config } = input

  // 候選數 ≤ 1 不需要 rerank
  const rerankCandidates = candidateMatches.filter((m) => documents.has(m.id))
  if (rerankCandidates.length <= 1) {
    return {
      scoredCandidates: candidateMatches,
      trace: { reranker_used: false, reranker: { skipped_reason: 'too_few_candidates' } },
    }
  }

  try {
    const contexts = rerankCandidates.map((m) => ({ text: documents.get(m.id)!.text }))
    const rerankerResult = (await (env.AI.run as Function)('@cf/baai/bge-reranker-base', {
      query,
      contexts,
    })) as { response: { id: number; score: number }[] }

    if (!rerankerResult?.response?.length) {
      return {
        scoredCandidates: candidateMatches,
        trace: { reranker_used: false, reranker: { skipped_reason: 'empty_response' } },
      }
    }

    const scoreByIdx = new Map(rerankerResult.response.map((r) => [r.id, r.score]))
    const scored = rerankCandidates.map((m, idx) => ({
      ...m,
      score: scoreByIdx.get(idx) ?? m.score,
    }))

    // 閾值過濾：移除低相關性文件，保留 min_keep 安全網
    const sorted = [...scored].sort((a, b) => b.score - a.score)
    const filtered = sorted.filter((m) => m.score >= config.reranker_relevance_threshold)
    const scoredCandidates =
      filtered.length >= config.reranker_min_keep
        ? filtered
        : sorted.slice(0, config.reranker_min_keep)
    const filteredCount = sorted.length - scoredCandidates.length

    return {
      scoredCandidates,
      trace: {
        reranker_used: true,
        reranker: {
          input_count: rerankCandidates.length,
          filtered_count: filteredCount,
          threshold_used: config.reranker_relevance_threshold,
          top_scores: scoredCandidates.map((m) => {
            const doc = documents.get(m.id)
            return {
              title: doc ? extractTitle(doc) : m.id,
              score: Math.round(m.score * 1000) / 1000,
            }
          }),
        },
      },
    }
  } catch {
    return {
      scoredCandidates: candidateMatches,
      trace: { reranker_used: false, reranker: { skipped_reason: 'reranker_error' } },
    }
  }
}
