# NobodyClimb React Native 應用程式開發規劃

## 目錄
1. [專案概述](#專案概述)
2. [技術選型](#技術選型)
3. [專案結構](#專案結構)
4. [可重用程式碼分析](#可重用程式碼分析)
5. [功能模組規劃](#功能模組規劃)
6. [安全性規劃](#安全性規劃)
7. [監控與分析](#監控與分析)
8. [後端配合項目](#後端配合項目)
9. [測試策略](#測試策略)
10. [國際化與無障礙](#國際化與無障礙)
11. [開發路線圖](#開發路線圖)
12. [關鍵決策點](#關鍵決策點)
13. [附錄](#附錄)

---

## 專案概述

### 目標
將 NobodyClimb 攀岩社群平台從 Next.js Web 應用程式擴展為 iOS 和 Android 原生應用程式。

### 核心功能 (MVP)
- 用戶認證 (登入/註冊/Google OAuth/Apple Sign In)
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
│  路由         │ Expo Router v4                          │
│  狀態管理     │ Zustand 4.5 ✓ (可完全重用)              │
│  伺服器狀態   │ TanStack Query 5.x ✓ (可完全重用)       │
│  表單         │ React Hook Form + Zod ✓ (可完全重用)    │
│  樣式         │ NativeWind v4 (Tailwind for RN)         │
│  動畫         │ React Native Reanimated 3               │
│  地圖         │ react-native-maps                       │
│  影片播放     │ react-native-youtube-iframe             │
│  圖片處理     │ expo-image                              │
│  安全存儲     │ expo-secure-store (Token 存儲)          │
│  推播通知     │ expo-notifications                      │
│  生物識別     │ expo-local-authentication               │
│  深層連結     │ expo-linking + expo-router              │
└─────────────────────────────────────────────────────────┘
```

### 樣式方案選擇

> **重要**: 選擇 **NativeWind v4** 作為唯一樣式方案

| 選項 | 決定 | 原因 |
|------|------|------|
| **NativeWind v4** | ✅ 採用 | 與 Web Tailwind 語法一致，學習成本低 |
| Tamagui | ❌ 不採用 | 與 NativeWind 功能重疊，增加複雜度 |
| StyleSheet | 部分使用 | 效能關鍵處使用原生 StyleSheet |

### 開發工具

```bash
# 套件管理
pnpm (與 Web 專案一致)

# 型別檢查
TypeScript 5.x

# 程式碼品質
ESLint + Prettier (共用 Web 配置)
Biome (可選，更快的替代方案)

# 測試
Jest + React Native Testing Library (單元/組件測試)
Maestro (E2E 測試，推薦)

# CI/CD
EAS Build + GitHub Actions

# 監控
Sentry (錯誤追蹤)
Firebase Analytics (使用分析)
```

---

## 專案結構

### 推薦: 獨立專案架構

> **說明**: 考量到現有專案不是 monorepo，遷移成本高，建議先以獨立專案開始。
> 待 Mobile App 成熟後，再評估是否遷移至 monorepo。

```
nobodyclimb-mobile/
├── app/                           # Expo Router 頁面
│   ├── (tabs)/                   # 底部 Tab 導航
│   │   ├── _layout.tsx
│   │   ├── index.tsx             # 首頁
│   │   ├── explore.tsx           # 探索
│   │   ├── videos.tsx            # 影片
│   │   └── profile.tsx           # 個人檔案
│   ├── (auth)/                   # 認證流程 (未登入)
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   ├── (onboarding)/             # 新用戶引導
│   │   ├── _layout.tsx
│   │   ├── welcome.tsx
│   │   └── profile-setup/
│   │       ├── basic-info.tsx
│   │       ├── interests.tsx
│   │       └── complete.tsx
│   ├── biography/
│   │   ├── index.tsx             # 人物誌列表
│   │   └── [slug].tsx            # 人物誌詳情
│   ├── crag/
│   │   ├── index.tsx             # 岩場列表
│   │   ├── [id]/
│   │   │   ├── index.tsx         # 岩場詳情
│   │   │   └── route/[routeId].tsx
│   │   └── map.tsx               # 岩場地圖
│   ├── gym/
│   │   ├── index.tsx
│   │   └── [id].tsx
│   ├── bucket-list/
│   │   ├── index.tsx
│   │   └── [id].tsx
│   ├── settings/
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── account.tsx
│   │   ├── notifications.tsx
│   │   ├── privacy.tsx
│   │   └── about.tsx
│   ├── _layout.tsx               # 根佈局
│   └── +not-found.tsx            # 404 頁面
│
├── src/
│   ├── api/                       # API 層 (從 Web 複製調整)
│   │   ├── client.ts             # Axios + SecureStore
│   │   ├── endpoints.ts          # 端點定義 (100% 複製)
│   │   └── services/             # 服務層 (100% 複製)
│   │       ├── auth.ts
│   │       ├── biography.ts
│   │       ├── crag.ts
│   │       └── ...
│   │
│   ├── components/
│   │   ├── ui/                   # 基礎 UI 組件
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── BottomSheet.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   └── ...
│   │   ├── forms/                # 表單組件
│   │   │   ├── FormField.tsx
│   │   │   ├── FormSelect.tsx
│   │   │   └── ...
│   │   ├── biography/            # 人物誌組件
│   │   ├── crag/                 # 岩場組件
│   │   ├── gym/                  # 攀岩館組件
│   │   └── shared/               # 共享組件
│   │       ├── Header.tsx
│   │       ├── TabBar.tsx
│   │       ├── EmptyState.tsx
│   │       ├── ErrorBoundary.tsx
│   │       └── ...
│   │
│   ├── hooks/                     # 自訂 Hooks
│   │   ├── useAuth.ts            # 認證 hook
│   │   ├── useBiometrics.ts      # 生物識別
│   │   ├── useDebounce.ts        # (複製)
│   │   ├── useRefreshOnFocus.ts  # 頁面聚焦刷新
│   │   └── ...
│   │
│   ├── store/                     # Zustand Stores (從 Web 調整)
│   │   ├── authStore.ts
│   │   ├── contentStore.ts
│   │   └── uiStore.ts
│   │
│   ├── types/                     # TypeScript 類型 (100% 複製)
│   │   └── index.ts
│   │
│   ├── utils/                     # 工具函數
│   │   ├── storage.ts            # SecureStore 封裝
│   │   ├── analytics.ts          # 分析工具封裝
│   │   ├── linking.ts            # Deep Link 處理
│   │   └── ...
│   │
│   ├── constants/                 # 常數
│   │   ├── config.ts             # App 配置
│   │   ├── theme.ts              # 主題常數
│   │   └── routes.ts             # 路由常數
│   │
│   └── i18n/                      # 國際化
│       ├── index.ts
│       ├── zh-TW.json
│       └── en.json
│
├── assets/                        # 靜態資源
│   ├── images/
│   ├── fonts/
│   └── animations/               # Lottie 動畫
│
├── __tests__/                     # 測試檔案
│   ├── components/
│   ├── hooks/
│   └── e2e/                      # Maestro E2E 測試
│
├── .maestro/                      # Maestro 測試流程
│   ├── login.yaml
│   ├── browse-biography.yaml
│   └── ...
│
├── app.config.ts                  # Expo 配置
├── babel.config.js
├── metro.config.js
├── tailwind.config.js             # NativeWind 配置
├── tsconfig.json
├── eas.json                       # EAS Build 配置
├── sentry.properties              # Sentry 配置
└── package.json
```

### 未來 Monorepo 架構 (Phase 2)

當 Mobile App 穩定後，可考慮遷移至 monorepo：

```
nobodyclimb/
├── apps/
│   ├── web/                       # Next.js (現有)
│   └── mobile/                    # Expo (新增)
├── packages/
│   ├── shared/                    # 共享程式碼
│   │   ├── api/
│   │   ├── types/
│   │   ├── store/
│   │   └── utils/
│   ├── ui-web/                    # Web UI 組件
│   └── ui-mobile/                 # Mobile UI 組件
├── pnpm-workspace.yaml
└── turbo.json
```

---

## 可重用程式碼分析

### 100% 可重用 (直接複製)

| 模組 | 來源路徑 | 說明 |
|------|----------|------|
| **TypeScript 類型** | `src/lib/types.ts` | 1250+ 行類型定義 |
| **API 端點定義** | `src/lib/api/endpoints.ts` | URL 和路徑常數 |
| **API 服務層** | `src/lib/api/services.ts` | 18 個服務模組 |
| **Zod Schema** | 各功能模組 | 表單驗證邏輯 |
| **常數定義** | `src/lib/constants/` | 配置常數 |

### 需要調整的程式碼

| 模組 | 原始 | 調整內容 |
|------|------|----------|
| **API 客戶端** | `src/lib/api/client.ts` | Cookie → SecureStore |
| **authStore** | `src/store/authStore.ts` | 移除 cookie/useRouter，改用 SecureStore |
| **contentStore** | `src/store/contentStore.ts` | 移除 Next.js 相關 |
| **useDebounce** | `src/lib/hooks/` | 可直接重用 |
| **useInfiniteScroll** | `src/lib/hooks/` | 改用 FlatList onEndReached |

### 需要重新開發

| 模組 | 說明 |
|------|------|
| **所有 UI 組件** | Radix UI → React Native 組件 |
| **導航系統** | Next.js Router → Expo Router |
| **媒體查詢 hooks** | 移除或改用 useWindowDimensions |
| **滾動相關** | useScrollProgress 需重寫 |
| **富文本編輯** | react-quill → 待評估 RN 方案 |

---

## 功能模組規劃

### Phase 1: 核心功能 (MVP)

#### 1. 認證模組

```
功能:
├── 電子郵件登入/註冊
├── Google OAuth 登入
├── Apple Sign In (iOS 必要)      ← 新增
├── 生物識別快速登入              ← 新增
│   ├── Face ID (iOS)
│   └── 指紋辨識 (Android)
├── Token 自動刷新
├── 個人資料設定流程
└── 登出 (清除本地資料)

重用:
- authService (100%)
- 登入/註冊表單驗證邏輯

新開發:
- Apple Sign In 整合 (expo-apple-authentication)
- 生物識別整合 (expo-local-authentication)
- SecureStore Token 管理
```

**Apple Sign In 實作要點**:
```typescript
// 必須條件：iOS 上有第三方登入就必須提供 Apple Sign In
import * as AppleAuthentication from 'expo-apple-authentication';

// 檢查是否支援
const isAvailable = await AppleAuthentication.isAvailableAsync();

// 登入流程
const credential = await AppleAuthentication.signInAsync({
  requestedScopes: [
    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
    AppleAuthentication.AppleAuthenticationScope.EMAIL,
  ],
});
// 將 credential.identityToken 發送給後端驗證
```

**生物識別實作要點**:
```typescript
import * as LocalAuthentication from 'expo-local-authentication';

// 檢查支援類型
const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

// 執行認證
const result = await LocalAuthentication.authenticateAsync({
  promptMessage: '使用生物識別登入',
  fallbackLabel: '使用密碼',
  disableDeviceFallback: false,
});
```

#### 2. 人物誌模組

```
功能:
├── 人物誌列表 (無限滾動)
├── 人物誌詳情頁
├── 故事瀏覽
├── 追蹤/按讚互動
└── 分享功能

重用:
- biographyService (100%)
- 所有人物誌相關類型
- useBiographyStats hook

新開發:
- BiographyCard 組件
- BiographyDetailScreen
- StoryViewer 組件
- 分享 Sheet (expo-sharing)
```

#### 3. 岩場/攀岩館模組

```
功能:
├── 地點列表
├── 地圖視圖 (react-native-maps)
├── 詳情頁面
├── 路線資訊
├── 天氣資訊
└── 導航整合 (開啟 Google Maps/Apple Maps)

重用:
- cragService, gymService (100%)
- 相關類型定義

新開發:
- MapView 整合
- 路線列表組件 (FlashList 優化)
- 導航按鈕 (Linking.openURL)
```

#### 4. 個人檔案模組

```
功能:
├── 個人資料顯示/編輯
├── 大頭照更新 (相機/相簿)
├── 我的文章、照片、收藏
└── 設定頁面

重用:
- profileService (100%)
- userService (100%)

新開發:
- expo-image-picker 整合
- 設定頁面 UI
```

### Phase 2: 進階功能

#### 5. 人生清單

```
功能:
├── 清單瀏覽與管理
├── 進度追蹤
└── 完成故事記錄

重用:
- bucketListService (100%)
```

#### 6. 影片瀏覽

```
功能:
├── YouTube 影片列表
├── 影片播放 (react-native-youtube-iframe)
└── 分類篩選

新開發:
- 影片列表優化 (預覽圖快取)
- 全螢幕播放
```

#### 7. 推播通知

```
功能:
├── 追蹤者動態通知
├── 按讚/評論通知
├── 系統公告
└── 通知偏好設定

新開發:
- expo-notifications 整合
- 通知權限請求流程
- 通知中心 UI

後端配合:
- 推播 Token 管理 API
- 通知發送服務
```

#### 8. 深層連結 (Deep Linking)

```
功能:
├── 通用連結 (Universal Links / App Links)
├── 自訂 URL Scheme
└── 分享連結自動開啟 App

URL 結構:
- nobodyclimb://biography/{slug}
- nobodyclimb://crag/{id}
- nobodyclimb://gym/{id}
- https://nobodyclimb.cc/biography/{slug} (通用連結)

配置:
- iOS: apple-app-site-association
- Android: assetlinks.json
```

### Phase 3: 優化與特色功能

#### 9. 離線支援

```
功能:
├── 已瀏覽內容快取
├── 離線模式提示
└── 網路恢復自動同步

技術:
- TanStack Query 持久化
- @tanstack/query-async-storage-persister
- NetInfo 監測網路狀態
```

#### 10. 相機整合

```
功能:
├── 拍照上傳
├── 相簿選擇
└── 圖片裁切/壓縮

技術:
- expo-image-picker
- expo-image-manipulator (裁切/壓縮)
```

---

## 安全性規劃

### Token 存儲

```typescript
// ✅ 正確：使用 SecureStore 存儲敏感資料
import * as SecureStore from 'expo-secure-store';

await SecureStore.setItemAsync('accessToken', token);
await SecureStore.setItemAsync('refreshToken', refreshToken);

// ❌ 錯誤：不要用 AsyncStorage 存 Token
// AsyncStorage 是明文存儲
```

### 憑證固定 (Certificate Pinning)

```typescript
// 使用 expo-certificate-transparency 或自訂方案
// 防止中間人攻擊

// 配置允許的憑證
const ALLOWED_CERTIFICATES = [
  'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
];
```

### 敏感資料處理

```
原則:
├── Token 存於 SecureStore
├── 用戶個人資料存於 AsyncStorage (加密可選)
├── 不要在 Log 中記錄敏感資料
├── Release 版本移除所有 console.log
└── 啟用 ProGuard (Android) 混淆
```

### 越獄/Root 檢測 (可選)

```typescript
// 使用 jail-monkey 或類似套件
import JailMonkey from 'jail-monkey';

if (JailMonkey.isJailBroken()) {
  // 顯示警告或限制功能
}
```

### API 安全

```
措施:
├── 所有 API 使用 HTTPS
├── JWT Token 有效期控制 (建議 15 分鐘)
├── Refresh Token 較長有效期 (建議 7 天)
├── 登出時後端廢止 Refresh Token
└── 裝置綁定 (可選)
```

---

## 監控與分析

### 錯誤追蹤: Sentry

```typescript
// app.config.ts
export default {
  plugins: [
    [
      '@sentry/react-native/expo',
      {
        organization: 'nobodyclimb',
        project: 'mobile',
      },
    ],
  ],
};

// App 初始化
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: __DEV__ ? 'development' : 'production',
  tracesSampleRate: 0.2,
});
```

### 使用分析: Firebase Analytics

```typescript
import analytics from '@react-native-firebase/analytics';

// 追蹤畫面瀏覽
await analytics().logScreenView({
  screen_name: 'Biography Detail',
  screen_class: 'BiographyDetailScreen',
});

// 追蹤自訂事件
await analytics().logEvent('follow_user', {
  user_id: userId,
  source: 'biography_page',
});
```

### 效能監控

```typescript
// Firebase Performance (可選)
import perf from '@react-native-firebase/perf';

// 或使用 Sentry Performance
Sentry.startTransaction({
  name: 'Load Biography List',
  op: 'navigation',
});
```

### 關鍵指標

```
追蹤指標:
├── App 啟動時間
├── 畫面載入時間
├── API 回應時間
├── 錯誤率
├── 當機率 (Crash-free rate)
├── 日活躍用戶 (DAU)
└── 功能使用率
```

---

## 後端配合項目

### 必要新增 API

#### 1. 裝置管理

```typescript
// POST /api/v1/devices/register
interface RegisterDeviceRequest {
  deviceId: string;          // 唯一裝置識別碼
  platform: 'ios' | 'android';
  pushToken?: string;        // 推播 Token
  appVersion: string;
  osVersion: string;
}

// DELETE /api/v1/devices/:deviceId
// 登出時取消註冊
```

#### 2. 推播通知

```typescript
// PUT /api/v1/devices/:deviceId/push-token
interface UpdatePushTokenRequest {
  pushToken: string;
}

// GET /api/v1/users/me/notification-settings
// PUT /api/v1/users/me/notification-settings
interface NotificationSettings {
  followNotifications: boolean;
  likeNotifications: boolean;
  commentNotifications: boolean;
  systemNotifications: boolean;
}
```

#### 3. 版本檢查

```typescript
// GET /api/v1/app/version-check?platform=ios&version=1.0.0
interface VersionCheckResponse {
  updateRequired: boolean;   // 強制更新
  updateAvailable: boolean;  // 有新版本
  latestVersion: string;
  releaseNotes?: string;
  storeUrl: string;          // App Store / Play Store 連結
}
```

#### 4. Apple Sign In 驗證

```typescript
// POST /api/v1/auth/apple
interface AppleSignInRequest {
  identityToken: string;     // Apple 返回的 JWT
  authorizationCode: string;
  user?: string;             // 首次登入時的用戶 ID
  fullName?: {
    givenName: string;
    familyName: string;
  };
  email?: string;
}
```

### 後端調整項目

```
調整項目:
├── JWT 增加 device_id claim (可選，用於單裝置登入)
├── 推播通知發送服務 (APNs + FCM)
├── Apple Sign In 驗證邏輯
├── 通用連結 apple-app-site-association 檔案
└── Android App Links assetlinks.json 檔案
```

---

## 測試策略

### 單元測試 (Jest)

```typescript
// __tests__/hooks/useAuth.test.ts
import { renderHook, act } from '@testing-library/react-native';
import { useAuthStore } from '@/store/authStore';

describe('useAuthStore', () => {
  it('should login successfully', async () => {
    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      await result.current.login({
        email: 'test@example.com',
        password: 'password',
      });
    });

    expect(result.current.isAuthenticated).toBe(true);
  });
});
```

### 組件測試 (React Native Testing Library)

```typescript
// __tests__/components/BiographyCard.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import BiographyCard from '@/components/biography/BiographyCard';

describe('BiographyCard', () => {
  it('should render biography info', () => {
    const { getByText } = render(
      <BiographyCard biography={mockBiography} />
    );

    expect(getByText(mockBiography.name)).toBeTruthy();
  });
});
```

### E2E 測試 (Maestro) - 推薦

```yaml
# .maestro/login.yaml
appId: cc.nobodyclimb.app
---
- launchApp
- tapOn: "登入"
- tapOn:
    id: "email-input"
- inputText: "test@example.com"
- tapOn:
    id: "password-input"
- inputText: "password123"
- tapOn: "登入"
- assertVisible: "首頁"
```

```yaml
# .maestro/browse-biography.yaml
appId: cc.nobodyclimb.app
---
- launchApp
- tapOn: "探索"
- scrollUntilVisible:
    element: "人物誌"
- tapOn: "人物誌"
- assertVisible: "人物誌列表"
- tapOn:
    index: 0
- assertVisible: "追蹤"
```

### 測試覆蓋率目標

```
目標:
├── 單元測試: 70%+ (hooks, utils, store)
├── 組件測試: 50%+ (核心組件)
└── E2E 測試: 關鍵用戶流程 100%
    ├── 登入/註冊
    ├── 瀏覽人物誌
    ├── 追蹤/按讚
    └── 個人資料編輯
```

---

## 國際化與無障礙

### 國際化 (i18n)

```typescript
// src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import zhTW from './zh-TW.json';
import en from './en.json';

i18n.use(initReactI18next).init({
  resources: {
    'zh-TW': { translation: zhTW },
    en: { translation: en },
  },
  lng: Localization.locale,
  fallbackLng: 'zh-TW',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
```

```json
// src/i18n/zh-TW.json
{
  "common": {
    "login": "登入",
    "register": "註冊",
    "logout": "登出",
    "follow": "追蹤",
    "unfollow": "取消追蹤"
  },
  "biography": {
    "title": "人物誌",
    "stories": "故事",
    "followers": "追蹤者"
  }
}
```

### 無障礙功能 (Accessibility)

```typescript
// 所有互動元素都要有 accessibilityLabel
<TouchableOpacity
  accessibilityLabel="追蹤此用戶"
  accessibilityRole="button"
  accessibilityState={{ selected: isFollowing }}
  onPress={handleFollow}
>
  <Text>{isFollowing ? '追蹤中' : '追蹤'}</Text>
</TouchableOpacity>

// 圖片需要描述
<Image
  source={{ uri: avatar }}
  accessibilityLabel={`${userName} 的大頭照`}
/>

// 標題層級
<Text accessibilityRole="header" accessibilityLevel={1}>
  人物誌
</Text>
```

### 無障礙檢查清單

```
必要項目:
├── 所有按鈕/連結有 accessibilityLabel
├── 圖片有替代文字
├── 表單欄位有標籤
├── 顏色對比度符合 WCAG AA (4.5:1)
├── 支援動態字體大小
├── 支援減少動態效果 (Reduce Motion)
└── VoiceOver/TalkBack 測試通過
```

---

## 開發路線圖

### 階段 1: 專案初始化

```
任務:
□ 建立 Expo 專案 (npx create-expo-app)
□ 設定 TypeScript
□ 配置 ESLint/Prettier
□ 設定 NativeWind v4
□ 建立基本導航結構 (Expo Router)
□ 複製並調整 API 層
  □ 複製 types.ts
  □ 複製 endpoints.ts
  □ 複製 services.ts
  □ 調整 client.ts (SecureStore)
□ 設定 Zustand stores
□ 配置環境變數
□ 設定 Sentry
□ 設定 Firebase Analytics
□ 配置 EAS Build
```

### 階段 2: 認證系統

```
任務:
□ 實作登入頁面
□ 實作註冊頁面
□ 實作 Google OAuth
□ 實作 Apple Sign In (iOS)
□ Token 存儲 (SecureStore)
□ 自動登入檢查
□ 生物識別快速登入
□ 個人資料設定流程
□ 認證狀態管理
□ 登出功能
```

### 階段 3: 核心功能

```
任務:
□ 首頁 Tab 導航
□ 人物誌列表頁 (無限滾動)
□ 人物誌詳情頁
□ 岩場列表
□ 岩場地圖視圖
□ 岩場詳情頁
□ 攀岩館列表
□ 攀岩館詳情頁
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
□ 分享功能
```

### 階段 5: 媒體與通知

```
任務:
□ YouTube 影片播放
□ 圖片查看器 (手勢縮放)
□ 相機/相簿整合
□ 推播通知整合
□ 通知中心 UI
□ 通知設定頁面

後端配合:
□ 裝置註冊 API
□ 推播 Token 管理 API
□ 通知發送服務
```

### 階段 6: 深層連結與優化

```
任務:
□ Deep Linking 配置
□ Universal Links (iOS)
□ App Links (Android)
□ 效能優化
  □ 列表虛擬化 (FlashList)
  □ 圖片快取優化
  □ 減少重新渲染
□ 動畫效果
□ 離線快取支援
```

### 階段 7: 測試與品質

```
任務:
□ 單元測試
□ 組件測試
□ E2E 測試 (Maestro)
□ 無障礙測試
□ 效能測試
□ 安全性檢查
```

### 階段 8: 發布準備

```
任務:
□ App Icon 和 Splash Screen
□ App Store 資料準備
  □ 截圖 (6.5", 5.5")
  □ App 描述
  □ 關鍵字
  □ 隱私權政策 URL
□ Google Play 資料準備
  □ 截圖
  □ Feature Graphic
  □ App 描述
  □ 內容分級問卷
□ 版本檢查 API
□ OTA 更新策略配置
□ Beta 測試 (TestFlight / Internal Testing)
□ 正式發布
```

---

## 關鍵決策點

### 1. 專案架構

**決定: 獨立專案**

```
原因:
- 現有專案遷移 monorepo 成本高
- 獨立專案可快速開始
- 未來可遷移至 monorepo

執行:
- 建立 nobodyclimb-mobile 新 repo
- 手動複製共享程式碼
- 建立同步機制 (文件規範或腳本)
```

### 2. 樣式方案

**決定: NativeWind v4**

```
原因:
- 與 Web Tailwind 語法一致
- 團隊學習成本低
- 社群活躍，文檔完整

配置:
- 不使用 Tamagui (避免衝突)
- 效能關鍵處可用 StyleSheet
```

### 3. UI 組件策略

**決定: 自建組件 + 第三方輔助**

```
策略:
- 基礎組件自建 (Button, Input, Card)
- 複雜組件使用第三方
  - BottomSheet: @gorhom/bottom-sheet
  - Toast: react-native-toast-message
  - 日期選擇: react-native-modal-datetime-picker

優點:
- 完全控制外觀
- 減少依賴
- 與 NativeWind 整合更好
```

### 4. 導航架構

```
App Structure:
├── (tabs)/                    # 底部 Tab 導航 (已登入)
│   ├── index (首頁)
│   ├── explore (探索)
│   ├── videos (影片)
│   └── profile (我的)
├── (auth)/                    # 認證流程 (Stack)
│   ├── login
│   ├── register
│   └── forgot-password
├── (onboarding)/              # 新用戶引導 (Stack)
├── biography/[slug]           # 詳情頁 (Stack)
├── crag/[id]
├── gym/[id]
└── settings/                  # 設定 (Stack)
```

### 5. 更新策略

```
策略:
├── 一般更新: OTA (expo-updates)
│   - 小修復
│   - 內容更新
│   - 非原生變更
├── 重大更新: Store 發布
│   - 原生模組變更
│   - SDK 版本升級
│   - 重大功能
└── 強制更新: 版本檢查 API
    - 重大安全修復
    - 不相容的 API 變更

OTA 配置:
- 啟動時檢查更新
- 背景下載
- 下次啟動套用
```

### 6. 圖片處理

```typescript
// 使用 expo-image (效能優於 Image)
import { Image } from 'expo-image';

// Blurhash 佔位圖
const blurhash = 'LEHV6nWB2yk8pyo0adR*.7kCMdnj';

<Image
  source={{ uri: imageUrl }}
  placeholder={blurhash}
  contentFit="cover"
  transition={200}
  cachePolicy="memory-disk"  // 快取策略
/>
```

---

## 附錄

### A. 初始化指令

```bash
# 建立專案
npx create-expo-app nobodyclimb-mobile --template tabs
cd nobodyclimb-mobile

# 安裝核心依賴
pnpm add zustand @tanstack/react-query axios
pnpm add zod react-hook-form @hookform/resolvers
pnpm add expo-secure-store expo-local-authentication

# 安裝 NativeWind
pnpm add nativewind tailwindcss
pnpm add -D tailwindcss@3.3.2

# 安裝 UI 相關
pnpm add react-native-reanimated react-native-gesture-handler
pnpm add @gorhom/bottom-sheet react-native-toast-message
pnpm add expo-image expo-linear-gradient

# 安裝功能依賴
pnpm add react-native-maps react-native-youtube-iframe
pnpm add expo-notifications expo-linking

# 安裝監控
pnpm add @sentry/react-native
pnpm add @react-native-firebase/app @react-native-firebase/analytics

# 安裝 i18n
pnpm add i18next react-i18next expo-localization

# 開發依賴
pnpm add -D @types/react typescript
pnpm add -D @testing-library/react-native jest

# Apple Sign In (iOS)
pnpm add expo-apple-authentication
```

### B. NativeWind 配置

```js
// tailwind.config.js
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
      },
    },
  },
  plugins: [],
};
```

```js
// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
```

### C. API 客戶端調整

```typescript
// src/api/client.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.nobodyclimb.cc/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 請求攔截器
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await SecureStore.getItemAsync('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 響應攔截器
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        await SecureStore.setItemAsync('accessToken', accessToken);
        await SecureStore.setItemAsync('refreshToken', newRefreshToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        return apiClient(originalRequest);
      } catch (refreshError) {
        // 清除 Token 並導向登入頁
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
        router.replace('/(auth)/login');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

### D. authStore 調整

```typescript
// src/store/authStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { router } from 'expo-router';

import { User } from '@/types';
import { authService } from '@/api/services/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  biometricsEnabled: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  loginWithApple: (identityToken: string, authorizationCode: string) => Promise<void>;
  loginWithBiometrics: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  enableBiometrics: () => Promise<boolean>;
  disableBiometrics: () => Promise<void>;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
      biometricsEnabled: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login({ email, password });
          const { accessToken, refreshToken, user } = response.data;

          await SecureStore.setItemAsync('accessToken', accessToken);
          await SecureStore.setItemAsync('refreshToken', refreshToken);

          set({ user, isAuthenticated: true, isLoading: false });
          router.replace('/(tabs)');
        } catch (error: any) {
          set({
            error: error.response?.data?.message || '登入失敗',
            isLoading: false
          });
          throw error;
        }
      },

      loginWithApple: async (identityToken, authorizationCode) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.appleSignIn({
            identityToken,
            authorizationCode,
          });
          const { accessToken, refreshToken, user } = response.data;

          await SecureStore.setItemAsync('accessToken', accessToken);
          await SecureStore.setItemAsync('refreshToken', refreshToken);

          set({ user, isAuthenticated: true, isLoading: false });
          router.replace('/(tabs)');
        } catch (error: any) {
          set({
            error: error.response?.data?.message || 'Apple 登入失敗',
            isLoading: false
          });
          throw error;
        }
      },

      loginWithBiometrics: async () => {
        const { biometricsEnabled } = get();
        if (!biometricsEnabled) {
          throw new Error('生物識別未啟用');
        }

        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: '使用生物識別登入',
          fallbackLabel: '使用密碼',
        });

        if (!result.success) {
          throw new Error('生物識別驗證失敗');
        }

        // 驗證成功，檢查是否有有效 Token
        const accessToken = await SecureStore.getItemAsync('accessToken');
        if (accessToken) {
          // 驗證 Token 有效性
          try {
            const response = await authService.getProfile();
            set({ user: response.data, isAuthenticated: true });
            router.replace('/(tabs)');
          } catch {
            // Token 無效，需要重新登入
            throw new Error('請重新登入');
          }
        }
      },

      enableBiometrics: async () => {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (!hasHardware || !isEnrolled) {
          return false;
        }

        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: '啟用生物識別登入',
        });

        if (result.success) {
          set({ biometricsEnabled: true });
          return true;
        }
        return false;
      },

      disableBiometrics: async () => {
        set({ biometricsEnabled: false });
      },

      logout: async () => {
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
        set({
          user: null,
          isAuthenticated: false,
          // 保留 biometricsEnabled 設定
        });
        router.replace('/(auth)/login');
      },

      checkAuth: async () => {
        try {
          const accessToken = await SecureStore.getItemAsync('accessToken');
          if (accessToken) {
            const response = await authService.getProfile();
            set({
              user: response.data,
              isAuthenticated: true,
              isInitialized: true,
            });
          } else {
            set({ isInitialized: true });
          }
        } catch {
          set({ isInitialized: true });
        }
      },

      // ... 其他方法
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        biometricsEnabled: state.biometricsEnabled,
        // 不持久化 user 和 token (token 在 SecureStore)
      }),
    }
  )
);
```

### E. EAS Build 配置

```json
// eas.json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview"
    },
    "production": {
      "channel": "production",
      "ios": {
        "resourceClass": "m-medium"
      },
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-app-store-connect-app-id"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "production"
      }
    }
  }
}
```

### F. Deep Linking 配置

```typescript
// app.config.ts
export default {
  expo: {
    scheme: 'nobodyclimb',
    ios: {
      bundleIdentifier: 'cc.nobodyclimb.app',
      associatedDomains: ['applinks:nobodyclimb.cc'],
    },
    android: {
      package: 'cc.nobodyclimb.app',
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            {
              scheme: 'https',
              host: 'nobodyclimb.cc',
              pathPrefix: '/biography',
            },
            {
              scheme: 'https',
              host: 'nobodyclimb.cc',
              pathPrefix: '/crag',
            },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },
  },
};
```

```json
// Web 伺服器需要的 apple-app-site-association (放在 /.well-known/)
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID.cc.nobodyclimb.app",
        "paths": ["/biography/*", "/crag/*", "/gym/*"]
      }
    ]
  }
}
```

---

## 總結

### 更新後的關鍵改進

1. **技術選型更明確** - 單一樣式方案 (NativeWind)，避免衝突
2. **iOS 必要功能** - 加入 Apple Sign In 和生物識別
3. **專案架構務實** - 先獨立專案，降低啟動門檻
4. **安全性完整** - Token 存儲、憑證固定、越獄檢測
5. **監控完善** - Sentry + Firebase Analytics
6. **後端配合明確** - 列出所有需要新增的 API
7. **測試策略清晰** - 單元/組件/E2E 分層測試
8. **無障礙與國際化** - 從一開始就考慮

### 建議的執行順序

1. 建立獨立專案，完成基本配置
2. 實作認證系統 (含 Apple Sign In)
3. 開發核心功能 (人物誌、岩場)
4. 加入監控和分析
5. 配合後端開發推播等功能
6. 完成測試和安全檢查
7. 準備上架資料
8. Beta 測試 → 正式發布
