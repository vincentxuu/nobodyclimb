'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import { RouteStoryFormData } from '@/lib/types/route-story'

// 驗證訊息需依語系輸出，schema 由元件內以翻譯後的訊息建立
const buildRouteStoryFormSchema = (messages: { routeRequired: string; contentRequired: string }) =>
  z.object({
    route_id: z.string().min(1, messages.routeRequired),
    title: z.string().nullable().optional(),
    content: z.string().min(1, messages.contentRequired),
  })

interface RouteStoryFormProps {
  routeId: string
  routeName: string
  routeGrade?: string
  open: boolean
  onOpenChange: (_open: boolean) => void
  onSubmit: (_data: RouteStoryFormData) => Promise<void>
  initialData?: Partial<RouteStoryFormData>
  isLoading?: boolean
}

export function RouteStoryForm({
  routeId,
  routeName,
  routeGrade,
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading = false,
}: RouteStoryFormProps) {
  const t = useTranslations('RouteStory')
  const routeStoryFormSchema = useMemo(
    () =>
      buildRouteStoryFormSchema({
        routeRequired: t('routeRequired'),
        contentRequired: t('contentRequired'),
      }),
    [t]
  )
  const form = useForm<RouteStoryFormData>({
    resolver: zodResolver(routeStoryFormSchema),
    defaultValues: {
      route_id: routeId,
      title: initialData?.title ?? null,
      content: initialData?.content ?? '',
    },
  })

  // 當 dialog 關閉時重置表單狀態
  useEffect(() => {
    if (!open) {
      form.reset({
        route_id: routeId,
        title: initialData?.title ?? null,
        content: initialData?.content ?? '',
      })
    }
  }, [open, form, routeId, initialData])

  const handleFormSubmit = async (data: RouteStoryFormData) => {
    await onSubmit({
      ...data,
      visibility: 'public',
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('formTitle')}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {routeName} {routeGrade && <span className="font-medium">({routeGrade})</span>}
          </p>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* 標題 (可選) */}
          <div className="space-y-2">
            <Label htmlFor="title">{t('titleLabel')}</Label>
            <Input id="title" placeholder={t('titlePlaceholder')} {...form.register('title')} />
          </div>

          {/* 內容 */}
          <div className="space-y-2">
            <Label htmlFor="content">{t('contentLabel')}</Label>
            <Textarea
              id="content"
              placeholder={t('contentPlaceholder')}
              rows={5}
              {...form.register('content')}
            />
            {form.formState.errors.content && (
              <p className="text-xs text-red-500">{form.formState.errors.content.message}</p>
            )}
          </div>

          {/* 提交按鈕 */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              {t('cancel')}
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? t('publishing') : t('publish')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
