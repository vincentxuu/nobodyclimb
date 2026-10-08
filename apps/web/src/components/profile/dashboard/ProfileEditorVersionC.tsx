'use client'

/**
 * 版本 C - 步驟式引導精靈
 *
 * 特點：
 * - 逐步引導用戶完成每個區塊
 * - 明確的進度指示
 * - 一次專注一件事，減少認知負擔
 * - 適合新用戶首次設定
 */

import { AnimatePresence, motion } from 'framer-motion'
import {
  BookOpen,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Gauge,
  Globe,
  ImageIcon,
  Link2,
  SkipForward,
  Sparkles,
  User,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { biographyService } from '@/lib/api/services'
import { mapProfileDataToApi } from '../mappers'
import { useProfile } from '../ProfileContext'
import { SocialLinks } from '../types'

interface Step {
  id: string
  icon: React.ReactNode
  title: string
  subtitle: string
  component: React.ReactNode
}

interface ProfileEditorVersionCProps {
  onBack?: () => void
  onComplete?: () => void
}

export default function ProfileEditorVersionC({ onBack, onComplete }: ProfileEditorVersionCProps) {
  const { profileData, setProfileData } = useProfile()
  const { toast } = useToast()
  const t = useTranslations('ProfileEditor')
  const [currentStep, setCurrentStep] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  // 處理表單變更
  const handleChange = (field: string, value: string | boolean | SocialLinks) => {
    if (field.startsWith('socialLinks.')) {
      const socialField = field.replace('socialLinks.', '')
      setProfileData((prev) => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [socialField]: value as string,
        },
      }))
    } else {
      setProfileData((prev) => ({
        ...prev,
        [field]: value,
      }))
    }
  }

  // 圖片上傳
  const handleImageUpload = async (file: File, field: 'avatarUrl' | 'coverImageUrl') => {
    try {
      const response = await biographyService.uploadImage(file)
      const uploadedUrl = response.data?.url
      if (response.success && uploadedUrl) {
        setProfileData((prev) => ({
          ...prev,
          [field]: uploadedUrl,
        }))
        toast({ title: t('common.imageUploadSuccess') })
      }
    } catch (error) {
      console.error('上傳失敗:', error)
      toast({ title: t('common.uploadFailed'), variant: 'destructive' })
    }
  }

  // 儲存並前往下一步
  const saveAndNext = async () => {
    setIsSaving(true)
    try {
      const biographyData = mapProfileDataToApi(profileData, { includeAdvancedStories: false })

      await biographyService.updateMyBiography(biographyData)

      setCompletedSteps((prev) => new Set([...prev, currentStep]))

      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1)
        toast({ title: t('common.saved') })
      } else {
        toast({ title: t('versionC.completeTitle'), description: t('versionC.completeDesc') })
        onComplete?.()
      }
    } catch (error) {
      console.error('儲存失敗:', error)
      toast({ title: t('common.saveFailed'), variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  // 步驟 1: 頭像設定
  const AvatarStep = () => (
    <div className="flex flex-col items-center">
      <div
        className="group relative mb-6 h-40 w-40 cursor-pointer overflow-hidden rounded-full bg-gray-100"
        onClick={() => {
          const input = document.createElement('input')
          input.type = 'file'
          input.accept = 'image/*'
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (file) handleImageUpload(file, 'avatarUrl')
          }
          input.click()
        }}
      >
        {profileData.avatarUrl ? (
          <>
            <img
              src={profileData.avatarUrl}
              alt={t('common.avatarAlt')}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="h-8 w-8 text-white" />
            </div>
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-gray-400">
            <Camera className="mb-2 h-10 w-10" />
            <span className="text-sm">{t('versionC.clickToUpload')}</span>
          </div>
        )}
      </div>
      <p className="text-center text-sm text-gray-500">
        {t('versionC.avatarHint1')}
        <br />
        {t('versionC.avatarHint2')}
      </p>
    </div>
  )

  // 步驟 2: 基本資料
  const BasicInfoStep = () => (
    <div className="space-y-6">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          {t('versionC.nameLabel')}
        </label>
        <Input
          value={profileData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder={t('versionC.namePlaceholder')}
          className="text-lg"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          {t('versionC.titleLabel')}
        </label>
        <Input
          value={profileData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder={t('versionC.titlePlaceholder')}
        />
        <p className="mt-1 text-xs text-gray-400">{t('versionC.titleHint')}</p>
      </div>
    </div>
  )

  // 步驟 3: 攀岩資訊
  const ClimbingInfoStep = () => (
    <div className="space-y-6">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          {t('versionC.startYearLabel')}
        </label>
        <Input
          type="number"
          value={profileData.startYear}
          onChange={(e) => handleChange('startYear', e.target.value)}
          placeholder={t('common.startYearPlaceholder')}
          min={1990}
          max={new Date().getFullYear()}
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          {t('versionC.locationsLabel')}
        </label>
        <Input
          value={profileData.frequentGyms}
          onChange={(e) => handleChange('frequentGyms', e.target.value)}
          placeholder={t('common.locationsPlaceholder')}
        />
        <p className="mt-1 text-xs text-gray-400">{t('versionC.locationsHint')}</p>
      </div>
    </div>
  )

  // 步驟 4: 社群連結
  const SocialLinksStep = () => (
    <div className="space-y-6">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          {t('versionC.instagramLabel')}
        </label>
        <div className="flex items-center gap-2">
          <span className="text-gray-400">@</span>
          <Input
            value={profileData.socialLinks.instagram || ''}
            onChange={(e) => handleChange('socialLinks.instagram', e.target.value)}
            placeholder={t('common.igPlaceholder')}
          />
        </div>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          {t('versionC.youtubeLabel')}
        </label>
        <Input
          value={profileData.socialLinks.youtube_channel || ''}
          onChange={(e) => handleChange('socialLinks.youtube_channel', e.target.value)}
          placeholder={t('versionC.youtubePlaceholder')}
        />
      </div>
    </div>
  )

  // 步驟 5: 攀岩故事
  const StoryStep = () => (
    <div className="space-y-6">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          {t('versionC.originLabel')}
        </label>
        <Textarea
          value={profileData.climbingReason}
          onChange={(e) => handleChange('climbingReason', e.target.value)}
          placeholder={t('versionC.originPlaceholder')}
          className="min-h-[120px]"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          {t('versionC.meaningLabel')}
        </label>
        <Textarea
          value={profileData.climbingMeaning}
          onChange={(e) => handleChange('climbingMeaning', e.target.value)}
          placeholder={t('versionC.meaningPlaceholder')}
          className="min-h-[120px]"
        />
      </div>
    </div>
  )

  // 步驟 6: 公開設定
  const PrivacyStep = () => (
    <div className="space-y-6">
      <div className="rounded-lg border p-4">
        <div className="flex items-start gap-4">
          <button
            onClick={() => handleChange('isPublic', true)}
            className={`flex-1 rounded-lg border-2 p-4 text-left transition-colors ${
              profileData.isPublic
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Globe
              className={`mb-2 h-6 w-6 ${profileData.isPublic ? 'text-green-600' : 'text-gray-400'}`}
            />
            <div className="font-medium">{t('versionC.public')}</div>
            <p className="mt-1 text-sm text-gray-500">{t('common.publicDesc')}</p>
          </button>
          <button
            onClick={() => handleChange('isPublic', false)}
            className={`flex-1 rounded-lg border-2 p-4 text-left transition-colors ${
              !profileData.isPublic
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <User
              className={`mb-2 h-6 w-6 ${!profileData.isPublic ? 'text-blue-600' : 'text-gray-400'}`}
            />
            <div className="font-medium">{t('versionC.private')}</div>
            <p className="mt-1 text-sm text-gray-500">{t('versionC.privateDesc')}</p>
          </button>
        </div>
      </div>
      <p className="text-center text-sm text-gray-500">{t('versionC.privacyHint')}</p>
    </div>
  )

  const steps: Step[] = [
    {
      id: 'avatar',
      icon: <ImageIcon className="h-6 w-6" />,
      title: t('versionC.steps.avatar.title'),
      subtitle: t('versionC.steps.avatar.subtitle'),
      component: <AvatarStep />,
    },
    {
      id: 'basic',
      icon: <User className="h-6 w-6" />,
      title: t('versionC.steps.basic.title'),
      subtitle: t('versionC.steps.basic.subtitle'),
      component: <BasicInfoStep />,
    },
    {
      id: 'climbing',
      icon: <Gauge className="h-6 w-6" />,
      title: t('versionC.steps.climbing.title'),
      subtitle: t('versionC.steps.climbing.subtitle'),
      component: <ClimbingInfoStep />,
    },
    {
      id: 'social',
      icon: <Link2 className="h-6 w-6" />,
      title: t('versionC.steps.social.title'),
      subtitle: t('versionC.steps.social.subtitle'),
      component: <SocialLinksStep />,
    },
    {
      id: 'story',
      icon: <BookOpen className="h-6 w-6" />,
      title: t('versionC.steps.story.title'),
      subtitle: t('versionC.steps.story.subtitle'),
      component: <StoryStep />,
    },
    {
      id: 'privacy',
      icon: <Globe className="h-6 w-6" />,
      title: t('versionC.steps.privacy.title'),
      subtitle: t('versionC.steps.privacy.subtitle'),
      component: <PrivacyStep />,
    },
  ]

  const currentStepData = steps[currentStep]
  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="flex min-h-screen flex-col bg-linear-to-b from-gray-50 to-white">
      {/* 頂部進度條 */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm">
        <div className="h-1 bg-gray-100">
          <motion.div
            className="h-full bg-gray-900"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => {
              if (currentStep > 0) {
                setCurrentStep(currentStep - 1)
              } else {
                onBack?.()
              }
            }}
            className="flex items-center gap-1 text-sm text-gray-500"
          >
            <ChevronLeft className="h-4 w-4" />
            {currentStep > 0 ? t('versionC.prevStep') : t('common.back')}
          </button>

          <div className="text-sm text-gray-400">
            {currentStep + 1} / {steps.length}
          </div>

          <button
            onClick={() => {
              if (currentStep < steps.length - 1) {
                setCurrentStep(currentStep + 1)
              }
            }}
            className="flex items-center gap-1 text-sm text-gray-500"
          >
            {t('versionC.skip')}
            <SkipForward className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 步驟指示器 */}
      <div className="flex justify-center gap-2 py-4">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
              index === currentStep
                ? 'bg-gray-900 text-white'
                : index < currentStep || completedSteps.has(index)
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-400'
            }`}
          >
            {index < currentStep || completedSteps.has(index) ? (
              <Check className="h-4 w-4" />
            ) : (
              <span className="text-xs">{index + 1}</span>
            )}
          </div>
        ))}
      </div>

      {/* 主要內容 */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md"
          >
            {/* 步驟標題 */}
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                {currentStepData.icon}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{currentStepData.title}</h1>
              <p className="mt-1 text-gray-500">{currentStepData.subtitle}</p>
            </div>

            {/* 步驟內容 */}
            <div className="rounded-lg bg-white p-6 shadow-xs">{currentStepData.component}</div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 底部按鈕 */}
      <div className="sticky bottom-0 border-t bg-white p-4">
        <div className="mx-auto max-w-md">
          <Button className="w-full" size="lg" onClick={saveAndNext} disabled={isSaving}>
            {isSaving ? (
              t('common.saving')
            ) : currentStep === steps.length - 1 ? (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                {t('versionC.finish')}
              </>
            ) : (
              <>
                {t('versionC.nextStep')}
                <ChevronRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
