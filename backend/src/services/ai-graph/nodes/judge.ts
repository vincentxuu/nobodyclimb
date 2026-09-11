import { endSpan, startSpan } from '../../../utils/langfuse'
import { judgeAnswer } from '../../tools/judge-answer'
import { GraphState } from '../state'

export async function judgeNode(state: GraphState): Promise<Partial<GraphState>> {
  const span = startSpan(state.langfuseTrace ?? null, 'judge', {
    queryType: state.queryType,
    streamingMode: state.streamingMode,
  })

  try {
    if (state.streamingMode) {
      endSpan(span, { output: { skipped: true, reason: 'streaming_mode' } })
      return {}
    }

    const ERROR_ANSWERS = new Set([
      '抱歉，AI 回答生成超時，請稍後再試。',
      '抱歉，AI 服務暫時發生問題，請稍後再試。',
      '抱歉，無法生成回答，請稍後再試。',
      '抱歉，目前無法生成回答，請換個方式提問或稍後再試。',
    ])
    if (state.degradedStages?.includes('llm-generation') || ERROR_ANSWERS.has(state.answer ?? '')) {
      endSpan(span, { output: { skipped: true, reason: 'generation_failed_or_timeout' } })
      return {
        trace: { judge_detail: { skipped: true, reason: 'generation_failed_or_timeout' } },
      }
    }

    const { pipelineConfig, prompts } = state

    const result = await judgeAnswer(
      { runJudge: state.queryService.runJudge.bind(state.queryService) },
      {
        query: state.request.query,
        context: state.context ?? '',
        answer: state.answer ?? '',
        parsedAnswer: state.parsedAnswer ?? '',
        cannotAnswer: state.cannotAnswer,
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

    const newTokenBreakdown = { ...state.tokenBreakdown }
    if (result.usage) {
      newTokenBreakdown.judge = {
        ...result.usage,
        model: pipelineConfig.lightweight_model,
        estimated: false,
      }
    }

    endSpan(span, {
      output: { groundedness: result.groundedness, quality: result.quality },
    })

    return {
      groundedness: result.groundedness,
      quality: result.quality,
      answer: result.answer,
      tokenBreakdown: newTokenBreakdown,
      trace: result.trace,
    }
  } catch (err) {
    endSpan(span, { level: 'ERROR', metadata: { error: String(err) } })
    return {
      degradedStages: ['judge'],
      trace: { judge_detail: { skipped: true, reason: 'timeout_or_error', error: String(err) } },
    }
  }
}
