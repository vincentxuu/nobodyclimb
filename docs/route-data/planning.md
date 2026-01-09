# 路線資訊規劃文件 (Route Data Planning)

**專案**: nobodyclimb-fe
**建立日期**: 2025-12-03
**狀態**: Draft
**需求來源**: `/docs/route-data/demand.md`

## 📋 目錄

1. [需求概述](#需求概述)
2. [現況分析](#現況分析)
3. [功能規劃](#功能規劃)
4. [資料結構設計](#資料結構設計)
5. [技術實作方案](#技術實作方案)
6. [使用者體驗設計](#使用者體驗設計)
7. [實作階段](#實作階段)
8. [測試計畫](#測試計畫)

---

## 需求概述

### 核心需求

根據 `demand.md` 的需求，路線資訊除了現有的**文字與圖片**外，還需要支援：

- ✅ **YouTube 影片**整合
- ✅ **Instagram 影片**整合

### 業務目標

1. **豐富內容呈現**：讓攀岩者可以透過影片更直觀地理解路線技巧和難度
2. **提升使用者參與度**：影片內容更具吸引力，增加平台黏著度
3. **社群內容整合**：整合 YouTube 和 Instagram 等社群平台的攀岩影片資源

---

## 現況分析

### 現有實作 (src/components/crag/route-section.tsx)

目前路線資訊已支援：

#### ✅ 已實現功能

1. **基本資料結構** (`RouteType` interface):
   ```typescript
   interface RouteType {
     id: string
     name: string              // 路線名稱
     englishName: string       // 英文名稱
     grade: string             // 難度等級
     length: string            // 路線長度
     type: string              // 攀登類型
     firstAscent: string       // 首登者
     area: string              // 所屬區域
     description: string       // 路線描述
     protection: string        // 保護裝備
     popularity: number        // 人氣值
     views: number             // 瀏覽次數
     // 已有的多媒體欄位
     images?: string[]         // ✅ 圖片URL陣列
     videos?: string[]         // ✅ 影片URL陣列
     tips?: string             // 攀登攻略
   }
   ```

2. **UI 元件**:
   - 路線表格列表
   - 路線詳細資訊展開區
   - 路線照片彈窗（支援多張圖片輪播）
   - 攀登攻略彈窗（已整合影片播放）

3. **影片播放實作**:
   - 在「攀登攻略彈窗」中已有影片嵌入功能
   - 使用 `<iframe>` 嵌入影片（line 342-352）
   - 支援多個影片播放

#### ❌ 當前限制

1. **影片來源限制**:
   - 目前僅支援 YouTube embed URL（範例：`https://www.youtube.com/embed/AbCdEfGhIjK`）
   - **尚未支援 Instagram 影片**嵌入

2. **影片呈現方式**:
   - 影片只在「攀登攻略彈窗」中顯示
   - 未在路線列表或詳細資訊區提供影片預覽

3. **影片資料管理**:
   - 影片 URL 直接寫在路線資料中
   - 沒有影片元資料（標題、上傳者、時長等）

---

## 功能規劃

### Phase 1: Instagram 影片支援 (P0 - 最高優先級)

#### 功能 1.1: Instagram 影片嵌入支援

**目標**: 讓系統支援 Instagram 影片與貼文嵌入

**實作要點**:

1. **Instagram Embed API 整合**
   - 使用 Instagram oEmbed API 獲取嵌入代碼
   - API Endpoint: `https://graph.facebook.com/v18.0/instagram_oembed?url={post_url}&access_token={token}`

2. **影片 URL 格式支援**:
   ```typescript
   // YouTube
   'https://www.youtube.com/embed/VIDEO_ID'
   'https://youtu.be/VIDEO_ID'

   // Instagram
   'https://www.instagram.com/p/POST_ID/'
   'https://www.instagram.com/reel/REEL_ID/'
   ```

3. **自動識別影片來源**:
   ```typescript
   type VideoSource = 'youtube' | 'instagram' | 'other'

   interface VideoInfo {
     source: VideoSource
     url: string
     embedUrl: string
     thumbnail?: string
     title?: string
     duration?: string
   }
   ```

#### 功能 1.2: 路線影片資料結構擴充

**現有結構**:
```typescript
videos?: string[]  // 只有 URL 陣列
```

**新結構**:
```typescript
interface RouteVideo {
  id: string
  source: 'youtube' | 'instagram'
  url: string              // 原始 URL
  embedUrl: string         // 嵌入用 URL
  thumbnail?: string       // 縮圖
  title?: string           // 影片標題
  description?: string     // 影片描述
  author?: string          // 上傳者
  uploadDate?: string      // 上傳日期
  duration?: number        // 影片時長（秒）
}

interface RouteType {
  // ... 其他欄位
  videos?: RouteVideo[]    // ✨ 升級為結構化資料
}
```

**向下相容處理**:
```typescript
// 支援舊格式 string[] 自動轉換
function normalizeVideos(videos?: string[] | RouteVideo[]): RouteVideo[] {
  if (!videos) return []

  if (typeof videos[0] === 'string') {
    // 自動轉換舊格式
    return (videos as string[]).map((url, index) => ({
      id: `video-${index}`,
      source: detectVideoSource(url),
      url,
      embedUrl: convertToEmbedUrl(url)
    }))
  }

  return videos as RouteVideo[]
}
```

---

### Phase 2: 影片呈現優化 (P1 - 高優先級)

#### 功能 2.1: 路線卡片影片預覽

**位置**: 路線表格行展開後的詳細資訊區

**設計**:
- 在路線資訊卡片底部新增「影片預覽」區塊
- 顯示影片縮圖網格（最多顯示 3 個）
- 點擊縮圖打開影片播放彈窗

```
┌─────────────────────────────────────┐
│ 海神 (Poseidon) - 5.11c            │
├─────────────────────────────────────┤
│ 路線資訊 | 保護裝備                │
│ ...                                 │
├─────────────────────────────────────┤
│ 路線描述                            │
│ ...                                 │
├─────────────────────────────────────┤
│ 📹 相關影片 (2)                     │
│ ┌────┐ ┌────┐                       │
│ │ YT │ │ IG │ [查看全部影片]        │
│ └────┘ └────┘                       │
├─────────────────────────────────────┤
│ [查看路線照片] [查看攀登攻略]      │
└─────────────────────────────────────┘
```

#### 功能 2.2: 影片播放器增強

**改進點**:

1. **統一影片播放彈窗**
   - 不只在「攀登攻略」顯示影片
   - 新增獨立的「影片播放彈窗」

2. **播放列表功能**
   - 支援多個影片連續播放
   - 顯示播放進度（1/5）
   - 左右切換影片

3. **Instagram 影片特殊處理**
   - 使用 Instagram Embed JavaScript SDK
   - 載入 `https://www.instagram.com/embed.js`
   - 動態渲染 blockquote 元素

**範例實作**:
```tsx
// Instagram 影片嵌入元件
const InstagramEmbed: React.FC<{ url: string }> = ({ url }) => {
  useEffect(() => {
    // 載入 Instagram embed script
    const script = document.createElement('script')
    script.src = 'https://www.instagram.com/embed.js'
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  return (
    <blockquote
      className="instagram-media"
      data-instgrm-permalink={url}
      data-instgrm-version="14"
    />
  )
}
```

---

### Phase 3: 影片管理功能 (P2 - 中優先級)

#### 功能 3.1: 影片來源標記

**目標**: 讓使用者一眼識別影片來源

**實作**:
- YouTube 影片顯示紅色 YouTube 圖標
- Instagram 影片顯示漸層色 Instagram 圖標

```tsx
const VideoSourceBadge: React.FC<{ source: VideoSource }> = ({ source }) => {
  const config = {
    youtube: {
      icon: Youtube,
      color: 'bg-red-500',
      label: 'YouTube'
    },
    instagram: {
      icon: Instagram, // from lucide-react
      color: 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500',
      label: 'Instagram'
    }
  }

  const { icon: Icon, color, label } = config[source]

  return (
    <div className={`flex items-center gap-1 rounded px-2 py-1 text-white ${color}`}>
      <Icon size={14} />
      <span className="text-xs">{label}</span>
    </div>
  )
}
```

#### 功能 3.2: 影片時長與統計顯示

**顯示資訊**:
- 影片時長（如：3:24）
- 觀看次數（如有 API 支援）
- 上傳日期

```
┌────────────────────────────┐
│  [▶ 影片縮圖]             │
│                            │
│  🎬 首攀影片               │
│  👤 攀岩老手               │
│  ⏱️ 3:24 | 📅 2023-10-15   │
│  📺 YouTube               │
└────────────────────────────┘
```

---

### Phase 4: 進階功能 (P3 - 低優先級)

#### 功能 4.1: 影片篩選與搜尋

- 依影片來源篩選（YouTube / Instagram / 全部）
- 依上傳日期排序
- 依影片標題搜尋

#### 功能 4.2: 使用者貢獻影片

- 允許登入使用者提交路線相關影片
- 影片審核機制
- 社群投票排序

---

## 資料結構設計

### 1. 核心資料型別

```typescript
// src/lib/types/route.ts

/**
 * 影片來源類型
 */
export type VideoSource = 'youtube' | 'instagram'

/**
 * 路線影片資訊
 */
export interface RouteVideo {
  /** 唯一識別碼 */
  id: string

  /** 影片來源平台 */
  source: VideoSource

  /** 原始 URL */
  url: string

  /** 嵌入用 URL */
  embedUrl: string

  /** 影片標題 */
  title?: string

  /** 影片描述 */
  description?: string

  /** 縮圖 URL */
  thumbnail?: string

  /** 上傳者/作者 */
  author?: string

  /** 上傳日期 (ISO 8601) */
  uploadDate?: string

  /** 影片時長（秒） */
  duration?: number

  /** 影片觀看次數 */
  viewCount?: number
}

/**
 * 路線類型（擴充版）
 */
export interface RouteType {
  // === 基本資訊 ===
  id: string
  name: string
  englishName: string
  grade: string
  length: string
  type: string
  area: string

  // === 歷史資訊 ===
  firstAscent: string

  // === 內容資訊 ===
  description: string
  protection: string
  tips?: string

  // === 統計資訊 ===
  popularity: number
  views: number

  // === 多媒體資源 ===
  images?: string[]

  /** 路線相關影片（新結構） */
  videos?: RouteVideo[]

  // 向下相容：支援舊格式
  // videos?: string[] | RouteVideo[]
}
```

### 2. 工具函式

```typescript
// src/lib/utils/video.ts

/**
 * 偵測影片來源
 */
export function detectVideoSource(url: string): VideoSource {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube'
  }
  if (url.includes('instagram.com')) {
    return 'instagram'
  }
  throw new Error(`Unsupported video source: ${url}`)
}

/**
 * 轉換為嵌入 URL
 */
export function convertToEmbedUrl(url: string, source?: VideoSource): string {
  const detectedSource = source || detectVideoSource(url)

  if (detectedSource === 'youtube') {
    // https://www.youtube.com/watch?v=VIDEO_ID
    // https://youtu.be/VIDEO_ID
    // -> https://www.youtube.com/embed/VIDEO_ID
    const videoId = extractYouTubeVideoId(url)
    return `https://www.youtube.com/embed/${videoId}`
  }

  if (detectedSource === 'instagram') {
    // Instagram 使用原始 URL
    return url
  }

  return url
}

/**
 * 提取 YouTube Video ID
 */
export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&]+)/,
    /(?:youtu\.be\/)([^?]+)/,
    /(?:youtube\.com\/embed\/)([^?]+)/
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  return null
}

/**
 * 標準化影片資料（向下相容處理）
 */
export function normalizeVideos(videos?: string[] | RouteVideo[]): RouteVideo[] {
  if (!videos || videos.length === 0) return []

  // 已經是新格式
  if (typeof videos[0] === 'object') {
    return videos as RouteVideo[]
  }

  // 舊格式轉換
  return (videos as string[]).map((url, index) => {
    const source = detectVideoSource(url)
    const embedUrl = convertToEmbedUrl(url, source)

    return {
      id: `video-${index}`,
      source,
      url,
      embedUrl
    }
  })
}

/**
 * 獲取影片縮圖 URL
 */
export function getVideoThumbnail(video: RouteVideo): string | null {
  if (video.thumbnail) return video.thumbnail

  if (video.source === 'youtube') {
    const videoId = extractYouTubeVideoId(video.url)
    if (videoId) {
      // YouTube 縮圖 API
      return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    }
  }

  // Instagram 需要透過 API 獲取
  return null
}

/**
 * 格式化影片時長
 */
export function formatDuration(seconds?: number): string {
  if (!seconds) return '--:--'

  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60

  return `${mins}:${secs.toString().padStart(2, '0')}`
}
```

---

## 技術實作方案

### 方案一：純前端實作（推薦 - Phase 1）

**優點**:
- 快速實作，無需後端支援
- 適合當前靜態資料架構
- 成本低

**缺點**:
- Instagram API 有使用限制
- 無法獲取即時影片統計資料

**技術棧**:
```typescript
// YouTube: 使用 iframe embed（現有方案）
<iframe src="https://www.youtube.com/embed/VIDEO_ID" />

// Instagram: 使用 Instagram Embed SDK
<script src="https://www.instagram.com/embed.js" />
<blockquote class="instagram-media" data-instgrm-permalink="URL" />
```

**實作步驟**:

1. **更新路線資料格式**
   - 修改模擬資料加入 Instagram 影片
   - 使用新的 `RouteVideo` 結構

2. **建立影片元件**
   ```
   src/components/route/
   ├── VideoPlayer.tsx          # 統一影片播放器
   ├── VideoThumbnail.tsx       # 影片縮圖
   ├── VideoSourceBadge.tsx     # 影片來源標記
   ├── YouTubeEmbed.tsx         # YouTube 嵌入
   └── InstagramEmbed.tsx       # Instagram 嵌入
   ```

3. **修改現有元件**
   - `route-section.tsx`: 加入影片預覽區塊
   - 新增影片播放彈窗邏輯

---

### 方案二：整合後端 API（未來擴充 - Phase 2+）

**使用時機**: 當需要以下功能時

- 即時獲取影片統計資料
- 影片內容審核
- 使用者上傳影片
- 影片快取與優化

**技術方案**:

1. **YouTube Data API v3**
   ```typescript
   // 獲取影片詳細資訊
   GET https://www.googleapis.com/youtube/v3/videos?id={videoId}&part=snippet,statistics

   // 回應範例
   {
     "items": [{
       "snippet": {
         "title": "攀岩路線示範",
         "description": "...",
         "thumbnails": { "high": { "url": "..." } },
         "publishedAt": "2023-10-15T12:00:00Z"
       },
       "statistics": {
         "viewCount": "1234",
         "likeCount": "56"
       }
     }]
   }
   ```

2. **Instagram Graph API**
   ```typescript
   // 需要 Facebook App 與 Access Token
   GET https://graph.instagram.com/{media-id}?fields=id,caption,media_url,thumbnail_url,timestamp
   ```

3. **後端服務架構**
   ```
   backend/
   ├── api/
   │   └── routes/
   │       └── videos.ts        # 影片 API 端點
   ├── services/
   │   ├── youtube.service.ts   # YouTube API 整合
   │   └── instagram.service.ts # Instagram API 整合
   └── models/
       └── video.model.ts       # 影片資料模型
   ```

---

## 使用者體驗設計

### 1. 路線列表頁

**影片顯示策略**:
- 若路線有影片：在「操作」欄位旁顯示影片圖標 🎬
- 點擊路線行展開詳情時，自動顯示影片預覽區塊

### 2. 路線詳細資訊區

**佈局設計**:

```
┌──────────────────────────────────────┐
│ 海神 (Poseidon) - 5.11c    [難度徽章] │
├──────────────────────────────────────┤
│ 左欄: 路線資訊  │ 右欄: 保護裝備      │
│ - 長度: 25m     │ - 固定保護點        │
│ - 類型: 運動攀  │ - 頂部有確保站      │
│ - 首登: ...     │                     │
├──────────────────────────────────────┤
│ 路線描述                              │
│ 這條線路需要良好的體力和耐力...       │
├──────────────────────────────────────┤
│ 📹 相關影片 (3)            [查看全部] │
│ ┌────────┐ ┌────────┐ ┌────────┐    │
│ │[▶ YT] │ │[▶ IG] │ │[▶ YT] │    │
│ │ 3:24   │ │ 1:45   │ │ 5:12   │    │
│ └────────┘ └────────┘ └────────┘    │
├──────────────────────────────────────┤
│ [查看路線照片] [查看攀登攻略]        │
└──────────────────────────────────────┘
```

### 3. 影片播放彈窗

**設計要點**:

1. **標題列**
   - 顯示影片標題
   - 顯示來源徽章（YouTube / Instagram）
   - 顯示影片進度（1/5）

2. **播放區**
   - YouTube: 使用 iframe
   - Instagram: 使用 embed blockquote

3. **控制列**
   - 上一個影片按鈕
   - 下一個影片按鈕
   - 播放列表縮圖

4. **資訊區**（可選）
   - 影片描述
   - 上傳者
   - 上傳日期

**Wireframe**:

```
┌────────────────────────────────────────┐
│ 海神 - 攀登示範 (1/3)    [📺 YouTube] ❌│
├────────────────────────────────────────┤
│                                        │
│        [▶ 影片播放區域]                │
│                                        │
│           16:9 比例                    │
│                                        │
├────────────────────────────────────────┤
│ ◀ │ ┌────┐ ┌────┐ ┌────┐ │ ▶         │
│    │ [1] │ │ 2  │ │ 3  │ │           │
│    └────┘ └────┘ └────┘              │
├────────────────────────────────────────┤
│ 影片描述：首攀影片，展示關鍵動作...   │
│ 上傳者：攀岩老手 | 📅 2023-10-15      │
└────────────────────────────────────────┘
```

### 4. 行動裝置優化

**響應式調整**:

1. **路線列表（手機版）**
   - 影片預覽改為垂直排列
   - 每個影片卡片佔滿寬度
   - 顯示影片來源圖標

2. **影片播放彈窗（手機版）**
   - 全螢幕模式
   - 播放列表改為底部水平滾動
   - 手勢左右滑動切換影片

---

## 實作階段

### Phase 1: 基礎建設 (Week 1)

**目標**: 建立影片資料結構與工具函式

**Tasks**:

- [ ] 1.1 建立型別定義檔 `src/lib/types/route-video.ts`
  - 定義 `VideoSource`, `RouteVideo` 型別
  - 匯出到 `src/lib/types/index.ts`

- [ ] 1.2 建立影片工具函式 `src/lib/utils/video.ts`
  - `detectVideoSource()`
  - `convertToEmbedUrl()`
  - `extractYouTubeVideoId()`
  - `normalizeVideos()`
  - `getVideoThumbnail()`
  - `formatDuration()`

- [ ] 1.3 撰寫單元測試 `src/lib/utils/__tests__/video.test.ts`
  - 測試各種 URL 格式解析
  - 測試向下相容轉換

- [ ] 1.4 更新模擬資料
  - 在 `src/app/crag/[id]/page.tsx` 加入 Instagram 影片範例
  - 測試新舊格式混合相容性

**完成標準**:
- 所有單元測試通過
- 模擬資料支援 YouTube + Instagram 影片

---

### Phase 2: Instagram 影片支援 (Week 1-2)

**目標**: 實現 Instagram 影片嵌入播放

**Tasks**:

- [ ] 2.1 建立 Instagram 嵌入元件
  - `src/components/route/InstagramEmbed.tsx`
  - 整合 Instagram Embed SDK
  - 處理載入狀態與錯誤

- [ ] 2.2 建立統一影片播放器
  - `src/components/route/VideoPlayer.tsx`
  - 根據 `source` 自動選擇 YouTube 或 Instagram 元件
  - 支援播放控制

- [ ] 2.3 測試不同 Instagram URL 格式
  - `/p/POST_ID/` (貼文)
  - `/reel/REEL_ID/` (短影片)
  - `/tv/VIDEO_ID/` (IGTV)

**完成標準**:
- Instagram 影片可正常嵌入播放
- 支援所有 Instagram 影片格式

---

### Phase 3: UI 元件開發 (Week 2)

**目標**: 開發影片相關 UI 元件

**Tasks**:

- [ ] 3.1 影片縮圖元件 `VideoThumbnail.tsx`
  - 顯示影片縮圖
  - 顯示播放按鈕覆蓋層
  - 顯示影片時長

- [ ] 3.2 影片來源徽章元件 `VideoSourceBadge.tsx`
  - YouTube 紅色徽章
  - Instagram 漸層色徽章

- [ ] 3.3 影片資訊卡片元件 `VideoInfoCard.tsx`
  - 整合縮圖 + 徽章
  - 顯示標題、上傳者、日期

**完成標準**:
- 元件可獨立使用
- 響應式設計支援手機與桌面

---

### Phase 4: 路線頁面整合 (Week 2-3)

**目標**: 將影片功能整合到路線頁面

**Tasks**:

- [ ] 4.1 修改 `route-section.tsx`
  - 在路線詳細資訊區加入「相關影片」區塊
  - 使用 `VideoInfoCard` 顯示影片列表（最多3個）
  - 加入「查看全部影片」按鈕

- [ ] 4.2 建立影片播放彈窗 `VideoGalleryModal.tsx`
  - 全螢幕播放模式
  - 支援影片列表切換
  - 顯示影片資訊

- [ ] 4.3 更新攀登攻略彈窗
  - 複用新的 `VideoPlayer` 元件
  - 保持現有功能不變

**完成標準**:
- 路線頁面可顯示影片預覽
- 點擊影片可開啟播放彈窗
- 所有影片（YouTube + Instagram）都能正常播放

---

### Phase 5: 優化與測試 (Week 3)

**目標**: 效能優化與跨瀏覽器測試

**Tasks**:

- [ ] 5.1 效能優化
  - 影片 lazy loading
  - 縮圖預載入
  - Instagram SDK 載入優化（避免重複載入）

- [ ] 5.2 跨瀏覽器測試
  - Chrome, Firefox, Safari
  - iOS Safari, Android Chrome
  - 測試 Instagram embed 相容性

- [ ] 5.3 無障礙優化
  - 鍵盤導航支援
  - ARIA 標籤
  - 螢幕閱讀器測試

- [ ] 5.4 錯誤處理
  - 影片載入失敗處理
  - 無效 URL 提示
  - 網路錯誤重試

**完成標準**:
- 所有主流瀏覽器測試通過
- Lighthouse 評分 > 90
- 無 console 錯誤

---

## 測試計畫

### 單元測試

**測試檔案**: `src/lib/utils/__tests__/video.test.ts`

```typescript
describe('Video Utils', () => {
  describe('detectVideoSource', () => {
    it('should detect YouTube URLs', () => {
      expect(detectVideoSource('https://www.youtube.com/watch?v=ABC')).toBe('youtube')
      expect(detectVideoSource('https://youtu.be/ABC')).toBe('youtube')
    })

    it('should detect Instagram URLs', () => {
      expect(detectVideoSource('https://www.instagram.com/p/ABC/')).toBe('instagram')
      expect(detectVideoSource('https://www.instagram.com/reel/ABC/')).toBe('instagram')
    })

    it('should throw error for unsupported sources', () => {
      expect(() => detectVideoSource('https://vimeo.com/123')).toThrow()
    })
  })

  describe('convertToEmbedUrl', () => {
    it('should convert YouTube watch URL to embed URL', () => {
      const input = 'https://www.youtube.com/watch?v=ABC123'
      const expected = 'https://www.youtube.com/embed/ABC123'
      expect(convertToEmbedUrl(input)).toBe(expected)
    })

    it('should keep Instagram URLs unchanged', () => {
      const url = 'https://www.instagram.com/p/ABC123/'
      expect(convertToEmbedUrl(url)).toBe(url)
    })
  })

  describe('normalizeVideos', () => {
    it('should convert string array to RouteVideo array', () => {
      const input = ['https://www.youtube.com/watch?v=ABC']
      const result = normalizeVideos(input)

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        source: 'youtube',
        url: input[0],
        embedUrl: expect.stringContaining('embed')
      })
    })

    it('should return RouteVideo array unchanged', () => {
      const input: RouteVideo[] = [{
        id: '1',
        source: 'youtube',
        url: 'https://youtube.com/watch?v=ABC',
        embedUrl: 'https://youtube.com/embed/ABC'
      }]

      expect(normalizeVideos(input)).toEqual(input)
    })
  })
})
```

---

### 整合測試

**測試場景**:

1. **路線頁面載入**
   - ✅ 包含 YouTube 影片的路線正確顯示
   - ✅ 包含 Instagram 影片的路線正確顯示
   - ✅ 混合影片類型的路線正確顯示
   - ✅ 無影片的路線不顯示影片區塊

2. **影片播放**
   - ✅ 點擊 YouTube 影片縮圖開啟播放彈窗
   - ✅ YouTube 影片可正常播放
   - ✅ 點擊 Instagram 影片縮圖開啟播放彈窗
   - ✅ Instagram 影片可正常載入
   - ✅ 影片切換功能正常

3. **響應式設計**
   - ✅ 桌面版佈局正確
   - ✅ 平板版佈局正確
   - ✅ 手機版佈局正確
   - ✅ 影片播放器在各尺寸下正常

---

### 手動測試檢查清單

#### 功能測試

- [ ] YouTube 影片
  - [ ] 影片可正常嵌入
  - [ ] 影片可正常播放
  - [ ] 影片控制按鈕正常
  - [ ] 全螢幕模式正常

- [ ] Instagram 影片
  - [ ] 貼文影片可嵌入
  - [ ] Reel 短影片可嵌入
  - [ ] Instagram SDK 正確載入
  - [ ] 影片可正常播放

- [ ] 影片切換
  - [ ] 上一個影片按鈕正常
  - [ ] 下一個影片按鈕正常
  - [ ] 播放列表縮圖點擊正常
  - [ ] 鍵盤方向鍵切換正常（可選）

#### 視覺測試

- [ ] 影片縮圖顯示正確
- [ ] 來源徽章顏色正確
- [ ] 播放按鈕覆蓋層正常
- [ ] 影片時長顯示位置正確
- [ ] 彈窗樣式符合設計規範

#### 效能測試

- [ ] 頁面載入速度 < 2秒
- [ ] 影片縮圖 lazy loading 正常
- [ ] Instagram SDK 不重複載入
- [ ] 無記憶體洩漏

#### 瀏覽器相容性

- [ ] Chrome (最新版)
- [ ] Firefox (最新版)
- [ ] Safari (最新版)
- [ ] Edge (最新版)
- [ ] iOS Safari
- [ ] Android Chrome

---

## 附錄

### A. Instagram Embed 技術細節

**官方文件**: https://developers.facebook.com/docs/instagram/embedding

**嵌入方式**:

1. **使用 blockquote + Script**

```html
<!-- 1. 加入 blockquote -->
<blockquote
  class="instagram-media"
  data-instgrm-permalink="https://www.instagram.com/p/POST_ID/"
  data-instgrm-version="14"
>
</blockquote>

<!-- 2. 載入 Instagram embed script -->
<script async src="//www.instagram.com/embed.js"></script>
```

2. **React 元件實作**

```tsx
import { useEffect, useRef } from 'react'

export const InstagramEmbed: React.FC<{ url: string }> = ({ url }) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 載入 Instagram embed script
    if (!(window as any).instgrm) {
      const script = document.createElement('script')
      script.src = 'https://www.instagram.com/embed.js'
      script.async = true
      script.onload = () => {
        ;(window as any).instgrm?.Embeds.process()
      }
      document.body.appendChild(script)
    } else {
      // Script 已載入，直接處理
      ;(window as any).instgrm.Embeds.process()
    }
  }, [])

  return (
    <div ref={containerRef}>
      <blockquote
        className="instagram-media"
        data-instgrm-permalink={url}
        data-instgrm-version="14"
        style={{
          background: '#FFF',
          border: 0,
          margin: '1px',
          maxWidth: '540px',
          minWidth: '326px',
          padding: 0,
          width: '99.375%',
        }}
      />
    </div>
  )
}
```

**注意事項**:

- Instagram embed script 只需載入一次
- 使用 `instgrm.Embeds.process()` 處理新增的 blockquote
- 需處理 script 載入失敗情況

---

### B. YouTube 縮圖 API

YouTube 提供免費的縮圖 API，無需認證：

```
https://img.youtube.com/vi/{VIDEO_ID}/{QUALITY}.jpg
```

**畫質選項**:

| 檔名 | 尺寸 | 說明 |
|------|------|------|
| `default.jpg` | 120x90 | 預設縮圖 |
| `mqdefault.jpg` | 320x180 | 中等畫質 |
| `hqdefault.jpg` | 480x360 | 高畫質 |
| `sddefault.jpg` | 640x480 | 標準畫質 |
| `maxresdefault.jpg` | 1280x720 | 最高畫質 |

**範例**:

```typescript
const videoId = 'dQw4w9WgXcQ'
const thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
```

---

### C. 資料遷移指南

當從舊格式 `string[]` 升級到新格式 `RouteVideo[]` 時：

**步驟 1: 準備遷移腳本**

```typescript
// scripts/migrate-route-videos.ts

import { RouteType, RouteVideo } from '@/lib/types/route'
import { detectVideoSource, convertToEmbedUrl } from '@/lib/utils/video'

function migrateRouteVideos(oldRoute: any): RouteType {
  const { videos, ...rest } = oldRoute

  if (!videos || videos.length === 0) {
    return rest as RouteType
  }

  // 若已是新格式，直接返回
  if (typeof videos[0] === 'object') {
    return oldRoute as RouteType
  }

  // 轉換舊格式
  const newVideos: RouteVideo[] = (videos as string[]).map((url, index) => {
    const source = detectVideoSource(url)
    const embedUrl = convertToEmbedUrl(url, source)

    return {
      id: `migrated-${index}-${Date.now()}`,
      source,
      url,
      embedUrl,
      // 可選：透過 API 獲取額外資訊
      // title: await fetchVideoTitle(url),
      // thumbnail: await fetchVideoThumbnail(url),
    }
  })

  return {
    ...rest,
    videos: newVideos
  } as RouteType
}

// 批次遷移
export function migrateAllRoutes(routes: any[]): RouteType[] {
  return routes.map(migrateRouteVideos)
}
```

**步驟 2: 執行遷移**

```bash
# 執行遷移腳本
npx ts-node scripts/migrate-route-videos.ts

# 或在元件中自動遷移
const routes = normalizeVideos(rawRoutes)
```

---

### D. 效能優化建議

1. **Lazy Loading**

```tsx
import dynamic from 'next/dynamic'

// 動態載入影片播放器
const VideoPlayer = dynamic(() => import('@/components/route/VideoPlayer'), {
  loading: () => <div>載入中...</div>,
  ssr: false
})
```

2. **縮圖預載入**

```tsx
<link rel="preload" as="image" href={thumbnailUrl} />
```

3. **Instagram SDK 快取**

```typescript
// 全域快取 Instagram SDK 載入狀態
let instagramSdkLoaded = false
let instagramSdkLoading = false

export async function loadInstagramSdk(): Promise<void> {
  if (instagramSdkLoaded) return

  if (instagramSdkLoading) {
    // 等待載入完成
    await new Promise(resolve => {
      const interval = setInterval(() => {
        if (instagramSdkLoaded) {
          clearInterval(interval)
          resolve(true)
        }
      }, 100)
    })
    return
  }

  instagramSdkLoading = true

  const script = document.createElement('script')
  script.src = 'https://www.instagram.com/embed.js'
  script.async = true

  await new Promise((resolve, reject) => {
    script.onload = () => {
      instagramSdkLoaded = true
      instagramSdkLoading = false
      resolve(true)
    }
    script.onerror = reject
    document.body.appendChild(script)
  })
}
```

---

## 結論

本規劃文件詳細定義了路線資訊功能的影片整合方案，包含：

### ✅ 已完成分析

1. **現況評估**: 分析了現有路線元件的實作與限制
2. **需求定義**: 明確了 YouTube + Instagram 影片支援需求
3. **技術方案**: 提供了前端實作與後端整合兩種方案
4. **資料結構**: 設計了可擴充的影片資料型別

### 🚀 實作路徑

- **Phase 1**: 基礎建設（型別定義、工具函式）
- **Phase 2**: Instagram 影片支援
- **Phase 3**: UI 元件開發
- **Phase 4**: 路線頁面整合
- **Phase 5**: 優化與測試

### 📊 預期成果

完成後，NobodyClimb 平台將能夠：

1. ✅ 支援 YouTube 與 Instagram 影片嵌入
2. ✅ 提供豐富的影片瀏覽體驗
3. ✅ 相容現有資料格式（向下相容）
4. ✅ 為未來後端整合預留擴充性

---

**文件版本**: v1.0
**最後更新**: 2025-12-03
**負責人**: Development Team
**審核狀態**: 待審核
