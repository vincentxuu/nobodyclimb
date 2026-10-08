> ⚠️ 過時：本專案 backend 為 Hono + Cloudflare D1，請以 backend/src 與 project-rules 為準

# Django REST Framework 快速參考卡

> 常用指令和程式碼範例速查表

## 🚀 常用指令

### 專案管理

```bash
# 創建專案
django-admin startproject config .

# 創建應用
python manage.py startapp app_name

# 運行開發伺服器
python manage.py runserver
python manage.py runserver 0.0.0.0:8000  # 允許外部訪問

# Django shell
python manage.py shell

# 顯示所有 URL
python manage.py show_urls
```

### 資料庫

```bash
# 創建遷移
python manage.py makemigrations
python manage.py makemigrations app_name  # 特定應用

# 查看遷移 SQL
python manage.py sqlmigrate app_name 0001

# 應用遷移
python manage.py migrate
python manage.py migrate app_name  # 特定應用
python manage.py migrate app_name zero  # 回滾所有遷移

# 查看遷移狀態
python manage.py showmigrations

# 資料庫 shell
python manage.py dbshell
```

### 用戶管理

```bash
# 創建超級用戶
python manage.py createsuperuser

# 修改用戶密碼
python manage.py changepassword username
```

### 靜態文件

```bash
# 收集靜態文件
python manage.py collectstatic
python manage.py collectstatic --noinput  # 不詢問確認
```

### 測試

```bash
# 運行所有測試
python manage.py test

# 運行特定應用測試
python manage.py test app_name

# 運行特定測試
python manage.py test app_name.tests.test_models.UserModelTest

# 保留測試資料庫
python manage.py test --keepdb
```

### 其他

```bash
# 檢查專案問題
python manage.py check
python manage.py check --deploy  # 部署檢查

# 清除過期 session
python manage.py clearsessions

# 創建訊息編譯檔
python manage.py compilemessages
```

---

## 📦 虛擬環境

```bash
# 創建虛擬環境
python -m venv venv

# 啟動虛擬環境
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows

# 停用虛擬環境
deactivate

# 安裝依賴
pip install -r requirements.txt

# 導出依賴
pip freeze > requirements.txt

# 升級 pip
pip install --upgrade pip
```

---

## 🗃️ 模型 (Models)

### 基本模型

```python
from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    bio = models.TextField(blank=True)
    avatar = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'
        ordering = ['-created_at']
        verbose_name = '用戶'
        verbose_name_plural = '用戶'

    def __str__(self):
        return self.username
```

### 常用字段類型

```python
# 文字
CharField(max_length=100)           # 短文字
TextField()                         # 長文字
SlugField(unique=True)              # URL slug
EmailField()                        # 電子郵件
URLField()                          # URL

# 數字
IntegerField()                      # 整數
DecimalField(max_digits=10, decimal_places=2)  # 小數
FloatField()                        # 浮點數
BooleanField(default=False)         # 布林值

# 日期時間
DateField()                         # 日期
DateTimeField()                     # 日期時間
DateTimeField(auto_now_add=True)    # 創建時自動設定
DateTimeField(auto_now=True)        # 每次保存時更新

# JSON
JSONField(default=dict)             # JSON 物件
JSONField(default=list)             # JSON 陣列

# 關聯
ForeignKey('User', on_delete=models.CASCADE)  # 多對一
ManyToManyField('Tag')              # 多對多
OneToOneField('Profile', on_delete=models.CASCADE)  # 一對一
```

### 查詢操作

```python
# 查詢所有
User.objects.all()

# 過濾
User.objects.filter(is_active=True)
User.objects.filter(age__gte=18)  # 大於等於
User.objects.filter(name__icontains='john')  # 包含（不區分大小寫）
User.objects.exclude(is_active=False)  # 排除

# 獲取單個
User.objects.get(id=1)
User.objects.first()
User.objects.last()

# 排序
User.objects.order_by('-created_at')  # 降序
User.objects.order_by('name', '-age')  # 多個字段

# 限制數量
User.objects.all()[:10]  # 前 10 個
User.objects.all()[5:10]  # 第 6-10 個

# 計數
User.objects.count()
User.objects.filter(is_active=True).count()

# 檢查存在
User.objects.filter(email='test@example.com').exists()

# 關聯查詢
Post.objects.select_related('author')  # 一對一、多對一
Post.objects.prefetch_related('tags')  # 多對多、反向外鍵

# 聚合
from django.db.models import Count, Avg, Sum, Max, Min
User.objects.aggregate(total=Count('id'))
Post.objects.aggregate(avg_likes=Avg('likes'))

# 分組
from django.db.models import Count
User.objects.values('is_active').annotate(count=Count('id'))
```

### 創建、更新、刪除

```python
# 創建
user = User.objects.create(username='john', email='john@example.com')
user = User(username='jane', email='jane@example.com')
user.save()

# 批量創建
User.objects.bulk_create([
    User(username='user1'),
    User(username='user2'),
])

# 更新
user = User.objects.get(id=1)
user.username = 'new_name'
user.save()

# 批量更新
User.objects.filter(is_active=False).update(is_active=True)

# 刪除
user.delete()
User.objects.filter(is_active=False).delete()
```

---

## 🔄 序列化器 (Serializers)

### 基本序列化器

```python
from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'bio', 'created_at']
        read_only_fields = ['id', 'created_at']
        extra_kwargs = {
            'email': {'required': True},
            'password': {'write_only': True}
        }
```

### 自訂字段

```python
class PostSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)  # 嵌套序列化器
    author_id = serializers.IntegerField(write_only=True)  # 寫入用
    likes_count = serializers.SerializerMethodField()  # 自訂字段

    class Meta:
        model = Post
        fields = '__all__'

    def get_likes_count(self, obj):
        """計算點讚數"""
        return obj.likes.count()

    def validate_title(self, value):
        """驗證標題"""
        if len(value) < 5:
            raise serializers.ValidationError("標題太短")
        return value

    def validate(self, attrs):
        """驗證整個物件"""
        if attrs.get('start_date') > attrs.get('end_date'):
            raise serializers.ValidationError("開始日期不能晚於結束日期")
        return attrs
```

---

## 👁️ 視圖 (Views)

### 函數視圖

```python
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def user_list(request):
    if request.method == 'GET':
        users = User.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
```

### 類視圖

```python
from rest_framework.views import APIView

class UserListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        users = User.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
```

### 通用視圖

```python
from rest_framework import generics

class UserListView(generics.ListCreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsOwnerOrReadOnly]
```

### ViewSets（最推薦）

```python
from rest_framework import viewsets
from rest_framework.decorators import action

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    # 過濾和搜尋
    filterset_fields = ['author', 'category']
    search_fields = ['title', 'content']
    ordering_fields = ['created_at', 'likes']

    def perform_create(self, serializer):
        """創建時自動設定作者"""
        serializer.save(author=self.request.user)

    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        """自訂動作：點讚"""
        post = self.get_object()
        post.likes += 1
        post.save()
        return Response({'likes': post.likes})
```

---

## 🔐 認證與權限

### JWT 設定

```python
# settings.py
from datetime import timedelta

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
}
```

### 使用 JWT

```python
# urls.py
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('api/token/', TokenObtainPairView.as_view()),
    path('api/token/refresh/', TokenRefreshView.as_view()),
]
```

```bash
# 獲取 token
curl -X POST http://localhost:8000/api/token/ \
  -d "username=user&password=pass"

# 使用 token
curl -H "Authorization: Bearer <access_token>" \
  http://localhost:8000/api/posts/
```

### 權限類

```python
from rest_framework import permissions

class IsOwnerOrReadOnly(permissions.BasePermission):
    """只有所有者可以編輯"""

    def has_object_permission(self, request, view, obj):
        # 讀取權限允許任何請求
        if request.method in permissions.SAFE_METHODS:
            return True
        # 寫入權限只給所有者
        return obj.author == request.user
```

### 內建權限

```python
from rest_framework.permissions import (
    AllowAny,                    # 任何人
    IsAuthenticated,             # 已登入
    IsAuthenticatedOrReadOnly,   # 登入可寫，未登入只讀
    IsAdminUser,                 # 管理員
)

class MyView(APIView):
    permission_classes = [IsAuthenticated]
```

---

## 🔍 過濾和搜尋

### 安裝

```bash
pip install django-filter
```

### 設定

```python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
}
```

### 使用

```python
class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all()
    serializer_class = PostSerializer

    # 簡單過濾
    filterset_fields = ['author', 'category', 'is_published']

    # 搜尋
    search_fields = ['title', 'content', 'author__username']

    # 排序
    ordering_fields = ['created_at', 'likes', 'views']
    ordering = ['-created_at']  # 預設排序
```

### 自訂過濾器

```python
from django_filters import rest_framework as filters

class PostFilter(filters.FilterSet):
    title = filters.CharFilter(lookup_expr='icontains')
    created_after = filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    min_likes = filters.NumberFilter(field_name='likes', lookup_expr='gte')

    class Meta:
        model = Post
        fields = ['author', 'category']
```

---

## 📄 分頁

### 設定

```python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20
}
```

### 自訂分頁器

```python
from rest_framework.pagination import PageNumberPagination

class CustomPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100
```

### 使用

```python
class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    pagination_class = CustomPagination
```

---

## 🧪 測試

### 基本測試

```python
from django.test import TestCase
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

class PostAPITestCase(APITestCase):
    def setUp(self):
        """測試前準備"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='test',
            password='test123'
        )
        self.client.force_authenticate(user=self.user)

    def test_create_post(self):
        """測試創建文章"""
        url = '/api/v1/posts/'
        data = {
            'title': 'Test Post',
            'content': 'Test content'
        }
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Post.objects.count(), 1)
        self.assertEqual(Post.objects.first().title, 'Test Post')

    def test_list_posts(self):
        """測試獲取文章列表"""
        Post.objects.create(
            title='Post 1',
            content='Content 1',
            author=self.user
        )

        url = '/api/v1/posts/'
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
```

---

## 🌐 CORS 設定

```python
# settings.py
INSTALLED_APPS = [
    'corsheaders',
    # ...
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    # ...
]

# 允許的來源
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'https://nobodyclimb.cc',
]

# 或允許所有來源（僅開發環境）
CORS_ALLOW_ALL_ORIGINS = True

# 允許攜帶 cookies
CORS_ALLOW_CREDENTIALS = True
```

---

## 📊 常用查詢範例

```python
# 複雜過濾
Post.objects.filter(
    author__username='john',
    created_at__year=2025,
    likes__gte=10
).exclude(
    is_published=False
).select_related('author').prefetch_related('tags')

# Q 物件（OR 查詢）
from django.db.models import Q
Post.objects.filter(
    Q(title__icontains='climbing') | Q(content__icontains='climbing')
)

# F 物件（字段比較）
from django.db.models import F
Post.objects.filter(likes__gt=F('views') * 0.1)

# 子查詢
from django.db.models import Subquery, OuterRef
newest_posts = Post.objects.filter(
    author=OuterRef('pk')
).order_by('-created_at')[:1]

User.objects.annotate(
    newest_post_id=Subquery(newest_posts.values('id'))
)

# 條件聚合
from django.db.models import Count, Case, When
Post.objects.aggregate(
    published_count=Count('id', filter=Q(is_published=True)),
    draft_count=Count('id', filter=Q(is_published=False))
)
```

---

## 🔧 環境變數

```python
# 安裝
pip install python-decouple

# 使用
from decouple import config

SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', default=False, cast=bool)
DATABASE_URL = config('DATABASE_URL')
ALLOWED_HOSTS = config('ALLOWED_HOSTS', cast=lambda v: [s.strip() for s in v.split(',')])
```

---

## 📦 常用套件

```bash
# 核心
pip install django djangorestframework

# 認證
pip install djangorestframework-simplejwt

# 資料庫
pip install psycopg2-binary  # PostgreSQL

# CORS
pip install django-cors-headers

# 過濾
pip install django-filter

# 檔案存儲
pip install django-storages boto3

# 環境變數
pip install python-decouple

# API 文檔
pip install drf-spectacular

# 生產伺服器
pip install gunicorn

# 靜態文件
pip install whitenoise

# 測試
pip install pytest pytest-django

# 程式碼品質
pip install black flake8
```

---

## 🚀 部署檢查清單

```bash
# 1. 安全檢查
python manage.py check --deploy

# 2. 收集靜態文件
python manage.py collectstatic --noinput

# 3. 運行遷移
python manage.py migrate

# 4. 創建超級用戶
python manage.py createsuperuser

# 5. 測試
python manage.py test

# 6. 確認環境變數
# - SECRET_KEY
# - DEBUG=False
# - ALLOWED_HOSTS
# - DATABASE_URL
# - CORS_ALLOWED_ORIGINS
```

---

## 📚 更多資源

- [完整教程](./README.md)
- [Django 文檔](https://docs.djangoproject.com/)
- [DRF 文檔](https://www.django-rest-framework.org/)
