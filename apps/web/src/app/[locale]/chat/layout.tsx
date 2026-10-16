import type { ReactNode } from 'react'
import { RouteMessages } from '@/i18n/route-messages'

export default function ChatLayout({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <RouteMessages route="chat">{children}</RouteMessages>
    </div>
  )
}
