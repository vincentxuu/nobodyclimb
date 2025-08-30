# Cloudflare Workers 部署步驟說明

## 前言

本文件提供詳細的逐步部署指南，幫助您將 Next.js 應用程式成功部署到 Cloudflare Workers。

## 步驟 1：準備工作

### 1.1 確認環境

```bash
# 檢查 Node.js 版本
node --version  # 需要 18.x 或更高

# 檢查套件管理器
pnpm --version  # 或 npm --version

# 檢查 Git
git --version
```

### 1.2 安裝 Wrangler

```bash
# 全域安裝
npm install -g wrangler

# 驗證安裝
wrangler --version
```

### 1.3 登入 Cloudflare

```bash
# 開啟瀏覽器進行身份驗證
wrangler login

# 確認登入狀態
wrangler whoami
```

## 步驟 2：專案配置

### 2.1 安裝 Next.js Edge Runtime 適配器

```bash
# 安裝 @cloudflare/next-on-pages
pnpm add -D @cloudflare/next-on-pages

# 安裝其他必要依賴
pnpm add -D wrangler
```

### 2.2 創建 wrangler.toml

在專案根目錄創建 `wrangler.toml`：

```toml
name = "nobodyclimb-fe"
compatibility_date = "2024-01-01"

# 主要入口點
main = ".vercel/output/static/_worker.js"

# 靜態資源目錄
[site]
bucket = ".vercel/output/static"

# 構建命令
[build]
command = "pnpm run build:cf"

# 生產環境配置
[env.production]
name = "nobodyclimb-fe-prod"
routes = [
  { pattern = "nobodyclimb.com/*", zone_name = "nobodyclimb.com" },
  { pattern = "www.nobodyclimb.com/*", zone_name = "nobodyclimb.com" }
]

# 預覽環境配置
[env.preview]
name = "nobodyclimb-fe-preview"
```

### 2.3 更新 package.json

添加部署相關腳本：

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "build:cf": "next build && npx @cloudflare/next-on-pages",
    "preview": "wrangler pages dev .vercel/output/static",
    "deploy": "wrangler deploy",
    "deploy:preview": "wrangler deploy --env preview",
    "deploy:production": "wrangler deploy --env production"
  }
}
```

### 2.4 配置 next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 啟用 Edge Runtime
  experimental: {
    runtime: 'edge',
  },
  
  // 輸出配置
  output: 'standalone',
  
  // 確保與 Cloudflare Workers 兼容
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
```

## 步驟 3：構建應用程式

### 3.1 清理舊構建

```bash
# 清理構建緩存
rm -rf .next .vercel node_modules/.cache
```

### 3.2 執行構建

```bash
# 安裝依賴（如尚未安裝）
pnpm install

# 執行 Cloudflare 構建
pnpm run build:cf
```

構建成功後，應該會看到：
- `.vercel/output/static` 目錄被創建
- `_worker.js` 文件在該目錄中

### 3.3 驗證構建輸出

```bash
# 檢查構建大小
du -sh .vercel/output/static/_worker.js

# 確保小於 10MB（Workers 限制）
```

## 步驟 4：本地測試

### 4.1 使用 Wrangler 本地預覽

```bash
# 啟動本地 Workers 開發服務器
pnpm run preview

# 或直接使用 wrangler
wrangler dev
```

### 4.2 測試檢查項目

在瀏覽器中訪問 `http://localhost:8787`，檢查：

- [ ] 首頁正常載入
- [ ] 路由切換正常
- [ ] API 請求正常
- [ ] 靜態資源載入正常
- [ ] 表單功能正常

## 步驟 5：設置環境變量

### 5.1 通過 Dashboard 設置

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 導航到 Workers & Pages
3. 選擇您的 Worker
4. 點擊 Settings → Variables
5. 添加必要的環境變量

### 5.2 通過 CLI 設置

```bash
# 設置單個變量
wrangler secret put NEXT_PUBLIC_API_URL
# 輸入值：https://api.nobodyclimb.com

# 設置多個變量
echo "your-secret-key" | wrangler secret put JWT_SECRET
```

### 5.3 驗證環境變量

```bash
# 列出所有密鑰（不會顯示值）
wrangler secret list
```

## 步驟 6：部署到 Cloudflare

### 6.1 首次部署（預覽環境）

```bash
# 部署到預覽環境
pnpm run deploy:preview

# 或
wrangler deploy --env preview
```

成功輸出示例：
```
✨ Success! Uploaded nobodyclimb-fe-preview
✨ Deployment URL: https://nobodyclimb-fe-preview.username.workers.dev
```

### 6.2 測試預覽部署

訪問提供的 URL，進行完整測試：
- 功能測試
- 性能測試
- 跨瀏覽器測試

### 6.3 部署到生產環境

確認預覽環境正常後：

```bash
# 部署到生產環境
pnpm run deploy:production

# 或
wrangler deploy --env production
```

## 步驟 7：配置自定義域名

### 7.1 添加域名到 Cloudflare

1. 在 Cloudflare Dashboard 添加域名
2. 更新 DNS 伺服器到 Cloudflare
3. 等待 DNS 傳播（通常需要幾分鐘到幾小時）

### 7.2 配置 Workers 路由

在 `wrangler.toml` 中已配置路由：
```toml
routes = [
  { pattern = "nobodyclimb.com/*", zone_name = "nobodyclimb.com" }
]
```

或通過 Dashboard：
1. Workers & Pages → 選擇 Worker
2. Settings → Triggers
3. Add Custom Domain

### 7.3 SSL/TLS 設置

1. 在 Cloudflare Dashboard
2. SSL/TLS → Overview
3. 選擇 "Full (strict)" 模式

## 步驟 8：驗證部署

### 8.1 功能驗證清單

- [ ] 訪問生產域名 https://nobodyclimb.com
- [ ] 檢查所有頁面路由
- [ ] 測試 API 連接
- [ ] 驗證表單提交
- [ ] 檢查使用者登入流程
- [ ] 測試檔案上傳（如有）

### 8.2 性能驗證

```bash
# 使用 curl 測試回應時間
curl -w "@curl-format.txt" -o /dev/null -s https://nobodyclimb.com

# 使用 Lighthouse
# 在 Chrome DevTools 中運行 Lighthouse 審計
```

### 8.3 監控設置

在 Cloudflare Dashboard 中：
1. Analytics → Workers
2. 查看請求數、錯誤率、回應時間

## 步驟 9：設置 CI/CD

### 9.1 創建 GitHub Actions 工作流程

創建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Build
        run: pnpm run build:cf
        
      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          environment: ${{ github.ref == 'refs/heads/main' && 'production' || 'preview' }}
```

### 9.2 設置 GitHub Secrets

在 GitHub Repository Settings → Secrets 中添加：
- `CLOUDFLARE_API_TOKEN`：從 Cloudflare 獲取的 API Token

## 步驟 10：部署後維護

### 10.1 監控和日誌

```bash
# 查看實時日誌
wrangler tail

# 查看特定環境的日誌
wrangler tail --env production
```

### 10.2 更新部署

```bash
# 拉取最新代碼
git pull origin main

# 重新構建和部署
pnpm run build:cf
pnpm run deploy:production
```

### 10.3 回滾部署

```bash
# 查看部署歷史
wrangler deployments list

# 回滾到特定版本
wrangler rollback [deployment-id]
```

## 故障排除

### 常見問題

1. **構建失敗**
   ```bash
   # 清理並重試
   rm -rf .next .vercel node_modules
   pnpm install
   pnpm run build:cf
   ```

2. **部署大小超限**
   - 檢查並優化依賴
   - 使用動態導入減少包大小
   - 將大型靜態資源移至 R2

3. **環境變量未生效**
   - 確認變量名稱正確
   - 重新部署 Worker
   - 檢查變量是否在正確的環境中設置

4. **自定義域名不工作**
   - 檢查 DNS 設置
   - 確認路由規則正確
   - 等待 DNS 傳播完成

## 總結

完成以上步驟後，您的 Next.js 應用程式應該已成功部署到 Cloudflare Workers。請確保：

- ✅ 所有功能正常運作
- ✅ 監控和日誌已設置
- ✅ CI/CD 流程已建立
- ✅ 備份和回滾策略已準備
- ✅ 團隊成員已獲得必要的訪問權限

如需更多幫助，請參考：
- [Cloudflare Workers 文檔](https://developers.cloudflare.com/workers/)
- [Next.js on Cloudflare](https://developers.cloudflare.com/pages/framework-guides/nextjs/)

---

*最後更新：2025-08-17*