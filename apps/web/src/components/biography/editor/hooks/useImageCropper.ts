'use client'

import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { biographyService } from '@/lib/api/services'

interface UseImageCropperOptions {
  avatarUrl?: string | null
  coverUrl?: string | null
  onAvatarChange: (_url: string) => void
  onCoverChange: (_url: string) => void
  onFlushSave?: () => void
}

/**
 * 圖片裁切器 Hook
 *
 * 處理頭像和封面圖片的選擇、裁切和上傳邏輯
 */
export function useImageCropper({
  avatarUrl,
  coverUrl,
  onAvatarChange,
  onCoverChange,
  onFlushSave,
}: UseImageCropperOptions) {
  const { toast } = useToast()
  const tm = useTranslations('BiographyMisc')

  const [showCropper, setShowCropper] = useState(false)
  const [cropperImageSrc, setCropperImageSrc] = useState<string>('')
  const [cropType, setCropType] = useState<'avatar' | 'cover'>('avatar')
  const [isUploading, setIsUploading] = useState(false)

  // 處理頭像選擇 - 開啟裁切器
  const handleAvatarSelect = useCallback((file: File) => {
    const url = URL.createObjectURL(file)
    setCropperImageSrc(url)
    setCropType('avatar')
    setShowCropper(true)
  }, [])

  // 處理封面選擇 - 開啟裁切器
  const handleCoverSelect = useCallback((file: File) => {
    const url = URL.createObjectURL(file)
    setCropperImageSrc(url)
    setCropType('cover')
    setShowCropper(true)
  }, [])

  // 裁切器關閉時清理 blob URL
  const handleCropperClose = useCallback(() => {
    setShowCropper(false)
    if (cropperImageSrc && cropperImageSrc.startsWith('blob:')) {
      URL.revokeObjectURL(cropperImageSrc)
      setCropperImageSrc('')
    }
  }, [cropperImageSrc])

  // 處理裁切完成 - 上傳圖片
  const handleCropComplete = useCallback(
    async (croppedFile: File) => {
      setIsUploading(true)
      try {
        const response = await biographyService.uploadImage(
          croppedFile,
          cropType === 'avatar' ? avatarUrl || undefined : coverUrl || undefined
        )

        if (response.success && response.data) {
          const permanentUrl = response.data.url
          if (cropType === 'avatar') {
            onAvatarChange(permanentUrl)
          } else {
            onCoverChange(permanentUrl)
          }
          // 立即執行儲存，避免使用者重新整理時遺失圖片
          onFlushSave?.()
          toast({
            title: tm('uploadSuccess'),
            description: cropType === 'avatar' ? tm('avatarUpdated') : tm('coverUpdated'),
          })
        } else {
          throw new Error(tm('uploadFailed'))
        }
      } catch (err) {
        console.error('圖片上傳失敗:', err)
        toast({
          title: tm('uploadFailed'),
          description: err instanceof Error ? err.message : tm('retryLater'),
          variant: 'destructive',
        })
      } finally {
        setIsUploading(false)
        // 清理 blob URL
        if (cropperImageSrc && cropperImageSrc.startsWith('blob:')) {
          URL.revokeObjectURL(cropperImageSrc)
          setCropperImageSrc('')
        }
      }
    },
    [
      cropType,
      avatarUrl,
      coverUrl,
      onAvatarChange,
      onCoverChange,
      toast,
      cropperImageSrc,
      onFlushSave,
    ]
  )

  return {
    // 狀態
    showCropper,
    cropperImageSrc,
    cropType,
    isUploading,
    // 方法
    handleAvatarSelect,
    handleCoverSelect,
    handleCropperClose,
    handleCropComplete,
  }
}
