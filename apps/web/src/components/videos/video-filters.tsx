import { useTranslations } from 'next-intl'
import React from 'react'
import { Button } from '@/components/ui/button'
import type { VideoCategory } from '@/lib/types'
import { VIDEO_CATEGORY_KEYS } from './category-keys'

interface VideoFiltersProps {
  selectedCategory: VideoCategory | 'all'
  // eslint-disable-next-line no-unused-vars
  onCategoryChange: (_category: VideoCategory | 'all') => void
}

const VideoFilters: React.FC<VideoFiltersProps> = ({ selectedCategory, onCategoryChange }) => {
  const t = useTranslations('VideosFilter.categories')
  // value 是影片資料的分類欄位值（用於比對，不可翻譯）；顯示文字由訊息檔提供
  const categoryValues: VideoCategory[] = [
    // 攀岩類型
    '戶外上攀',
    '戶外抱石',
    '室內上攀',
    '室內抱石',
    '賽事',
    // 內容類型
    '教學影片',
    '訓練',
    '紀錄片',
    '裝備評測',
    '挑戰影片',
    '訪談',
  ]
  const categories: Array<{ value: VideoCategory | 'all'; label: string }> = [
    { value: 'all', label: t('all') },
    ...categoryValues.map((value) => ({ value, label: t(VIDEO_CATEGORY_KEYS[value]) })),
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <Button
          key={category.value}
          variant={selectedCategory === category.value ? 'primary' : 'outline'}
          size="sm"
          onClick={() => onCategoryChange(category.value)}
          className="text-xs"
        >
          {category.label}
        </Button>
      ))}
    </div>
  )
}

export default VideoFilters
