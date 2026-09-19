import type { AISource } from '../../../types'
/**
 * 解析 LLM 回應中的建議問題，回傳純回答與建議陣列。
 * 支援兩種格式：
 * 1. 明確分隔符 `---SUGGESTIONS---`
 * 2. 末尾連續問句行自動偵測（≥2 行）
 */
export function parseSuggestedQuestions(raw: string): {
  answer: string
  suggested_questions: string[]
} {
  const SEP = '---SUGGESTIONS---'
  // 有些模型會把 --- 當 markdown 水平線換行後才輸出 SUGGESTIONS---，這裡正規化
  const normalized = raw.replace(/---\s*\n\s*SUGGESTIONS---/, SEP)
  const idx = normalized.indexOf(SEP)
  if (idx !== -1) {
    const rawAnswer = normalized.slice(0, idx).trim()
    const suggestionsBlock = normalized.slice(idx + SEP.length).trim()
    const suggested_questions = suggestionsBlock
      .split('\n')
      .map((line) => line.replace(/^\d+\.\s*/, '').trim())
      .filter((line) => line.length > 0 && (line.endsWith('？') || line.endsWith('?')))
      .slice(0, 3)

    const answerLines = rawAnswer.split('\n')
    let cutIndex = answerLines.length
    for (let i = answerLines.length - 1; i >= 0; i--) {
      const trimmed = answerLines[i].trim()
      if (trimmed === '') continue
      const cleaned = trimmed.replace(/^\d+\.\s*/, '').trim()
      if (cleaned.endsWith('？') || cleaned.endsWith('?')) {
        cutIndex = i
      } else {
        break
      }
    }
    const answer = answerLines.slice(0, cutIndex).join('\n').trim()
    // 防護：如果剝離問句後 answer 為空，保留原始回答（避免 LLM 全輸出問句導致空回答）
    return { answer: answer || rawAnswer, suggested_questions }
  }

  const lines = normalized.trim().split('\n')
  const questions: string[] = []
  let cutIndex = lines.length
  for (let i = lines.length - 1; i >= 0; i--) {
    const trimmed = lines[i].trim()
    if (trimmed === '') continue
    const cleaned = trimmed.replace(/^\d+\.\s*/, '').trim()
    if (cleaned.endsWith('？') || cleaned.endsWith('?')) {
      questions.unshift(cleaned)
      cutIndex = i
    } else {
      break
    }
  }
  if (questions.length >= 2) {
    const answerLines = lines.slice(0, cutIndex)
    while (answerLines.length > 0 && answerLines[answerLines.length - 1].trim() === '') {
      answerLines.pop()
    }
    const answer = answerLines.join('\n').trim()
    // 防護：如果剝離問句後 answer 為空，保留原始回答
    return { answer: answer || raw.trim(), suggested_questions: questions.slice(0, 3) }
  }
  return { answer: raw.trim(), suggested_questions: [] }
}

/**
 * 追問時把「回答有提到」的上一輪來源併入本輪 sources（放前面，依 id 去重）。
 * 前端來源卡片、injectRouteLinks、以及下一輪追問的來源鏈（findPreviousTurnSources）都靠這個。
 */
export function mergeCarryOverSources(
  answer: string,
  carryOver: AISource[] | undefined,
  retrieved: AISource[] | undefined
): AISource[] {
  const mentioned = (carryOver ?? []).filter((s) => s.title && answer.includes(s.title))
  const seen = new Set<string>()
  const merged: AISource[] = []
  for (const s of [...mentioned, ...(retrieved ?? [])]) {
    if (seen.has(s.id)) continue
    seen.add(s.id)
    merged.push(s)
  }
  return merged
}
