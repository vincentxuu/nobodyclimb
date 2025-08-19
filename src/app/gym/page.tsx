'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { MapPin, Filter } from 'lucide-react'
import BackToTop from '@/components/ui/back-to-top'
import PlaceholderImage from '@/components/ui/placeholder-image'
import { Breadcrumb } from '@/components/ui/breadcrumb'

// 攀岩館資料（模擬資料，實際應用中可能來自API）
const gyms = [
  {
    id: 1,
    name: '小岩攀岩館',
    englishName: '', // 沒有英文名稱
    image: '/images/gym/xiaoya.jpg',
    location: '台北市 內湖區',
    type: '抱石',
    facilities: ['抱石區', '體能訓練區', '休息區'],
    rating: 4.5,
  },
  {
    id: 2,
    name: '市民抱石攀岩館',
    englishName: 'Civic Bouldergym Taipei',
    image: '/images/gym/civic.jpg',
    location: '台北市 內湖區',
    type: '抱石',
    facilities: ['抱石區', '體能訓練區', '休息區', '淋浴設施'],
    rating: 4.8,
  },
  {
    id: 3,
    name: '原岩攀岩館',
    englishName: 'T-UP Climbing-Zhonghe',
    image: '/images/gym/tup.jpg',
    location: '新北市 中和區',
    type: '上攀和抱石',
    facilities: ['抱石區', '先鋒攀登', '體能訓練區', '休息區'],
    rating: 4.7,
  },
  {
    id: 4,
    name: 'POGO 攀岩館',
    englishName: '',
    image: '/images/gym/pogo.jpg',
    location: '台北市 松山區',
    type: '抱石',
    facilities: ['抱石區', '體能訓練區', '休息區', '咖啡廳'],
    rating: 4.6,
  },
  {
    id: 5,
    name: '攀吶攀岩館',
    englishName: 'Pamoja Climbing Gym',
    image: '/images/gym/pamoja.jpg',
    location: '新北市 板橋區',
    type: '抱石',
    facilities: ['抱石區', '體能訓練區', '休息區', '淋浴設施'],
    rating: 4.4,
  },
  {
    id: 6,
    name: '奇岩攀岩館',
    englishName: 'Wonder Climbing Gym',
    image: '/images/gym/wonder.jpg',
    location: '台北市 大安區',
    type: '上攀和抱石',
    facilities: ['抱石區', '先鋒攀登', '體能訓練區', '兒童區'],
    rating: 4.9,
  },
  {
    id: 7,
    name: '岩究所攀岩館',
    englishName: 'Climbing Lab',
    image: '/images/gym/climbinglab.jpg',
    location: '台北市 信義區',
    type: '抱石',
    facilities: ['抱石區', '體能訓練區', '休息區'],
    rating: 4.5,
  },
  {
    id: 8,
    name: 'Boulder Space 攀岩館',
    englishName: '',
    image: '/images/gym/boulderspace.jpg',
    location: '台北市 中山區',
    type: '抱石',
    facilities: ['抱石區', '體能訓練區', '休息區', '咖啡廳'],
    rating: 4.7,
  },
  {
    id: 9,
    name: '破舊二廠攀岩館',
    englishName: 'Shabby Factory 2',
    image: '/images/gym/shabby2.jpg',
    location: '桃園市 中壢區',
    type: '抱石',
    facilities: ['抱石區', '體能訓練區', '休息區'],
    rating: 4.6,
  },
  {
    id: 10,
    name: 'The Rock 原石攀岩館',
    englishName: '',
    image: '/images/gym/therock.jpg',
    location: '台中市 西區',
    type: '上攀和抱石',
    facilities: ['抱石區', '先鋒攀登', '體能訓練區', '休息區'],
    rating: 4.8,
  },
  {
    id: 11,
    name: '春天攀岩館',
    englishName: 'Spring Climbing Gym',
    image: '/images/gym/spring.jpg',
    location: '台中市 北區',
    type: '抱石',
    facilities: ['抱石區', '體能訓練區', '休息區', '淋浴設施'],
    rating: 4.5,
  },
  {
    id: 12,
    name: '熊爪攀岩館',
    englishName: 'Bear Claw Climbing Gym',
    image: '/images/gym/bearclaw.jpg',
    location: '高雄市 三民區',
    type: '上攀和抱石',
    facilities: ['抱石區', '先鋒攀登', '體能訓練區', '休息區'],
    rating: 4.7,
  },
]

// 區域篩選選項
const regions = [
  '所有地區',
  '大台北',
  '桃園',
  '新竹',
  '苗栗',
  '台中',
  '彰化',
  '南投',
  '雲林',
  '嘉義',
  '台南',
  '高雄',
  '屏東',
  '宜蘭',
  '花蓮',
  '台東',
]

// 攀岩館類型篩選選項
const gymTypes = ['所有類型', '上攀', '抱石']

export default function GymListPage() {
  const [selectedRegion, setSelectedRegion] = useState('所有地區')
  const [selectedType, setSelectedType] = useState('所有類型')
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // 篩選攀岩館
  const filteredGyms = gyms.filter((gym) => {
    const regionMatch =
      selectedRegion === '所有地區' ||
      (selectedRegion === '大台北' &&
        (gym.location.includes('台北') || gym.location.includes('新北'))) ||
      gym.location.includes(selectedRegion)

    const typeMatch =
      selectedType === '所有類型' || gym.type.toLowerCase().includes(selectedType.toLowerCase())

    return regionMatch && typeMatch
  })

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 頂部橫幅 */}
      <div className="relative h-[30vh] overflow-hidden bg-gray-800 md:h-[40vh]">
        <PlaceholderImage text="台灣攀岩館" bgColor="#1f2937" textColor="#f9fafb" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-60"></div>
        <div className="container absolute bottom-0 left-0 right-0 mx-auto p-8 text-white">
          <h1 className="mb-4 text-4xl font-medium md:text-5xl">岩館介紹</h1>
          <p className="max-w-3xl text-base md:text-lg">探索台灣各式各樣有趣的岩館</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Breadcrumb items={[{ label: '首頁', href: '/' }, { label: '岩館' }]} />
        </div>

        {/* 篩選區塊 */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold">篩選</h2>
            <button
              className="flex items-center font-medium text-blue-600 md:hidden"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <Filter size={18} className="mr-1" />
              {isFilterOpen ? '收起篩選' : '展開篩選'}
            </button>
          </div>

          <div className={`${isFilterOpen ? 'block' : 'hidden md:block'}`}>
            <div className="space-y-6">
              <div>
                <h3 className="mb-3 font-medium text-gray-900">地區篩選</h3>
                <div className="flex flex-wrap gap-2">
                  {regions.map((region) => (
                    <button
                      key={region}
                      className={`rounded-lg px-4 py-2.5 text-sm transition ${
                        selectedRegion === region
                          ? 'border border-gray-300 bg-white font-medium text-black'
                          : 'border border-gray-100 bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => setSelectedRegion(region)}
                    >
                      {region}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-3 font-medium text-gray-900">類型篩選</h3>
                <div className="flex flex-wrap gap-2">
                  {gymTypes.map((type) => (
                    <button
                      key={type}
                      className={`rounded-lg px-4 py-2.5 text-sm transition ${
                        selectedType === type
                          ? 'border border-gray-300 bg-white font-medium text-black'
                          : 'border border-gray-100 bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => setSelectedType(type)}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 搜尋結果 */}
        <div className="mb-4">
          <p className="text-sm text-gray-500">
            找到 <span className="font-medium text-gray-900">{filteredGyms.length}</span> 個攀岩館
          </p>
        </div>

        {/* 攀岩館列表 */}
        <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredGyms.map((gym) => (
            <motion.div
              key={gym.id}
              className="overflow-hidden rounded-lg bg-white shadow-sm transition-shadow hover:shadow"
              whileHover={{ y: -3 }}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Link href={`/gym/${gym.id}`}>
                <div className="relative h-48 w-full bg-gray-100">
                  <PlaceholderImage text={gym.name} bgColor="#f8fafc" textColor="#64748b" />
                </div>
                <div className="p-4">
                  <div className="mb-2">
                    <h3 className="text-base font-bold text-gray-900">{gym.name}</h3>
                    {gym.englishName && <p className="text-sm text-gray-500">{gym.englishName}</p>}
                  </div>

                  <div className="flex items-center">
                    <MapPin size={14} className="mr-1 text-gray-400" />
                    <span className="text-sm text-gray-600">{gym.location}</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* 查看更多按鈕 */}
        {filteredGyms.length > 0 && (
          <div className="mb-8 mt-6 flex justify-center">
            <button className="rounded-md border border-black px-8 py-2.5 text-sm font-medium text-black transition hover:bg-gray-50">
              看更多
            </button>
          </div>
        )}

        {/* 無結果提示 */}
        {filteredGyms.length === 0 && (
          <div className="py-12 text-center">
            <p className="mb-4 text-lg text-gray-500">沒有找到符合條件的攀岩館</p>
            <button
              className="border-b border-gray-900 pb-1 text-gray-900 transition-colors hover:border-gray-700 hover:text-gray-700"
              onClick={() => {
                setSelectedRegion('所有地區')
                setSelectedType('所有類型')
              }}
            >
              清除篩選條件
            </button>
          </div>
        )}
      </div>
      <BackToTop />
    </main>
  )
}
