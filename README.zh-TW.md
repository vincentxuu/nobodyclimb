<div align="center">

# NobodyClimb

**為攀岩愛好者打造的社群平台。**

[![Deploy Web](https://github.com/vincentxuu/nobodyclimb/actions/workflows/deploy.yml/badge.svg)](https://github.com/vincentxuu/nobodyclimb/actions/workflows/deploy.yml)
[![Deploy API](https://github.com/vincentxuu/nobodyclimb/actions/workflows/deploy-api.yml/badge.svg)](https://github.com/vincentxuu/nobodyclimb/actions/workflows/deploy-api.yml)
[![Deploy Mobile](https://github.com/vincentxuu/nobodyclimb/actions/workflows/deploy-app.yml/badge.svg)](https://github.com/vincentxuu/nobodyclimb/actions/workflows/deploy-app.yml)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
![Status](https://img.shields.io/badge/status-live-brightgreen.svg)

[網站](https://nobodyclimb.cc) · [API 文檔](https://api.nobodyclimb.cc/api/v1/docs) · [快速開始](#快速開始) · [部署](#部署) · [架構](#架構如何運作)

[English](README.md) · [繁體中文](README.zh-TW.md)

</div>

NobodyClimb 是一個攀岩社群平台，讓你記錄攀岩故事、追蹤完攀紀錄、探索路線資訊，並內建 AI 攀岩助手提供個人化建議。全站前後端均部署於 Cloudflare Workers，以 pnpm workspaces + Turborepo 管理 monorepo。

> [!IMPORTANT]
> 本專案為 monorepo，需要 Node.js 18+ 與 pnpm；後端依賴 Cloudflare D1 / R2 / KV 與 Workers AI。本地開發前請先設定環境變數（參考 `.env.local.example`）。

## 功能一覽

| 功能 | 說明 |
| --- | --- |
| 人物誌 | 核心故事、一句話、小故事，展現你的攀岩人生 |
| 攀登紀錄 | 完攀日期、難度評分、路線追蹤 |
| 人生清單 | 設定攀岩目標，追蹤完成進度 |
| 岩場 / 攀岩館 | 路線資訊、天氣、地圖 |
| 路線影片 | 14+ 個 YouTube 頻道、11 種分類篩選 |
| 多語系 | 繁體中文 / English / 日本語（next-intl） |
| 社群互動 | 追蹤、按讚、留言、快速反應、通知 |
| 等級系統 | 麓 / 壁 / 稜 / 巔，依貢獻解鎖更多功能 |
| 管理後台 | 用戶管理、岩場管理、廣播通知、Analytics 儀表板 |

## 技術架構

| 層級 | 技術 | 位置 |
| --- | --- | --- |
| Web 前端 | Next.js 15 + React 19 + TailwindCSS | `apps/web/` |
| 行動應用 | React Native + Expo 54 + Tamagui | `apps/mobile/` |
| 後端 API | Hono + Cloudflare Workers (D1 / R2 / KV) | `backend/` |
| AI 推論 | LangGraph + Multi-Provider (CF Workers AI / OpenAI / Anthropic / Google) | `backend/src/services/` |
| AI 觀測 | Langfuse (trace / span / generation tracking) | `backend/src/utils/` |
| 共用套件 | TypeScript (types / schemas / utils / hooks) | `packages/` |

## 快速開始

需求：Node.js 18+、pnpm、Git。

```bash
git clone https://github.com/vincentxuu/nobodyclimb.git
cd nobodyclimb
pnpm install
cp .env.local.example .env.local
pnpm dev          # 啟動所有服務
```

- Web 前端：`http://localhost:3000`
- 後端 API：`http://localhost:8787`

也可以只啟動單一服務：

```bash
pnpm dev:web      # 僅前端
pnpm dev:backend  # 僅後端
pnpm dev:mobile   # 僅行動應用
```

### 常用指令

```bash
pnpm build        # 建構所有套件
pnpm lint         # Biome 檢查
pnpm test         # 執行測試
pnpm typecheck    # TypeScript 型別檢查
pnpm format       # Biome 格式化
```

## AI 攀岩助手

平台內建模組化 RAG 工具箱（42 個可插拔元件），支援多種可切換的檢索策略：

### RAG 策略

| 策略 | 延遲 | 說明 |
| --- | --- | --- |
| **Fast** | 1-2s | 精簡管線 — 跳過 HyDE、查詢擴展、品質評估、重生成 |
| **Thorough** | 3-6s | 完整管線，含 HyDE、多角度查詢、三層重排序、品質迴圈 |
| **Corrective** | 4-8s | 重排序後評估檢索品質，recall 不足時改寫查詢重搜 |
| **Deep** | 6-12s | 將複雜問題拆解為子問題，並行搜尋後合成 |
| **Custom** | 不定 | 逐個開關 12 個 RAG 工具，用於精確的 A/B 測試 |
| **Auto** | 不定 | LLM 依查詢複雜度動態路由到最佳策略 |

### 核心能力

- **LangGraph 引擎** — 以狀態圖驅動 AI pipeline，模組化節點架構
- **Multi-Provider** — 抽象層支援 Cloudflare Workers AI、OpenAI、Anthropic、Google 模型切換
- **Langfuse 觀測** — 全鏈路 trace / span / generation 追蹤，成本與延遲可視化
- **混合檢索** — 向量搜尋（BGE-M3）+ BM25 全文搜尋 + RRF 融合 + CRAG 降級
- **三層重排序** — Cross-encoder（語意）→ MMR（多樣性）→ Popularity（領域特化）
- **查詢改寫** — 品質回饋驅動的查詢改寫，而非用相同查詢重搜
- **SSE 串流** — 逐字輸出回應，提升使用體驗
- **個人化** — 依攀登紀錄與用戶偏好調整回答內容，跨會話記憶
- **路線推薦** — 完攀後自動觸發個人化路線推薦
- **安全防護** — 輸入 / 輸出 Guardrails、Token Budget 管理
- **配額系統** — 依等級設定每日使用上限（次數 + Token 雙重限制）
- **RAG 評估** — 60 題 golden test set、多策略 A/B 比較、LLM-as-Judge 評分、子群體分析
- **管理後台** — AI 設定、RAG 工具開關、日誌查詢、Prompt 設定、知識庫管理、成本追蹤

## 架構如何運作

```text
客戶端（Web / Mobile）
    |
    v
Cloudflare Workers edge        CDN、路由、驗證
    |
    v
Hono API（OpenAPI 文檔）
    |
    +-- routes/                API 路由
    +-- services/              業務邏輯與 LangGraph AI pipeline
    +-- repositories/          資料存取層
    `-- D1 / R2 / KV           資料庫、物件儲存、快取
```

## 專案結構

```
nobodyclimb/
├── apps/
│   ├── web/               # Next.js Web 前端
│   │   ├── src/app/       # App Router 頁面
│   │   ├── src/components # React 元件（按領域分組）
│   │   ├── src/lib/       # API client、工具函式
│   │   └── src/store/     # Zustand stores
│   └── mobile/            # React Native 行動應用 (Expo 54)
│       ├── app/           # Expo Router 頁面 (profile, crag, story)
│       └── src/components # RN 元件 (ui, crag, ascent, profile...)
├── backend/
│   ├── src/routes/        # API 路由（含 OpenAPI）
│   ├── src/services/      # 業務邏輯
│   ├── src/repositories/  # 資料存取層
│   └── migrations/        # D1 遷移腳本
├── packages/              # 共用套件 (types, schemas, utils, hooks, api-client)
└── docs/                  # 技術文件
```

## 部署

Web 前端、後端 API 與行動應用皆透過 GitHub Actions 自動部署：

- `main` 分支 → 生產環境（`nobodyclimb.cc` / `api.nobodyclimb.cc`）
- `develop` / 其他分支 → 預覽環境

| Workflow | 觸發路徑 | 說明 |
| --- | --- | --- |
| `deploy.yml` | `apps/web/**` | 部署 Web 前端至 Cloudflare Workers |
| `deploy-api.yml` | `backend/**` | 部署後端 API（含 D1 migration） |
| `deploy-app.yml` | `apps/mobile/**` | 建構並部署行動應用 |
| `code-review.yml` | Pull requests | PR 開啟/更新時自動 AI Code Review |
| `auto-pr-description.yml` | Pull requests | 自動產生 PR 描述 |
| `evaluate-rag.yml` | 手動觸發 | RAG 評估基準測試 |
| `keep-alive.yml` | Cron（每 5 分鐘） | Ping Workers 減少冷啟動 |

手動部署：

```bash
# 前端
cd apps/web && pnpm build:cf && wrangler deploy --env production

# 後端（先執行資料庫遷移）
cd backend && pnpm db:migrate:remote && pnpm deploy:production
```

詳細步驟請參考 [部署指南](docs/DEPLOYMENT-GUIDE.md)。

## 為什麼選 NobodyClimb？

- **一站式攀岩平台：** 完攀紀錄、路線影片、岩場資訊、社群互動、AI 助手一次到位。
- **AI 個人化推薦：** LangGraph 驅動的 RAG pipeline，從你的攀登歷史學習，持續優化推薦。
- **邊緣優先架構：** 前後端皆運行於 Cloudflare Workers，全球低延遲存取。
- **跨平台：** Web 與行動端（React Native）透過 monorepo 共用型別、schema 與 hooks。

## 開發慣例

- TypeScript 嚴格型別，前端使用 `@/` 路徑別名
- Lint 與格式化使用 [Biome](https://biomejs.dev/)
- 元件按領域分組：`components/<domain>/`
- 多語系 UI（繁中 / 英文 / 日文），程式碼註解使用**繁體中文**
- AI pipeline 採用 LangGraph 狀態圖架構，搭配 Langfuse 全鏈路觀測

## 文件

- [部署指南](docs/DEPLOYMENT-GUIDE.md)
- [資料庫遷移指南](docs/database-migration-guide.md)
- [AI Agent 架構](docs/ai-agent/)
- [後端 API](docs/backend/)
- [UI/UX 設計](docs/design/)
- [產品需求](docs/prd/)
- [Roadmap](docs/roadmap/)
- [研究](docs/research/)

## 貢獻

歡迎透過 [GitHub Issues](https://github.com/vincentxuu/nobodyclimb/issues) 回報問題或提出功能建議。

## 授權

NobodyClimb 採用 [Apache License 2.0](LICENSE) 授權。
