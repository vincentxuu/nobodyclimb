'use client'

import React from 'react'
import { MapPin } from 'lucide-react'

interface MapCardProps {
  coordinates: {
    latitude: number
    longitude: number
  }
}

export const CragMapCard: React.FC<MapCardProps> = ({ coordinates }) => {
  return (
    <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
      <h3 className="mb-4 flex items-center text-xl font-bold">
        <MapPin size={20} className="mr-2 text-[#1B1A1A]" />
        位置地圖
      </h3>
      <div className="relative mb-4 h-64 w-full rounded-lg bg-gray-200">
        {/* 這裡實際使用時可以整合 Google Maps 或其他地圖服務 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-gray-600">地圖載入中...</p>
          <p className="absolute bottom-2 left-2 text-xs text-gray-400">
            座標: {coordinates.latitude}, {coordinates.longitude}
          </p>
        </div>
      </div>
      <div className="flex justify-between">
        <button className="mr-2 flex-1 rounded-md bg-[#1B1A1A] px-4 py-2 text-white transition hover:bg-black">
          導航前往
        </button>
        <button className="ml-2 flex-1 rounded-md bg-gray-100 px-4 py-2 text-[#1B1A1A] transition hover:bg-gray-200">
          查看完整地圖
        </button>
      </div>
    </div>
  )
}
