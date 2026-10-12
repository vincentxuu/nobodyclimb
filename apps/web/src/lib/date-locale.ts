import type { Locale as DateFnsLocale } from 'date-fns'
import { enUS, ja, zhTW } from 'date-fns/locale'

/**
 * 日期語系共用工具
 *
 * 把 next-intl 的 locale（zh / en / ja）對應到：
 * - Intl / toLocaleDateString 用的 BCP 47 語系代碼
 * - date-fns 的 locale 物件
 *
 * 用法（client component）：
 *   const locale = useLocale()
 *   new Date(x).toLocaleDateString(toIntlLocale(locale))
 *   formatDistanceToNow(d, { addSuffix: true, locale: getDateFnsLocale(locale) })
 */

const DEFAULT_LOCALE = 'zh'

const intlLocaleMap: Record<string, string> = {
  zh: 'zh-TW',
  en: 'en-US',
  ja: 'ja-JP',
}

const dateFnsLocaleMap: Record<string, DateFnsLocale> = {
  zh: zhTW,
  en: enUS,
  ja,
}

/** next-intl locale → Intl 語系代碼（未知語系退回 zh-TW） */
export function toIntlLocale(locale?: string | null): string {
  return intlLocaleMap[locale ?? DEFAULT_LOCALE] ?? intlLocaleMap[DEFAULT_LOCALE]
}

/** next-intl locale → date-fns locale 物件（未知語系退回 zhTW） */
export function getDateFnsLocale(locale?: string | null): DateFnsLocale {
  return dateFnsLocaleMap[locale ?? DEFAULT_LOCALE] ?? dateFnsLocaleMap[DEFAULT_LOCALE]
}

/**
 * 取得「今天 / 昨天」這類相對日期的在地化字樣
 * 用 Intl.RelativeTimeFormat 產生，不需額外維護字典
 * @param dayOffset 0 = 今天、-1 = 昨天、1 = 明天
 */
export function getRelativeDayLabel(dayOffset: number, locale?: string | null): string {
  const label = new Intl.RelativeTimeFormat(toIntlLocale(locale), { numeric: 'auto' }).format(
    dayOffset,
    'day'
  )
  // 英文會回傳小寫的 today / yesterday，放句首時首字大寫
  return label.charAt(0).toUpperCase() + label.slice(1)
}
