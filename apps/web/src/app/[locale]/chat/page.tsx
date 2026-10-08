import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'
import { buildHreflangAlternates } from '@/lib/i18n-metadata'
import { ChatClient } from './ChatClient'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Metadata.chat' })

  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      languages: buildHreflangAlternates('/chat'),
    },
  }
}

export default function ChatPage() {
  // ChatClient 用 useSearchParams 讀 ?session=，需要 Suspense 邊界才不會讓整頁退出靜態產生
  return (
    <Suspense>
      <ChatClient />
    </Suspense>
  )
}
