import type { Metadata } from 'next'
import { buildSectionMetadata } from '@/lib/section-metadata'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return buildSectionMetadata(locale, 'gym', '/gym')
}

export default function GymLayout({ children }: { children: React.ReactNode }) {
  return children
}
