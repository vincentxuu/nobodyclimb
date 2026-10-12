import { useTranslations } from 'next-intl'
import React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { VIDEO_POPULARITY_OPTIONS, type VideoPopularity } from '@/lib/types'

interface PopularityFilterProps {
  selectedPopularity: VideoPopularity | 'all'
  // eslint-disable-next-line no-unused-vars
  onPopularityChange: (_popularity: VideoPopularity | 'all') => void
}

const PopularityFilter: React.FC<PopularityFilterProps> = ({
  selectedPopularity,
  onPopularityChange,
}) => {
  const t = useTranslations('VideosFilter')

  return (
    <div className="w-full md:w-40">
      <Select
        value={selectedPopularity}
        onValueChange={(value) => onPopularityChange(value as VideoPopularity | 'all')}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={t('popularityPlaceholder')} />
        </SelectTrigger>
        <SelectContent>
          {VIDEO_POPULARITY_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {t(`popularity.${option.value}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export default PopularityFilter
