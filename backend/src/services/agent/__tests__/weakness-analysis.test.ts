import { describe, expect, it } from 'vitest'
import { analyzeWeaknesses } from '../sub-agents/weakness-analysis'

describe('analyzeWeaknesses', () => {
  it('returns insufficient data message for empty input', () => {
    expect(analyzeWeaknesses({})).toBe('目前數據不足以判斷明顯弱點')
  })

  it('returns insufficient data message for empty fields', () => {
    expect(analyzeWeaknesses({ typeDistribution: [], styleDistribution: {}, recentAscents: [] })).toBe(
      '目前數據不足以判斷明顯弱點'
    )
  })

  // -- 類型偏科 --

  it('detects type imbalance when dominant type >80%', () => {
    const result = analyzeWeaknesses({
      typeDistribution: [
        { type: 'sport', count: 18 },
        { type: 'trad', count: 2 },
      ],
    })
    expect(result).toContain('類型偏科')
    expect(result).toContain('運攀')
    expect(result).toContain('90%')
  })

  it('does not flag type imbalance when balanced', () => {
    const result = analyzeWeaknesses({
      typeDistribution: [
        { type: 'sport', count: 6 },
        { type: 'trad', count: 4 },
      ],
    })
    expect(result).not.toContain('類型偏科')
  })

  it('uses raw type name when no Chinese mapping exists', () => {
    const result = analyzeWeaknesses({
      typeDistribution: [{ type: 'drytool', count: 10 }],
    })
    expect(result).toContain('drytool')
  })

  // -- 風格缺口 --

  it('detects missing onsight when redpoint exists', () => {
    const result = analyzeWeaknesses({
      styleDistribution: { redpoint: 8, flash: 2 },
    })
    expect(result).toContain('onsight')
    expect(result).toContain('讀線')
  })

  it('does not flag onsight gap when onsight exists', () => {
    const result = analyzeWeaknesses({
      styleDistribution: { redpoint: 5, onsight: 3 },
    })
    expect(result).not.toContain('缺少 onsight')
  })

  it('detects high toprope ratio >50%', () => {
    const result = analyzeWeaknesses({
      styleDistribution: { toprope: 8, lead: 2 },
    })
    expect(result).toContain('top-rope 比例偏高')
    expect(result).toContain('先鋒')
  })

  it('does not flag toprope when ratio is low', () => {
    const result = analyzeWeaknesses({
      styleDistribution: { toprope: 2, lead: 8 },
    })
    expect(result).not.toContain('top-rope')
  })

  // -- 難度停滯 --

  it('detects grade plateau when last 5 ascents same grade', () => {
    const result = analyzeWeaknesses({
      recentAscents: [
        { route: 'A', grade: '5.10a', type: 'sport', style: 'redpoint' },
        { route: 'B', grade: '5.10b', type: 'sport', style: 'redpoint' },
        { route: 'C', grade: '5.10c', type: 'sport', style: 'redpoint' },
        { route: 'D', grade: '5.10d', type: 'sport', style: 'redpoint' },
        { route: 'E', grade: '5.10a', type: 'sport', style: 'redpoint' },
      ],
    })
    expect(result).toContain('難度可能停滯')
    expect(result).toContain('5.10')
  })

  it('does not flag plateau when grades vary', () => {
    const result = analyzeWeaknesses({
      recentAscents: [
        { route: 'A', grade: '5.10a', type: 'sport', style: 'redpoint' },
        { route: 'B', grade: '5.11a', type: 'sport', style: 'redpoint' },
        { route: 'C', grade: '5.10c', type: 'sport', style: 'redpoint' },
        { route: 'D', grade: '5.12a', type: 'sport', style: 'redpoint' },
        { route: 'E', grade: '5.10a', type: 'sport', style: 'redpoint' },
      ],
    })
    expect(result).not.toContain('停滯')
  })

  it('does not flag plateau with fewer than 5 ascents', () => {
    const result = analyzeWeaknesses({
      recentAscents: [
        { route: 'A', grade: '5.10a', type: 'sport', style: 'redpoint' },
        { route: 'B', grade: '5.10b', type: 'sport', style: 'redpoint' },
      ],
    })
    expect(result).not.toContain('停滯')
  })

  // -- 多重弱點 --

  it('reports multiple weaknesses when all present', () => {
    const result = analyzeWeaknesses({
      typeDistribution: [{ type: 'sport', count: 20 }],
      styleDistribution: { redpoint: 5, toprope: 10 },
      recentAscents: [
        { route: 'A', grade: '5.10a', type: 'sport', style: 'toprope' },
        { route: 'B', grade: '5.10b', type: 'sport', style: 'toprope' },
        { route: 'C', grade: '5.10c', type: 'sport', style: 'toprope' },
        { route: 'D', grade: '5.10d', type: 'sport', style: 'toprope' },
        { route: 'E', grade: '5.10a', type: 'sport', style: 'toprope' },
      ],
    })
    expect(result).toContain('類型偏科')
    expect(result).toContain('onsight')
    expect(result).toContain('top-rope')
    expect(result).toContain('停滯')
    const lines = result.split('\n')
    expect(lines.length).toBeGreaterThanOrEqual(4)
  })
})
