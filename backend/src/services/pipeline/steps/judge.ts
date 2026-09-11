import { judgeAnswer } from '../../tools/judge-answer'
import { PipelineContext, PipelineStep } from '../types'

export const judgeStep: PipelineStep = {
  id: 'judge',
  name: 'Judge 品質評估',
  description: '評估回答的 groundedness 和 quality，注入免責聲明',
  phase: 'evaluation',
  defaultEnabled: true,
  defaultOrder: 12,
  requires: ['answer'],
  provides: ['groundedness', 'quality'],
  skipWhen: [
    {
      field: 'queryType',
      operator: 'in',
      value: ['general-knowledge', 'sql', 'clarification-needed'],
    },
  ],

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    const { pipelineConfig, prompts, trace } = ctx

    if (ctx.streamingMode) return ctx

    const ERROR_ANSWERS = new Set([
      '抱歉，AI 回答生成超時，請稍後再試。',
      '抱歉，AI 服務暫時發生問題，請稍後再試。',
      '抱歉，無法生成回答，請稍後再試。',
      '抱歉，目前無法生成回答，請換個方式提問或稍後再試。',
    ])
    if (ctx.degradedStages?.includes('llm-generation') || ERROR_ANSWERS.has(ctx.answer ?? '')) {
      trace.judge_detail = { skipped: true, reason: 'generation_failed_or_timeout' }
      return ctx
    }

    const result = await judgeAnswer(
      { runJudge: ctx.queryService.runJudge.bind(ctx.queryService) },
      {
        query: ctx.request.query,
        context: ctx.context ?? '',
        answer: ctx.answer ?? '',
        parsedAnswer: ctx.parsedAnswer ?? '',
        cannotAnswer: ctx.cannotAnswer,
        config: {
          lightweight_model: pipelineConfig.lightweight_model,
          judge_timeout_ms: pipelineConfig.judge_timeout_ms,
          judge_context_truncate: pipelineConfig.judge_context_truncate,
          groundedness_disclaimer_low: pipelineConfig.groundedness_disclaimer_low,
          groundedness_disclaimer_mid: pipelineConfig.groundedness_disclaimer_mid,
          max_output_length: pipelineConfig.max_output_length,
          system_prompt_leakage_patterns: pipelineConfig.system_prompt_leakage_patterns,
        },
        judgePromptTemplate: prompts['JUDGE_PROMPT'],
      }
    )

    ctx.groundedness = result.groundedness
    ctx.quality = result.quality
    ctx.answer = result.answer
    if (result.usage) {
      ctx.tokenBreakdown.judge = {
        ...result.usage,
        model: pipelineConfig.lightweight_model,
        estimated: false,
      }
    }
    trace.judge_detail = result.trace.judge_detail
    trace.guardrails_output = result.trace.guardrails_output

    return ctx
  },
}
