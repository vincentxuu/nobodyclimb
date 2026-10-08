import { AIChatError, createErrorFromResponse, getAIErrorMessage } from '../errors'
import { type AIStreamEvent, createSSEParser, parseSSELine, reduceStreamText } from '../sse'
import { getToolLabel, upsertToolProgress } from '../toolProgress'

describe('parseSSELine', () => {
  it('解析 token 事件', () => {
    expect(parseSSELine('data: {"type":"token","token":"龍洞"}')).toEqual({
      type: 'token',
      token: '龍洞',
    })
  })

  it('保留 token 內的空白與換行', () => {
    expect(parseSSELine('data: {"type":"token","token":" \\n"}')).toEqual({
      type: 'token',
      token: ' \n',
    })
  })

  it('解析 token_reset 事件', () => {
    expect(parseSSELine('data: {"type":"token_reset"}')).toEqual({ type: 'token_reset' })
  })

  it('忽略 heartbeat comment、空行與非 data 行', () => {
    expect(parseSSELine(': heartbeat')).toBeNull()
    expect(parseSSELine(':')).toBeNull()
    expect(parseSSELine('')).toBeNull()
    expect(parseSSELine('event: message')).toBeNull()
    expect(parseSSELine('data: ')).toBeNull()
  })

  it('壞 JSON 與非物件 payload 回 null，不丟例外', () => {
    expect(parseSSELine('data: {"type":"token","tok')).toBeNull()
    expect(parseSSELine('data: not-json')).toBeNull()
    expect(parseSSELine('data: "string"')).toBeNull()
    expect(parseSSELine('data: [1,2]')).toBeNull()
    expect(parseSSELine('data: null')).toBeNull()
  })

  it('未知事件或欄位型別不符回 null', () => {
    expect(parseSSELine('data: {"type":"unknown"}')).toBeNull()
    expect(parseSSELine('data: {"type":"token"}')).toBeNull()
    expect(parseSSELine('data: {"type":"progress","tool":"weather","status":"pending"}')).toBeNull()
  })

  it('處理 CRLF 行尾與 data: 後無空白', () => {
    expect(parseSSELine('data:{"type":"token","token":"a"}\r')).toEqual({
      type: 'token',
      token: 'a',
    })
  })

  it('解析 progress 事件，缺 id 時退回 tool 名', () => {
    expect(
      parseSSELine(
        'data: {"type":"progress","id":"call_1","tool":"search_routes","status":"done","is_error":false,"duration_ms":120}'
      )
    ).toMatchObject({
      type: 'progress',
      id: 'call_1',
      tool: 'search_routes',
      status: 'done',
      is_error: false,
      duration_ms: 120,
    })

    expect(
      parseSSELine('data: {"type":"progress","tool":"weather","status":"executing"}')
    ).toMatchObject({ id: 'weather', status: 'executing' })
  })

  it('解析 done 事件並補齊缺漏的陣列欄位', () => {
    expect(parseSSELine('data: {"type":"done","query_id":"q1","answer":"最終版"}')).toEqual({
      type: 'done',
      query_id: 'q1',
      answer: '最終版',
      sources: [],
      suggested_questions: [],
      quota_remaining: undefined,
    })
  })

  it('解析 error 事件，缺 code 時視為 internal', () => {
    expect(parseSSELine('data: {"type":"error","code":"timeout","message":"逾時"}')).toEqual({
      type: 'error',
      code: 'timeout',
      message: '逾時',
    })
    expect(parseSSELine('data: {"type":"error"}')).toMatchObject({ code: 'internal' })
  })
})

describe('createSSEParser', () => {
  it('一個 chunk 內含多行', () => {
    const parser = createSSEParser()
    const events = parser.push(
      'data: {"type":"token","token":"a"}\n\ndata: {"type":"token","token":"b"}\n\n'
    )
    expect(events).toEqual([
      { type: 'token', token: 'a' },
      { type: 'token', token: 'b' },
    ])
  })

  it('一行被切在兩個 chunk 之間時，湊齊後才送出', () => {
    const parser = createSSEParser()
    expect(parser.push('data: {"type":"tok')).toEqual([])
    expect(parser.push('en","token":"龍')).toEqual([])
    expect(parser.push('洞"}\n')).toEqual([{ type: 'token', token: '龍洞' }])
  })

  it('斷點剛好落在換行前後', () => {
    const parser = createSSEParser()
    expect(parser.push('data: {"type":"token","token":"a"}')).toEqual([])
    expect(parser.push('\n')).toEqual([{ type: 'token', token: 'a' }])
    expect(parser.push('\ndata: {"type":"token","token":"b"}\n')).toEqual([
      { type: 'token', token: 'b' },
    ])
  })

  it('heartbeat 與壞 JSON 夾在中間不影響其他事件', () => {
    const parser = createSSEParser()
    const events = parser.push(
      [
        ': heartbeat',
        'data: {"type":"token","token":"a"}',
        'data: {broken',
        ': heartbeat',
        'data: {"type":"token","token":"b"}',
        '',
      ].join('\n')
    )
    expect(events).toEqual([
      { type: 'token', token: 'a' },
      { type: 'token', token: 'b' },
    ])
  })

  it('flush 處理沒有換行結尾的最後一行，且只送一次', () => {
    const parser = createSSEParser()
    expect(parser.push('data: {"type":"done","answer":"ok"}')).toEqual([])
    expect(parser.flush()).toMatchObject([{ type: 'done', answer: 'ok' }])
    expect(parser.flush()).toEqual([])
  })

  it('flush 遇到不完整的殘留不丟例外', () => {
    const parser = createSSEParser()
    parser.push('data: {"type":"tok')
    expect(parser.flush()).toEqual([])
  })
})

describe('token_reset', () => {
  it('token → token_reset → token → done 後只剩 reset 之後的文字，工具進度事件不受影響', () => {
    const parser = createSSEParser()
    const events: AIStreamEvent[] = [
      ...parser.push(
        'data: {"type":"token","token":"我來幫您"}\ndata: {"type":"token","token":"搜尋…"}\n'
      ),
      ...parser.push('data: {"type":"token_reset"}\n'),
      ...parser.push(
        'data: {"type":"progress","id":"c1","tool":"search_routes","status":"executing"}\n'
      ),
      ...parser.push(
        'data: {"type":"token","token":"龍洞"}\ndata: {"type":"token","token":"推薦"}\n'
      ),
      ...parser.push('data: {"type":"done","sources":[],"suggested_questions":[]}\n'),
    ]

    expect(events.map((event) => event.type)).toEqual([
      'token',
      'token',
      'token_reset',
      'progress',
      'token',
      'token',
      'done',
    ])
    expect(events.reduce(reduceStreamText, '')).toBe('龍洞推薦')
  })

  it('reset 後沒有新 token 時內容為空字串', () => {
    const events: AIStreamEvent[] = [{ type: 'token', token: '前導' }, { type: 'token_reset' }]
    expect(events.reduce(reduceStreamText, '')).toBe('')
  })
})

describe('upsertToolProgress', () => {
  it('同一 id 合併為一筆並保留首次出現順序', () => {
    let list = upsertToolProgress([], {
      type: 'progress',
      id: 'a',
      tool: 'search_routes',
      status: 'executing',
    })
    list = upsertToolProgress(list, {
      type: 'progress',
      id: 'b',
      tool: 'search_routes',
      status: 'executing',
    })
    list = upsertToolProgress(list, {
      type: 'progress',
      id: 'a',
      tool: 'search_routes',
      status: 'done',
      is_error: true,
    })

    expect(list).toEqual([
      { id: 'a', tool: 'search_routes', status: 'done', isError: true },
      { id: 'b', tool: 'search_routes', status: 'executing', isError: false },
    ])
  })

  it('未知工具名稱原樣顯示', () => {
    expect(getToolLabel('weather')).toBe('查詢天氣')
    expect(getToolLabel('brand_new_tool')).toBe('brand_new_tool')
  })
})

describe('AI 錯誤訊息', () => {
  it('429 帶配額資訊', () => {
    const error = createErrorFromResponse(429, {
      success: false,
      error: 'quota_exceeded',
      message: 'quota',
      data: { tier: 'v1', tier_display: '新手', daily_limit: 5, daily_used: 5, resets_at: 'x' },
    })
    expect(error.code).toBe('quota_exceeded')
    expect(error.status).toBe(429)
    expect(getAIErrorMessage(error)).toContain('5/5')
  })

  it('輸入被擋下時優先顯示後端 message', () => {
    const error = createErrorFromResponse(400, { error: 'InvalidInput', message: '內容不當' })
    expect(getAIErrorMessage(error)).toBe('內容不當')
  })

  it('非 JSON 錯誤回應與未知錯誤使用預設文案', () => {
    expect(createErrorFromResponse(502, null).code).toBe('internal')
    expect(getAIErrorMessage(new Error('boom'))).toBe(
      getAIErrorMessage(new AIChatError('internal'))
    )
  })
})
