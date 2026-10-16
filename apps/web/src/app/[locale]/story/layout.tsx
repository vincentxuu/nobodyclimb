import { RouteMessages } from '@/i18n/route-messages'

export default function StoryLayout({ children }: { children: React.ReactNode }) {
  return <RouteMessages route="story">{children}</RouteMessages>
}
