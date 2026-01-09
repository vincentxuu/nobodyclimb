# Instagram 整合快速開始指南

## 🚀 5 分鐘快速上手

### 1. 查看示範頁面

```bash
npm run dev
```

開啟瀏覽器訪問：`http://localhost:3000/instagram-demo`

### 2. 三種使用方式

#### 方式 A: 完整貼文卡片（推薦）⭐

顯示 **貼文內容 + 統計資訊 + Instagram 嵌入**

```tsx
import InstagramPostCard from '@/components/instagram/instagram-post-card'

const post = {
  id: 1,
  url: 'https://www.instagram.com/p/DQ0D25cE4Wa/',
  shortcode: 'DQ0D25cE4Wa',
  mediaType: 'IMAGE',
  caption: '龍洞攀岩紀錄 🧗‍♂️ #攀岩 #龍洞',
  username: 'climber_taiwan',
  postedAt: '2025-12-01T10:30:00Z',
  likesCount: 234,
  commentsCount: 18,
  hashtags: ['攀岩', '龍洞'],
  locationName: '龍洞攀岩場'
}

<InstagramPostCard post={post} showEmbed={true} />
```

**效果：**
- ✅ 使用者資訊（頭像、用戶名、地點）
- ✅ 貼文文字內容
- ✅ 按讚數、留言數、觀看數
- ✅ Hashtag 高亮
- ✅ Instagram 嵌入內容
- ✅ 互動按鈕

---

#### 方式 B: 多貼文網格

顯示 **多個貼文 + 篩選功能**

```tsx
import InstagramFeed from '@/components/instagram/instagram-feed'

<InstagramFeed
  posts={posts}        // 貼文陣列
  layout="grid"        // 網格佈局
  columns={3}          // 3 欄顯示
  showFilters={true}   // 顯示篩選器
  title="Instagram 攀登紀錄"
/>
```

**效果：**
- ✅ 網格/列表視圖切換
- ✅ 媒體類型篩選
- ✅ 響應式佈局
- ✅ 載入狀態
- ✅ 空狀態處理

---

#### 方式 C: 純 Instagram 嵌入（輕量）

只顯示 **Instagram 原始內容**

```tsx
import InstagramEmbed from '@/components/instagram/instagram-embed'

<InstagramEmbed url="https://www.instagram.com/p/DQ0D25cE4Wa/" />
```

**效果：**
- ✅ Instagram iframe 嵌入
- ✅ 自動響應式
- ✅ 載入/錯誤處理

---

## 📝 資料結構

```typescript
interface InstagramPostData {
  id: number                        // 貼文 ID
  url: string                       // Instagram URL
  shortcode: string                 // Instagram shortcode
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | 'REEL'
  caption: string                   // 貼文文字
  username: string                  // 發布者
  userProfilePic?: string          // 頭像 URL
  postedAt: string                  // 發布時間（ISO 8601）
  likesCount: number               // 按讚數
  commentsCount: number            // 留言數
  viewsCount?: number              // 觀看數（影片）
  hashtags?: string[]              // Hashtag 陣列
  locationName?: string            // 地點名稱
}
```

---

## 🎯 在岩場頁面使用

```tsx
// src/app/crag/[id]/page.tsx

import InstagramFeed from '@/components/instagram/instagram-feed'

export default async function CragDetailPage({ params }) {
  const { id } = await params

  // 範例資料（實際應從 API 取得）
  const posts = [
    {
      id: 1,
      url: 'https://www.instagram.com/p/DQ0D25cE4Wa/',
      shortcode: 'DQ0D25cE4Wa',
      mediaType: 'IMAGE',
      caption: '龍洞攀岩紀錄！',
      username: 'climber',
      postedAt: '2025-12-01T10:30:00Z',
      likesCount: 234,
      commentsCount: 18,
      hashtags: ['攀岩', '龍洞'],
      locationName: '龍洞攀岩場'
    }
  ]

  return (
    <div>
      {/* 岩場資訊 */}
      <section>...</section>

      {/* Instagram 區塊 */}
      {posts.length > 0 && (
        <section className="mt-12">
          <InstagramFeed
            posts={posts}
            layout="grid"
            columns={3}
            showFilters={true}
            title="📸 Instagram 攀登紀錄"
          />
        </section>
      )}
    </div>
  )
}
```

---

## ⚙️ 元件 Props

### InstagramPostCard

| Prop | 類型 | 預設值 | 說明 |
|------|------|--------|------|
| `post` | `InstagramPostData` | 必填 | 貼文資料 |
| `showEmbed` | `boolean` | `true` | 是否顯示 Instagram 嵌入 |
| `expandable` | `boolean` | `false` | 長文是否可展開 |
| `className` | `string` | `''` | 自訂樣式 |

### InstagramFeed

| Prop | 類型 | 預設值 | 說明 |
|------|------|--------|------|
| `posts` | `InstagramPostData[]` | 必填 | 貼文陣列 |
| `layout` | `'grid' \| 'list'` | `'grid'` | 顯示模式 |
| `columns` | `1 \| 2 \| 3 \| 4` | `3` | 網格列數 |
| `showFilters` | `boolean` | `false` | 顯示篩選器 |
| `showEmbeds` | `boolean` | `true` | 顯示嵌入內容 |
| `title` | `string` | - | 標題 |
| `loading` | `boolean` | `false` | 載入狀態 |
| `className` | `string` | `''` | 自訂樣式 |

### InstagramEmbed

| Prop | 類型 | 預設值 | 說明 |
|------|------|--------|------|
| `url` | `string` | 必填 | Instagram URL |
| `width` | `number` | `540` | 寬度（px） |
| `height` | `number` | `700` | 高度（px） |
| `captioned` | `boolean` | `true` | 顯示 caption |
| `className` | `string` | `''` | 自訂樣式 |

---

## 🔍 範例：從 API 載入資料

```tsx
'use client'

import { useEffect, useState } from 'react'
import InstagramFeed from '@/components/instagram/instagram-feed'

export default function CragInstagramSection({ cragId }: { cragId: number }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPosts() {
      try {
        const response = await fetch(`/api/crags/${cragId}/instagram-posts/`)
        const data = await response.json()
        setPosts(data.data)
      } catch (error) {
        console.error('Failed to fetch Instagram posts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [cragId])

  return (
    <InstagramFeed
      posts={posts}
      loading={loading}
      layout="grid"
      columns={3}
      showFilters={true}
      title="Instagram 攀登紀錄"
    />
  )
}
```

---

## 📚 完整文件

- **需求文件**: `docs/ig-show-video/demand.md`
- **規劃文件**: `docs/ig-show-video/plan.md`
- **實作指南**: `docs/ig-show-video/implementation-guide.md`
- **專案總覽**: `docs/ig-show-video/README.md`

---

## ✅ 核心功能確認

- ✅ Instagram 貼文可以顯示在網頁上
- ✅ 包含完整內容資訊（caption、按讚數、留言數等）
- ✅ 支援圖片、影片、輪播、Reels
- ✅ 響應式設計
- ✅ 可整合到岩場頁面
- ✅ 提供多種顯示方式

---

**下一步**: 查看 `plan.md` 瞭解完整的後端 API 實作規劃
