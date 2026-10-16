import '@testing-library/jest-dom'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}))

// Mock next-intl with real zh translations
// 訊息檔已依模組拆分到 messages/zh/*.json，這裡合併回單一物件
const fs = require('node:fs')
const path = require('node:path')
const zhMessagesDir = path.join(__dirname, 'messages', 'zh')
const zhMessages = {}
for (const file of fs.readdirSync(zhMessagesDir)) {
  if (file.endsWith('.json')) {
    Object.assign(zhMessages, JSON.parse(fs.readFileSync(path.join(zhMessagesDir, file), 'utf8')))
  }
}
jest.mock('next-intl', () => ({
  useTranslations: (namespace) => {
    const msgs = namespace ? zhMessages[namespace] || {} : zhMessages
    return (key, values) => {
      // 支援巢狀 key（如 'types.redpoint.label'），與 next-intl 行為一致
      let msg =
        msgs[key] ??
        String(key)
          .split('.')
          .reduce(
            (node, part) => (node && typeof node === 'object' ? node[part] : undefined),
            msgs
          ) ??
        key
      if (values && typeof msg === 'string') {
        Object.entries(values).forEach(([k, v]) => {
          msg = msg.replace(`{${k}}`, String(v))
        })
      }
      return msg
    }
  },
  useLocale: () => 'zh',
  useMessages: () => zhMessages,
  useNow: () => new Date(),
  useTimeZone: () => 'Asia/Taipei',
  NextIntlClientProvider: ({ children }) => <>{children}</>,
}))

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || ''} />
  },
}))
