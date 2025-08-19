'use client'

import React from 'react'

interface ProfileTextDisplayProps {
  text: string
  minHeight?: string
  isMobile: boolean
}

export default function ProfileTextDisplay({
  text,
  minHeight = 'auto',
  isMobile,
}: ProfileTextDisplayProps) {
  return (
    <div
      className={`w-full rounded-sm border border-[#B6B3B3] bg-white p-3 ${minHeight} ${isMobile ? 'text-sm' : 'text-base'}`}
    >
      {text}
    </div>
  )
}
