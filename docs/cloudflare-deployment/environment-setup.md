# Cloudflare Workers 環境配置指南

## 開發環境設置

### 1. Node.js 環境

確保安裝 Node.js 18.x 或更高版本：

```bash
# 檢查 Node.js 版本
node --version

# 使用 nvm 安裝特定版本 (推薦)
nvm install 18
nvm use 18
```

### 2. 套件管理器

專案使用 pnpm 作為套件管理器：

```bash
# 安裝 pnpm
npm install -g pnpm

# 或使用 npm
npm install
```

### 3. Wrangler CLI 安裝

Wrangler 是 Cloudflare Workers 的官方 CLI 工具：

```bash
# 全域安裝
npm install -g wrangler

# 或作為專案依賴
pnpm add -D wrangler

# 驗證安裝
wrangler --version
```

### 4. Cloudflare 帳號配置

```bash
# 登入 Cloudflare
wrangler login

# 驗證登入狀態
wrangler whoami
```

## 專案配置文件

### 1. 創建 wrangler.toml

在專案根目錄創建 `wrangler.toml` 文件：

```toml
name = "nobodyclimb-fe"
main = ".vercel/output/static/_worker.js"
compatibility_date = "2024-01-01"

[site]
bucket = ".vercel/output/static"

[build]
command = "npm run build"

[env.production]
name = "nobodyclimb-fe-production"
routes = [
  { pattern = "nobodyclimb.com/*", zone_name = "nobodyclimb.com" }
]

[env.staging]
name = "nobodyclimb-fe-staging"
routes = [
  { pattern = "staging.nobodyclimb.com/*", zone_name = "nobodyclimb.com" }
]

# KV 命名空間配置 (選用)
[[kv_namespaces]]
binding = "CACHE"
id = "your-kv-namespace-id"

# R2 儲存桶配置 (選用)
[[r2_buckets]]
binding = "ASSETS"
bucket_name = "nobodyclimb-assets"

# 環境變量 (敏感資訊應使用 Dashboard 設置)
[vars]
NODE_ENV = "production"
```

### 2. 更新 next.config.js

配置 Next.js 支援 Edge Runtime：

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 啟用 Edge Runtime
  experimental: {
    runtime: 'edge',
  },
  
  // 輸出配置
  output: 'standalone',
  
  // 圖片優化配置
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.nobodyclimb.com',
      },
    ],
    // 使用 Cloudflare Image Resizing
    loader: 'custom',
    loaderFile: './lib/cloudflare-image-loader.js',
  },
  
  // 環境變量
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  
  // Webpack 配置
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // 確保客戶端 bundle 兼容 Workers
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
```

### 3. 創建 .env 文件

#### .env.local (本地開發)

```bash
# API 配置
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# 第三方服務 (範例)
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=UA-XXXXXXXXX-X
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# 開發環境標記
NODE_ENV=development
```

#### .env.production (生產環境)

```bash
# API 配置
NEXT_PUBLIC_API_URL=https://api.nobodyclimb.com
NEXT_PUBLIC_SITE_URL=https://nobodyclimb.com

# 第三方服務
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=UA-XXXXXXXXX-X
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# 生產環境標記
NODE_ENV=production
```

## Cloudflare Dashboard 設置

### 1. Workers 環境變量

在 Cloudflare Dashboard 中設置敏感環境變量：

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 選擇 Workers & Pages
3. 選擇你的 Worker
4. 進入 Settings → Variables
5. 添加環境變量：

```
# 必要變量
NEXT_PUBLIC_API_URL=https://api.nobodyclimb.com
JWT_SECRET=your-secret-key
DATABASE_URL=your-database-url

# 第三方服務
CLOUDFLARE_API_TOKEN=your-api-token
SENTRY_AUTH_TOKEN=your-sentry-token
```

### 2. KV 命名空間設置

如需使用 KV 存儲：

```bash
# 創建 KV 命名空間
wrangler kv:namespace create "CACHE"
wrangler kv:namespace create "CACHE" --preview

# 綁定到 Worker
# 將生成的 ID 添加到 wrangler.toml
```

### 3. R2 儲存桶設置

如需使用 R2 存儲靜態資源：

```bash
# 創建 R2 儲存桶
wrangler r2 bucket create nobodyclimb-assets

# 上傳靜態資源
wrangler r2 object put nobodyclimb-assets/images/logo.png --file=./public/logo.png
```

## 本地開發環境

### 1. 安裝專案依賴

```bash
# 使用 pnpm
pnpm install

# 或使用 npm
npm install
```

### 2. 啟動開發服務器

```bash
# Next.js 開發服務器
pnpm dev

# 使用 Wrangler 本地模擬 Workers 環境
wrangler dev
```

### 3. 環境切換

使用不同的環境配置：

```bash
# 開發環境
pnpm dev

# 預覽環境
wrangler dev --env staging

# 生產環境構建
pnpm build
wrangler dev --env production
```

## 驗證配置

### 檢查清單

1. **Node.js 版本**
   ```bash
   node --version  # 應為 18.x 或更高
   ```

2. **Wrangler 登入狀態**
   ```bash
   wrangler whoami
   ```

3. **環境變量載入**
   ```bash
   # 在應用中檢查
   console.log(process.env.NEXT_PUBLIC_API_URL)
   ```

4. **構建測試**
   ```bash
   pnpm build
   ```

5. **本地 Workers 測試**
   ```bash
   wrangler dev
   ```

## 故障排除

### 常見問題

1. **Wrangler 登入失敗**
   - 檢查網絡連接
   - 清除 Wrangler 緩存：`wrangler logout` 後重新登入

2. **環境變量未載入**
   - 確認 `.env` 文件位置正確
   - 重啟開發服務器
   - 檢查變量命名（必須以 `NEXT_PUBLIC_` 開頭才能在客戶端使用）

3. **構建錯誤**
   - 檢查 Node.js 版本
   - 清除緩存：`rm -rf .next node_modules`
   - 重新安裝依賴

4. **Workers 大小限制**
   - Worker 腳本大小限制為 10MB
   - 優化打包配置，移除不必要的依賴

## 下一步

環境配置完成後，請參考：
- [部署步驟說明](./deployment-steps.md) - 詳細的部署流程
- [部署任務清單](./deployment-checklist.md) - 確保所有步驟都已完成

---

*最後更新：2025-08-17*