'use client'

import {
  Check,
  Copy,
  ExternalLink,
  Loader2,
  MountainSnow,
  RefreshCw,
  ThumbsDown,
  ThumbsUp,
  Youtube,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { memo, useState } from 'react'
import { ToolActivity } from '@/components/ai-elements/tool-activity'
import { Link } from '@/i18n/navigation'
import { useSubmitFeedback } from '@/lib/api/ai'
import type { ChatMessageData } from '@/lib/chat/messages'
import { formatChatError } from '@/lib/chat/messages'
import { cn } from '@/lib/utils'
import { SourceCard } from './SourceCard'

// =============================================
// Markdown 渲染（手寫 parser）
// 支援：**bold**、*italic*、## 標題、- 列表、`inline code`、
//       ```程式碼塊```、表格（| col |）、[text](url) 連結
// =============================================
export function MarkdownContent({ text }: { text: string }) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let listItems: string[] = []
  let codeLines: string[] = []
  let codeLang = ''
  let inCode = false
  let tableRows: string[][] = []
  let inTable = false

  const flushList = (key: string) => {
    if (listItems.length === 0) return
    elements.push(
      <ul key={key} className="my-1 space-y-0.5 pl-4 list-disc">
        {listItems.map((item, i) => (
          <li key={i}>{renderInline(item)}</li>
        ))}
      </ul>
    )
    listItems = []
  }

  const flushTable = (key: string) => {
    if (tableRows.length === 0) return
    const [headerRow, , ...bodyRows] = tableRows // 第二行是分隔線，跳過
    elements.push(
      <div key={key} className="overflow-x-auto my-1.5">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              {(headerRow ?? []).map((cell, i) => (
                <th
                  key={i}
                  className="border border-border px-2 py-1 bg-muted text-left font-semibold"
                >
                  {renderInline(cell.trim())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bodyRows.map((row, ri) => (
              <tr key={ri} className="even:bg-muted/30">
                {row.map((cell, ci) => (
                  <td key={ci} className="border border-border px-2 py-1">
                    {renderInline(cell.trim())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
    tableRows = []
    inTable = false
  }

  const renderInline = (line: string): React.ReactNode => {
    // 優先順序：markdown 連結 > 行內程式碼 > **bold** > *italic* > 裸 URL
    const parts = line.split(
      /(`[^`]+`|\[[^\]]+\]\([^)]+\)|\*\*[^*\n]+\*\*|\*[^*\n]+\*|https?:\/\/[^\s]+)/g
    )
    return parts.map((part, i) => {
      // 行內程式碼 `code`
      if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
        return (
          <code key={i} className="rounded bg-muted px-1 py-0.5 text-xs font-mono">
            {part.slice(1, -1)}
          </code>
        )
      }
      // Markdown 連結 [text](url)
      if (part.startsWith('[')) {
        const m = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
        if (m) {
          const linkText = m[1]
          const linkUrl = m[2]
          const isRoute = linkUrl.startsWith('/crag/')
          const isYoutube = linkUrl.includes('youtube.com') || linkUrl.includes('youtu.be')

          if (isRoute) {
            const innerBold = linkText.startsWith('**') && linkText.endsWith('**')
            const displayText = innerBold ? <strong>{linkText.slice(2, -2)}</strong> : linkText
            return (
              <Link
                key={i}
                href={linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 font-medium text-foreground underline underline-offset-2 hover:opacity-70"
              >
                <MountainSnow className="h-3.5 w-3.5 shrink-0" />
                {displayText}
              </Link>
            )
          }
          return (
            <a
              key={i}
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-primary underline underline-offset-2 hover:opacity-80"
            >
              {isYoutube ? (
                <Youtube className="h-3.5 w-3.5 shrink-0 text-red-500" />
              ) : (
                <ExternalLink className="h-3 w-3 shrink-0" />
              )}
              {linkText}
            </a>
          )
        }
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{renderInline(part.slice(2, -2))}</strong>
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
        return <em key={i}>{renderInline(part.slice(1, -1))}</em>
      }
      // 裸 URL
      if (part.startsWith('http://') || part.startsWith('https://')) {
        const isYoutube = part.includes('youtube.com') || part.includes('youtu.be')
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-primary underline break-all hover:opacity-80"
          >
            {isYoutube && <Youtube className="h-3.5 w-3.5 shrink-0 text-red-500" />}
            <span>{part}</span>
          </a>
        )
      }
      return part
    })
  }

  lines.forEach((line, i) => {
    const trimmed = line.trim()

    // 程式碼塊開始/結束
    if (trimmed.startsWith('```')) {
      if (!inCode) {
        flushList(`list-${i}`)
        flushTable(`table-${i}`)
        codeLang = trimmed.slice(3).trim()
        codeLines = []
        inCode = true
      } else {
        elements.push(
          <div key={`code-${i}`} className="my-1.5 rounded-lg overflow-hidden border border-border">
            {codeLang && (
              <div className="bg-muted px-3 py-1 text-xs text-muted-foreground font-mono border-b border-border">
                {codeLang}
              </div>
            )}
            <pre className="bg-muted/50 p-3 text-xs font-mono overflow-x-auto">
              <code>{codeLines.join('\n')}</code>
            </pre>
          </div>
        )
        inCode = false
        codeLang = ''
        codeLines = []
      }
      return
    }

    if (inCode) {
      codeLines.push(line)
      return
    }

    // 表格行（| col | col |）
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushList(`list-${i}`)
      inTable = true
      const cells = trimmed.slice(1, -1).split('|')
      tableRows.push(cells)
      return
    }

    // 結束表格
    if (inTable) {
      flushTable(`table-${i}`)
    }

    // ## 標題
    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)/)
    if (headingMatch) {
      flushList(`list-${i}`)
      const level = headingMatch[1].length
      const content = headingMatch[2]
      const className =
        level === 1
          ? 'font-bold text-sm mt-2 mb-0.5'
          : level === 2
            ? 'font-semibold text-sm mt-1.5 mb-0.5'
            : 'font-semibold text-xs mt-1 mb-0.5 text-muted-foreground'
      elements.push(
        <p key={i} className={className}>
          {renderInline(content)}
        </p>
      )
      return
    }

    // - 或 * 或 1. 列表
    const listMatch = trimmed.match(/^[-*]\s+(.+)/) || trimmed.match(/^\d+\.\s+(.+)/)
    if (listMatch) {
      listItems.push(listMatch[1])
    } else {
      flushList(`list-${i}`)
      if (trimmed === '') {
        elements.push(<div key={i} className="h-1" />)
      } else {
        elements.push(<p key={i}>{renderInline(trimmed)}</p>)
      }
    }
  })

  flushList('list-end')
  if (inCode && codeLines.length > 0) {
    // 未閉合的程式碼塊，仍嘗試渲染
    elements.push(
      <pre
        key="code-end"
        className="my-1.5 rounded-lg bg-muted/50 p-3 text-xs font-mono overflow-x-auto border border-border"
      >
        <code>{codeLines.join('\n')}</code>
      </pre>
    )
  }
  if (inTable) flushTable('table-end')

  return <div className="space-y-0.5">{elements}</div>
}

// =============================================
// ChatMessageData 型別（定義在 lib/chat/messages，與 useChatSession 共用）
// =============================================
export type { ChatMessageData }

interface ChatMessageProps {
  message: ChatMessageData
  isLast?: boolean
  onRegenerate?: () => void
  isPending?: boolean
}

// memo：串流時只有內容變動的那一則（最後一則）重繪；onRegenerate 需為穩定參考
export const ChatMessage = memo(function ChatMessage({
  message,
  isLast = false,
  onRegenerate,
  isPending = false,
}: ChatMessageProps) {
  const t = useTranslations('Chat')
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
  const [copied, setCopied] = useState(false)
  const { mutate: submitFeedback } = useSubmitFeedback()

  const isUser = message.role === 'user'
  const hasToolProgress = !!message.toolProgress && message.toolProgress.length > 0
  // 工具執行中由 ToolActivity 的摺疊列負責 loading；其餘等待時間顯示狀態文字：
  // 尚未呼叫工具 → 思考中；工具都完成、答案還沒出來 → 正在整理回答（agent 在此階段一次回傳整段答案，沒有 token）
  const isToolRunning = !!message.toolProgress?.some((p) => p.status === 'executing')
  const showThinking = !isUser && !!message.isStreaming && !message.content && !isToolRunning
  const waitingLabel = hasToolProgress ? t('composing') : t('thinking')

  // 錯誤 / 中斷提示依 status 顯示，不寫進 content（content 會進對話歷史）
  const errorText = message.error ? formatChatError(t, message.error) : null
  const isStopped = message.status === 'stopped'

  // 非串流的空訊息不渲染，避免空白氣泡（串流中改顯示思考中 / 工具過程）
  if (
    !isUser &&
    !message.content &&
    !message.isStreaming &&
    !hasToolProgress &&
    !errorText &&
    !isStopped
  )
    return null

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFeedback = (score: 1 | 5) => {
    if (!message.queryId || feedbackSubmitted) return
    submitFeedback(
      { query_id: message.queryId, score },
      { onSuccess: () => setFeedbackSubmitted(true) }
    )
  }

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div className="max-w-[85%] space-y-2">
        {/* 工具使用過程（僅助理訊息，仿 Claude 摺疊列） */}
        {!isUser && hasToolProgress && (
          <ToolActivity
            events={message.toolProgress ?? []}
            isStreaming={!!message.isStreaming}
            className="pl-1"
          />
        )}

        {/* 串流中尚無內容：思考中提示 */}
        {showThinking && (
          <p className="flex items-center gap-1.5 pl-1 text-sm text-muted-foreground">
            <Loader2 className="size-3.5 shrink-0 animate-spin" />
            <span className="text-shimmer">{waitingLabel}</span>
          </p>
        )}

        {/* 訊息氣泡 */}
        {(isUser || message.content) && (
          <div
            className={cn(
              'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
              isUser
                ? 'bg-primary text-primary-foreground rounded-br-sm'
                : 'bg-muted text-foreground rounded-bl-sm'
            )}
          >
            {isUser ? (
              <span className="whitespace-pre-wrap">{message.content}</span>
            ) : (
              <MarkdownContent text={message.content} />
            )}
          </div>
        )}

        {/* 沒有任何內容的錯誤：提示本身就是氣泡 */}
        {errorText && !message.content && (
          <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-2.5 text-sm leading-relaxed text-foreground">
            <span className="whitespace-pre-wrap">{errorText}</span>
          </div>
        )}

        {/* 已有部分內容的錯誤 / 使用者中斷：在氣泡下方附註 */}
        {errorText && message.content && (
          <p className="pl-1 text-xs text-muted-foreground">{errorText}</p>
        )}
        {isStopped && <p className="pl-1 text-xs text-muted-foreground">{t('stopped')}</p>}

        {/* 來源卡片（僅助理訊息） */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="space-y-1.5 pl-1">
            <p className="text-xs text-muted-foreground">{t('sources')}</p>
            {message.sources.map((source) => (
              <SourceCard key={source.id} source={source} />
            ))}
          </div>
        )}

        {/* 操作按鈕列（僅助理訊息，串流結束後才顯示） */}
        {!isUser && !message.isStreaming && message.content && (
          <div className="flex items-center gap-1 pl-1">
            {/* 複製按鈕 */}
            <button
              onClick={handleCopy}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label={t('copyAria')}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>

            {/* 重新生成按鈕（僅最後一則 AI 訊息；錯誤訊息不提供，後端可能沒有寫入這一輪） */}
            {isLast && onRegenerate && message.status !== 'error' && (
              <button
                onClick={onRegenerate}
                disabled={isPending}
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-40"
                aria-label={t('regenerateAria')}
              >
                <RefreshCw className={cn('h-3.5 w-3.5', isPending && 'animate-spin')} />
              </button>
            )}

            {/* 回饋按鈕（需有 queryId） */}
            {message.queryId &&
              (feedbackSubmitted ? (
                <span className="text-xs text-muted-foreground">{t('thanksFeedback')}</span>
              ) : (
                <>
                  <button
                    onClick={() => handleFeedback(5)}
                    className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    aria-label={t('goodAria')}
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleFeedback(1)}
                    className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    aria-label={t('badAria')}
                  >
                    <ThumbsDown className="h-3.5 w-3.5" />
                  </button>
                </>
              ))}
          </div>
        )}
      </div>
    </div>
  )
})
