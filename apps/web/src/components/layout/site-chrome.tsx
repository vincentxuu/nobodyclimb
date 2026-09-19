'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

// 判斷是否為 admin 或 chat 路徑（含 /en/admin、/ja/chat 等 locale 前綴）
const ADMIN_PATH_RE = /^\/(?:[a-z]{2}\/)?admin(?:\/|$)/
const CHAT_PATH_RE = /^\/(?:[a-z]{2}\/)?chat(?:\/|$)/

interface SiteChromeProps {
  children: ReactNode
  navbar: ReactNode
  footer: ReactNode
  /** 只在前台顯示的附加元素（分享邀請、AI 聊天 widget 等） */
  extras?: ReactNode
}

/**
 * 前台 shell：admin 路徑不套 Navbar / Footer，讓後台自己接管整個畫面。
 * root layout 是 Server Component 拿不到 pathname，所以用這個 client wrapper 判斷。
 * Navbar / Footer 以 slot 傳入，維持原本的 server / client 邊界。
 */
export function SiteChrome({ children, navbar, footer, extras }: SiteChromeProps) {
  const pathname = usePathname()
  const isAdmin = ADMIN_PATH_RE.test(pathname)
  const isChat = CHAT_PATH_RE.test(pathname)

  if (isAdmin || isChat) {
    return <main className="min-h-screen">{children}</main>
  }

  return (
    <>
      {navbar}
      <main className="min-h-[calc(100vh-14rem)] pt-14 md:pt-[70px]">{children}</main>
      {footer}
      {extras}
    </>
  )
}
