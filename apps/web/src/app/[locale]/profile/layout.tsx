import { RouteMessages } from '@/i18n/route-messages'
import ProfileLayoutClient from './ProfileLayoutClient'

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteMessages route="profile">
      <ProfileLayoutClient>{children}</ProfileLayoutClient>
    </RouteMessages>
  )
}
