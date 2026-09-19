import { describe, expect, it } from 'vitest'
import type { AISource } from '../../../../types'
import { mergeCarryOverSources } from '../utils'

const src = (id: string, title: string): AISource => ({
  id,
  type: 'route',
  title,
  excerpt: '',
  score: 0,
})

describe('mergeCarryOverSources', () => {
  it('只併入回答有提到的上一輪來源，保持原順序並放在檢索結果前面', () => {
    const merged = mergeCarryOverSources(
      '「望著大海」攀到頂可以看到海，熱身路線則沒有提到風景',
      [src('r1', '熱身路線'), src('r2', '好痛'), src('r3', '望著大海')],
      [src('r9', '看起來我可以')]
    )
    expect(merged.map((s) => s.id)).toEqual(['r1', 'r3', 'r9'])
  })

  it('依 id 去重，同一路線同時在兩邊只留一筆', () => {
    const merged = mergeCarryOverSources(
      '熱身路線',
      [src('r1', '熱身路線')],
      [src('r1', '熱身路線'), src('r2', '好痛')]
    )
    expect(merged.map((s) => s.id)).toEqual(['r1', 'r2'])
  })

  it('沒有 carry-over 時等同檢索結果', () => {
    expect(
      mergeCarryOverSources('任何回答', undefined, [src('r2', '好痛')]).map((s) => s.id)
    ).toEqual(['r2'])
  })
})
