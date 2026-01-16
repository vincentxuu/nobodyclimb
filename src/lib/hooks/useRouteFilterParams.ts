'use client'

import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import { useCallback, useMemo } from 'react'

export interface RouteFilterState {
  searchQuery: string
  selectedArea: string
  selectedSector: string
  selectedGrade: string
  selectedType: string
}

const DEFAULT_FILTER_STATE: RouteFilterState = {
  searchQuery: '',
  selectedArea: 'all',
  selectedSector: 'all',
  selectedGrade: 'all',
  selectedType: 'all',
}

/**
 * 使用 URL 參數管理路線篩選狀態的 hook
 * 這確保篩選狀態在路由變更時保持不變
 */
export function useRouteFilterParams() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  // 從 URL 讀取篩選狀態
  const filterState = useMemo<RouteFilterState>(() => {
    return {
      searchQuery: searchParams.get('q') || DEFAULT_FILTER_STATE.searchQuery,
      selectedArea: searchParams.get('area') || DEFAULT_FILTER_STATE.selectedArea,
      selectedSector: searchParams.get('sector') || DEFAULT_FILTER_STATE.selectedSector,
      selectedGrade: searchParams.get('grade') || DEFAULT_FILTER_STATE.selectedGrade,
      selectedType: searchParams.get('type') || DEFAULT_FILTER_STATE.selectedType,
    }
  }, [searchParams])

  // 更新單一篩選值
  const updateFilter = useCallback(
    (key: keyof RouteFilterState, value: string) => {
      const params = new URLSearchParams(searchParams.toString())

      // URL 參數名稱映射
      const paramKeyMap: Record<keyof RouteFilterState, string> = {
        searchQuery: 'q',
        selectedArea: 'area',
        selectedSector: 'sector',
        selectedGrade: 'grade',
        selectedType: 'type',
      }

      const paramKey = paramKeyMap[key]
      const defaultValue = DEFAULT_FILTER_STATE[key]

      if (value === defaultValue || value === '') {
        params.delete(paramKey)
      } else {
        params.set(paramKey, value)
      }

      // 當區域改變時，重置 sector
      if (key === 'selectedArea' && value !== filterState.selectedArea) {
        params.delete('sector')
      }

      const queryString = params.toString()
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname
      router.replace(newUrl, { scroll: false })
    },
    [searchParams, pathname, router, filterState.selectedArea]
  )

  // 重置所有篩選
  const resetFilters = useCallback(() => {
    router.replace(pathname, { scroll: false })
  }, [pathname, router])

  // 建立帶有當前篩選參數的 URL
  const buildUrlWithFilters = useCallback(
    (basePath: string) => {
      const params = new URLSearchParams()

      if (filterState.searchQuery) params.set('q', filterState.searchQuery)
      if (filterState.selectedArea !== 'all') params.set('area', filterState.selectedArea)
      if (filterState.selectedSector !== 'all') params.set('sector', filterState.selectedSector)
      if (filterState.selectedGrade !== 'all') params.set('grade', filterState.selectedGrade)
      if (filterState.selectedType !== 'all') params.set('type', filterState.selectedType)

      const queryString = params.toString()
      return queryString ? `${basePath}?${queryString}` : basePath
    },
    [filterState]
  )

  return {
    ...filterState,
    setSearchQuery: (value: string) => updateFilter('searchQuery', value),
    setSelectedArea: (value: string) => updateFilter('selectedArea', value),
    setSelectedSector: (value: string) => updateFilter('selectedSector', value),
    setSelectedGrade: (value: string) => updateFilter('selectedGrade', value),
    setSelectedType: (value: string) => updateFilter('selectedType', value),
    resetFilters,
    buildUrlWithFilters,
  }
}
