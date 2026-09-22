import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ChatClient } from './ChatClient'

export const metadata: Metadata = {
  title: 'AI 攀岩助手',
  description: '與 AI 攀岩助手對話，取得路線推薦、訓練建議和攀岩知識',
}

export default function ChatPage() {
  // ChatClient 用 useSearchParams 讀 ?session=，需要 Suspense 邊界才不會讓整頁退出靜態產生
  return (
    <Suspense>
      <ChatClient />
    </Suspense>
  )
}
