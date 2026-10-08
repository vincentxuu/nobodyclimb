'use client'

import { AlertTriangle, Home, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

/**
 * 錯誤頁文案
 *
 * 本檔位於 `[locale]` 之外，不在 NextIntlClientProvider 內，無法使用 useTranslations，
 * 因此改由 pathname 判斷語系，並用這份小型內嵌字典（不載入整份訊息檔，避免錯誤頁 bundle 變大）。
 */
const ERROR_MESSAGES = {
  zh: {
    title: '頁面發生錯誤',
    description: '抱歉，載入此頁面時發生問題。請嘗試重新載入或返回首頁。',
    retry: '重試',
    home: '返回首頁',
  },
  en: {
    title: 'Something went wrong',
    description:
      'Sorry, there was a problem loading this page. Please try again or return to the homepage.',
    retry: 'Retry',
    home: 'Back to home',
  },
  ja: {
    title: 'エラーが発生しました',
    description:
      '申し訳ありません。ページの読み込み中に問題が発生しました。再試行するか、ホームに戻ってください。',
    retry: '再試行',
    home: 'ホームに戻る',
  },
} as const

type ErrorLocale = keyof typeof ERROR_MESSAGES

/** 由 pathname 第一段判斷語系；預設語系 zh 沒有前綴（localePrefix: 'as-needed'） */
function getLocaleFromPathname(pathname: string | null): ErrorLocale {
  const segment = pathname?.split('/')[1]
  return segment === 'en' || segment === 'ja' ? segment : 'zh'
}

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * 全域錯誤頁面（Next.js App Router）
 *
 * 處理路由級別的錯誤，包括：
 * - 伺服器端錯誤
 * - 客戶端導航錯誤
 * - 資料獲取錯誤
 */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const locale = getLocaleFromPathname(usePathname())
  const messages = ERROR_MESSAGES[locale]
  const homeHref = locale === 'zh' ? '/' : `/${locale}`

  useEffect(() => {
    // 記錄錯誤（生產環境可整合 Sentry 等服務）
    console.error('Route error:', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4">
      <div className="max-w-md text-center">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-destructive/10 p-3">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
        </div>

        <h1 className="mb-2 text-2xl font-bold">{messages.title}</h1>
        <p className="mb-6 text-muted-foreground">{messages.description}</p>

        {/* 開發環境顯示錯誤詳情 */}
        {isDevelopment && (
          <div className="mb-6 rounded-lg bg-muted p-4 text-left">
            <p className="mb-2 font-mono text-sm font-semibold text-destructive">{error.name}</p>
            <p className="mb-2 font-mono text-xs text-muted-foreground">{error.message}</p>
            {error.digest && (
              <p className="font-mono text-xs text-muted-foreground/60">Digest: {error.digest}</p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={reset} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            {messages.retry}
          </Button>
          <Button asChild className="gap-2">
            <Link href={homeHref}>
              <Home className="h-4 w-4" />
              {messages.home}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
