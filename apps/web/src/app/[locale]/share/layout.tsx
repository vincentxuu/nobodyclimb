import { RouteMessages } from '@/i18n/route-messages'

export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return <RouteMessages route="share">{children}</RouteMessages>
}
