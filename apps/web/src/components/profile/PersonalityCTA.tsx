'use client'

import { Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

interface PersonalityCTAProps {
  className?: string
}

export function PersonalityCTA({ className }: PersonalityCTAProps) {
  const t = useTranslations('ProfileSections')
  return (
    <Link
      href="/quiz"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-xl border border-dashed border-gray-300 px-3 py-1.5 text-sm text-gray-500 transition-colors hover:border-brand-dark hover:text-brand-dark',
        className
      )}
    >
      <Sparkles className="h-3.5 w-3.5" />
      <span>{t('personality.cta')}</span>
    </Link>
  )
}
