import { GraphState } from './state'

/** 檢查是否有 earlyReturn（cache hit 或特殊路徑），直接到 END */
export function routeAfterSemanticCache(state: GraphState): 'END' | 'toolSelection' {
  if (state.earlyReturn) return 'END'
  return 'toolSelection'
}

/** tool-selection 後的分流 */
export function routeAfterToolSelection(state: GraphState):
  | 'textToSql'
  | 'multiSourceRetrieval'
  | 'filterBuild'
  | 'llmGeneration'
  | 'END' {
  if (state.earlyReturn) return 'END'
  if (state.queryType === 'sql') return 'textToSql'
  if (state.queryType === 'clarification-needed') return 'END'
  if (state.queryType === 'general-knowledge') return 'llmGeneration'
  if (state.queryType === 'multi-tool' && state.multiToolPlan) return 'multiSourceRetrieval'
  return 'filterBuild'
}

/** text-to-sql 後：成功有結果→生成回答，無結果→ fallback 向量搜尋，earlyReturn（澄清/錯誤）→ END */
export function routeAfterTextToSql(state: GraphState): 'llmGeneration' | 'embedding' | 'END' {
  if (state.earlyReturn) return 'END'
  if (state.sqlCandidates && state.sqlCandidates.length > 0) return 'llmGeneration'
  return 'embedding'
}

/** embedding 後：若失敗走 lexicalFallback，否則走 HyDE */
export function routeAfterEmbedding(
  state: GraphState
): 'hyde' | 'lexicalFallback' | 'hybridSearch' {
  if (state.embeddingFailed) return 'lexicalFallback'
  return 'hyde'
}

/** multi-source-retrieval 後：skipPostRetrieval 代表已完成 synthesis，直接生成 */
export function routeAfterMultiSourceRetrieval(
  state: GraphState
): 'llmGeneration' | 'crossEncoder' {
  if (state.skipPostRetrieval) return 'llmGeneration'
  return 'crossEncoder'
}

/** hybridSearch 後：檢查 retrievalFallback 條件 */
export function routeAfterHybridSearch(state: GraphState): 'retrievalFallback' | 'crossEncoder' {
  if (
    state.fallbackEnabled &&
    (state.candidateMatches ?? []).length === 0 &&
    state.alternativeTool
  ) {
    return 'retrievalFallback'
  }
  return 'crossEncoder'
}

/** retrievalFallback 後：loopBack 回 filterBuild 重新執行 */
export function routeAfterRetrievalFallback(
  state: GraphState
): 'filterBuild' | 'crossEncoder' {
  if (state.loopBack?.reason === 'tool_fallback') return 'filterBuild'
  return 'crossEncoder'
}

/** judge 後：quality 不足且未超過 loop 限制則觸發 self-reflection */
export function routeAfterJudge(state: GraphState): 'selfReflection' | 'memoryExtractor' {
  const cfg = state.pipelineConfig
  const quality = state.quality ?? 4
  const loopCount = state.loopCount ?? 0
  if (
    quality <= cfg.judge_regen_quality_max &&
    loopCount < cfg.max_pipeline_loops &&
    (state.context?.length ?? 0) >= cfg.self_reflection_min_length
  ) {
    return 'selfReflection'
  }
  return 'memoryExtractor'
}

/**
 * self-reflection 後：檢查 loopBack.targetPhase
 * - 'retrieval' → 先經過 queryRewrite 再重新搜尋
 * - 其他 / 未設定 → 回到 llmGeneration（重新生成）
 */
export function routeAfterSelfReflection(state: GraphState): 'queryRewrite' | 'llmGeneration' {
  if (state.loopBack?.targetPhase === 'retrieval') return 'queryRewrite'
  return 'llmGeneration'
}

// ---- Auto Strategy Routing ----

/** toolSelection 後依 strategyHint 分流到不同策略路徑 */
export function routeByStrategy(state: GraphState):
  | 'textToSql'
  | 'multiSourceRetrieval'
  | 'filterBuild'         // baseline path
  | 'filterBuildAgentic'  // agentic path
  | 'planning'            // plan-execute path
  | 'llmGeneration'
  | 'END' {
  if (state.earlyReturn) return 'END'
  if (state.queryType === 'sql') return 'textToSql'
  if (state.queryType === 'clarification-needed') return 'END'
  if (state.queryType === 'general-knowledge') return 'llmGeneration'
  if (state.queryType === 'multi-tool' && state.multiToolPlan) return 'multiSourceRetrieval'

  const hint = state.strategyHint
  if (hint === 'agentic' && state.queryType === 'complex') return 'filterBuildAgentic'
  if (hint === 'plan-execute' && state.queryType === 'complex') return 'planning'
  return 'filterBuild'
}

// ---- Agentic Strategy ----

/** agentic decision 後的分流 */
export function routeAgenticDecision(state: GraphState):
  | 'agenticRetrieve'
  | 'llmGeneration'
  | 'END' {
  if (state.earlyReturn) return 'END'
  if (state.agenticAction === 'ANSWER') return 'llmGeneration'
  return 'agenticRetrieve'
}

/** agentic retrieve 後：繼續迭代或回答 */
export function routeAfterAgenticRetrieve(state: GraphState): 'agenticDecision' | 'llmGeneration' {
  const cfg = state.pipelineConfig
  const loopCount = state.loopCount ?? 0
  if (loopCount >= cfg.agentic_max_steps) return 'llmGeneration'
  const docCount = state.candidateMatches?.length ?? 0
  if (docCount >= cfg.agentic_min_docs_to_answer) return 'llmGeneration'
  return 'agenticDecision'
}
