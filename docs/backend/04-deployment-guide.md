# Django REST Framework 部署指南

> 將 NobodyClimb 後端 API 部署到生產環境

## 目錄

- [部署平台選擇](#部署平台選擇)
- [Railway 部署（推薦）](#railway-部署推薦)
- [Heroku 部署](#heroku-部署)
- [DigitalOcean 部署](#digitalocean-部署)
- [環境配置](#環境配置)
- [資料庫設定](#資料庫設定)
- [靜態文件和媒體文件](#靜態文件和媒體文件)
- [生產環境最佳實踐](#生產環境最佳實踐)

---

## 開發環境設置

在部署到生產環境之前，先確保本地開發環境正確配置。

### 1. Python 虛擬環境

**為什麼需要虛擬環境？**

- 隔離項目依賴，避免版本衝突
- 類似 Node.js 的 `node_modules`

```bash
# 創建虛擬環境
python -m venv venv

# 啟動虛擬環境
# macOS/Linux:
source venv/bin/activate

# Windows:
venv\Scripts\activate

# 驗證（應該看到 (venv) 前綴）
which python  # 應該指向 venv/bin/python
```

**Node.js 對照：**

```bash
# Node.js 不需要虛擬環境，使用 node_modules
npm install
```

### 2. 安裝依賴

```bash
# 確保虛擬環境已啟動
pip install --upgrade pip

# 安裝生產依賴
pip install -r requirements.txt

# 安裝開發依賴（可選）
pip install -r requirements-dev.txt
```

### 3. PostgreSQL 本地安裝

**macOS (使用 Homebrew):**

```bash
# 安裝 PostgreSQL
brew install postgresql@15

# 啟動服務
brew services start postgresql@15

# 創建資料庫
createdb nobodyclimb_dev

# 連接測試
psql nobodyclimb_dev
```

**Ubuntu/Debian:**

```bash
# 安裝 PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# 啟動服務
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 切換到 postgres 用戶
sudo -u postgres psql

# 創建資料庫和用戶
CREATE DATABASE nobodyclimb_dev;
CREATE USER django_user WITH PASSWORD 'dev_password';
GRANT ALL PRIVILEGES ON DATABASE nobodyclimb_dev TO django_user;
```

**Windows:**

- 下載 [PostgreSQL Installer](https://www.postgresql.org/download/windows/)
- 使用 pgAdmin 創建資料庫

**Node.js 對照：**

```bash
# 類似安裝 MongoDB 或使用 SQLite
npm install sqlite3
```

### 4. 環境變數配置 (.env)

在項目根目錄創建 `.env` 文件：

```bash
# .env (開發環境)
DEBUG=True
SECRET_KEY=your-dev-secret-key-change-in-production
DATABASE_URL=postgresql://django_user:dev_password@localhost:5432/nobodyclimb_dev

# CORS（本地 Next.js 開發服務器）
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# 可選：Cloudflare R2（開發環境可跳過）
# CLOUDFLARE_R2_ACCESS_KEY_ID=your-key
# CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret
# CLOUDFLARE_R2_BUCKET_NAME=your-bucket
# CLOUDFLARE_R2_ENDPOINT_URL=https://your-account.r2.cloudflarestorage.com
```

**⚠️ 重要：** 確保 `.env` 已加入 `.gitignore`

```bash
# .gitignore
.env
venv/
__pycache__/
*.pyc
db.sqlite3
```

### 5. 執行遷移

```bash
# 創建遷移文件
python manage.py makemigrations

# 應用遷移
python manage.py migrate

# 創建超級用戶（管理員）
python manage.py createsuperuser
```

### 6. 啟動開發服務器

```bash
# 啟動 Django 開發服務器
python manage.py runserver

# 訪問
# API: http://localhost:8000/api/v1/
# Admin: http://localhost:8000/admin/
# API Docs: http://localhost:8000/api/docs/
```

**Node.js 對照：**

```bash
npm run dev  # 啟動 Express 服務器
```

### 7. 驗證設置

```bash
# 檢查配置
python manage.py check

# 檢查部署準備度
python manage.py check --deploy
```

---

## 部署平台選擇

### 平台比較

| 平台 | 價格 | 難度 | PostgreSQL | 推薦度 | 說明 |
|------|------|------|-----------|--------|------|
| **Railway** | 免費層 + 按量計費 | ⭐ 簡單 | ✅ 內建 | ⭐⭐⭐⭐⭐ | 最推薦，類似 Vercel 的體驗 |
| **Heroku** | 免費層取消，$7/月起 | ⭐⭐ 簡單 | ✅ 附加元件 | ⭐⭐⭐⭐ | 經典選擇，文檔完善 |
| **Render** | 免費層 + $7/月起 | ⭐ 簡單 | ✅ 內建 | ⭐⭐⭐⭐ | Heroku 的替代品 |
| **DigitalOcean** | $4/月起 | ⭐⭐⭐ 中等 | ✅ 需自行設定 | ⭐⭐⭐ | 較複雜但靈活 |
| **AWS/GCP** | 複雜計費 | ⭐⭐⭐⭐ 困難 | ✅ 需設定 | ⭐⭐ | 大型專案適用 |

### 推薦方案

**初學者 / 小型專案：** Railway 或 Render
**中型專案：** Heroku 或 DigitalOcean
**大型專案：** AWS / GCP / Azure

---

## Railway 部署（推薦）

Railway 提供最簡單的部署體驗，類似前端的 Vercel。

### 優點

- ✅ 自動偵測 Django 專案
- ✅ 內建 PostgreSQL 資料庫
- ✅ 自動生成環境變數
- ✅ Git 推送自動部署
- ✅ 免費額度充足（每月 $5 credit）
- ✅ 簡單直覺的 UI

### 部署步驟

#### 1. 準備專案

```bash
# 確保 requirements.txt 包含所有依賴
pip freeze > requirements.txt

# 創建 Procfile (告訴 Railway 如何啟動應用)
cat > Procfile << 'EOF'
web: gunicorn config.wsgi --log-file -
release: python manage.py migrate --noinput
EOF

# 創建 runtime.txt (指定 Python 版本)
cat > runtime.txt << 'EOF'
python-3.11.5
EOF

# 創建 railway.json (可選)
cat > railway.json << 'EOF'
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
EOF
```

**Node.js 對照：**

```json
// package.json
{
  "scripts": {
    "start": "node server.js"
  }
}
```

#### 2. 更新設定檔 (config/settings/production.py)

```python
# config/settings/production.py
from .base import *
import dj_database_url

# 安全設定
DEBUG = False
SECRET_KEY = config('SECRET_KEY')
ALLOWED_HOSTS = config('ALLOWED_HOSTS', cast=lambda v: [s.strip() for s in v.split(',')])

# 資料庫 - Railway 自動提供 DATABASE_URL
DATABASES = {
    'default': dj_database_url.config(
        default=config('DATABASE_URL'),
        conn_max_age=600,
        ssl_require=True
    )
}

# 靜態文件
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# 安全設定
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# CORS
CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    cast=lambda v: [s.strip() for s in v.split(',')]
)
```

**安裝 dj-database-url：**

```bash
pip install dj-database-url
# 更新 requirements.txt
pip freeze > requirements.txt
```

#### 3. 提交程式碼到 Git

```bash
git add .
git commit -m "準備部署到 Railway"
git push origin main
```

#### 4. 在 Railway 上部署

**方法一：透過 CLI（推薦）**

```bash
# 安裝 Railway CLI
npm install -g @railway/cli

# 登入
railway login

# 初始化專案
railway init

# 添加 PostgreSQL
railway add

# 選擇 PostgreSQL，Railway 會自動設定 DATABASE_URL

# 部署
railway up

# 查看日誌
railway logs

# 開啟應用
railway open
```

**方法二：透過 Web UI**

1. 訪問 [railway.app](https://railway.app/)
2. 點擊 "New Project"
3. 選擇 "Deploy from GitHub repo"
4. 選擇你的 repository
5. Railway 會自動偵測 Django 專案並開始部署
6. 點擊 "+ New" → "Database" → "Add PostgreSQL"
7. Railway 會自動設定 `DATABASE_URL` 環境變數

#### 5. 設定環境變數

在 Railway Dashboard 中設定以下環境變數：

```bash
# Django 設定
DJANGO_SETTINGS_MODULE=config.settings.production
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=your-app.railway.app,yourdomain.com

# CORS
CORS_ALLOWED_ORIGINS=https://nobodyclimb.cc,https://www.nobodyclimb.cc

# Cloudflare R2 (可選)
CLOUDFLARE_R2_ACCESS_KEY_ID=your-key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret
CLOUDFLARE_R2_BUCKET_NAME=your-bucket
CLOUDFLARE_R2_ENDPOINT_URL=https://your-account-id.r2.cloudflarestorage.com

# 其他
PYTHONUNBUFFERED=1
```

**如何生成 SECRET_KEY：**

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

#### 6. 運行遷移和創建超級用戶

```bash
# 連接到 Railway shell
railway run python manage.py migrate
railway run python manage.py createsuperuser

# 收集靜態文件
railway run python manage.py collectstatic --noinput
```

#### 7. 綁定自訂域名

1. 在 Railway Dashboard 中點擊 "Settings"
2. 點擊 "Domains" → "Generate Domain" 或 "Custom Domain"
3. 如果使用自訂域名，需要在 DNS 提供商設定：

```
CNAME記錄
名稱: api (或 @)
值: your-app.railway.app
```

#### 8. 持續部署

每次推送到 GitHub，Railway 會自動部署：

```bash
git add .
git commit -m "更新功能"
git push origin main
# Railway 自動部署！
```

---

## Heroku 部署

Heroku 是經典的 PaaS 平台，雖然取消了免費層，但依然是可靠的選擇。

### 部署步驟

#### 1. 安裝 Heroku CLI

```bash
# macOS
brew tap heroku/brew && brew install heroku

# 其他系統
# 訪問 https://devcenter.heroku.com/articles/heroku-cli
```

#### 2. 準備專案

```bash
# 創建 Procfile
cat > Procfile << 'EOF'
web: gunicorn config.wsgi
release: python manage.py migrate
EOF

# 創建 runtime.txt
echo "python-3.11.5" > runtime.txt

# 確保有 requirements.txt
pip freeze > requirements.txt
```

#### 3. 部署到 Heroku

```bash
# 登入
heroku login

# 創建 Heroku 應用
heroku create nobodyclimb-api

# 添加 PostgreSQL
heroku addons:create heroku-postgresql:mini

# 設定環境變數
heroku config:set DJANGO_SETTINGS_MODULE=config.settings.production
heroku config:set SECRET_KEY=your-secret-key
heroku config:set DEBUG=False
heroku config:set ALLOWED_HOSTS=nobodyclimb-api.herokuapp.com
heroku config:set CORS_ALLOWED_ORIGINS=https://nobodyclimb.cc

# 推送程式碼
git push heroku main

# 運行遷移
heroku run python manage.py migrate

# 創建超級用戶
heroku run python manage.py createsuperuser

# 打開應用
heroku open

# 查看日誌
heroku logs --tail
```

#### 4. Heroku 特定設定

```python
# config/settings/production.py
# Heroku 提供 DATABASE_URL 環境變數
import dj_database_url

DATABASES = {
    'default': dj_database_url.config(
        default=config('DATABASE_URL'),
        conn_max_age=600
    )
}

# Heroku 需要允許所有主機名（會由代理處理）
ALLOWED_HOSTS = ['*']  # 或使用環境變數
```

---

## DigitalOcean 部署

適合需要更多控制和彈性的進階用戶。

### 優點

- ✅ 價格透明（$4/月起）
- ✅ 完全控制伺服器
- ✅ 多種資料庫選項
- ✅ 可自訂配置

### 部署步驟概覽

#### 1. 創建 Droplet

```bash
# 使用 doctl CLI 或 Web UI
# 選擇：Ubuntu 22.04 LTS
# 最小規格：1GB RAM / 1 CPU ($6/月)
```

#### 2. 連接到伺服器

```bash
ssh root@your-server-ip
```

#### 3. 設定伺服器環境

```bash
# 更新系統
apt update && apt upgrade -y

# 安裝 Python 和依賴
apt install -y python3.11 python3.11-venv python3-pip postgresql postgresql-contrib nginx

# 創建應用用戶
adduser django
usermod -aG sudo django
su - django
```

#### 4. 部署應用

```bash
# 克隆程式碼
git clone https://github.com/your-username/nobodyclimb-backend.git
cd nobodyclimb-backend

# 創建虛擬環境
python3 -m venv venv
source venv/bin/activate

# 安裝依賴
pip install -r requirements.txt

# 設定環境變數
cat > .env << 'EOF'
SECRET_KEY=your-secret-key
DEBUG=False
ALLOWED_HOSTS=your-domain.com
DATABASE_URL=postgresql://user:password@localhost/nobodyclimb
EOF

# 運行遷移
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
```

#### 5. 設定 Gunicorn

```bash
# 創建 Gunicorn socket
sudo cat > /etc/systemd/system/gunicorn.socket << 'EOF'
[Unit]
Description=gunicorn socket

[Socket]
ListenStream=/run/gunicorn.sock

[Install]
WantedBy=sockets.target
EOF

# 創建 Gunicorn service
sudo cat > /etc/systemd/system/gunicorn.service << 'EOF'
[Unit]
Description=gunicorn daemon
Requires=gunicorn.socket
After=network.target

[Service]
User=django
Group=www-data
WorkingDirectory=/home/django/nobodyclimb-backend
ExecStart=/home/django/nobodyclimb-backend/venv/bin/gunicorn \
          --access-logfile - \
          --workers 3 \
          --bind unix:/run/gunicorn.sock \
          config.wsgi:application

[Install]
WantedBy=multi-user.target
EOF

# 啟動服務
sudo systemctl start gunicorn.socket
sudo systemctl enable gunicorn.socket
```

#### 6. 設定 Nginx

```bash
sudo cat > /etc/nginx/sites-available/nobodyclimb << 'EOF'
server {
    listen 80;
    server_name your-domain.com;

    location = /favicon.ico { access_log off; log_not_found off; }

    location /static/ {
        root /home/django/nobodyclimb-backend;
    }

    location /media/ {
        root /home/django/nobodyclimb-backend;
    }

    location / {
        include proxy_params;
        proxy_pass http://unix:/run/gunicorn.sock;
    }
}
EOF

# 啟用網站
sudo ln -s /etc/nginx/sites-available/nobodyclimb /etc/nginx/sites-enabled
sudo nginx -t
sudo systemctl restart nginx
```

#### 7. 設定 SSL (Let's Encrypt)

```bash
# 安裝 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 獲取 SSL 證書
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 自動續期
sudo certbot renew --dry-run
```

---

## 環境配置

### 環境變數清單

| 變數名稱 | 必需 | 說明 | 範例 |
|---------|------|------|------|
| `SECRET_KEY` | ✅ | Django 密鑰 | `django-insecure-xyz...` |
| `DEBUG` | ✅ | 調試模式 | `False` |
| `ALLOWED_HOSTS` | ✅ | 允許的主機名 | `api.nobodyclimb.cc,nobodyclimb.cc` |
| `DATABASE_URL` | ✅ | 資料庫連接 | `postgresql://user:pass@host:5432/db` |
| `DJANGO_SETTINGS_MODULE` | ✅ | 設定模組 | `config.settings.production` |
| `CORS_ALLOWED_ORIGINS` | ✅ | CORS 允許來源 | `https://nobodyclimb.cc` |
| `CLOUDFLARE_R2_*` | ❌ | R2 存儲配置 | (見下方) |

### .env 範例

```bash
# .env (生產環境)
SECRET_KEY=django-insecure-your-secret-key-here
DEBUG=False
DJANGO_SETTINGS_MODULE=config.settings.production
ALLOWED_HOSTS=api.nobodyclimb.cc,nobodyclimb.cc
DATABASE_URL=postgresql://user:password@host:5432/nobodyclimb

# CORS
CORS_ALLOWED_ORIGINS=https://nobodyclimb.cc,https://www.nobodyclimb.cc

# Cloudflare R2 (可選)
CLOUDFLARE_R2_ACCESS_KEY_ID=your-access-key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret-key
CLOUDFLARE_R2_BUCKET_NAME=nobodyclimb-media
CLOUDFLARE_R2_ENDPOINT_URL=https://account-id.r2.cloudflarestorage.com
```

---

## 資料庫設定

### PostgreSQL 本地開發

```bash
# macOS
brew install postgresql@15
brew services start postgresql@15

# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib

# 創建資料庫
sudo -u postgres psql
CREATE DATABASE nobodyclimb;
CREATE USER nobodyclimb_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE nobodyclimb TO nobodyclimb_user;
\q
```

### 資料庫備份與還原

```bash
# 備份
pg_dump -h localhost -U nobodyclimb_user nobodyclimb > backup.sql

# Railway 備份
railway run pg_dump $DATABASE_URL > backup.sql

# 還原
psql -h localhost -U nobodyclimb_user nobodyclimb < backup.sql

# Railway 還原
railway run psql $DATABASE_URL < backup.sql
```

### 遷移管理

```bash
# 創建遷移
python manage.py makemigrations

# 查看遷移 SQL
python manage.py sqlmigrate posts 0001

# 應用遷移
python manage.py migrate

# 回滾遷移
python manage.py migrate posts 0001

# 查看遷移狀態
python manage.py showmigrations
```

---

## 靜態文件和媒體文件

### 使用 Cloudflare R2 存儲

#### 1. 設定 R2 Bucket

1. 登入 Cloudflare Dashboard
2. 前往 R2 Object Storage
3. 創建新 Bucket：`nobodyclimb-media`
4. 生成 API Token

#### 2. 設定 Django

```python
# config/settings/production.py
# 媒體文件使用 R2
DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
AWS_ACCESS_KEY_ID = config('CLOUDFLARE_R2_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = config('CLOUDFLARE_R2_SECRET_ACCESS_KEY')
AWS_STORAGE_BUCKET_NAME = config('CLOUDFLARE_R2_BUCKET_NAME')
AWS_S3_ENDPOINT_URL = config('CLOUDFLARE_R2_ENDPOINT_URL')
AWS_S3_REGION_NAME = 'auto'
AWS_S3_FILE_OVERWRITE = False
AWS_DEFAULT_ACL = None

# 自訂域名（可選）
AWS_S3_CUSTOM_DOMAIN = f'{AWS_STORAGE_BUCKET_NAME}.r2.cloudflarestorage.com'
MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/'
```

#### 3. 安裝依賴

```bash
pip install django-storages boto3
pip freeze > requirements.txt
```

### 靜態文件管理

```bash
# 收集靜態文件
python manage.py collectstatic --noinput

# 測試靜態文件服務
python manage.py runserver --insecure  # 僅開發環境
```

---

## 生產環境最佳實踐

### 1. 安全檢查清單

```bash
# 運行 Django 安全檢查
python manage.py check --deploy

# 檢查項目：
# ✅ SECRET_KEY 不能在程式碼中
# ✅ DEBUG = False
# ✅ ALLOWED_HOSTS 正確設定
# ✅ SSL/HTTPS 啟用
# ✅ SECURE_* 設定正確
# ✅ 資料庫密碼強度
```

### 2. 效能優化

```python
# config/settings/production.py

# 資料庫連接池
DATABASES = {
    'default': {
        # ...
        'CONN_MAX_AGE': 600,  # 保持連接 10 分鐘
    }
}

# 快取設定 (Redis)
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': config('REDIS_URL', default='redis://127.0.0.1:6379/1'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}

# Session 使用快取
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'default'
```

### 3. 日誌記錄

```python
# config/settings/production.py

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}
```

### 4. 監控與錯誤追蹤

**使用 Sentry：**

```bash
pip install sentry-sdk
```

```python
# config/settings/production.py
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration

sentry_sdk.init(
    dsn=config('SENTRY_DSN'),
    integrations=[DjangoIntegration()],
    traces_sample_rate=1.0,
    send_default_pii=True
)
```

### 5. 健康檢查端點

```python
# apps/core/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.db import connection

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """健康檢查端點"""
    # 檢查資料庫
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        db_status = "ok"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return Response({
        'status': 'ok' if db_status == 'ok' else 'error',
        'database': db_status,
    })
```

```python
# config/urls.py
from apps.core.views import health_check

urlpatterns = [
    path('health/', health_check, name='health_check'),
    # ...
]
```

### 6. 自動部署工作流程

**GitHub Actions 範例：**

```yaml
# .github/workflows/deploy.yml
name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
      - name: Run tests
        run: |
          python manage.py test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Railway
        run: |
          npm i -g @railway/cli
          railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

---

## CORS 配置（前端集成）

### 什麼是 CORS？

CORS (Cross-Origin Resource Sharing) 允許前端應用（Next.js）從不同域名訪問後端 API。

**常見場景：**

- 開發環境：前端 `localhost:3000`，後端 `localhost:8000`
- 生產環境：前端 `nobodyclimb.cc`，後端 `api.nobodyclimb.cc`

### 安裝 django-cors-headers

```bash
pip install django-cors-headers
```

### 配置 CORS

**1. 添加到 INSTALLED_APPS：**

```python
# config/settings/base.py
INSTALLED_APPS = [
    # ...
    'corsheaders',  # 必須在 'django.contrib.staticfiles' 之前
    'django.contrib.staticfiles',
    # ...
]
```

**2. 添加到 MIDDLEWARE（順序很重要）：**

```python
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # 必須在最前面
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    # ...
]
```

**3. 配置允許的來源：**

```python
# config/settings/development.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",       # Next.js dev server
    "http://127.0.0.1:3000",
]

# config/settings/production.py
CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='',
    cast=lambda v: [s.strip() for s in v.split(',') if s.strip()]
)
# 環境變數範例：
# CORS_ALLOWED_ORIGINS=https://nobodyclimb.cc,https://www.nobodyclimb.cc
```

### 常見 CORS 配置選項

```python
# config/settings/base.py

# 1. 允許憑證（Cookies, Authorization headers）
CORS_ALLOW_CREDENTIALS = True

# 2. 允許的 HTTP 方法
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# 3. 允許的 Headers
CORS_ALLOW_HEADERS = [
    'accept',
    'authorization',
    'content-type',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# 4. 暴露的 Headers（讓前端可以訪問）
CORS_EXPOSE_HEADERS = [
    'Content-Type',
    'X-CSRFToken',
]

# 5. Preflight 請求緩存時間（秒）
CORS_PREFLIGHT_MAX_AGE = 86400  # 24 小時
```

### 開發環境寬鬆配置（不推薦用於生產）

```python
# config/settings/development.py (僅供開發測試)

# ⚠️ 警告：這會允許所有來源，僅供開發使用
CORS_ALLOW_ALL_ORIGINS = True

# ⚠️ 或使用正則表達式匹配
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^http://localhost:\d+$",
    r"^http://127\.0\.0\.1:\d+$",
]
```

### Next.js + Django CORS 完整範例

**Backend (Django):**

```python
# config/settings/production.py
CORS_ALLOWED_ORIGINS = [
    'https://nobodyclimb.cc',
    'https://www.nobodyclimb.cc',
]
CORS_ALLOW_CREDENTIALS = True
```

**Frontend (Next.js):**

```typescript
// src/lib/api.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  withCredentials: true,  // 發送 cookies
});

// 自動添加 JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 驗證 CORS 配置

**1. 使用瀏覽器開發者工具：**

```javascript
// 在瀏覽器 Console 測試
fetch('http://localhost:8000/api/v1/posts/', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('CORS Error:', error));
```

**2. 檢查響應 Headers：**

正確的 CORS 響應應包含：

```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
```

### 常見 CORS 錯誤

**錯誤 1：**

```
Access to fetch at 'http://localhost:8000/api/v1/posts/' from origin 
'http://localhost:3000' has been blocked by CORS policy
```

**解決方法：**

- 確保 `CORS_ALLOWED_ORIGINS` 包含前端域名
- 檢查 `corsheaders` 是否在 `INSTALLED_APPS` 中
- 檢查 `CorsMiddleware` 是否在 `MIDDLEWARE` 第一位

**錯誤 2：**

```
The 'Access-Control-Allow-Origin' header contains multiple values
```

**解決方法：**

- 不要同時使用 `CORS_ALLOW_ALL_ORIGINS = True` 和 `CORS_ALLOWED_ORIGINS`
- 檢查是否有多個 CORS 中介軟體

**錯誤 3：Preflight OPTIONS 請求失敗**

**解決方法：**

```python
# 確保 OPTIONS 方法被允許
CORS_ALLOW_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
```

### Node.js/Express 對照

**Express CORS:**

```javascript
const cors = require('cors');

app.use(cors({
  origin: ['http://localhost:3000', 'https://nobodyclimb.cc'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
```

**Django CORS (更簡單的配置):**

```python
# 只需要在 settings.py 配置，無需在每個 view 處理
CORS_ALLOWED_ORIGINS = [...]
```

---

## 常見問題排查

### 1. 靜態文件 404

```bash
# 確保收集了靜態文件
python manage.py collectstatic --noinput

# 檢查 STATIC_ROOT 設定
python manage.py diffsettings | grep STATIC
```

### 2. 資料庫連接錯誤

```bash
# 測試資料庫連接
python manage.py dbshell

# 檢查 DATABASE_URL
echo $DATABASE_URL
```

### 3. CORS 錯誤

```python
# 確保 corsheaders 在 INSTALLED_APPS 和 MIDDLEWARE 中
# 檢查 CORS_ALLOWED_ORIGINS 設定
```

### 4. 查看日誌

```bash
# Railway
railway logs

# Heroku
heroku logs --tail

# DigitalOcean
sudo journalctl -u gunicorn
sudo tail -f /var/log/nginx/error.log
```

---

## 下一步

- [測試指南](./05-testing-guide.md) - 編寫和運行測試
- [API 文檔](./06-api-documentation.md) - 生成和維護 API 文檔
- [性能優化](./07-performance-optimization.md) - 提升 API 性能

---

## 資源連結

- [Railway 文檔](https://docs.railway.app/)
- [Heroku Django 部署指南](https://devcenter.heroku.com/articles/django-app-configuration)
- [DigitalOcean Django 教程](https://www.digitalocean.com/community/tutorials/how-to-set-up-django-with-postgres-nginx-and-gunicorn-on-ubuntu)
- [Django 部署檢查清單](https://docs.djangoproject.com/en/5.0/howto/deployment/checklist/)
