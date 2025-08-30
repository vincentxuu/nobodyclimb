# NobodyClimb - 攀岩社群前端專案

這是 NobodyClimb 攀岩社群的前端專案，使用 Next.js 15 框架建構，並支援 Cloudflare 部署。

## 專案概述

NobodyClimb 是一個專為攀岩愛好者打造的平台，提供攀岩場地資訊、攀岩路線、個人檔案、部落格、相片集、YouTube 影片瀏覽等功能，幫助攀岩愛好者分享經驗、尋找攀岩場地、交流技巧。

## 技術棧

- **框架**: Next.js 15.5 (React 19)
- **語言**: TypeScript 5.9
- **樣式**: TailwindCSS 3.4 + Tailwind Animate
- **狀態管理**: Zustand 4.5
- **表單處理**: React Hook Form 7.62 + Zod 3.25
- **UI元件**: 自定義UI元件 + Radix UI 系列
- **HTTP客戶端**: Axios 1.11
- **資料獲取**: TanStack Query 5.85 (React Query)
- **動畫**: Framer Motion 12.23
- **主題管理**: Next Themes 0.4
- **工具函式**: Class Variance Authority + clsx + Tailwind Merge
- **日期處理**: date-fns 2.30
- **Cookie 處理**: js-cookie 3.0
- **圖標**: Lucide React 0.542
- **測試**: Jest 29.7 + React Testing Library 16.3
- **程式碼格式化**: Prettier 3.6 + ESLint 8.57

## 部署平台

- **Cloudflare**: 使用 OpenNext.js Cloudflare 適配器
- **工具**: Wrangler CLI 4.30
- **配置**: 支援 Cloudflare Workers 和 KV 存儲
- **圖片優化**: 支援 YouTube 縮圖和多種圖片來源
- **效能優化**: 啟用圖片快取和優化

## 專案結構

```
nobodyclimb-fe/
├── src/
│   ├── app/                    # Next.js App Router 頁面
│   │   ├── api/                # API 路由
│   │   │   └── videos/         # 影片 API
│   │   ├── auth/               # 認證相關頁面
│   │   │   ├── login/          # 登入頁面
│   │   │   ├── register/       # 註冊頁面
│   │   │   └── profile-setup/  # 個人資料設定
│   │   ├── biography/          # 人物誌頁面
│   │   ├── blog/               # 部落格頁面
│   │   ├── crag/               # 岩場資訊頁面
│   │   ├── gallery/            # 相片集頁面
│   │   ├── gym/                # 攀岩館頁面
│   │   ├── profile/            # 個人檔案頁面
│   │   ├── search/             # 搜尋頁面
│   │   ├── videos/             # 影片瀏覽頁面
│   │   ├── layout.tsx          # 全站布局
│   │   └── page.tsx            # 首頁
│   ├── components/             # React 元件
│   │   ├── biography/          # 人物誌相關元件
│   │   ├── crag/               # 岩場相關元件
│   │   ├── gallery/            # 相片集相關元件
│   │   ├── home/               # 首頁相關元件
│   │   ├── layout/             # 布局相關元件
│   │   ├── profile/            # 個人檔案相關元件
│   │   ├── search/             # 搜尋相關元件
│   │   ├── shared/             # 共用元件
│   │   ├── ui/                 # UI基礎元件
│   │   └── videos/             # 影片相關元件
│   ├── data/                   # 靜態資料
│   ├── lib/                    # 工具函式庫
│   │   ├── api/                # API 客戶端
│   │   ├── constants/          # 常數定義
│   │   ├── hooks/              # 自定義 React Hooks
│   │   ├── types/              # TypeScript 型別定義
│   │   └── utils/              # 通用工具函式
│   ├── mocks/                  # 模擬資料
│   ├── store/                  # Zustand 狀態管理
│   │   ├── authStore.ts        # 認證狀態
│   │   ├── contentStore.ts     # 內容狀態
│   │   └── uiStore.ts          # UI 狀態
│   └── styles/                 # 全域樣式
├── docs/                       # 專案文件
│   ├── cloudflare-deployment/  # Cloudflare 部署文件
│   ├── design/                 # 設計稿
│   └── *.md                    # 各種計畫和說明文件
├── public/                     # 靜態資源
│   ├── data/                   # JSON 資料檔
│   ├── icon/                   # 圖標資源
│   ├── images/                 # 圖片資源
│   ├── logo/                   # 品牌標誌
│   └── photo/                  # 相片資源
├── scripts/                    # 工具腳本
│   ├── channels.json           # YouTube 頻道配置
│   ├── collect-youtube-data.sh # YouTube 資料收集腳本
│   ├── convert-youtube-videos.js # 影片資料轉換腳本
│   ├── merge-video-sources.js  # 影片來源合併腳本
│   └── update-videos.sh        # 影片資料更新腳本
├── cloudflare-env.d.ts         # Cloudflare 環境型別
├── next.config.js              # Next.js 配置
├── open-next.config.ts         # OpenNext Cloudflare 配置
├── tailwind.config.js          # TailwindCSS 配置
├── wrangler.json               # Cloudflare Wrangler 配置
└── package.json                # 專案依賴
```

## 主要功能

### 核心功能

- **用戶認證**: 註冊、登入、多步驟個人資料設定
- **個人檔案**: 用戶資料、攀岩經驗、個人設定、文章管理、書籤收藏
- **部落格系統**: 文章創建、編輯、瀏覽功能
- **岩場資訊**: 岩場詳情、路線資訊、地圖顯示、天氣狀況
- **攀岩館**: 攀岩館資訊、設施介紹、詳細頁面
- **相片集**: 攀岩相片瀏覽、彈出視窗展示
- **人物誌**: 攀岩人物故事、個人檔案展示
- **搜尋功能**: 全站搜尋、進階篩選
- **影片瀏覽**: YouTube 攀岩影片整合、篩選、播放功能

### 技術特色

- **響應式設計**: 支援桌面和行動裝置
- **主題切換**: 明暗模式支援
- **國際化**: 多語言切換功能
- **動畫效果**: 流暢的頁面轉場和互動動畫
- **圖片優化**: Next.js 圖片優化，支援多種尺寸和格式
- **YouTube 支援**: 優化的 YouTube 縮圖和影片嵌入
- **程式碼品質**: ESLint + Prettier 自動格式化
- **型別安全**: 完整的 TypeScript 支援
- **測試覆蓋**: Jest + React Testing Library
- **現代化架構**: 使用 React 19 和 Next.js 15 最新特性

### YouTube 影片功能

- 支援多個攀岩 YouTube 頻道的影片收集
- 自動化影片資料更新腳本
- 影片篩選和搜尋功能
- 嵌入式影片播放器

## 安裝與執行

### 前置需求

- Node.js 18+ (支援 React 19)
- pnpm (推薦) 或 npm

### 1. 複製專案

```bash
git clone [專案repository URL]
cd nobodyclimb-fe
```

### 2. 安裝依賴

```bash
pnpm install
# 或
npm install
```

### 3. 設定環境變數

在專案根目錄創建 `.env.local` 檔案（如需要）：

```env
# 環境變數配置（目前暫無外部 API 需求）
# NEXT_PUBLIC_CUSTOM_VAR=your_value
```

### 4. 啟動開發伺服器

```bash
pnpm dev
# 或
npm run dev
```

### 5. 訪問應用

開啟瀏覽器訪問 [http://localhost:3000](http://localhost:3000)

## 指令說明

### 開發相關

- `pnpm dev` - 啟動開發伺服器 (支援 React 19)
- `pnpm build` - 建構生產版本
- `pnpm start` - 啟動生產伺服器
- `pnpm lint` - 執行 ESLint 程式碼檢查
- `pnpm test` - 執行 Jest 測試
- `pnpm format` - 使用 Prettier 格式化程式碼
- `pnpm format:check` - 檢查程式碼格式

### Cloudflare 部署相關

- `pnpm build:cf` - 建構 Cloudflare 版本
- `pnpm preview` - 預覽 Cloudflare 建構
- `pnpm deploy` - 部署到 Cloudflare (預設環境)
- `pnpm cf-typegen` - 生成 Cloudflare 環境型別

### 環境特定部署

- `wrangler deploy` - 部署到預設環境
- `wrangler deploy --env production` - 部署到生產環境 (nobodyclimb.cc)
- `wrangler deploy --env preview` - 部署到預覽環境
- `wrangler preview` - 本地預覽部署
- `wrangler tail --env production` - 查看生產環境日誌
- `wrangler tail --env preview` - 查看預覽環境日誌

### YouTube 資料處理

- `./scripts/collect-youtube-data.sh` - 收集 YouTube 影片資料
- `node scripts/convert-youtube-videos.js` - 轉換影片資料格式
- `./scripts/update-videos.sh` - 更新影片資料

## 部署說明

本專案支援 Cloudflare Workers 部署，配置了多個環境以支援不同的部署需求。

### 環境配置

專案配置了以下環境：

#### 生產環境 (Production)

- **域名**: nobodyclimb.cc, <www.nobodyclimb.cc>
- **Worker 名稱**: nobodyclimb-fe-production
- **部署指令**: `wrangler deploy --env production`

#### 預覽環境 (Preview)

- **Worker 名稱**: nobodyclimb-fe-preview
- **部署指令**: `wrangler deploy --env preview`

#### 開發環境 (Development)

- **本地開發**: `pnpm dev`
- **本地預覽**: `wrangler preview`

### 快速部署步驟

1. **前置準備**

   ```bash
   # 安裝依賴
   pnpm install
   
   # 登入 Cloudflare
   wrangler login
   ```

2. **建構專案**

   ```bash
   # 建構 Cloudflare 版本
   pnpm build:cf
   ```

3. **部署到指定環境**

   ```bash
   # 部署到生產環境
   wrangler deploy --env production
   
   # 或部署到預覽環境
   wrangler deploy --env preview
   ```

4. **監控部署**

   ```bash
   # 查看生產環境日誌
   wrangler tail --env production
   
   # 查看預覽環境日誌
   wrangler tail --env preview
   ```

### KV 存儲配置

專案配置了 Cloudflare KV 存儲，用於將來存儲動態數據：

#### 當前狀態

- **綁定名稱**: VIDEOS
- **KV 命名空間 ID**: 6562f1cc9373496da57aeb48987346f8
- **目前使用**: 暫時使用靜態 JSON 檔案 (`public/data/videos.json`)

#### KV 使用說明

**1. 在 Cloudflare Workers 環境中訪問 KV**

```typescript
// 在 API routes 中使用
export async function GET(request: Request) {
  const { VIDEOS } = process.env as unknown as CloudflareEnv;
  
  // 讀取數據
  const data = await VIDEOS.get('videos', { type: 'json' });
  
  // 寫入數據  
  await VIDEOS.put('videos', JSON.stringify(newData));
  
  return Response.json(data);
}
```

**2. 型別支援**

```typescript
// cloudflare-env.d.ts 中已定義
interface CloudflareEnv {
  VIDEOS: KVNamespace;
}
```

**3. Wrangler CLI 操作**

```bash
# 上傳數據到 KV
wrangler kv:key put --binding=VIDEOS "videos" --path="./public/data/videos.json"

# 讀取 KV 數據
wrangler kv:key get --binding=VIDEOS "videos"

# 列出所有 keys
wrangler kv:key list --binding=VIDEOS
```

### 詳細部署文件

更詳細的部署文件請參考 `docs/cloudflare-deployment/` 目錄：

- `deployment-steps.md` - 完整部署步驟
- `deployment-checklist.md` - 部署檢查清單
- `environment-setup.md` - 環境設定說明

## 開發指南

### 程式碼風格

- 使用 TypeScript 5.9 進行嚴格型別檢查
- 遵循 ESLint 8.57 和 Prettier 3.6 配置
- 使用 Tailwind CSS 3.4 進行樣式設計
- 採用 React 19 Hooks 和函數式元件
- 使用現代化的 Next.js 15 App Router 結構

### 狀態管理

- 使用 Zustand 4.5 進行全域狀態管理
- 使用 TanStack Query 5.85 處理伺服器狀態和快取
- 使用 React Hook Form 7.62 + Zod 3.25 處理表單狀態和驗證

### 檔案組織

- 按功能模組組織元件
- 共用元件放在 `components/shared/` 和 `components/ui/`
- 型別定義集中在 `lib/types/`
- 工具函式放在 `lib/utils/`
- API 相關邏輯統一在 `lib/api/`

### 圖片處理

- 使用 Next.js 15 優化圖片載入和快取
- 支援 YouTube 縮圖和多種圖片來源
- 啟用 AVIF 和 WebP 格式支援
- 配置多種裝置尺寸優化

## 貢獻指南

1. Fork 此專案
2. 建立功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交變更 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 建立 Pull Request

---

### 聯絡資訊

- **網站**: [nobodyclimb.cc](https://nobodyclimb.cc)
- **官方網站**: [www.nobodyclimb.cc](https://www.nobodyclimb.cc)
- **開發團隊**: NobodyClimb Team

---

*本專案為 NobodyClimb 攀岩社群平台，致力於為攀岩愛好者提供最佳的線上體驗。*
