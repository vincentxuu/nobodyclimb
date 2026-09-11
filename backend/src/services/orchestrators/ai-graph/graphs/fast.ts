import { END, START, StateGraph } from '@langchain/langgraph'
import { crossEncoderNode } from '../nodes/cross-encoder'
import { embeddingNode } from '../nodes/embedding'
import { filterBuildNode } from '../nodes/filter-build'
import { hybridSearchNode } from '../nodes/hybrid-search'
import { lexicalFallbackNode } from '../nodes/lexical-fallback'
import { llmGenerationNode } from '../nodes/llm-generation'
import { memoryExtractorNode } from '../nodes/memory-extractor'
import { multiSourceRetrievalNode } from '../nodes/multi-source-retrieval'
import { retrievalFallbackNode } from '../nodes/retrieval-fallback'
import { semanticCacheNode } from '../nodes/semantic-cache'
import { textNormalizeNode } from '../nodes/text-normalize'
import { textToSqlNode } from '../nodes/text-to-sql'
import { toolSelectionNode } from '../nodes/tool-selection'
import {
  routeAfterEmbedding,
  routeAfterHybridSearch,
  routeAfterMultiSourceRetrieval,
  routeAfterRetrievalFallback,
  routeAfterSemanticCache,
  routeAfterTextToSql,
  routeAfterToolSelection,
} from '../routing'
import { GraphStateAnnotation } from '../state'

/**
 * Fast graph — 低延遲、低成本模式（1-2s，1 次 LLM 呼叫）
 *
 * 跳過：HyDE, queryExpansion, MMR, domainRerank, judge, selfReflection, queryRewrite
 * 保留：semanticCache, textNormalize, intentClassifier, metadataFilter,
 *       queryEmbedding, hybridRetrieval, semanticRerank, responseGeneration, conversationMemory
 */
export function buildFastGraph() {
  const graph = new StateGraph(GraphStateAnnotation)
    .addNode('semanticCache', semanticCacheNode)
    .addNode('textNormalize', textNormalizeNode)
    .addNode('toolSelection', toolSelectionNode)
    .addNode('textToSql', textToSqlNode)
    .addNode('multiSourceRetrieval', multiSourceRetrievalNode)
    .addNode('filterBuild', filterBuildNode)
    .addNode('embedding', embeddingNode)
    .addNode('lexicalFallback', lexicalFallbackNode)
    .addNode('hybridSearch', hybridSearchNode)
    .addNode('retrievalFallback', retrievalFallbackNode)
    .addNode('crossEncoder', crossEncoderNode)
    .addNode('llmGeneration', llmGenerationNode)
    .addNode('memoryExtractor', memoryExtractorNode)

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
  graph.addEdge('filterBuild', 'embedding')
  graph.addConditionalEdges('embedding', routeAfterEmbedding, {
    hyde: 'hybridSearch', // Fast: 跳過 HyDE，直接搜尋
    lexicalFallback: 'lexicalFallback',
    hybridSearch: 'hybridSearch',
  })
  graph.addEdge('lexicalFallback', 'crossEncoder')
  graph.addConditionalEdges('hybridSearch', routeAfterHybridSearch, {
    retrievalFallback: 'retrievalFallback',
    crossEncoder: 'crossEncoder',
  })
  graph.addConditionalEdges('retrievalFallback', routeAfterRetrievalFallback, {
    filterBuild: 'filterBuild',
    crossEncoder: 'crossEncoder',
  })
  // Fast: crossEncoder 直接到 llmGeneration（跳過 MMR + domainRerank）
  graph.addEdge('crossEncoder', 'llmGeneration')
  // Fast: llmGeneration 直接到 memoryExtractor（跳過 judge + selfReflection）
  graph.addEdge('llmGeneration', 'memoryExtractor')
  graph.addEdge('memoryExtractor', END)

  return graph.compile()
}

export const fastGraph = buildFastGraph()
