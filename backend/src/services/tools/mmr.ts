/**
 * MMR（Maximal Marginal Relevance）共用工具
 *
 * 從 scoredCandidates 中兼顧相關性與多樣性選取 top-N。
 * 底層委派給 query/retrieval.ts 的 applyMMR。
 */

import type { AIDocument } from '../../types'
import { applyMMR } from '../core/retrieval'
import type { SearchResult } from '../orchestrators/pipeline/types'

// ---------------------------------------------------------------------------
// Input / Output
// ---------------------------------------------------------------------------

export interface MMRInput {
  scoredCandidates: SearchResult[]
  documents: Map<string, AIDocument>
  config: {
    mmr_lambda: number
    max_results: number
  }
}

export interface MMROutput {
  /** 每個 item 加上 finalScore = score */
  rerankedMatches: Array<SearchResult & { finalScore: number }>
  trace: {
    lambda: number
    input_count: number
    selected_count: number
  }
}

// ---------------------------------------------------------------------------
// 主函式
// ---------------------------------------------------------------------------

export function mmrSelect(input: MMRInput): MMROutput {
  const { scoredCandidates, documents, config } = input

  const mmrSelected = applyMMR(scoredCandidates, documents, config.mmr_lambda, config.max_results)

  return {
    rerankedMatches: mmrSelected.map((m) => ({ ...m, finalScore: m.score })),
    trace: {
      lambda: config.mmr_lambda,
      input_count: scoredCandidates.length,
      selected_count: mmrSelected.length,
    },
  }
}
