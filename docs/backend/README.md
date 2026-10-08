> ⚠️ 過時：本專案 backend 為 Hono + Cloudflare D1，請以 backend/src 與 project-rules 為準

# NobodyClimb 後端 API 開發指南

> 完整的 Django REST Framework 後端實作文檔，專為 Node.js 開發者設計

## 📚 文檔目錄

### 1. [Django 基礎教程 - 給 Node.js 開發者](./01-django-basics-for-nodejs-developers.md)

**適合對象：** 熟悉 Node.js 但不熟悉 Django 的開發者

**內容包含：**

- Django vs Node.js 概念對比
- Python 基礎速成（從 JavaScript 角度）
- Django 核心概念（MTV 架構）
- Django REST Framework 介紹
- 常用命令對照表

**學習時間：** 約 2-3 小時

---

### 2. [Django REST Framework 專案規劃](./02-project-structure-and-planning.md)

**適合對象：** 已了解基礎概念，準備開始專案的開發者

**內容包含：**

- 專案概述與技術棧選擇
- 完整專案結構設計
- 資料庫設計與 ER 圖
- API 端點規劃
- 認證與權限設計

**學習時間：** 約 3-4 小時

---

### 3. [API 實作指南](./03-api-implementation-guide.md)

**適合對象：** 準備動手寫程式碼的開發者

**內容包含：**

- 專案初始化步驟
- 配置文件設定
- 用戶認證實作
- CRUD API 完整範例
- 過濾、搜索、分頁功能
- 檔案上傳處理

**學習時間：** 約 5-6 小時（含實作）

---

### 4. [部署指南](./04-deployment-guide.md)

**適合對象：** 需要將 API 部署到生產環境的開發者

**內容包含：**

- 開發環境設置（虛擬環境、PostgreSQL）
- 部署平台比較與選擇
- Railway / Heroku / DigitalOcean 部署
- 環境配置與資料庫設定
- CORS 配置（前端集成）
- 靜態文件與媒體文件處理
- 生產環境最佳實踐

**學習時間：** 約 3-4 小時

---

### 5. [測試指南](./05-testing-guide.md)

**適合對象：** 需要為 API 編寫測試的開發者

**內容包含：**

- pytest 介紹（給 Node.js 開發者）
- pytest-django 設置與配置
- 單元測試（Model、Serializer、Permission）
- 整合測試（API 端點、認證流程）
- 測試資料工廠（factory_boy）
- 持續整合（GitHub Actions）

**學習時間：** 約 2-3 小時

---

### 6. [前端集成指南](./06-frontend-integration.md)

**適合對象：** 需要將 Next.js 前端與 Django API 整合的開發者

**內容包含：**

- TypeScript 類型生成
- Axios API 客戶端設置
- JWT 認證流程（Zustand）
- 自動 Token 刷新
- TanStack Query 整合
- 錯誤處理模式
- 開發工作流程（API Mocks）

**學習時間：** 約 2-3 小時

---

## 🚀 快速開始

### 前置需求

```bash
# 檢查 Python 版本（需要 3.9+）
python3 --version

# 檢查 pip
pip --version

# 檢查 PostgreSQL（可選，也可使用 SQLite 開發）
psql --version
```

### 5 分鐘快速啟動

```bash
# 1. 創建專案目錄
mkdir nobodyclimb-backend && cd nobodyclimb-backend

# 2. 創建虛擬環境
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 3. 安裝 Django 和 DRF
pip install django djangorestframework djangorestframework-simplejwt

# 4. 創建專案
django-admin startproject config .
python manage.py startapp users

# 5. 運行開發伺服器
python manage.py migrate
python manage.py runserver

# 訪問 http://localhost:8000
```

---

## 📖 學習路徑

### 路徑 A：快速入門（適合趕時間的開發者）

1. ⏱️ **30 分鐘** - 閱讀 [Django 基礎教程](./01-django-basics-for-nodejs-developers.md) 的「概念對比」和「Python 速成」部分
2. ⏱️ **1 小時** - 閱讀 [專案規劃](./02-project-structure-and-planning.md) 的「資料庫設計」和「API 端點規劃」
3. ⏱️ **2 小時** - 跟著 [API 實作指南](./03-api-implementation-guide.md) 實作一個簡單的用戶認證 API
4. ⏱️ **30 分鐘** - 部署到 Railway（參考 [部署指南](./04-deployment-guide.md)）

**總時間：約 4 小時，可以啟動一個基本的 API**

### 路徑 B：深入學習（適合想要全面理解的開發者）

1. ⏱️ **2-3 小時** - 完整閱讀 [Django 基礎教程](./01-django-basics-for-nodejs-developers.md)
2. ⏱️ **1 小時** - 練習 Python 基礎語法
3. ⏱️ **3-4 小時** - 詳細學習 [專案規劃](./02-project-structure-and-planning.md)
4. ⏱️ **5-6 小時** - 完整實作 [API 實作指南](./03-api-implementation-guide.md) 的所有範例
5. ⏱️ **3-4 小時** - 學習並實踐 [部署指南](./04-deployment-guide.md)
6. ⏱️ **2-3 小時** - 學習 [測試指南](./05-testing-guide.md) 編寫測試
7. ⏱️ **2-3 小時** - 學習 [前端集成指南](./06-frontend-integration.md) 整合 Next.js

**總時間：約 20-26 小時，可以建立一個完整的全棧應用**

---

## 🏗️ 專案架構概覽

```
nobodyclimb-backend/          # 專案根目錄
├── manage.py                 # Django 管理腳本
├── requirements.txt          # Python 依賴
├── .env                      # 環境變數
├── Procfile                  # 部署配置
│
├── config/                   # 專案配置
│   ├── settings/             # 分環境配置
│   │   ├── base.py          # 基礎配置
│   │   ├── development.py   # 開發環境
│   │   └── production.py    # 生產環境
│   ├── urls.py              # 主路由
│   └── wsgi.py              # WSGI 入口
│
└── apps/                     # 應用目錄
    ├── users/               # 用戶應用
    │   ├── models.py        # 資料模型
    │   ├── serializers.py   # 序列化器（類似 Zod）
    │   ├── views.py         # 視圖（類似 Controller）
    │   └── urls.py          # 路由
    ├── posts/               # 文章應用
    ├── gyms/                # 攀岩館應用
    ├── galleries/           # 相簿應用
    └── core/                # 核心功能（共享）
```

---

## 🎯 核心功能實作狀態

### Phase 1: 基礎設施 ✅

- [x] 專案結構設計
- [x] 資料庫模型設計
- [x] API 端點規劃
- [x] 認證系統設計

### Phase 2: 用戶系統 🔄

**實作步驟：**

```bash
# 1. 創建 User 模型
# 參考：02-project-structure-and-planning.md → 資料庫設計

# 2. 實作序列化器
# 參考：03-api-implementation-guide.md → 用戶認證

# 3. 實作視圖
# 參考：03-api-implementation-guide.md → 認證視圖

# 4. 配置路由
# 參考：03-api-implementation-guide.md → 認證路由

# 5. 測試 API
curl -X POST http://localhost:8000/api/v1/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"username": "test", "email": "test@example.com", "password": "Test123456", "password_confirm": "Test123456"}'
```

### Phase 3: 內容系統 📝

- [ ] 文章 CRUD API
- [ ] 攀岩館 CRUD API
- [ ] 相簿 CRUD API
- [ ] 評論系統
- [ ] 搜索功能

**實作優先順序：**

1. 文章系統（最重要）
2. 評論系統
3. 攀岩館系統
4. 相簿系統
5. 搜索功能

### Phase 4: 進階功能 🚀

- [x] 檔案上傳（Cloudflare R2）
- [x] API 文檔自動生成（drf-spectacular）
- [x] 單元測試（pytest）
- [ ] 快取系統（Redis）
- [ ] 全文搜索（PostgreSQL）

---

## 🔧 技術棧

### 後端框架

| 技術 | 版本 | 用途 |
|------|------|------|
| Django | 5.0+ | Web 框架 |
| Django REST Framework | 3.14+ | REST API 框架 |
| PostgreSQL | 15+ | 資料庫 |
| Redis | 7+ | 快取 |

### 認證與安全

| 技術 | 用途 |
|------|------|
| JWT (Simple JWT) | 無狀態認證 |
| Django CORS Headers | 跨域處理 |
| Django Security Middleware | 安全防護 |

### 部署與運維

| 服務 | 用途 |
|------|------|
| Railway | 應用託管（推薦） |
| Cloudflare R2 | 檔案存儲 |
| Sentry | 錯誤追蹤 |
| GitHub Actions | CI/CD |

---

## 📊 API 端點概覽

### 認證 API

```
POST   /api/v1/auth/register/              註冊
POST   /api/v1/auth/login/                 登入
POST   /api/v1/auth/refresh/               刷新 token
GET    /api/v1/auth/me/                    當前用戶
PUT    /api/v1/auth/profile/               更新資料
```

### 用戶 API

```
GET    /api/v1/users/                      用戶列表
GET    /api/v1/users/:id/                  用戶詳情
GET    /api/v1/users/:id/posts/            用戶的文章
GET    /api/v1/users/:id/galleries/        用戶的相簿
```

### 文章 API

```
GET    /api/v1/posts/                      文章列表
POST   /api/v1/posts/                      創建文章
GET    /api/v1/posts/:id/                  文章詳情
PUT    /api/v1/posts/:id/                  更新文章
DELETE /api/v1/posts/:id/                  刪除文章
POST   /api/v1/posts/:id/like/             點讚
```

### 其他 API

- 攀岩館 API：`/api/v1/gyms/`
- 相簿 API：`/api/v1/galleries/`
- 評論 API：`/api/v1/comments/`
- 視頻 API：`/api/v1/videos/`
- 搜索 API：`/api/v1/search/`

**完整 API 文檔：** 部署後訪問 `/api/docs/` 查看 Swagger UI

---

## 🧪 測試與開發

### 運行測試

```bash
# 運行所有測試
python manage.py test

# 運行特定應用的測試
python manage.py test apps.users

# 帶覆蓋率報告
coverage run --source='.' manage.py test
coverage report
```

### 開發工具

```bash
# Django shell（類似 Node REPL）
python manage.py shell

# 資料庫 shell
python manage.py dbshell

# 創建超級用戶
python manage.py createsuperuser

# 檢查專案問題
python manage.py check

# 查看所有 URL
python manage.py show_urls
```

---

## 🐛 常見問題

### Q1: 為什麼選擇 Django 而不是 FastAPI？

**A:** Django 提供完整的生態系統：

- ✅ 內建強大的 ORM
- ✅ 完善的管理後台
- ✅ 成熟的認證系統
- ✅ 豐富的第三方套件
- ✅ 適合中大型專案

FastAPI 更適合微服務和效能要求極高的場景。

### Q2: Django 比 Node.js 慢嗎？

**A:** 不一定：

- Django 單請求效能略低於 Node.js
- 但透過快取（Redis）、資料庫優化可以達到相近效能
- Django ORM 比手寫 SQL 更安全且易維護
- 對於大多數應用，瓶頸在資料庫而非框架

### Q3: 如何從 Node.js 遷移到 Django？

**A:** 逐步遷移：

1. 先熟悉 Python 語法（1-2 天）
2. 理解 Django 概念（2-3 天）
3. 實作簡單 API（3-5 天）
4. 逐步遷移現有功能

參考文檔：[Django 基礎教程](./01-django-basics-for-nodejs-developers.md)

### Q4: 需要學習 Python 到什麼程度？

**A:** 基礎即可：

- ✅ 變數、函數、類別
- ✅ 列表、字典操作
- ✅ 模組導入
- ✅ 基本錯誤處理

Django 會幫你處理大部分複雜的 Python 特性。

### Q5: 部署費用大概多少？

**A:** 依平台而異：

| 平台 | 免費層 | 付費最低 | 推薦配置 |
|------|--------|----------|----------|
| Railway | $5 credit/月 | 按量計費 | ~$10-20/月 |
| Render | 免費（限制多） | $7/月 | $7/月起 |
| Heroku | ❌ | $7/月 | $16/月起 |
| DigitalOcean | ❌ | $4/月 | $12/月起 |

**推薦：** Railway，初期免費額度足夠使用。

---

## 📚 學習資源

### 官方文檔

- [Django 官方文檔](https://docs.djangoproject.com/) - 最權威的參考
- [DRF 官方文檔](https://www.django-rest-framework.org/) - REST API 開發
- [Python 官方教程](https://docs.python.org/3/tutorial/) - Python 基礎

### 推薦教程

- [Django for Beginners](https://djangoforbeginners.com/) - 適合初學者
- [Two Scoops of Django](https://www.feldroy.com/books/two-scoops-of-django-3-x) - 最佳實踐
- [TestDriven.io](https://testdriven.io/) - 進階教程

### 影片教程

- [Corey Schafer - Django Tutorials](https://www.youtube.com/playlist?list=PL-osiE80TeTtoQCKZ03TU5fNfx2UY6U4p)
- [Tech With Tim - Django REST Framework](https://www.youtube.com/playlist?list=PLzMcBGfZo4-kQkZp-j9PNyKq7Yw5VYjq9)

### 社群

- [Django Forum](https://forum.djangoproject.com/)
- [r/django (Reddit)](https://www.reddit.com/r/django/)
- [Django Discord](https://discord.gg/xcRH6mN4fa)

---

## 🤝 貢獻與支援

### 回報問題

如果在使用文檔過程中遇到問題：

1. 檢查 [常見問題](#常見問題) 章節
2. 搜尋 [Django 官方文檔](https://docs.djangoproject.com/)
3. 在專案 Issues 中回報

### 改進文檔

歡迎提交 Pull Request 改進文檔：

- 修正錯誤
- 補充範例
- 翻譯其他語言
- 新增最佳實踐

---

## 📝 版本記錄

### v1.0.0 (2025-01-15)

- ✅ 完成基礎教程文檔
- ✅ 完成專案規劃文檔
- ✅ 完成實作指南文檔
- ✅ 完成部署指南文檔

### 待辦事項

- [ ] 測試指南文檔
- [ ] API 文檔自動生成教程
- [ ] 性能優化指南
- [ ] 安全最佳實踐
- [ ] 視頻教程

---

## 📄 授權

本文檔採用 [MIT License](LICENSE) 授權。

---

## 🎉 開始你的 Django 之旅

選擇適合你的學習路徑，開始建構強大的 REST API！

**推薦起點：** [Django 基礎教程 - 給 Node.js 開發者](./01-django-basics-for-nodejs-developers.md)

---

**專案資訊**

- **前端專案：** [nobodyclimb-fe](../../README.md)
- **後端 API：** 本文檔
- **官方網站：** [nobodyclimb.cc](https://nobodyclimb.cc)

有任何問題或建議，歡迎聯繫開發團隊！
