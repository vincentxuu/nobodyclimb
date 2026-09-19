import { getToolSummary, mergeToolProgress, upsertToolProgress } from '@/lib/chat/tool-progress'

describe('mergeToolProgress', () => {
  it('同名 tool 並行時以 id 各自獨立保留', () => {
    const merged = mergeToolProgress([
      { id: 'call-1', tool: 'search_routes', status: 'executing', input: { query: '龍洞' } },
      { id: 'call-2', tool: 'search_routes', status: 'executing', input: { query: '墾丁' } },
      { id: 'call-1', tool: 'search_routes', status: 'done' },
    ])
    expect(merged).toHaveLength(2)
    expect(merged[0]).toMatchObject({ id: 'call-1', status: 'done' })
    expect(merged[1]).toMatchObject({ id: 'call-2', status: 'executing' })
  })

  it('done 事件保留 executing 帶來的 input，並附上 output', () => {
    const merged = mergeToolProgress([
      { id: 'call-1', tool: 'weather', status: 'executing', input: { crag: '龍洞' } },
      { id: 'call-1', tool: 'weather', status: 'done', output: '晴 28°C', duration_ms: 320 },
    ])
    expect(merged[0].input).toEqual({ crag: '龍洞' })
    expect(merged[0].output).toBe('晴 28°C')
    expect(merged[0].duration_ms).toBe(320)
  })

  it('保留首次出現順序', () => {
    const merged = mergeToolProgress([
      { id: 'b', tool: 'weather', status: 'executing' },
      { id: 'a', tool: 'search_routes', status: 'executing' },
      { id: 'b', tool: 'weather', status: 'done' },
    ])
    expect(merged.map((m) => m.id)).toEqual(['b', 'a'])
  })
})

describe('upsertToolProgress', () => {
  it('新 id 追加、同 id 更新且保留 input', () => {
    let list = upsertToolProgress(undefined, {
      id: 'x',
      tool: 'search_routes',
      status: 'executing',
      input: { query: '壽山' },
    })
    list = upsertToolProgress(list, {
      id: 'x',
      tool: 'search_routes',
      status: 'done',
      output: 'ok',
    })
    list = upsertToolProgress(list, { id: 'y', tool: 'weather', status: 'executing' })
    expect(list).toHaveLength(2)
    expect(list[0]).toMatchObject({
      id: 'x',
      status: 'done',
      input: { query: '壽山' },
      output: 'ok',
    })
    expect(list[1].id).toBe('y')
  })
})

describe('getToolSummary', () => {
  it('優先取 query 欄位並截斷', () => {
    expect(getToolSummary({ limit: 5, query: '龍洞 5.10 經典路線' })).toBe('龍洞 5.10 經典路線')
    expect(getToolSummary({ query: 'a'.repeat(80) })).toHaveLength(61)
  })
  it('沒有已知欄位時取第一個字串值；無字串回空', () => {
    expect(getToolSummary({ foo: 1, bar: '  hello  world ' })).toBe('hello world')
    expect(getToolSummary({ n: 1 })).toBe('')
    expect(getToolSummary(undefined)).toBe('')
  })
})
