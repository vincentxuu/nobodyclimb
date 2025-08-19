'use client'

import { useParams, useRouter } from 'next/navigation'
import { mockArticles } from '@/mocks/articles'
import Image from 'next/image'
import Link from 'next/link'
import { Chip } from '@/components/ui/chip'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Breadcrumb } from '@/components/ui/breadcrumb'

export default function BlogDetail() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  // Find current article
  const currentArticle = mockArticles.find((article) => article.id === id)

  if (!currentArticle) {
    return <div>Article not found</div>
  }

  // Find previous and next articles
  const currentIndex = mockArticles.findIndex((article) => article.id === id)
  const prevArticle = currentIndex > 0 ? mockArticles[currentIndex - 1] : null
  const nextArticle = currentIndex < mockArticles.length - 1 ? mockArticles[currentIndex + 1] : null

  // Find exactly 3 related articles (excluding current article)
  const relatedArticles = mockArticles
    .filter((article) => article.id !== id && article.category === currentArticle.category)
    .sort(() => Math.random() - 0.5) // Randomly shuffle the articles
    .slice(0, 3)

  // If we don't have enough related articles, fill with articles from other categories
  if (relatedArticles.length < 3) {
    const remainingCount = 3 - relatedArticles.length
    const otherArticles = mockArticles
      .filter((article) => article.id !== id && article.category !== currentArticle.category)
      .sort(() => Math.random() - 0.5)
      .slice(0, remainingCount)

    relatedArticles.push(...otherArticles)
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <main className="mx-auto max-w-[1440px] px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Breadcrumb
            items={[
              { label: '首頁', href: '/' },
              { label: '部落格', href: '/blog' },
              { label: currentArticle.title },
            ]}
          />
        </div>

        {/* Content */}
        <div className="mb-16 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
          <div className="rounded-lg bg-white p-8 lg:p-16">
            {/* Article Header */}
            <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row">
              <div>
                <h1 className="mb-3 text-2xl font-medium sm:text-3xl">{currentArticle.title}</h1>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">更新日期</span>
                  <span className="text-sm text-gray-500">{currentArticle.date}</span>
                </div>
              </div>
              <Button
                onClick={() => router.push(`/blog/edit/${id}`)}
                className="w-full bg-[#1B1A1A] text-white hover:bg-[#333] sm:w-auto"
              >
                編輯文章
              </Button>
            </div>

            {/* Main Image */}
            <div className="relative mb-8 aspect-[16/9]">
              <Image
                src={currentArticle.imageUrl}
                alt={currentArticle.title}
                fill
                className="rounded-lg object-cover"
              />
            </div>

            {/* Article Content */}
            <div className="space-y-6">
              {currentArticle.equipment ? (
                <>
                  <section>
                    <h2 className="mb-1 font-medium text-orange-500">裝備名稱</h2>
                    <div className="mb-4 h-px bg-gray-200" />
                    <p className="text-gray-800">{currentArticle.equipment.name}</p>
                  </section>

                  <section>
                    <h2 className="mb-1 font-medium text-orange-500">用途說明</h2>
                    <div className="mb-4 h-px bg-gray-200" />
                    <p className="text-gray-800">{currentArticle.equipment.usage}</p>
                  </section>

                  <section>
                    <h2 className="mb-1 font-medium text-orange-500">常見款式</h2>
                    <div className="mb-4 h-px bg-gray-200" />
                    <p className="mb-4 text-gray-800">{currentArticle.equipment.commonTypes}</p>
                    {currentArticle.images && (
                      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                        {currentArticle.images.map((image, index) => (
                          <div key={index} className="relative aspect-square">
                            <Image
                              src={image}
                              alt={`Style ${index + 1}`}
                              fill
                              className="rounded object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section>
                    <h2 className="mb-1 font-medium text-orange-500">購買方式</h2>
                    <div className="mb-4 h-px bg-gray-200" />
                    <p className="text-gray-800">{currentArticle.equipment.purchaseInfo}</p>
                  </section>

                  <section>
                    <h2 className="mb-1 font-medium text-orange-500">推薦程度</h2>
                    <div className="mb-4 h-px bg-gray-200" />
                    <p className="text-gray-800">{currentArticle.equipment.recommendation}</p>
                  </section>
                </>
              ) : (
                <section>
                  <p className="whitespace-pre-wrap text-gray-800">{currentArticle.content}</p>
                </section>
              )}
            </div>

            {/* Navigation */}
            <div className="mt-12 flex flex-col justify-between gap-4 sm:flex-row sm:gap-8">
              {prevArticle ? (
                <Link
                  href={`/blog/${prevArticle.id}`}
                  className="flex-1 rounded-lg border border-gray-200 p-6 transition-colors hover:bg-gray-50"
                >
                  <div className="mb-2 flex items-center gap-2 text-gray-500">
                    <ArrowLeft size={16} />
                    <span>上一篇</span>
                  </div>
                  <h3 className="mb-2 font-medium">{prevArticle.title}</h3>
                  <p className="line-clamp-2 text-sm text-gray-500">
                    {prevArticle.description || prevArticle.content}
                  </p>
                </Link>
              ) : (
                <div className="flex-1" />
              )}
              {nextArticle && (
                <Link
                  href={`/blog/${nextArticle.id}`}
                  className="flex-1 rounded-lg border border-gray-200 p-6 transition-colors hover:bg-gray-50"
                >
                  <div className="mb-2 flex items-center justify-end gap-2 text-gray-500">
                    <span>下一篇</span>
                    <ArrowRight size={16} />
                  </div>
                  <h3 className="mb-2 font-medium">{nextArticle.title}</h3>
                  <p className="line-clamp-2 text-sm text-gray-500">
                    {nextArticle.description || nextArticle.content}
                  </p>
                </Link>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Categories */}
            <div>
              <h2 className="mb-4 text-2xl font-medium">文章分類</h2>
              <div className="overflow-hidden rounded-lg bg-white">
                <Button
                  variant="ghost"
                  className="w-full justify-start px-5 py-3 font-medium hover:bg-gray-50"
                >
                  所有文章
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start px-5 py-3 font-medium text-gray-500 hover:bg-gray-50"
                >
                  裝備介紹
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start px-5 py-3 font-medium text-gray-500 hover:bg-gray-50"
                >
                  技巧介紹
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start px-5 py-3 font-medium text-gray-500 hover:bg-gray-50"
                >
                  技術研究
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start px-5 py-3 font-medium text-gray-500 hover:bg-gray-50"
                >
                  比賽介紹
                </Button>
              </div>
            </div>

            {/* Popular Articles */}
            <div>
              <h2 className="mb-4 text-2xl font-medium">熱門文章</h2>
              <div className="space-y-4">
                {mockArticles.slice(0, 4).map((article) => (
                  <Link
                    key={article.id}
                    href={`/blog/${article.id}`}
                    className="block rounded-lg border-b border-gray-200 bg-white p-5 transition-colors hover:bg-gray-50"
                  >
                    <h3 className="mb-2 font-medium">{article.title}</h3>
                    <div className="flex items-center gap-3">
                      <Chip>{article.category}</Chip>
                      <span className="text-sm text-gray-500">{article.date}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Related Articles Section */}
        <div className="mx-auto max-w-[1440px]">
          <h2 className="mb-8 text-2xl font-medium">相關文章</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {relatedArticles.map((article) => (
              <Link
                key={article.id}
                href={`/blog/${article.id}`}
                className="block overflow-hidden rounded-lg bg-white transition-shadow hover:shadow-lg"
              >
                <div className="relative aspect-[16/9]">
                  <Image src={article.imageUrl} alt={article.title} fill className="object-cover" />
                </div>
                <div className="p-6">
                  <h3 className="mb-2 font-medium">{article.title}</h3>
                  <div className="mb-2 flex items-center gap-3">
                    <Chip>{article.category}</Chip>
                    <span className="text-sm text-gray-500">{article.date}</span>
                  </div>
                  <p className="line-clamp-3 text-sm text-gray-500">
                    {article.description || article.content}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
