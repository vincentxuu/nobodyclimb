import { getDrainBatchSize } from '@/lib/chat/token-queue'

describe('getDrainBatchSize', () => {
  it('沒有積壓時不吐', () => {
    expect(getDrainBatchSize(0)).toBe(0)
    expect(getDrainBatchSize(-1)).toBe(0)
  })

  it('積壓少時逐個吐，維持打字感', () => {
    expect(getDrainBatchSize(1)).toBe(1)
    expect(getDrainBatchSize(16)).toBe(1)
  })

  it('積壓越多一次吐越多', () => {
    expect(getDrainBatchSize(17)).toBe(2)
    expect(getDrainBatchSize(160)).toBe(10)
    expect(getDrainBatchSize(1600)).toBe(100)
  })

  it('任何積壓量都能在有限 tick 內消化完', () => {
    let backlog = 1000
    let ticks = 0
    while (backlog > 0) {
      backlog -= getDrainBatchSize(backlog)
      ticks++
    }
    // 1000 個 token 逐個吐要 1000 tick（25 秒）；依積壓量批次後應在 100 tick 內
    expect(ticks).toBeLessThan(100)
  })
})
