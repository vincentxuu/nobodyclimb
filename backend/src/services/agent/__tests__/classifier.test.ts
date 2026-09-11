import { describe, expect, it } from 'vitest'
import { classifyQuery, selectManifests } from '../classifier'
import type { ToolManifest } from '../types'

// ---------------------------------------------------------------------------
// classifyQuery
// ---------------------------------------------------------------------------

describe('classifyQuery', () => {
  it('分類打招呼', () => {
    expect(classifyQuery('你好')).toBe('greeting')
    expect(classifyQuery('嗨！')).toBe('greeting')
    expect(classifyQuery('hello')).toBe('greeting')
    expect(classifyQuery('Hi')).toBe('greeting')
  })

  it('分類系統問題', () => {
    expect(classifyQuery('你是誰')).toBe('system')
    expect(classifyQuery('你能做什麼')).toBe('system')
    expect(classifyQuery('功能有哪些')).toBe('system')
  })

  it('分類通用知識', () => {
    expect(classifyQuery('什麼是 flash')).toBe('general_knowledge')
    expect(classifyQuery('RP 是什麼')).toBe('general_knowledge')
    expect(classifyQuery('攀岩裝備有哪些')).toBe('general_knowledge')
  })

  it('分類需要工具的查詢', () => {
    expect(classifyQuery('龍洞有什麼路線')).toBe('needs_tool')
    expect(classifyQuery('推薦我一條 5.10')).toBe('needs_tool')
    expect(classifyQuery('天氣怎麼樣')).toBe('needs_tool')
    expect(classifyQuery('我爬過幾條')).toBe('needs_tool')
  })

  it('未知查詢預設為 needs_tool', () => {
    expect(classifyQuery('今天適合出門嗎')).toBe('needs_tool')
  })
})

// ---------------------------------------------------------------------------
// selectManifests
// ---------------------------------------------------------------------------

const ALL_MANIFESTS: ToolManifest[] = [
  {
    name: 'search',
    description: '搜尋',
    triggers: ['路線', '岩場', '搜尋', '找'],
    tools: ['search_routes', 'search_crags'],
    promptFragment: '',
    requiresAuth: false,
  },
  {
    name: 'recommend',
    description: '推薦',
    triggers: ['推薦', '建議', '適合我'],
    tools: ['recommend'],
    promptFragment: '',
    requiresAuth: true,
  },
  {
    name: 'weather',
    description: '天氣',
    triggers: ['天氣', '下雨'],
    tools: ['weather'],
    promptFragment: '',
    requiresAuth: false,
  },
  {
    name: 'data',
    description: '資料',
    triggers: ['幾條', '統計', '排名'],
    tools: ['sql_query', 'crag_info'],
    promptFragment: '',
    requiresAuth: false,
  },
  {
    name: 'profile',
    description: '個人',
    triggers: ['我的', '我爬過'],
    tools: ['user_profile'],
    promptFragment: '',
    requiresAuth: true,
  },
  {
    name: 'memory',
    description: '記憶',
    triggers: ['記得', '之前說過'],
    tools: ['recall_memory'],
    promptFragment: '',
    requiresAuth: true,
  },
  {
    name: 'coaching',
    description: '教練',
    triggers: ['訓練', '怎麼進步'],
    tools: ['suggest_training'],
    promptFragment: '',
    requiresAuth: true,
  },
]

describe('selectManifests', () => {
  it('search + data 永遠載入', () => {
    const result = selectManifests('天氣怎麼樣', ALL_MANIFESTS)
    const names = result.map((m) => m.name)
    expect(names).toContain('search')
    expect(names).toContain('data')
    expect(names).toContain('weather')
  })

  it('天氣查詢只載入 search + data + weather', () => {
    const result = selectManifests('天氣怎麼樣', ALL_MANIFESTS)
    const names = result.map((m) => m.name)
    expect(names).toEqual(['search', 'weather', 'data'])
  })

  it('推薦查詢載入 search + data + recommend', () => {
    const result = selectManifests('推薦我一條路線', ALL_MANIFESTS)
    const names = result.map((m) => m.name)
    expect(names).toContain('search')
    expect(names).toContain('data')
    expect(names).toContain('recommend')
  })

  it('訓練查詢載入 coaching', () => {
    const result = selectManifests('怎麼進步', ALL_MANIFESTS)
    const names = result.map((m) => m.name)
    expect(names).toContain('coaching')
    expect(names).toContain('search')
    expect(names).toContain('data')
  })

  it('記憶查詢載入 memory', () => {
    const result = selectManifests('你記得我之前說過什麼嗎', ALL_MANIFESTS)
    const names = result.map((m) => m.name)
    expect(names).toContain('memory')
  })

  it('個人查詢載入 profile', () => {
    const result = selectManifests('我爬過幾條路線', ALL_MANIFESTS)
    const names = result.map((m) => m.name)
    expect(names).toContain('profile')
    expect(names).toContain('search')
  })

  it('多重觸發：載入多個 manifest', () => {
    const result = selectManifests('推薦適合我的路線，還有天氣', ALL_MANIFESTS)
    const names = result.map((m) => m.name)
    expect(names).toContain('recommend')
    expect(names).toContain('weather')
    expect(names).toContain('search')
  })

  it('空查詢全部載入（fallback）', () => {
    const result = selectManifests('', ALL_MANIFESTS)
    expect(result).toEqual(ALL_MANIFESTS)
  })

  it('無 trigger 命中全部載入（fallback）', () => {
    const result = selectManifests('今天好熱啊', ALL_MANIFESTS)
    expect(result).toEqual(ALL_MANIFESTS)
  })

  it('只含空白的查詢全部載入', () => {
    const result = selectManifests('   ', ALL_MANIFESTS)
    expect(result).toEqual(ALL_MANIFESTS)
  })

  it('不載入不在輸入 manifests 中的項目', () => {
    const subset = ALL_MANIFESTS.filter((m) => !m.requiresAuth)
    const result = selectManifests('天氣', subset)
    const names = result.map((m) => m.name)
    expect(names).not.toContain('recommend')
    expect(names).not.toContain('profile')
  })

  it('統計查詢主要命中 data', () => {
    const result = selectManifests('龍洞有幾條路線', ALL_MANIFESTS)
    const names = result.map((m) => m.name)
    expect(names).toContain('data')
    expect(names).toContain('search')
    // 不應載入不相關的 coaching/memory
    expect(names).not.toContain('coaching')
    expect(names).not.toContain('memory')
  })
})
