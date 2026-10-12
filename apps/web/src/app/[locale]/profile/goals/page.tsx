'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { Check, ChevronDown, ChevronUp, Flag, Plus, Trash2, Trophy, X } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import ProfilePageLayout from '@/components/profile/layout/ProfilePageLayout'
import ProfilePageTitle from '@/components/profile/ProfilePageTitle'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/components/ui/use-toast'
import type { UserGoal } from '@/lib/api/ai'
import { achieveGoal, createGoal, deleteGoal, getGoals } from '@/lib/api/ai'
import { getDateFnsLocale } from '@/lib/date-locale'

// goal_type 是存進後端的值；顯示名稱與 placeholder 依語系查訊息檔 `ProfileGoals.types.*`
const GOAL_TYPES = ['grade', 'route', 'volume', 'custom'] as const
type GoalType = (typeof GOAL_TYPES)[number]

function isGoalType(value: string): value is GoalType {
  return (GOAL_TYPES as readonly string[]).includes(value)
}

const GOAL_TYPE_COLORS: Record<string, string> = {
  grade: 'bg-orange-100 text-orange-700',
  route: 'bg-blue-100 text-blue-700',
  volume: 'bg-purple-100 text-purple-700',
  custom: 'bg-gray-100 text-gray-700',
}

export default function GoalsPage() {
  const t = useTranslations('ProfileGoals')
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [showForm, setShowForm] = useState(false)
  const [showAchieved, setShowAchieved] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [achievingId, setAchievingId] = useState<string | null>(null)

  // Form state
  const [formType, setFormType] = useState<GoalType>('grade')
  const [formTitle, setFormTitle] = useState('')
  const [formTarget, setFormTarget] = useState('')
  const [formDate, setFormDate] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: getGoals,
  })

  const createMutation = useMutation({
    mutationFn: createGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      toast({ description: t('toastCreated') })
      setShowForm(false)
      setFormTitle('')
      setFormTarget('')
      setFormDate('')
    },
    onError: () => {
      toast({ variant: 'destructive', description: t('toastCreateFailed') })
    },
  })

  const achieveMutation = useMutation({
    mutationFn: achieveGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      toast({ description: t('toastAchieved') })
      setAchievingId(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      toast({ description: t('toastDeleted') })
    },
  })

  const goals = data ?? []
  const activeGoals = useMemo(() => goals.filter((g) => g.status === 'active'), [goals])
  const achievedGoals = useMemo(() => goals.filter((g) => g.status === 'achieved'), [goals])

  const handleSubmit = () => {
    if (!formTitle.trim() || !formTarget.trim()) return
    createMutation.mutate({
      goal_type: formType,
      title: formTitle.trim(),
      target: formTarget.trim(),
      target_date: formDate || undefined,
    })
  }

  return (
    <ProfilePageLayout>
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="flex items-center justify-between">
          <ProfilePageTitle title={t('pageTitle')} subtitle={t('pageSubtitle')} isAI />
          {!showForm && (
            <Button size="sm" onClick={() => setShowForm(true)} className="flex items-center gap-1">
              <Plus className="h-4 w-4" />
              {t('addGoal')}
            </Button>
          )}
        </div>

        {/* 新增目標表單 */}
        {showForm && (
          <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">{t('addGoal')}</span>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-gray-500">{t('typeLabel')}</label>
                <div className="flex flex-wrap gap-2">
                  {GOAL_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => setFormType(type)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        formType === type
                          ? 'bg-gray-800 text-white'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {t(`types.${type}.label`)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">{t('titleLabel')}</label>
                <Input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder={t(`types.${formType}.titlePlaceholder`)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">{t('targetLabel')}</label>
                <Input
                  value={formTarget}
                  onChange={(e) => setFormTarget(e.target.value)}
                  placeholder={t(`types.${formType}.targetPlaceholder`)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">{t('dateLabel')}</label>
                <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
              </div>
              <Button
                onClick={handleSubmit}
                disabled={!formTitle.trim() || !formTarget.trim() || createMutation.isPending}
                className="w-full"
              >
                {createMutation.isPending ? t('creating') : t('createGoal')}
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : activeGoals.length === 0 && achievedGoals.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 py-12 text-center">
            <Flag className="mx-auto mb-3 h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-400">{t('emptyTitle')}</p>
            <p className="mx-auto mt-2 max-w-xs text-xs text-gray-300">{t('emptyHint')}</p>
          </div>
        ) : (
          <>
            {/* Active 目標 */}
            {activeGoals.length > 0 && (
              <ul className="space-y-3">
                {activeGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onAchieve={() => setAchievingId(goal.id)}
                    onDelete={() => setDeletingId(goal.id)}
                  />
                ))}
              </ul>
            )}

            {/* Achieved 目標（摺疊） */}
            {achievedGoals.length > 0 && (
              <div className="mt-6">
                <button
                  onClick={() => setShowAchieved(!showAchieved)}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
                >
                  <Trophy className="h-4 w-4 text-amber-500" />
                  {t('achievedWithCount', { count: achievedGoals.length })}
                  {showAchieved ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </button>
                {showAchieved && (
                  <ul className="mt-3 space-y-3">
                    {achievedGoals.map((goal) => (
                      <GoalCard key={goal.id} goal={goal} onDelete={() => setDeletingId(goal.id)} />
                    ))}
                  </ul>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* 達成確認 */}
      <ConfirmDialog
        isOpen={!!achievingId}
        onClose={() => setAchievingId(null)}
        title={t('achieveDialogTitle')}
        message={t('achieveDialogMessage')}
        confirmText={t('achieveDialogConfirm')}
        onConfirm={() => {
          if (achievingId) {
            achieveMutation.mutate(achievingId)
          }
        }}
        isLoading={achieveMutation.isPending}
      />

      {/* 刪除確認 */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        title={t('deleteDialogTitle')}
        message={t('deleteDialogMessage')}
        confirmText={t('delete')}
        variant="danger"
        onConfirm={() => {
          if (deletingId) {
            deleteMutation.mutate(deletingId)
            setDeletingId(null)
          }
        }}
        isLoading={deleteMutation.isPending}
      />
    </ProfilePageLayout>
  )
}

function GoalCard({
  goal,
  onAchieve,
  onDelete,
}: {
  goal: UserGoal
  onAchieve?: () => void
  onDelete: () => void
}) {
  const t = useTranslations('ProfileGoals')
  const isAchieved = goal.status === 'achieved'
  const locale = useLocale()

  return (
    <li
      className={`flex items-start justify-between gap-3 rounded-lg border px-4 py-3 shadow-xs ${
        isAchieved ? 'border-amber-100 bg-amber-50/50' : 'border-gray-100 bg-white'
      }`}
    >
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-800">{goal.title}</span>
          <Badge
            className={`px-1.5 py-0 text-[10px] font-medium ${GOAL_TYPE_COLORS[goal.goal_type] ?? ''}`}
          >
            {isGoalType(goal.goal_type) ? t(`types.${goal.goal_type}.label`) : goal.goal_type}
          </Badge>
          {isAchieved && (
            <Badge className="bg-amber-100 px-1.5 py-0 text-[10px] font-medium text-amber-700">
              {t('achievedBadge')}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>
            {t('targetValue', { target: goal.target })}
            {goal.current_value && ` / ${t('currentValue', { value: goal.current_value })}`}
          </span>
          {goal.target_date && <span>{t('deadline', { date: goal.target_date })}</span>}
        </div>
        <p className="text-[11px] text-gray-400">
          {isAchieved && goal.achieved_at
            ? t('achievedAgo', {
                time: formatDistanceToNow(new Date(goal.achieved_at), {
                  addSuffix: true,
                  locale: getDateFnsLocale(locale),
                }),
              })
            : t('createdAgo', {
                time: formatDistanceToNow(new Date(goal.created_at), {
                  addSuffix: true,
                  locale: getDateFnsLocale(locale),
                }),
              })}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {!isAchieved && onAchieve && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-400 hover:text-emerald-600"
            onClick={onAchieve}
            title={t('markAchieved')}
          >
            <Check className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-gray-400 hover:text-red-500"
          onClick={onDelete}
          title={t('delete')}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </li>
  )
}
