export type VideoCategory = 
  | '戶外攀岩'
  | '室內攀岩'
  | '競技攀岩'
  | '抱石'
  | '教學影片'
  | '紀錄片'
  | '裝備評測'

export type VideoDuration = 'short' | 'medium' | 'long' // <5min, 5-20min, >20min

export interface Video {
  id: string
  youtubeId: string
  title: string
  description: string
  thumbnailUrl: string
  channel: string
  channelId?: string
  publishedAt: string
  duration: string // 格式: "MM:SS" 或 "HH:MM:SS"
  durationCategory: VideoDuration
  viewCount: string
  category: VideoCategory
  tags?: string[]
  featured?: boolean
}