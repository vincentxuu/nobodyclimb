import { createProvider } from '../../orchestrators/ai-graph/providers'
import type { ProviderName as LegacyProviderName } from '../../orchestrators/ai-graph/providers/types'
import { recommendTool } from '../tools/recommend'
import { userProfileTool } from '../tools/user-profile'
import type { ToolContext } from '../types'
import type { SubAgent, SubAgentResult } from './types'

const RECOMMEND_SYSTEM_PROMPT = `你是 NobodyClimb 的攀岩路線推薦專家。你的唯一任務是根據使用者的攀登歷史，產生個人化的路線推薦。

規則：
1. 只推薦 context 中出現的路線，絕對不可捏造
2. 路線名稱必須完整複製原文
3. 每條路線用一段式描述：「⛰ 路線名稱，難度：X，類型：Y，岩場：Z。推薦理由。」
4. 推薦理由要結合使用者的程度和偏好，不只是列出路線
5. 若使用者有攀岩性格，可以提及「這條路線很適合你的 X 風格」
6. 使用繁體中文
7. 攀登類型術語：sport=運攀、trad=傳攀、boulder=抱石、mixed=混合攀登`

export const recommendSubAgent: SubAgent = {
  name: 'recommend_agent',
  description: '個人化路線推薦 sub-agent',
  systemPrompt: RECOMMEND_SYSTEM_PROMPT,
  innerTools: ['recommend', 'user_profile'],

  async gatherContext(input: unknown, ctx: ToolContext): Promise<string> {
    const sections: string[] = []

    // 取得使用者 profile
    const profileResult = await userProfileTool.execute({}, ctx)
    const profileFormatted = userProfileTool.formatResult(profileResult)
    sections.push(`【使用者資料】\n${profileFormatted.content}`)

    // 取得推薦路線
    const recommendResult = await recommendTool.execute(input, ctx)
    const recommendFormatted = recommendTool.formatResult(recommendResult)
    sections.push(`【推薦路線】\n${recommendFormatted.content}`)

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
        { role: 'system', content: RECOMMEND_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `${context}\n\n---\n使用者問題：${query}\n\n請根據以上使用者資料和推薦路線，產生個人化的推薦回答。`,
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
