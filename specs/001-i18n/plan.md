# Implementation Plan: i18n (Internationalization)

**Branch**: `001-i18n` | **Date**: 2026-02-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-i18n/spec.md`

## Summary

為 NobodyClimb 平台建立完整的國際化架構，從目前僅支援 zh-TW 擴展至同時支援 en（英文）。Web 前端使用 `next-intl` 搭配 App Router `[locale]` 子路徑路由；Mobile App 使用 `react-i18next` + `expo-localization`；Backend 使用 Hono Language Detector middleware。翻譯檔透過新建的 `@nobodyclimb/i18n` 共享套件跨平台共用。

## Technical Context

**Language/Version**: TypeScript 5.9, Node.js 18+
**Primary Dependencies**: next-intl (web), react-i18next + i18next + expo-localization (mobile), hono/language (backend)
**Storage**: JSON translation files (filesystem), cookie (locale preference)
**Testing**: Jest 29.7 + React Testing Library 16.3 (web), existing test suites
**Target Platform**: Cloudflare Workers (web + backend), iOS + Android (mobile via Expo)
**Project Type**: Monorepo (web + mobile + backend + shared packages)
**Performance Goals**: 語系切換 < 100ms（client-side navigation）；Server Component 翻譯不增加 client bundle
**Constraints**: Cloudflare Workers 相容（非 Node.js 伺服器）；現有 URL 不可中斷；OpenNext adapter 相容
**Scale/Scope**: ~700-1000 UI 字串抽取；2 語系（zh-TW, en）；450+ 檔案涉及；50-100 後端訊息

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution 尚未設定（為模板狀態），無特定 gate 需要驗證。以下為本專案適用的自我約束：

| Gate | Status | Notes |
|------|--------|-------|
| 不引入不必要的複雜度 | ✅ PASS | next-intl 為 Next.js App Router 的標準方案，非過度工程 |
| 不破壞現有功能 | ✅ PASS | zh-TW 作為預設語系無前綴，所有現有 URL 不變 |
| 跨平台一致性 | ✅ PASS | 共享翻譯套件確保 web/mobile 用語一致 |
| 可測試性 | ✅ PASS | 翻譯 key 有 TypeScript 型別安全，CI 可驗證翻譯完整性 |

## Project Structure

### Documentation (this feature)

```
specs/001-i18n/
├── plan.md              # 本檔案
├── research.md          # Phase 0: 技術研究與決策紀錄
├── data-model.md        # Phase 1: 翻譯檔結構與型別定義
├── quickstart.md        # Phase 1: 快速上手指南
├── contracts/           # Phase 1: API 契約（語系化錯誤回應）
└── tasks.md             # Phase 2: 實作任務清單
```

### Source Code (repository root)

```
packages/i18n/                      # 新增：共享翻譯套件 (@nobodyclimb/i18n)
├── package.json
├── tsconfig.json
├── index.ts                        # 匯出翻譯型別、locale 常數、工具函式
├── types.ts                        # IntlMessages 型別定義
├── constants.ts                    # SUPPORTED_LOCALES, DEFAULT_LOCALE
└── locales/
    ├── zh-tw/
    │   ├── common.json             # 通用：按鈕、標籤、格式
    │   ├── nav.json                # 導航列項目
    │   ├── auth.json               # 登入、註冊、密碼重設
    │   ├── crag.json               # 岩場相關用語
    │   └── errors.json             # 通用錯誤訊息
    └── en/
        ├── common.json
        ├── nav.json
        ├── auth.json
        ├── crag.json
        └── errors.json

apps/web/
├── src/
│   ├── i18n/                       # 新增：next-intl 設定
│   │   ├── routing.ts              # defineRouting() 設定
│   │   ├── request.ts              # getRequestConfig() server-side
│   │   └── navigation.ts           # createNavigation() 匯出 Link, redirect, etc.
│   ├── middleware.ts               # 新增：語系偵測 middleware
│   └── app/
│       └── [locale]/               # 新增：語系動態段，包覆所有頁面路由
│           ├── layout.tsx          # 修改：從 locale 參數設定 lang 屬性
│           ├── page.tsx            # 修改：抽取翻譯字串
│           ├── about/
│           ├── biography/
│           ├── crag/
│           ├── gym/
│           ├── gallery/
│           ├── blog/
│           ├── profile/
│           ├── admin/
│           └── auth/
├── messages/                       # 新增：Web 專屬翻譯
│   ├── zh-tw/
│   │   ├── metadata.json
│   │   ├── biography.json
│   │   ├── about.json
│   │   ├── gallery.json
│   │   ├── blog.json
│   │   └── admin.json
│   └── en/
│       ├── metadata.json
│       ├── biography.json
│       ├── about.json
│       ├── gallery.json
│       ├── blog.json
│       └── admin.json
└── next.config.mjs                 # 修改：加入 createNextIntlPlugin

apps/mobile/
├── src/
│   └── i18n/                       # 新增：i18next 設定
│       └── config.ts
├── locales/                        # 新增：Mobile 專屬翻譯
│   ├── zh-tw/mobile.json
│   └── en/mobile.json
└── app/
    └── _layout.tsx                 # 修改：加入 I18nProvider

backend/
└── src/
    ├── middleware/
    │   └── language.ts             # 新增：Hono language detector 設定
    ├── i18n/                       # 新增：後端翻譯
    │   ├── zh-tw.json
    │   └── en.json
    └── index.ts                    # 修改：掛載 language middleware
```

**Structure Decision**: 採用 monorepo 多專案結構，在既有的 `packages/` 下新增 `i18n` 共享套件，各 app 目錄下新增平台專屬翻譯與設定。這遵循專案既有的 pnpm workspaces + Turborepo 架構模式。

## Implementation Phases

### Phase 1: Foundation — 共享套件與 Web 基礎設施

**目標**：建立 i18n 基礎架構並驗證 Cloudflare Workers 相容性

1. **建立 `packages/i18n`**
   - 初始化 package.json（`@nobodyclimb/i18n`）
   - 建立 locale 常數（`SUPPORTED_LOCALES`, `DEFAULT_LOCALE`）
   - 建立初始翻譯檔（`common.json`, `nav.json`）— 先從 navbar、footer 抽取
   - 設定 TypeScript 型別匯出

2. **安裝與設定 next-intl**
   - `pnpm add next-intl` (apps/web)
   - 建立 `src/i18n/routing.ts`、`src/i18n/request.ts`、`src/i18n/navigation.ts`
   - 修改 `next.config.mjs` 加入 `createNextIntlPlugin`
   - 建立 `src/middleware.ts` 語系偵測

3. **路由結構改造**
   - 將 `app/` 下所有頁面路由移入 `app/[locale]/`
   - 修改 root `layout.tsx` 接受 `locale` 參數
   - 更新 `robots.ts` 不放在 `[locale]` 內
   - 保留 `api/` routes 不在 `[locale]` 內

4. **驗證部署**
   - 確認 Cloudflare Workers build 通過
   - 確認現有 URL（無前綴）正常運作
   - 確認 `/en/` 前綴路由正常運作

### Phase 2: Web 字串抽取（核心頁面）

**目標**：將主要頁面的硬編碼字串抽取至翻譯檔

1. **Layout 元件**：navbar, footer, sidebar
2. **首頁** (`page.tsx`)
3. **關於頁** (`about/page.tsx`)
4. **常數檔案**：`lib/constants/index.ts`, `badges.ts`, `biography-questions.ts`
5. **Auth 頁面**：登入、註冊
6. **功能頁面**：crag, gym, biography, gallery, blog

### Phase 3: 完整 Web i18n

**目標**：完成所有 Web 頁面翻譯與 SEO 設定

1. **剩餘頁面字串抽取**
2. **SEO metadata 翻譯**（每頁 title, description, og tags）
3. **`alternates.languages` hreflang 設定**
4. **語系切換器元件**（Navbar 內）
5. **英文翻譯完成**

### Phase 4: Mobile App i18n

**目標**：Mobile App 支援多語系

1. 安裝 `expo-localization`, `react-i18next`, `i18next`
2. 設定 i18next 讀取 `@nobodyclimb/i18n` 共享翻譯
3. 建立 I18nProvider 並整合 Expo Router layout
4. 抽取 mobile 專屬字串

### Phase 5: Backend i18n + CI/CD

**目標**：後端語系化與自動化品質檢查

1. 加入 Hono language detector middleware
2. 建立後端錯誤/驗證訊息翻譯檔
3. 更新 API error responses 使用偵測語系
4. CI 翻譯 key 完整性檢查腳本
5. 更新 `wrangler.json` 路由設定（locale prefix 路由）

## Key Technical Decisions

### D-1: 選用 next-intl 而非 react-i18next (Web)

**Decision**: next-intl
**Rationale**: 原生支援 App Router 與 React Server Components，Server Component 翻譯不計入 client bundle；內建 locale-aware routing（`<Link>`, `redirect`）；已有 Cloudflare Workers 部署成功案例。
**Alternatives rejected**: react-i18next 缺乏 RSC 支援且無內建路由；Paraglide JS 無 React Native adapter；LinguiJS 需要額外 CLI 抽取步驟。

### D-2: 子路徑路由而非子網域路由

**Decision**: `/en/about` 子路徑模式
**Rationale**: 單一部署即可處理所有語系；SEO 友善（Google 推薦）；next-intl 原生支援；不需額外 DNS 設定。
**Alternatives rejected**: `en.nobodyclimb.cc` 需要獨立 Workers 部署與 DNS 記錄。

### D-3: 預設語系 zh-TW 不帶前綴

**Decision**: zh-TW 路徑無前綴（`/about`），en 帶前綴（`/en/about`）
**Rationale**: 保留所有現有 URL 不變，零 SEO 影響，對現有使用者透明。

### D-4: Web 與 Mobile 使用不同 i18n 函式庫

**Decision**: Web 用 next-intl，Mobile 用 react-i18next
**Rationale**: 各平台使用最適合的方案；透過共享 JSON 翻譯檔（`@nobodyclimb/i18n`）保持一致性；ICU `{variable}` 插值語法兩邊都可設定支援。

### D-5: 翻譯檔 JSON namespace 分割

**Decision**: 按功能領域分割為多個 JSON 檔案
**Rationale**: 更好的 git diff 可讀性、團隊協作（不同翻譯者可並行）、mobile 端可按需載入。

## Risk Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| next-intl middleware 在 Cloudflare Workers 不相容 | High | Low | next-intl 支援 middleware-free 模式（cookie-based），Phase 1 即驗證 |
| 路由結構改造導致大量檔案異動 | Medium | High | Git 的 `mv` 操作可追蹤；分 PR 進行 |
| 翻譯 key 遺漏或不一致 | Medium | Medium | CI 腳本檢查 zh-tw/en JSON key 一致性 |
| 英文翻譯品質 | Low | Medium | 第一版可接受機器翻譯品質，後續人工修正 |
| Bundle size 增加 | Low | Low | next-intl 僅載入當前語系；RSC 翻譯不計入 client bundle |

## Complexity Tracking

*無 constitution 違規需要說明。*
