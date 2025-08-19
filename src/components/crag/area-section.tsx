'use client'

import React from 'react'
import PlaceholderImage from '@/components/ui/placeholder-image'

interface CragAreaSectionProps {
  areas: Array<{
    name: string
    description: string
    difficulty: string
    routes: number
    image?: string
  }>
}

export const CragAreaSection: React.FC<CragAreaSectionProps> = ({ areas }) => {
  return (
    <div>
      <h2 className="mb-6 border-l-4 border-[#FFE70C] pl-4 text-2xl font-bold">岩區詳情</h2>
      <div className="space-y-10">
        {areas.map((area, index) => (
          <div
            key={index}
            className="grid grid-cols-1 gap-6 border-b border-gray-200 pb-10 last:border-0 md:grid-cols-3"
          >
            <div className="relative h-60 overflow-hidden rounded-lg">
              <PlaceholderImage text={`${area.name} 岩區`} bgColor="#E0F2FE" />
            </div>
            <div className="md:col-span-2">
              <h3 className="mb-3 text-xl font-bold">{area.name}</h3>
              <p className="mb-4 text-gray-700">{area.description}</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="mb-1 text-sm text-gray-500">難度範圍</p>
                  <p className="font-semibold">{area.difficulty}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="mb-1 text-sm text-gray-500">路線數量</p>
                  <p className="font-semibold">{area.routes}+</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
