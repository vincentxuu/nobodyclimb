import { RouteMessages } from '@/i18n/route-messages'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <RouteMessages route="auth">{children}</RouteMessages>
}
