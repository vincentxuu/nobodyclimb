# Research: i18n (Internationalization)

**Date**: 2026-02-10 | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Research Tasks

### RT-1: Next.js 15 App Router i18n 函式庫選型

**Task**: 評估 Next.js 15 App Router 最佳 i18n 方案

**Findings**:

| Library | App Router | RSC Support | CF Workers | Bundle Size | Routing | TypeScript |
|---------|-----------|-------------|------------|-------------|---------|------------|
| **next-intl** | First-class | Native | ✅ Confirmed | ~10-15 kB | Built-in | Key autocomplete |
| react-i18next | Manual wiring | Limited (client-only) | ✅ | ~27 kB | None | With `.d.ts` |
| LinguiJS | Supported | Via `setI18n` | Should work | Small (compiled) | None | Good |
| Paraglide JS | Supported | Via compiler | Untested | Smallest (~70% less) | Built-in | Compile-time |
| next-international | Good | Server support | Untested | Small | Built-in | Excellent |

**Decision**: **next-intl**
**Rationale**:
- 792K weekly downloads, 4K+ stars，社群最活躍
- 原生 App Router 整合，`createNextIntlPlugin` 直接嵌入 next.config
- React Server Components 翻譯不計入 client bundle（關鍵效能優勢）
- 內建 locale-aware `<Link>`, `redirect()`, `usePathname()`
- 已有多個 Cloudflare Workers + OpenNext 成功部署案例
- `createMiddleware` 支援 `Accept-Language` 偵測與 cookie 持久化
**Alternatives considered**:
- react-i18next 缺乏 RSC 支援，無內建路由，bundle 較大
- Paraglide JS bundle 最小但無 React Native adapter，不適合 monorepo 共用
- next-international 社群較小，Cloudflare Workers 相容性未驗證

### RT-2: Cloudflare Workers 相容性驗證

**Task**: 確認 next-intl + @opennextjs/cloudflare 相容性

**Findings**:
- OpenNext Cloudflare adapter 執行 Next.js middleware 在 Node.js runtime（非 Edge Runtime）
- 專案 `wrangler.json` 已設定 `compatibility_date: "2025-01-01"` 和 `nodejs_compat_v2`
- next-intl middleware 僅需 locale 列表，不載入翻譯檔，體積極小
- 已有實際案例在 Cloudflare Workers 部署 next-intl（Marek Urbanowicz 2024 報告）
- 主要風險：middleware 若有問題，next-intl 提供 middleware-free 模式（cookie-based fallback）

**Decision**: 相容，可直接使用
**Rationale**: 現有基礎設施（`nodejs_compat_v2`, OpenNext adapter）滿足 next-intl 需求
**Risk mitigation**: Phase 1 第一步即驗證部署，若有問題切換到 middleware-free 模式

### RT-3: 路由策略 — 子路徑 vs 子網域

**Task**: 決定 URL 多語系結構

**Findings**:
- **子路徑** (`/en/about`): 單一 Workers 部署、SEO 友善、next-intl 原生支援、Google 推薦
- **子網域** (`en.nobodyclimb.cc`): 需要額外 DNS 記錄、獨立部署、管理複雜度高
- **Cookie-only** (同 URL 不同語言): SEO 不友善、搜尋引擎無法索引多語版本

**Decision**: **子路徑路由**，zh-TW 無前綴、en 帶 `/en/` 前綴
**Rationale**: 保留所有現有 URL、單一部署、SEO 最佳實踐
**Alternatives considered**: 子網域需要多重部署與 DNS 設定，不符成本效益

### RT-4: React Native / Expo i18n 方案

**Task**: 選擇 Expo 54 + React Native 0.81 的 i18n 方案

**Findings**:
- Expo 官方推薦 `expo-localization`（裝置語系偵測）+ `i18n-js` 或 `react-i18next`
- `react-i18next` 生態最成熟（3.2M weekly downloads），支援 namespace、lazy loading
- `i18n-js` 較輕量但功能較少
- react-i18next 可設定 `{variable}` 插值前後綴，與 next-intl 的 ICU 語法相容

**Decision**: **react-i18next + expo-localization + i18next**
**Rationale**:
- Expo 官方推薦組合
- 可透過設定插值語法與 next-intl 共用翻譯 JSON
- Namespace 支援適合 monorepo 分割策略
**Alternatives considered**: i18n-js 較輕但缺乏 namespace 與 TypeScript 深度整合

### RT-5: 翻譯檔格式與共用策略

**Task**: 設計 monorepo 跨平台翻譯檔共用方案

**Findings**:
- next-intl 使用 ICU MessageFormat（`{name}`, `{count, plural, ...}`）
- i18next 預設使用 `{{name}}` 和自有 plural 語法
- **關鍵差異**：插值語法不同（`{x}` vs `{{x}}`）、plural 格式不同
- **解法**：i18next 可透過設定調整前後綴為 `{` `}`，與 ICU 語法一致
- 中文（zh-TW）無複數形式，英文複數字串相對少量，可放在 app-specific 檔案

**Decision**:
- 共用 JSON 使用 ICU `{variable}` 語法
- i18next 設定 `interpolation.prefix = '{'`, `interpolation.suffix = '}'`
- 複雜 plural/select 放在 app-specific 翻譯檔
**Rationale**: 最大化共用範圍，最小化平台差異處理
**Alternatives considered**:
- 兩套翻譯檔（完全分離）— 增加維護成本
- 建立轉換腳本（build-time transform）— 增加工具鏈複雜度

### RT-6: 字串抽取策略

**Task**: 評估從 450+ 檔案抽取 700-1000+ 字串的最佳方法

**Findings**:
- **手動抽取**：最精確控制，適合核心頁面；逐檔 search & replace
- **a18n (AST-based)**：自動包裹中文字串為 `t('key')` 並產生 key map，適合批量處理
- **i18next-scanner**：掃描 `t()` 呼叫，產生缺失 key 報告，適合初始抽取後的持續檢查
- **eslint-plugin-i18next**：ESLint 規則偵測未翻譯硬編碼字串，適合 CI 防護

**Decision**:
- Phase 1-2: 手動抽取核心頁面（navbar, footer, home, about）以驗證模式
- Phase 2-3: 批量抽取其餘頁面，使用 regex 搜尋中文字元輔助定位
- 持續: 加入 ESLint 規則防止新增硬編碼字串
**Rationale**: 先手動確立命名慣例與 namespace 結構，再批量處理效率更高
**Alternatives considered**: 全自動化工具可能產生不理想的 key 命名，需大量後續修正

### RT-7: Hono Backend 語系化

**Task**: 評估 Hono backend 的 i18n 方案

**Findings**:
- Hono 提供 `hono/language` 內建 middleware，支援 `Accept-Language` 偵測
- 設定簡單：`languageDetector({ supportedLanguages: ['zh-TW', 'en'], fallbackLanguage: 'zh-TW' })`
- 透過 `c.get('language')` 取得偵測到的語系
- 後端需翻譯的範圍小（~50-100 個錯誤/驗證訊息），不需複雜的 i18n 框架
- 可使用簡單的 JSON 字典 + lookup 函式

**Decision**: Hono Language Detector middleware + 簡單 JSON 字典
**Rationale**: 輕量、原生支援、符合後端翻譯的有限範圍
**Alternatives considered**: i18next 在後端過度工程，不需要其 namespace/plural 等功能

### RT-8: SEO 多語系最佳實踐

**Task**: 確認多語系 SEO 設定方式

**Findings**:
- Google 推薦使用 `hreflang` 標籤宣告頁面的語言替代版本
- Next.js metadata API 支援 `alternates.languages`
- 每個語系頁面需要獨立的 `title`, `description`, `og:locale`
- `sitemap.xml` 需包含所有語系 URL
- next-intl 提供 `getAlternates()` helper 簡化設定

**Decision**:
- 使用 Next.js metadata API 的 `alternates.languages` 產生 `hreflang`
- 每頁 `generateMetadata()` 讀取對應語系的 metadata 翻譯檔
- `robots.ts` 保持在 `[locale]` 外層
- 更新 `sitemap.xml` 生成邏輯包含所有語系

## Summary of Decisions

| # | Topic | Decision | Key Factor |
|---|-------|----------|------------|
| RT-1 | Web i18n library | next-intl | Best App Router + RSC integration |
| RT-2 | CF Workers compatibility | Confirmed compatible | nodejs_compat_v2 + OpenNext |
| RT-3 | URL strategy | Subpath routing, zh-TW no prefix | SEO + backward compatibility |
| RT-4 | Mobile i18n | react-i18next + expo-localization | Expo recommended + ecosystem |
| RT-5 | Shared translations | ICU syntax in shared JSON | Cross-platform compatibility |
| RT-6 | String extraction | Manual first, then batch + ESLint | Quality control + naming conventions |
| RT-7 | Backend i18n | Hono language middleware + JSON dict | Lightweight, fits limited scope |
| RT-8 | SEO | hreflang via metadata API | Google best practices |

All NEEDS CLARIFICATION items have been resolved. No unresolved dependencies remain.
