import type { Metadata } from 'next'
import { buildSectionMetadata } from '@/lib/section-metadata'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return buildSectionMetadata(locale, 'gallery', '/gallery')
}

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return children
}
