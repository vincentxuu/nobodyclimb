import { RouteMessages } from '@/i18n/route-messages'

export default function UploadLayout({ children }: { children: React.ReactNode }) {
  return <RouteMessages route="upload">{children}</RouteMessages>
}
