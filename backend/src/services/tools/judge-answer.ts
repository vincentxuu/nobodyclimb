/**
 * judge-answer 共用工具
 *
 * 評估 LLM 回答的 groundedness 和 quality，注入免責聲明，
 * 並執行輸出層防護（長度截斷 + system prompt leakage 偵測）。
 */

import { checkOutput, type GuardrailsOutputTrace } from '../../utils/guardrails'

// ---------------------------------------------------------------------------
// Input / Output
// ---------------------------------------------------------------------------

export interface JudgeAnswerDeps {
  runJudge: (
    query: string,
    context: string,
    answer: string,
    opts: {
      model: string
      timeoutMs: number
      contextTruncate: number
      promptTemplate: string
    }
  ) => Promise<{
    groundedness: number | null
    quality: number | null
    constraint_ok: boolean
    rawResponse: string | null
    contextChars: number
    contextTruncated: boolean
    usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number }
  }>
}

export interface JudgeAnswerInput {
  query: string
  context: string
  answer: string
  parsedAnswer: string
  cannotAnswer?: boolean
  config: {
    lightweight_model: string
    judge_timeout_ms: number
    judge_context_truncate: number
    groundedness_disclaimer_low: number
    groundedness_disclaimer_mid: number
    max_output_length: number
    system_prompt_leakage_patterns: string[]
  }
  judgePromptTemplate: string
}

export interface JudgeAnswerOutput {
  groundedness: number | null
  quality: number | null
  answer: string
  trace: {
    judge_detail: Record<string, unknown>
    guardrails_output: GuardrailsOutputTrace
  }
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number }
}

// ---------------------------------------------------------------------------
// 主函式
// ---------------------------------------------------------------------------

export async function judgeAnswer(
  deps: JudgeAnswerDeps,
  input: JudgeAnswerInput
): Promise<JudgeAnswerOutput> {
  const { query, context, answer, parsedAnswer, cannotAnswer, config } = input

  const judgeResult = await deps.runJudge(query, context, parsedAnswer, {
    model: config.lightweight_model,
    timeoutMs: config.judge_timeout_ms,
    contextTruncate: config.judge_context_truncate,
    promptTemplate: input.judgePromptTemplate,
  })

  // constraint_ok = false 時強制 quality = 1
  const constraintOk = judgeResult.constraint_ok
  const groundedness = judgeResult.groundedness
  const quality = !constraintOk && judgeResult.quality !== null ? 1 : judgeResult.quality

  const judgeDetail = {
    criteria: ['groundedness', 'quality', 'constraint_ok'],
    raw_scores: { groundedness, quality, constraint_ok: constraintOk },
    constraint_ok: constraintOk,
    raw_llm_response: judgeResult.rawResponse,
    context_chars: judgeResult.contextChars,
    context_truncated: judgeResult.contextTruncated,
    response_chars: parsedAnswer.length,
  }

  // 免責聲明注入（groundedness 分數）
  let finalAnswer = answer
  if (groundedness !== null && !cannotAnswer) {
    if (groundedness < config.groundedness_disclaimer_low) {
      finalAnswer = `❓ 以下資訊基於現有資料推斷，建議實地確認\n\n${finalAnswer}`
    } else if (groundedness < config.groundedness_disclaimer_mid) {
      finalAnswer = `⚠️ 部分資訊來自推斷，建議實地確認\n\n${finalAnswer}`
    }
  }

  // 輸出層防護
  const { output: filteredAnswer, trace: outputTrace } = checkOutput(
    finalAnswer,
    config.max_output_length,
    config.system_prompt_leakage_patterns
  )

  return {
    groundedness,
    quality,
    answer: filteredAnswer,
    trace: { judge_detail: judgeDetail, guardrails_output: outputTrace },
    usage: judgeResult.usage,
  }
}
