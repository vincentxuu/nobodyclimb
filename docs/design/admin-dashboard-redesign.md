# Admin Dashboard 重構規劃

## 問題

### 四層導航堆疊

```
[locale]/layout.tsx       → 黃色前台 Navbar + 黑色 Footer
  └── admin/layout.tsx    → 白色 admin 水平 nav bar
    └── admin/ai/layout.tsx → AI sub-nav tab bar
      └── settings/page.tsx → 10 個 settings tab
```

使用者看到四層導航，前台 header/footer 佔掉大量垂直空間，admin nav 在手機上 9 個項目擠不下。

### AI Settings 空間浪費

- 10 個 tab 水平排列，手機溢出
- 每個 field 佔整行（label 40% + input 60%），大量空白
- RAG 策略（最常用）藏在第 5 個 tab「Agentic 模式」裡
- 相關設定分散（HyDE 超時在「超時」tab，HyDE 開關在「搜尋」tab）

### 截圖參考

- Header：前台黃色 nav bar（Biography / Crags / Gyms / Gallery / Videos / Blog / Create）
- Footer：黑色底部 bar + 隱私設定按鈕

---

## 設計方向

參考 shadcn/ui dashboard pattern（https://ui.shadcn.com/examples/dashboard）：
- 左側 sidebar 分類導航
- 右側 content area
- collapsible sidebar（手機收合）
- 不套前台 shell

---

## 改動計畫

### Step 1：去掉前台 shell

**檔案**：`apps/web/src/app/[locale]/layout.tsx`

`[locale]/layout.tsx` 是所有頁面（含 admin）的 root layout，裡面固定渲染 `<Navbar />` 和 `<Footer />`。admin 頁面不該帶這些。

改法：用 `headers()` 或 middleware 注入 pathname，判斷 admin 路徑不渲染：

```tsx
// [locale]/layout.tsx 第 109 行附近
const isAdmin = /* pathname check */
{!isAdmin && <Navbar />}
<main>{children}</main>
{!isAdmin && <Footer />}
{!isAdmin && <ChatWidget />}
```

注意：這是 Server Component，不能用 `usePathname()`。選項：
- A. 用 `headers()` 讀 `x-pathname`（需要 middleware 設定）
- B. 把 admin 搬到 `app/admin/`（非 `[locale]` 下）單獨走，不經過 `[locale]/layout.tsx`
- C. 用 React Server Component 的 `params` 加一個 catch-all segment

**建議走 A** — middleware 已存在（`src/middleware.ts` 處理 next-intl），加一行 header 即可。

### Step 2：Admin layout 改成 sidebar

**檔案**：
- `apps/web/src/app/[locale]/admin/layout.tsx`
- `apps/web/src/app/admin/layout.tsx`（非 locale 版，保持同步）

現在：水平 nav bar + 手機漢堡選單
改成：左側 sidebar + 手機收合

```
┌─────────────────────────────────────────────┐
│ ┌──────────┐ ┌────────────────────────────┐ │
│ │ NC 管理   │ │                            │ │
│ │ ────────  │ │  頁面內容                   │ │
│ │ 📊 總覽   │ │                            │ │
│ │ 👤 用戶   │ │                            │ │
│ │ 🏔 岩場   │ │                            │ │
│ │ 🏢 岩館   │ │                            │ │
│ │ 📢 廣播   │ │                            │ │
│ │ 📈 分析   │ │                            │ │
│ │ 📋 日誌   │ │                            │ │
│ │ 🔔 通知   │ │                            │ │
│ │ ────────  │ │                            │ │
│ │ 🤖 AI ▾  │ │                            │ │
│ │   總覽    │ │                            │ │
│ │   設定    │ │                            │ │
│ │   日誌    │ │                            │ │
│ │   Prompts │ │                            │ │
│ │   知識庫  │ │                            │ │
│ │   指標    │ │                            │ │
│ │   費用    │ │                            │ │
│ │ ────────  │ │                            │ │
│ │ ← 返回    │ │                            │ │
│ └──────────┘ └────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

Sidebar 設計原則：
- 寬度 240px，可收合到 icon only（60px）
- AI 助理是 collapsible group，展開顯示子頁面
- 手機上 sidebar 預設收合，hamburger 開啟 overlay
- 底部「返回網站」連結
- active state 用左側 accent bar（不是背景色）

### Step 3：移除 AI sub-nav

**檔案**：`apps/web/src/app/[locale]/admin/ai/layout.tsx`

現在 AI layout 有自己的 tab bar（總覽 / 日誌 / 設定 / Prompts / 知識庫 / 指標 / 費用）。sidebar 已經有這些子項目了，不需要重複。

改法：簡化成 pass-through layout（只保留 auth check 或直接刪除讓 admin layout 接管）。

### Step 4：AI Settings 面板重設計

**檔案**：`apps/web/src/app/[locale]/admin/ai/settings/page.tsx`（1483 行）

現在：10 個水平 tab，每個 tab 有 sections + fields。
改成：單頁 collapsible sections，按使用頻率排序。

#### 新分類（用 collapsible section，不用 tab）

| Section | 內容 | 預設狀態 |
|---------|------|---------|
| **RAG 策略** | 策略下拉選單 + 引擎切換 | 展開 |
| **工具開關** | 12 個 toggle 排成 2-3 列 grid | 展開 |
| **模型** | 5 個模型選擇 | 收合 |
| **檢索** | 搜尋參數 + HyDE/MQ 超時（合併） | 收合 |
| **排名** | MMR/Reranker/Popularity 權重 | 收合 |
| **品質** | Token 限制 + 品質閾值 + Judge + Self-Reflection | 收合 |
| **對話** | 歷史深度 + 快取 TTL + 語意快取 | 收合 |
| **進階策略** | Agentic/Plan-Execute/React 參數 | 收合 |
| **超時** | Pipeline/Embedding/Search/Generation 超時 + 熔斷器 | 收合 |
| **安全** | 輸出長度限制 + 4 個 tag list（Guardrails） | 收合 |
| **費用** | 供應商費率表 | 收合 |

#### 工具開關 grid layout

```
┌─────────────────────────────────────────────────┐
│ RAG 工具開關（rag_strategy = custom 時使用）      │
├─────────────────┬───────────────┬───────────────┤
│ 繁簡正規化    ● │ HyDE        ● │ 查詢擴展    ● │
│ 語意重排序    ● │ 多樣性過濾  ● │ 領域重排序  ● │
│ 回應品質評估  ● │ 檢索品質評估○ │ 生成重試    ● │
│ 查詢改寫      ● │ 上下文壓縮  ○ │ 對話記憶    ● │
└─────────────────┴───────────────┴───────────────┘
```

3 列 grid，每個 toggle 是 label + switch，緊湊排列。

#### 數值欄位並排

相關數值放同一行：
```
RRF 門檻    無 filter [0.005]    有 filter [0.002]
Reranker    Cross-encoder [0.7]  熱門度 [0.3]
Token       生成 [800]           通識 [600]         高消耗 [1000]
```

---

## 現有檔案清單

| 檔案 | 行數 | 改動類型 |
|------|------|---------|
| `[locale]/layout.tsx` | 120 | admin 路徑不渲染 Navbar/Footer |
| `[locale]/admin/layout.tsx` | 165 | 水平 nav → sidebar |
| `admin/layout.tsx` | 165 | 同步改動 |
| `[locale]/admin/ai/layout.tsx` | ~50 | 簡化或移除 sub-nav |
| `admin/ai/layout.tsx` | ~50 | 同步改動 |
| `[locale]/admin/ai/settings/page.tsx` | 1483 | 10 tab → collapsible sections |
| `admin/ai/settings/page.tsx` | 1483 | 同步改動 |
| `src/middleware.ts` | ~30 | 加 x-pathname header |

### 可能新增的元件

| 元件 | 用途 |
|------|------|
| `components/admin/admin-sidebar.tsx` | sidebar 導航（含 collapsible group、mobile overlay） |
| `components/admin/collapsible-section.tsx` | 設定頁的可收合 section |
| `components/admin/toggle-grid.tsx` | RAG 工具開關 grid |

---

## 注意事項

1. `/app/admin/` 和 `/app/[locale]/admin/` 是兩套平行路由，改動需同步
2. admin layout 的 auth check（`authService.getCurrentUser()`）要保留
3. AI settings 的 `useAIConfig` / `useUpdateAIConfig` hooks 不用改
4. TABS 陣列的 field 定義可以保留，只改渲染方式
5. Pipeline Flow 視覺面板（PipelineFlowPanel）獨立元件，搬到 section 裡即可
6. CostSimulationPanel 也是獨立元件，直接搬

---

## 實作紀錄（2026-09-10）

四個步驟已完成，與原規劃的差異：

- **Step 1 改走 client wrapper，不動 middleware**：新增 `components/layout/site-chrome.tsx`（`'use client'`，用 `usePathname()` 判斷 admin 路徑），
  root layout 把 `<Navbar />` / `<Footer />` / ShareInvitation / ChatWidget 以 slot 傳入。
  原因：next-intl middleware 回傳的 response 要注入 request header 得碰 Next 內部的 `x-middleware-request-*` 機制，太脆弱；
  client wrapper 在 SSR 也拿得到 pathname，不會閃爍。
- **`app/admin/` 改成 re-export**：`app/admin/layout.tsx` 與 `app/admin/ai/settings/page.tsx` 只剩
  `export { default } from '../[locale]/admin/...'`，不再維護兩份。兩棵樹在重構前已經漂移
  （RAG 工具開關只進了 `app/admin/`，react-agent tab 只進了 `[locale]/admin/`），本次已合併。
  註：`localePrefix: 'as-needed'` 下 `/admin` 會被 middleware rewrite 成 `/zh/admin`，`app/admin/` 實際上不可達。
  **後續（2026-09-11）**：merge 後 deploy build 在 prerender `/admin/ai/costs` 時失敗——那棵樹不在 `[locale]/layout.tsx` 底下，
  沒有 NextIntlClientProvider 也沒有 QueryClientProvider，新 layout 的 next-intl `useRouter` 直接炸。已整棵移除 `app/admin/`。
- **AI sub-nav layout 直接刪除**（兩棵樹皆刪），sidebar 的 AI 助理 group 接管。
- **Settings 頁改成單一 draft + 只送 dirty keys**：不再每個 tab 各自 state / 各自儲存；底部 sticky 儲存列顯示未儲存數量，
  section 標題顯示「N 項已修改」。Pipeline Flow 與費用面板維持獨立儲存。
- **URL hash** 從 `#tab` 改為 `#section-id`（strategy / tools / models / retrieval / ranking / quality / chat / advanced / timeout / safety / pipeline / cost），
  會自動展開並捲動到該區塊。

### 新增檔案

| 檔案 | 用途 |
|------|------|
| `components/layout/site-chrome.tsx` | admin 路徑不套前台 shell |
| `components/admin/admin-sidebar.tsx` | sidebar（collapsible、AI group、mobile overlay、localStorage 記住收合狀態） |
| `components/admin/collapsible-section.tsx` | Radix Collapsible 卡片 |
| `components/admin/toggle-grid.tsx` | 開關 grid（1 / 2 / 3 列） |
| `components/admin/ai-settings/sections.ts` | 欄位定義（原 TABS 重新分組） |
| `components/admin/ai-settings/field-input.tsx` | 單一欄位（text / select / textarea） |
| `components/admin/ai-settings/pipeline-flow-panel.tsx` | 從 page 抽出 |
| `components/admin/ai-settings/cost-simulation-panel.tsx` | 從 page 抽出 |
| `components/admin/ai-settings/guardrail-tag-input.tsx` | 從 page 抽出 |

## 工作量估計

| 項目 | 預估 |
|------|------|
| Step 1 去掉前台 shell | 30 分鐘 |
| Step 2 Admin sidebar | 2-3 小時 |
| Step 3 移除 AI sub-nav | 15 分鐘 |
| Step 4 Settings 重設計 | 3-4 小時 |
| 測試 + 修復 | 1-2 小時 |
| **總計** | **~8 小時** |
