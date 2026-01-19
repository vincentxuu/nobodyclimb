# NobodyClimb React Native 應用程式開發規劃

## 目錄
1. [專案概述](#專案概述)
2. [技術選型](#技術選型)
3. [專案結構](#專案結構)
4. [可重用程式碼分析](#可重用程式碼分析)
5. [功能模組規劃](#功能模組規劃)
6. [開發路線圖](#開發路線圖)
7. [關鍵決策點](#關鍵決策點)

---

## 專案概述

### 目標
將 NobodyClimb 攀岩社群平台從 Next.js Web 應用程式擴展為 iOS 和 Android 原生應用程式。

### 核心功能 (MVP)
- 用戶認證 (登入/註冊/Google OAuth)
- 人物誌瀏覽與編輯
- 岩場與攀岩館資訊查詢
- 人生清單管理
- YouTube 影片瀏覽
- 個人檔案管理

### 現有後端
- API: `https://api.nobodyclimb.cc/api/v1` (Hono on Cloudflare Workers)
- 資料庫: Cloudflare D1 (SQLite)
- 認證: JWT
- 檔案存儲: Cloudflare R2

---

## 技術選型

### 框架選擇: Expo (推薦)

| 方案 | 優點 | 缺點 |
|------|------|------|
| **Expo (推薦)** | 快速開發、OTA 更新、豐富 SDK | 原生模組限制 |
| React Native CLI | 完全控制原生程式碼 | 配置複雜、開發較慢 |

**推薦 Expo 的原因**:
1. NobodyClimb 不需要深度原生功能
2. Expo SDK 提供相機、地圖、推播等常用功能
3. EAS Build 簡化 CI/CD
4. OTA 更新方便快速迭代

### 核心技術棧

```
┌─────────────────────────────────────────────────────────┐
│                    Expo SDK 52+                          │
├─────────────────────────────────────────────────────────┤
│  框架         │ React Native 0.76+                      │
│  路由         │ Expo Router (基於檔案的路由)             │
│  狀態管理     │ Zustand 4.5 ✓ (可完全重用)              │
│  伺服器狀態   │ TanStack Query 5.x ✓ (可完全重用)       │
│  表單         │ React Hook Form + Zod ✓ (可完全重用)    │
│  樣式         │ NativeWind (Tailwind for RN)            │
│  UI 組件      │ Tamagui 或 React Native Paper           │
│  動畫         │ React Native Reanimated                  │
│  地圖         │ react-native-maps                       │
│  影片播放     │ expo-av 或 react-native-youtube-iframe  │
│  圖片處理     │ expo-image                              │
│  安全存儲     │ expo-secure-store (Token 存儲)          │
│  推播通知     │ expo-notifications                      │
└─────────────────────────────────────────────────────────┘
```

### 開發工具

```bash
# 套件管理
pnpm (與 Web 專案一致)

# 型別檢查
TypeScript 5.x

# 程式碼品質
ESLint + Prettier (共用 Web 配置)

# 測試
Jest + React Native Testing Library

# CI/CD
EAS Build + GitHub Actions
```

---

## 專案結構

### Monorepo 架構 (推薦)

將 React Native 專案加入現有專案，建立 monorepo 結構：

```
nobodyclimb/
├── packages/
│   ├── shared/                    # 共享程式碼
│   │   ├── api/                   # API 客戶端 (從 web 重構)
│   │   │   ├── client.ts          # 平台無關的 API 客戶端
│   │   │   ├── endpoints.ts       # 端點定義
│   │   │   └── services.ts        # 服務層
│   │   ├── types/                 # TypeScript 類型定義
│   │   │   └── index.ts           # 從 web/src/lib/types.ts 遷移
│   │   ├── store/                 # Zustand stores
│   │   │   ├── authStore.ts
│   │   │   ├── contentStore.ts
│   │   │   └── uiStore.ts
│   │   ├── hooks/                 # 平台無關的 hooks
│   │   │   ├── useDebounce.ts
│   │   │   └── ...
│   │   └── utils/                 # 工具函數
│   │
│   ├── web/                       # 現有 Next.js 應用程式
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   └── lib/              # 引用 @nobodyclimb/shared
│   │   └── package.json
│   │
│   └── mobile/                    # React Native 應用程式
│       ├── app/                   # Expo Router 頁面
│       │   ├── (tabs)/           # Tab 導航
│       │   │   ├── index.tsx     # 首頁
│       │   │   ├── explore.tsx   # 探索
│       │   │   ├── videos.tsx    # 影片
│       │   │   └── profile.tsx   # 個人檔案
│       │   ├── (auth)/           # 認證流程
│       │   │   ├── login.tsx
│       │   │   ├── register.tsx
│       │   │   └── profile-setup/
│       │   ├── biography/        # 人物誌
│       │   │   ├── index.tsx     # 列表
│       │   │   └── [slug].tsx    # 詳情
│       │   ├── crag/             # 岩場
│       │   ├── gym/              # 攀岩館
│       │   ├── bucket-list/      # 人生清單
│       │   └── _layout.tsx       # 根佈局
│       ├── components/            # RN 專用組件
│       │   ├── ui/               # 基礎 UI 組件
│       │   ├── biography/        # 人物誌組件
│       │   ├── crag/             # 岩場組件
│       │   └── shared/           # 共享組件
│       ├── lib/                   # RN 專用邏輯
│       │   ├── hooks/            # RN 專用 hooks
│       │   └── utils/            # RN 專用工具
│       ├── assets/               # 靜態資源
│       ├── app.config.ts         # Expo 配置
│       └── package.json
│
├── pnpm-workspace.yaml
├── package.json
└── turbo.json                     # Turborepo 配置 (可選)
```

### 獨立專案架構 (備選)

如果不想建立 monorepo，可以建立獨立專案：

```
nobodyclimb-mobile/
├── app/                           # Expo Router 頁面
│   ├── (tabs)/
│   ├── (auth)/
│   ├── biography/
│   ├── crag/
│   └── _layout.tsx
├── src/
│   ├── api/                       # 複製並調整 API 層
│   ├── components/
│   ├── hooks/
│   ├── store/                     # 複製 Zustand stores
│   ├── types/                     # 複製類型定義
│   └── utils/
├── assets/
├── app.config.ts
└── package.json
```

---

## 可重用程式碼分析

### 100% 可重用 (直接複製或共享)

| 模組 | 來源路徑 | 說明 |
|------|----------|------|
| **TypeScript 類型** | `src/lib/types.ts` | 1250+ 行類型定義，完全平台無關 |
| **API 端點定義** | `src/lib/api/endpoints.ts` | URL 和路徑常數 |
| **API 服務層** | `src/lib/api/services.ts` | 18 個服務模組，僅需調整 client |
| **Zustand Stores** | `src/store/` | 移除 `useRouter` 依賴即可 |
| **Zod Schema** | 散落各處 | 表單驗證邏輯 |
| **常數定義** | `src/lib/constants/` | 配置常數 |

### 需要調整的程式碼

| 模組 | 調整內容 |
|------|----------|
| **API 客戶端** | Token 存儲改用 `expo-secure-store` |
| **authStore** | 移除 cookie 邏輯，改用 SecureStore |
| **useDebounce** | 可直接重用 |
| **useInfiniteScroll** | 改用 FlatList 的 `onEndReached` |

### 需要重新開發

| 模組 | 說明 |
|------|------|
| **所有 UI 組件** | Web 使用 Radix UI，需改用 RN 組件庫 |
| **樣式系統** | Tailwind → NativeWind 或 StyleSheet |
| **導航系統** | Next.js Router → Expo Router |
| **媒體查詢 hooks** | `useMediaQuery`, `useIsMobile` 需重寫或移除 |
| **滾動相關** | `useScrollProgress` 需調整 |
| **富文本編輯** | react-quill → RN 富文本方案 |

---

## 功能模組規劃

### Phase 1: 核心功能 (MVP)

#### 1. 認證模組
```
功能:
- 電子郵件登入/註冊
- Google OAuth 登入
- Token 自動刷新
- 個人資料設定流程

重用:
- authStore.ts (調整存儲方式)
- authService (100%)
- 登入/註冊表單驗證邏輯
```

#### 2. 人物誌模組
```
功能:
- 人物誌列表 (無限滾動)
- 人物誌詳情頁
- 故事瀏覽
- 追蹤/按讚互動

重用:
- biographyService (100%)
- 所有人物誌相關類型
- useBiographyStats hook

新開發:
- BiographyCard 組件
- BiographyDetailScreen
- StoryViewer 組件
```

#### 3. 岩場/攀岩館模組
```
功能:
- 地點列表
- 地圖視圖
- 詳情頁面
- 路線資訊

重用:
- cragService, gymService (100%)
- 相關類型定義

新開發:
- MapView 整合 (react-native-maps)
- 路線列表組件
```

#### 4. 個人檔案模組
```
功能:
- 個人資料顯示/編輯
- 我的文章、照片、收藏
- 設定頁面

重用:
- profileService (100%)
- userService (100%)
```

### Phase 2: 進階功能

#### 5. 人生清單
```
功能:
- 清單瀏覽與管理
- 進度追蹤
- 完成故事記錄

重用:
- bucketListService (100%)
```

#### 6. 影片瀏覽
```
功能:
- YouTube 影片列表
- 影片播放 (WebView 或 iframe)
- 分類篩選

新開發:
- 使用 react-native-youtube-iframe
```

#### 7. 推播通知
```
功能:
- 追蹤者動態通知
- 按讚/評論通知
- 系統公告

新開發:
- expo-notifications 整合
- 後端推播 API
```

### Phase 3: 優化與特色功能

#### 8. 離線支援
```
功能:
- 已瀏覽內容快取
- 離線模式提示

技術:
- TanStack Query 持久化
- AsyncStorage
```

#### 9. 相機整合
```
功能:
- 拍照上傳
- 相簿選擇

技術:
- expo-image-picker
- expo-camera
```

---

## 開發路線圖

### 階段 1: 專案初始化
```
任務:
□ 建立 Expo 專案 (expo init)
□ 設定 TypeScript
□ 配置 ESLint/Prettier
□ 設定 NativeWind
□ 選擇並配置 UI 組件庫
□ 建立基本導航結構
□ 設定 Zustand
□ 複製並調整 API 層
□ 配置環境變數
```

### 階段 2: 認證系統
```
任務:
□ 實作登入頁面
□ 實作註冊頁面
□ 實作 Google OAuth
□ Token 存儲 (SecureStore)
□ 自動登入檢查
□ 個人資料設定流程
□ 認證狀態管理
```

### 階段 3: 核心功能
```
任務:
□ 首頁 Tab 導航
□ 人物誌列表頁
□ 人物誌詳情頁
□ 岩場列表與地圖
□ 攀岩館列表
□ 個人檔案頁面
□ 基本搜尋功能
```

### 階段 4: 互動功能
```
任務:
□ 追蹤/取消追蹤
□ 按讚功能
□ 評論系統
□ 人生清單管理
□ 收藏功能
```

### 階段 5: 媒體與優化
```
任務:
□ YouTube 影片播放
□ 圖片查看器
□ 相機/相簿整合
□ 效能優化
□ 動畫效果
```

### 階段 6: 發布準備
```
任務:
□ App Store 資料準備
□ Google Play 資料準備
□ 隱私權政策
□ 使用條款
□ EAS Build 配置
□ 版本管理
□ Beta 測試
□ 正式發布
```

---

## 關鍵決策點

### 1. Monorepo vs 獨立專案

**推薦: Monorepo**

優點:
- 共享程式碼更方便
- 類型定義同步
- 統一的 lint/format 配置
- 原子化提交 (web + mobile 一起更新)

實作:
```bash
# 使用 pnpm workspace
pnpm init
# pnpm-workspace.yaml
packages:
  - 'packages/*'
```

### 2. UI 組件庫選擇

| 選項 | 優點 | 缺點 |
|------|------|------|
| **Tamagui** (推薦) | 高效能、類 Tailwind 語法、Web 支援 | 學習曲線 |
| React Native Paper | Material Design、文檔完整 | 風格固定 |
| Gluestack UI | 現代化、可自訂 | 較新、社群較小 |
| 自建組件 | 完全控制 | 開發時間長 |

**推薦: Tamagui** - 因為語法接近 Tailwind，與現有 Web 開發體驗一致。

### 3. 樣式方案

| 選項 | 說明 |
|------|------|
| **NativeWind** (推薦) | Tailwind CSS for RN，與 Web 語法一致 |
| StyleSheet | 原生方案，效能最佳 |
| Styled Components | 熟悉 CSS-in-JS 開發者 |

**推薦: NativeWind** - 可以重用部分 Tailwind class 命名邏輯。

### 4. 導航架構

```
App Structure:
├── (tabs)                    # 底部 Tab 導航
│   ├── index (首頁)
│   ├── explore (探索)
│   ├── videos (影片)
│   └── profile (我的)
├── (auth)                    # 認證流程 (Stack)
│   ├── login
│   ├── register
│   └── profile-setup/*
├── biography/[slug]          # 詳情頁 (Modal or Stack)
├── crag/[id]
├── gym/[id]
└── settings/*                # 設定頁面 (Stack)
```

### 5. 圖片處理策略

- 使用 `expo-image` (基於 SDWebImage/Glide)
- 支援漸進式載入
- 自動記憶體管理
- CDN 圖片需配置 `contentFit`

```tsx
import { Image } from 'expo-image';

<Image
  source={{ uri: imageUrl }}
  contentFit="cover"
  placeholder={blurhash}
  transition={200}
/>
```

### 6. 離線策略

```
優先級:
1. 先實作基本功能 (online-only)
2. 加入 TanStack Query 快取
3. 再考慮完整離線支援

技術:
- @tanstack/query-async-storage-persister
- expo-sqlite (如需本地資料庫)
```

---

## 初始化指令

### 建立 Expo 專案

```bash
# 在專案根目錄建立 mobile 資料夾
cd nobodyclimb-fe
mkdir -p packages/mobile
cd packages/mobile

# 使用 Expo 官方模板
npx create-expo-app@latest . --template tabs

# 安裝核心依賴
pnpm add zustand @tanstack/react-query zod react-hook-form
pnpm add axios expo-secure-store

# 安裝 UI 相關
pnpm add nativewind tailwindcss
pnpm add @tamagui/core @tamagui/config

# 安裝功能依賴
pnpm add react-native-maps expo-image expo-av
pnpm add react-native-youtube-iframe

# 開發依賴
pnpm add -D @types/react typescript
```

### 配置 NativeWind

```js
// tailwind.config.js
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

---

## 附錄

### API 客戶端調整範例

```typescript
// mobile/src/api/client.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// 請求攔截器 - 使用 SecureStore
apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 響應攔截器 - Token 刷新
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token 刷新邏輯
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      if (refreshToken) {
        // 刷新 token...
      }
    }
    return Promise.reject(error);
  }
);
```

### authStore 調整範例

```typescript
// mobile/src/store/authStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// SecureStore wrapper for sensitive data
const secureStorage = {
  getItem: async (key: string) => {
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    await SecureStore.deleteItemAsync(key);
  },
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // ... 現有邏輯，移除 cookie 和 useRouter
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Token 單獨存儲到 SecureStore
    }
  )
);
```

---

## 總結

NobodyClimb 的架構非常適合移植到 React Native：

1. **API 層完全可重用** - 類型定義、服務層、端點定義
2. **狀態管理可重用** - Zustand 完全支援 RN
3. **業務邏輯可重用** - 表單驗證、hooks 大多可移植
4. **UI 需重新開發** - 這是主要工作量

建議優先順序：
1. 先建立 monorepo 結構
2. 抽取共享程式碼到 `packages/shared`
3. 建立 React Native 專案骨架
4. 逐步實作各功能模組

預估總開發時間取決於團隊規模和經驗，核心功能 (Phase 1-3) 是主要工作量。
