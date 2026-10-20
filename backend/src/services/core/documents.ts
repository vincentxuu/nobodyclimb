import type { AIDocument, AIDocumentMetadata, AISource } from '../../types'

// 從 D1 批次取得文件
export async function getDocuments(
  db: D1Database,
  ids: string[]
): Promise<Map<string, AIDocument>> {
  const result = new Map<string, AIDocument>()
  if (ids.length === 0) return result

  const placeholders = ids.map(() => '?').join(', ')
  const docs = await db
    .prepare(`SELECT * FROM ai_documents WHERE embedding_id IN (${placeholders})`)
    .bind(...ids)
    .all<AIDocument>()

  for (const doc of docs.results) {
    result.set(doc.embedding_id ?? doc.id, doc)
  }
  return result
}

// 從文件中提取標題；無中文名稱時 fallback 到 name_en
export function extractTitle(doc: AIDocument): string {
  const firstLine = doc.text.split('\n')[0]
  const name = firstLine.replace(/^路線名稱：|^岩場名稱：/, '').trim()
  if (name) return name
  if (doc.metadata) {
    try {
      const meta = JSON.parse(doc.metadata) as AIDocumentMetadata
      if (meta.name) return meta.name
      if (meta.name_en) return meta.name_en
    } catch {
      /* ignore */
    }
  }
  return doc.source_id
}

// 路線類型英文 → 中文顯示名稱
function routeTypeLabel(type: string): string {
  const map: Record<string, string> = {
    sport: '運攀',
    trad: '傳攀',
    boulder: '抱石',
    mixed: '混合',
  }
  return map[type.toLowerCase()] ?? type
}

// 從文件欄位建立清晰的來源摘要
// 路線：「岩場 · 難度 · 類型」；其他：原始文字截斷
export function buildExcerpt(doc: AIDocument): string {
  if (doc.type === 'route') {
    const fieldMap: Record<string, string> = {}
    for (const line of doc.text.split('\n')) {
      const match = line.match(/^([^：\n]+)：(.+)$/)
      if (match) fieldMap[match[1].trim()] = match[2].trim()
    }
    const parts: string[] = []
    if (fieldMap['所屬岩場']) parts.push(fieldMap['所屬岩場'])
    if (fieldMap['難度等級']) parts.push(fieldMap['難度等級'])
    if (fieldMap['攀登類型']) parts.push(routeTypeLabel(fieldMap['攀登類型']))
    if (fieldMap['岩場區域']) parts.push(fieldMap['岩場區域'])
    if (parts.length > 0) return parts.join(' · ')
  }
  return doc.text.slice(0, 120).replace(/\n/g, ' ')
}

// 統一路線摘要格式化：供 pipeline / agent / SQL 路徑共用
// 輸入為純物件（Record<string, unknown>），欄位名稱參照 formatRouteForLLm / formatSqlRowForLLm 的慣例
// 格式：⛰ 路線名稱，難度等級：5.10a，類型：運攀，岩場：龍洞，岩場區域：長巷，路線長度：22m。描述。
export function formatRouteSummary(data: Record<string, unknown>, videoUrl?: string): string {
  const name = (data.name ?? data.title ?? data['路線名稱'] ?? '') as string
  const grade = (data.grade ?? data.grade_numeric ?? data['難度等級'] ?? '') as string
  const routeType = (data.route_type ?? data['攀登類型'] ?? '') as string
  const cragName = (data.crag_name ?? data['所屬岩場'] ?? '') as string
  const areaName = (data.area_name ?? data['岩場區域'] ?? '') as string
  const height = (data.height ?? data.route_length ?? data['路線長度'] ?? '') as string
  const description = (data.description ?? data['路線描述'] ?? '') as string

  const parts: string[] = []
  if (name) parts.push(`⛰ ${name}`)
  if (grade) parts.push(`難度等級：${grade}`)
  if (routeType) parts.push(`類型：${routeTypeLabel(routeType)}`)
  if (cragName) parts.push(`岩場：${cragName}`)
  if (areaName) parts.push(`岩場區域：${areaName}`)
  if (height) parts.push(`路線長度：${height}`)
  if (description) parts.push(description)

  let result = parts.join('，') + '。'
  if (videoUrl) {
    result += ` [觀看影片](${videoUrl})`
  }
  return result
}

// 將路線文件格式化為與 pipeline 一致的一段式描述，供 agent 與 pipeline 共用
// 格式：⛰ 路線名稱，難度等級：5.10a，類型：運攀，岩場：龍洞，岩場區域：長巷，路線長度：22m。描述。
export function formatRouteForLLM(doc: AIDocument, videoUrl?: string): string {
  if (doc.type !== 'route') return doc.text

  const fieldMap: Record<string, string> = {}
  for (const line of doc.text.split('\n')) {
    const match = line.match(/^([^：\n]+)：(.+)$/)
    if (match) fieldMap[match[1].trim()] = match[2].trim()
  }

  return formatRouteSummary(fieldMap, videoUrl)
}

// 將 SQL 查詢單行結果格式化為與 pipeline/agent 共用的一段式描述
// 輸入為 TextToSqlService 回傳的單筆路線資料（純物件，非 AIDocument）
// 格式：◯ 路線名稱，難度等級：5.10a，類型：運攀，岩場：龍洞，路線長度：22m。描述。
export function formatSqlRowForLLM(row: Record<string, unknown>): string {
  return formatRouteSummary(row)
}

// 依文件類型建立 URL
export function buildUrl(doc: AIDocument): string | undefined {
  if (doc.type === 'route') {
    const meta = doc.metadata ? (JSON.parse(doc.metadata) as AIDocumentMetadata) : {}
    if (meta.crag_id) {
      return `/crag/${meta.crag_id}/route/${doc.source_id}`
    }
    return undefined
  }
  if (doc.type === 'crag') {
    return `/crag/${doc.source_id}`
  }
  if (doc.type === 'video') {
    const meta = doc.metadata ? (JSON.parse(doc.metadata) as AIDocumentMetadata) : {}
    if (meta.youtube_id) {
      return `https://youtube.com/watch?v=${meta.youtube_id}`
    }
  }
  return undefined
}

// LLM 回答後處理：將已知路線名稱替換為 markdown 連結，並於第一次出現時附上影片連結
// 依名稱長度由長到短排序，避免短名稱提前匹配到長名稱的一部分
export function injectRouteLinks(text: string, sources: AISource[]): string {
  let result = text
  const routeSources = sources
    .filter((s) => s.type === 'route' && s.url && s.title)
    .sort((a, b) => b.title.length - a.title.length)

  for (const source of routeSources) {
    const name = source.title
    const url = source.url!
    const videoUrl = source.latestVideoUrl
    const videoSuffix = videoUrl ? ` [觀看影片](${videoUrl})` : ''
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    let videoAdded = false

    // Step 1: 獨立的 **name**（前面沒有 [，後面沒有 ](）→ [**name**](url) + 影片連結（僅第一次）
    result = result.replace(new RegExp(`(?<!\\[)\\*\\*${escaped}\\*\\*(?!\\]\\()`, 'gi'), () => {
      const suffix = !videoAdded && videoSuffix ? videoSuffix : ''
      if (suffix) videoAdded = true
      return `[**${name}**](${url})${suffix}`
    })

    // Step 2: 純文字 name（排除已在連結內的）→ [name](url)
    result = result.replace(
      new RegExp(`(?<!\\[\\*\\*|\\[)${escaped}(?!\\*\\*\\]|\\])`, 'gi'),
      `[${name}](${url})`
    )

    // Step 3: LLM 已自行生成的連結 → 補上影片連結（僅第一次）
    if (videoUrl && !videoAdded) {
      result = result.replace(
        new RegExp(`(\\[(?:\\*\\*)?${escaped}(?:\\*\\*)?\\]\\([^)]+\\))(?! \\[觀看影片\\])`, 'gi'),
        (match) => {
          if (!videoAdded) {
            videoAdded = true
            return `${match} [觀看影片](${videoUrl})`
          }
          return match
        }
      )
    }
  }
  return result
}

// 輸出正規化保底：確保所有 RAG 模式（pipeline / agent / GK / SQL）回覆格式一致
// 在 finalizeResponse 之前執行，作為防漂移的安全網
export function normalizeResponseFormat(answer: string): string {
  let result = answer

  // 1. 列表符號統一：* 開頭改為 - 開頭
  result = result.replace(/^(?:\*\s+)/gm, '- ')

  // 2. 移除 ## 標題語法（保留標題文字，去掉 ## 前綴）
  result = result.replace(/^#{2,6}\s+/gm, '')

  // 3. 移除縮排或子列表（開頭空白後的 - 或 *）
  result = result.replace(/^\s+[-*]\s+/gm, '- ')

  // 4. 壓縮連續空行（超過 2 個換行壓為 2 個）
  result = result.replace(/\n{3,}/g, '\n\n')

  return result.trim()
}
