'use client'

/**
 * Profile 編輯器版本選擇頁面
 *
 * 讓用戶體驗三種不同的編輯方式，選擇最適合的版本
 */

import { motion } from 'framer-motion'
import { ChevronRight, LayoutGrid, ListOrdered, MousePointer } from 'lucide-react'
import { useTranslations } from 'next-intl'
import React, { useState } from 'react'
import ProfileEditorVersionA from './ProfileEditorVersionA'
import ProfileEditorVersionB from './ProfileEditorVersionB'
import ProfileEditorVersionC from './ProfileEditorVersionC'

type EditorVersion = 'selector' | 'A' | 'B' | 'C'

interface VersionOption {
  id: 'A' | 'B' | 'C'
  icon: React.ReactNode
}

// 文字由訊息檔 `ProfileEditor.selector.options.<id>` 提供
const VERSION_OPTIONS: VersionOption[] = [
  { id: 'A', icon: <LayoutGrid className="h-8 w-8" /> },
  { id: 'B', icon: <MousePointer className="h-8 w-8" /> },
  { id: 'C', icon: <ListOrdered className="h-8 w-8" /> },
]

const PRO_KEYS = ['pro1', 'pro2', 'pro3'] as const

export default function ProfileEditorSelector() {
  const t = useTranslations('ProfileEditor.selector')
  const [activeVersion, setActiveVersion] = useState<EditorVersion>('selector')
  const [hoveredVersion, setHoveredVersion] = useState<'A' | 'B' | 'C' | null>(null)

  // 渲染對應版本的編輯器
  if (activeVersion === 'A') {
    return <ProfileEditorVersionA onBack={() => setActiveVersion('selector')} />
  }

  if (activeVersion === 'B') {
    return <ProfileEditorVersionB onBack={() => setActiveVersion('selector')} />
  }

  if (activeVersion === 'C') {
    return (
      <ProfileEditorVersionC
        onBack={() => setActiveVersion('selector')}
        onComplete={() => setActiveVersion('selector')}
      />
    )
  }

  // 選擇器頁面
  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-white">
      <div className="mx-auto max-w-4xl px-4 py-12">
        {/* 標題 */}
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="mt-2 text-gray-500">{t('subtitle')}</p>
        </div>

        {/* 版本選項 */}
        <div className="grid gap-6 md:grid-cols-3">
          {VERSION_OPTIONS.map((option) => (
            <motion.div
              key={option.id}
              onMouseEnter={() => setHoveredVersion(option.id)}
              onMouseLeave={() => setHoveredVersion(null)}
              whileHover={{ y: -4 }}
              className="relative"
            >
              <button
                onClick={() => setActiveVersion(option.id)}
                className={`group relative flex h-full w-full flex-col overflow-hidden rounded-lg border-2 bg-white p-6 text-left transition-all ${
                  hoveredVersion === option.id
                    ? 'border-gray-900 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* 圖標 */}
                <div
                  className={`mb-4 flex h-16 w-16 items-center justify-center rounded-lg transition-colors ${
                    hoveredVersion === option.id
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {option.icon}
                </div>

                {/* 標題 */}
                <h2 className="text-lg font-semibold text-gray-900">
                  {t(`options.${option.id}.title`)}
                </h2>
                <p className="text-sm text-gray-500">{t(`options.${option.id}.subtitle`)}</p>

                {/* 說明 */}
                <p className="mt-3 flex-1 text-sm text-gray-600">
                  {t(`options.${option.id}.description`)}
                </p>

                {/* 優點列表 */}
                <ul className="mt-4 space-y-1">
                  {PRO_KEYS.map((proKey) => (
                    <li key={proKey} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      {t(`options.${option.id}.${proKey}`)}
                    </li>
                  ))}
                </ul>

                {/* 適合用戶 */}
                <div className="mt-4 rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">{t('bestForLabel')}</p>
                  <p className="text-sm font-medium text-gray-700">
                    {t(`options.${option.id}.bestFor`)}
                  </p>
                </div>

                {/* 試用按鈕 */}
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{t('tryThis')}</span>
                  <ChevronRight
                    className={`h-5 w-5 transition-transform ${
                      hoveredVersion === option.id ? 'translate-x-1' : ''
                    }`}
                  />
                </div>
              </button>

              {/* 推薦標籤 */}
              {option.id === 'B' && (
                <div className="absolute -top-2 left-4 rounded-full bg-amber-500 px-3 py-1 text-xs font-medium text-white">
                  {t('recommended')}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* 比較表格 */}
        <div className="mt-16">
          <h2 className="mb-6 text-center text-xl font-semibold text-gray-900">
            {t('compareTitle')}
          </h2>

          <div className="overflow-hidden rounded-lg border bg-white">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    {t('featureHeader')}
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-900">
                    {t('versionLabel', { version: 'A' })}
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-900">
                    {t('versionLabel', { version: 'B' })}
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-900">
                    {t('versionLabel', { version: 'C' })}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-600">{t('featureLivePreview')}</td>
                  <td className="px-6 py-4 text-center">○</td>
                  <td className="px-6 py-4 text-center text-green-600">●</td>
                  <td className="px-6 py-4 text-center">○</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-600">{t('featureAutoSave')}</td>
                  <td className="px-6 py-4 text-center">○</td>
                  <td className="px-6 py-4 text-center text-green-600">●</td>
                  <td className="px-6 py-4 text-center text-green-600">●</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-600">{t('featureProgress')}</td>
                  <td className="px-6 py-4 text-center text-green-600">●</td>
                  <td className="px-6 py-4 text-center">○</td>
                  <td className="px-6 py-4 text-center text-green-600">●</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-600">{t('featureQuickSwitch')}</td>
                  <td className="px-6 py-4 text-center text-green-600">●</td>
                  <td className="px-6 py-4 text-center text-green-600">●</td>
                  <td className="px-6 py-4 text-center">○</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-600">{t('featureBeginner')}</td>
                  <td className="px-6 py-4 text-center">○</td>
                  <td className="px-6 py-4 text-center">○</td>
                  <td className="px-6 py-4 text-center text-green-600">●</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-600">{t('featureMobile')}</td>
                  <td className="px-6 py-4 text-center">○</td>
                  <td className="px-6 py-4 text-center text-green-600">●</td>
                  <td className="px-6 py-4 text-center text-green-600">●</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 提示 */}
        <div className="mt-8 text-center text-sm text-gray-500">{t('hint')}</div>
      </div>
    </div>
  )
}
