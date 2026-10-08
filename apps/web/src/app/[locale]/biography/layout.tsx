import type { Metadata } from 'next'
import { buildSectionMetadata } from '@/lib/section-metadata'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return buildSectionMetadata(locale, 'biography', '/biography')
}

export default function BiographyLayout({ children }: { children: React.ReactNode }) {
  return children
}
