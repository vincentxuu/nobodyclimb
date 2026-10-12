import { pickRandomSuggestions } from '@/lib/chat/suggestions'

const POOL = ['a', 'b', 'c', 'd', 'e']

describe('pickRandomSuggestions', () => {
  it('取出 count 題、不重複、都來自題庫', () => {
    const picked = pickRandomSuggestions(POOL, 3)
    expect(picked).toHaveLength(3)
    expect(new Set(picked).size).toBe(3)
    for (const q of picked) expect(POOL).toContain(q)
  })

  it('預設取 3 題；題庫不足時全部回傳', () => {
    expect(pickRandomSuggestions(POOL)).toHaveLength(3)
    expect(pickRandomSuggestions(['a', 'b'], 3).sort()).toEqual(['a', 'b'])
    expect(pickRandomSuggestions([], 3)).toEqual([])
  })

  it('不改動傳入的題庫', () => {
    const pool = [...POOL]
    pickRandomSuggestions(pool, 3, () => 0)
    expect(pool).toEqual(POOL)
  })

  it('Fisher–Yates：固定亂數來源時結果可預期', () => {
    // random 恆為 0 → 每一輪都把第 i 個與第 0 個交換：a b c d e → b c d e a
    expect(pickRandomSuggestions(POOL, 5, () => 0)).toEqual(['b', 'c', 'd', 'e', 'a'])
    // random 趨近 1 → j === i，順序不變
    expect(pickRandomSuggestions(POOL, 5, () => 0.999999)).toEqual(POOL)
  })

  it('每個位置的分布大致均勻', () => {
    const counts = new Map<string, number>()
    const rounds = 5000
    for (let i = 0; i < rounds; i++) {
      const first = pickRandomSuggestions(POOL, 1)[0]
      counts.set(first, (counts.get(first) ?? 0) + 1)
    }
    // 期望值 1000，容許 ±25%
    for (const q of POOL) {
      expect(counts.get(q) ?? 0).toBeGreaterThan(750)
      expect(counts.get(q) ?? 0).toBeLessThan(1250)
    }
  })
})
