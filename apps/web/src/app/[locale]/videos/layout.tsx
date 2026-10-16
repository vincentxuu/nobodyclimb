import type { Metadata } from 'next'
import { RouteMessages } from '@/i18n/route-messages'
import { buildSectionMetadata } from '@/lib/section-metadata'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return buildSectionMetadata(locale, 'videos', '/videos')
}

export default function VideosLayout({ children }: { children: React.ReactNode }) {
  return <RouteMessages route="videos">{children}</RouteMessages>
}
