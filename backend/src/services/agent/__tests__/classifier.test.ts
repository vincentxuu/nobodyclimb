import { describe, expect, it } from 'vitest'
import { classifyQuery } from '../classifier'

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
