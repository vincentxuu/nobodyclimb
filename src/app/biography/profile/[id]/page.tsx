'use client'

import React, { useState, useEffect, use } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CardPersonList } from '@/components/biography/card-person-list'
import { biographyData } from '@/data/biographyData'
import { Breadcrumb } from '@/components/ui/breadcrumb'

interface ProfilePageProps {
  params: Promise<{
    id: string
  }>
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const router = useRouter()
  const { id } = use(params)
  const personId = parseInt(id)
  const [showBackToTop, setShowBackToTop] = useState(false)

  // 監聽滾動事件，決定是否顯示回到頂部按鈕
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowBackToTop(true)
      } else {
        setShowBackToTop(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 回到頂部函數
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  // 取得人物資料
  const person = biographyData.find((person) => person.id === personId)

  // 上一篇和下一篇的 ID
  const prevId = personId > 1 ? personId - 1 : biographyData.length
  const nextId = personId < biographyData.length ? personId + 1 : 1

  if (!person) {
    return <div className="container mx-auto px-4 py-16 text-center">人物資料不存在</div>
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <div className="container relative mx-auto px-4 pb-4 pt-20">
        <div className="mb-8">
          <Breadcrumb
            items={[
              { label: '首頁', href: '/' },
              { label: '人物誌', href: '/biography' },
              { label: person.name },
            ]}
          />
        </div>
        <div className="sticky left-0 top-0 z-30 mb-4 flex w-full items-center justify-between bg-[#f5f5f5] py-3">
          <motion.div
            className="w-fit"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Link href="/biography">
              <Button
                variant="ghost"
                className="flex items-center gap-2 bg-white shadow-sm hover:bg-[#dbd8d8]"
              >
                <ArrowLeft size={16} />
                <span>人物誌</span>
              </Button>
            </Link>
          </motion.div>
        </div>

        <motion.div
          className="mx-auto mt-8 max-w-3xl bg-white p-6 md:p-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="mb-2 text-3xl font-medium text-[#1B1A1A]">攀岩小人物—{person.name}</h1>
          <p className="mb-6 text-sm text-gray-500">更新日期 {person.time}</p>

          <div className="relative mb-8 h-[360px] overflow-hidden">
            <Image src={person.imageSrc} alt={person.name} fill className="object-cover" />
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="mb-4 border-b border-[#dbd8d8] pb-2 text-xl font-medium">
                哪一年開始攀岩
              </h2>
              <p className="text-base text-[#1B1A1A]">{person.start}</p>
            </div>

            <div>
              <h2 className="mb-4 border-b border-[#dbd8d8] pb-2 text-xl font-medium">
                平常出沒岩場
              </h2>
              <p className="text-base text-[#1B1A1A]">{person.showUp}</p>
            </div>

            <div>
              <h2 className="mb-4 border-b border-[#dbd8d8] pb-2 text-xl font-medium">
                喜歡的路線型態
              </h2>
              <p className="text-base text-[#1B1A1A]">{person.type}</p>
            </div>

            <div>
              <h2 className="mb-4 border-b border-[#dbd8d8] pb-2 text-xl font-medium">
                踏上攀岩不歸路的原因
              </h2>
              <p className="text-base text-[#1B1A1A]">{person.reason}</p>
            </div>

            <div>
              <h2 className="mb-4 border-b border-[#dbd8d8] pb-2 text-xl font-medium">
                攀岩對你來說，是什麼樣的存在
              </h2>
              <p className="text-base text-[#1B1A1A]">{person.why}</p>
            </div>

            <div>
              <h2 className="mb-4 border-b border-[#dbd8d8] pb-2 text-xl font-medium">
                在攀岩世界裡，想做的人生清單有什麼
              </h2>
              <div className="relative mb-4 h-[360px] overflow-hidden">
                <Image
                  src={person.detailImageSrc}
                  alt={`${person.name} 人生清單`}
                  fill
                  className="object-cover"
                />
              </div>
              <p className="text-base text-[#1B1A1A]">{person.list}</p>
            </div>

            <div>
              <h2 className="mb-4 border-b border-[#dbd8d8] pb-2 text-xl font-medium">
                對於初踏入攀岩的岩友，留言給他們的一句話
              </h2>
              <p className="text-base text-[#1B1A1A]">{person.word}</p>
            </div>
          </div>

          <div className="mb-6 mt-12 flex justify-between">
            <Link href={`/biography/profile/${prevId}`}>
              <Button
                variant="outline"
                className="flex items-center gap-2 border border-[#1B1A1A] text-[#1B1A1A] hover:bg-[#dbd8d8]"
              >
                <ArrowLeft size={16} />
                <span>上一篇</span>
              </Button>
            </Link>

            <Link href={`/biography/profile/${nextId}`}>
              <Button
                variant="outline"
                className="flex items-center gap-2 border border-[#1B1A1A] text-[#1B1A1A] hover:bg-[#dbd8d8]"
              >
                <span>下一篇</span>
                <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>

      <div className="mt-10 bg-[#dbd8d8] py-10">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 text-center text-2xl font-medium">相關文章</h2>
          <CardPersonList />

          <div className="mt-10 flex justify-center">
            <Link href="/biography">
              <Button
                variant="outline"
                className="h-11 border border-[#1B1A1A] px-8 text-[#1B1A1A] hover:bg-[#dbd8d8] hover:text-[#1B1A1A]"
              >
                更多小人物
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 回到頂部按鈕 */}
      {showBackToTop && (
        <motion.button
          className="fixed bottom-6 right-4 z-20 rounded-full bg-white p-2 shadow-md hover:bg-[#dbd8d8] md:bottom-10 md:right-8 md:p-3"
          onClick={scrollToTop}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          aria-label="回到頂部"
        >
          <ChevronUp size={20} className="md:h-6 md:w-6" />
        </motion.button>
      )}
    </div>
  )
}
