'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { RefreshCw, TrendingUp } from 'lucide-react'
import { useTranslations } from 'next-intl'
import EvolutionTimeline from '@/components/profile/evolution/EvolutionTimeline'
import StyleSpectrumCard from '@/components/profile/evolution/StyleSpectrumCard'
import ProfilePageLayout from '@/components/profile/layout/ProfilePageLayout'
import ProfilePageTitle from '@/components/profile/ProfilePageTitle'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/components/ui/use-toast'
import { evolutionApi } from '@/lib/api/evolution'
import { useEvolutionTimeline } from '@/lib/hooks/useEvolutionTimeline'
import { useStyleSpectrum } from '@/lib/hooks/useStyleSpectrum'

export default function EvolutionPage() {
  const t = useTranslations('ProfileEvolution')
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: timeline, isLoading: timelineLoading } = useEvolutionTimeline()
  const { data: spectrum, isLoading: spectrumLoading } = useStyleSpectrum()

  const calculateMutation = useMutation({
    mutationFn: async () => {
      const { data } = await evolutionApi.calculateEvolution()
      return data.data
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['quiz', 'evolution'] })
      if (result.changed) {
        toast({
          description: t('toastEvolved', { type: result.personality_type ?? '' }),
        })
      } else {
        toast({
          description: result.reason || t('toastUnchanged'),
        })
      }
    },
    onError: (error: Error & { response?: { status?: number } }) => {
      const status = error?.response?.status
      if (status === 429) {
        toast({
          variant: 'destructive',
          description: t('toastRateLimited'),
        })
      } else {
        toast({
          variant: 'destructive',
          description: t('toastCalculateFailed'),
        })
      }
    },
  })

  return (
    <ProfilePageLayout>
      <div className="space-y-6">
        <ProfilePageTitle
          title={t('pageTitle')}
          subtitle={t('pageSubtitle')}
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => calculateMutation.mutate()}
              disabled={calculateMutation.isPending}
              className="gap-1.5"
            >
              <RefreshCw
                className={`h-4 w-4 ${calculateMutation.isPending ? 'animate-spin' : ''}`}
              />
              {t('calculateNow')}
            </Button>
          }
        />

        {/* 攀岩光譜卡片 */}
        <StyleSpectrumCard data={spectrum} isLoading={spectrumLoading} />

        {/* 演化時間軸 */}
        <motion.div
          className="rounded-lg bg-white p-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-[#1B1A1A]">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            {t('timelineTitle')}
          </h2>

          {timelineLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : (
            <EvolutionTimeline records={timeline ?? []} />
          )}
        </motion.div>
      </div>
    </ProfilePageLayout>
  )
}
