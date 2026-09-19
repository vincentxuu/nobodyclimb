import type { Env } from '../../types'
import type { LangfuseParent } from '../../utils/langfuse'
import { endSpan, startSpan } from '../../utils/langfuse'
import { runJudge } from '../core/llm'
import type { ModelMap } from './types'

// ---------------------------------------------------------------------------
// Async LLM Judge（post-response，非同步，不擋回應）
// ---------------------------------------------------------------------------

export async function runAsyncJudge(
  env: Env,
  query: string,
  context: string,
  answer: string,
  models: ModelMap,
  langfuseParent?: LangfuseParent | null
): Promise<{
  groundedness: number | null
  quality: number | null
}> {
  const judgeSpan = startSpan(langfuseParent ?? null, 'judge')
  try {
    const result = await runJudge(
      env,
      query,
      context,
      answer,
      {
        model: models.judge.model,
        timeoutMs: 10000,
      },
      judgeSpan
    )
    endSpan(judgeSpan, {
      output: { groundedness: result.groundedness, quality: result.quality },
      metadata: { provider: models.judge.provider, model: models.judge.model },
    })
    return {
      groundedness: result.groundedness,
      quality: result.quality,
    }
  } catch (err) {
    endSpan(judgeSpan, { output: { error: String(err) }, level: 'WARNING' })
    return { groundedness: null, quality: null }
  }
}
