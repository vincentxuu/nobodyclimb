# Feature Spec: i18n (Internationalization)

**Branch**: `001-i18n` | **Date**: 2026-02-10 | **Status**: Draft

## Overview

為 NobodyClimb 平台加入國際化 (i18n) 支援，從目前僅支援繁體中文 (zh-TW) 擴展至同時支援英文 (en)，並建立可擴展的多語系架構，未來可輕鬆新增其他語言。

## Goals

1. **Web 前端 (Next.js 15)**：使用 `next-intl` 搭配 App Router `[locale]` 子路徑路由，支援 zh-TW（預設，無前綴）與 en
2. **Mobile App (Expo)**：使用 `react-i18next` + `expo-localization`，與 Web 共用翻譯檔案
3. **Backend (Hono)**：使用 Hono Language Detector middleware，回傳語系化錯誤與驗證訊息
4. **Shared Package**：建立 `@nobodyclimb/i18n` 共享套件，統一管理跨平台翻譯檔與型別

## Non-Goals

- 右至左 (RTL) 語言支援（如阿拉伯文、希伯來文）
- 翻譯管理系統 (TMS) 整合（如 Crowdin, Phrase）— 留待後續需求
- 使用者自行選擇語系的偏好設定存入後端 — 第一版使用瀏覽器/系統語系偵測 + cookie
- 資料庫內容翻譯（如使用者撰寫的文章、留言等 UGC 內容）
- 後端 API response body 的資料內容翻譯（僅翻譯錯誤訊息與系統提示）

## Functional Requirements

### FR-1: 語系路由 (Web)

- 採用子路徑路由：`/about` (zh-TW 預設), `/en/about` (English)
- Next.js App Router `[locale]` dynamic segment 包覆所有頁面路由
- Middleware 偵測 `Accept-Language` header 與 cookie，自動導向適當語系
- 預設語系 zh-TW 不帶前綴，保留所有現有 URL 不變
- 支援的語系清單：`['zh-TW', 'en']`，預設 `zh-TW`

### FR-2: 翻譯字串管理

- 所有 UI 硬編碼文字抽取至 JSON 翻譯檔
- 翻譯檔按命名空間 (namespace) 組織：`common`, `nav`, `auth`, `crag`, `biography`, `errors` 等
- 共用翻譯放在 `packages/i18n/locales/`，平台專屬翻譯放在各 app 目錄
- 使用 `{variable}` ICU 風格插值語法（next-intl 原生支援，i18next 可透過設定相容）

### FR-3: 語系切換

- 在 Navbar 提供語系切換器元件
- 切換時更新 URL 路徑前綴並設定 cookie 記憶偏好
- 語系切換不重新整理頁面（client-side navigation）

### FR-4: SEO 多語系支援

- 每個頁面的 metadata 包含 `alternates.languages`，產生 `hreflang` 標籤
- 各語系頁面有獨立的 `title` 和 `description`
- `robots.ts` 和 `sitemap.xml` 涵蓋所有語系 URL

### FR-5: Mobile App 語系支援

- 使用裝置系統語系作為預設語系
- 支援 App 內語系切換
- 共用 `@nobodyclimb/i18n` 的翻譯檔案

### FR-6: Backend 錯誤訊息語系化

- Hono middleware 偵測 `Accept-Language` header
- API 錯誤回應與驗證訊息依據偵測語系回傳對應翻譯
- 約 50-100 個後端訊息字串需翻譯

## Technical Approach

### 技術選型

| 元件 | 選用方案 | 理由 |
|------|---------|------|
| Web i18n | `next-intl` | 最佳 App Router 整合、支援 RSC、Cloudflare Workers 相容 |
| Mobile i18n | `react-i18next` + `expo-localization` | Expo 官方推薦、React Native 生態最成熟 |
| Backend i18n | Hono Language Detector middleware | 原生支援、輕量 |
| 共用翻譯 | `@nobodyclimb/i18n` package | Monorepo 共用、型別安全 |

### 翻譯檔結構

```
packages/i18n/
├── package.json
├── index.ts
├── locales/
│   ├── zh-TW/
│   │   ├── common.json      # 通用：按鈕、標籤、日期
│   │   ├── nav.json          # 導航列
│   │   ├── auth.json         # 登入、註冊
│   │   ├── crag.json         # 岩場相關
│   │   └── errors.json       # 錯誤訊息
│   └── en/
│       ├── common.json
│       ├── nav.json
│       ├── auth.json
│       ├── crag.json
│       └── errors.json
└── tsconfig.json

apps/web/messages/
├── zh-TW/
│   ├── metadata.json         # SEO 標題、描述
│   ├── biography.json        # 人物誌功能
│   ├── about.json            # 關於頁面
│   └── admin.json            # 管理後台
└── en/
    ├── metadata.json
    ├── biography.json
    ├── about.json
    └── admin.json

apps/mobile/locales/
├── zh-TW/mobile.json
└── en/mobile.json
```

### 路由結構變更

```
apps/web/src/app/
├── [locale]/                 # 新增語系動態段
│   ├── layout.tsx            # 從 locale 參數設定 lang 屬性
│   ├── page.tsx
│   ├── about/page.tsx
│   ├── biography/...
│   ├── crag/...
│   ├── gym/...
│   ├── gallery/...
│   ├── videos/...
│   ├── blog/...
│   ├── profile/...
│   ├── admin/...
│   └── auth/...
├── robots.ts                 # 不在 [locale] 內
└── api/                      # API routes 不在 [locale] 內
```

## Estimated Scope

- **Web UI 字串**：約 700-1000 個硬編碼字串，分佈在 450+ 個檔案中
- **共用翻譯 namespace 數量**：約 5-8 個
- **Web 專屬翻譯 namespace 數量**：約 4-6 個
- **後端訊息字串**：約 50-100 個
- **Mobile 專屬字串**：約 30-50 個（視功能覆蓋程度而定）

## Acceptance Criteria

- [ ] 所有現有 zh-TW URL 路徑不變且正常運作
- [ ] `/en/*` 路徑正確顯示英文翻譯
- [ ] Navbar 語系切換器可在 zh-TW 與 en 之間切換
- [ ] 語系偏好透過 cookie 記憶
- [ ] 搜尋引擎可爬取所有語系頁面（hreflang 正確設定）
- [ ] Cloudflare Workers 部署正常運作
- [ ] Mobile App 可偵測系統語系並顯示對應翻譯
- [ ] API 錯誤訊息根據 Accept-Language 回傳對應語系
- [ ] TypeScript 型別檢查通過，翻譯 key 有型別安全
- [ ] 現有測試不因 i18n 改動而失敗
