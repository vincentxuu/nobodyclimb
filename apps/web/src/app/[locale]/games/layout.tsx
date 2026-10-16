import { RouteMessages } from '@/i18n/route-messages'

export default function GamesLayout({ children }: { children: React.ReactNode }) {
  return <RouteMessages route="games">{children}</RouteMessages>
}
