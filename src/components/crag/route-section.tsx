'use client'

import React, { useState } from 'react'
import { Eye, ExternalLink, X, ChevronLeft, ChevronRight, Info } from 'lucide-react'
import Image from 'next/image'
import * as Dialog from '@radix-ui/react-dialog'

interface RouteType {
  id: string
  name: string
  englishName: string
  grade: string
  length: string
  type: string
  firstAscent: string
  area: string
  description: string
  protection: string
  popularity: number
  views: number
  // 新增欄位
  images?: string[]
  videos?: string[]
  tips?: string
}

interface CragRouteSectionProps {
  routes: RouteType[]
}

export const CragRouteSection: React.FC<CragRouteSectionProps> = ({ routes }) => {
  const [selectedRoute, setSelectedRoute] = useState<RouteType | null>(null)
  const [showPhotos, setShowPhotos] = useState(false)
  const [showTips, setShowTips] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

  // 路線點擊處理
  const handleRouteClick = (route: RouteType) => {
    setSelectedRoute(route)
  }

  return (
    <div>
      <h2 className="mb-4 border-l-4 border-[#FFE70C] pl-4 text-2xl font-bold">路線資訊</h2>

      <div className="mb-6 flex items-center rounded-lg border-l-4 border-[#FFE70C] bg-yellow-50 p-4">
        <div className="mr-2 text-[#1B1A1A]">
          <Info size={20} />
        </div>
        <p className="text-sm text-[#1B1A1A]">
          點擊路線名稱或「查看詳情」按鈕可展開路線內容，包含路線描述、保護裝備、路線照片和攀登攻略。
        </p>
      </div>

      {/* 路線表格 */}
      <div className="mb-8 overflow-x-auto">
        <table className="min-w-full border-collapse overflow-hidden rounded-lg border-gray-200">
          <thead className="bg-white">
            <tr className="border-b border-t border-gray-200">
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                路線名稱
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                難度
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                長度
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                類型
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                區域
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                人氣
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {routes.map((route) => (
              <tr
                key={route.id}
                className={`relative border-b border-gray-200 transition-colors ${selectedRoute?.id === route.id ? 'bg-yellow-50' : 'hover:bg-gray-100'} cursor-pointer`}
                onClick={() => handleRouteClick(route)}
                role="button"
                aria-label={`查看 ${route.name} 路線詳情`}
              >
                <td className="relative whitespace-nowrap py-4 pl-6">
                  {selectedRoute?.id === route.id && (
                    <div className="absolute bottom-2 left-0 top-2 w-1 bg-[#FFE70C]"></div>
                  )}
                  <div className="flex items-center">
                    <div className="group text-sm font-medium">
                      <span className="flex items-center text-[#1B1A1A] transition-colors group-hover:text-[#FFE70C]">
                        {route.name}
                        <ExternalLink
                          size={14}
                          className="ml-1 text-gray-400 transition-colors group-hover:text-[#FFE70C]"
                        />
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">{route.englishName}</div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium leading-5 text-[#1B1A1A]">
                    {route.grade}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {route.length}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{route.type}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{route.area}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Eye size={16} className="mr-1 text-gray-400" />
                    <span>{route.views}</span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  <button
                    className="flex items-center rounded-full bg-[#FFE70C] px-4 py-1 text-xs font-medium text-[#1B1A1A] shadow-sm transition-colors hover:bg-[#FFE70C]/80"
                    onClick={(e) => {
                      e.stopPropagation() // 防止觸發行點擊事件
                      handleRouteClick(route)
                    }}
                  >
                    <Eye size={14} className="mr-1" />
                    查看詳情
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 路線詳細資訊 */}
      {selectedRoute && (
        <div className="mb-6 rounded-lg bg-gray-50 p-6">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold">{selectedRoute.name}</h3>
              <p className="text-gray-500">{selectedRoute.englishName}</p>
            </div>
            <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold text-[#1B1A1A]">
              {selectedRoute.grade}
            </span>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h4 className="mb-2 border-l-2 border-[#FFE70C] pl-2 font-medium text-gray-800">
                路線資訊
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">長度:</span>
                  <span className="font-medium">{selectedRoute.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">類型:</span>
                  <span className="font-medium">{selectedRoute.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">首登:</span>
                  <span className="font-medium">{selectedRoute.firstAscent}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">區域:</span>
                  <span className="font-medium">{selectedRoute.area}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="mb-2 border-l-2 border-[#FFE70C] pl-2 font-medium text-gray-800">
                保護裝備
              </h4>
              <p className="text-gray-700">{selectedRoute.protection}</p>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="mb-2 border-l-2 border-[#FFE70C] pl-2 font-medium text-gray-800">
              路線描述
            </h4>
            <p className="text-gray-700">{selectedRoute.description}</p>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              className="flex items-center rounded-md bg-gray-200 px-4 py-2 text-[#1B1A1A] transition hover:bg-gray-300"
              onClick={() => setShowPhotos(true)}
              disabled={!selectedRoute?.images?.length}
            >
              <ExternalLink size={16} className="mr-2" />
              查看路線照片
            </button>
            <button
              className="flex items-center rounded-md bg-[#1B1A1A] px-4 py-2 text-white transition hover:bg-black"
              onClick={() => setShowTips(true)}
              disabled={!selectedRoute?.tips}
            >
              <ExternalLink size={16} className="mr-2" />
              查看攀登攻略
            </button>
          </div>
        </div>
      )}

      {/* 路線照片彈窗 */}
      {selectedRoute && (
        <Dialog.Root open={showPhotos} onOpenChange={setShowPhotos}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/70" />
            <Dialog.Content className="fixed inset-0 flex items-center justify-center p-4">
              <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-xl">
                <div className="flex items-center justify-between border-b p-4">
                  <Dialog.Title className="text-lg font-bold text-[#1B1A1A]">
                    {selectedRoute.name} 路線照片
                  </Dialog.Title>
                  <Dialog.Close className="rounded-full p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-[#1B1A1A]">
                    <X size={20} />
                  </Dialog.Close>
                </div>

                {selectedRoute.images && selectedRoute.images.length > 0 ? (
                  <div className="relative">
                    <div className="relative h-[60vh] w-full">
                      <div className="flex h-full w-full items-center justify-center bg-gray-200">
                        <div className="p-8 text-center text-gray-600">
                          [{selectedRoute.name} 路線照片 {currentPhotoIndex + 1}/
                          {selectedRoute.images.length}]
                        </div>
                      </div>
                    </div>

                    {/* 導航按鈕 */}
                    {selectedRoute.images.length > 1 && (
                      <div className="absolute inset-0 flex items-center justify-between px-4">
                        <button
                          onClick={() =>
                            setCurrentPhotoIndex((prev) =>
                              prev === 0 ? selectedRoute.images!.length - 1 : prev - 1
                            )
                          }
                          className="rounded-full bg-white/80 p-2 shadow-md transition-colors hover:bg-white"
                        >
                          <ChevronLeft size={24} />
                        </button>
                        <button
                          onClick={() =>
                            setCurrentPhotoIndex((prev) =>
                              prev === selectedRoute.images!.length - 1 ? 0 : prev + 1
                            )
                          }
                          className="rounded-full bg-white/80 p-2 shadow-md transition-colors hover:bg-white"
                        >
                          <ChevronRight size={24} />
                        </button>
                      </div>
                    )}

                    {/* 縮圖導航 */}
                    {selectedRoute.images.length > 1 && (
                      <div className="flex justify-center space-x-2 bg-gray-100 p-4">
                        {selectedRoute.images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentPhotoIndex(index)}
                            className={`h-3 w-3 rounded-full ${currentPhotoIndex === index ? 'bg-[#FFE70C]' : 'bg-gray-300'}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">暫無路線照片</div>
                )}
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}

      {/* 攀登攻略彈窗 */}
      {selectedRoute && (
        <Dialog.Root open={showTips} onOpenChange={setShowTips}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/70" />
            <Dialog.Content className="fixed inset-0 flex items-center justify-center p-4">
              <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-lg bg-white shadow-xl">
                <div className="flex items-center justify-between border-b p-4">
                  <Dialog.Title className="text-lg font-bold text-[#1B1A1A]">
                    {selectedRoute.name} 攀登攻略
                  </Dialog.Title>
                  <Dialog.Close className="rounded-full p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-[#1B1A1A]">
                    <X size={20} />
                  </Dialog.Close>
                </div>

                <div className="p-6">
                  <h3 className="mb-4 border-l-4 border-[#FFE70C] pl-3 text-xl font-bold">
                    攀登技巧
                  </h3>
                  <p className="mb-6 leading-relaxed text-gray-700">
                    {selectedRoute.tips || '暫無攀登攻略'}
                  </p>

                  <h3 className="mb-4 border-l-4 border-[#FFE70C] pl-3 text-xl font-bold">
                    攀登影片
                  </h3>

                  {selectedRoute.videos && selectedRoute.videos.length > 0 ? (
                    <div className="space-y-6">
                      {selectedRoute.videos.map((videoUrl, index) => (
                        <div key={index} className="aspect-video w-full">
                          <iframe
                            src={videoUrl}
                            className="h-full w-full rounded-lg"
                            title={`${selectedRoute.name} 攀登影片 ${index + 1}`}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-gray-500">暫無攀登影片</div>
                  )}
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </div>
  )
}
