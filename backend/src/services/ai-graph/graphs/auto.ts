import { END, Send, START, StateGraph } from '@langchain/langgraph'
import { textToSqlNode } from '../nodes/text-to-sql'
import { agenticDecisionNode } from '../nodes/agentic-decision'
import { agenticRetrieveNode } from '../nodes/agentic-retrieve'
import { crossEncoderNode } from '../nodes/cross-encoder'
import { embeddingNode } from '../nodes/embedding'
import { executePlanStepNode } from '../nodes/execute-plan-step'
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
import { planningNode } from '../nodes/planning'
import { queryRewriteNode } from '../nodes/query-rewrite'
import { popularityRerankNode } from '../nodes/popularity-rerank'
import { retrievalFallbackNode } from '../nodes/retrieval-fallback'
import { selfReflectionNode } from '../nodes/self-reflection'
import { semanticCacheNode } from '../nodes/semantic-cache'
import { textNormalizeNode } from '../nodes/text-normalize'
import { synthesisNode } from '../nodes/synthesis'
import { toolSelectionNode } from '../nodes/tool-selection'
import {
  routeAfterAgenticRetrieve,
  routeAfterEmbedding,
  routeAfterHybridSearch,
  routeAfterJudge,
  routeAfterMultiSourceRetrieval,
  routeAfterRetrievalFallback,
  routeAfterSelfReflection,
  routeAfterSemanticCache,
  routeAfterTextToSql,
  routeAgenticDecision,
  routeByStrategy,
} from '../routing'
import { GraphState, GraphStateAnnotation } from '../state'

type PlanStep = { id: number; query: string; tool: string; filters: Record<string, unknown> }

function dispatchPlanSteps(state: GraphState): Send[] | string {
  const planSteps = (state.multiToolPlan?.steps ?? []) as unknown as PlanStep[]
  if (planSteps.length === 0) return 'synthesis'
  return planSteps.map((step) => new Send('executePlanStep', { ...state, currentPlanStep: step }))
}

export function buildAutoGraph() {
  const graph = new StateGraph(GraphStateAnnotation)
    // Shared entry
    .addNode('semanticCache', semanticCacheNode)
    .addNode('textNormalize', textNormalizeNode)
    .addNode('toolSelection', toolSelectionNode)
    .addNode('textToSql', textToSqlNode)
    .addNode('multiSourceRetrieval', multiSourceRetrievalNode)
    // Baseline path
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
    // Agentic path (separate filterBuild instance to avoid node name collision)
    .addNode('filterBuildAgentic', filterBuildNode)
    .addNode('embeddingAgentic', embeddingNode)
    .addNode('agenticDecision', agenticDecisionNode)
    .addNode('agenticRetrieve', agenticRetrieveNode)
    .addNode('hybridSearchAgentic', hybridSearchNode)
    .addNode('crossEncoderAgentic', crossEncoderNode)
    .addNode('mmrAgentic', mmrNode)
    .addNode('popularityRerankAgentic', popularityRerankNode)
    // Plan-execute path
    .addNode('planning', planningNode)
    .addNode('executePlanStep', executePlanStepNode)
    .addNode('synthesis', synthesisNode)
    // Shared tail
    .addNode('llmGeneration', llmGenerationNode)
    .addNode('judge', judgeNode)
    .addNode('selfReflection', selfReflectionNode)
    .addNode('memoryExtractor', memoryExtractorNode)

  // ---- Entry ----
  graph.addEdge(START, 'semanticCache')
  graph.addConditionalEdges('semanticCache', routeAfterSemanticCache, {
    END,
    toolSelection: 'textNormalize',
  })
  graph.addEdge('textNormalize', 'toolSelection')

  // ---- Strategy routing (the key difference from explicit graphs) ----
  graph.addConditionalEdges('toolSelection', routeByStrategy, {
    textToSql: 'textToSql',
    multiSourceRetrieval: 'multiSourceRetrieval',
    filterBuild: 'filterBuild',
    filterBuildAgentic: 'filterBuildAgentic',
    planning: 'planning',
    llmGeneration: 'llmGeneration',
    END,
  })

  // ---- Text-to-SQL ----
  graph.addConditionalEdges('textToSql', routeAfterTextToSql, {
    llmGeneration: 'llmGeneration',
    embedding: 'embedding',
    END,
  })

  // ---- Multi-source retrieval ----
  graph.addConditionalEdges('multiSourceRetrieval', routeAfterMultiSourceRetrieval, {
    llmGeneration: 'llmGeneration',
    crossEncoder: 'crossEncoder',
  })

  // ---- Baseline path ----
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

  // ---- Agentic path ----
  graph.addEdge('filterBuildAgentic', 'embeddingAgentic')
  graph.addEdge('embeddingAgentic', 'agenticDecision')
  graph.addConditionalEdges('agenticDecision', routeAgenticDecision, {
    agenticRetrieve: 'agenticRetrieve',
    llmGeneration: 'llmGeneration',
    END,
  })
  graph.addConditionalEdges('agenticRetrieve', routeAfterAgenticRetrieve, {
    agenticDecision: 'agenticDecision',
    llmGeneration: 'llmGeneration',
  })
  // Agentic self-reflection loopback goes through rerank
  graph.addEdge('hybridSearchAgentic', 'crossEncoderAgentic')
  graph.addEdge('crossEncoderAgentic', 'mmrAgentic')
  graph.addEdge('mmrAgentic', 'popularityRerankAgentic')
  graph.addEdge('popularityRerankAgentic', 'agenticDecision')

  // ---- Plan-execute path ----
  graph.addConditionalEdges('planning', dispatchPlanSteps, ['executePlanStep', 'synthesis'])
  graph.addEdge('executePlanStep', 'synthesis')
  graph.addEdge('synthesis', 'llmGeneration')

  // ---- Shared tail ----
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

export const autoGraph = buildAutoGraph()
