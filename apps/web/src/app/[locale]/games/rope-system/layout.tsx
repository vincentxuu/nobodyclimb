import type { Metadata } from 'next'
import { buildSectionMetadata } from '@/lib/section-metadata'

interface RopeSystemLayoutProps {
  children: React.ReactNode
}

type MetadataProps = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: MetadataProps): Promise<Metadata> {
  const { locale } = await params
  return buildSectionMetadata(locale, 'ropeSystem', '/games/rope-system', {
    titleWithSiteName: true,
  })
}

export default function RopeSystemLayout({ children }: RopeSystemLayoutProps) {
  return <div className="min-h-screen bg-[#F5F5F5]">{children}</div>
}
