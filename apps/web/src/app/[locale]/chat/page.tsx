import type { Metadata } from 'next'
import { ChatClient } from './ChatClient'

export const metadata: Metadata = {
  title: 'AI 攀岩助手',
  description: '與 AI 攀岩助手對話，取得路線推薦、訓練建議和攀岩知識',
}

export default function ChatPage() {
  return <ChatClient />
}
