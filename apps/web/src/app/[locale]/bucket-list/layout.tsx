import { RouteMessages } from '@/i18n/route-messages'

export default function BucketListLayout({ children }: { children: React.ReactNode }) {
  return <RouteMessages route="bucket-list">{children}</RouteMessages>
}
