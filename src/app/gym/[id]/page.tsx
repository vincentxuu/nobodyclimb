'use client'

import React, { useState, useEffect, use } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { MapPin, ArrowLeft, Clock, Phone, Facebook, CloudRain, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import PlaceholderImage from '@/components/ui/placeholder-image'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { useRouter } from 'next/navigation'

// 模擬攀岩館詳細資料
const gymData = [
  {
    id: 1,
    name: 'MegaSTONE Climbing Gym',
    updateDate: '2022. 08. 29',
    image: '/images/gym/megastone.jpg',
    location: '新北市新莊區中正路56巷5號',
    weather: {
      city: '臺北市',
      temperature: 16,
      condition: '陰短暫雨 稍有寒意',
      precipitationChance: 40,
    },
    intro: `台北最有挑戰的攀岩場——位於青少年發展處九樓的攀岩場，是全台灣最早的攀岩場，也是台北市目前最高的攀岩場．12公尺高且具備多種難度的攀爬路線，一向是有經驗的攀爬者及想愛挑戰的新手優先選擇的攀爬場館．攀岩館目前由台北市青少年發展處統一管理，須滿６歲才能購票入場，如需體驗請上網直接預約。

Y17攀岩館有別於大稻埕攀岩館，Y17 館具備豐富的地形及高達 12公尺的攀登高度，適合已經有基礎經驗（有綁繩攀爬３次以上）的學員前來挑戰。`,
    price: `單次入場
平日 $300
假日 $330
星光票 $200（當日最後兩小時）
租借岩鞋 $80
粉袋 $50
攀岩體驗課程
50 分鐘抱石體驗 $550/人（3-6 人同行）
一對二  $700/人
一對一 $900
80 分鐘抱石+上攀體驗 $900/人（3-6 人同行）
一對二  $1,000/人
一對一 $1,200
以上皆包含教練教學與岩鞋等裝備
需先預約，體驗結束可於場內免費抱石`,
    transportation: '捷運頭前庄站四號出口步行 2 分鐘',
    openingHours: `平日 14:30-22:30
週末 10:00-20:00`,
    contact: `電話：02-8992-8991
Facebook：MegaSTONE Climbing Gym`,
    notes: `基於衛生及安全考量，不可赤腳上岩牆攀爬，有攀岩鞋提供租賃。
購買時段票的岩友，記得時間到就不可以再攀爬囉！但可繼續待在岩場內休息。
若兒童及幼兒攀爬，家長單純入場不攀爬，一位小孩可以搭配兩位家長免費入場，第三位(含)以上陪同家長則需酌收入場清潔費70元。
5歲以上入場不攀爬者，需酌收場地費70元。`,
    photos: [
      '/images/gym/megastone1.jpg',
      '/images/gym/megastone2.jpg',
      '/images/gym/megastone3.jpg',
      '/images/gym/megastone4.jpg',
      '/images/gym/megastone5.jpg',
      '/images/gym/megastone6.jpg',
      '/images/gym/megastone7.jpg',
      '/images/gym/megastone8.jpg',
      '/images/gym/megastone9.jpg',
    ],
    prevGym: {
      id: 2,
      name: '市民抱石攀岩館\nCivic Bouldergym Taipei',
      location: '台北市 內湖區',
    },
    nextGym: {
      id: 3,
      name: '小岩攀岩館',
      location: '台中市北屯區',
    },
    relatedGyms: [
      {
        id: 4,
        name: '市民抱石攀岩館\nCivic Bouldergym Taipei',
        image: '/images/gym/civic.jpg',
        location: '台北市 內湖區',
      },
      {
        id: 5,
        name: '原岩攀岩館\nT-UP Climbing-Zhonghe',
        image: '/images/gym/tup.jpg',
        location: '台北市 內湖區',
      },
      {
        id: 6,
        name: '小岩攀岩館',
        image: '/images/gym/xiaoya.jpg',
        location: '台北市 內湖區',
      },
    ],
  },
]

export default function GymDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const router = useRouter()
  const gymId = parseInt(id)

  // 監聽滾動事件
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setShowBackToTop(true)
      } else {
        setShowBackToTop(false)
      }
    }

    window.addEventListener('scroll', toggleVisibility)
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  // 回到頂部
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  const currentGym = gymData.find((gym) => gym.id === gymId)
  if (!currentGym) {
    return <div>Gym not found</div>
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container relative mx-auto px-4 pt-20">
        <div className="mb-8">
          <Breadcrumb
            items={[
              { label: '首頁', href: '/' },
              { label: '岩館', href: '/gym' },
              { label: currentGym.name },
            ]}
          />
        </div>
        <div className="sticky left-0 top-0 z-30 mb-4 w-full bg-gray-50 py-3">
          <motion.div
            className="w-fit"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Link href="/gym">
              <Button
                variant="ghost"
                className="flex items-center gap-2 bg-white shadow-sm hover:bg-gray-200"
              >
                <ArrowLeft size={16} />
                <span>岩場介紹</span>
              </Button>
            </Link>
          </motion.div>
        </div>
        {/* 主要內容區 */}
        <div className="mb-12 mt-4 rounded-lg bg-white p-8 shadow-sm">
          {/* 照片展示區 */}
          <div className="mb-8">
            {/* 大圖 */}
            <div className="relative mb-2 h-96 w-full overflow-hidden rounded-lg">
              <PlaceholderImage text="攀岩館主圖" bgColor="#f8f9fa" />
            </div>

            {/* 照片縮略圖區 */}
            <div className="flex flex-nowrap gap-2 overflow-x-auto pb-2">
              {currentGym.photos.map((photo, index) => (
                <div
                  key={index}
                  className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md"
                >
                  <PlaceholderImage
                    text={`照片 ${index + 1}`}
                    bgColor="#f0f1f3"
                    textColor="#6c757d"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 標題 */}
          <div className="mb-8 flex items-start justify-between">
            <h1 className="text-3xl font-medium">{currentGym.name}</h1>
          </div>

          {/* 天氣資訊 */}
          <div className="mb-8 inline-block rounded-lg bg-gray-100 p-6">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="text-2xl font-medium text-gray-700">
                  {currentGym.weather.temperature}°C
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-700">{currentGym.weather.city}</p>
                <p className="text-xs text-gray-700">{currentGym.weather.condition}</p>
              </div>
            </div>
            <div className="mt-1 flex items-center">
              <CloudRain size={14} className="mr-1 text-gray-700" />
              <span className="text-xs text-gray-700">
                {currentGym.weather.precipitationChance}%
              </span>
            </div>
          </div>

          {/* 場地介紹 */}
          <div className="mb-8">
            <div className="mb-1">
              <h2 className="text-lg font-medium text-orange-500">場地介紹</h2>
              <div className="h-px w-full bg-gray-200"></div>
            </div>
            <div className="mt-4 whitespace-pre-line text-base">{currentGym.intro}</div>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div>
              {/* 收費方式 */}
              <div className="mb-8">
                <div className="mb-1">
                  <h2 className="text-lg font-medium text-orange-500">收費方式</h2>
                  <div className="h-px w-full bg-gray-200"></div>
                </div>
                <div className="mt-4 whitespace-pre-line text-base">{currentGym.price}</div>
              </div>
            </div>

            <div>
              {/* 交通方式 */}
              <div className="mb-6">
                <div className="mb-1">
                  <h2 className="text-lg font-medium text-orange-500">交通方式</h2>
                  <div className="h-px w-full bg-gray-200"></div>
                </div>
                <div className="mt-4">
                  <div className="mb-2 flex items-center">
                    <MapPin size={16} className="mr-2 text-gray-500" />
                    <p className="text-base text-gray-500">{currentGym.location}</p>
                  </div>
                  <p className="text-base">{currentGym.transportation}</p>
                </div>
              </div>

              {/* 營業時間 */}
              <div className="mb-6">
                <div className="mb-1">
                  <h2 className="text-lg font-medium text-orange-500">營業時間</h2>
                  <div className="h-px w-full bg-gray-200"></div>
                </div>
                <div className="mt-4 whitespace-pre-line text-base">{currentGym.openingHours}</div>
              </div>

              {/* 社群平台 */}
              <div className="mb-6">
                <div className="mb-1">
                  <h2 className="text-lg font-medium text-orange-500">社群平台</h2>
                  <div className="h-px w-full bg-gray-200"></div>
                </div>
                <div className="mt-4 whitespace-pre-line text-base text-gray-500">
                  {currentGym.contact}
                </div>
              </div>
            </div>
          </div>

          {/* 注意事項 */}
          <div className="mb-10">
            <div className="mb-1">
              <h2 className="text-lg font-medium text-orange-500">注意事項</h2>
              <div className="h-px w-full bg-gray-200"></div>
            </div>
            <div className="mt-4 whitespace-pre-line text-base">{currentGym.notes}</div>
          </div>

          {/* 上一篇/下一篇 */}
          <div className="grid grid-cols-1 gap-8 border-t border-gray-200 pt-6 md:grid-cols-2">
            <Link
              href={`/gym/${currentGym.prevGym.id}`}
              className="block rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
            >
              <div className="mb-3 flex items-center">
                <ArrowLeft size={16} className="mr-2 text-gray-500" />
                <span className="text-lg text-gray-500">上一篇</span>
              </div>
              <div>
                <p className="whitespace-pre-line text-base text-gray-500">
                  {currentGym.prevGym.name}
                </p>
                <p className="text-sm text-gray-400">{currentGym.prevGym.location}</p>
              </div>
            </Link>

            <Link
              href={`/gym/${currentGym.nextGym.id}`}
              className="block rounded-lg border border-gray-200 p-4 text-right hover:bg-gray-50"
            >
              <div className="mb-3 flex items-center justify-end">
                <span className="text-lg text-gray-500">下一篇</span>
                <ArrowLeft size={16} className="ml-2 rotate-180 transform text-gray-500" />
              </div>
              <div>
                <p className="text-base text-gray-500">{currentGym.nextGym.name}</p>
                <p className="text-sm text-gray-400">{currentGym.nextGym.location}</p>
              </div>
            </Link>
          </div>
        </div>

        {/* 其他岩場 */}
        <div className="mb-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-medium">其他岩場</h2>
            <Link
              href="/gym"
              className="rounded border border-gray-800 px-8 py-2 text-gray-800 transition hover:bg-gray-100"
            >
              更多岩場
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {currentGym.relatedGyms.map((gym) => (
              <Link
                href={`/gym/${gym.id}`}
                key={gym.id}
                className="overflow-hidden rounded-lg bg-white shadow-sm transition-shadow hover:shadow"
              >
                <div className="relative h-48">
                  <PlaceholderImage text={gym.name.split('\n')[0]} bgColor="#f8f9fa" />
                </div>
                <div className="p-4">
                  <h3 className="whitespace-pre-line text-base font-medium">{gym.name}</h3>
                  <div className="mt-2 flex items-center">
                    <MapPin size={14} className="mr-1 text-gray-500" />
                    <span className="text-sm text-gray-500">{gym.location}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* 回到頂部按鈕 */}
      {showBackToTop && (
        <motion.button
          className="fixed bottom-6 right-4 z-20 rounded-full bg-white p-2 shadow-md hover:bg-gray-200 md:bottom-10 md:right-8 md:p-3"
          onClick={scrollToTop}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          aria-label="回到頂部"
        >
          <ChevronUp size={20} className="md:h-6 md:w-6" />
        </motion.button>
      )}
    </main>
  )
}
