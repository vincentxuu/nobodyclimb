import { endSpan, startSpan } from '../../../../utils/langfuse'
import { GraphState } from '../state'

const COMPRESS_PROMPT = `你是資訊壓縮助手。以下是多個搜尋來源的合併結果，請提取與使用者問題最相關的關鍵資訊，去除重複和無關內容。

使用者問題：{query}

搜尋結果：
{context}

請輸出精簡後的關鍵資訊，保留：
- 直接回答問題的事實
- 重要的數據和細節
- 來源標注（岩場名、路線名）

去除：
- 重複的內容
- 與問題無關的背景資訊
- 冗餘的修飾語

直接輸出壓縮後的文字，不要加標題或解釋。`

export async function contextCompressionNode(state: GraphState): Promise<Partial<GraphState>> {
  const context = state.context ?? ''

  // 短 context 不需要壓縮
  if (context.length < 2000) return {}

  const span = startSpan(state.langfuseTrace ?? null, 'context-compression', {
    originalLength: context.length,
  })

  try {
    const { pipelineConfig } = state
    const llmProvider = state.llmProvider
    if (!llmProvider) {
      endSpan(span, { output: { skipped: true, reason: 'no_llm_provider' } })
      return {}
    }

    const prompt = COMPRESS_PROMPT
      .replace('{query}', state.request.query)
      .replace('{context}', context.slice(0, 8000))

    const result = await llmProvider.chat(
      [{ role: 'user', content: prompt }],
      {
        model: pipelineConfig.lightweight_model,
        maxTokens: 2000,
        gatewayOptions: state.gatewayOptions,
      }
    )

    const compressed = result.content?.trim()
    if (!compressed || compressed.length >= context.length) {
      endSpan(span, { output: { skipped: true, reason: 'no_improvement' } })
      return {}
    }

    const newTokenBreakdown = { ...state.tokenBreakdown }
    if (result.usage) {
      newTokenBreakdown.context_compression = {
        ...result.usage,
        model: pipelineConfig.lightweight_model,
        estimated: false,
      }
    }

    endSpan(span, {
      output: {
        originalLength: context.length,
        compressedLength: compressed.length,
        ratio: Math.round((compressed.length / context.length) * 100),
      },
    })

    return {
      context: compressed,
      tokenBreakdown: newTokenBreakdown,
      trace: {
        context_compression: {
          original_length: context.length,
          compressed_length: compressed.length,
          ratio: Math.round((compressed.length / context.length) * 100),
        },
      },
    }
  } catch (err) {
    endSpan(span, { level: 'ERROR', metadata: { error: String(err) } })
    return {}
  }
}
