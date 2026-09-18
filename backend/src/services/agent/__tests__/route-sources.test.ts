import { describe, expect, it } from 'vitest'
import { injectRouteLinks } from '../../core/documents'
import { formatSubAgentResult, normalizeGatheredContext } from '../sub-agents/types'
import { recommendTool } from '../tools/recommend'
import { mergeSources, toAISource } from '../tools/route-sources'
import { searchCragsTool } from '../tools/search-crags'
import { searchRoutesTool } from '../tools/search-routes'

// 重現：Agent tool 必須保留結構化來源（url），否則 post_loop 無法注入站內連結
describe('agent route sources（站內連結重現測試）', () => {
  it('recommend.formatResult 保留 metadata.sources（含 url）', () => {
    const r = recommendTool.formatResult({
      recommendations: [
        {
          id: 'route-gufeng',
          title: '古風',
          excerpt: '龍洞 · 5.11c',
          text: '古風路線描述',
          url: '/crag/longdong/route/route-gufeng',
          score: 0.9,
          latestVideoUrl: 'https://youtube.com/watch?v=abc123',
        },
      ],
      count: 1,
    })
    const sources = r.metadata?.sources as Array<{ url?: string }> | undefined
    expect(sources).toBeDefined()
    expect(sources).toHaveLength(1)
    expect(sources?.[0].url).toBe('/crag/longdong/route/route-gufeng')
  })

  it('search_routes.formatResult 保留 metadata.sources（含 url）', () => {
    const r = searchRoutesTool.formatResult({
      results: [
        {
          id: 'route-xidao',
          title: '西道',
          excerpt: '龍洞 · 5.11c',
          text: '西道路線描述',
          url: '/crag/longdong/route/route-xidao',
          score: 0.8,
        },
      ],
      count: 1,
    })
    const sources = r.metadata?.sources as Array<{ url?: string }> | undefined
    expect(sources).toBeDefined()
    expect(sources).toHaveLength(1)
  })

  it('search_crags.formatResult 保留 metadata.sources（type=crag）', () => {
    const r = searchCragsTool.formatResult({
      results: [
        {
          id: 'crag-longdong',
          title: '龍洞',
          excerpt: '東北角',
          text: '龍洞岩場描述',
          url: '/crag/crag-longdong',
        },
      ],
      count: 1,
    })
    const sources = r.metadata?.sources as Array<{ type?: string }> | undefined
    expect(sources).toHaveLength(1)
    expect(sources?.[0].type).toBe('crag')
  })

  it('injectRouteLinks 把路線名稱換成站內連結並附上影片連結', () => {
    const answer = injectRouteLinks('推薦你爬古風，難度 5.11c。', [
      toAISource({
        id: 'route-gufeng',
        type: 'route',
        title: '古風',
        url: '/crag/longdong/route/route-gufeng',
        excerpt: '龍洞 · 5.11c',
        latestVideoUrl: 'https://youtube.com/watch?v=abc123',
      }),
    ])
    expect(answer).toContain('[古風](/crag/longdong/route/route-gufeng)')
    expect(answer).toContain('[觀看影片](https://youtube.com/watch?v=abc123)')
  })

  it('無 url 的來源不會被注入（避免誤殺純文字）', () => {
    const answer = injectRouteLinks('推薦你爬古風。', [])
    expect(answer).toBe('推薦你爬古風。')
  })

  it('mergeSources 依 type:id 去重', () => {
    const merged = mergeSources([
      [{ id: 'r1', type: 'route', title: '古風', url: '/crag/x/route/r1' }],
      [
        { id: 'r1', type: 'route', title: '古風', url: '/crag/x/route/r1' },
        { id: 'c1', type: 'crag', title: '龍洞', url: '/crag/c1' },
      ],
    ])
    expect(merged).toHaveLength(2)
  })

  it('normalizeGatheredContext 相容字串與物件', () => {
    expect(normalizeGatheredContext('純文字')).toEqual({ context: '純文字', sources: [] })
    const obj = normalizeGatheredContext({
      context: 'ctx',
      sources: [{ id: 'r1', type: 'route', title: '古風', url: '/u' }],
    })
    expect(obj.context).toBe('ctx')
    expect(obj.sources).toHaveLength(1)
  })

  it('formatSubAgentResult 透傳 sources 到 metadata', () => {
    const r = formatSubAgentResult({
      answer: '推薦古風',
      tokensUsed: 10,
      subAgent: 'recommend_agent',
      sources: [{ id: 'r1', type: 'route', title: '古風', url: '/u' }],
    })
    expect(r.content).toBe('推薦古風')
    expect((r.metadata?.sources as Array<{ title: string }> | undefined)?.[0].title).toBe('古風')
  })
})
