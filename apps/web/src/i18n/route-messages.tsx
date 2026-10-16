import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { CORE_NAMESPACES, ROUTE_NAMESPACES } from './client-namespaces'

/** 只保留指定 namespace 的訊息，其餘不送進 client（降低 client payload）。 */
export function pickMessages(
  messages: Record<string, unknown>,
  namespaces: readonly string[]
): Record<string, unknown> {
  const picked: Record<string, unknown> = {}
  for (const ns of namespaces) {
    if (ns in messages) picked[ns] = messages[ns]
  }
  return picked
}

/** root layout 用：只把全域 chrome（navbar、footer、chat 等）需要的 namespace 送進 client。 */
export async function coreMessages(): Promise<Record<string, unknown>> {
  const messages = (await getMessages()) as Record<string, unknown>
  return pickMessages(messages, CORE_NAMESPACES)
}

/**
 * 各 route 用：把 core 加上該 route client 元件需要的 namespace 送進 client。
 *
 * 清單由 `scripts/i18n/analyze-namespaces.mjs emit` 依 import 關係靜態分析產生，
 * 新增用到新 namespace 的 client 元件後，記得重跑該指令。
 */
export async function RouteMessages({
  route,
  children,
}: {
  route: keyof typeof ROUTE_NAMESPACES | string
  children: React.ReactNode
}) {
  const messages = (await getMessages()) as Record<string, unknown>
  const extra = ROUTE_NAMESPACES[route] ?? []
  const picked = pickMessages(messages, [...CORE_NAMESPACES, ...extra])
  return <NextIntlClientProvider messages={picked}>{children}</NextIntlClientProvider>
}
