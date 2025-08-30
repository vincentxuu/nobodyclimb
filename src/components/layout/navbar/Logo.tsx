'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'

/**
 * Logo 組件
 * 顯示網站 Logo，並支援點擊回到首頁
 */
export default function Logo() {
  const router = useRouter()

  return (
    <div className="flex h-[70px] items-center bg-[#FFE70C] px-6">
      <div
        className="flex cursor-pointer items-center"
        onClick={() => router.push('/')}
        role="button"
        aria-label="前往首頁"
      >
        <Image 
          src="/logo/Nobodylimb-black.svg" 
          alt="NobodyClimb Logo" 
          width={120} 
          height={32}
          priority
          className="h-8 w-auto" 
        />
      </div>
    </div>
  )
}
