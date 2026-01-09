# Instagram 貼文與影片整合專案

## 📋 專案概述

本專案實作了將 Instagram 貼文與影片整合至 nobodyclimb-fe 網站的功能，讓使用者能夠在瀏覽攀岩路線、岩場資訊時，同時看到相關的 Instagram 攀登紀錄與照片。

## ✅ 已完成項目

### 1. 核心元件（Frontend）

#### `InstagramEmbed` 元件
- **位置**: `src/components/instagram/instagram-embed.tsx`
- **功能**: 基礎 Instagram iframe 嵌入
- **特點**:
  - ✅ 自動從 URL 提取 shortcode
  - ✅ 載入狀態顯示
  - ✅ 錯誤處理與後備連結
  - ✅ 可自訂寬度、高度
  - ✅ 響應式設計

**使用範例:**
```tsx
<InstagramEmbed
  url="https://www.instagram.com/p/DQ0D25cE4Wa/"
  width={540}
  height={700}
/>
```

#### `InstagramPostCard` 元件 ⭐
- **位置**: `src/components/instagram/instagram-post-card.tsx`
- **功能**: 顯示完整貼文資訊 + Instagram 嵌入
- **特點**:
  - ✅ 使用者資訊（頭像、用戶名、地點）
  - ✅ 貼文內容與 caption
  - ✅ 統計資訊（按讚數、留言數、觀看數）
  - ✅ Hashtag 高亮顯示
  - ✅ 發布時間
  - ✅ 互動按鈕（按讚、留言、收藏）
  - ✅ 可展開/收合長文
  - ✅ 前往 Instagram 連結

**使用範例:**
```tsx
<InstagramPostCard
  post={postData}
  showEmbed={true}
  expandable={true}
/>
```

#### `InstagramFeed` 元件
- **位置**: `src/components/instagram/instagram-feed.tsx`
- **功能**: 多貼文網格/列表展示
- **特點**:
  - ✅ 網格/列表視圖切換
  - ✅ 多種網格列數（1/2/3/4）
  - ✅ 媒體類型篩選
  - ✅ 載入狀態（骨架屏）
  - ✅ 空狀態處理
  - ✅ 貼文數量統計

**使用範例:**
```tsx
<InstagramFeed
  posts={posts}
  layout="grid"
  columns={3}
  showFilters={true}
  title="Instagram 攀登紀錄"
/>
```

### 2. TypeScript 類型定義

**InstagramPostData Interface:**
```typescript
interface InstagramPostData {
  id: number
  url: string
  shortcode: string
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | 'REEL'
  caption: string
  username: string
  userProfilePic?: string
  postedAt: string
  likesCount: number
  commentsCount: number
  viewsCount?: number
  hashtags?: string[]
  locationName?: string
}
```

### 3. 示範頁面

- **位置**: `src/app/instagram-demo/page.tsx`
- **URL**: `http://localhost:3000/instagram-demo`
- **內容**:
  - ✅ 完整貼文卡片展示
  - ✅ Instagram Feed 網格展示
  - ✅ 純 iframe 嵌入展示
  - ✅ 使用說明與程式碼範例
  - ✅ 功能特點說明
  - ✅ 實作計畫

## 📚 文件

1. **plan.md** - 完整專案規劃文件
   - 技術架構設計
   - 資料模型設計
   - API 設計
   - 實作階段規劃（8 週）
   - 技術挑戰與解決方案

2. **implementation-guide.md** - 實作指南
   - 嵌入方法驗證
   - Next.js 整合說明
   - 元件使用說明
   - 常見問題解答

3. **README.md** (本文件) - 專案總覽

## 🚀 快速開始

### 1. 啟動開發伺服器

```bash
cd /Users/xiaoxu/Projects/nobodyclimb-fe
npm run dev
```

### 2. 查看示範頁面

開啟瀏覽器訪問：`http://localhost:3000/instagram-demo`

### 3. 使用元件

```tsx
import InstagramPostCard from '@/components/instagram/instagram-post-card'

const post = {
  id: 1,
  url: 'https://www.instagram.com/p/DQ0D25cE4Wa/',
  shortcode: 'DQ0D25cE4Wa',
  mediaType: 'IMAGE',
  caption: '龍洞攀岩紀錄！',
  username: 'climber_taiwan',
  postedAt: '2025-12-01T10:30:00Z',
  likesCount: 234,
  commentsCount: 18,
  hashtags: ['攀岩', '龍洞'],
  locationName: '龍洞攀岩場'
}

<InstagramPostCard post={post} />
```

## 🎨 功能特點

### 完整內容顯示
- ✅ 顯示貼文內容、使用者資訊
- ✅ 統計數據（按讚、留言、觀看數）
- ✅ Hashtag 高亮與連結
- ✅ 發布時間格式化
- ✅ 地點資訊

### 即時嵌入
- ✅ 使用 Instagram iframe 即時載入
- ✅ 支援圖片、影片、輪播、Reels
- ✅ Instagram 原生互動功能
- ✅ 自動更新內容

### 彈性展示
- ✅ 網格/列表視圖
- ✅ 媒體類型篩選
- ✅ 響應式設計
- ✅ 可客製化樣式

### 使用者體驗
- ✅ 載入狀態動畫
- ✅ 錯誤處理
- ✅ 空狀態顯示
- ✅ 流暢動畫效果

## 📊 元件功能對比

| 功能 | InstagramEmbed | InstagramPostCard | InstagramFeed |
|------|----------------|-------------------|---------------|
| Instagram 嵌入 | ✅ | ✅ | ✅ |
| 使用者資訊 | ❌ | ✅ | ✅ |
| 貼文內容 | ❌ | ✅ | ✅ |
| 統計資訊 | ❌ | ✅ | ✅ |
| 互動按鈕 | ❌ | ✅ | ✅ |
| 網格展示 | ❌ | ❌ | ✅ |
| 篩選功能 | ❌ | ❌ | ✅ |
| 視圖切換 | ❌ | ❌ | ✅ |

**推薦使用:**
- **簡單嵌入**: 使用 `InstagramEmbed`
- **完整資訊**: 使用 `InstagramPostCard` ⭐
- **多貼文展示**: 使用 `InstagramFeed`

## 🔧 在岩場頁面整合

### 方法 1: 完整貼文卡片（推薦）

```tsx
// src/app/crag/[id]/page.tsx

import InstagramFeed from '@/components/instagram/instagram-feed'

export default async function CragDetailPage({ params }) {
  const { id } = await params

  // TODO: 從 API 取得 Instagram 貼文
  // const posts = await instagramService.getCragPosts(parseInt(id))

  const examplePosts = [
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

      {/* Instagram 攀登紀錄 */}
      <section className="mt-12">
        <InstagramFeed
          posts={examplePosts}
          layout="grid"
          columns={3}
          showFilters={true}
          title="📸 Instagram 攀登紀錄"
        />
      </section>
    </div>
  )
}
```

## 📝 下一步實作

### Phase 1: Backend API（待實作）

參考 `docs/ig-show-video/plan.md`

1. **建立 Django Model**
   - InstagramPost model
   - 資料庫 migration
   - Admin 後台設定

2. **實作 REST API**
   - `GET /api/instagram-posts/`
   - `GET /api/crags/{id}/instagram-posts/`
   - `POST /api/instagram-posts/`
   - 篩選、搜尋功能

3. **Instagram API 整合**
   - Instagram Basic Display API
   - 自動同步機制
   - Hashtag 自動關聯

### Phase 2: Frontend API 整合（待實作）

1. **建立 API Service**
   ```typescript
   // src/lib/api/instagram.ts
   export const instagramService = {
     async getCragPosts(cragId: number) {
       // API 呼叫邏輯
     }
   }
   ```

2. **整合到現有頁面**
   - 岩場詳情頁
   - 攀岩館頁面
   - 路線詳情頁

3. **實作進階功能**
   - 無限滾動
   - 搜尋功能
   - 精選貼文

### Phase 3: 進階功能（未來）

- 自動關聯貼文到岩場（透過 AI）
- 使用者上傳 Instagram 連結
- 社群投票精選貼文
- 攀登紀錄分析

## 🧪 測試清單

- [x] Instagram 貼文可以正常顯示
- [x] 載入狀態正常運作
- [x] 錯誤處理正常運作
- [x] 響應式設計在各種螢幕正常
- [x] 支援圖片、影片、輪播
- [x] Hashtag 高亮顯示
- [x] 統計資訊格式化
- [x] 網格/列表視圖切換
- [x] 媒體類型篩選
- [ ] 從 API 載入資料（待實作）
- [ ] 無限滾動（待實作）
- [ ] 跨瀏覽器測試

## 📦 檔案結構

```
nobodyclimb-fe/
├── docs/
│   └── ig-show-video/
│       ├── demand.md              # 需求文件
│       ├── plan.md                # 完整規劃文件
│       ├── implementation-guide.md # 實作指南
│       └── README.md              # 專案總覽（本文件）
│
├── src/
│   ├── components/
│   │   └── instagram/
│   │       ├── instagram-embed.tsx      # 基礎嵌入元件
│   │       ├── instagram-post-card.tsx  # 完整貼文卡片 ⭐
│   │       └── instagram-feed.tsx       # 多貼文網格
│   │
│   └── app/
│       └── instagram-demo/
│           └── page.tsx           # 示範頁面
│
└── test-instagram-embed-v2.html   # 獨立測試頁面
```

## 🔗 相關資源

- [Instagram Embed Documentation](https://developers.facebook.com/docs/instagram/embedding)
- [Instagram Basic Display API](https://developers.facebook.com/docs/instagram-basic-display-api)
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

## ❓ 常見問題

### Q: Instagram 貼文會即時更新嗎？
A: 是的，使用 iframe 嵌入會載入 Instagram 最新內容，包括最新的按讚數、留言數等。

### Q: 支援私人帳號的貼文嗎？
A: 不支援。只能嵌入公開的 Instagram 貼文。

### Q: 如何取得 Instagram 貼文資料（caption、按讚數等）？
A: 目前示範頁面使用範例資料。實際應用需要：
1. 整合 Instagram Basic Display API（後端）
2. 儲存貼文資料到資料庫
3. 透過 REST API 提供給前端

### Q: 可以自訂貼文卡片的樣式嗎？
A: 可以！所有元件都支援 `className` prop，可以加入自訂樣式。

### Q: 效能如何？會影響頁面載入速度嗎？
A: 使用 iframe 嵌入，Instagram 內容會延遲載入。建議：
- 使用 lazy loading
- 限制每頁顯示數量
- 實作無限滾動

## 📞 聯絡資訊

如有問題或建議，請參考：
- 專案規劃文件：`docs/ig-show-video/plan.md`
- 實作指南：`docs/ig-show-video/implementation-guide.md`

---

**版本：** 1.0.0
**最後更新：** 2025-12-03
**狀態：** ✅ Frontend 元件完成，Backend API 待實作
