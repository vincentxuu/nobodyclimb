import { END, START, StateGraph } from '@langchain/langgraph'
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
import { GraphStateAnnotation } from '../state'

/**
 * Corrective graph — 檢索品質自我修正模式（4-8s，3-5 次 LLM 呼叫）
 *
 * 與 Thorough 的差異：在 rerank 之後、生成之前，加入 retrievalQualityJudge。
 * recall 不足時走 queryRewrite → 重新 embed → 重搜（最多 retry 2 次）。
 * 生成後仍有 answerJudge，但不再有 selfReflection 的重搜迴圈（已由 retrieval 層修正）。
 */
export function buildCorrectiveGraph() {
  const graph = new StateGraph(GraphStateAnnotation)
    .addNode('semanticCache', semanticCacheNode)
    .addNode('textNormalize', textNormalizeNode)
    .addNode('toolSelection', toolSelectionNode)
    .addNode('textToSql', textToSqlNode)
    .addNode('multiSourceRetrieval', multiSourceRetrievalNode)
    .addNode('filterBuild', filterBuildNode)
    .addNode('embedding', embeddingNode)
    .addNode('lexicalFallback', lexicalFallbackNode)
    .addNode('hyde', hydeNode)
    .addNode('multiQuery', multiQueryNode)
    .addNode('hybridSearch', hybridSearchNode)
    .addNode('retrievalFallback', retrievalFallbackNode)
    .addNode('crossEncoder', crossEncoderNode)
    .addNode('mmr', mmrNode)
    .addNode('popularityRerank', popularityRerankNode)
    .addNode('retrievalQualityJudge', retrievalQualityJudgeNode)
    .addNode('queryRewrite', queryRewriteNode)
    .addNode('llmGeneration', llmGenerationNode)
    .addNode('judge', judgeNode)
    .addNode('memoryExtractor', memoryExtractorNode)

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

  // ---- Retrieval Quality Check (Corrective 特有) ----
  graph.addEdge('popularityRerank', 'retrievalQualityJudge')
  graph.addConditionalEdges('retrievalQualityJudge', routeAfterRetrievalQualityJudge, {
    queryRewrite: 'queryRewrite',
    llmGeneration: 'llmGeneration',
  })
  graph.addEdge('queryRewrite', 'embedding')

  // ---- Generation + Quality (no selfReflection loop) ----
  graph.addEdge('llmGeneration', 'judge')
  graph.addEdge('judge', 'memoryExtractor')
  graph.addEdge('memoryExtractor', END)

  return graph.compile()
}

export const correctiveGraph = buildCorrectiveGraph()
