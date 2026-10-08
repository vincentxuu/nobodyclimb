/**
 * 攀爬類型
 */
export type AscentType =
  | 'redpoint' // 紅點完攀
  | 'flash' // 閃攀
  | 'onsight' // 視攀
  | 'attempt' // 嘗試
  | 'toprope' // 上方確保
  | 'lead' // 先鋒
  | 'seconding' // 跟攀
  | 'repeat' // 重複完攀

/**
 * 攀爬類型顯示資訊（圖示與顏色）
 *
 * 顯示文字依語系查訊息檔：`Ascent.types.<type>.label`／`Ascent.types.<type>.description`。
 * 這裡的 `label` 是沒有翻譯情境時的英文後備值。
 */
export const ASCENT_TYPE_DISPLAY: Record<
  AscentType,
  {
    label: string
    icon: string
    color: string
  }
> = {
  redpoint: {
    label: 'Redpoint',
    icon: 'CircleDot',
    color: 'text-red-500',
  },
  flash: {
    label: 'Flash',
    icon: 'Zap',
    color: 'text-yellow-500',
  },
  onsight: {
    label: 'Onsight',
    icon: 'Eye',
    color: 'text-emerald-500',
  },
  attempt: {
    label: 'Attempt',
    icon: 'Target',
    color: 'text-gray-500',
  },
  toprope: {
    label: 'Top Rope',
    icon: 'ArrowUp',
    color: 'text-blue-500',
  },
  lead: {
    label: 'Lead',
    icon: 'Sword',
    color: 'text-purple-500',
  },
  seconding: {
    label: 'Second',
    icon: 'Users',
    color: 'text-cyan-500',
  },
  repeat: {
    label: 'Repeat',
    icon: 'Repeat',
    color: 'text-indigo-500',
  },
}

/**
 * 使用者攀爬記錄
 */
export interface UserRouteAscent {
  id: string
  user_id: string
  route_id: string

  ascent_type: AscentType
  ascent_date: string
  attempts_count: number
  rating: number | null
  perceived_grade: string | null

  notes: string | null
  is_public: boolean

  // 媒體連結
  photos: string[]
  youtube_url: string | null
  instagram_url: string | null

  created_at: string
  updated_at: string

  // Joined fields
  route_name?: string
  route_grade?: string
  crag_id?: string
  crag_name?: string
  username?: string
  display_name?: string | null
  avatar_url?: string | null
}

/**
 * 新增/編輯攀爬記錄表單
 */
export interface AscentFormData {
  route_id: string
  ascent_type: AscentType
  ascent_date: string
  attempts_count?: number
  rating?: number | null
  perceived_grade?: string | null
  notes?: string | null
  photos?: string[]
  youtube_url?: string | null
  instagram_url?: string | null
  is_public?: boolean
}

/**
 * 使用者攀爬統計
 */
export interface UserClimbingStats {
  total_ascents: number
  unique_routes: number
  unique_crags: number

  by_type: Record<AscentType, number>
  by_grade: Record<string, number>
  by_month: Array<{
    month: string
    count: number
  }>

  highest_grades: Record<string, string>

  recent_ascents: UserRouteAscent[]
}

/**
 * 路線攀爬摘要
 */
export interface RouteAscentSummary {
  total_ascents: number
  unique_climbers: number
  avg_rating: number | null
  rating_count: number
  by_type: Record<AscentType, number>
}
