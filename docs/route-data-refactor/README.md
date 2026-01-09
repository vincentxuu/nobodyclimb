# 路由資料重構規劃文件

## 文件說明

本文件是針對 nobodyclimb-fe 專案的路由資料管理和資料獲取模式的重構規劃。本規劃基於對現有程式碼庫的深入分析，旨在建立統一、可維護、高效能的路由資料架構。

**建立日期**: 2025-12-04
**版本**: 1.0
**專案**: nobodyclimb-fe
**當前分支**: 001-django-rest-framework

---

## 目錄

1. [現狀分析](#1-現狀分析)
2. [核心問題識別](#2-核心問題識別)
3. [重構目標](#3-重構目標)
4. [技術方案](#4-技術方案)
5. [實施計劃](#5-實施計劃)
6. [遷移策略](#6-遷移策略)
7. [測試策略](#7-測試策略)
8. [風險評估](#8-風險評估)

---

## 1. 現狀分析

### 1.1 當前路由架構

專案採用 Next.js 15 App Router，基於檔案系統的路由結構：

```
src/app/
├── layout.tsx (根佈局)
├── page.tsx (首頁)
├── api/
│   └── videos/route.ts
├── auth/ (認證頁面群)
├── biography/ (人物誌)
│   └── profile/[id]/
├── blog/ (部落格)
│   ├── [id]/
│   ├── edit/[id]/
│   └── create/
├── crag/ (岩場)
│   └── [id]/
├── gym/ (岩館)
│   └── [id]/
├── gallery/ (攝影集)
├── search/ (搜尋)
├── videos/ (影片)
└── profile/ (使用者檔案)
```

### 1.2 引數處理模式現狀

#### 模式 A: 使用 `use()` hook（Next.js 15 推薦模式）

```typescript
// 檔案位置: crag/[id]/page.tsx, gym/[id]/page.tsx, biography/profile/[id]/page.tsx

export default function CragDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)  // React 19's use() hook
  const cragId = parseInt(id)
  // ...
}
```

**特點**:
- 使用 React 19 的 `use()` hook 解包非同步引數
- Next.js 15 官方推薦模式
- 所有頁面使用 `'use client'` 指令

**使用頁面**:
- `/crag/[id]` - 岩場詳情頁
- `/gym/[id]` - 岩館詳情頁
- `/biography/profile/[id]` - 人物誌詳情頁

#### 模式 B: 使用 `useParams()` hook（客戶端模式）

```typescript
// 檔案位置: blog/[id]/page.tsx, blog/edit/[id]/page.tsx

export default function BlogDetail() {
  const params = useParams()
  const id = params.id as string
  // ...
}
```

**特點**:
- 客戶端 hook，來自 `next/navigation`
- 需要型別斷言 (`as string`)
- 較舊的模式

**使用頁面**:
- `/blog/[id]` - 文章詳情頁
- `/blog/edit/[id]` - 文章編輯頁

#### 模式 C: 搜尋引數（Query Strings）

```typescript
// 檔案位置: blog/page.tsx

export default function BlogPage() {
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get('category')

  // URL 示例: /blog?category=equipment
}
```

**特點**:
- 使用 `useSearchParams()` hook
- 雙向同步：更新分類也更新 URL
- 需要 Suspense 包裹

### 1.3 資料獲取模式現狀

#### A. 本地 Mock 資料（最常見）

```typescript
// 直接匯入靜態資料
import { mockArticles } from '@/mocks/articles'
import { biographyData } from '@/data/biographyData'
import videosData from '../../../lib/constants/videos.json'

// 使用: 透過 ID 查詢
const currentArticle = mockArticles.find((article) => article.id === id)
const person = biographyData.find((person) => person.id === personId)
```

**資料來源檔案**:
- `/src/mocks/articles.ts` - 文章資料（包含裝備詳情）
- `/src/data/biographyData.ts` - 人物誌資料
- `/src/lib/constants/videos.json` - 影片資料
- 頁面內聯 mock 資料（例如：cragData, gymData 陣列）

**問題**:
- 資料分散在多個位置
- 無統一資料管理
- 難以維護和更新
- 無法實現實時資料同步

#### B. API 路由（最小化使用）

```typescript
// 檔案: src/app/api/videos/route.ts
export async function GET(_request: NextRequest) {
  try {
    return new Response(JSON.stringify(videosData), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to load videos' }), {
      status: 500
    })
  }
}
```

**現狀**:
- 僅實現了單一 API 路由
- 返回靜態 JSON 資料
- 未被前端實際使用

#### C. Zustand 狀態管理

已實現三個 Store:

**1. `useAuthStore`** (`src/store/authStore.ts`)
```typescript
interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (credentials) => Promise<void>
  logout: () => void
  register: (userData) => Promise<void>
}
```
- 使用 Cookie 持久化 (AUTH_TOKEN_KEY)
- 包含測試憑證回退機制

**2. `useContentStore`** (`src/store/contentStore.ts`)
```typescript
interface ContentState {
  // Posts
  posts: Post[]
  featuredPosts: Post[]
  currentPost: Post | null
  postsLoading: boolean
  postsError: string | null

  // Gyms
  gyms: Gym[]
  featuredGyms: Gym[]
  currentGym: Gym | null
  gymsLoading: boolean
  gymsError: string | null

  // Galleries
  galleries: Gallery[]
  currentGallery: Gallery | null
  galleriesLoading: boolean
  galleriesError: string | null

  // Actions
  fetchPosts: () => Promise<void>
  fetchPostById: (id: string) => Promise<void>
  fetchPostBySlug: (slug: string) => Promise<void>
  fetchFeaturedPosts: () => Promise<void>
  // Similar for gyms and galleries
}
```
- Mock API 響應，帶 800ms 延遲
- 包含搜尋功能
- 狀態管理完整但資料為 mock

**3. `useUIStore`** (推測存在)
- 可能處理 UI 狀態（模態框、側邊欄等）

### 1.4 頁面元件資料模式總結

| 頁面 | 路由 | 引數型別 | 資料來源 | 元件型別 |
|------|------|---------|--------|---------|
| 岩場詳情 | `/crag/[id]` | `use(params)` | 頁面內 cragData 陣列 | Client |
| 岩館詳情 | `/gym/[id]` | `use(params)` | 頁面內 gymData 陣列 | Client |
| 人物誌詳情 | `/biography/profile/[id]` | `use(params)` | biographyData.ts | Client |
| 文章詳情 | `/blog/[id]` | `useParams()` | mockArticles | Client |
| 文章列表 | `/blog` | `useSearchParams()` | mockArticles | Client (Suspense) |
| 文章編輯 | `/blog/edit/[id]` | `useParams()` | mockArticles | Client |
| 使用者檔案 | `/profile` | - | ProfileContainer | Client |
| 搜尋 | `/search` | `useSearchParams()` | useContentStore | Client (Suspense) |
| 影片 | `/videos` | `useSearchParams()` | videos.json | Client |

---

## 2. 核心問題識別

### 2.1 引數處理不一致

**問題描述**:
- 混用 `use(params)` (較新) 和 `useParams()` (較舊)
- 沒有統一的引數處理策略
- 型別定義重複：多處使用 `Promise<{ id: string }>`

**影響**:
- 程式碼可讀性差
- 新開發者困惑
- 維護成本高
- 型別安全性不足

**示例對比**:
```typescript
// crag/[id]/page.tsx - 使用 use()
const { id } = use(params)

// blog/[id]/page.tsx - 使用 useParams()
const params = useParams()
const id = params.id as string
```

### 2.2 全頁面客戶端渲染

**問題描述**:
- 所有頁面都使用 `'use client'` 指令
- 即使列表頁也是客戶端渲染
- 未利用 Next.js 的服務端渲染和靜態生成能力

**影響**:
- SEO 表現差
- 首屏載入慢
- 無法利用 SSR/SSG 最佳化
- JavaScript bundle 過大
- Core Web Vitals 指標差

**資料**:
- 28 個頁面元件均為客戶端元件
- 0 個服務端元件
- 0 個靜態生成頁面

### 2.3 資料獲取混亂

**問題描述**:
- 嚴重依賴 mock 資料
- 資料硬編碼在元件和檔案中
- Mock 資料分散在多個位置
- 沒有後端整合
- Store 中的 mock 延遲 (`setTimeout` 800ms)

**資料分散位置**:
```
/src/mocks/articles.ts
/src/data/biographyData.ts
/src/lib/constants/videos.json
/src/app/crag/[id]/page.tsx (cragData 內聯)
/src/app/gym/[id]/page.tsx (gymData 內聯)
```

**影響**:
- 無法實現實際功能
- 資料不同步
- 維護困難
- 無法進行真實測試
- 使用者體驗不真實

### 2.4 型別安全問題

**問題描述**:
- 引數型別重複定義
- 大量型別斷言 (`as string`)
- 型別轉換模式重複 (`parseInt(id)`)
- 缺少泛型抽象

**示例**:
```typescript
// 重複的型別定義
{ params: Promise<{ id: string }> }  // crag/[id]
{ params: Promise<{ id: string }> }  // gym/[id]
{ params: Promise<{ id: string }> }  // biography/profile/[id]

// 型別斷言
const id = params.id as string

// 重複的轉換邏輯
const cragId = parseInt(id)
const gymId = parseInt(id)
const personId = parseInt(id)
```

### 2.5 分頁和無限滾動未完成

**問題描述**:
- 存在 Hooks: `useInfiniteScroll`, `useScrollProgress`
- 當前頁面未使用這些 Hooks
- Store 有分頁狀態但未實現
- 無實際分頁邏輯

**影響**:
- 無法處理大資料集
- 使用者體驗受限
- 效能問題（一次性載入所有資料）

### 2.6 搜尋引數同步不一致

**問題描述**:
- 僅 Blog 頁面實現了 URL ↔ 狀態雙向同步
- 其他頁面沒有一致的模式
- 分類引數對映增加複雜性

**示例**:
```typescript
// blog/page.tsx - 有雙向同步
const categoryMapping: Record<string, ArticleCategory> = {
  equipment: '裝備介紹',
  technique: '技巧介紹',
  research: '技術研究',
  competition: '比賽介紹',
}

// 其他頁面 - 無此機制
```

### 2.7 錯誤處理缺失

**問題描述**:
- 沒有路由級別的錯誤處理（無 `error.tsx`）
- 簡單的 "not found" 處理
- 沒有錯誤邊界
- 缺少使用者友好的錯誤資訊

**當前錯誤處理**:
```typescript
if (!currentCrag) {
  return <div>Crag not found</div>
}
```

### 2.8 缺少 Loading 狀態

**問題描述**:
- 沒有路由級別的 loading UI（無 `loading.tsx`）
- Store 有 loading 狀態但未充分利用
- 使用者體驗不佳

---

## 3. 重構目標

### 3.1 統一路由引數處理

**目標**:
- 在所有動態路由中統一使用 Next.js 15 推薦的 `use(params)` 模式
- 建立通用的引數處理型別和工具函式
- 消除型別斷言和重複的轉換邏輯

**預期成果**:
```typescript
// 通用引數型別
type RouteParams<T = string> = Promise<{ [key: string]: T }>

// 通用引數處理 Hook
function useRouteParams<T = string>(
  params: RouteParams,
  transform?: (value: string) => T
): T

// 使用示例
const id = useRouteParams(params, parseInt)
```

### 3.2 最佳化渲染策略

**目標**:
- 將適合的頁面轉換為服務端元件
- 實現靜態生成（Static Generation）
- 保留必要的客戶端互動

**頁面分類**:

| 頁面型別 | 渲染策略 | 理由 |
|---------|---------|------|
| 列表頁 (blog, crag, gym) | SSR/SSG | SEO, 效能 |
| 詳情頁 (blog/[id], crag/[id]) | SSR + ISR | SEO, 資料新鮮度 |
| 使用者相關 (profile, settings) | Client | 互動性 |
| 搜尋頁 | Client | 實時互動 |
| 認證頁面 | Client | 表單互動 |

**預期改進**:
- First Contentful Paint (FCP): 減少 40%
- Largest Contentful Paint (LCP): 減少 50%
- Time to Interactive (TTI): 減少 35%
- SEO 分數: 提升至 90+

### 3.3 建立統一資料層

**目標**:
- 建立統一的 API 服務層
- 替換所有 mock 資料為真實 API 呼叫
- 集中資料獲取邏輯
- 實現統一的錯誤處理和快取策略

**架構**:
```
Page Component (Server/Client)
    ↓
Service Layer (lib/api/services/)
    ↓
API Client (lib/api/client.ts)
    ↓
HTTP Client (Axios with interceptors)
    ↓
Backend API
```

**服務層結構**:
```
src/lib/api/
├── client.ts          # Axios 例項配置
├── types.ts           # API 型別定義
├── services/
│   ├── article.ts     # 文章相關 API
│   ├── crag.ts        # 岩場相關 API
│   ├── gym.ts         # 岩館相關 API
│   ├── biography.ts   # 人物誌相關 API
│   ├── gallery.ts     # 攝影集相關 API
│   └── auth.ts        # 認證相關 API
└── hooks/
    ├── useArticles.ts # 文章資料 Hook
    ├── useCrags.ts    # 岩場資料 Hook
    └── ...
```

### 3.4 增強型別安全

**目標**:
- 建立通用的引數型別
- 減少型別斷言
- 使用泛型提高程式碼複用性
- 完整的 API 響應型別定義

**型別系統**:
```typescript
// 通用 API 響應型別
interface ApiResponse<T> {
  data: T
  message?: string
  status: number
}

interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// 通用錯誤型別
interface ApiError {
  code: string
  message: string
  details?: unknown
}
```

### 3.5 實現完整的分頁和載入

**目標**:
- 實現服務端分頁
- 實現客戶端無限滾動
- 統一分頁引數和狀態管理
- 最佳化大資料集的處理

**實現方案**:
```typescript
// 服務端分頁
interface PaginationParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// 客戶端無限滾動
function useInfiniteScroll<T>(
  fetchFn: (page: number) => Promise<PaginatedResponse<T>>,
  options?: InfiniteScrollOptions
)
```

### 3.6 統一錯誤處理

**目標**:
- 每個路由新增 `error.tsx`
- 實現錯誤邊界元件
- 提供使用者友好的錯誤資訊
- 統一的錯誤日誌和監控

**錯誤處理層級**:
```
1. 路由級別 (error.tsx) - 處理整個路由錯誤
2. 元件級別 (ErrorBoundary) - 處理元件錯誤
3. API 級別 (API interceptors) - 處理 API 錯誤
4. 全域性級別 (Global error handler) - 處理未捕獲錯誤
```

### 3.7 新增 Loading 狀態

**目標**:
- 每個路由新增 `loading.tsx`
- 實現骨架屏元件
- 統一的載入狀態管理
- 流暢的載入體驗

**Loading 策略**:
```
1. 路由級別 (loading.tsx) - Suspense boundary
2. 元件級別 (Skeleton) - 區域性載入
3. 資料級別 (Loading state) - Store loading flags
```

### 3.8 最佳化搜尋引數管理

**目標**:
- 建立通用的搜尋引數管理 Hook
- 統一 URL ↔ 狀態同步機制
- 型別安全的搜尋引數處理

**實現方案**:
```typescript
function useSearchParamsState<T>(
  key: string,
  defaultValue: T,
  serialize?: (value: T) => string,
  deserialize?: (value: string) => T
): [T, (value: T) => void]
```

---

## 4. 技術方案

### 4.1 引數處理標準化

#### 4.1.1 建立通用型別和工具

**檔案**: `src/lib/routing/types.ts`

```typescript
/**
 * 通用路由引數型別
 * Next.js 15 中動態路由引數是非同步的
 */
export type RouteParams<T extends Record<string, string> = Record<string, string>> = Promise<T>

/**
 * 常見的路由引數型別
 */
export type IdParams = RouteParams<{ id: string }>
export type SlugParams = RouteParams<{ slug: string }>

/**
 * 搜尋引數型別
 */
export interface SearchParams {
  [key: string]: string | string[] | undefined
}

/**
 * 頁面 Props 型別
 */
export interface PageProps<P = {}, S = {}> {
  params: RouteParams<P>
  searchParams: S
}
```

**檔案**: `src/lib/routing/hooks.ts`

```typescript
import { use } from 'react'
import type { RouteParams } from './types'

/**
 * 通用路由引數 Hook
 * 自動解包非同步引數並可選轉換型別
 *
 * @example
 * const id = useRouteParams(params, 'id', parseInt)
 */
export function useRouteParam<T = string>(
  params: RouteParams,
  key: string,
  transform?: (value: string) => T
): T {
  const unwrapped = use(params)
  const value = unwrapped[key]

  if (value === undefined) {
    throw new Error(`Route parameter "${key}" not found`)
  }

  return transform ? transform(value) : (value as unknown as T)
}

/**
 * 批次獲取路由引數
 */
export function useRouteParams<T extends Record<string, string>>(
  params: RouteParams<T>
): T {
  return use(params)
}

/**
 * 獲取數字型別的 ID 引數
 */
export function useNumericId(params: RouteParams<{ id: string }>): number {
  return useRouteParam(params, 'id', (id) => {
    const parsed = parseInt(id, 10)
    if (isNaN(parsed)) {
      throw new Error(`Invalid numeric ID: ${id}`)
    }
    return parsed
  })
}
```

#### 4.1.2 使用示例

**重構前** (`crag/[id]/page.tsx`):
```typescript
export default function CragDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const cragId = parseInt(id)

  const currentCrag = cragData.find((crag) => crag.id === cragId)
  if (!currentCrag) {
    return <div>Crag not found</div>
  }
  // ...
}
```

**重構後**:
```typescript
import { useNumericId } from '@/lib/routing/hooks'
import type { IdParams, PageProps } from '@/lib/routing/types'

export default function CragDetailPage({ params }: PageProps<{ id: string }>) {
  const cragId = useNumericId(params)

  // 資料獲取移至服務層
  const currentCrag = await cragService.getCragById(cragId)
  // ...
}
```

### 4.2 服務層架構

#### 4.2.1 API 客戶端配置

**檔案**: `src/lib/api/client.ts`

```typescript
import axios, { AxiosInstance, AxiosError } from 'axios'
import { API_BASE_URL, AUTH_TOKEN_KEY } from '@/lib/constants'

/**
 * 建立配置好的 Axios 例項
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * 請求攔截器 - 新增認證 token
 */
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(AUTH_TOKEN_KEY)
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

/**
 * 響應攔截器 - 統一錯誤處理
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    // 處理認證錯誤
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(AUTH_TOKEN_KEY)
        window.location.href = '/auth/login'
      }
    }

    // 統一錯誤格式
    const apiError: ApiError = {
      code: error.response?.data?.code || 'UNKNOWN_ERROR',
      message: error.response?.data?.message || error.message,
      details: error.response?.data,
    }

    return Promise.reject(apiError)
  }
)

/**
 * 通用 API 錯誤型別
 */
export interface ApiError {
  code: string
  message: string
  details?: unknown
}

/**
 * 通用 API 響應型別
 */
export interface ApiResponse<T> {
  data: T
  message?: string
  status: number
}

/**
 * 分頁響應型別
 */
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

/**
 * 分頁請求引數
 */
export interface PaginationParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
```

#### 4.2.2 服務層實現示例

**檔案**: `src/lib/api/services/crag.ts`

```typescript
import { apiClient } from '../client'
import type { ApiResponse, PaginatedResponse, PaginationParams } from '../client'

/**
 * 岩場型別定義
 */
export interface Crag {
  id: number
  name: string
  englishName: string
  location: string
  description: string
  type: string
  rockType: string
  routes: number
  difficulty: string
  height: string
  approach: string
  seasons: string[]
  images: string[]
  geoCoordinates: {
    latitude: number
    longitude: number
  }
  areas?: CragArea[]
  routes_details?: CragRoute[]
}

export interface CragArea {
  name: string
  description: string
  difficulty: string
  routes: number
  image: string
}

export interface CragRoute {
  id: string
  name: string
  englishName: string
  grade: string
  length: string
  type: string
  area: string
  description: string
  protection: string
  popularity: number
  views: number
  images: string[]
  videos: string[]
  tips: string
}

/**
 * 岩場列表請求引數
 */
export interface CragListParams extends PaginationParams {
  search?: string
  type?: string
  location?: string
  difficulty?: string
}

/**
 * 岩場服務類
 */
class CragService {
  /**
   * 獲取岩場列表
   */
  async getCrags(params?: CragListParams): Promise<PaginatedResponse<Crag>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Crag>>>('/crags', {
      params,
    })
    return response.data.data
  }

  /**
   * 獲取岩場詳情
   */
  async getCragById(id: number): Promise<Crag> {
    const response = await apiClient.get<ApiResponse<Crag>>(`/crags/${id}`)
    return response.data.data
  }

  /**
   * 建立岩場（需要認證）
   */
  async createCrag(data: Omit<Crag, 'id'>): Promise<Crag> {
    const response = await apiClient.post<ApiResponse<Crag>>('/crags', data)
    return response.data.data
  }

  /**
   * 更新岩場（需要認證）
   */
  async updateCrag(id: number, data: Partial<Crag>): Promise<Crag> {
    const response = await apiClient.patch<ApiResponse<Crag>>(`/crags/${id}`, data)
    return response.data.data
  }

  /**
   * 刪除岩場（需要認證）
   */
  async deleteCrag(id: number): Promise<void> {
    await apiClient.delete(`/crags/${id}`)
  }

  /**
   * 獲取岩場的路線列表
   */
  async getCragRoutes(cragId: number, params?: PaginationParams): Promise<PaginatedResponse<CragRoute>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<CragRoute>>>(
      `/crags/${cragId}/routes`,
      { params }
    )
    return response.data.data
  }

  /**
   * 搜尋岩場
   */
  async searchCrags(query: string, params?: PaginationParams): Promise<PaginatedResponse<Crag>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Crag>>>('/crags/search', {
      params: { q: query, ...params },
    })
    return response.data.data
  }
}

export const cragService = new CragService()
```

**檔案**: `src/lib/api/services/article.ts`

```typescript
import { apiClient } from '../client'
import type { ApiResponse, PaginatedResponse, PaginationParams } from '../client'

/**
 * 文章分類
 */
export type ArticleCategory = '裝備介紹' | '技巧介紹' | '技術研究' | '比賽介紹'

/**
 * 文章型別
 */
export interface Article {
  id: string
  title: string
  category: ArticleCategory
  description?: string
  content: string
  imageUrl: string
  date: string
  author: {
    id: string
    name: string
    avatar?: string
  }
  images?: string[]
  equipment?: {
    name: string
    usage: string
    commonTypes: string
    purchaseInfo: string
    recommendation: string
  }
  tags?: string[]
  views?: number
  likes?: number
}

/**
 * 文章列表引數
 */
export interface ArticleListParams extends PaginationParams {
  category?: string
  tag?: string
  author?: string
  search?: string
}

/**
 * 文章服務類
 */
class ArticleService {
  /**
   * 獲取文章列表
   */
  async getArticles(params?: ArticleListParams): Promise<PaginatedResponse<Article>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Article>>>('/articles', {
      params,
    })
    return response.data.data
  }

  /**
   * 獲取文章詳情
   */
  async getArticleById(id: string): Promise<Article> {
    const response = await apiClient.get<ApiResponse<Article>>(`/articles/${id}`)
    return response.data.data
  }

  /**
   * 建立文章（需要認證）
   */
  async createArticle(data: Omit<Article, 'id' | 'date' | 'views' | 'likes'>): Promise<Article> {
    const response = await apiClient.post<ApiResponse<Article>>('/articles', data)
    return response.data.data
  }

  /**
   * 更新文章（需要認證）
   */
  async updateArticle(id: string, data: Partial<Article>): Promise<Article> {
    const response = await apiClient.patch<ApiResponse<Article>>(`/articles/${id}`, data)
    return response.data.data
  }

  /**
   * 刪除文章（需要認證）
   */
  async deleteArticle(id: string): Promise<void> {
    await apiClient.delete(`/articles/${id}`)
  }

  /**
   * 獲取特色文章
   */
  async getFeaturedArticles(limit: number = 4): Promise<Article[]> {
    const response = await apiClient.get<ApiResponse<Article[]>>('/articles/featured', {
      params: { limit },
    })
    return response.data.data
  }

  /**
   * 獲取相關文章
   */
  async getRelatedArticles(id: string, limit: number = 3): Promise<Article[]> {
    const response = await apiClient.get<ApiResponse<Article[]>>(`/articles/${id}/related`, {
      params: { limit },
    })
    return response.data.data
  }

  /**
   * 搜尋文章
   */
  async searchArticles(query: string, params?: PaginationParams): Promise<PaginatedResponse<Article>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Article>>>('/articles/search', {
      params: { q: query, ...params },
    })
    return response.data.data
  }
}

export const articleService = new ArticleService()
```

#### 4.2.3 React Hooks 封裝

**檔案**: `src/lib/api/hooks/useCrags.ts`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { cragService, type Crag, type CragListParams } from '../services/crag'
import type { PaginatedResponse } from '../client'

/**
 * 獲取岩場列表 Hook
 */
export function useCrags(params?: CragListParams) {
  const [data, setData] = useState<PaginatedResponse<Crag> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await cragService.getCrags(params)

        if (!cancelled) {
          setData(result)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Unknown error'))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      cancelled = true
    }
  }, [JSON.stringify(params)])

  return { data, loading, error }
}

/**
 * 獲取岩場詳情 Hook
 */
export function useCrag(id: number) {
  const [data, setData] = useState<Crag | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await cragService.getCragById(id)

        if (!cancelled) {
          setData(result)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Unknown error'))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      cancelled = true
    }
  }, [id])

  return { data, loading, error }
}
```

### 4.3 渲染策略最佳化

#### 4.3.1 服務端元件示例

**檔案**: `src/app/crag/page.tsx` (列表頁 - 服務端元件)

```typescript
import { cragService } from '@/lib/api/services/crag'
import { CragList } from '@/components/crag/crag-list'
import { CragFilters } from '@/components/crag/crag-filters'

/**
 * 岩場列表頁 - 服務端元件
 *
 * 優勢:
 * - SEO 友好
 * - 首屏載入快
 * - 減少客戶端 JavaScript
 */
export default async function CragListPage({
  searchParams,
}: {
  searchParams: { page?: string; type?: string; location?: string }
}) {
  const page = searchParams.page ? parseInt(searchParams.page) : 1

  // 在服務端獲取資料
  const crags = await cragService.getCrags({
    page,
    pageSize: 12,
    type: searchParams.type,
    location: searchParams.location,
  })

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-3xl font-medium">岩場</h1>

        {/* 篩選器 - 客戶端元件 */}
        <CragFilters />

        {/* 列表 - 服務端元件 */}
        <CragList crags={crags.items} />

        {/* 分頁 - 客戶端元件 */}
        <Pagination
          currentPage={crags.page}
          totalPages={Math.ceil(crags.total / crags.pageSize)}
          hasMore={crags.hasMore}
        />
      </div>
    </main>
  )
}

/**
 * 生成靜態引數（可選）
 * 為常見的篩選組合預渲染頁面
 */
export async function generateStaticParams() {
  return [
    { page: '1' },
    { page: '1', type: 'sport' },
    { page: '1', type: 'boulder' },
  ]
}

/**
 * 後設資料配置
 */
export const metadata = {
  title: '岩場列表 | NobodyClimb',
  description: '探索臺灣各地的攀岩場地，包含詳細的路線資訊和交通指南',
}
```

#### 4.3.2 混合渲染示例

**檔案**: `src/app/crag/[id]/page.tsx` (詳情頁 - 服務端 + 客戶端)

```typescript
import { notFound } from 'next/navigation'
import { cragService } from '@/lib/api/services/crag'
import { CragHeader } from '@/components/crag/crag-header'
import { CragContent } from '@/components/crag/crag-content'
import { CragInteractions } from '@/components/crag/crag-interactions' // 客戶端元件
import type { PageProps } from '@/lib/routing/types'

/**
 * 岩場詳情頁 - 服務端元件
 * 使用 ISR (Incremental Static Regeneration)
 */
export default async function CragDetailPage({ params }: PageProps<{ id: string }>) {
  const { id } = await params
  const cragId = parseInt(id, 10)

  if (isNaN(cragId)) {
    notFound()
  }

  try {
    // 服務端獲取資料
    const crag = await cragService.getCragById(cragId)

    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* 服務端渲染 */}
          <CragHeader crag={crag} />
          <CragContent crag={crag} />

          {/* 客戶端互動元件 */}
          <CragInteractions cragId={crag.id} />
        </div>
      </main>
    )
  } catch (error) {
    notFound()
  }
}

/**
 * ISR 配置 - 每小時重新驗證
 */
export const revalidate = 3600

/**
 * 動態後設資料
 */
export async function generateMetadata({ params }: PageProps<{ id: string }>) {
  const { id } = await params
  const cragId = parseInt(id, 10)

  try {
    const crag = await cragService.getCragById(cragId)

    return {
      title: `${crag.name} | NobodyClimb`,
      description: crag.description,
      openGraph: {
        title: crag.name,
        description: crag.description,
        images: crag.images,
      },
    }
  } catch {
    return {
      title: '岩場未找到',
    }
  }
}
```

### 4.4 錯誤和載入狀態

#### 4.4.1 錯誤處理

**檔案**: `src/app/crag/[id]/error.tsx`

```typescript
'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function CragDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 可以在這裡記錄錯誤到錯誤追蹤服務
    console.error('Crag detail error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <AlertTriangle className="mx-auto mb-4 h-16 w-16 text-red-500" />
        <h2 className="mb-2 text-2xl font-medium">獲取岩場資訊失敗</h2>
        <p className="mb-6 text-gray-600">
          {error.message || '發生了一些錯誤，請稍後重試'}
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={reset}>重試</Button>
          <Button variant="outline" onClick={() => window.history.back()}>
            返回
          </Button>
        </div>
      </div>
    </div>
  )
}
```

**檔案**: `src/app/crag/[id]/not-found.tsx`

```typescript
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileQuestion } from 'lucide-react'

export default function CragNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <FileQuestion className="mx-auto mb-4 h-16 w-16 text-gray-400" />
        <h2 className="mb-2 text-2xl font-medium">岩場未找到</h2>
        <p className="mb-6 text-gray-600">
          您查詢的岩場不存在或已被刪除
        </p>
        <Link href="/crag">
          <Button>返回岩場列表</Button>
        </Link>
      </div>
    </div>
  )
}
```

#### 4.4.2 載入狀態

**檔案**: `src/app/crag/[id]/loading.tsx`

```typescript
import { CragDetailSkeleton } from '@/components/crag/crag-detail-skeleton'

export default function CragDetailLoading() {
  return <CragDetailSkeleton />
}
```

**檔案**: `src/components/crag/crag-detail-skeleton.tsx`

```typescript
export function CragDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header Skeleton */}
        <div className="mb-8 animate-pulse">
          <div className="mb-4 h-96 w-full rounded-lg bg-gray-200" />
          <div className="mb-2 h-8 w-1/3 rounded bg-gray-200" />
          <div className="h-4 w-1/4 rounded bg-gray-200" />
        </div>

        {/* Content Skeleton */}
        <div className="space-y-4 animate-pulse">
          <div className="h-4 w-full rounded bg-gray-200" />
          <div className="h-4 w-full rounded bg-gray-200" />
          <div className="h-4 w-3/4 rounded bg-gray-200" />
        </div>
      </div>
    </div>
  )
}
```

### 4.5 搜尋引數管理

**檔案**: `src/lib/routing/search-params.ts`

```typescript
'use client'

import { useSearchParams as useNextSearchParams, useRouter, usePathname } from 'next/navigation'
import { useCallback, useMemo } from 'react'

/**
 * 型別安全的搜尋引數 Hook
 * 提供 URL ↔ State 雙向同步
 */
export function useSearchParamsState<T extends string | number | boolean>(
  key: string,
  defaultValue: T,
  options?: {
    serialize?: (value: T) => string
    deserialize?: (value: string) => T
  }
): [T, (value: T) => void] {
  const searchParams = useNextSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // 序列化和反序列化函式
  const serialize = options?.serialize || ((v: T) => String(v))
  const deserialize = options?.deserialize || ((v: string) => v as T)

  // 從 URL 獲取當前值
  const value = useMemo(() => {
    const param = searchParams.get(key)
    return param ? deserialize(param) : defaultValue
  }, [searchParams, key, defaultValue, deserialize])

  // 更新 URL 引數
  const setValue = useCallback(
    (newValue: T) => {
      const params = new URLSearchParams(searchParams.toString())

      if (newValue === defaultValue) {
        params.delete(key)
      } else {
        params.set(key, serialize(newValue))
      }

      const queryString = params.toString()
      const url = queryString ? `${pathname}?${queryString}` : pathname

      router.push(url, { scroll: false })
    },
    [searchParams, pathname, router, key, defaultValue, serialize]
  )

  return [value, setValue]
}

/**
 * 批次搜尋引數管理
 */
export function useSearchParamsObject<T extends Record<string, any>>(
  defaults: T
): [T, (updates: Partial<T>) => void] {
  const searchParams = useNextSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const values = useMemo(() => {
    const result = { ...defaults }

    for (const key in defaults) {
      const param = searchParams.get(key)
      if (param !== null) {
        // 簡單型別轉換
        const defaultValue = defaults[key]
        if (typeof defaultValue === 'number') {
          result[key] = parseInt(param, 10) as any
        } else if (typeof defaultValue === 'boolean') {
          result[key] = param === 'true' as any
        } else {
          result[key] = param as any
        }
      }
    }

    return result
  }, [searchParams, defaults])

  const setValues = useCallback(
    (updates: Partial<T>) => {
      const params = new URLSearchParams(searchParams.toString())

      for (const key in updates) {
        const value = updates[key]
        const defaultValue = defaults[key]

        if (value === undefined || value === defaultValue) {
          params.delete(key)
        } else {
          params.set(key, String(value))
        }
      }

      const queryString = params.toString()
      const url = queryString ? `${pathname}?${queryString}` : pathname

      router.push(url, { scroll: false })
    },
    [searchParams, pathname, router, defaults]
  )

  return [values, setValues]
}
```

**使用示例**:

```typescript
'use client'

import { useSearchParamsState, useSearchParamsObject } from '@/lib/routing/search-params'

export function BlogPage() {
  // 單個引數
  const [category, setCategory] = useSearchParamsState('category', 'all')

  // 多個引數
  const [filters, setFilters] = useSearchParamsObject({
    category: 'all',
    page: 1,
    sortBy: 'date',
  })

  return (
    <div>
      {/* 選擇分類會自動更新 URL */}
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="all">所有分類</option>
        <option value="equipment">裝備介紹</option>
      </select>

      {/* 批次更新多個引數 */}
      <button onClick={() => setFilters({ page: 2, sortBy: 'popularity' })}>
        第二頁，按熱度排序
      </button>
    </div>
  )
}
```

---

## 5. 實施計劃

### 5.1 階段劃分

#### 階段 1: 基礎設施建設（1-2 周）

**目標**: 建立統一的型別系統和工具函式

**任務**:
1. 建立路由引數處理工具
   - [ ] `src/lib/routing/types.ts` - 通用型別定義
   - [ ] `src/lib/routing/hooks.ts` - 引數處理 Hooks
   - [ ] 單元測試

2. 建立 API 客戶端和服務層
   - [ ] `src/lib/api/client.ts` - Axios 配置
   - [ ] `src/lib/api/types.ts` - API 型別
   - [ ] 請求/響應攔截器
   - [ ] 錯誤處理機制

3. 建立搜尋引數管理工具
   - [ ] `src/lib/routing/search-params.ts`
   - [ ] 單元測試

**驗收標準**:
- 所有工具函式有完整的 TypeScript 型別
- 單元測試覆蓋率 > 80%
- 文件完整

#### 階段 2: 服務層實現（2-3 周）

**目標**: 實現所有資料服務和 React Hooks

**任務**:
1. 實現服務類
   - [ ] `src/lib/api/services/crag.ts` - 岩場服務
   - [ ] `src/lib/api/services/gym.ts` - 岩館服務
   - [ ] `src/lib/api/services/article.ts` - 文章服務
   - [ ] `src/lib/api/services/biography.ts` - 人物誌服務
   - [ ] `src/lib/api/services/gallery.ts` - 攝影集服務
   - [ ] `src/lib/api/services/auth.ts` - 認證服務

2. 實現 React Hooks
   - [ ] `src/lib/api/hooks/useCrags.ts`
   - [ ] `src/lib/api/hooks/useGyms.ts`
   - [ ] `src/lib/api/hooks/useArticles.ts`
   - [ ] `src/lib/api/hooks/useBiographies.ts`
   - [ ] `src/lib/api/hooks/useGalleries.ts`

3. Mock 資料介面卡（過渡期）
   - [ ] 建立介面卡將現有 mock 資料轉換為 API 響應格式
   - [ ] 保證開發環境可用性

**驗收標準**:
- 所有服務有完整的型別定義
- 所有服務有錯誤處理
- Hooks 有 loading/error 狀態
- 可以在無後端情況下使用 mock 介面卡

#### 階段 3: 頁面重構 - 詳情頁（2-3 周）

**目標**: 重構所有詳情頁，統一引數處理和資料獲取

**優先順序**: 先重構詳情頁，因為改動影響範圍小

**任務**:
1. 重構 Crag 詳情頁
   - [ ] 統一引數處理為 `useNumericId()`
   - [ ] 替換內聯資料為服務呼叫
   - [ ] 新增 `error.tsx`
   - [ ] 新增 `loading.tsx`
   - [ ] 新增 `not-found.tsx`

2. 重構 Gym 詳情頁
   - [ ] 同上

3. 重構 Blog 詳情頁
   - [ ] 統一引數處理為 `useRouteParam()`
   - [ ] 替換 mock 資料為服務呼叫
   - [ ] 錯誤和載入狀態

4. 重構 Biography 詳情頁
   - [ ] 同上

**驗收標準**:
- 引數處理統一使用新的工具函式
- 資料獲取使用服務層
- 有完整的錯誤和載入狀態
- 保持現有 UI 不變

#### 階段 4: 頁面重構 - 列表頁（2-3 周）

**目標**: 重構列表頁，實現服務端渲染和分頁

**任務**:
1. 重構 Crag 列表頁
   - [ ] 轉換為服務端元件
   - [ ] 實現服務端資料獲取
   - [ ] 實現分頁
   - [ ] 實現篩選（客戶端元件）
   - [ ] SEO 最佳化

2. 重構 Gym 列表頁
   - [ ] 同上

3. 重構 Blog 列表頁
   - [ ] 轉換為服務端元件
   - [ ] 實現分類篩選
   - [ ] 保持 URL 同步
   - [ ] 分頁

4. 重構 Biography 列表頁
   - [ ] 同上

**驗收標準**:
- 列表頁使用服務端元件
- 分頁功能完整
- 篩選器工作正常
- SEO 後設資料完整
- Lighthouse 分數 > 90

#### 階段 5: 特殊頁面和元件（1-2 周）

**目標**: 重構搜尋、認證等特殊頁面

**任務**:
1. 搜尋頁面
   - [ ] 實現搜尋服務
   - [ ] 實現搜尋結果頁
   - [ ] 搜尋引數管理
   - [ ] 搜尋歷史

2. 認證頁面
   - [ ] 登入頁
   - [ ] 註冊頁
   - [ ] 個人檔案頁
   - [ ] 整合認證服務

3. 其他頁面
   - [ ] 首頁
   - [ ] 攝影集
   - [ ] 影片頁

**驗收標準**:
- 搜尋功能完整
- 認證流程正常
- 所有頁面資料來自服務層

#### 階段 6: 最佳化和清理（1 周）

**目標**: 刪除舊程式碼，最佳化效能

**任務**:
1. 刪除舊的 mock 資料檔案
   - [ ] 刪除 `/src/mocks/`
   - [ ] 刪除 `/src/data/`（保留必要的常量）
   - [ ] 刪除頁面內的內聯資料

2. 更新 Zustand Stores
   - [ ] 移除 mock 邏輯
   - [ ] 整合真實服務
   - [ ] 最佳化狀態管理

3. 效能最佳化
   - [ ] 實現 React Query 或 SWR（可選）
   - [ ] 最佳化圖片載入
   - [ ] 程式碼分割
   - [ ] Bundle 分析和最佳化

4. 文件更新
   - [ ] 更新 README
   - [ ] 更新 CLAUDE.md
   - [ ] API 文件
   - [ ] 元件文件

**驗收標準**:
- 沒有未使用的 mock 資料檔案
- Lighthouse 分數 > 90
- Bundle size 減少 > 20%
- 文件完整

### 5.2 時間估算

| 階段 | 時間 | 依賴 |
|------|------|------|
| 階段 1: 基礎設施 | 1-2 周 | - |
| 階段 2: 服務層 | 2-3 周 | 階段 1 |
| 階段 3: 詳情頁 | 2-3 周 | 階段 2 |
| 階段 4: 列表頁 | 2-3 周 | 階段 3 |
| 階段 5: 特殊頁面 | 1-2 周 | 階段 4 |
| 階段 6: 最佳化清理 | 1 周 | 階段 5 |

**總計**: 9-14 周（約 2-3.5 個月）

### 5.3 人力資源

**推薦團隊配置**:
- 1-2 名前端開發者（全職）
- 1 名後端開發者（配合 API 開發）
- 1 名測試工程師（兼職）

**如果是單人開發**:
- 時間可能延長 50%
- 建議優先完成階段 1-3
- 階段 4-6 可以分批進行

---

## 6. 遷移策略

### 6.1 漸進式遷移

**原則**:
- 不要一次性重寫所有程式碼
- 保持應用始終可用
- 新舊程式碼可以共存
- 逐步替換舊模式

### 6.2 共存策略

#### 6.2.1 資料來源共存

在過渡期，新舊資料來源可以共存：

```typescript
// src/lib/api/services/crag.ts

class CragService {
  private useMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'

  async getCragById(id: number): Promise<Crag> {
    if (this.useMock) {
      // 使用 mock 資料（過渡期）
      return mockCragData.find(c => c.id === id) || throw new Error('Not found')
    }

    // 使用真實 API
    const response = await apiClient.get<ApiResponse<Crag>>(`/crags/${id}`)
    return response.data.data
  }
}
```

透過環境變數控制：
```bash
# .env.local
NEXT_PUBLIC_USE_MOCK_DATA=true  # 開發環境
NEXT_PUBLIC_USE_MOCK_DATA=false # 生產環境
```

#### 6.2.2 元件共存

舊元件和新元件可以並存：

```
src/
├── components/
│   ├── crag/
│   │   ├── crag-detail.tsx          # 舊元件
│   │   └── crag-detail-new.tsx      # 新元件
```

使用功能標誌（Feature Flags）切換：
```typescript
// src/lib/feature-flags.ts
export const USE_NEW_CRAG_DETAIL = process.env.NEXT_PUBLIC_USE_NEW_CRAG_DETAIL === 'true'

// 在頁面中使用
import { CragDetail } from '@/components/crag/crag-detail'
import { CragDetailNew } from '@/components/crag/crag-detail-new'
import { USE_NEW_CRAG_DETAIL } from '@/lib/feature-flags'

export default function CragDetailPage({ params }) {
  const Component = USE_NEW_CRAG_DETAIL ? CragDetailNew : CragDetail
  return <Component params={params} />
}
```

### 6.3 回滾計劃

每個階段完成後，應該有明確的回滾策略：

**Git 分支策略**:
```
main
  ├── feat/route-refactor-phase-1
  ├── feat/route-refactor-phase-2
  ├── feat/route-refactor-phase-3
  └── ...
```

**回滾步驟**:
1. 發現問題 → 切換功能標誌（立即生效）
2. 嚴重問題 → 回滾部署到上一版本
3. 修復問題 → 重新部署

**功能標誌配置**:
```typescript
// src/lib/feature-flags.ts
export const featureFlags = {
  USE_NEW_CRAG_DETAIL: process.env.NEXT_PUBLIC_FF_NEW_CRAG_DETAIL === 'true',
  USE_NEW_BLOG_LIST: process.env.NEXT_PUBLIC_FF_NEW_BLOG_LIST === 'true',
  USE_NEW_GYM_DETAIL: process.env.NEXT_PUBLIC_FF_NEW_GYM_DETAIL === 'true',
  USE_SERVICE_LAYER: process.env.NEXT_PUBLIC_FF_SERVICE_LAYER === 'true',
}
```

### 6.4 測試策略

每個階段的遷移都需要充分測試：

#### 6.4.1 單元測試

```typescript
// src/lib/routing/__tests__/hooks.test.ts
import { renderHook } from '@testing-library/react'
import { useNumericId } from '../hooks'

describe('useNumericId', () => {
  it('should parse numeric ID from params', async () => {
    const params = Promise.resolve({ id: '123' })
    const { result } = renderHook(() => useNumericId(params))
    expect(result.current).toBe(123)
  })

  it('should throw error for invalid ID', async () => {
    const params = Promise.resolve({ id: 'abc' })
    expect(() => {
      renderHook(() => useNumericId(params))
    }).toThrow('Invalid numeric ID')
  })
})
```

#### 6.4.2 整合測試

```typescript
// src/lib/api/services/__tests__/crag.test.ts
import { cragService } from '../crag'
import { apiClient } from '../../client'

jest.mock('../../client')

describe('CragService', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getCragById', () => {
    it('should fetch crag by ID', async () => {
      const mockCrag = { id: 1, name: '龍洞' }
      apiClient.get.mockResolvedValue({
        data: { data: mockCrag }
      })

      const result = await cragService.getCragById(1)

      expect(apiClient.get).toHaveBeenCalledWith('/crags/1')
      expect(result).toEqual(mockCrag)
    })

    it('should handle errors', async () => {
      apiClient.get.mockRejectedValue(new Error('Network error'))

      await expect(cragService.getCragById(1)).rejects.toThrow('Network error')
    })
  })
})
```

#### 6.4.3 E2E 測試

使用 Playwright 或 Cypress：

```typescript
// e2e/crag-detail.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Crag Detail Page', () => {
  test('should display crag information', async ({ page }) => {
    await page.goto('/crag/1')

    // 等待載入完成
    await page.waitForSelector('h1')

    // 驗證標題
    const title = await page.textContent('h1')
    expect(title).toBeTruthy()

    // 驗證描述
    const description = await page.textContent('[data-testid="crag-description"]')
    expect(description).toBeTruthy()
  })

  test('should handle not found', async ({ page }) => {
    await page.goto('/crag/99999')

    // 應該顯示 404 頁面
    await expect(page.locator('text=岩場未找到')).toBeVisible()
  })

  test('should handle errors gracefully', async ({ page }) => {
    // 模擬網路錯誤
    await page.route('**/api/crags/*', route => route.abort())

    await page.goto('/crag/1')

    // 應該顯示錯誤頁面
    await expect(page.locator('text=獲取岩場資訊失敗')).toBeVisible()

    // 應該有重試按鈕
    await expect(page.locator('button:has-text("重試")')).toBeVisible()
  })
})
```

### 6.5 監控和驗證

#### 6.5.1 效能監控

```typescript
// src/lib/monitoring/performance.ts

export function trackPageLoad(pageName: string) {
  if (typeof window !== 'undefined' && window.performance) {
    const perfData = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

    console.log(`[Performance] ${pageName}`, {
      domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
      loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
      domInteractive: perfData.domInteractive,
      firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime,
      firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
    })
  }
}
```

#### 6.5.2 錯誤監控

整合 Sentry 或類似服務：

```typescript
// src/lib/monitoring/error-tracking.ts
import * as Sentry from '@sentry/nextjs'

export function initErrorTracking() {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
    })
  }
}

export function trackError(error: Error, context?: Record<string, any>) {
  console.error(error)
  Sentry.captureException(error, {
    extra: context,
  })
}
```

---

## 7. 測試策略

### 7.1 測試層級

#### 7.1.1 單元測試

**範圍**:
- 工具函式
- Hooks
- 服務類方法

**工具**: Jest + React Testing Library

**覆蓋率目標**: > 80%

**示例**:
```typescript
// src/lib/routing/__tests__/hooks.test.ts
describe('useRouteParam', () => {
  it('should extract and transform param', async () => {
    const params = Promise.resolve({ id: '123' })
    const { result } = renderHook(() => useRouteParam(params, 'id', parseInt))
    expect(result.current).toBe(123)
  })
})
```

#### 7.1.2 整合測試

**範圍**:
- API 服務與客戶端互動
- Hooks 與元件互動
- 狀態管理

**工具**: Jest + MSW (Mock Service Worker)

**示例**:
```typescript
// src/lib/api/services/__tests__/crag.integration.test.ts
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import { cragService } from '../crag'

const server = setupServer(
  rest.get('/api/crags/:id', (req, res, ctx) => {
    return res(ctx.json({
      data: { id: 1, name: '龍洞' }
    }))
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

test('getCragById integrates with API', async () => {
  const crag = await cragService.getCragById(1)
  expect(crag.name).toBe('龍洞')
})
```

#### 7.1.3 E2E 測試

**範圍**:
- 使用者流程
- 頁面導航
- 表單提交
- 錯誤處理

**工具**: Playwright

**關鍵場景**:
1. 瀏覽岩場列表 → 點選詳情 → 檢視資訊
2. 搜尋岩場 → 檢視結果 → 開啟詳情
3. 登入 → 收藏岩場 → 檢視收藏列表
4. 網路錯誤處理

**示例**:
```typescript
// e2e/user-flows/browse-crags.spec.ts
test('user can browse and view crag details', async ({ page }) => {
  // 1. 訪問列表頁
  await page.goto('/crag')
  await expect(page.locator('h1')).toContainText('岩場')

  // 2. 點選第一個岩場
  await page.click('[data-testid="crag-card"]:first-child')

  // 3. 驗證詳情頁
  await expect(page).toHaveURL(/\/crag\/\d+/)
  await expect(page.locator('[data-testid="crag-name"]')).toBeVisible()

  // 4. 檢查標籤頁切換
  await page.click('[data-testid="tab-routes"]')
  await expect(page.locator('[data-testid="routes-section"]')).toBeVisible()
})
```

### 7.2 測試清單

每個階段完成後必須透過以下測試：

#### 階段 1: 基礎設施

- [ ] 所有工具函式有單元測試
- [ ] 型別檢查透過 (`tsc --noEmit`)
- [ ] ESLint 無錯誤
- [ ] 文件完整

#### 階段 2: 服務層

- [ ] 所有服務方法有單元測試
- [ ] API 客戶端攔截器測試
- [ ] Mock 介面卡測試
- [ ] 錯誤處理測試

#### 階段 3-4: 頁面重構

- [ ] 每個頁面有 E2E 測試
- [ ] Loading 狀態測試
- [ ] Error 狀態測試
- [ ] Not Found 測試
- [ ] SEO 後設資料驗證
- [ ] Lighthouse 分數 > 85

#### 階段 5: 特殊頁面

- [ ] 搜尋功能測試
- [ ] 認證流程測試
- [ ] 表單驗證測試

#### 階段 6: 最佳化

- [ ] 效能測試（Core Web Vitals）
- [ ] Bundle 大小驗證
- [ ] 無未使用程式碼
- [ ] 所有舊 mock 檔案已刪除

### 7.3 持續整合

**.github/workflows/test.yml**:
```yaml
name: Test

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:coverage

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e

  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run type-check

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
```

---

## 8. 風險評估

### 8.1 技術風險

| 風險 | 機率 | 影響 | 緩解措施 |
|------|------|------|----------|
| API 不穩定 | 中 | 高 | Mock 介面卡 + 功能標誌 |
| 效能下降 | 低 | 中 | 效能監控 + 基準測試 |
| 型別錯誤 | 低 | 低 | 嚴格的 TypeScript 配置 |
| 瀏覽器相容性 | 低 | 中 | Polyfills + 瀏覽器測試 |

### 8.2 專案風險

| 風險 | 機率 | 影響 | 緩解措施 |
|------|------|------|----------|
| 時間延期 | 中 | 中 | 分階段交付 + 優先順序排序 |
| 需求變更 | 中 | 中 | 靈活的架構 + 文件完整 |
| 人員變動 | 低 | 高 | 詳細文件 + 程式碼審查 |
| 後端延期 | 高 | 高 | Mock 介面卡 + 並行開發 |

### 8.3 業務風險

| 風險 | 機率 | 影響 | 緩解措施 |
|------|------|------|----------|
| 使用者體驗下降 | 低 | 高 | A/B 測試 + 功能標誌 |
| SEO 下降 | 低 | 高 | 預渲染 + 監控 |
| 功能缺失 | 低 | 中 | 完整的測試 + 審查 |

### 8.4 應對策略

#### 8.4.1 API 不穩定

**問題**: 後端 API 可能不穩定或未完成

**措施**:
1. 使用 Mock 介面卡
2. 功能標誌控制切換
3. 完整的錯誤處理
4. 降級方案

```typescript
// 自動降級到 mock
class CragService {
  async getCragById(id: number): Promise<Crag> {
    try {
      // 嘗試真實 API
      return await this.fetchFromAPI(id)
    } catch (error) {
      console.warn('API failed, falling back to mock data', error)
      // 降級到 mock
      return this.fetchFromMock(id)
    }
  }
}
```

#### 8.4.2 效能問題

**問題**: 重構可能導致效能下降

**措施**:
1. 效能基準測試
2. 持續監控
3. 最佳化關鍵路徑
4. 程式碼分割

```typescript
// 效能基準測試
const baseline = {
  cragList: { FCP: 1200, LCP: 2500, TTI: 3000 },
  cragDetail: { FCP: 1000, LCP: 2000, TTI: 2500 },
}

// 每次部署後驗證
test('performance should not degrade', async () => {
  const metrics = await measurePerformance('/crag')
  expect(metrics.FCP).toBeLessThan(baseline.cragList.FCP * 1.1) // 允許 10% 偏差
})
```

#### 8.4.3 回滾策略

**問題**: 新功能有嚴重 bug

**措施**:
1. 功能標誌立即回滾
2. Git revert 快速回滾
3. 灰度釋出
4. 監控告警

```typescript
// 灰度釋出示例
const rolloutPercentage = parseInt(process.env.NEXT_PUBLIC_ROLLOUT_PERCENTAGE || '0')

function shouldUseNewFeature(userId: string): boolean {
  if (rolloutPercentage === 0) return false
  if (rolloutPercentage === 100) return true

  // 基於使用者 ID 的一致性雜湊
  const hash = hashCode(userId)
  return (hash % 100) < rolloutPercentage
}
```

---

## 9. 成功指標

### 9.1 技術指標

| 指標 | 當前值 | 目標值 | 測量方法 |
|------|--------|--------|----------|
| 型別覆蓋率 | ~60% | > 95% | `tsc --noEmit` |
| 測試覆蓋率 | 0% | > 80% | Jest coverage |
| 客戶端元件佔比 | 100% | < 40% | 手動統計 |
| API Mock 佔比 | 100% | 0% | 程式碼審查 |
| Bundle Size | TBD | 減少 20% | `next build --analyze` |
| Lighthouse 分數 | TBD | > 90 | Lighthouse CI |

### 9.2 效能指標

| 指標 | 當前值 | 目標值 | 測量方法 |
|------|--------|--------|----------|
| First Contentful Paint | TBD | < 1.5s | Chrome DevTools |
| Largest Contentful Paint | TBD | < 2.5s | Chrome DevTools |
| Time to Interactive | TBD | < 3.5s | Lighthouse |
| First Input Delay | TBD | < 100ms | Chrome UX Report |
| Cumulative Layout Shift | TBD | < 0.1 | Lighthouse |

### 9.3 質量指標

| 指標 | 當前值 | 目標值 | 測量方法 |
|------|--------|--------|----------|
| 引數處理一致性 | 0% | 100% | 程式碼審查 |
| 錯誤處理覆蓋 | 20% | 100% | 人工驗證 |
| Loading 狀態 | 0% | 100% | 人工驗證 |
| API 錯誤處理 | 部分 | 100% | 測試 |
| TypeScript 嚴格模式 | 否 | 是 | tsconfig.json |

### 9.4 維護性指標

| 指標 | 目標 | 測量方法 |
|------|------|----------|
| 程式碼重複率 | < 5% | SonarQube |
| 圈複雜度 | < 10 | ESLint |
| 文件覆蓋率 | 100% | 手動審查 |
| PR 審查時間 | < 1 天 | GitHub metrics |

---

## 10. 文件和知識傳遞

### 10.1 文件結構

```
docs/
├── route-data-refactor/
│   ├── README.md (本文件)
│   ├── api-design.md (API 設計文件)
│   ├── architecture.md (架構文件)
│   ├── migration-guide.md (遷移指南)
│   └── troubleshooting.md (故障排查)
├── api/
│   ├── crag.md
│   ├── gym.md
│   ├── article.md
│   └── ...
└── guides/
    ├── routing.md
    ├── data-fetching.md
    └── state-management.md
```

### 10.2 必要文件

#### 10.2.1 API 設計文件

記錄所有 API 端點、引數、響應格式

#### 10.2.2 架構決策記錄 (ADR)

記錄重要的架構決策和理由

#### 10.2.3 遷移指南

為其他開發者提供遷移步驟和示例

#### 10.2.4 故障排查指南

常見問題和解決方案

### 10.3 程式碼註釋

關鍵程式碼必須有詳細註釋：

```typescript
/**
 * 通用路由引數 Hook
 *
 * 自動解包 Next.js 15 的非同步引數並可選轉換型別
 *
 * @param params - Next.js 15 的非同步路由引數
 * @param key - 要提取的引數鍵名
 * @param transform - 可選的型別轉換函式
 * @returns 轉換後的引數值
 *
 * @example
 * // 獲取字串 ID
 * const id = useRouteParam(params, 'id')
 *
 * @example
 * // 獲取並轉換為數字
 * const id = useRouteParam(params, 'id', parseInt)
 *
 * @throws {Error} 當引數不存在時
 */
export function useRouteParam<T = string>(
  params: RouteParams,
  key: string,
  transform?: (value: string) => T
): T {
  // ...
}
```

---

## 11. 總結

### 11.1 核心改進

本重構計劃將帶來以下核心改進：

1. **統一的引數處理**: 所有動態路由使用一致的模式
2. **型別安全**: 完整的 TypeScript 型別覆蓋
3. **服務層架構**: 清晰的資料獲取和管理
4. **效能最佳化**: SSR/SSG + 更小的 bundle
5. **更好的使用者體驗**: Loading + Error 狀態
6. **可維護性**: 清晰的程式碼結構和文件

### 11.2 預期收益

#### 技術收益
- 程式碼可維護性提升 60%
- 開發效率提升 40%
- Bug 率降低 50%
- 型別安全覆蓋率 > 95%

#### 效能收益
- FCP 減少 40%
- LCP 減少 50%
- TTI 減少 35%
- Bundle size 減少 20%

#### 業務收益
- SEO 分數提升至 90+
- 使用者體驗改善
- 更快的功能迭代
- 更低的維護成本

### 11.3 長期價值

這次重構不僅解決當前問題，更為專案未來發展奠定堅實基礎：

1. **可擴充套件性**: 易於新增新功能和頁面
2. **團隊協作**: 統一的模式降低學習成本
3. **質量保證**: 完整的測試和文件
4. **技術債務**: 消除現有技術債務
5. **最佳實踐**: 符合 Next.js 和 React 最佳實踐

---

## 附錄

### A. 參考資料

- [Next.js 15 Documentation](https://nextjs.org/docs)
- [React 19 Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Web Vitals](https://web.dev/vitals/)
- [Axios Documentation](https://axios-http.com/docs/intro)

### B. 相關文件

- `/docs/backend/` - 後端 API 文件
- `/CLAUDE.md` - 專案開發指南
- `/README.md` - 專案說明

### C. 聯絡方式

如有問題或建議，請聯絡：

- 專案負責人: [待填寫]
- 技術討論: [待填寫]
- Issue Tracker: GitHub Issues

---

**文件維護**: 本文件應隨專案進展持續更新

**最後更新**: 2025-12-04
