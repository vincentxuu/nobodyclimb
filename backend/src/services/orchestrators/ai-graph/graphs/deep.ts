import { END, Send, START, StateGraph } from '@langchain/langgraph'
import { contextCompressionNode } from '../nodes/context-compression'
import { executePlanStepNode } from '../nodes/execute-plan-step'
import { judgeNode } from '../nodes/judge'
import { llmGenerationNode } from '../nodes/llm-generation'
import { memoryExtractorNode } from '../nodes/memory-extractor'
import { planningNode } from '../nodes/planning'
import { semanticCacheNode } from '../nodes/semantic-cache'
import { synthesisNode } from '../nodes/synthesis'
import { textNormalizeNode } from '../nodes/text-normalize'
import { toolSelectionNode } from '../nodes/tool-selection'
import { routeAfterSemanticCache, routeAfterToolSelection } from '../routing'
import { GraphState, GraphStateAnnotation } from '../state'

type PlanStep = { id: number; query: string; tool: string; filters: Record<string, unknown> }

function dispatchPlanSteps(state: GraphState): Send[] | string {
  const planSteps = (state.multiToolPlan?.steps ?? []) as unknown as PlanStep[]
  if (planSteps.length === 0) return 'synthesis'
  return planSteps.map((step) => new Send('executePlanStep', { ...state, currentPlanStep: step }))
}

/**
 * Deep graph — 子問題分解→並行執行→合成模式（6-12s，N+2 次 LLM 呼叫）
 *
 * 適合跨實體比較、行程規劃等需要拆解的問題。
 * 與 plan-execute 的差異：加入 toolSelection 路由 + contextCompression + judge。
 */
export function buildDeepGraph() {
  const graph = new StateGraph(GraphStateAnnotation)
    .addNode('semanticCache', semanticCacheNode)
    .addNode('textNormalize', textNormalizeNode)
    .addNode('toolSelection', toolSelectionNode)
    .addNode('planning', planningNode)
    .addNode('executePlanStep', executePlanStepNode)
    .addNode('synthesis', synthesisNode)
    .addNode('contextCompression', contextCompressionNode)
    .addNode('llmGeneration', llmGenerationNode)
    .addNode('judge', judgeNode)
    .addNode('memoryExtractor', memoryExtractorNode)

  graph.addEdge(START, 'semanticCache')
  graph.addConditionalEdges('semanticCache', routeAfterSemanticCache, {
    END,
    toolSelection: 'textNormalize',
  })
  graph.addEdge('textNormalize', 'toolSelection')

  // Deep: toolSelection 後大部分走 planning，但保留 SQL/GK 的快速路徑
  graph.addConditionalEdges('toolSelection', routeAfterToolSelection, {
    textToSql: 'planning', // Deep: SQL 也走 planning 拆解
    multiSourceRetrieval: 'planning',
    filterBuild: 'planning',
    llmGeneration: 'llmGeneration',
    END,
  })

  graph.addConditionalEdges('planning', dispatchPlanSteps, ['executePlanStep', 'synthesis'])
  graph.addEdge('executePlanStep', 'synthesis')
  graph.addEdge('synthesis', 'contextCompression')
  graph.addEdge('contextCompression', 'llmGeneration')
  graph.addEdge('llmGeneration', 'judge')
  graph.addEdge('judge', 'memoryExtractor')
  graph.addEdge('memoryExtractor', END)

  return graph.compile()
}

export const deepGraph = buildDeepGraph()
