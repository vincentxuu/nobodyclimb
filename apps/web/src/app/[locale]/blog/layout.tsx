import type { Metadata } from 'next'
import { buildSectionMetadata } from '@/lib/section-metadata'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return buildSectionMetadata(locale, 'blog', '/blog')
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children
}
