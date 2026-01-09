# API 實作指南

> 詳細的 Django REST Framework API 實作步驟

## 目錄

- [專案初始化](#專案初始化)
- [配置檔案設定](#配置檔案設定)
- [實作使用者認證](#實作使用者認證)
- [實作 CRUD API](#實作-crud-api)
- [新增過濾和搜尋](#新增過濾和搜尋)
- [檔案上傳處理](#檔案上傳處理)
- [測試 API](#測試-api)

---

## 專案初始化

### 1. 建立專案目錄

```bash
# 建立專案目錄
mkdir nobodyclimb-backend
cd nobodyclimb-backend

# 建立虛擬環境
python -m venv venv

# 啟動虛擬環境
# macOS/Linux:
source venv/bin/activate
# Windows:
# venv\Scripts\activate

# 升級 pip
pip install --upgrade pip
```

**Node.js 對照：**

```bash
mkdir nobodyclimb-backend
cd nobodyclimb-backend
npm init -y
```

### 2. 安裝依賴

```bash
# 建立 requirements.txt
cat > requirements.txt << 'EOF'
Django==5.0.8
djangorestframework==3.14.0
djangorestframework-simplejwt==5.3.1
django-cors-headers==4.3.1
django-filter==24.2
psycopg2-binary==2.9.9
Pillow==10.4.0
python-decouple==3.8
drf-spectacular==0.27.2
gunicorn==22.0.0
whitenoise==6.7.0
EOF

# 安裝
pip install -r requirements.txt
```

### 3. 建立 Django 專案

```bash
# 建立專案
django-admin startproject config .

# 注意最后的点 (.) 表示在目前目錄建立
# 這样会生成:
# nobodyclimb-backend/
# ├── manage.py
# └── config/
#     ├── __init__.py
#     ├── settings.py
#     ├── urls.py
#     ├── wsgi.py
#     └── asgi.py
```

**Node.js 對照：**

```bash
npx express-generator
```

### 4. 建立應用

```bash
# 建立 apps 目錄
mkdir apps
touch apps/__init__.py

# 建立各個應用
python manage.py startapp users apps/users
python manage.py startapp posts apps/posts
python manage.py startapp gyms apps/gyms
python manage.py startapp galleries apps/galleries
python manage.py startapp comments apps/comments
python manage.py startapp videos apps/videos
python manage.py startapp core apps/core
```

**專案結構：**

```
nobodyclimb-backend/
├── manage.py
├── config/
│   ├── settings.py
│   └── urls.py
└── apps/
    ├── users/
    ├── posts/
    ├── gyms/
    └── ...
```

---

## 配置檔案設定

### 1. 基礎配置 (config/settings.py)

```python
# config/settings.py
import os
from pathlib import Path
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent

# 安全設定
SECRET_KEY = config('SECRET_KEY', default='your-secret-key-here')
DEBUG = config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1', cast=lambda v: [s.strip() for s in v.split(',')])

# 應用配置
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # 第三方應用
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    'drf_spectacular',

    # 自定義應用
    'apps.users',
    'apps.posts',
    'apps.gyms',
    'apps.galleries',
    'apps.comments',
    'apps.videos',
    'apps.core',
]

# 中介軟體
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # 靜態檔案服務
    'corsheaders.middleware.CorsMiddleware',       # CORS 支援
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

# 資料库配置
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME', default='nobodyclimb'),
        'USER': config('DB_USER', default='postgres'),
        'PASSWORD': config('DB_PASSWORD', default='postgres'),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='5432'),
    }
}

# 自定義使用者模型
AUTH_USER_MODEL = 'users.User'

# 語言和時區
LANGUAGE_CODE = 'zh-hant'
TIME_ZONE = 'Asia/Taipei'
USE_I18N = True
USE_TZ = True

# 靜態檔案
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# 媒體檔案
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# REST Framework 配置
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

# JWT 配置
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# CORS 配置
CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost:3000,http://127.0.0.1:3000',
    cast=lambda v: [s.strip() for s in v.split(',')]
)
CORS_ALLOW_CREDENTIALS = True

# API 檔案配置
SPECTACULAR_SETTINGS = {
    'TITLE': 'NobodyClimb API',
    'DESCRIPTION': '攀岩社群 API 檔案',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}
```

**Node.js 對照：**

```javascript
// config.js
module.exports = {
  port: process.env.PORT || 3000,
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'nobodyclimb',
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: '1h'
  }
};
```

### 2. 環境變數配置 (.env)

```bash
# 建立 .env 檔案
cat > .env << 'EOF'
# Django
SECRET_KEY=your-secret-key-here-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# 資料库
DB_NAME=nobodyclimb
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Cloudflare R2 (選填)
# CLOUDFLARE_R2_ACCESS_KEY_ID=
# CLOUDFLARE_R2_SECRET_ACCESS_KEY=
# CLOUDFLARE_R2_BUCKET_NAME=
# CLOUDFLARE_R2_ENDPOINT_URL=
EOF

# 建立 .env.example (不包含敏感資訊)
cat > .env.example << 'EOF'
SECRET_KEY=
DEBUG=False
ALLOWED_HOSTS=
DB_NAME=
DB_USER=
DB_PASSWORD=
DB_HOST=
DB_PORT=
CORS_ALLOWED_ORIGINS=
EOF
```

### 3. URL 路由配置 (config/urls.py)

```python
# config/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    # 管理後台
    path('admin/', admin.site.urls),

    # API 檔案
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),

    # API v1
    path('api/v1/auth/', include('apps.users.urls.auth_urls')),
    path('api/v1/users/', include('apps.users.urls.user_urls')),
    path('api/v1/posts/', include('apps.posts.urls')),
    path('api/v1/gyms/', include('apps.gyms.urls')),
    path('api/v1/galleries/', include('apps.galleries.urls')),
    path('api/v1/comments/', include('apps.comments.urls')),
    path('api/v1/videos/', include('apps.videos.urls')),
]

# 開發環境下提供媒體檔案訪問
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

**Node.js 對照：**

```javascript
// routes/index.js
const express = require('express');
const router = express.Router();

router.use('/api/v1/auth', require('./auth'));
router.use('/api/v1/users', require('./users'));
router.use('/api/v1/posts', require('./posts'));

module.exports = router;
```

---

## 實作使用者認證

### 1. 使用者模型 (apps/users/models.py)

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

    # 社交連結
    social_links = models.JSONField('社交連結', default=dict, blank=True)

    # 時間戳記
    created_at = models.DateTimeField('建立時間', auto_now_add=True)
    updated_at = models.DateTimeField('更新時間', auto_now=True)

    class Meta:
        db_table = 'users'
        ordering = ['-created_at']

    def __str__(self):
        return self.username
```

**Node.js 對照（Sequelize）：**

```javascript
// models/User.js
const { Model, DataTypes } = require('sequelize');

class User extends Model {
  static init(sequelize) {
    return super.init({
      username: DataTypes.STRING,
      email: DataTypes.STRING,
      password: DataTypes.STRING,
      displayName: DataTypes.STRING,
      bio: DataTypes.TEXT,
      avatar: DataTypes.STRING,
    }, { sequelize });
  }
}
```

### 2. 序列化器 (apps/users/serializers.py)

```python
# apps/users/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """使用者序列化器"""

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'display_name', 'bio', 'avatar',
            'climbing_start_year', 'frequent_gym', 'favorite_route_type',
            'social_links', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class UserRegistrationSerializer(serializers.ModelSerializer):
    """使用者註冊序列化器"""
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )
    password_confirm = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm']

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "密碼不一致"})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user

class UserProfileSerializer(serializers.ModelSerializer):
    """使用者個人資料序列化器（含更多資訊）"""
    posts_count = serializers.IntegerField(read_only=True)
    galleries_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'display_name', 'bio', 'avatar',
            'climbing_start_year', 'frequent_gym', 'favorite_route_type',
            'social_links', 'posts_count', 'galleries_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'username', 'email', 'created_at', 'updated_at']
```

**Node.js 對照（Joi）：**

```javascript
// validators/user.js
const Joi = require('joi');

const registerSchema = Joi.object({
  username: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  passwordConfirm: Joi.string().valid(Joi.ref('password')).required()
});
```

### 3. 認證視圖 (apps/users/views/auth_views.py)

```python
# apps/users/views/auth_views.py
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model

from apps.users.serializers import UserRegistrationSerializer, UserSerializer

User = get_user_model()

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """使用者註冊"""
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()

        # 生成 JWT token
        refresh = RefreshToken.for_user(user)

        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    """取得目前登入使用者資訊"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """更新使用者資料"""
    serializer = UserSerializer(
        request.user,
        data=request.data,
        partial=request.method == 'PATCH'
    )
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
```

**Node.js 對照（Express）：**

```javascript
// controllers/authController.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.register = async (req, res) => {
  try {
    const user = await User.create(req.body);
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);

    res.status(201).json({ user, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getCurrentUser = async (req, res) => {
  res.json({ user: req.user });
};
```

### 4. 認證路由 (apps/users/urls/auth_urls.py)

```python
# apps/users/urls/auth_urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.users.views import auth_views

urlpatterns = [
    # JWT 認證
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # 使用者註冊和資料
    path('register/', auth_views.register, name='register'),
    path('me/', auth_views.get_current_user, name='current_user'),
    path('profile/', auth_views.update_profile, name='update_profile'),
]
```

---

## 實作 CRUD API

### 範例：文章 API

#### 1. 模型 (apps/posts/models.py)

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

    def __str__(self):
        return self.name

class Post(models.Model):
    """文章模型"""
    title = models.CharField('標題', max_length=200)
    slug = models.SlugField('slug', unique=True, max_length=200)
    content = models.TextField('內容')
    summary = models.TextField('摘要', max_length=500)
    cover_image = models.URLField('封面圖')

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='posts'
    )
    tags = models.ManyToManyField(Tag, related_name='posts', blank=True)

    images = models.JSONField('附加圖片', default=list, blank=True)
    likes = models.IntegerField('按讚數', default=0)
    views = models.IntegerField('瀏覽量', default=0)

    created_at = models.DateTimeField('建立時間', auto_now_add=True)
    updated_at = models.DateTimeField('更新時間', auto_now=True)

    class Meta:
        db_table = 'posts'
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)
```

#### 2. 序列化器 (apps/posts/serializers.py)

```python
# apps/posts/serializers.py
from rest_framework import serializers
from apps.posts.models import Post, Tag
from apps.users.serializers import UserSerializer

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug']

class PostListSerializer(serializers.ModelSerializer):
    """文章列表序列化器（簡化版）"""
    author = UserSerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)

    class Meta:
        model = Post
        fields = [
            'id', 'title', 'slug', 'summary', 'cover_image',
            'author', 'tags', 'likes', 'views', 'created_at'
        ]

class PostDetailSerializer(serializers.ModelSerializer):
    """文章詳情序列化器（完整版）"""
    author = UserSerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = Post
        fields = [
            'id', 'title', 'slug', 'content', 'summary', 'cover_image',
            'author', 'tags', 'tag_ids', 'images', 'likes', 'views',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'author', 'likes', 'views', 'created_at', 'updated_at']

    def create(self, validated_data):
        tag_ids = validated_data.pop('tag_ids', [])
        post = Post.objects.create(**validated_data)
        if tag_ids:
            post.tags.set(tag_ids)
        return post

    def update(self, instance, validated_data):
        tag_ids = validated_data.pop('tag_ids', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if tag_ids is not None:
            instance.tags.set(tag_ids)

        return instance
```

#### 3. 視圖 (apps/posts/views.py)

```python
# apps/posts/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from rest_framework.response import Response

from apps.posts.models import Post, Tag
from apps.posts.serializers import PostListSerializer, PostDetailSerializer, TagSerializer
from apps.core.permissions import IsOwnerOrReadOnly

class PostViewSet(viewsets.ModelViewSet):
    """文章視圖集"""
    queryset = Post.objects.select_related('author').prefetch_related('tags')
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]

    # 過濾和搜尋
    filterset_fields = ['author', 'tags']
    search_fields = ['title', 'content', 'summary']
    ordering_fields = ['created_at', 'likes', 'views']

    def get_serializer_class(self):
        """根据動作選擇序列化器"""
        if self.action == 'list':
            return PostListSerializer
        return PostDetailSerializer

    def perform_create(self, serializer):
        """建立文章时自動設定作者"""
        serializer.save(author=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        """取得文章詳情时增加瀏覽量"""
        instance = self.get_object()
        instance.views += 1
        instance.save(update_fields=['views'])

        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def like(self, request, pk=None):
        """按讚文章"""
        post = self.get_object()
        post.likes += 1
        post.save(update_fields=['likes'])
        return Response({'likes': post.likes})

    @action(detail=True, methods=['delete'], permission_classes=[IsAuthenticated])
    def unlike(self, request, pk=None):
        """取消按讚"""
        post = self.get_object()
        post.likes = max(0, post.likes - 1)
        post.save(update_fields=['likes'])
        return Response({'likes': post.likes})

class TagViewSet(viewsets.ReadOnlyModelViewSet):
    """標籤視圖集（唯讀）"""
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
```

**Node.js 對照（Express）：**

```javascript
// controllers/postController.js
exports.getAllPosts = async (req, res) => {
  const posts = await Post.findAll({ include: ['author', 'tags'] });
  res.json(posts);
};

exports.createPost = async (req, res) => {
  const post = await Post.create({
    ...req.body,
    authorId: req.user.id
  });
  res.status(201).json(post);
};

exports.getPost = async (req, res) => {
  const post = await Post.findByPk(req.params.id);
  await post.increment('views');
  res.json(post);
};
```

#### 4. 權限類別 (apps/core/permissions.py)

```python
# apps/core/permissions.py
from rest_framework import permissions

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    自定義權限：
    - 列表和詳情：任何人可讀
    - 編輯和刪除：僅所有者
    """

    def has_object_permission(self, request, view, obj):
        # 讀取權限允許任何請求
        if request.method in permissions.SAFE_METHODS:
            return True

        # 寫入權限僅限所有者
        return obj.author == request.user
```

#### 5. 路由 (apps/posts/urls.py)

```python
# apps/posts/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.posts.views import PostViewSet, TagViewSet

router = DefaultRouter()
router.register('', PostViewSet, basename='post')
router.register('tags', TagViewSet, basename='tag')

urlpatterns = [
    path('', include(router.urls)),
]
```

**自動生成的路由：**

```
GET    /api/v1/posts/              文章列表
POST   /api/v1/posts/              建立文章
GET    /api/v1/posts/{id}/         文章詳情
PUT    /api/v1/posts/{id}/         更新文章
PATCH  /api/v1/posts/{id}/         部分更新
DELETE /api/v1/posts/{id}/         刪除文章
POST   /api/v1/posts/{id}/like/    按讚
DELETE /api/v1/posts/{id}/unlike/  取消按讚
GET    /api/v1/posts/tags/         標籤列表
```

---

## 新增過濾和搜尋

### 1. 自訂過濾器 (apps/posts/filters.py)

```python
# apps/posts/filters.py
from django_filters import rest_framework as filters
from apps.posts.models import Post

class PostFilter(filters.FilterSet):
    """文章過濾器"""
    title = filters.CharFilter(lookup_expr='icontains')  # 標題包含
    created_after = filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    min_likes = filters.NumberFilter(field_name='likes', lookup_expr='gte')
    tag_name = filters.CharFilter(field_name='tags__name', lookup_expr='iexact')

    class Meta:
        model = Post
        fields = ['author', 'tags']
```

### 2. 在視圖中使用

```python
# apps/posts/views.py (更新)
from apps.posts.filters import PostFilter

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all()
    filterset_class = PostFilter  # 使用自訂過濾器

    # ...其他程式碼
```

### 3. 查詢範例

```bash
# 搜尋標題
GET /api/v1/posts/?search=攀岩

# 按作者過濾
GET /api/v1/posts/?author=1

# 按標籤過濾
GET /api/v1/posts/?tags=1,2

# 自定義過濾
GET /api/v1/posts/?title=技巧&min_likes=10

# 日期範圍
GET /api/v1/posts/?created_after=2025-01-01&created_before=2025-12-31

# 排序
GET /api/v1/posts/?ordering=-likes,-created_at

# 分頁
GET /api/v1/posts/?page=2&page_size=10

# 組合查詢
GET /api/v1/posts/?search=攀岩&ordering=-likes&page=1
```

---

## 檔案上傳處理

### 使用 Cloudflare R2 存储

```python
# config/settings.py
# Cloudflare R2 配置
if not DEBUG:
    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
    AWS_ACCESS_KEY_ID = config('CLOUDFLARE_R2_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = config('CLOUDFLARE_R2_SECRET_ACCESS_KEY')
    AWS_STORAGE_BUCKET_NAME = config('CLOUDFLARE_R2_BUCKET_NAME')
    AWS_S3_ENDPOINT_URL = config('CLOUDFLARE_R2_ENDPOINT_URL')
    AWS_S3_REGION_NAME = 'auto'
    AWS_S3_FILE_OVERWRITE = False
    AWS_DEFAULT_ACL = None
    AWS_S3_OBJECT_PARAMETERS = {
        'CacheControl': 'max-age=86400',
    }
```

### 圖片上傳 API

```python
# apps/core/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.core.files.storage import default_storage

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_image(request):
    """上傳圖片"""
    if 'image' not in request.FILES:
        return Response({'error': '未提供圖片'}, status=400)

    image = request.FILES['image']

    # 儲存檔案
    filename = default_storage.save(f'uploads/{image.name}', image)
    url = default_storage.url(filename)

    return Response({'url': url})
```

---

## 通用關係實現 (GenericForeignKey)

Django 的 `GenericForeignKey` 允許一個模型關聯到任意其他模型，非常適合實現評論和書籤功能。

### Comment 模型實現

```python
# apps/comments/models.py
from django.db import models
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

class Comment(models.Model):
    """通用評論模型 - 可以評論任何內容"""
    
    # 評論內容
    content = models.TextField('內容')
    
    # 作者
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='comments'
    )
    
    # GenericForeignKey 三件套
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.CharField(max_length=50)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # 父評論（支援回覆）
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
```

### Comment Serializer

```python
# apps/comments/serializers.py
from rest_framework import serializers
from .models import Comment
from apps.users.serializers import UserSerializer

class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    replies = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = [
            'id', 'content', 'author', 'content_type', 'object_id',
            'parent', 'likes', 'replies', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'author', 'likes', 'created_at', 'updated_at']
    
    def get_replies(self, obj):
        """取得回覆列表"""
        if obj.replies.exists():
            return CommentSerializer(obj.replies.all(), many=True).data
        return []

class CommentCreateSerializer(serializers.ModelSerializer):
    """建立評論的序列化器"""
    content_type = serializers.CharField()  # 接收 "post", "gym" 等
    object_id = serializers.CharField()
    
    class Meta:
        model = Comment
        fields = ['content', 'content_type', 'object_id', 'parent']
    
    def create(self, validated_data):
        # 將 content_type 字串轉換為 ContentType 對象
        content_type_str = validated_data.pop('content_type')
        
        # 獲取對應的 ContentType
        try:
            content_type = ContentType.objects.get(model=content_type_str.lower())
        except ContentType.DoesNotExist:
            raise serializers.ValidationError(f"無效的內容類型: {content_type_str}")
        
        validated_data['content_type'] = content_type
        validated_data['author'] = self.context['request'].user
        
        return Comment.objects.create(**validated_data)
```

### Comment ViewSet

```python
# apps/comments/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from .models import Comment
from .serializers import CommentSerializer, CommentCreateSerializer
from apps.core.permissions import IsOwnerOrReadOnly

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.select_related('author').prefetch_related('replies')
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CommentCreateSerializer
        return CommentSerializer
    
    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        """按讚評論"""
        comment = self.get_object()
        comment.likes += 1
        comment.save()
        return Response({'likes': comment.likes})
```

**使用範例：**

```bash
# 為文章添加評論
POST /api/v1/comments/
{
  "content": "很棒的文章！",
  "content_type": "post",
  "object_id": "123"
}

# 回覆評論
POST /api/v1/comments/
{
  "content": "謝謝分享",
  "content_type": "post",
  "object_id": "123",
  "parent": 456  # 父評論 ID
}

# 為岩館添加評論
POST /api/v1/comments/
{
  "content": "這個岩館很棒！",
  "content_type": "gym",
  "object_id": "789"
}
```

### Bookmark 模型實現

```python
# apps/users/models.py (續)
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

class Bookmark(models.Model):
    """書籤模型 - 可以收藏任何內容"""
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='bookmarks'
    )
    
    # GenericForeignKey 三件套
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.CharField(max_length=50)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    created_at = models.DateTimeField('建立時間', auto_now_add=True)
    
    class Meta:
        db_table = 'bookmarks'
        unique_together = ['user', 'content_type', 'object_id']
        ordering = ['-created_at']
```

**在模型中添加反向關聯：**

```python
# apps/posts/models.py
from django.contrib.contenttypes.fields import GenericRelation

class Post(models.Model):
    # ... 其他欄位 ...
    
    # 反向關聯
    comments = GenericRelation('comments.Comment')
    bookmarks = GenericRelation('users.Bookmark')
    
    def get_comments(self):
        """取得所有評論"""
        return self.comments.all()
    
    def get_bookmarks_count(self):
        """取得收藏數"""
        return self.bookmarks.count()
```

---

## 常見模式實現

### 1. 按讚功能

```python
# apps/core/mixins.py
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

class LikeableMixin:
    """可按讚的 Mixin"""
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def like(self, request, pk=None):
        """按讚"""
        obj = self.get_object()
        obj.likes += 1
        obj.save()
        return Response({'likes': obj.likes})
    
    @action(detail=True, methods=['delete'], permission_classes=[IsAuthenticated])
    def unlike(self, request, pk=None):
        """取消按讚"""
        obj = self.get_object()
        obj.likes = max(0, obj.likes - 1)
        obj.save()
        return Response({'likes': obj.likes})

# 使用 Mixin
class PostViewSet(LikeableMixin, viewsets.ModelViewSet):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
```

### 2. 收藏功能

```python
# apps/users/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.contenttypes.models import ContentType
from .models import Bookmark

class BookmarkViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Bookmark.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def add(self, request):
        """添加收藏"""
        content_type_str = request.data.get('content_type')
        object_id = request.data.get('object_id')
        
        try:
            content_type = ContentType.objects.get(model=content_type_str.lower())
        except ContentType.DoesNotExist:
            return Response(
                {'error': '無效的內容類型'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        bookmark, created = Bookmark.objects.get_or_create(
            user=request.user,
            content_type=content_type,
            object_id=object_id
        )
        
        if created:
            return Response({'message': '收藏成功'}, status=status.HTTP_201_CREATED)
        else:
            return Response({'message': '已經收藏過了'}, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['delete'])
    def remove(self, request):
        """取消收藏"""
        content_type_str = request.data.get('content_type')
        object_id = request.data.get('object_id')
        
        try:
            content_type = ContentType.objects.get(model=content_type_str.lower())
            bookmark = Bookmark.objects.get(
                user=request.user,
                content_type=content_type,
                object_id=object_id
            )
            bookmark.delete()
            return Response({'message': '已取消收藏'})
        except Bookmark.DoesNotExist:
            return Response(
                {'error': '未找到收藏記錄'},
                status=status.HTTP_404_NOT_FOUND
            )
```

### 3. 評論功能整合到其他端點

```python
# apps/posts/views.py
class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    
    @action(detail=True, methods=['get'])
    def comments(self, request, pk=None):
        """取得文章的所有評論"""
        post = self.get_object()
        comments = post.comments.filter(parent__isnull=True)  # 只取頂層評論
        
        from apps.comments.serializers import CommentSerializer
        serializer = CommentSerializer(comments, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_comment(self, request, pk=None):
        """為文章添加評論"""
        post = self.get_object()
        
        from apps.comments.serializers import CommentSerializer
        from apps.comments.models import Comment
        from django.contrib.contenttypes.models import ContentType
        
        comment = Comment.objects.create(
            content=request.data.get('content'),
            author=request.user,
            content_type=ContentType.objects.get_for_model(Post),
            object_id=post.id
        )
        
        serializer = CommentSerializer(comment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
```

### 4. 批量操作

```python
class PostViewSet(viewsets.ModelViewSet):
    # ...
    
    @action(detail=False, methods=['delete'])
    def bulk_delete(self, request):
        """批量刪除文章"""
        ids = request.data.get('ids', [])
        
        # 只能刪除自己的文章
        posts = Post.objects.filter(id__in=ids, author=request.user)
        count = posts.count()
        posts.delete()
        
        return Response({
            'message': f'成功刪除 {count} 篇文章'
        })
```

### 5. 統計數據端點

```python
# apps/users/views.py
class UserViewSet(viewsets.ModelViewSet):
    # ...
    
    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """使用者統計數據"""
        user = self.get_object()
        
        stats = {
            'post_count': user.posts.count(),
            'gallery_count': user.galleries.count(),
            'comment_count': user.comments.count(),
            'bookmark_count': user.bookmarks.count(),
            'total_likes': sum(post.likes for post in user.posts.all()),
        }
        
        return Response(stats)
```

---

## 測試 API

### 1. 建立遷移并執行

```bash
# 建立資料库遷移
python manage.py makemigrations

# 應用遷移
python manage.py migrate

# 建立超级使用者
python manage.py createsuperuser

# 啟動開發伺服器
python manage.py runserver
```

### 2. 使用 curl 測試

```bash
# 註冊使用者
curl -X POST http://localhost:8000/api/v1/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "climber",
    "email": "climber@example.com",
    "password": "SecurePass123",
    "password_confirm": "SecurePass123"
  }'

# 登入
curl -X POST http://localhost:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "climber", "password": "SecurePass123"}'

# 使用 token 建立文章
curl -X POST http://localhost:8000/api/v1/posts/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "title": "我的第一次攀岩",
    "summary": "分享我的攀岩初體驗",
    "content": "今天是我第一次嘗試攀岩...",
    "cover_image": "https://example.com/image.jpg",
    "tag_ids": [1, 2]
  }'

# 取得文章列表
curl http://localhost:8000/api/v1/posts/
```

### 3. 訪問 API 檔案

訪問 [http://localhost:8000/api/docs/](http://localhost:8000/api/docs/) 查看自動生成的 Swagger 檔案。

---

## 下一步

繼續閱讀：

1. [部署指南](./04-deployment-guide.md) - 部署到生產環境
2. [測試指南](./05-testing-guide.md) - 編寫測試
3. [效能最佳化](./06-performance-optimization.md) - 最佳化效能

---

## 完整範例程式碼

查看完整的範例程式碼仓库：[GitHub - nobodyclimb-backend-example](https://github.com/example/nobodyclimb-backend)
