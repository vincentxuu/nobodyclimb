import { createProvider } from '../../orchestrators/ai-graph/providers'
import type { ProviderName as LegacyProviderName } from '../../orchestrators/ai-graph/providers/types'
import { suggestTrainingTool } from '../tools/coaching'
import { userProfileTool } from '../tools/user-profile'
import type { ToolContext } from '../types'
import type { SubAgent, SubAgentResult } from './types'
import { analyzeWeaknesses } from './weakness-analysis'

const COACHING_SYSTEM_PROMPT = `你是 NobodyClimb 的攀岩教練。你的任務是根據使用者的數據，進行系統化分析並提供訓練建議。

分析框架：
1. 【現況評估】根據攀登歷史數據，總結目前程度和攀登模式
2. 【弱點識別】基於分析結果指出 1-2 個關鍵弱點
3. 【目標對齊】如果使用者有設定目標，說明弱點如何影響目標達成
4. 【訓練計畫】針對弱點設計 2-3 週的漸進式訓練，每項要具體（頻率、強度、組數）
5. 【下一步行動】本週就能開始做的 1 件事

規則：
1. 分析基於 context 中的真實數據，不可捏造
2. 訓練建議要具體（如「每週 2 次指板訓練，7:3 秒掛休比，3 組」）
3. 根據程度調整強度（入門者不建議指板）
4. 最多 3-4 條核心建議
5. 使用繁體中文
6. 可引用使用者近期完攀的路線作為依據`

export const coachingSubAgent: SubAgent = {
  name: 'coaching_agent',
  description: '攀岩教練訓練建議 sub-agent',
  systemPrompt: COACHING_SYSTEM_PROMPT,
  innerTools: ['suggest_training', 'user_profile'],

  async gatherContext(input: unknown, ctx: ToolContext): Promise<string> {
    const sections: string[] = []

    const profileResult = await userProfileTool.execute({}, ctx)
    const profileFormatted = userProfileTool.formatResult(profileResult)
    sections.push(`【使用者資料】\n${profileFormatted.content}`)

    const trainingResult = await suggestTrainingTool.execute(input, ctx)
    const trainingFormatted = suggestTrainingTool.formatResult(trainingResult)
    sections.push(`【訓練分析】\n${trainingFormatted.content}`)

    const weaknesses = analyzeWeaknesses(trainingResult)
    sections.push(`【弱點分析】\n${weaknesses}`)

    try {
      const goals = await ctx.env.DB.prepare(
        "SELECT title, target, current_progress, status FROM user_goals WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 3"
      )
        .bind(ctx.userId)
        .all<{ title: string; target: string; current_progress: string | null; status: string }>()
      if (goals.results?.length) {
        const goalLines = goals.results.map(
          (g) =>
            `- ${g.title}：目標 ${g.target}${g.current_progress ? `，目前進度 ${g.current_progress}` : ''}`
        )
        sections.push(`【使用者目標】\n${goalLines.join('\n')}`)
      }
    } catch {
      // user_goals 表可能尚未建立
    }

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
          content: `${context}\n\n---\n使用者問題：${query}\n\n請按照分析框架（現況評估 → 弱點識別 → 目標對齊 → 訓練計畫 → 下一步行動）回答。`,
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
