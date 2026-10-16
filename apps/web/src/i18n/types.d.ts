import type messages from '../../messages/zh'

declare module 'next-intl' {
  interface AppConfig {
    Messages: typeof messages
  }
}
