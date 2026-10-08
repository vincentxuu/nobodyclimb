import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { QuizLayoutWrapper } from '@/components/quiz/QuizLayoutWrapper'
import { Link } from '@/i18n/navigation'

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function QuizLayout({ children, params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Quiz' })

  return (
    <QuizLayoutWrapper>
      <div className="flex min-h-screen flex-col">
        <header className="flex h-14 items-center border-b border-gray-100 px-4 md:h-16 md:px-6">
          <Link href="/" aria-label={t('homeAria')}>
            <Image
              src="/logo/Nobodylimb-black.svg"
              alt="NobodyClimb Logo"
              width={120}
              height={32}
              priority
              className="h-6 w-auto md:h-8"
            />
          </Link>
        </header>
        <div className="flex-1">{children}</div>
      </div>
    </QuizLayoutWrapper>
  )
}
