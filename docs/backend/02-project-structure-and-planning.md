# Django REST Framework 專案規劃

> NobodyClimb 攀岩社群後端 API 設計與架構規劃

## 目錄

- [專案概述](#專案概述)
- [技術棧](#技術棧)
- [專案結構](#專案結構)
- [資料庫設計](#資料庫設計)
- [API 端點規劃](#api-端點規劃)
- [認證與權限](#認證與權限)

---

## 專案概述

### 專案資訊

- **專案名稱**: NobodyClimb Backend API
- **框架**: Django 5.0 + Django REST Framework 3.14
- **資料庫**: PostgreSQL 15
- **認證方式**: JWT (JSON Web Token)
- **部署平台**: Railway / Heroku / DigitalOcean

### 核心功能模組

1. **使用者系統** - 註冊、登入、個人資料管理
2. **文章系統** - 部落格文章的 CRUD 操作
3. **攀岩館系統** - 攀岩館資訊管理
4. **相簿系統** - 圖片相簿管理
5. **評論系統** - 多類型內容評論
6. **影片系統** - YouTube 影片整合
7. **搜尋系統** - 全站搜尋功能
8. **岩場系統** - 戶外岩場資訊（未來擴充）

---

## 技術棧

### 核心依賴

```python
# requirements.txt
Django==5.0.8
djangorestframework==3.14.0
djangorestframework-simplejwt==5.3.1  # JWT 認證
django-cors-headers==4.3.1            # CORS 跨域
django-filter==24.2                   # 過濾和搜尋
django-storages==1.14.3               # 雲存储 (AWS S3/Cloudflare R2)
boto3==1.34.142                       # AWS SDK
psycopg2-binary==2.9.9                # PostgreSQL 驅動程式
Pillow==10.4.0                        # 圖片處理
python-decouple==3.8                  # 環境變數管理
drf-spectacular==0.27.2               # API 檔案自動生成
gunicorn==22.0.0                      # WSGI 伺服器
whitenoise==6.7.0                     # 靜態檔案服務
redis==5.0.7                          # 快取
celery==5.4.0                         # 非同步任務
```

### 開發環境依賴

```python
# requirements-dev.txt
pytest==8.2.2
pytest-django==4.8.0
black==24.4.2                         # 程式碼格式化
flake8==7.1.0                         # 程式碼檢查
ipython==8.26.0                       # 互動式 shell
django-debug-toolbar==4.4.6           # 除錯工具
factory-boy==3.3.0                    # 測試資料生成
```

### Node.js 對照

| Django | Node.js 等價 |
|--------|-------------|
| Django | Express / Fastify |
| DRF | Express + validation |
| django-cors-headers | cors |
| psycopg2 | pg |
| Pillow | sharp |
| python-decouple | dotenv |
| drf-spectacular | swagger-jsdoc |
| gunicorn | pm2 |
| pytest | jest |
| black | prettier |
| flake8 | eslint |

---

## 專案結構

### 完整目錄結構

```
nobodyclimb-backend/
├── manage.py                      # Django 管理腳本
├── requirements.txt               # 生產環境依賴
├── requirements-dev.txt           # 開發環境依賴
├── .env.example                   # 環境變數範例
├── .gitignore
├── README.md
├── Procfile                       # 部署配置 (Heroku/Railway)
├── runtime.txt                    # Python 版本
├── pytest.ini                     # 測試配置
│
├── config/                        # 專案配置目錄
│   ├── __init__.py
│   ├── settings/                  # 分環境配置
│   │   ├── __init__.py
│   │   ├── base.py               # 基礎配置
│   │   ├── development.py        # 開發環境
│   │   ├── production.py         # 生產環境
│   │   └── test.py               # 測試環境
│   ├── urls.py                   # 根路由
│   ├── wsgi.py                   # WSGI 入口
│   └── asgi.py                   # ASGI 入口 (WebSocket)
│
├── apps/                          # 應用目錄
│   ├── __init__.py
│   │
│   ├── users/                     # 使用者應用
│   │   ├── __init__.py
│   │   ├── models.py             # User 模型
│   │   ├── serializers.py        # 序列化器
│   │   ├── views.py              # 視圖
│   │   ├── urls.py               # 路由
│   │   ├── permissions.py        # 權限
│   │   ├── admin.py              # 後台管理
│   │   ├── signals.py            # 信號處理
│   │   ├── tests/                # 測試
│   │   │   ├── __init__.py
│   │   │   ├── test_models.py
│   │   │   ├── test_views.py
│   │   │   └── test_serializers.py
│   │   └── migrations/           # 資料庫遷移
│   │       └── __init__.py
│   │
│   ├── posts/                     # 文章應用
│   │   ├── models.py             # Post, Tag 模型
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── filters.py            # 自訂過濾器
│   │   └── ...
│   │
│   ├── gyms/                      # 攀岩館應用
│   │   ├── models.py             # Gym, Review 模型
│   │   └── ...
│   │
│   ├── galleries/                 # 相簿應用
│   │   ├── models.py             # Gallery, Image 模型
│   │   └── ...
│   │
│   ├── comments/                  # 評論應用
│   │   ├── models.py             # Comment 模型
│   │   └── ...
│   │
│   ├── videos/                    # 影片應用
│   │   ├── models.py             # Video 模型
│   │   └── ...
│   │
│   └── core/                      # 核心功能 (共享)
│       ├── __init__.py
│       ├── models.py             # 抽象基底類別
│       ├── permissions.py        # 通用權限
│       ├── pagination.py         # 分頁器
│       ├── mixins.py             # 視圖混入
│       └── utils.py              # 工具函式
│
├── media/                         # 使用者上傳檔案 (開發環境)
├── staticfiles/                   # 靜態檔案收集目錄
│
└── docs/                          # API 檔案
    └── api_examples.md
```

### Django App 組織邏輯

Django 使用 **App** 概念來組織功能模組，類似 Node.js 中的功能模組（feature modules）。每個 App 是一個獨立的功能單元，包含該功能的所有相關代碼。

#### App 設計原則

1. **按功能領域劃分** - 每個 App 對應一個業務領域
2. **高內聚低耦合** - App 內部高度相關，App 之間耦合度低
3. **可重用性** - App 可以在不同項目中重用
4. **明確的職責** - 每個 App 有清晰的單一職責

#### NobodyClimb 的 App 劃分

| Django App | 職責 | 主要模型 | Node.js 等價 |
|-----------|------|---------|-------------|
| `users/` | 使用者管理 | User, Bookmark | `src/modules/users/` |
| `posts/` | 文章系統 | Post, Tag | `src/modules/posts/` |
| `gyms/` | 攀岩館系統 | Gym | `src/modules/gyms/` |
| `galleries/` | 相簿系統 | Gallery, Image | `src/modules/galleries/` |
| `comments/` | 評論系統 | Comment | `src/modules/comments/` |
| `videos/` | 影片系統 | Video | `src/modules/videos/` |
| `core/` | 共享功能 | BaseModel, mixins | `src/shared/` 或 `src/common/` |

#### 單一 App 內部結構

```python
apps/posts/              # App 根目錄
├── __init__.py
├── models.py           # 數據模型（Post, Tag）
├── serializers.py      # DRF 序列化器
├── views.py            # 視圖（ViewSets）
├── urls.py             # URL 路由
├── permissions.py      # 自定義權限
├── filters.py          # 查詢過濾器
├── admin.py            # Django Admin 配置
├── signals.py          # 信號處理器（事件監聽）
├── tests/              # 測試
│   ├── __init__.py
│   ├── test_models.py
│   ├── test_views.py
│   └── test_serializers.py
└── migrations/         # 數據庫遷移文件
    └── __init__.py
```

**Node.js Express 對照：**

```
src/modules/posts/      # 功能模組
├── post.model.js       → models.py
├── post.controller.js  → views.py
├── post.routes.js      → urls.py
├── post.service.js     → （Django 中通常在 models.py 或 views.py）
├── post.validator.js   → serializers.py
├── post.middleware.js  → permissions.py
└── __tests__/          → tests/
```

#### App 之間的通信

**❌ 錯誤方式：直接導入其他 App 的內部細節**

```python
# apps/comments/views.py
from apps.posts.models import Post  # ✅ 可以
from apps.posts.serializers import PostSerializer  # ⚠️ 避免
```

**✅ 正確方式：通過 API 或共享接口**

```python
# apps/comments/views.py
from apps.posts.models import Post  # 只導入模型
from django.contrib.contenttypes.models import ContentType

# 使用 GenericForeignKey 實現鬆耦合
content_type = ContentType.objects.get_for_model(Post)
```

#### 類比 Node.js 專案結構

```
# Node.js Express 專案                 Django 專案
src/
├── index.js                          → manage.py
├── app.js                            → config/wsgi.py
├── config/
│   ├── database.js                   → config/settings/base.py
│   └── environment.js                → .env + python-decouple
├── routes/
│   ├── index.js                      → config/urls.py
│   └── users.js                      → apps/users/urls.py
├── controllers/
│   └── userController.js             → apps/users/views.py
├── models/
│   └── User.js                       → apps/users/models.py
├── services/
│   └── userService.js                → apps/users/models.py (methods)
├── middleware/
│   ├── auth.js                       → apps/core/permissions.py
│   └── errorHandler.js               → config/settings/base.py (MIDDLEWARE)
├── validators/
│   └── userValidator.js              → apps/users/serializers.py
└── utils/
    └── helpers.js                    → apps/core/utils.py
```

**關鍵差異：**

- Node.js 通常按**技術層次**組織（controllers/, models/, services/）
- Django 按**業務領域**組織（users/, posts/, gyms/），每個 App 包含所有層次

---

## 資料庫設計

> 💡 **完整數據模型規範**：詳細的欄位定義、驗證規則、索引策略請參考 [specs/001-django-rest-framework/data-model.md](../../specs/001-django-rest-framework/data-model.md)

### 數據模型概覽

NobodyClimb 平台共有 **9 個核心數據模型**：

| 模型 | 說明 | 關鍵欄位 | 關係 |
|-----|------|---------|------|
| **User** | 使用者資料 | username, email, avatar, bio | OneToMany → Post, Gallery, Comment, Bookmark |
| **Post** | 部落格文章 | title, content, cover_image, likes | ManyToOne → User; ManyToMany → Tag |
| **Tag** | 文章標籤 | name, slug | ManyToMany → Post |
| **Gym** | 攀岩館資訊 | name, address, opening_hours | Standalone |
| **Gallery** | 相簿 | title, description, cover_image | ManyToOne → User; OneToMany → Image |
| **Image** | 相簿圖片 | url, caption, order | ManyToOne → Gallery |
| **Comment** | 通用評論 | content, author | GenericForeignKey → Any Model |
| **Video** | YouTube 影片 | youtube_id, title, category | Standalone |
| **Bookmark** | 使用者收藏 | user, content_type, object_id | GenericForeignKey → Any Model |

### ER 圖：完整關係視圖

```
┌─────────────────────────────────────────────────────────────┐
│                         User (使用者)                        │
│  - username, email, password                                │
│  - display_name, bio, avatar                                │
│  - climbing_start_year, frequent_gym                        │
└─────────────┬───────────────┬─────────────┬────────────────┘
              │ 1            │ 1           │ 1
              │              │             │
              │ author       │ author      │ user
              ↓ *            ↓ *           ↓ *
      ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
      │    Post     │  │   Gallery   │  │  Bookmark   │
      │  - title    │  │  - title    │  │ (Generic)   │
      │  - content  │  │  - desc     │  │             │
      │  - slug     │  │  - cover    │  └──────┬──────┘
      └──────┬──────┘  └──────┬──────┘         │
             │ *               │ 1              │ content_type
             │                 │                │ + object_id
             │ posts           │ images         ↓
             ↓                 ↓ *        ┌─────────────┐
      ┌─────────────┐   ┌─────────────┐  │   Comment   │
      │     Tag     │   │    Image    │  │  (Generic)  │
      │  - name     │   │  - url      │  │  - content  │
      │  - slug     │   │  - caption  │  │  - parent   │
      └─────────────┘   └─────────────┘  └──────┬──────┘
             ↑ *                                 │
             │ ManyToMany                        │ content_type
             │ tags                              │ + object_id
             └──────────────┐                    ↓
                            │         ┌─────────────────┐
                            │         │  Post / Gym     │
                            │         │  Gallery / etc  │
                            │         └─────────────────┘
      ┌─────────────┐       │
      │     Gym     │←──────┘
      │  - name     │  Comment & Bookmark
      │  - address  │  可關聯到任何內容類型
      │  - hours    │
      └─────────────┘
              ↑
              │ Standalone (獨立模型)
              ↓
      ┌─────────────┐
      │    Video    │
      │  - youtube  │
      │  - title    │
      │  - category │
      └─────────────┘
```

### 關係類型說明

#### 1. 標準關係（Foreign Key）

- **OneToMany (1:N)**
  - `User → Post`: 一個使用者有多篇文章
  - `User → Gallery`: 一個使用者有多個相簿
  - `Gallery → Image`: 一個相簿有多張圖片

- **ManyToMany (N:M)**
  - `Post ↔ Tag`: 文章和標籤多對多

#### 2. 通用關係（GenericForeignKey）

Django 的 `GenericForeignKey` 允許一個模型關聯到**任意其他模型**。

**Comment 模型**：可以評論任何內容（Post、Gym、Gallery 等）

```python
# 可以這樣使用：
post = Post.objects.get(id=1)
Comment.objects.create(
    author=user,
    content="很棒的文章！",
    content_object=post  # GenericForeignKey
)

gym = Gym.objects.get(id=5)
Comment.objects.create(
    author=user,
    content="這個岩館很讚！",
    content_object=gym  # 同樣的模型，不同的內容類型
)
```

**Node.js 對照**：

```javascript
// Sequelize/TypeORM 沒有直接等價物
// 通常需要為每種類型創建獨立的關聯表

// 方法 1：聯合表
postComments: { type: 'hasMany', model: 'Comment' }
gymComments: { type: 'hasMany', model: 'Comment' }

// 方法 2：多型關聯（需要手動實現）
{
  commentable_type: 'Post',  // 或 'Gym'
  commentable_id: 123
}
```

### 資料模型詳細設計

#### 1. User (使用者模型)

```python
# apps/users/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    """擴充使用者模型"""

    # 基本資訊
    display_name = models.CharField('顯示名稱', max_length=100, blank=True)
    bio = models.TextField('個人簡介', blank=True)
    avatar = models.URLField('頭像', blank=True)

    # 攀岩相關
    climbing_start_year = models.CharField('開始攀岩年份', max_length=4, blank=True)
    frequent_gym = models.CharField('常去岩館', max_length=200, blank=True)
    favorite_route_type = models.CharField('偏好路線類型', max_length=50, blank=True)

    # 社交連結 (JSON 欄位)
    social_links = models.JSONField('社交連結', default=dict, blank=True)
    # 範例: {"instagram": "...", "facebook": "...", "website": "..."}

    # 時間戳記
    created_at = models.DateTimeField('建立時間', auto_now_add=True)
    updated_at = models.DateTimeField('更新時間', auto_now=True)

    class Meta:
        db_table = 'users'
        ordering = ['-created_at']
        verbose_name = '使用者'
        verbose_name_plural = '使用者'

    def __str__(self):
        return self.username
```

**對應前端 TypeScript 類型：**

```typescript
interface User {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  bio?: string;
  avatar?: string;
  climbingStartYear?: string;
  frequentGym?: string;
  favoriteRouteType?: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    website?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

#### 2. Post (文章模型)

```python
# apps/posts/models.py
from django.db import models
from django.conf import settings
from django.utils.text import slugify

class Tag(models.Model):
    """標籤模型"""
    name = models.CharField('標籤名', max_length=50, unique=True)
    slug = models.SlugField('slug', unique=True)

    class Meta:
        db_table = 'tags'
        ordering = ['name']

    def __str__(self):
        return self.name

class Post(models.Model):
    """文章模型"""
    # 基本資訊
    title = models.CharField('標題', max_length=200)
    slug = models.SlugField('slug', unique=True, max_length=200)
    content = models.TextField('內容')
    summary = models.TextField('摘要', max_length=500)
    cover_image = models.URLField('封面圖')

    # 關聯
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='posts',
        verbose_name='作者'
    )
    tags = models.ManyToManyField(Tag, related_name='posts', blank=True)

    # 附加圖片
    images = models.JSONField('附加圖片', default=list, blank=True)
    # 範例: ["url1", "url2", "url3"]

    # 統計資料
    likes = models.IntegerField('按讚數', default=0)
    views = models.IntegerField('瀏覽量', default=0)

    # 時間戳記
    created_at = models.DateTimeField('建立時間', auto_now_add=True)
    updated_at = models.DateTimeField('更新時間', auto_now=True)

    # 軟刪除
    is_published = models.BooleanField('已發布', default=True)

    class Meta:
        db_table = 'posts'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['slug']),
            models.Index(fields=['author', '-created_at']),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)
```

#### 3. Gym (攀岩館模型)

```python
# apps/gyms/models.py
from django.db import models

class Gym(models.Model):
    """攀岩館模型"""
    # 基本資訊
    name = models.CharField('名稱', max_length=200)
    slug = models.SlugField('slug', unique=True)
    description = models.TextField('描述')
    address = models.CharField('地址', max_length=500)

    # 圖片
    cover_image = models.URLField('封面圖')
    images = models.JSONField('圖片列表', default=list, blank=True)

    # 联系方式
    website = models.URLField('網站', blank=True)
    phone = models.CharField('電話', max_length=20, blank=True)

    # 營業時間 (JSON)
    opening_hours = models.JSONField('營業時間', default=dict, blank=True)
    # 範例: {"monday": "10:00-22:00", "tuesday": "10:00-22:00", ...}

    # 設施
    facilities = models.JSONField('設施列表', default=list, blank=True)
    # 範例: ["淋浴间", "更衣室", "咖啡廳", "裝備租借"]

    # 統計
    likes = models.IntegerField('按讚數', default=0)
    rating = models.DecimalField('評分', max_digits=3, decimal_places=2, default=0)

    # 時間戳記
    created_at = models.DateTimeField('建立時間', auto_now_add=True)
    updated_at = models.DateTimeField('更新時間', auto_now=True)

    class Meta:
        db_table = 'gyms'
        ordering = ['-created_at']

    def __str__(self):
        return self.name
```

#### 4. Gallery (相簿模型)

```python
# apps/galleries/models.py
from django.db import models
from django.conf import settings

class Gallery(models.Model):
    """相簿模型"""
    title = models.CharField('標題', max_length=200)
    slug = models.SlugField('slug', unique=True)
    description = models.TextField('描述', blank=True)
    cover_image = models.URLField('封面圖')

    # 作者
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='galleries'
    )

    # 統計
    likes = models.IntegerField('按讚數', default=0)
    views = models.IntegerField('瀏覽量', default=0)

    # 時間戳記
    created_at = models.DateTimeField('建立時間', auto_now_add=True)
    updated_at = models.DateTimeField('更新時間', auto_now=True)

    class Meta:
        db_table = 'galleries'
        ordering = ['-created_at']

class Image(models.Model):
    """圖片模型"""
    gallery = models.ForeignKey(
        Gallery,
        on_delete=models.CASCADE,
        related_name='images'
    )
    url = models.URLField('圖片連結')
    caption = models.CharField('說明', max_length=500, blank=True)
    order = models.IntegerField('排序', default=0)
    created_at = models.DateTimeField('建立時間', auto_now_add=True)

    class Meta:
        db_table = 'gallery_images'
        ordering = ['order', 'created_at']
```

#### 5. Comment (評論模型)

```python
# apps/comments/models.py
from django.db import models
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

class Comment(models.Model):
    """通用評論模型 - 支援多種內容類型"""

    # 評論內容
    content = models.TextField('內容')

    # 作者
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='comments'
    )

    # 通用外鍵 (可以關聯任何模型)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.CharField(max_length=50)
    content_object = GenericForeignKey('content_type', 'object_id')

    # 父評論 (支援回复)
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='replies'
    )

    # 統計
    likes = models.IntegerField('按讚數', default=0)

    # 時間戳記
    created_at = models.DateTimeField('建立時間', auto_now_add=True)
    updated_at = models.DateTimeField('更新時間', auto_now=True)

    class Meta:
        db_table = 'comments'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['content_type', 'object_id']),
        ]

    def __str__(self):
        return f'{self.author.username}: {self.content[:50]}'
```

#### 6. Video (影片模型)

```python
# apps/videos/models.py
from django.db import models

class Video(models.Model):
    """YouTube 影片模型"""

    # YouTube 資訊
    youtube_id = models.CharField('YouTube ID', max_length=50, unique=True)
    title = models.CharField('標題', max_length=300)
    description = models.TextField('描述')
    thumbnail_url = models.URLField('縮圖')

    # 頻道資訊
    channel = models.CharField('頻道名稱', max_length=200)
    channel_id = models.CharField('頻道 ID', max_length=50, blank=True)

    # 影片屬性
    published_at = models.DateTimeField('發布時間')
    duration = models.CharField('時長', max_length=20)  # "MM:SS" 或 "HH:MM:SS"
    view_count = models.CharField('觀看次數', max_length=50)

    # 分類
    CATEGORY_CHOICES = [
        ('outdoor', '戶外攀岩'),
        ('indoor', '室內攀岩'),
        ('competition', '競技攀岩'),
        ('bouldering', '抱石'),
        ('tutorial', '教学影片'),
        ('documentary', '纪录片'),
        ('gear', '裝備評測'),
    ]
    category = models.CharField('分類', max_length=20, choices=CATEGORY_CHOICES)

    # 時長分類
    DURATION_CHOICES = [
        ('short', '短片 (<5分鐘)'),
        ('medium', '中等 (5-20分鐘)'),
        ('long', '長片 (>20分鐘)'),
    ]
    duration_category = models.CharField('時長分類', max_length=10, choices=DURATION_CHOICES)

    # 標籤
    tags = models.JSONField('標籤', default=list, blank=True)

    # 推薦
    featured = models.BooleanField('推薦', default=False)

    # 時間戳記
    created_at = models.DateTimeField('建立時間', auto_now_add=True)
    updated_at = models.DateTimeField('更新時間', auto_now=True)

    class Meta:
        db_table = 'videos'
        ordering = ['-published_at']
        indexes = [
            models.Index(fields=['-published_at']),
            models.Index(fields=['category']),
            models.Index(fields=['featured']),
        ]

    def __str__(self):
        return self.title
```

#### 7. Bookmark (書籤模型)

```python
# apps/users/models.py (续)
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

class Bookmark(models.Model):
    """書籤模型 - 支援收藏多種內容"""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='bookmarks'
    )

    # 通用外鍵
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.CharField(max_length=50)
    content_object = GenericForeignKey('content_type', 'object_id')

    created_at = models.DateTimeField('建立時間', auto_now_add=True)

    class Meta:
        db_table = 'bookmarks'
        unique_together = ['user', 'content_type', 'object_id']
        ordering = ['-created_at']
```

---

## API 端點規劃

> 💡 **完整 API 規範**：所有端點的詳細請求/響應格式、參數說明請參考 [specs/001-django-rest-framework/contracts/openapi.yaml](../../specs/001-django-rest-framework/contracts/openapi.yaml)

### API 版本和基礎 URL

```
Base URL (Production): https://api.nobodyclimb.cc/api/v1/
Base URL (Development): http://localhost:8000/api/v1/
```

### API 端點匯總表

NobodyClimb API 提供 **51 個端點**，按功能模組分組：

| 功能模組 | 端點數量 | 主要操作 | 權限要求 |
|---------|---------|---------|---------|
| **認證 (Auth)** | 7 | 註冊、登入、登出、刷新 token | Public + Authenticated |
| **使用者 (Users)** | 9 | CRUD、使用者文章、相簿、書籤 | Public (讀) + Owner (寫) |
| **文章 (Posts)** | 10 | CRUD、按讚、評論、標籤查詢 | IsAuthenticatedOrReadOnly |
| **標籤 (Tags)** | 2 | 列表、標籤下文章 | Public |
| **攀岩館 (Gyms)** | 7 | CRUD、按讚、評論 | IsAuthenticatedOrReadOnly |
| **相簿 (Galleries)** | 7 | CRUD、圖片管理 | Owner or ReadOnly |
| **評論 (Comments)** | 7 | CRUD、按讚、回覆 | IsAuthenticatedOrReadOnly |
| **影片 (Videos)** | 3 | 列表、詳情、推薦影片 | Public |
| **搜尋 (Search)** | 1 | 全站搜尋 | Public |

**總計**: 51+ 個端點

### 認證端點

```
POST   /api/v1/auth/register/              註冊
POST   /api/v1/auth/login/                 登入
POST   /api/v1/auth/logout/                登出
POST   /api/v1/auth/refresh/               重新整理 token
POST   /api/v1/auth/password/reset/        重置密碼
POST   /api/v1/auth/password/change/       修改密碼
GET    /api/v1/auth/me/                    目前使用者資訊
```

### 使用者端點

```
GET    /api/v1/users/                      使用者列表
POST   /api/v1/users/                      建立使用者 (管理員)
GET    /api/v1/users/:id/                  使用者詳情
PUT    /api/v1/users/:id/                  更新使用者
PATCH  /api/v1/users/:id/                  部分更新
DELETE /api/v1/users/:id/                  刪除使用者
GET    /api/v1/users/:id/posts/            使用者的文章
GET    /api/v1/users/:id/galleries/        使用者的相簿
GET    /api/v1/users/:id/bookmarks/        使用者的書籤
```

### 文章端點

```
GET    /api/v1/posts/                      文章列表
POST   /api/v1/posts/                      建立文章
GET    /api/v1/posts/:id/                  文章詳情
PUT    /api/v1/posts/:id/                  更新文章
PATCH  /api/v1/posts/:id/                  部分更新
DELETE /api/v1/posts/:id/                  刪除文章
POST   /api/v1/posts/:id/like/             按讚文章
DELETE /api/v1/posts/:id/like/             取消按讚
GET    /api/v1/posts/:id/comments/         文章評論
GET    /api/v1/tags/                       標籤列表
GET    /api/v1/tags/:id/posts/             標籤下的文章
```

### 攀岩館端點

```
GET    /api/v1/gyms/                       岩館列表
POST   /api/v1/gyms/                       建立岩館
GET    /api/v1/gyms/:id/                   岩館詳情
PUT    /api/v1/gyms/:id/                   更新岩館
PATCH  /api/v1/gyms/:id/                   部分更新
DELETE /api/v1/gyms/:id/                   刪除岩館
POST   /api/v1/gyms/:id/like/              按讚岩館
GET    /api/v1/gyms/:id/comments/          岩館評論
```

### 相簿端點

```
GET    /api/v1/galleries/                  相簿列表
POST   /api/v1/galleries/                  建立相簿
GET    /api/v1/galleries/:id/              相簿詳情
PUT    /api/v1/galleries/:id/              更新相簿
DELETE /api/v1/galleries/:id/              刪除相簿
POST   /api/v1/galleries/:id/images/       新增圖片
DELETE /api/v1/galleries/:id/images/:img_id/ 刪除圖片
```

### 評論端點

```
GET    /api/v1/comments/                   評論列表 (管理員)
POST   /api/v1/comments/                   建立評論
GET    /api/v1/comments/:id/               評論詳情
PUT    /api/v1/comments/:id/               更新評論
DELETE /api/v1/comments/:id/               刪除評論
POST   /api/v1/comments/:id/like/          按讚評論
GET    /api/v1/comments/:id/replies/       評論回复
```

### 影片端點

```
GET    /api/v1/videos/                     影片列表
GET    /api/v1/videos/:id/                 影片詳情
GET    /api/v1/videos/featured/            推薦影片
```

### 搜尋端點

```
GET    /api/v1/search/                     全站搜尋
  ?q=查詢詞
  &type=post|gym|gallery|user|all
  &page=1
  &page_size=20
```

### 查詢參數範例

```
# 分頁
GET /api/v1/posts/?page=2&page_size=20

# 過濾
GET /api/v1/posts/?author=1&tags=攀岩,戶外

# 搜尋
GET /api/v1/posts/?search=攀岩技巧

# 排序
GET /api/v1/posts/?ordering=-created_at,-likes

# 組合
GET /api/v1/posts/?search=攀岩&ordering=-likes&page=1
```

---

## 認證與權限

### JWT 認證流程

使用 **djangorestframework-simplejwt** 實現 JWT 認證。

#### Token 生命週期

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   使用者     │ Login  │   Backend    │ Return  │   Frontend  │
│             │───────→│              │────────→│             │
│             │         │ (Django JWT) │         │ (Store JWT) │
└─────────────┘         └──────────────┘         └─────────────┘
                               │                        │
                               │ access_token (15 min)  │
                               │ refresh_token (7 days) │
                               └────────────────────────┘
                                        │
                  ┌─────────────────────┴─────────────────────┐
                  │                                           │
              Token 使用                                  Token 過期
           (每次 API 請求)                              (15 分鐘後)
                  │                                           │
                  ↓                                           ↓
        Header: Authorization:                     使用 refresh_token
        Bearer <access_token>                     取得新 access_token
```

#### Token 配置

```python
# config/settings/base.py
from datetime import timedelta

SIMPLE_JWT = {
    # Access Token 有效期: 15 分鐘
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    # Refresh Token 有效期: 7 天
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    # Token 前綴
    'AUTH_HEADER_TYPES': ('Bearer',),
    # Token 字段名
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
}
```

#### 認證流程範例

**1. 使用者登入**

```bash
# 請求
POST /api/v1/auth/login/
Content-Type: application/json

{
  "username": "climber",
  "password": "secure_password"
}

# 回應 (200 OK)
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",  # 15 分鐘有效
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...", # 7 天有效
  "user": {
    "id": "123",
    "username": "climber",
    "email": "climber@example.com",
    "displayName": "攀岩愛好者"
  }
}
```

**2. 使用 Access Token 訪問 API**

```bash
# 請求（所有需要認證的端點）
GET /api/v1/posts/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...

# 成功回應 (200 OK)
{
  "count": 50,
  "results": [...]
}

# Token 過期回應 (401 Unauthorized)
{
  "detail": "Given token not valid for any token type",
  "code": "token_not_valid",
  "messages": [
    {
      "token_class": "AccessToken",
      "token_type": "access",
      "message": "Token is expired"
    }
  ]
}
```

**3. 刷新 Access Token**

```bash
# 請求
POST /api/v1/auth/refresh/
Content-Type: application/json

{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."  # 舊的 refresh_token
}

# 回應 (200 OK)
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",  # 新的 access_token
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."  # 可選：新的 refresh_token
}
```

#### Node.js 對照

**Express + jsonwebtoken:**

```javascript
// Node.js JWT 實現
const jwt = require('jsonwebtoken');

// 登入 - 生成 token
app.post('/login', async (req, res) => {
  const user = await authenticateUser(req.body);
  
  const accessToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }  // 15 分鐘
  );
  
  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }  // 7 天
  );
  
  res.json({ accessToken, refreshToken, user });
});

// 中介軟體 - 驗證 token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};
```

**Django 對照更簡潔：**

```python
# Django - JWT 自動處理
from rest_framework.permissions import IsAuthenticated

class PostViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]  # 自動驗證 JWT
    
    def list(self, request):
        # request.user 自動可用（從 JWT 解析）
        posts = Post.objects.filter(author=request.user)
        # ...
```

### 權限層級

| 權限 | 說明 | 應用場景 |
|-----|------|---------|
| AllowAny | 任何人可訪問 | 公開內容列表、詳情 |
| IsAuthenticated | 需要登入 | 建立內容、按讚、評論 |
| IsAuthenticatedOrReadOnly | 登入可寫，未登入唯讀 | 大部分列表和詳情 |
| IsOwnerOrReadOnly | 所有者可編輯，其他人唯讀 | 編輯自己的文章、評論 |
| IsAdminUser | 僅管理員 | 刪除任意內容 |

**權限配置範例：**

```python
# apps/posts/views.py
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from apps.core.permissions import IsOwnerOrReadOnly

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all()
    serializer_class = PostSerializer

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            # 編輯和刪除需要是作者
            return [IsAuthenticated(), IsOwnerOrReadOnly()]
        elif self.action == 'create':
            # 建立需要登入
            return [IsAuthenticated()]
        else:
            # 列表和詳情任何人可訪問
            return [AllowAny()]
```

---

## 回應格式

### 成功回應

```json
{
  "id": "1",
  "title": "我的第一次戶外攀岩體驗",
  "slug": "my-first-outdoor-climbing",
  "content": "...",
  "author": {
    "id": "1",
    "username": "climber",
    "displayName": "攀岩者"
  },
  "createdAt": "2025-01-15T10:30:00Z"
}
```

### 分頁回應

```json
{
  "count": 100,
  "next": "https://api.nobodyclimb.cc/api/v1/posts/?page=3",
  "previous": "https://api.nobodyclimb.cc/api/v1/posts/?page=1",
  "results": [...]
}
```

### 錯誤回應

```json
{
  "detail": "認證憑證未提供。",
  "code": "not_authenticated"
}
```

```json
{
  "title": ["此欄位不能為空。"],
  "slug": ["具有此 slug 的文章已存在。"]
}
```

---

## 前端集成考慮

### Next.js + Django REST Framework 整合策略

NobodyClimb 前端使用 **Next.js 14 + TypeScript**，後端使用 **Django REST Framework**。以下是整合要點。

#### API 響應格式與 TypeScript 類型對應

**Django Serializer → TypeScript Interface 映射：**

```python
# Backend: apps/users/serializers.py
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'display_name',
            'bio', 'avatar', 'created_at', 'updated_at'
        ]
```

**對應的 TypeScript 介面：**

```typescript
// Frontend: src/types/user.ts
export interface User {
  id: string;                // Django UUIDField → string
  username: string;          // Django CharField → string
  email: string;             // Django EmailField → string
  displayName?: string;      // Django CharField(blank=True) → optional
  bio?: string;              // Django TextField(blank=True) → optional
  avatar?: string;           // Django URLField(blank=True) → optional
  createdAt: string;         // Django DateTimeField → ISO string
  updatedAt: string;         // Django DateTimeField → ISO string
}
```

#### 欄位命名轉換策略

Django 使用 `snake_case`，前端使用 `camelCase`。有兩種處理方式：

**方式 1：後端轉換（推薦）**

```python
# Backend: 使用 djangorestframework-camel-case
# pip install djangorestframework-camel-case

# config/settings/base.py
REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': (
        'djangorestframework_camel_case.render.CamelCaseJSONRenderer',
    ),
    'DEFAULT_PARSER_CLASSES': (
        'djangorestframework_camel_case.parser.CamelCaseJSONParser',
    ),
}

# API 自動返回 camelCase
```

**方式 2：前端轉換**

```typescript
// Frontend: src/lib/api.ts
import camelcaseKeys from 'camelcase-keys';
import snakecaseKeys from 'snakecase-keys';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  transformResponse: [(data) => {
    // 將 snake_case 轉為 camelCase
    return data ? camelcaseKeys(JSON.parse(data), { deep: true }) : data;
  }],
  transformRequest: [(data) => {
    // 將 camelCase 轉為 snake_case
    return JSON.stringify(snakecaseKeys(data, { deep: true }));
  }],
});
```

#### JWT Token 管理

**Frontend: Zustand Store（推薦）**

```typescript
// src/store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  setTokens: (access: string, refresh: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setTokens: (access, refresh) =>
        set({ accessToken: access, refreshToken: refresh }),
      setUser: (user) => set({ user }),
      logout: () =>
        set({ accessToken: null, refreshToken: null, user: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
```

**API Client 自動添加 Token：**

```typescript
// src/lib/api.ts
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
});

// 請求攔截器：自動添加 JWT
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 響應攔截器：自動刷新過期 token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Token 過期，嘗試刷新
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        const response = await axios.post('/api/v1/auth/refresh/', {
          refresh: refreshToken,
        });
        
        const { access } = response.data;
        useAuthStore.getState().setTokens(access, refreshToken!);
        
        // 重試原請求
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // 刷新失敗，登出
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
```

#### CORS 配置

**Backend: Django CORS 設定**

```python
# config/settings/base.py
INSTALLED_APPS = [
    # ...
    'corsheaders',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # 必須在最前面
    'django.middleware.common.CommonMiddleware',
    # ...
]

# 開發環境
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",       # Next.js dev server
    "http://127.0.0.1:3000",
]

# 生產環境
CORS_ALLOWED_ORIGINS = [
    "https://nobodyclimb.cc",
    "https://www.nobodyclimb.cc",
]

# 允許 Cookie
CORS_ALLOW_CREDENTIALS = True

# 允許的 HTTP 方法
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# 允許的 Headers
CORS_ALLOW_HEADERS = [
    'accept',
    'authorization',
    'content-type',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]
```

#### TanStack Query 整合範例

```typescript
// src/hooks/usePosts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { Post, PaginatedResponse } from '@/types';

// 獲取文章列表
export function usePosts(page = 1) {
  return useQuery({
    queryKey: ['posts', page],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Post>>(
        `/posts/?page=${page}`
      );
      return data;
    },
  });
}

// 建立文章
export function useCreatePost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newPost: Partial<Post>) => {
      const { data } = await apiClient.post<Post>('/posts/', newPost);
      return data;
    },
    onSuccess: () => {
      // 重新獲取文章列表
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
```

#### 分頁處理

**Django 分頁響應格式：**

```json
{
  "count": 100,
  "next": "http://api.nobodyclimb.cc/api/v1/posts/?page=3",
  "previous": "http://api.nobodyclimb.cc/api/v1/posts/?page=1",
  "results": [
    { "id": "1", "title": "Post 1", ... },
    { "id": "2", "title": "Post 2", ... }
  ]
}
```

**Frontend TypeScript 類型：**

```typescript
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// 使用
const { data } = usePosts(1);
// data.count → 總數
// data.results → 當前頁數據
// data.next → 下一頁 URL
```

#### 錯誤處理

**Django 錯誤響應格式：**

```json
{
  "detail": "認證憑證未提供。",
  "code": "not_authenticated"
}
```

或欄位驗證錯誤：

```json
{
  "title": ["此欄位不能為空。"],
  "email": ["請輸入有效的電子郵件地址。"]
}
```

**Frontend 錯誤處理：**

```typescript
// src/lib/errors.ts
export interface APIError {
  detail?: string;
  code?: string;
  [field: string]: string[] | string | undefined;
}

// src/hooks/usePosts.ts
const { mutate, error } = useCreatePost();

// 顯示錯誤
if (error) {
  const apiError = error.response?.data as APIError;
  
  if (apiError.detail) {
    toast.error(apiError.detail);
  } else {
    // 欄位錯誤
    Object.entries(apiError).forEach(([field, messages]) => {
      if (Array.isArray(messages)) {
        toast.error(`${field}: ${messages.join(', ')}`);
      }
    });
  }
}
```

---

## 下一步

繼續閱讀：

1. [API 實作指南](./03-api-implementation-guide.md) - 具體程式碼實作
2. [部署指南](./04-deployment-guide.md) - 部署到生產環境
3. [測試指南](./05-testing-guide.md) - 編寫和執行測試

---

## 附錄

### 資料庫關係總結

| 模型 | 關係類型 | 關聯模型 | 說明 |
|-----|---------|---------|------|
| User | OneToMany | Post | 一個使用者有多篇文章 |
| User | OneToMany | Gallery | 一個使用者有多個相簿 |
| User | OneToMany | Comment | 一個使用者有多條評論 |
| Post | ManyToOne | User | 多篇文章屬於一個使用者 |
| Post | ManyToMany | Tag | 文章和標籤多對多 |
| Gallery | OneToMany | Image | 一個相簿有多张圖片 |
| Comment | ManyToOne | User | 多條評論屬於一個使用者 |
| Comment | GenericForeignKey | * | 評論可以關聯任何模型 |
| Bookmark | GenericForeignKey | * | 書籤可以收藏任何模型 |

### 索引最佳化建議

```python
# 常見查詢的索引
indexes = [
    models.Index(fields=['-created_at']),       # 時間降序
    models.Index(fields=['slug']),              # slug 查詢
    models.Index(fields=['author', '-created_at']),  # 使用者文章
    models.Index(fields=['is_published', '-created_at']),  # 已發布文章
]
```
