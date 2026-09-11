import { createProvider } from '../../orchestrators/ai-graph/providers'
import type { ProviderName as LegacyProviderName } from '../../orchestrators/ai-graph/providers/types'
import { suggestTrainingTool } from '../tools/coaching'
import { userProfileTool } from '../tools/user-profile'
import type { ToolContext } from '../types'
import type { SubAgent, SubAgentResult } from './types'

const COACHING_SYSTEM_PROMPT = `你是 NobodyClimb 的攀岩教練。你的任務是根據使用者的攀登歷史和能力分析，提供針對性的訓練建議。

規則：
1. 分析要基於 context 中的真實數據（難度分佈、類型偏好、風格），不可捏造
2. 訓練建議要具體可執行（例如「每週 2 次指板訓練，從 10 秒懸掛開始」），不要只講概念
3. 根據使用者程度調整建議強度
4. 如果使用者指定了訓練重點（如「指力」），聚焦在該方向
5. 最多給 3-4 條核心建議，不要資訊過載
6. 使用繁體中文
7. 可以提及使用者近期完攀的路線作為分析依據`

export const coachingSubAgent: SubAgent = {
  name: 'coaching_agent',
  description: '攀岩教練訓練建議 sub-agent',
  systemPrompt: COACHING_SYSTEM_PROMPT,
  innerTools: ['suggest_training', 'user_profile'],

  async gatherContext(input: unknown, ctx: ToolContext): Promise<string> {
    const sections: string[] = []

    // 取得使用者 profile
    const profileResult = await userProfileTool.execute({}, ctx)
    const profileFormatted = userProfileTool.formatResult(profileResult)
    sections.push(`【使用者資料】\n${profileFormatted.content}`)

    // 取得訓練分析
    const trainingResult = await suggestTrainingTool.execute(input, ctx)
    const trainingFormatted = suggestTrainingTool.formatResult(trainingResult)
    sections.push(`【訓練分析】\n${trainingFormatted.content}`)

    return sections.join('\n\n')
  },

  async synthesize(query: string, context: string, ctx: ToolContext): Promise<SubAgentResult> {
    const provider = createProvider(
      (ctx.models.orchestrator.provider === 'workers-ai'
        ? 'cloudflare'
        : ctx.models.orchestrator.provider) as LegacyProviderName,
      ctx.env
    )

    const response = await provider.chat(
      [
        { role: 'system', content: COACHING_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `${context}\n\n---\n使用者問題：${query}\n\n請根據以上分析，提供針對性的訓練建議。`,
        },
      ],
      {
        model: ctx.models.orchestrator.model,
        maxTokens: ctx.models.orchestrator.maxTokens ?? 1024,
        temperature: 0.3,
      }
    )

    const tokensUsed =
      (response.usage?.prompt_tokens ?? 0) + (response.usage?.completion_tokens ?? 0)
    ctx.tracker.record(
      ctx.models.orchestrator.provider,
      ctx.models.orchestrator.model,
      response.usage?.prompt_tokens ?? 0,
      response.usage?.completion_tokens ?? 0
    )

    return { answer: response.content, tokensUsed }
  },
}
