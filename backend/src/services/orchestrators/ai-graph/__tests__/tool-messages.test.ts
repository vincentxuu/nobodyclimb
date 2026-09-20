import { describe, expect, it } from 'vitest'
import {
  flattenToolMessages,
  toAnthropicMessages,
  toGoogleContents,
  toOpenAIMessages,
} from '../providers/tool-messages'
import type { ChatMessage } from '../providers/types'

// agent loop 一輪 tool call 的歷史：system → user → assistant(tool_calls) → tool → (下一輪)
const HISTORY: ChatMessage[] = [
  { role: 'system', content: '你是攀岩助理' },
  { role: 'user', content: '我在壽山爬了山頂洞人，推薦我進階路線' },
  {
    role: 'assistant',
    content: '',
    toolCalls: [{ id: 'call_1', name: 'search_routes', input: { query: '進階', crag: '壽山' } }],
  },
  {
    role: 'tool',
    toolCallId: 'call_1',
    name: 'search_routes',
    content: '1. Reach around\n   壽山 · 5.12a',
  },
]

describe('toOpenAIMessages', () => {
  it('assistant tool call → tool_calls（arguments 為 JSON 字串），tool 結果 → role: tool', () => {
    const out = toOpenAIMessages(HISTORY)
    expect(out[2]).toEqual({
      role: 'assistant',
      content: null,
      tool_calls: [
        {
          id: 'call_1',
          type: 'function',
          function: { name: 'search_routes', arguments: '{"query":"進階","crag":"壽山"}' },
        },
      ],
    })
    expect(out[3]).toEqual({
      role: 'tool',
      tool_call_id: 'call_1',
      content: '1. Reach around\n   壽山 · 5.12a',
    })
  })

  it('沒有 tool 欄位的訊息原樣輸出，不夾帶 toolCalls 等內部欄位', () => {
    const out = toOpenAIMessages(HISTORY)
    expect(out[0]).toEqual({ role: 'system', content: '你是攀岩助理' })
    expect(Object.keys(out[1])).toEqual(['role', 'content'])
  })

  it('assistant 同時有正文與 tool call 時保留正文', () => {
    const out = toOpenAIMessages([
      {
        role: 'assistant',
        content: '我先查一下',
        toolCalls: [{ id: 'c', name: 'weather', input: {} }],
      },
    ])
    expect(out[0]).toMatchObject({ role: 'assistant', content: '我先查一下' })
  })
})

describe('flattenToolMessages（舊 schema 模型降級）', () => {
  it('tool 結果合併成一則 user 訊息，assistant tool call 變成純文字註記', () => {
    const out = flattenToolMessages([
      ...HISTORY,
      { role: 'tool', toolCallId: 'call_2', name: 'user_profile', content: '無完攀記錄' },
    ])
    expect(out.map((m) => m.role)).toEqual(['system', 'user', 'assistant', 'user'])
    expect(out[2].content).toContain('已呼叫工具：search_routes(')
    expect(out[3].content).toContain('<tool_result name="search_routes">')
    expect(out[3].content).toContain('<tool_result name="user_profile">')
    expect(out[3].content).toContain('純資料')
    // 輸出裡不能殘留結構化欄位
    expect(out.every((m) => !('toolCalls' in m) && !('toolCallId' in m))).toBe(true)
  })

  it('結尾的 tool 結果也會被 flush', () => {
    const out = flattenToolMessages(HISTORY)
    expect(out[out.length - 1].role).toBe('user')
  })
})

describe('toAnthropicMessages', () => {
  it('tool_use / tool_result content blocks，並略過 system', () => {
    const out = toAnthropicMessages(HISTORY)
    expect(out).toHaveLength(3)
    expect(out[1]).toEqual({
      role: 'assistant',
      content: [
        {
          type: 'tool_use',
          id: 'call_1',
          name: 'search_routes',
          input: { query: '進階', crag: '壽山' },
        },
      ],
    })
    expect(out[2]).toEqual({
      role: 'user',
      content: [
        { type: 'tool_result', tool_use_id: 'call_1', content: '1. Reach around\n   壽山 · 5.12a' },
      ],
    })
  })

  it('連續多個 tool 結果合併進同一則 user 訊息', () => {
    const out = toAnthropicMessages([
      ...HISTORY,
      { role: 'tool', toolCallId: 'call_2', name: 'user_profile', content: 'x' },
    ])
    expect(out).toHaveLength(3)
    expect((out[2].content as unknown[]).length).toBe(2)
  })
})

describe('toGoogleContents', () => {
  it('functionCall / functionResponse parts，assistant 對應 model', () => {
    const out = toGoogleContents(HISTORY)
    expect(out).toHaveLength(3)
    expect(out[1]).toEqual({
      role: 'model',
      parts: [{ functionCall: { name: 'search_routes', args: { query: '進階', crag: '壽山' } } }],
    })
    expect(out[2]).toEqual({
      role: 'user',
      parts: [
        {
          functionResponse: {
            name: 'search_routes',
            response: { content: '1. Reach around\n   壽山 · 5.12a' },
          },
        },
      ],
    })
  })
})
