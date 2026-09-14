import { END, START, StateGraph } from '@langchain/langgraph'
import { contextCompressionNode } from '../nodes/context-compression'
import { crossEncoderNode } from '../nodes/cross-encoder'
import { embeddingNode } from '../nodes/embedding'
import { filterBuildNode } from '../nodes/filter-build'
import { hybridSearchNode } from '../nodes/hybrid-search'
import { hydeNode } from '../nodes/hyde'
import { judgeNode } from '../nodes/judge'
import { lexicalFallbackNode } from '../nodes/lexical-fallback'
import { llmGenerationNode } from '../nodes/llm-generation'
import { memoryExtractorNode } from '../nodes/memory-extractor'
import { mmrNode } from '../nodes/mmr'
import { multiQueryNode } from '../nodes/multi-query'
import { multiSourceRetrievalNode } from '../nodes/multi-source-retrieval'
import { popularityRerankNode } from '../nodes/popularity-rerank'
import { queryRewriteNode } from '../nodes/query-rewrite'
import { retrievalFallbackNode } from '../nodes/retrieval-fallback'
import { retrievalQualityJudgeNode } from '../nodes/retrieval-quality-judge'
import { selfReflectionNode } from '../nodes/self-reflection'
import { semanticCacheNode } from '../nodes/semantic-cache'
import { textNormalizeNode } from '../nodes/text-normalize'
import { textToSqlNode } from '../nodes/text-to-sql'
import { toolSelectionNode } from '../nodes/tool-selection'
import {
  routeAfterEmbedding,
  routeAfterHybridSearch,
  routeAfterMultiSourceRetrieval,
  routeAfterRetrievalFallback,
  routeAfterRetrievalQualityJudge,
  routeAfterSemanticCache,
  routeAfterTextToSql,
  routeAfterToolSelection,
} from '../routing'
import { withToggle } from '../shared/tool-toggle'
import { GraphState, GraphStateAnnotation } from '../state'

/**
 * Custom graph — 所有工具都可透過 ragTools 開關控制
 *
 * 拓撲結構與 Thorough 相同（最完整的 pipeline），但每個可選節點
 * 都經過 withToggle 包裝。關掉的節點直接返回空 state，效果等同跳過。
 *
 * 預設全部開啟。只有明確設 false 的工具才會跳過。
 */

function routeAfterJudgeCustom(state: GraphState): 'selfReflection' | 'memoryExtractor' {
  if (state.ragTools?.generationRetry === false) return 'memoryExtractor'

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

function routeAfterSelfReflectionCustom(state: GraphState): 'queryRewrite' | 'llmGeneration' {
  if (state.ragTools?.queryRewrite === false) return 'llmGeneration'
  if (state.loopBack?.targetPhase === 'retrieval') return 'queryRewrite'
  return 'llmGeneration'
}

export function buildCustomGraph() {
  const graph = new StateGraph(GraphStateAnnotation)
    .addNode('semanticCache', semanticCacheNode)
    .addNode('textNormalize', withToggle('textNormalize', textNormalizeNode))
    .addNode('toolSelection', toolSelectionNode)
    .addNode('textToSql', textToSqlNode)
    .addNode('multiSourceRetrieval', multiSourceRetrievalNode)
    .addNode('filterBuild', filterBuildNode)
    .addNode('embedding', embeddingNode)
    .addNode('lexicalFallback', lexicalFallbackNode)
    .addNode('hyde', withToggle('hyde', hydeNode))
    .addNode('multiQuery', withToggle('queryExpansion', multiQueryNode))
    .addNode('hybridSearch', hybridSearchNode)
    .addNode('retrievalFallback', retrievalFallbackNode)
    .addNode('crossEncoder', withToggle('semanticRerank', crossEncoderNode))
    .addNode('mmr', withToggle('diversityFilter', mmrNode))
    .addNode('popularityRerank', withToggle('domainRerank', popularityRerankNode))
    .addNode(
      'retrievalQualityJudge',
      withToggle('retrievalQualityJudge', retrievalQualityJudgeNode)
    )
    .addNode('queryRewrite', withToggle('queryRewrite', queryRewriteNode))
    .addNode('contextCompression', withToggle('contextCompression', contextCompressionNode))
    .addNode('llmGeneration', llmGenerationNode)
    .addNode('judge', withToggle('responseQualityJudge', judgeNode))
    .addNode('selfReflection', withToggle('generationRetry', selfReflectionNode))
    .addNode('memoryExtractor', withToggle('conversationMemory', memoryExtractorNode))

  // ---- Entry ----
  graph.addEdge(START, 'semanticCache')
  graph.addConditionalEdges('semanticCache', routeAfterSemanticCache, {
    END,
    toolSelection: 'textNormalize',
  })
  graph.addEdge('textNormalize', 'toolSelection')
  graph.addConditionalEdges('toolSelection', routeAfterToolSelection, {
    textToSql: 'textToSql',
    multiSourceRetrieval: 'multiSourceRetrieval',
    filterBuild: 'filterBuild',
    llmGeneration: 'llmGeneration',
    END,
  })
  graph.addConditionalEdges('textToSql', routeAfterTextToSql, {
    llmGeneration: 'llmGeneration',
    embedding: 'embedding',
    END,
  })
  graph.addConditionalEdges('multiSourceRetrieval', routeAfterMultiSourceRetrieval, {
    llmGeneration: 'llmGeneration',
    crossEncoder: 'crossEncoder',
  })

  // ---- Retrieval ----
  graph.addEdge('filterBuild', 'embedding')
  graph.addConditionalEdges('embedding', routeAfterEmbedding, {
    hyde: 'hyde',
    lexicalFallback: 'lexicalFallback',
    hybridSearch: 'hybridSearch',
  })
  graph.addEdge('lexicalFallback', 'crossEncoder')
  graph.addEdge('hyde', 'multiQuery')
  graph.addEdge('multiQuery', 'hybridSearch')
  graph.addConditionalEdges('hybridSearch', routeAfterHybridSearch, {
    retrievalFallback: 'retrievalFallback',
    crossEncoder: 'crossEncoder',
  })
  graph.addConditionalEdges('retrievalFallback', routeAfterRetrievalFallback, {
    filterBuild: 'filterBuild',
    crossEncoder: 'crossEncoder',
  })

  // ---- Rerank ----
  graph.addEdge('crossEncoder', 'mmr')
  graph.addEdge('mmr', 'popularityRerank')

  // ---- Retrieval Quality Check ----
  graph.addEdge('popularityRerank', 'retrievalQualityJudge')
  graph.addConditionalEdges('retrievalQualityJudge', routeAfterRetrievalQualityJudge, {
    queryRewrite: 'queryRewrite',
    llmGeneration: 'contextCompression',
  })
  graph.addEdge('queryRewrite', 'embedding')

  // ---- Context Compression + Generation ----
  graph.addEdge('contextCompression', 'llmGeneration')
  graph.addEdge('llmGeneration', 'judge')
  graph.addConditionalEdges('judge', routeAfterJudgeCustom, {
    selfReflection: 'selfReflection',
    memoryExtractor: 'memoryExtractor',
  })
  graph.addConditionalEdges('selfReflection', routeAfterSelfReflectionCustom, {
    queryRewrite: 'queryRewrite',
    llmGeneration: 'llmGeneration',
  })
  graph.addEdge('memoryExtractor', END)

  return graph.compile()
}

export const customGraph = buildCustomGraph()
