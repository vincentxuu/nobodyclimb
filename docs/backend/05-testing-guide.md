# Django REST Framework 測試指南

> 使用 pytest 為 Django API 編寫高品質測試

## 目錄

- [pytest 介紹（給 Node.js 開發者）](#pytest-介紹給-nodejs-開發者)
- [測試環境設置](#測試環境設置)
- [單元測試](#單元測試)
- [整合測試](#整合測試)
- [API 端點測試](#api-端點測試)
- [測試資料工廠](#測試資料工廠)
- [測試組織結構](#測試組織結構)
- [持續整合](#持續整合)

---

## pytest 介紹（給 Node.js 開發者）

### pytest vs Jest/Mocha

| 特性 | pytest (Python) | Jest (Node.js) | Mocha (Node.js) |
|------|----------------|----------------|-----------------|
| **斷言語法** | `assert x == y` | `expect(x).toBe(y)` | `assert.equal(x, y)` |
| **測試發現** | 自動發現 `test_*.py` | 自動發現 `*.test.js` | 需配置 |
| **Fixture** | 內建 `@pytest.fixture` | `beforeEach()` | `before()` |
| **參數化測試** | `@pytest.mark.parametrize` | 手動 loop | 手動 loop |
| **並行執行** | `pytest-xdist` | 內建 | 需插件 |
| **覆蓋率** | `pytest-cov` | `jest --coverage` | `nyc` |

### 基本語法對比

**Jest (Node.js):**

```javascript
describe('User API', () => {
  test('should create user', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ username: 'test' });
    
    expect(response.status).toBe(201);
    expect(response.body.username).toBe('test');
  });
});
```

**pytest (Python):**

```python
class TestUserAPI:
    def test_should_create_user(self, client):
        response = client.post('/api/users/', {
            'username': 'test'
        })
        
        assert response.status_code == 201
        assert response.data['username'] == 'test'
```

---

## 測試環境設置

### 1. 安裝測試依賴

```bash
# requirements-dev.txt
pytest==8.2.2
pytest-django==4.8.0
pytest-cov==5.0.0           # 覆蓋率報告
pytest-xdist==3.6.1         # 並行測試
factory-boy==3.3.0          # 測試資料工廠
faker==25.0.0               # 假資料生成
```

```bash
pip install -r requirements-dev.txt
```

**Node.js 對照:**

```bash
npm install --save-dev jest supertest faker
```

### 2. 配置 pytest (pytest.ini)

```ini
# pytest.ini
[pytest]
DJANGO_SETTINGS_MODULE = config.settings.test
python_files = tests.py test_*.py *_tests.py
addopts = 
    --strict-markers
    --cov=apps
    --cov-report=html
    --cov-report=term-missing:skip-covered
    --no-cov-on-fail
    -ra
    --reuse-db

markers =
    unit: Unit tests
    integration: Integration tests
    slow: Slow running tests
```

### 3. 測試設置文件 (config/settings/test.py)

```python
# config/settings/test.py
from .base import *

# 使用記憶體資料庫（快速）
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# 禁用密碼雜湊（加快測試）
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# 禁用快取
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    }
}

# 關閉調試
DEBUG = False

# 測試時不發送真實郵件
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'
```

**Node.js 對照:**

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.js'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
};
```

### 4. conftest.py（全局 Fixture）

```python
# conftest.py
import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.fixture
def api_client():
    """DRF API 客戶端"""
    return APIClient()

@pytest.fixture
def user():
    """創建測試用戶"""
    return User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='testpass123'
    )

@pytest.fixture
def authenticated_client(api_client, user):
    """已登入的客戶端"""
    api_client.force_authenticate(user=user)
    return api_client

@pytest.fixture
def admin_user():
    """管理員用戶"""
    return User.objects.create_superuser(
        username='admin',
        email='admin@example.com',
        password='admin123'
    )
```

**Node.js 對照:**

```javascript
// jest.setup.js
beforeEach(async () => {
  await User.destroy({ where: {} });
});
```

---

## 單元測試

### 1. 模型測試

```python
# apps/posts/tests/test_models.py
import pytest
from django.utils.text import slugify
from apps.posts.models import Post, Tag

@pytest.mark.django_db
class TestPostModel:
    """Post 模型測試"""
    
    def test_post_creation(self, user):
        """測試文章創建"""
        post = Post.objects.create(
            title='Test Post',
            content='Test content',
            summary='Test summary',
            cover_image='https://example.com/image.jpg',
            author=user
        )
        
        assert post.title == 'Test Post'
        assert post.author == user
        assert post.slug == slugify('Test Post')
        assert post.likes == 0
        assert post.views == 0
    
    def test_slug_auto_generation(self, user):
        """測試 slug 自動生成"""
        post = Post.objects.create(
            title='My First Post',
            content='Content',
            summary='Summary',
            cover_image='https://example.com/image.jpg',
            author=user
        )
        
        assert post.slug == 'my-first-post'
    
    def test_post_str_representation(self, user):
        """測試字串表示"""
        post = Post.objects.create(
            title='Test Post',
            content='Content',
            summary='Summary',
            cover_image='https://example.com/image.jpg',
            author=user
        )
        
        assert str(post) == 'Test Post'

@pytest.mark.django_db
class TestTagModel:
    """Tag 模型測試"""
    
    def test_tag_creation(self):
        """測試標籤創建"""
        tag = Tag.objects.create(name='climbing')
        
        assert tag.name == 'climbing'
        assert tag.slug == 'climbing'
    
    def test_tag_unique_constraint(self):
        """測試唯一性約束"""
        Tag.objects.create(name='climbing')
        
        with pytest.raises(Exception):
            Tag.objects.create(name='climbing')
```

**Node.js 對照:**

```javascript
// __tests__/models/Post.test.js
describe('Post Model', () => {
  test('should create post', async () => {
    const post = await Post.create({
      title: 'Test Post',
      content: 'Test content',
    });
    
    expect(post.title).toBe('Test Post');
    expect(post.slug).toBe('test-post');
  });
});
```

### 2. Serializer 測試

```python
# apps/posts/tests/test_serializers.py
import pytest
from apps.posts.models import Post
from apps.posts.serializers import PostSerializer, PostCreateSerializer

@pytest.mark.django_db
class TestPostSerializer:
    """PostSerializer 測試"""
    
    def test_serializer_with_valid_data(self, user):
        """測試有效資料序列化"""
        post = Post.objects.create(
            title='Test Post',
            content='Test content',
            summary='Test summary',
            cover_image='https://example.com/image.jpg',
            author=user
        )
        
        serializer = PostSerializer(post)
        data = serializer.data
        
        assert data['title'] == 'Test Post'
        assert data['author']['username'] == user.username
        assert 'created_at' in data
    
    def test_create_serializer_validation(self):
        """測試創建序列化器驗證"""
        data = {
            'title': 'Test',
            'content': 'Content',
            'summary': 'Summary',
            'cover_image': 'https://example.com/image.jpg'
        }
        
        serializer = PostCreateSerializer(data=data)
        assert serializer.is_valid()
    
    def test_create_serializer_invalid_data(self):
        """測試無效資料"""
        data = {
            'title': '',  # 空標題
            'content': 'Content'
        }
        
        serializer = PostCreateSerializer(data=data)
        assert not serializer.is_valid()
        assert 'title' in serializer.errors
```

**Node.js 對照:**

```javascript
// __tests__/validators/postValidator.test.js
describe('Post Validator', () => {
  test('should validate valid post data', () => {
    const result = postSchema.safeParse({
      title: 'Test Post',
      content: 'Content',
    });
    
    expect(result.success).toBe(true);
  });
});
```

### 3. 權限測試

```python
# apps/core/tests/test_permissions.py
import pytest
from apps.core.permissions import IsOwnerOrReadOnly
from apps.posts.models import Post

@pytest.mark.django_db
class TestIsOwnerOrReadOnly:
    """IsOwnerOrReadOnly 權限測試"""
    
    def test_owner_can_edit(self, user, api_client):
        """測試所有者可以編輯"""
        post = Post.objects.create(
            title='Test',
            content='Content',
            summary='Summary',
            cover_image='https://example.com/image.jpg',
            author=user
        )
        
        api_client.force_authenticate(user=user)
        response = api_client.put(f'/api/v1/posts/{post.id}/', {
            'title': 'Updated',
            'content': 'Updated content',
            'summary': 'Updated summary',
            'cover_image': 'https://example.com/image.jpg'
        })
        
        assert response.status_code == 200
    
    def test_non_owner_cannot_edit(self, user, api_client):
        """測試非所有者不能編輯"""
        other_user = User.objects.create_user(
            username='other',
            email='other@example.com',
            password='pass123'
        )
        
        post = Post.objects.create(
            title='Test',
            content='Content',
            summary='Summary',
            cover_image='https://example.com/image.jpg',
            author=other_user
        )
        
        api_client.force_authenticate(user=user)
        response = api_client.put(f'/api/v1/posts/{post.id}/', {
            'title': 'Updated'
        })
        
        assert response.status_code == 403
```

---

## 整合測試

### API 端點測試

```python
# apps/posts/tests/test_views.py
import pytest
from rest_framework import status
from apps.posts.models import Post, Tag

@pytest.mark.django_db
class TestPostViewSet:
    """Post ViewSet 整合測試"""
    
    def test_list_posts(self, api_client, user):
        """測試獲取文章列表"""
        # 創建測試資料
        Post.objects.create(
            title='Post 1',
            content='Content 1',
            summary='Summary 1',
            cover_image='https://example.com/1.jpg',
            author=user
        )
        Post.objects.create(
            title='Post 2',
            content='Content 2',
            summary='Summary 2',
            cover_image='https://example.com/2.jpg',
            author=user
        )
        
        # 發送請求
        response = api_client.get('/api/v1/posts/')
        
        # 斷言
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 2
    
    def test_create_post_authenticated(self, authenticated_client):
        """測試已登入用戶創建文章"""
        data = {
            'title': 'New Post',
            'content': 'New content',
            'summary': 'New summary',
            'cover_image': 'https://example.com/image.jpg'
        }
        
        response = authenticated_client.post('/api/v1/posts/', data)
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['title'] == 'New Post'
        assert Post.objects.count() == 1
    
    def test_create_post_unauthenticated(self, api_client):
        """測試未登入用戶不能創建文章"""
        data = {
            'title': 'New Post',
            'content': 'Content'
        }
        
        response = api_client.post('/api/v1/posts/', data)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_retrieve_post(self, api_client, user):
        """測試獲取單篇文章"""
        post = Post.objects.create(
            title='Test Post',
            content='Content',
            summary='Summary',
            cover_image='https://example.com/image.jpg',
            author=user
        )
        
        response = api_client.get(f'/api/v1/posts/{post.id}/')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['title'] == 'Test Post'
    
    def test_update_own_post(self, authenticated_client, user):
        """測試更新自己的文章"""
        post = Post.objects.create(
            title='Original',
            content='Content',
            summary='Summary',
            cover_image='https://example.com/image.jpg',
            author=user
        )
        
        response = authenticated_client.put(f'/api/v1/posts/{post.id}/', {
            'title': 'Updated',
            'content': 'Updated content',
            'summary': 'Updated summary',
            'cover_image': 'https://example.com/image.jpg'
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['title'] == 'Updated'
    
    def test_delete_post(self, authenticated_client, user):
        """測試刪除文章"""
        post = Post.objects.create(
            title='To Delete',
            content='Content',
            summary='Summary',
            cover_image='https://example.com/image.jpg',
            author=user
        )
        
        response = authenticated_client.delete(f'/api/v1/posts/{post.id}/')
        
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert Post.objects.count() == 0
    
    def test_like_post(self, authenticated_client, user):
        """測試按讚文章"""
        post = Post.objects.create(
            title='Test Post',
            content='Content',
            summary='Summary',
            cover_image='https://example.com/image.jpg',
            author=user
        )
        
        response = authenticated_client.post(f'/api/v1/posts/{post.id}/like/')
        
        assert response.status_code == status.HTTP_200_OK
        post.refresh_from_db()
        assert post.likes == 1
```

**Node.js 對照:**

```javascript
// __tests__/api/posts.test.js
describe('POST /api/posts', () => {
  test('should create post when authenticated', async () => {
    const response = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test', content: 'Content' });
    
    expect(response.status).toBe(201);
    expect(response.body.title).toBe('Test');
  });
});
```

### 認證流程測試

```python
# apps/users/tests/test_auth.py
import pytest
from rest_framework import status
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.mark.django_db
class TestAuthentication:
    """認證流程測試"""
    
    def test_register_user(self, api_client):
        """測試用戶註冊"""
        data = {
            'username': 'newuser',
            'email': 'new@example.com',
            'password': 'SecurePass123',
            'password_confirm': 'SecurePass123'
        }
        
        response = api_client.post('/api/v1/auth/register/', data)
        
        assert response.status_code == status.HTTP_201_CREATED
        assert 'access' in response.data
        assert 'refresh' in response.data
        assert User.objects.filter(username='newuser').exists()
    
    def test_register_password_mismatch(self, api_client):
        """測試密碼不匹配"""
        data = {
            'username': 'newuser',
            'email': 'new@example.com',
            'password': 'Pass123',
            'password_confirm': 'Different123'
        }
        
        response = api_client.post('/api/v1/auth/register/', data)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_login_success(self, api_client, user):
        """測試登入成功"""
        data = {
            'username': 'testuser',
            'password': 'testpass123'
        }
        
        response = api_client.post('/api/v1/auth/login/', data)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert 'refresh' in response.data
    
    def test_login_invalid_credentials(self, api_client):
        """測試無效憑證"""
        data = {
            'username': 'wrong',
            'password': 'wrong'
        }
        
        response = api_client.post('/api/v1/auth/login/', data)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_refresh_token(self, api_client, user):
        """測試刷新 token"""
        # 先登入獲取 token
        login_response = api_client.post('/api/v1/auth/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        })
        refresh_token = login_response.data['refresh']
        
        # 使用 refresh token 獲取新的 access token
        response = api_client.post('/api/v1/auth/refresh/', {
            'refresh': refresh_token
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
```

---

## 測試資料工廠

使用 `factory_boy` 簡化測試資料創建。

### 1. 定義 Factory

```python
# apps/posts/tests/factories.py
import factory
from faker import Faker
from apps.posts.models import Post, Tag
from apps.users.tests.factories import UserFactory

fake = Faker()

class TagFactory(factory.django.DjangoModelFactory):
    """標籤工廠"""
    class Meta:
        model = Tag
    
    name = factory.Faker('word')
    slug = factory.LazyAttribute(lambda obj: obj.name.lower())

class PostFactory(factory.django.DjangoModelFactory):
    """文章工廠"""
    class Meta:
        model = Post
    
    title = factory.Faker('sentence', nb_words=5)
    slug = factory.LazyAttribute(lambda obj: obj.title.lower().replace(' ', '-'))
    content = factory.Faker('text', max_nb_chars=1000)
    summary = factory.Faker('text', max_nb_chars=200)
    cover_image = factory.Faker('image_url')
    author = factory.SubFactory(UserFactory)
    likes = factory.Faker('random_int', min=0, max=100)
    views = factory.Faker('random_int', min=0, max=1000)
    
    @factory.post_generation
    def tags(self, create, extracted, **kwargs):
        """添加標籤"""
        if not create:
            return
        
        if extracted:
            for tag in extracted:
                self.tags.add(tag)
```

```python
# apps/users/tests/factories.py
import factory
from django.contrib.auth import get_user_model

User = get_user_model()

class UserFactory(factory.django.DjangoModelFactory):
    """用戶工廠"""
    class Meta:
        model = User
    
    username = factory.Sequence(lambda n: f'user{n}')
    email = factory.LazyAttribute(lambda obj: f'{obj.username}@example.com')
    display_name = factory.Faker('name')
    bio = factory.Faker('text', max_nb_chars=200)
    
    @factory.post_generation
    def password(self, create, extracted, **kwargs):
        """設置密碼"""
        if create:
            self.set_password(extracted or 'testpass123')
            self.save()
```

**Node.js 對照:**

```javascript
// __tests__/factories/userFactory.js
const faker = require('faker');

const createUser = (attrs = {}) => {
  return User.create({
    username: faker.internet.userName(),
    email: faker.internet.email(),
    password: 'password123',
    ...attrs,
  });
};
```

### 2. 使用 Factory

```python
# apps/posts/tests/test_views_with_factory.py
import pytest
from apps.posts.tests.factories import PostFactory, TagFactory
from apps.users.tests.factories import UserFactory

@pytest.mark.django_db
class TestPostViewSetWithFactory:
    """使用 Factory 的測試"""
    
    def test_list_many_posts(self, api_client):
        """測試列出多篇文章"""
        # 使用 factory 快速創建 10 篇文章
        PostFactory.create_batch(10)
        
        response = api_client.get('/api/v1/posts/')
        
        assert response.status_code == 200
        assert len(response.data['results']) == 10
    
    def test_post_with_tags(self, api_client):
        """測試帶標籤的文章"""
        tag1 = TagFactory(name='climbing')
        tag2 = TagFactory(name='outdoor')
        post = PostFactory(tags=[tag1, tag2])
        
        response = api_client.get(f'/api/v1/posts/{post.id}/')
        
        assert len(response.data['tags']) == 2
    
    def test_user_posts(self, api_client):
        """測試用戶的文章"""
        user = UserFactory()
        PostFactory.create_batch(3, author=user)
        PostFactory.create_batch(2)  # 其他用戶的文章
        
        response = api_client.get(f'/api/v1/users/{user.id}/posts/')
        
        assert len(response.data) == 3
```

---

## 測試組織結構

```
apps/
└── posts/
    ├── models.py
    ├── views.py
    ├── serializers.py
    └── tests/
        ├── __init__.py
        ├── factories.py          # 測試資料工廠
        ├── test_models.py        # 模型單元測試
        ├── test_serializers.py   # 序列化器測試
        ├── test_views.py         # 視圖整合測試
        └── test_permissions.py   # 權限測試
```

**Node.js 對照:**

```
src/
└── posts/
    ├── post.model.js
    ├── post.controller.js
    └── __tests__/
        ├── post.model.test.js
        ├── post.controller.test.js
        └── factories/
            └── postFactory.js
```

---

## 持續整合

### GitHub Actions 配置

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
        pip install -r requirements-dev.txt
    
    - name: Run tests with coverage
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
      run: |
        pytest --cov=apps --cov-report=xml
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage.xml
```

### 本地測試命令

```bash
# 運行所有測試
pytest

# 運行特定測試文件
pytest apps/posts/tests/test_views.py

# 運行特定測試類
pytest apps/posts/tests/test_views.py::TestPostViewSet

# 運行特定測試方法
pytest apps/posts/tests/test_views.py::TestPostViewSet::test_create_post

# 運行帶標記的測試
pytest -m unit          # 只運行單元測試
pytest -m integration   # 只運行整合測試

# 並行運行測試
pytest -n 4  # 使用 4 個進程

# 帶覆蓋率報告
pytest --cov=apps --cov-report=html

# 只運行失敗的測試
pytest --lf

# 詳細輸出
pytest -v

# 顯示所有輸出
pytest -s
```

---

## 最佳實踐

### 1. 使用 Fixture 減少重複

```python
@pytest.fixture
def post_data():
    """文章測試資料"""
    return {
        'title': 'Test Post',
        'content': 'Content',
        'summary': 'Summary',
        'cover_image': 'https://example.com/image.jpg'
    }

def test_create_post(authenticated_client, post_data):
    response = authenticated_client.post('/api/v1/posts/', post_data)
    assert response.status_code == 201
```

### 2. 使用 Parametrize 測試多種情況

```python
@pytest.mark.parametrize('username,password,expected', [
    ('valid', 'ValidPass123', 201),
    ('', 'pass', 400),
    ('user', '', 400),
    ('ab', 'pass', 400),  # 用戶名太短
])
def test_register_validation(api_client, username, password, expected):
    response = api_client.post('/api/v1/auth/register/', {
        'username': username,
        'password': password,
        'password_confirm': password
    })
    assert response.status_code == expected
```

### 3. 測試邊界情況

```python
def test_pagination_edge_cases(api_client):
    """測試分頁邊界"""
    PostFactory.create_batch(25)
    
    # 第一頁
    response = api_client.get('/api/v1/posts/?page=1')
    assert len(response.data['results']) == 20
    
    # 最後一頁
    response = api_client.get('/api/v1/posts/?page=2')
    assert len(response.data['results']) == 5
    
    # 超出範圍
    response = api_client.get('/api/v1/posts/?page=999')
    assert response.status_code == 404
```

---

## 下一步

繼續閱讀：

- [前端集成指南](./06-frontend-integration.md)
- [部署指南](./04-deployment-guide.md)
- [API 實作指南](./03-api-implementation-guide.md)

---

**測試快速參考：**

```bash
# 快速開始
pip install -r requirements-dev.txt
pytest

# 常用命令
pytest -v              # 詳細輸出
pytest -s              # 顯示 print
pytest -x              # 遇錯停止
pytest -k "test_name"  # 按名稱篩選
pytest --lf            # 重跑失敗的測試
```
