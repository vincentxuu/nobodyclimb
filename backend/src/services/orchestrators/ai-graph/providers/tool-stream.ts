// OpenAI 相容的串流 tool use 解析（Workers AI 新版模型、OpenAI、GitHub Models 共用）
//
// 2026-09-21 以 @cf/zai-org/glm-4.7-flash 實測 `stream: true` + tools：
// - 每個 chunk 是 `data: {"choices":[{"delta":{"content","reasoning_content","tool_calls"}}],"usage":{...}}`
// - tool call 以單一完整 delta 送達（id / name / arguments 一次給齊）；OpenAI 規格則允許 arguments
//   跨 chunk 分段，所以這裡一律依 index 累加
// - 會呼叫工具的輪次，模型會先吐一段前導文字（「我來幫您搜尋…」）再送 tool_calls
// - 結尾另有 `data: {"response":"","usage":{總量}}`，之後才是 `data: [DONE]`

import { ToolUseResponse } from './types'

const SUGGESTIONS_MARKER = '---SUGGESTIONS---'

/**
 * 包裝 onToken：`---SUGGESTIONS---` 標記之後的內容只收集不推送（由後端解析成建議問題）。
 * 保留標記長度的滑動視窗，避免標記被切在兩個 token 之間而漏判。
 */
export function createSuggestionsFilter(onToken: (token: string) => Promise<void>) {
  let slideBuffer = ''
  let suggestionsStarted = false
  return {
    async push(token: string) {
      if (suggestionsStarted) return
      slideBuffer += token
      const markerIdx = slideBuffer.indexOf(SUGGESTIONS_MARKER)
      if (markerIdx !== -1) {
        const beforeMarker = slideBuffer.slice(0, markerIdx)
        if (beforeMarker) await onToken(beforeMarker)
        suggestionsStarted = true
        slideBuffer = ''
        return
      }
      const safeLen = slideBuffer.length - (SUGGESTIONS_MARKER.length - 1)
      if (safeLen > 0) {
        await onToken(slideBuffer.slice(0, safeLen))
        slideBuffer = slideBuffer.slice(safeLen)
      }
    },
    async flush() {
      if (!suggestionsStarted && slideBuffer) await onToken(slideBuffer)
      slideBuffer = ''
    },
  }
}

interface PartialToolCall {
  id?: string
  name: string
  args: string
}

/** tool call 的 arguments 字串 → 物件；容忍 markdown 包裹的 JSON，解析失敗回空物件 */
function parseToolArguments(raw: string): unknown {
  if (!raw) return {}
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
  try {
    return JSON.parse(cleaned)
  } catch {
    return {}
  }
}

/**
 * 讀完一條 OpenAI 相容的 SSE 串流，邊讀邊把正文 token 推給 onToken，回傳統一的 ToolUseResponse。
 * signal 被 abort 時取消 reader 並丟出 AbortError。
 */
export async function readToolUseStream(
  stream: ReadableStream<Uint8Array>,
  opts: {
    onToken: (token: string) => Promise<void>
    signal?: AbortSignal
    /** 沒有 id 的 tool call 用這個前綴補 id */
    idPrefix?: string
  }
): Promise<ToolUseResponse> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  const filter = createSuggestionsFilter(opts.onToken)
  const partialCalls = new Map<number, PartialToolCall>()
  let content = ''
  // 推理模型的思考 delta 只收集不推送
  let reasoning = ''
  let finishReason: string | null = null
  let usage = { input: 0, output: 0 }
  let sseBuffer = ''
  let sawDone = false

  const onAbort = () => {
    reader.cancel().catch(() => {})
  }
  opts.signal?.addEventListener('abort', onAbort, { once: true })

  const handlePayload = async (payload: string) => {
    if (payload === '[DONE]') {
      sawDone = true
      return
    }
    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(payload) as Record<string, unknown>
    } catch {
      return // 忽略格式錯誤的 SSE 行
    }

    // usage：Workers AI 每個 chunk 都帶增量，結尾才是總量；OpenAI 只在最後一個 chunk 帶。取總量最大者。
    const u = parsed.usage as { prompt_tokens?: number; completion_tokens?: number } | undefined
    if (u) {
      const input = u.prompt_tokens ?? 0
      const output = u.completion_tokens ?? 0
      if (input + output > usage.input + usage.output) usage = { input, output }
    }

    const choice = (
      parsed.choices as Array<{ delta?: Record<string, unknown>; finish_reason?: string | null }>
    )?.[0]
    if (choice?.finish_reason) finishReason = choice.finish_reason
    const delta = choice?.delta

    const reasoningDelta =
      (delta?.reasoning_content as string) || (delta?.reasoning as string) || ''
    if (reasoningDelta) reasoning += reasoningDelta

    const deltaCalls = delta?.tool_calls as
      | Array<{ index?: number; id?: string; function?: { name?: string; arguments?: string } }>
      | undefined
    if (deltaCalls?.length) {
      for (const dc of deltaCalls) {
        const index = dc.index ?? 0
        const existing = partialCalls.get(index) ?? { name: '', args: '' }
        if (dc.id) existing.id = dc.id
        if (dc.function?.name) existing.name += dc.function.name
        if (dc.function?.arguments) existing.args += dc.function.arguments
        partialCalls.set(index, existing)
      }
    }

    // 舊版 Workers AI 串流格式把正文放在頂層 response
    const token = (delta?.content as string) || (parsed.response as string) || ''
    if (token) {
      content += token
      await filter.push(token)
    }
  }

  try {
    while (!sawDone) {
      const { done, value } = await reader.read()
      if (done) break
      sseBuffer += decoder.decode(value, { stream: true })
      const lines = sseBuffer.split('\n')
      sseBuffer = lines.pop() ?? ''
      for (const line of lines) {
        if (!line.startsWith('data:')) continue
        await handlePayload(line.slice(5).trim())
        if (sawDone) break
      }
    }
    await filter.flush()
  } finally {
    opts.signal?.removeEventListener('abort', onAbort)
    reader.releaseLock()
  }

  if (opts.signal?.aborted) {
    throw new DOMException('The operation was aborted', 'AbortError')
  }

  const idPrefix = opts.idPrefix ?? 'stream-tc'
  const toolCalls = [...partialCalls.entries()]
    .sort(([a], [b]) => a - b)
    .map(([index, pc]) => ({
      id: pc.id ?? `${idPrefix}-${index}`,
      name: pc.name.trim().replace(/\s+/g, '_'),
      input: parseToolArguments(pc.args),
    }))
    .filter((tc) => tc.name)

  return {
    content: content || undefined,
    ...(reasoning ? { reasoning } : {}),
    toolCalls,
    stopReason: finishReason === 'tool_calls' || toolCalls.length > 0 ? 'tool_use' : 'end_turn',
    usage,
  }
}
