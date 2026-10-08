'use client'

import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  Dumbbell,
  Flag,
  Mountain,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import ProfilePageLayout from '@/components/profile/layout/ProfilePageLayout'
import ProfilePageTitle from '@/components/profile/ProfilePageTitle'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import type {
  CoachingAnalysis,
  CoachingExercise,
  CoachingGoal,
  CoachingLevelRecommendation,
  CoachingPersonality,
  CoachingTrainingProgress,
  CoachingWeakness,
} from '@/lib/api/ai'
import { getCoachingAnalysis } from '@/lib/api/ai'

export default function TrainingPage() {
  const t = useTranslations('ProfileTraining')
  const { data, isLoading, error } = useQuery({
    queryKey: ['coaching-analysis'],
    queryFn: getCoachingAnalysis,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  return (
    <ProfilePageLayout>
      <div className="mx-auto max-w-3xl px-4 py-6">
        <ProfilePageTitle title={t('pageTitle')} subtitle={t('pageSubtitle')} isAI />

        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-dashed border-gray-200 py-12 text-center">
            <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-400">{t('loadFailed')}</p>
            <p className="mx-auto mt-2 max-w-xs text-xs text-gray-300">{t('loadFailedHint')}</p>
          </div>
        ) : data ? (
          <div className="space-y-6">
            <OverviewCard data={data} />
            {data.weaknesses.length > 0 && <WeaknessSection weaknesses={data.weaknesses} />}
            {data.levelRecommendation && (
              <LevelRecommendationSection recommendation={data.levelRecommendation} />
            )}
            {data.trainingProgress && <ProgressSection progress={data.trainingProgress} />}
            {data.goals.length > 0 && <GoalsSection goals={data.goals} />}
            {!data.personality && <PersonalityCTA />}
          </div>
        ) : null}
      </div>
    </ProfilePageLayout>
  )
}

function OverviewCard({ data }: { data: CoachingAnalysis }) {
  const t = useTranslations('ProfileTraining')
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-xs">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
            <Mountain className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-800">{data.level}</p>
            <p className="text-xs text-gray-500">
              {t('overviewStats', { ascents: data.totalAscents, crags: data.uniqueCrags })}
            </p>
          </div>
        </div>
        {data.personality && <PersonalityBadge personality={data.personality} />}
      </div>
      {data.personality && (
        <div className="mt-4 border-t border-gray-50 pt-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Brain className="h-3.5 w-3.5" />
            <span>{t('trainingSchool', { school: data.personality.trainingSchool })}</span>
          </div>
          <p className="mt-1 text-xs text-gray-400">{data.personality.schoolDescription}</p>
        </div>
      )}
    </div>
  )
}

function PersonalityBadge({ personality }: { personality: CoachingPersonality }) {
  return (
    <div className="flex items-center gap-2">
      <Badge className="bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
        {personality.nameZh}
      </Badge>
      <span className="text-xs text-gray-400">{personality.keywords.slice(0, 3).join(' · ')}</span>
    </div>
  )
}

function WeaknessSection({ weaknesses }: { weaknesses: CoachingWeakness[] }) {
  const t = useTranslations('ProfileTraining')
  return (
    <div>
      <SectionTitle icon={<Target className="h-4 w-4" />} title={t('weaknessTitle')} />
      <div className="space-y-3">
        {weaknesses.map((w) => (
          <div key={w.id} className="rounded-lg border border-gray-100 bg-white p-4 shadow-xs">
            <p className="text-sm text-gray-700">{w.description}</p>
            {w.exercises.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {w.exercises.map((ex) => (
                  <Badge
                    key={ex}
                    className="bg-blue-50 px-2 py-0.5 text-[11px] font-normal text-blue-600"
                  >
                    {ex}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function LevelRecommendationSection({
  recommendation,
}: {
  recommendation: CoachingLevelRecommendation
}) {
  const t = useTranslations('ProfileTraining')
  return (
    <div>
      <SectionTitle icon={<Dumbbell className="h-4 w-4" />} title={t('levelTitle')} />
      <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-xs">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-800">{recommendation.label}</p>
            <p className="text-xs text-gray-500">
              {t('daysPerWeek', {
                min: recommendation.daysPerWeek[0],
                max: recommendation.daysPerWeek[1],
              })}
            </p>
          </div>
        </div>

        {recommendation.focusAreas.length > 0 && (
          <div className="mb-3">
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-600">
              <TrendingUp className="h-3 w-3" />
              {t('focusAreas')}
            </p>
            <ul className="space-y-1">
              {recommendation.focusAreas.slice(0, 4).map((area) => (
                <li key={area} className="text-xs text-gray-500">
                  · {area}
                </li>
              ))}
            </ul>
          </div>
        )}

        {recommendation.avoid.length > 0 && (
          <div className="mb-4">
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-red-500">
              <ShieldAlert className="h-3 w-3" />
              {t('avoid')}
            </p>
            <ul className="space-y-1">
              {recommendation.avoid.map((item) => (
                <li key={item} className="text-xs text-gray-500">
                  · {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {recommendation.exercises.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-gray-600">{t('recommendedExercises')}</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-gray-400">
                    <th className="pb-2 pr-4 font-medium">{t('colExercise')}</th>
                    <th className="pb-2 pr-4 font-medium">{t('colReps')}</th>
                    <th className="pb-2 pr-4 font-medium">{t('colSets')}</th>
                    <th className="pb-2 font-medium">{t('colFrequency')}</th>
                  </tr>
                </thead>
                <tbody>
                  {recommendation.exercises.slice(0, 8).map((ex) => (
                    <ExerciseRow key={ex.nameZh} exercise={ex} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ExerciseRow({ exercise }: { exercise: CoachingExercise }) {
  const t = useTranslations('ProfileTraining')
  return (
    <tr className="border-b border-gray-50 text-gray-600">
      <td className="py-2 pr-4 font-medium">{exercise.nameZh}</td>
      <td className="py-2 pr-4">{exercise.reps}</td>
      <td className="py-2 pr-4">
        {exercise.sets[0] === exercise.sets[1]
          ? t('sets', { count: exercise.sets[0] })
          : t('setsRange', { min: exercise.sets[0], max: exercise.sets[1] })}
      </td>
      <td className="py-2">
        {exercise.sessionsPerWeek[0] === exercise.sessionsPerWeek[1]
          ? t('perWeek', { count: exercise.sessionsPerWeek[0] })
          : t('perWeekRange', {
              min: exercise.sessionsPerWeek[0],
              max: exercise.sessionsPerWeek[1],
            })}
      </td>
    </tr>
  )
}

function ProgressSection({ progress }: { progress: CoachingTrainingProgress }) {
  const t = useTranslations('ProfileTraining')
  const percentage = Math.round(progress.completionRate)

  return (
    <div>
      <SectionTitle icon={<Sparkles className="h-4 w-4" />} title={t('progressTitle')} />
      <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-5">
          <ProgressRing percentage={percentage} />
          <div>
            <p className="text-sm font-medium text-gray-800">
              {t('progressSummary', { completed: progress.completed, total: progress.total })}
            </p>
            {progress.lastCompleted && (
              <p className="mt-1 text-xs text-gray-500">
                {t('lastCompleted', {
                  week: progress.lastCompleted.week,
                  day: progress.lastCompleted.day,
                })}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ProgressRing({ percentage }: { percentage: number }) {
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="4" />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="#10b981"
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-700">
        {percentage}%
      </span>
    </div>
  )
}

function GoalsSection({ goals }: { goals: CoachingGoal[] }) {
  const t = useTranslations('ProfileTraining')
  return (
    <div>
      <SectionTitle icon={<Flag className="h-4 w-4" />} title={t('goalsTitle')} />
      <div className="rounded-lg border border-gray-100 bg-white shadow-xs">
        <ul className="divide-y divide-gray-50">
          {goals.map((g) => (
            <li key={g.title} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-700">{g.title}</p>
                <p className="text-xs text-gray-400">
                  {t('goalTarget', { target: g.target })}
                  {g.currentProgress && ` · ${t('goalCurrent', { value: g.currentProgress })}`}
                </p>
              </div>
              <Badge
                className={
                  g.status === 'active'
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-gray-100 text-gray-500'
                }
              >
                {g.status === 'active' ? t('statusActive') : g.status}
              </Badge>
            </li>
          ))}
        </ul>
        <div className="border-t border-gray-50 px-4 py-2.5">
          <Link
            href="/profile/goals"
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
          >
            {t('manageGoals')}
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  )
}

function PersonalityCTA() {
  const t = useTranslations('ProfileTraining')
  return (
    <div className="rounded-lg border border-dashed border-amber-200 bg-amber-50/50 p-5 text-center">
      <Brain className="mx-auto mb-2 h-7 w-7 text-amber-500" />
      <p className="text-sm font-medium text-gray-700">{t('quizCtaTitle')}</p>
      <p className="mx-auto mt-1 max-w-xs text-xs text-gray-400">{t('quizCtaDesc')}</p>
      <Link href="/quiz">
        <Button size="sm" className="mt-3">
          {t('quizCtaButton')}
        </Button>
      </Link>
    </div>
  )
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
      {icon}
      {title}
    </h2>
  )
}
