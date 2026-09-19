// jest.setup.js 全域 mock 的 next-intl 只有 zh 且不支援巢狀 key / t.raw，這裡改用真實實作驗證三種語言
jest.unmock('next-intl')

import { fireEvent, render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import type { AIStreamProgressEvent } from '@/lib/api/ai'
import en from '../../../../messages/en.json'
import ja from '../../../../messages/ja.json'
import zh from '../../../../messages/zh.json'
import { ToolActivity } from '../tool-activity'

const MESSAGES = { zh, en, ja } as const

function renderWith(
  locale: keyof typeof MESSAGES,
  events: AIStreamProgressEvent[],
  isStreaming = false
) {
  return render(
    <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]}>
      <ToolActivity events={events} isStreaming={isStreaming} />
    </NextIntlClientProvider>
  )
}

const EVENTS: AIStreamProgressEvent[] = [
  { id: 'c1', tool: 'user_profile', status: 'executing', input: { user_id: 'u1' } },
  { id: 'c1', tool: 'user_profile', status: 'done', output: '完攀 12 條', duration_ms: 320 },
  { id: 'c2', tool: 'search_routes', status: 'executing', input: { query: '龍洞 5.10' } },
]

describe('ToolActivity', () => {
  it('串流中顯示目前工具與進度（zh）', () => {
    renderWith('zh', EVENTS, true)
    expect(screen.getByText('正在搜尋路線…（1/2）')).toBeInTheDocument()
  })

  it('完成後顯示步驟數並可展開看 Request / Response', () => {
    const done: AIStreamProgressEvent[] = [
      ...EVENTS,
      { id: 'c2', tool: 'search_routes', status: 'done', output: '找到 3 條', duration_ms: 800 },
    ]
    renderWith('zh', done, false)
    fireEvent.click(screen.getByText('已完成 2 個查詢步驟'))
    expect(screen.getByText('龍洞 5.10')).toBeInTheDocument()
    fireEvent.click(screen.getByText('龍洞 5.10'))
    expect(screen.getByText('Request')).toBeInTheDocument()
    expect(screen.getByText('Response')).toBeInTheDocument()
    expect(screen.getByText('找到 3 條')).toBeInTheDocument()
    expect(screen.getByText('耗時 800ms')).toBeInTheDocument()
  })

  it('依 locale 切換標籤（en / ja）', () => {
    const { unmount } = renderWith('en', EVENTS, true)
    expect(screen.getByText('Searching routes… (1/2)')).toBeInTheDocument()
    unmount()
    renderWith('ja', EVENTS, true)
    expect(screen.getByText('ルート検索中…（1/2）')).toBeInTheDocument()
  })

  it('未知 tool 名稱退回原名，錯誤顯示 Error 區', () => {
    renderWith('zh', [
      {
        id: 'x',
        tool: 'mcp_custom',
        status: 'done',
        input: { q: 'a' },
        output: 'boom',
        is_error: true,
      },
    ])
    fireEvent.click(screen.getByText('已mcp_custom'))
    fireEvent.click(screen.getByText('a'))
    expect(screen.getByText('Error')).toBeInTheDocument()
    expect(screen.getByText('boom')).toBeInTheDocument()
  })
})
