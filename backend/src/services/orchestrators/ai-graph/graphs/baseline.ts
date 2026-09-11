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
import { queryRewriteNode } from '../nodes/query-rewrite'
import { popularityRerankNode } from '../nodes/popularity-rerank'
import { retrievalFallbackNode } from '../nodes/retrieval-fallback'
import { selfReflectionNode } from '../nodes/self-reflection'
import { semanticCacheNode } from '../nodes/semantic-cache'
import { textNormalizeNode } from '../nodes/text-normalize'
import { textToSqlNode } from '../nodes/text-to-sql'
import { toolSelectionNode } from '../nodes/tool-selection'
import {
  routeAfterEmbedding,
  routeAfterHybridSearch,
  routeAfterJudge,
  routeAfterMultiSourceRetrieval,
  routeAfterRetrievalFallback,
  routeAfterSelfReflection,
  routeAfterSemanticCache,
  routeAfterTextToSql,
  routeAfterToolSelection,
} from '../routing'
import { GraphStateAnnotation } from '../state'

export function buildBaselineGraph() {
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
    .addNode('queryRewrite', queryRewriteNode)
    .addNode('crossEncoder', crossEncoderNode)
    .addNode('mmr', mmrNode)
    .addNode('popularityRerank', popularityRerankNode)
    .addNode('llmGeneration', llmGenerationNode)
    .addNode('judge', judgeNode)
    .addNode('selfReflection', selfReflectionNode)
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
  graph.addEdge('crossEncoder', 'mmr')
  graph.addEdge('mmr', 'popularityRerank')
  graph.addEdge('popularityRerank', 'llmGeneration')
  graph.addEdge('llmGeneration', 'judge')
  graph.addConditionalEdges('judge', routeAfterJudge, {
    selfReflection: 'selfReflection',
    memoryExtractor: 'memoryExtractor',
  })
  graph.addConditionalEdges('selfReflection', routeAfterSelfReflection, {
    queryRewrite: 'queryRewrite',
    llmGeneration: 'llmGeneration',
  })
  graph.addEdge('queryRewrite', 'embedding')
  graph.addEdge('memoryExtractor', END)

  return graph.compile()
}

export const baselineGraph = buildBaselineGraph()
