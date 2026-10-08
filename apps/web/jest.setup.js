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
const zhMessages = require('./messages/zh.json')
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
