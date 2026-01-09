# 技術需求文件

**版本**: 1.0
**日期**: 2025-12-30

---

## 目錄

1. [系統架構](#1-系統架構)
2. [技術棧詳細說明](#2-技術棧詳細說明)
3. [性能需求](#3-性能需求)
4. [安全需求](#4-安全需求)
5. [可擴充性需求](#5-可擴充性需求)
6. [資料管理](#6-資料管理)
7. [部署架構](#7-部署架構)
8. [開發流程](#8-開發流程)
9. [監控與日志](#9-監控與日志)
10. [第三方服務](#10-第三方服務)

---

## 1. 系統架構

### 1.1 整體架構圖

```
┌─────────────────────────────────────────────────────────────┐
│                        使用者端                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │  Web瀏覽器 │  │  移動瀏覽器 │  │  PWA (未來) │                  │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘                  │
└────────┼─────────────┼─────────────┼────────────────────────┘
         │             │             │
         └─────────────┼─────────────┘
                       │
         ┌─────────────▼──────────────┐
         │   Cloudflare CDN (全球)     │
         │  - 靜態資源快取              │
         │  - DDoS 防護                │
         │  - SSL/TLS                  │
         └─────────────┬──────────────┘
                       │
         ┌─────────────▼──────────────┐
         │  Cloudflare Workers         │
         │  - Next.js SSR/SSG          │
         │  - Edge Functions           │
         │  - KV Cache                 │
         └─────────────┬──────────────┘
                       │
         ┌─────────────┼──────────────┐
         │             │              │
         ▼             ▼              ▼
   ┌──────────┐  ┌──────────┐  ┌──────────┐
   │ R2 Storage│  │    KV     │  │  後端 API │
   │ (靜態資源) │  │  (快取)   │  │ (Django)  │
   └──────────┘  └──────────┘  └─────┬────┘
                                      │
                        ┌─────────────┼─────────────┐
                        ▼             ▼             ▼
                  ┌──────────┐  ┌──────────┐  ┌──────────┐
                  │PostgreSQL │  │  Redis   │  │  S3/R2   │
                  │ (主資料庫) │  │  (快取)  │  │ (媒體)   │
                  └──────────┘  └──────────┘  └──────────┘
```

### 1.2 技術棧概覽

| 層級 | 技術選擇 | 說明 |
|------|---------|------|
| **前端框架** | Next.js 15 + React 19 | SSR/SSG, App Router |
| **前端語言** | TypeScript 5.9 | 類型安全 |
| **UI 框架** | TailwindCSS 3.4 + Radix UI | 快速開發, 可訪問性 |
| **狀態管理** | Zustand 4.5 | 輕量級狀態管理 |
| **服務端資料** | TanStack Query 5.85 | 快取, 同步, 樂觀更新 |
| **表單處理** | React Hook Form 7.62 + Zod 3.25 | 驗證, 錯誤處理 |
| **HTTP 客戶端** | Axios 1.11 | API 請求 |
| **動畫** | Framer Motion 12.23 | 頁面過渡, 交互動畫 |
| **後端框架** | Django 5.0 + DRF 3.14 | RESTful API |
| **後端語言** | Python 3.11+ | 後端邏輯 |
| **資料庫** | PostgreSQL 15 | 關系型資料庫 |
| **快取** | Redis 7.0 | 會話, 查詢快取 |
| **部署平台** | Cloudflare Workers | 邊緣計算 |
| **存儲** | Cloudflare R2 / AWS S3 | 靜態資源, 媒體文件 |
| **CDN** | Cloudflare | 全球加速 |

---

## 2. 技術棧詳細說明

### 2.1 前端技術棧

#### Next.js 15 (React 19)

**選擇理由**:
- **SSR/SSG**: 提升首屏加載速度和 SEO
- **App Router**: 現代化的路由系統, Server Components
- **圖片最佳化**: 自動最佳化圖片格式 (WebP, AVIF), 懶加載
- **API Routes**: 輕量級後端功能
- **TypeScript 整合**: 一流的 TypeScript 支持

**設定要點**:
```javascript
// next.config.js
module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '**.youtube.com' },
      { protocol: 'https', hostname: '**.instagram.com' },
    ],
  },
  experimental: {
    serverActions: true,
  },
}
```

#### TypeScript 5.9

**類型系統**:
- 嚴格模式 (`strict: true`)
- 路徑別名 (`@/components`, `@/lib`, `@/store`)
- 完整的類型定義 (User, Post, Gym, Video 等)

**類型定義位置**:
- `src/lib/types/index.ts` - 主類型定義
- `src/lib/types/auth.d.ts` - 認證類型
- `src/lib/types/video.d.ts` - 影片類型
- `cloudflare-env.d.ts` - Cloudflare 環境類型

#### Zustand (狀態管理)

**Store 結構**:
```typescript
// src/store/authStore.ts
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials) => Promise<void>;
  logout: () => void;
  updateProfile: (data) => Promise<void>;
}

// src/store/uiStore.ts
interface UIState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  toggleTheme: () => void;
  toggleSidebar: () => void;
}

// src/store/contentStore.ts
interface ContentState {
  posts: Post[];
  gyms: Gym[];
  fetchPosts: () => Promise<void>;
  fetchGyms: () => Promise<void>;
}
```

**使用原則**:
- 僅存儲全局狀態 (使用者認證, UI 偏好)
- 服務端資料使用 TanStack Query
- 避免過度使用 (組件內狀態用 useState)

#### TanStack Query (React Query)

**查詢設定**:
```typescript
// 查詢設定
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 分鐘
      cacheTime: 10 * 60 * 1000, // 10 分鐘
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// 使用示例
const { data, isLoading, error } = useQuery({
  queryKey: ['gyms', { region }],
  queryFn: () => api.gyms.getAll({ region }),
});

// 變更 (Mutation)
const mutation = useMutation({
  mutationFn: (data) => api.posts.create(data),
  onSuccess: () => {
    queryClient.invalidateQueries(['posts']);
  },
});
```

**快取策略**:
- 列表查詢: 5 分鐘 stale time
- 詳情查詢: 10 分鐘 stale time
- 使用者資料: 15 分鐘 stale time
- 樂觀更新: 點讚, 收藏等操作

### 2.2 後端技術棧

#### Django 5.0 + Django REST Framework 3.14

**專案結構** (計畫中):
```
backend/
├── config/                    # 專案設定
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── apps/
│   ├── users/                 # 使用者模塊
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── posts/                 # 文章模塊
│   ├── gyms/                  # 場館模塊
│   ├── galleries/             # 相片集模塊
│   └── comments/              # 評論模塊
├── manage.py
└── requirements.txt
```

**核心依賴**:
```
Django==5.0.*
djangorestframework==3.14.*
django-cors-headers==4.3.*
django-filter==24.1
drf-spectacular==0.27.*         # API 文件
djangorestframework-simplejwt==5.3.*  # JWT 認證
Pillow==10.2.*                  # 圖片處理
psycopg2-binary==2.9.*          # PostgreSQL
redis==5.0.*                    # Redis 客戶端
celery==5.3.*                   # 異步任務 (未來)
```

**API 設計規範**:
- RESTful 風格
- JWT 認證
- 分頁 (PageNumberPagination, 每頁 20 條)
- 篩選 (django-filter)
- 搜尋 (SearchFilter)
- 排序 (OrderingFilter)
- API 文件 (drf-spectacular, Swagger/Redoc)

參考: `/docs/backend/03-api-implementation-guide.md`

#### PostgreSQL 15

**資料模型** (9 個主要表):
1. **users_user** - 使用者表
2. **posts_post** - 文章表
3. **gyms_gym** - 攀巖館表
4. **galleries_gallery** - 相片集表
5. **galleries_image** - 圖片表
6. **comments_comment** - 評論表
7. **tags_tag** - 標簽表
8. **bookmarks_bookmark** - 收藏表
9. **videos_video** - 影片表

詳細資料模型: `/specs/001-django-rest-framework/data-model.md`

**索引策略**:
- 主鍵自動索引
- 外鍵自動索引
- 搜尋字段索引 (標題, 使用者名等)
- 時間字段索引 (created_at, updated_at)
- 複合索引 (多條件查詢)

**資料備份**:
- 每日自動備份
- 保留最近 30 天備份
- 每周完整備份
- 每月歸檔備份

#### Redis 7.0

**使用場景**:
1. **會話存儲**: Django session 存儲
2. **查詢快取**: 熱門資料快取 (場館列表, 熱門文章)
3. **限流**: API 請求頻率限制
4. **即時資料**: 在線使用者數, 點讚計數
5. **任務隊列**: Celery broker (未來)

**快取策略**:
```python
# 列表快取 (5 分鐘)
cache.set('gyms:list:taipei', gyms_data, 300)

# 詳情快取 (10 分鐘)
cache.set(f'gym:detail:{gym_id}', gym_data, 600)

# 使用者快取 (15 分鐘)
cache.set(f'user:profile:{user_id}', user_data, 900)
```

### 2.3 部署技術棧

#### Cloudflare Workers

**選擇理由**:
- **全球邊緣部署**: 低延遲 (< 50ms)
- **自動擴充**: 無需設定服務器
- **成本效益**: 免費計畫支持 100,000 請求/日
- **整合生態**: R2, KV, D1, Durable Objects

**限制與對策**:
| 限制 | 免費計畫 | 付費計畫 | 對策 |
|------|---------|---------|------|
| CPU time | 10ms | 30ms (standard), 50ms (bundled) | 最佳化代碼, 異步處理 |
| Memory | 128MB | 128MB | 代碼分割, 懶加載 |
| 請求數 | 100k/day | unlimited | 升級付費計畫 |
| KV storage | 1GB | unlimited | 圖片存儲用 R2 |

**OpenNext.js 設定**:
```typescript
// open-next.config.ts
import type { OpenNextConfig } from 'open-next/types';

const config: OpenNextConfig = {
  default: {
    override: {
      wrapper: 'cloudflare-node',
      converter: 'edge',
      incrementalCache: 'cloudflare-kv',
      tagCache: 'cloudflare-kv',
    },
  },
};

export default config;
```

#### Cloudflare R2

**使用場景**:
- 靜態資源 (圖片, CSS, JS)
- 使用者上傳的媒體文件
- 構建產物存儲

**價格優勢**:
- 免費 10GB/月存儲
- 無出站流量費用 (vs. AWS S3)

#### Cloudflare KV

**使用場景**:
- Next.js 增量快取
- 影片資料存儲 (YouTube 影片列表)
- API 回應快取

**設定**:
```toml
# wrangler.json
[[kv_namespaces]]
binding = "VIDEOS"
id = "6562f1cc9373496da57aeb48987346f8"
```

---

## 3. 性能需求

### 3.1 頁面加載性能

**Core Web Vitals 目標**:
| 指標 | 目標 | 描述 |
|------|------|------|
| **LCP** (Largest Contentful Paint) | < 2.5s | 最大內容繪制 |
| **FID** (First Input Delay) | < 100ms | 首次輸入延遲 |
| **CLS** (Cumulative Layout Shift) | < 0.1 | 累積布局偏移 |
| **TTFB** (Time to First Byte) | < 600ms | 首字節時間 |
| **FCP** (First Contentful Paint) | < 1.8s | 首次內容繪制 |

**最佳化策略**:
1. **SSR/SSG**: 預渲染頁面, 減少客戶端渲染
2. **代碼分割**: 按路由分割, 懶加載組件
3. **圖片最佳化**: WebP/AVIF 格式, 回應式圖片, 懶加載
4. **字體最佳化**: 系統字體棧, 或 font-display: swap
5. **CSS 最佳化**: TailwindCSS JIT, 移除未使用的 CSS
6. **JS 最佳化**: Tree shaking, Minification

### 3.2 API 性能

**回應時間目標**:
| 端點類型 | P50 | P95 | P99 |
|---------|-----|-----|-----|
| 簡單查詢 (列表) | < 200ms | < 500ms | < 1s |
| 複雜查詢 (詳情 + 關聯) | < 300ms | < 800ms | < 1.5s |
| 寫操作 (建立/更新) | < 400ms | < 1s | < 2s |
| 文件上傳 | < 2s | < 5s | < 10s |

**資料庫最佳化**:
- 索引最佳化 (查詢計畫分析)
- 連接池 (pgBouncer)
- 只查詢需要的字段 (select_related, prefetch_related)
- 分頁限制 (最多 100 條/頁)

**快取策略**:
- Redis 快取熱門資料
- Cloudflare CDN 快取靜態資源
- KV 快取 API 回應
- 瀏覽器快取 (Cache-Control headers)

### 3.3 並發性能

**目標**:
- 支持 1,000 並發使用者 (MVP)
- 支持 10,000 並發使用者 (1 年後)
- 支持 100,000 並發使用者 (長期)

**壓力測試**:
- 工具: Apache JMeter, k6
- 場景: 首頁瀏覽, 搜尋, 文章查看, 登入
- 頻率: 每次重大發布前

---

## 4. 安全需求

### 4.1 認證與授權

**認證方式**:
- JWT (JSON Web Token)
- Token 有效期: 7 天
- Refresh Token: 30 天
- Token 存儲: httpOnly cookie (防止 XSS)

**密碼安全**:
- bcrypt 哈希 (cost factor: 12)
- 密碼要求: 最少 8 位, 包含字母和數字
- 密碼重置: Email 驗證連結, 1 小時有效期

**授權控制**:
- 基於角色的訪問控制 (RBAC)
- 權限級別: 遊客, 使用者, 創作者, 管理員
- 資源所有權檢查 (僅本人可編輯/刪除)

### 4.2 資料安全

**傳輸安全**:
- HTTPS (TLS 1.3)
- HSTS (HTTP Strict Transport Security)
- 憑證: Cloudflare Universal SSL

**存儲安全**:
- 密碼: bcrypt 哈希
- 敏感資訊: 環境變量 (不提交到 Git)
- 資料庫: 加密連接 (SSL)

**隱私保護**:
- GDPR 合規 (資料導出, 刪除權)
- Cookie 同意橫幅
- 隱私政策和使用者協議
- 個人資訊脫敏 (日志中不記錄密碼, Token)

### 4.3 應用安全

**防護措施**:
1. **XSS 防護**:
   - React 自動轉義
   - DOMPurify 清理 HTML 輸入
   - Content Security Policy (CSP)

2. **CSRF 防護**:
   - CSRF Token 驗證
   - SameSite Cookie 屬性

3. **SQL 註入防護**:
   - ORM 參數化查詢 (Django ORM)
   - 輸入驗證

4. **限流 (Rate Limiting)**:
   - 登入: 5 次/分鐘
   - API: 100 請求/分鐘
   - 文件上傳: 10 次/小時

5. **文件上傳安全**:
   - 文件類型驗證 (白名單)
   - 文件大小限制 (10MB/張)
   - 病毒掃描 (ClamAV, 未來)
   - 隨機文件名

6. **依賴安全**:
   - 定期更新依賴
   - npm audit / pip-audit
   - Dependabot 自動化

---

## 5. 可擴充性需求

### 5.1 水平擴充

**前端擴充**:
- Cloudflare Workers 自動擴充
- 無狀態設計 (狀態存儲在資料庫/快取)

**後端擴充**:
- 多實例部署 (負載均衡)
- 資料庫讀寫分離
- 快取層 (Redis Cluster)

### 5.2 資料庫擴充

**策略**:
1. **垂直擴充** (短期): 提升服務器設定
2. **讀寫分離** (中期): 主從複制
3. **分片** (長期): 按使用者 ID 或地區分片

**分區策略**:
- 按時間分區 (文章, 評論, 日志)
- 按類型分區 (不同內容類型)

### 5.3 快取擴充

**多層快取**:
1. **瀏覽器快取**: 靜態資源 (1 年)
2. **CDN 快取**: Cloudflare (根據 Cache-Control)
3. **KV 快取**: API 回應 (5-15 分鐘)
4. **Redis 快取**: 資料庫查詢 (5-30 分鐘)
5. **應用快取**: TanStack Query (5-10 分鐘)

---

## 6. 資料管理

### 6.1 資料備份

**備份策略**:
| 類型 | 頻率 | 保留時間 | 存儲位置 |
|------|------|---------|---------|
| 增量備份 | 每 6 小時 | 7 天 | S3/R2 |
| 每日備份 | 每日 2:00 AM | 30 天 | S3/R2 |
| 每周備份 | 每周日 | 90 天 | S3/R2 |
| 每月備份 | 每月 1 日 | 1 年 | S3 Glacier |

**恢複測試**:
- 每季度進行一次恢複演練
- RTO (Recovery Time Objective): < 4 小時
- RPO (Recovery Point Objective): < 1 小時

### 6.2 資料遷移

**版本控制**:
- Django Migrations
- 版本命名: `0001_initial.py`, `0002_add_field.py`
- 測試環境先部署, 再到生產環境

**資料導入/導出**:
- CSV 導入 (攀巖路線資料)
- JSON 導出 (使用者資料, 符合 GDPR)
- 批量操作腳本 (Django management commands)

---

## 7. 部署架構

### 7.1 環境設定

**環境分類**:
| 環境 | 用途 | 域名 | Worker 名稱 |
|------|------|------|-----------|
| **開發** | 本地開發 | localhost:3000 | - |
| **預覽** | 功能測試 | preview.nobodyclimb.cc | nobodyclimb-fe-preview |
| **生產** | 正式環境 | nobodyclimb.cc, www.nobodyclimb.cc | nobodyclimb-fe-production |

**環境變量**:
```bash
# 前端 (.env.local)
NEXT_PUBLIC_API_URL=https://api.nobodyclimb.cc
NEXT_PUBLIC_SITE_URL=https://nobodyclimb.cc

# 後端 (backend/.env)
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379/0
SECRET_KEY=...
ALLOWED_HOSTS=api.nobodyclimb.cc
CORS_ALLOWED_ORIGINS=https://nobodyclimb.cc
```

### 7.2 CI/CD 流程

**理想流程** (未來實作):
```
代碼提交 → GitHub Actions 觸發
  ↓
執行測試 (Jest, Pytest)
  ↓
構建前端 (pnpm build:cf)
  ↓
部署到預覽環境 (Cloudflare Workers)
  ↓
人工審核
  ↓
合並到 main
  ↓
自動部署到生產環境
  ↓
通知 (Slack, Email)
```

**目前流程** (手動):
```bash
# 構建並部署到生產
pnpm build:cf
wrangler deploy --env production
```

---

## 8. 開發流程

### 8.1 版本控制

**分支策略** (GitHub Flow):
```
main (生產分支, 受保護)
  ↑
  ├─ feature/user-auth (功能分支)
  ├─ feature/video-player
  ├─ bugfix/login-error
  └─ docs/api-documentation
```

**提交規範** (Conventional Commits):
```
feat: 新增影片篩選功能
fix: 修複登入頁面 CSRF 錯誤
docs: 更新 API 文件
style: 格式化代碼
refactor: 重構使用者檔案組件
test: 添加單元測試
chore: 更新依賴
```

### 8.2 代碼品質

**代碼檢查**:
```bash
# TypeScript 類型檢查
pnpm tsc --noEmit

# ESLint 代碼檢查
pnpm lint

# Prettier 格式化
pnpm format

# 測試
pnpm test
```

**代碼審查**:
- Pull Request 必須經過審核
- 自動化檢查通過 (CI/CD)
- 至少 1 人批準

### 8.3 測試策略

**測試金字塔**:
```
        ┌───────────┐
        │ E2E 測試   │ (10%) - Playwright (未來)
        ├───────────┤
        │ 整合測試   │ (30%) - React Testing Library
        ├───────────┤
        │ 單元測試   │ (60%) - Jest, Pytest
        └───────────┘
```

**測試覆蓋率目標**:
- 單元測試: > 70%
- 整合測試: > 50%
- E2E 測試: 關鍵使用者流程

---

## 9. 監控與日志

### 9.1 性能監控

**工具**:
- Cloudflare Analytics (免費)
- Google Analytics (使用者行為)
- Sentry (錯誤追蹤, 未來)

**監控指標**:
- 請求數 (RPS)
- 回應時間 (P50, P95, P99)
- 錯誤率 (4xx, 5xx)
- 帶寬使用
- CPU/內存使用

### 9.2 日志管理

**日志級別**:
- ERROR: 錯誤和異常
- WARN: 警告資訊
- INFO: 一般資訊
- DEBUG: 調試資訊 (僅開發環境)

**日志內容**:
- 請求日志 (URL, Method, Status, Duration)
- 錯誤日志 (Stack trace, User context)
- 安全日志 (登入嘗試, 權限拒絕)

**日志存儲**:
- Cloudflare Workers 日志 (7 天保留)
- 應用日志 (Django logging, 30 天保留)

**日志查詢**:
```bash
# Cloudflare Workers 日志
wrangler tail --env production

# 篩選錯誤
wrangler tail --env production --status error
```

---

## 10. 第三方服務

### 10.1 目前使用

| 服務 | 用途 | 成本 |
|------|------|------|
| **Cloudflare** | CDN, Workers, R2, KV | 免費 (可升級) |
| **YouTube Data API v3** | 影片資料收集 | 免費 (有配額) |
| **Instagram Embed API** | 影片嵌入 | 免費 |

### 10.2 計畫使用

| 服務 | 用途 | 成本估算 |
|------|------|---------|
| **PostgreSQL** (Railway/Render) | 資料庫 | $5-20/月 |
| **Redis** (Upstash) | 快取 | $0-10/月 |
| **Sentry** | 錯誤追蹤 | 免費 (5k 事件/月) |
| **Google Maps API** | 地圖展示 | $0-100/月 |
| **SendGrid** | Email 發送 | 免費 (100 封/日) |

### 10.3 API 配額管理

**YouTube Data API**:
- 免費配額: 10,000 units/日
- 查詢消耗: 1-100 units/請求
- 策略: 每日定時更新, 快取資料

---

## 11. 技術債務管理

### 11.1 已知技術債務

1. **靜態 JSON 資料**: 影片資料存儲在 `public/data/videos.json`, 應遷移到資料庫/KV
2. **缺少後端 API**: 目前前端使用模擬資料, 需實作 Django 後端
3. **測試覆蓋不足**: 測試用例較少
4. **手動部署**: 缺少 CI/CD 自動化

### 11.2 技術改進計畫

**Q1 2026**:
- [ ] 實作 Django 後端 API
- [ ] 影片資料遷移到 Cloudflare KV
- [ ] 添加單元測試和整合測試

**Q2 2026**:
- [ ] 建立 CI/CD 流程 (GitHub Actions)
- [ ] 整合 Sentry 錯誤追蹤
- [ ] 性能最佳化 (Lighthouse 評分 > 90)

**Q3 2026**:
- [ ] E2E 測試 (Playwright)
- [ ] 資料庫讀寫分離
- [ ] Redis 快取集群

---

**文件結束**
