import { getRequestConfig } from 'next-intl/server'
// 訊息檔已依模組拆分至 messages/{locale}/{module}.json，由各語系的 index.ts 合併。
// 新增模組後重跑：node scripts/i18n/split-messages.mjs
import enMessages from '../../messages/en'
import jaMessages from '../../messages/ja'
import zhMessages from '../../messages/zh'
import { routing } from './routing'

const messagesByLocale = {
  zh: zhMessages,
  en: enMessages,
  ja: jaMessages,
} as const

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale

  // 確保 locale 有效，否則使用預設語言
  if (!locale || !routing.locales.includes(locale as 'zh' | 'en' | 'ja')) {
    locale = routing.defaultLocale
  }

  return {
    locale,
    messages: messagesByLocale[locale as keyof typeof messagesByLocale],
  }
})
