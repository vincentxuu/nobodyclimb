# Cloudflare Workers 部署完成

您的專案現已配置為可部署到 Cloudflare Workers。以下是已完成的配置：

## ✅ 已完成的配置

### 1. 專案配置文件
- ✅ `wrangler.toml` - Cloudflare Workers 配置
- ✅ `next.config.js` - 更新支援 Edge Runtime
- ✅ `package.json` - 添加 Cloudflare 建構和部署腳本
- ✅ `.env.local` - 開發環境變數
- ✅ `.env.production` - 生產環境變數

### 2. Edge Runtime 配置
- ✅ 所有動態路由 (`/biography/profile/[id]`, `/blog/[id]`, `/crag/[id]`, `/gym/[id]`, `/blog/edit/[id]`) 已配置 Edge Runtime

### 3. GitHub Actions
- ✅ `.github/workflows/deploy.yml` - 自動化部署工作流程

### 4. 建構驗證
- ✅ Cloudflare 建構測試通過
- ✅ 生成的 Workers 文件檢查完成

## 🚀 部署步驟

### 前置需求
1. **Cloudflare 帳號設置**：
   ```bash
   # 安裝 Wrangler CLI（如尚未安裝）
   npm install -g wrangler
   
   # 登入 Cloudflare
   wrangler login
   ```

2. **環境變數設置**：
   - 在 Cloudflare Dashboard 中設置 `NEXT_PUBLIC_API_URL`
   - 如需要，設置其他環境變數

### 本地測試
```bash
# 建構 Cloudflare 版本
pnpm run build:cf

# 本地預覽
pnpm run preview
```

### 手動部署
```bash
# 部署到預覽環境
pnpm run deploy:preview

# 部署到生產環境  
pnpm run deploy:production
```

### GitHub Actions 自動部署
1. 在 GitHub Repository Settings → Secrets 中添加：
   - `CLOUDFLARE_API_TOKEN`：您的 Cloudflare API Token

2. 推送到 `main` 分支將自動觸發生產環境部署
3. Pull Request 將觸發預覽環境部署

## 📋 部署檢查清單

在首次部署前，請確認：

- [ ] Wrangler CLI 已安裝並登入
- [ ] Cloudflare 環境變數已設置
- [ ] GitHub Secrets 已配置（如使用 GitHub Actions）
- [ ] 域名已添加到 Cloudflare（如使用自定義域名）

## 🔧 常用指令

```bash
# 開發
pnpm dev

# 建構 Cloudflare 版本
pnpm run build:cf

# 本地預覽 Workers
pnpm run preview

# 部署到預覽環境
pnpm run deploy:preview

# 部署到生產環境
pnpm run deploy:production

# 檢查 Wrangler 狀態
wrangler whoami

# 查看部署日誌
wrangler tail
```

## 📖 相關文檔

詳細的部署指南和故障排除，請參考：
- [`docs/cloudflare-deployment/`](./docs/cloudflare-deployment/) - 完整部署文檔
- [Cloudflare Workers 文檔](https://developers.cloudflare.com/workers/)
- [Next.js on Cloudflare](https://developers.cloudflare.com/pages/framework-guides/nextjs/)

## 🎉 完成！

您的專案現在已準備好部署到 Cloudflare Workers。執行 `pnpm run deploy:production` 開始部署到生產環境。