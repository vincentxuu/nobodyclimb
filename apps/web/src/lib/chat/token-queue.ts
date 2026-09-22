// 串流 token 佇列：網路到達與畫面更新解耦，每 DRAIN_INTERVAL_MS 吐一批
export const DRAIN_INTERVAL_MS = 25

// 希望積壓在幾個 tick 內消化完（16 tick ≈ 400ms）
const DRAIN_TARGET_TICKS = 16

// 依積壓量決定這個 tick 吐幾個 token：積壓少時逐個吐維持打字感，
// 積壓越多一次吐越多，避免畫面落後網路、done 被佇列拖延
export function getDrainBatchSize(backlog: number): number {
  if (backlog <= 0) return 0
  return Math.min(backlog, Math.max(1, Math.ceil(backlog / DRAIN_TARGET_TICKS)))
}
