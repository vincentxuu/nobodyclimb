'use client'

import React from 'react'
import { Label } from '@/components/ui/label'

interface ProfileFormFieldProps {
  label: string
  children: React.ReactNode
  isMobile: boolean
}

export default function ProfileFormField({ label, children, isMobile }: ProfileFormFieldProps) {
  return (
    <div className="w-full space-y-2">
      <Label className={`font-medium text-[#3F3D3D] ${isMobile ? 'text-sm' : 'text-base'}`}>
        {label}
      </Label>
      {children}
    </div>
  )
}
