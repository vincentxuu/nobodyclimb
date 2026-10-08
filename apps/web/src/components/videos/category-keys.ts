import type { VideoCategory } from '@/lib/types'

/**
 * 影片分類值 → `VideosFilter.categories` 訊息 key。
 * 分類值（繁中字串）是影片資料的比對欄位，不可更動；顯示文字一律透過此對照取得譯文。
 */
export const VIDEO_CATEGORY_KEYS = {
  戶外上攀: 'outdoorLead',
  戶外抱石: 'outdoorBoulder',
  室內上攀: 'indoorLead',
  室內抱石: 'indoorBoulder',
  賽事: 'competition',
  教學影片: 'tutorial',
  訓練: 'training',
  紀錄片: 'documentary',
  裝備評測: 'gearReview',
  挑戰影片: 'challenge',
  訪談: 'interview',
} as const satisfies Record<VideoCategory, string>

/**
 * 影片資料中實際存在、但不在 `VideoCategory` 型別內的分類值。
 * 只用於顯示對照，不作為篩選選項。
 */
export const VIDEO_EXTRA_CATEGORY_KEYS: Record<string, string> = {
  戶外攀岩: 'outdoorClimbing',
  室內攀岩: 'indoorClimbing',
  競技攀岩: 'competitionClimbing',
  抱石: 'bouldering',
}

export type VideoCategoryKey = (typeof VIDEO_CATEGORY_KEYS)[VideoCategory]
