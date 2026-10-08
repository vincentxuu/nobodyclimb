'use client'

import { motion } from 'framer-motion'
import {
  BookOpen,
  Gauge,
  Globe,
  ImageIcon,
  Link2,
  MapPin,
  MountainSnow,
  Sparkles,
  User,
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { biographyService } from '@/lib/api/services'
import { CORE_STORY_QUESTIONS, calculateStoryProgress } from '@/lib/constants/biography-stories'
import { useIsMobile } from '@/lib/hooks/useIsMobile'
import { useProfile } from '../ProfileContext'
import { SocialLinks } from '../types'
import { ProfileDashboardCard } from './ProfileDashboardCard'
import { ProfileEditSheet } from './ProfileEditSheet'

// 編輯面板類型
export type EditPanelType =
  | 'avatar'
  | 'basic'
  | 'climbing'
  | 'social'
  | 'core-stories'
  | 'advanced-stories'
  | 'footprints'
  | 'settings'
  | null

// 有效的面板類型列表（用於驗證）
const VALID_PANELS: EditPanelType[] = [
  'avatar',
  'basic',
  'climbing',
  'social',
  'core-stories',
  'advanced-stories',
  'footprints',
  'settings',
]

export default function ProfileDashboard() {
  const { profileData, setProfileData } = useProfile()
  const isMobile = useIsMobile()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations('ProfileDashboard')

  // 類別名稱映射（key 為故事分類 id，僅顯示用）
  const categoryNames: Record<string, string> = {
    growth: t('categories.growth'),
    psychology: t('categories.psychology'),
    community: t('categories.community'),
    practical: t('categories.practical'),
    dreams: t('categories.dreams'),
    life: t('categories.life'),
  }

  // 從 URL 讀取當前打開的面板
  const [activePanel, setActivePanel] = useState<EditPanelType>(null)

  // 同步 URL query param
  useEffect(() => {
    const panel = searchParams.get('edit')
    if (panel && VALID_PANELS.includes(panel as EditPanelType)) {
      setActivePanel(panel as EditPanelType)
    }
  }, [searchParams])

  // 打開編輯面板
  const openPanel = (panel: EditPanelType) => {
    setActivePanel(panel)
    if (panel) {
      router.push(`/profile?edit=${panel}`, { scroll: false })
    }
  }

  // 關閉編輯面板
  const closePanel = () => {
    setActivePanel(null)
    router.push('/profile', { scroll: false })
  }

  // 處理表單變更（使用函式更新形式避免 stale state）
  const handleChange = (field: string, value: string | boolean | SocialLinks) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // 通用圖片上傳處理
  const handleImageUpload = async (
    file: File,
    field: 'avatarUrl' | 'coverImageUrl',
    successMessage: string,
    errorMessage: string
  ) => {
    try {
      const response = await biographyService.uploadImage(file)
      if (response.success && response.data?.url) {
        const url = response.data.url
        setProfileData((prev) => ({
          ...prev,
          [field]: url,
        }))
        toast({ title: successMessage })
      } else {
        throw new Error(response.error || t('toast.uploadFailed'))
      }
    } catch (error) {
      console.error(`${errorMessage}:`, error)
      toast({ title: errorMessage, description: t('toast.retryLater'), variant: 'destructive' })
      throw error
    }
  }

  // 處理頭像上傳
  const handleAvatarUpload = (file: File) =>
    handleImageUpload(
      file,
      'avatarUrl',
      t('toast.avatarUploadSuccess'),
      t('toast.avatarUploadFailed')
    )

  // 處理封面照片上傳
  const handleCoverImageUpload = (file: File) =>
    handleImageUpload(
      file,
      'coverImageUrl',
      t('toast.coverUploadSuccess'),
      t('toast.coverUploadFailed')
    )

  // 處理進階故事單一欄位儲存
  const handleAdvancedStorySave = useCallback(
    async (field: string, value: string) => {
      setProfileData((prev) => ({
        ...prev,
        advancedStories: {
          ...prev.advancedStories,
          [field]: value,
        },
      }))

      try {
        await biographyService.updateMyBiography({ [field]: value })
        toast({ title: t('toast.storySaved') })
      } catch {
        toast({ title: t('toast.saveFailed'), variant: 'destructive' })
        throw new Error(t('toast.saveFailed'))
      }
    },
    [setProfileData, toast, t]
  )

  // 處理儲存
  const handleSave = async () => {
    try {
      const socialLinksJson = JSON.stringify(profileData.socialLinks)
      const biographyData = {
        // 進階故事（先展開，讓後面的核心故事欄位可以覆蓋）
        ...profileData.advancedStories,
        // 基本資料
        name: profileData.name,
        title: profileData.title || undefined,
        avatar_url: profileData.avatarUrl || undefined,
        cover_image: profileData.coverImageUrl || undefined,
        climbing_start_year: profileData.startYear,
        frequent_locations: profileData.frequentGyms,
        favorite_route_type: profileData.favoriteRouteType,
        // 核心故事（覆蓋 advancedStories 中的 bucket_list_story）
        climbing_origin: profileData.climbingReason,
        climbing_meaning: profileData.climbingMeaning,
        bucket_list_story: profileData.climbingBucketList,
        advice_to_self: profileData.adviceForBeginners,
        // 社群連結與設定
        social_links: socialLinksJson,
        is_public: profileData.isPublic ? 1 : 0,
      }

      const response = await biographyService.updateMyBiography(biographyData)

      if (response.success) {
        toast({ title: t('toast.saveSuccess'), description: t('toast.saveSuccessDesc') })
        closePanel()
      } else {
        throw new Error(response.error || t('toast.saveFailed'))
      }
    } catch (error) {
      console.error('儲存失敗:', error)
      toast({
        title: t('toast.saveFailed'),
        description: t('toast.retryLater'),
        variant: 'destructive',
      })
    }
  }

  // 計算各區塊的完成狀態和預覽
  const advancedProgress = calculateStoryProgress(
    profileData.advancedStories as unknown as Record<string, unknown>
  )

  // 核心故事完成數
  const coreStoriesCompleted = CORE_STORY_QUESTIONS.filter((q) => {
    const fieldMap: Record<string, string> = {
      climbing_origin: 'climbingReason',
      climbing_meaning: 'climbingMeaning',
      advice_to_self: 'adviceForBeginners',
    }
    const key = fieldMap[q.field] || q.field
    const value = profileData[key as keyof typeof profileData]
    return value && typeof value === 'string' && value.trim().length > 0
  }).length

  // 社群連結完成數
  const socialLinksCompleted = [
    profileData.socialLinks.instagram,
    profileData.socialLinks.youtube_channel,
  ].filter((v) => v && v.trim().length > 0).length

  return (
    <motion.div
      className="w-full flex-1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="rounded-sm bg-white p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900 md:text-2xl">{t('title')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('subtitle')}</p>
        </div>

        {/* Dashboard Grid */}
        <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {/* 頭像與封面 */}
          <ProfileDashboardCard
            icon={<ImageIcon className="h-5 w-5" />}
            title={t('cards.avatar.title')}
            description={t('cards.avatar.description')}
            onClick={() => openPanel('avatar')}
            isComplete={!!(profileData.avatarUrl || profileData.coverImageUrl)}
            preview={
              <div className="flex items-center gap-2 text-xs text-gray-500">
                {profileData.avatarUrl ? t('preview.avatarSet') : t('preview.avatarUnset')}
                <span className="mx-1">•</span>
                {profileData.coverImageUrl ? t('preview.coverSet') : t('preview.coverUnset')}
              </div>
            }
          />

          {/* 基本資料 */}
          <ProfileDashboardCard
            icon={<User className="h-5 w-5" />}
            title={t('cards.basic.title')}
            description={t('cards.basic.description')}
            onClick={() => openPanel('basic')}
            isComplete={!!(profileData.name && profileData.title)}
            preview={
              <div className="truncate">
                <span className="font-medium">{profileData.name || t('preview.nameUnset')}</span>
                {profileData.title && (
                  <span className="ml-2 text-gray-400">· {profileData.title}</span>
                )}
              </div>
            }
          />

          {/* 攀岩資訊 */}
          <ProfileDashboardCard
            icon={<Gauge className="h-5 w-5" />}
            title={t('cards.climbing.title')}
            description={t('cards.climbing.description')}
            onClick={() => openPanel('climbing')}
            isComplete={!!(profileData.startYear && profileData.frequentGyms)}
            preview={
              <div className="truncate text-xs">
                {profileData.startYear && (
                  <span>{t('preview.startYear', { year: profileData.startYear })}</span>
                )}
                {profileData.frequentGyms && (
                  <span className="ml-2">· {profileData.frequentGyms}</span>
                )}
              </div>
            }
          />

          {/* 社群連結 */}
          <ProfileDashboardCard
            icon={<Link2 className="h-5 w-5" />}
            title={t('cards.social.title')}
            description={t('cards.social.description')}
            onClick={() => openPanel('social')}
            progress={{ current: socialLinksCompleted, total: 2 }}
            preview={
              <div className="flex flex-wrap gap-2 text-xs">
                {profileData.socialLinks.instagram && (
                  <span className="rounded bg-gray-100 px-2 py-0.5">
                    IG: @{profileData.socialLinks.instagram}
                  </span>
                )}
                {profileData.socialLinks.youtube_channel && (
                  <span className="rounded bg-gray-100 px-2 py-0.5">
                    {t('preview.youtubeLinked')}
                  </span>
                )}
              </div>
            }
          />

          {/* 核心故事 */}
          <ProfileDashboardCard
            icon={<BookOpen className="h-5 w-5" />}
            title={t('cards.coreStories.title')}
            description={t('cards.coreStories.description')}
            onClick={() => openPanel('core-stories')}
            progress={{ current: coreStoriesCompleted, total: 3 }}
          />

          {/* 小故事 - 大卡片 */}
          <ProfileDashboardCard
            icon={<Sparkles className="h-5 w-5" />}
            title={t('cards.advancedStories.title')}
            description={t('cards.advancedStories.description')}
            onClick={() => openPanel('advanced-stories')}
            size="large"
            progress={{ current: advancedProgress.completed, total: advancedProgress.total }}
            preview={
              <div className="mt-2 flex flex-wrap gap-1.5">
                {Object.entries(advancedProgress.byCategory).map(([category, progress]) => (
                  <span
                    key={category}
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      progress.completed === progress.total
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {categoryNames[category] || category} {progress.completed}/{progress.total}
                  </span>
                ))}
              </div>
            }
          />

          {/* 攀岩足跡 */}
          <ProfileDashboardCard
            icon={<MapPin className="h-5 w-5" />}
            title={t('cards.footprints.title')}
            description={t('cards.footprints.description')}
            onClick={() => openPanel('footprints')}
          />

          {/* 攀爬紀錄 */}
          <ProfileDashboardCard
            icon={<MountainSnow className="h-5 w-5" />}
            title={t('cards.ascents.title')}
            description={t('cards.ascents.description')}
            onClick={() => router.push('/profile/ascents', { scroll: false })}
          />

          {/* 公開設定 */}
          <ProfileDashboardCard
            icon={<Globe className="h-5 w-5" />}
            title={t('cards.settings.title')}
            description={t('cards.settings.description')}
            onClick={() => openPanel('settings')}
            preview={
              <span
                className={`text-xs ${profileData.isPublic ? 'text-green-600' : 'text-gray-500'}`}
              >
                {profileData.isPublic ? t('preview.public') : t('preview.private')}
              </span>
            }
          />
        </div>
      </div>

      {/* 側滑編輯面板 */}
      <ProfileEditSheet
        activePanel={activePanel}
        onClose={closePanel}
        profileData={profileData}
        isMobile={isMobile}
        onChange={handleChange}
        onSave={handleSave}
        onAvatarUpload={handleAvatarUpload}
        onCoverImageUpload={handleCoverImageUpload}
        onAvatarDelete={() => setProfileData((prev) => ({ ...prev, avatarUrl: null }))}
        onCoverImageDelete={() => setProfileData((prev) => ({ ...prev, coverImageUrl: null }))}
        onAdvancedStorySave={handleAdvancedStorySave}
      />
    </motion.div>
  )
}
