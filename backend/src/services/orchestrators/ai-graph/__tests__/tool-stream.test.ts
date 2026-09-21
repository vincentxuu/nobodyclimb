import { describe, expect, it } from 'vitest'
import { createSuggestionsFilter, readToolUseStream } from '../providers/tool-stream'

/** 把 SSE 文字切成任意大小的 chunk，模擬網路斷點落在行中間 */
function sseStream(text: string, chunkSize = 17): ReadableStream<Uint8Array> {
  const bytes = new TextEncoder().encode(text)
  let offset = 0
  return new ReadableStream({
    pull(controller) {
      if (offset >= bytes.length) return controller.close()
      controller.enqueue(bytes.slice(offset, offset + chunkSize))
      offset += chunkSize
    },
  })
}

const chunk = (delta: Record<string, unknown>, extra: Record<string, unknown> = {}) =>
  `data: ${JSON.stringify({ choices: [{ index: 0, delta, ...extra }], usage: { prompt_tokens: 0, completion_tokens: 1 } })}\n\n`

describe('readToolUseStream', () => {
  it('純文字回答：逐 token 推送並回傳 end_turn 與總 usage', async () => {
    const tokens: string[] = []
    const result = await readToolUseStream(
      sseStream(
        chunk({ role: 'assistant', content: '' }) +
          chunk({ content: '先鋒' }) +
          chunk({ content: '攀登' }) +
          chunk({ content: '' }, { finish_reason: 'stop' }) +
          // Workers AI 結尾的總量 chunk
          `data: {"response":"","usage":{"prompt_tokens":201,"completion_tokens":36}}\n\n` +
          'data: [DONE]\n\n'
      ),
      { onToken: async (t) => void tokens.push(t) }
    )
    expect(tokens.join('')).toBe('先鋒攀登')
    expect(result.content).toBe('先鋒攀登')
    expect(result.toolCalls).toEqual([])
    expect(result.stopReason).toBe('end_turn')
    expect(result.usage).toEqual({ input: 201, output: 36 })
  })

  it('Workers AI 實測格式：前導文字後接單一完整的 tool_calls delta', async () => {
    const result = await readToolUseStream(
      sseStream(
        chunk({ content: '我來幫您搜尋' }) +
          chunk({
            content: '',
            tool_calls: [
              {
                id: 'chatcmpl-tool-1',
                type: 'function',
                index: 0,
                function: { name: 'search_routes', arguments: '{"crag": "龍洞", "grade": "5.10"}' },
              },
            ],
          }) +
          chunk({ content: '' }, { finish_reason: 'tool_calls' }) +
          'data: [DONE]\n\n'
      ),
      { onToken: async () => {} }
    )
    expect(result.stopReason).toBe('tool_use')
    expect(result.toolCalls).toEqual([
      { id: 'chatcmpl-tool-1', name: 'search_routes', input: { crag: '龍洞', grade: '5.10' } },
    ])
    expect(result.content).toBe('我來幫您搜尋')
  })

  it('OpenAI 格式：arguments 跨 chunk 分段、多個 tool call 依 index 累加', async () => {
    const result = await readToolUseStream(
      sseStream(
        chunk({
          tool_calls: [{ index: 0, id: 'a', function: { name: 'weather', arguments: '{"ci' } }],
        }) +
          chunk({
            tool_calls: [{ index: 1, id: 'b', function: { name: 'crag_info', arguments: '' } }],
          }) +
          chunk({ tool_calls: [{ index: 0, function: { arguments: 'ty":"台北"}' } }] }) +
          chunk({ tool_calls: [{ index: 1, function: { arguments: '{"id":"x"}' } }] }) +
          'data: [DONE]\n\n'
      ),
      { onToken: async () => {} }
    )
    expect(result.toolCalls).toEqual([
      { id: 'a', name: 'weather', input: { city: '台北' } },
      { id: 'b', name: 'crag_info', input: { id: 'x' } },
    ])
  })

  it('缺 id 補前綴、arguments 壞掉時退回空物件、reasoning 不推送', async () => {
    const tokens: string[] = []
    const result = await readToolUseStream(
      sseStream(
        chunk({ reasoning_content: '思考中' }) +
          chunk({ tool_calls: [{ index: 0, function: { name: 'weather', arguments: '{oops' } }] }) +
          'data: not-json\n\n' +
          'data: [DONE]\n\n'
      ),
      { onToken: async (t) => void tokens.push(t), idPrefix: 'wai-tc' }
    )
    expect(tokens).toEqual([])
    expect(result.reasoning).toBe('思考中')
    expect(result.toolCalls).toEqual([{ id: 'wai-tc-0', name: 'weather', input: {} }])
  })

  it('signal abort → 丟 AbortError', async () => {
    const controller = new AbortController()
    const never = new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(new TextEncoder().encode(chunk({ content: '半' })))
      },
    })
    const pending = readToolUseStream(never, { onToken: async () => {}, signal: controller.signal })
    controller.abort()
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' })
  })
})

describe('createSuggestionsFilter', () => {
  it('標記被切在兩個 token 之間也不會外洩', async () => {
    const out: string[] = []
    const filter = createSuggestionsFilter(async (t) => void out.push(t))
    for (const t of ['答案在這裡。\n---SUGG', 'ESTIONS---\n1. 追問']) await filter.push(t)
    await filter.flush()
    expect(out.join('')).toBe('答案在這裡。\n')
  })

  it('沒有標記時 flush 補送尾端', async () => {
    const out: string[] = []
    const filter = createSuggestionsFilter(async (t) => void out.push(t))
    await filter.push('短答')
    await filter.flush()
    expect(out.join('')).toBe('短答')
  })
})
