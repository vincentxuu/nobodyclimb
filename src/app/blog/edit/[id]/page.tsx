'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UploadCloud, Send } from 'lucide-react'
import { ArticleCategory, mockArticles } from '@/mocks/articles'
import { ProtectedRoute } from '@/components/shared/protected-route'

function EditBlogPageContent() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<ArticleCategory | ''>('')
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // 分類選項
  const categoryOptions: ArticleCategory[] = ['裝備介紹', '技巧介紹', '技術研究', '比賽介紹']

  // 載入文章資料
  useEffect(() => {
    const loadArticle = async () => {
      try {
        // 在真實應用中，這裡應從 API 獲取文章資料
        // 目前使用 mock 數據
        const article = mockArticles.find((article) => article.id === id)

        if (!article) {
          alert('找不到該文章')
          router.push('/blog')
          return
        }

        setTitle(article.title)
        setContent(article.content)
        setCategory(article.category)
        setImagePreview(article.imageUrl)

        setIsLoading(false)
      } catch (error) {
        console.error('載入文章時出錯:', error)
        alert('載入文章時出錯，請稍後再試')
        router.push('/blog')
      }
    }

    loadArticle()
  }, [id, router])

  // 處理圖片上傳
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // 處理表單提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 驗證表單
    if (!title || !content || !category || (!image && !imagePreview)) {
      alert('請填寫所有必填欄位')
      return
    }

    setIsSubmitting(true)

    try {
      // 在這裡實現實際的更新邏輯
      // 例如: 將更新的資料傳送到API
      console.log({
        id,
        title,
        content,
        category,
        image: image || imagePreview,
      })

      // 模擬API請求延遲
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // 成功提交後可以重定向到博客詳情頁面
      alert('文章更新成功！')
      router.push(`/blog/${id}`)
    } catch (error) {
      console.error('更新文章時出錯:', error)
      alert('更新文章時出錯，請稍後再試')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 處理取消按鈕
  const handleCancel = () => {
    if (confirm('確定要取消編輯嗎？未保存的修改將會丟失。')) {
      router.push(`/blog/${id}`)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F5F5]">
        <p className="text-xl">載入中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <main className="mx-auto max-w-[930px] px-4 py-8">
        <h1 className="mb-6 text-3xl font-medium text-[#1B1A1A] md:text-4xl">編輯文章</h1>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-4 md:p-10">
          {/* 標題 */}
          <div className="space-y-2">
            <Input
              placeholder="請輸入標題"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="p-3 text-2xl font-medium"
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* 上傳圖片 */}
            <div className="space-y-2">
              <label className="block text-xl font-medium text-[#3F3D3D]">上傳圖片</label>
              <div
                className={`flex h-[300px] cursor-pointer items-center justify-center rounded-lg border border-dashed border-[#B6B3B3] p-8 ${imagePreview ? 'relative' : ''} `}
                onClick={() => document.getElementById('image-upload')?.click()}
              >
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />

                {imagePreview ? (
                  <div className="h-full w-full">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-full w-full rounded-lg object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <UploadCloud className="mb-2 h-12 w-12 text-[#B6B3B3]" />
                  </div>
                )}
              </div>
            </div>

            {/* 分類 */}
            <div className="space-y-2">
              <label className="block text-xl font-medium text-[#3F3D3D]">分類</label>
              <Select
                value={category}
                onValueChange={(value) => setCategory(value as ArticleCategory)}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="請選擇分類" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 內容 */}
          <div className="space-y-2">
            <label className="block text-xl font-medium text-[#3F3D3D]">內容</label>
            <Textarea
              placeholder="請輸入文章內容"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[300px] p-6"
            />
          </div>

          {/* 按鈕組 */}
          <div className="flex flex-col-reverse justify-end space-y-4 space-y-reverse sm:flex-row sm:space-x-6 sm:space-y-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="w-full border-[#1B1A1A] px-8 py-2 text-[#1B1A1A] sm:w-auto"
            >
              取消
            </Button>
            <Button
              type="submit"
              className="flex w-full items-center justify-center gap-2 bg-[#1B1A1A] px-8 py-2 text-white sm:w-auto"
              disabled={isSubmitting}
            >
              <Send className="h-4 w-4" />
              更新文章
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}

export default function EditBlogPage() {
  return (
    <ProtectedRoute>
      <EditBlogPageContent />
    </ProtectedRoute>
  )
}
