import { mergeToolProgress } from '@/lib/chat/tool-progress'

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

  it('done 事件保留 executing 帶來的 input', () => {
    const merged = mergeToolProgress([
      { id: 'call-1', tool: 'weather', status: 'executing', input: { crag: '龍洞' } },
      { id: 'call-1', tool: 'weather', status: 'done' },
    ])
    expect(merged[0].input).toEqual({ crag: '龍洞' })
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
