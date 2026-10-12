'use client'

import { useMessages, useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

// 路線型態分類
// options 的中文字串是存進後端（favorite_route_type，逗號分隔）的值，不可翻譯；
// 顯示文字一律透過 ROUTE_TYPE_MESSAGE_KEYS 換成訊息檔 key 再查。
const ROUTE_TYPE_CATEGORIES = [
  {
    key: 'climbing',
    options: ['抱石', '運動攀登', '頂繩攀登', '速度攀登', '傳統攀登'],
  },
  {
    key: 'terrain',
    options: ['平板岩', '垂直岩壁', '外傾岩壁', '屋簷', '裂隙', '稜線', '壁面', '煙囪'],
  },
  {
    key: 'movement',
    options: ['動態', '跑酷', '協調', '靜態', '技術', '力量', '耐力'],
  },
] as const

// 存檔值 → 訊息檔 `ProfileSections.routeTypes.options` 的 key
const ROUTE_TYPE_MESSAGE_KEYS: Record<string, string> = {
  抱石: 'bouldering',
  運動攀登: 'sport',
  頂繩攀登: 'topRope',
  速度攀登: 'speed',
  傳統攀登: 'trad',
  平板岩: 'slab',
  垂直岩壁: 'vertical',
  外傾岩壁: 'overhang',
  屋簷: 'roof',
  裂隙: 'crack',
  稜線: 'arete',
  壁面: 'face',
  煙囪: 'chimney',
  動態: 'dynamic',
  跑酷: 'parkour',
  協調: 'coordination',
  靜態: 'static',
  技術: 'technical',
  力量: 'power',
  耐力: 'endurance',
}

/**
 * 回傳一個函式：把路線型態的存檔值（中文）轉成目前語系的顯示文字。
 * 不在對照表內的值（舊資料、自訂值）原樣回傳。
 */
export function useRouteTypeLabel() {
  const messages = useMessages() as Record<string, unknown>
  const sectionMessages = (messages.ProfileSections ?? {}) as {
    routeTypes?: { options?: Record<string, string> }
  }
  const optionMessages = sectionMessages.routeTypes?.options ?? {}

  return (value: string): string => {
    const key = ROUTE_TYPE_MESSAGE_KEYS[value]
    return (key && optionMessages[key]) || value
  }
}

interface RouteTypeSelectorProps {
  value: string[]
  onChange: (_types: string[]) => void
  disabled?: boolean
  className?: string
}

/**
 * 路線型態選擇器
 * 可複選，按類別分組顯示
 */
export function RouteTypeSelector({
  value,
  onChange,
  disabled = false,
  className,
}: RouteTypeSelectorProps) {
  const t = useTranslations('ProfileSections')
  const getRouteTypeLabel = useRouteTypeLabel()

  const handleToggle = (option: string) => {
    if (disabled) return

    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option))
    } else {
      onChange([...value, option])
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {ROUTE_TYPE_CATEGORIES.map((category) => (
        <div key={category.key}>
          <p className="mb-2 text-sm font-medium text-gray-600">
            {t(`routeTypes.categories.${category.key}`)}
          </p>
          <div className="flex flex-wrap gap-2">
            {category.options.map((option) => {
              const isSelected = value.includes(option)
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleToggle(option)}
                  disabled={disabled}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-sm transition-colors',
                    isSelected
                      ? 'border-gray-800 bg-gray-800 text-white'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400',
                    disabled && 'cursor-not-allowed opacity-50'
                  )}
                >
                  {getRouteTypeLabel(option)}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * 將逗號分隔的字串轉換為陣列
 */
export function stringToRouteTypes(str: string): string[] {
  if (!str) return []
  return str
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

/**
 * 將陣列轉換為逗號分隔的字串
 */
export function routeTypesToString(types: string[]): string {
  return types.join(', ')
}
