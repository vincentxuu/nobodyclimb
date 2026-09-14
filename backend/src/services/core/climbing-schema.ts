/** 攀岩領域統一 schema 轉換層：難度系統、攀登類型等 domain-specific 轉換 */

/** YDS grade → sortable numeric（5.10a=100, 5.12d=123） */
export function gradeToNumeric(grade: string | null | undefined): number {
  if (!grade) return 0
  const match = grade.match(/5\.(\d+)([a-d])?/)
  if (!match) return 0
  return parseInt(match[1], 10) * 10 + (match[2] ? 'abcd'.indexOf(match[2]) : 0)
}

/** 回傳包含中心 grade ± spread 的 grade_numeric 範圍 */
export function gradeRange(center: number, spread: number): { $gte: number; $lte: number } {
  return { $gte: center - spread, $lte: center + spread }
}

/** 解析使用者輸入的路線類型文字為標準 DB 值 */
export function parseRouteType(input: string): 'sport' | 'trad' | 'boulder' | 'mixed' | null {
  const lower = input.toLowerCase()
  if (lower.includes('運攀') || lower.includes('sport')) return 'sport'
  if (lower.includes('傳攀') || lower.includes('trad')) return 'trad'
  if (lower.includes('抱石') || lower.includes('boulder')) return 'boulder'
  if (lower.includes('混合') || lower.includes('mixed')) return 'mixed'
  return null
}
