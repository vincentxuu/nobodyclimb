import type { Tool, ToolContext } from '../types'
import { coachingSubAgent } from './coaching-agent'
import { recommendSubAgent } from './recommend-agent'
import type { SubAgent, SubAgentToolOutput } from './types'
import { formatSubAgentResult, normalizeGatheredContext } from './types'

/** 把 SubAgent 包裝成 Tool interface */
function wrapSubAgent(
  agent: SubAgent,
  toolConfig: Omit<Tool, 'execute' | 'formatResult' | 'prompt'>
): Tool {
  return {
    ...toolConfig,
    prompt(ctx: ToolContext): string {
      if (toolConfig.tags.includes('personal') && !ctx.userId) {
        return `${agent.description}。（目前用戶未登入，無法使用此工具）`
      }
      return agent.description
    },

    async execute(input: unknown, ctx: ToolContext): Promise<unknown> {
      if (toolConfig.tags.includes('personal') && !ctx.userId) {
        return { error: '用戶未登入，無法使用此工具' }
      }

      const query = ((input as Record<string, unknown>)?.query as string) ?? ''
      const gathered = normalizeGatheredContext(await agent.gatherContext(input, ctx))
      const result = await agent.synthesize(query, gathered.context, ctx)

      return {
        answer: result.answer,
        tokensUsed: result.tokensUsed,
        subAgent: agent.name,
        sources: gathered.sources,
      } satisfies SubAgentToolOutput
    },

    formatResult: formatSubAgentResult,
  }
}

/** 推薦 sub-agent tool */
export const recommendAgentTool: Tool = wrapSubAgent(recommendSubAgent, {
  name: 'recommend_agent',
  tags: ['sub-agent', 'recommendation', 'personal'],
  alwaysLoad: false,
  concurrencySafe: false,
  maxResultChars: 3000,
  cacheTTL: 300,
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: '使用者的推薦需求（如「推薦龍洞適合我的路線」）',
      },
      crag: {
        type: 'string',
        description: '（可選）限定推薦的岩場',
      },
      grade: {
        type: 'string',
        description: '（可選）限定推薦的難度',
      },
    },
    required: [],
  },
})

/** 教練 sub-agent tool */
export const coachingAgentTool: Tool = wrapSubAgent(coachingSubAgent, {
  name: 'coaching_agent',
  tags: ['sub-agent', 'coaching', 'personal'],
  alwaysLoad: false,
  concurrencySafe: true,
  maxResultChars: 3000,
  cacheTTL: 300,
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: '使用者的訓練問題（如「怎麼提升指力」「如何從 5.11 進步到 5.12」）',
      },
      focus: {
        type: 'string',
        description: '（可選）訓練重點，如「指力」「耐力」「腳法」「核心」',
      },
    },
    required: [],
  },
})

export const SUB_AGENT_TOOLS: Tool[] = [recommendAgentTool, coachingAgentTool]
