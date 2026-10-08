import { z } from 'zod'

/**
 * 注意：本檔所有錯誤訊息都是訊息檔 `Validation` namespace 的 key，不是顯示文字。
 * schema 定義在模組層級、拿不到 `t`，由顯示錯誤的表單元件用
 * `useValidationMessage()`（同目錄）翻成目前語系。新增訊息時三個訊息檔都要補 key。
 */

/**
 * YouTube 影片 ID 驗證 (11 個英數字元)
 */
const youtubeVideoIdSchema = z.string().regex(/^[a-zA-Z0-9_-]{11}$/, 'invalidYoutubeVideoId')

/**
 * Instagram shortcode 驗證 (英數字元，通常 11 個字元但可能更長)
 */
const instagramShortcodeSchema = z
  .string()
  .regex(/^[a-zA-Z0-9_-]{10,}$/, 'invalidInstagramShortcode')

/**
 * 日期格式驗證 (YYYY-MM-DD 或空字串)
 */
const dateStringSchema = z
  .string()
  .refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), 'invalidDateFormat')

/**
 * 人生清單分類列舉
 */
export const bucketListCategorySchema = z.enum([
  'outdoor_route',
  'indoor_grade',
  'competition',
  'training',
  'adventure',
  'skill',
  'injury_recovery',
  'other',
])

/**
 * 里程碑 schema
 */
export const milestoneSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'milestoneTitleRequired'),
  percentage: z.number().min(0).max(100),
  completed: z.boolean(),
  completed_at: z.string().nullable(),
  note: z.string().nullable(),
})

/**
 * 人生清單項目輸入 schema (創建/更新)
 */
export const bucketListItemInputSchema = z
  .object({
    title: z.string().min(1, 'bucketListTitleRequired').max(100, 'bucketListTitleTooLong'),
    category: bucketListCategorySchema.optional().default('other'),
    description: z.string().max(1000, 'bucketListDescriptionTooLong').optional(),
    target_grade: z.string().max(50, 'bucketListTargetGradeTooLong').optional(),
    target_location: z.string().max(100, 'bucketListTargetLocationTooLong').optional(),
    target_date: dateStringSchema.optional(),
    status: z.enum(['active', 'completed', 'archived']).optional().default('active'),
    enable_progress: z.boolean().optional().default(false),
    progress_mode: z.enum(['manual', 'milestone']).nullable().optional(),
    progress: z.number().min(0).max(100).optional().default(0),
    milestones: z.array(milestoneSchema).optional(),
    is_public: z.boolean().optional().default(true),
    sort_order: z.number().optional(),
  })
  .refine(
    (data) => {
      // 如果開啟進度追蹤，必須選擇追蹤方式
      if (data.enable_progress && !data.progress_mode) {
        return false
      }
      return true
    },
    {
      message: 'progressModeRequired',
      path: ['progress_mode'],
    }
  )
  .refine(
    (data) => {
      // 如果使用里程碑模式，必須至少有一個里程碑
      if (
        data.progress_mode === 'milestone' &&
        (!data.milestones || data.milestones.length === 0)
      ) {
        return false
      }
      return true
    },
    {
      message: 'milestoneRequired',
      path: ['milestones'],
    }
  )

/**
 * 完成人生清單目標 schema
 */
export const bucketListCompleteSchema = z.object({
  completion_story: z.string().max(5000, 'completionStoryTooLong').optional(),
  psychological_insights: z.string().max(2000, 'psychologicalInsightsTooLong').optional(),
  technical_insights: z.string().max(2000, 'technicalInsightsTooLong').optional(),
  completion_media: z
    .object({
      youtube_videos: z.array(youtubeVideoIdSchema).optional(),
      instagram_posts: z.array(instagramShortcodeSchema).optional(),
      photos: z.array(z.string().url('invalidPhotoUrl')).optional(),
    })
    .optional(),
})

/**
 * 進度更新 schema
 */
export const progressUpdateSchema = z.object({
  progress: z.number().min(0, 'progressTooSmall').max(100, 'progressTooLarge'),
})

/**
 * 里程碑更新 schema
 */
export const milestoneUpdateSchema = z.object({
  milestone_id: z.string(),
  completed: z.boolean().optional(),
  note: z.string().max(500, 'milestoneNoteTooLong').optional(),
})

/**
 * 留言 schema
 */
export const commentSchema = z.object({
  content: z.string().min(1, 'commentRequired').max(500, 'commentTooLong'),
})

// 匯出類型
export type BucketListCategorySchema = z.infer<typeof bucketListCategorySchema>
export type MilestoneSchema = z.infer<typeof milestoneSchema>
export type BucketListItemInputSchema = z.infer<typeof bucketListItemInputSchema>
export type BucketListCompleteSchema = z.infer<typeof bucketListCompleteSchema>
export type ProgressUpdateSchema = z.infer<typeof progressUpdateSchema>
export type MilestoneUpdateSchema = z.infer<typeof milestoneUpdateSchema>
export type CommentSchema = z.infer<typeof commentSchema>
