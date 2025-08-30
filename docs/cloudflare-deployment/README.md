# Cloudflare Workers 部署指南

## 專案概述

本專案是一個 Next.js 應用程式，將部署到 Cloudflare Workers 上運行。Cloudflare Workers 提供全球邊緣運算能力，可讓應用程式在全球各地的數據中心運行，提供更快的回應速度。

## 架構說明

### 技術棧

- **前端框架**: Next.js 14
- **樣式**: Tailwind CSS
- **狀態管理**: Zustand
- **API 客戶端**: Axios + React Query
- **部署平台**: Cloudflare Workers
- **邊緣運行時**: Cloudflare Workers Runtime

### 部署架構

```
用戶請求 → Cloudflare CDN → Workers Runtime → Next.js App
                                    ↓
                              靜態資源 (R2/CDN)
```

## 主要優勢

1. **全球邊緣部署**: 應用程式在全球 300+ 個數據中心運行
2. **零冷啟動**: Workers 提供極快的啟動時間
3. **自動擴展**: 根據流量自動調整資源
4. **內建 DDoS 防護**: Cloudflare 提供企業級安全防護
5. **成本效益**: 按請求計費，適合各種規模的應用

## 部署前準備

### 必要條件

- Cloudflare 帳號
- Wrangler CLI 工具
- Node.js 18+
- pnpm 或 npm

### 環境變量

需要在 Cloudflare Workers 中配置以下環境變量：

- `NEXT_PUBLIC_API_URL`: 後端 API 地址
- `NODE_ENV`: 運行環境 (production/development)

## 相關文件

- [部署任務清單](./deployment-checklist.md) - 完整的部署檢查清單
- [環境配置指南](./environment-setup.md) - 詳細的環境設置步驟
- [部署步驟說明](./deployment-steps.md) - 逐步部署指南

## 支援與維護

### 監控

- 使用 Cloudflare Analytics 監控流量和性能
- 設置 Workers 錯誤追蹤

### 更新部署

- 使用 GitHub Actions 自動化部署流程
- 實施藍綠部署策略確保零停機時間

## 注意事項

1. **Edge Runtime 限制**:
   - 某些 Node.js API 在 Workers 中不可用
   - 需要確保所有依賴都兼容 Edge Runtime

2. **靜態資源處理**:
   - 建議將大型靜態資源存儲在 R2 或使用 CDN
   - 優化圖片和字體文件大小

3. **API 路由**:
   - 確保 API 路由正確配置
   - 考慮使用 Cloudflare Workers KV 進行緩存

## 快速開始

```bash
# 安裝依賴
pnpm install

# 安裝 Wrangler CLI
pnpm add -g wrangler

# 登入 Cloudflare
wrangler login

# 部署到 Workers
pnpm run deploy
```

詳細步驟請參考 [部署步驟說明](./deployment-steps.md)。
