// 建議問題題庫放在 messages 的 Chat.suggestionPool（依語言切換），每次隨機取 count 題
// Fisher–Yates 洗牌：sort(() => Math.random() - 0.5) 的分布不均勻，且結果依引擎的排序實作而異
export function pickRandomSuggestions(
  pool: readonly string[],
  count = 3,
  random: () => number = Math.random
): string[] {
  const shuffled = [...pool]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, Math.max(0, count))
}
