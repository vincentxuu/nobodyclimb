import type { AISource } from '../../../types'
/**
 * 解析 LLM 回應中的建議問題，回傳純回答與建議陣列。
 * 支援兩種格式：
 * 1. 明確分隔符 `---SUGGESTIONS---`
 * 2. 末尾連續問句行自動偵測（≥2 行）
 */
/**
 * 判斷一句話是不是「助理反問使用者」的口吻（而非「使用者向助理提問」）。
 * 建議追問要能直接當成下一輪的使用者 query 送回去；助理口吻的反問句送回去 agent 答不了，
 * 會跑滿 max turns 後外洩推理（2026-09-19 preview 實例：「您想先從哪個岩場開始嘗試？」）。
 * prompt 已禁止，但模型會違規，這裡是程式層保底。
 */
export function isAssistantVoiceQuestion(text: string): boolean {
  const t = text.trim()
  if (!t) return false
  // 「您」在本產品語境只會是助理稱呼使用者
  if (t.includes('您')) return true
  // 「你 + 意願／偏好動詞」是助理問使用者；「你推薦哪條？」這類是使用者問助理，不擋
  return /(^|[，,。；;\s])(你)(想|是否|需要|偏好|喜歡|打算|希望|覺得|有沒有|會不會|要不要|可以|能不能)/.test(
    t
  )
}

/** 清洗單行建議問題；不合格回傳 null */
function normalizeSuggestedQuestion(line: string): string | null {
  const cleaned = line
    .replace(/^\d+\.\s*/, '')
    .replace(/^[-*]\s*/, '')
    .replace(/\*\*/g, '')
    .trim()
  if (cleaned.length < 4) return null
  if (!(cleaned.endsWith('？') || cleaned.endsWith('?'))) return null
  if (isAssistantVoiceQuestion(cleaned)) return null
  return cleaned
}

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
    const suggested_questions = Array.from(
      new Set(
        suggestionsBlock
          .split('\n')
          .map(normalizeSuggestedQuestion)
          .filter((q): q is string => q !== null)
      )
    ).slice(0, 3)

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

  // 沒有分隔符：尾端連續 2 行以上的問句視為建議問題（同樣套用口吻過濾，反問句只剝離不保留）
  const lines = normalized.trim().split('\n')
  const questions: string[] = []
  let cutIndex = lines.length
  for (let i = lines.length - 1; i >= 0; i--) {
    const trimmed = lines[i].trim()
    if (trimmed === '') continue
    const cleaned = trimmed.replace(/^\d+\.\s*/, '').trim()
    if (cleaned.endsWith('？') || cleaned.endsWith('?')) {
      const valid = normalizeSuggestedQuestion(cleaned)
      if (valid) questions.unshift(valid)
      cutIndex = i
    } else {
      break
    }
  }
  const trailingQuestionLines = lines.length - cutIndex
  if (trailingQuestionLines >= 2) {
    const answerLines = lines.slice(0, cutIndex)
    while (answerLines.length > 0 && answerLines[answerLines.length - 1].trim() === '') {
      answerLines.pop()
    }
    const answer = answerLines.join('\n').trim()
    // 防護：如果剝離問句後 answer 為空，保留原始回答
    return {
      answer: answer || raw.trim(),
      suggested_questions: Array.from(new Set(questions)).slice(0, 3),
    }
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
