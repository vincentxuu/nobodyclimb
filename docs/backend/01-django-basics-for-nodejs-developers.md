# Django 基礎教學 - 給 Node.js 開發者

> 這份檔案是為熟悉 Node.js 但不熟悉 Django 的開發者準備的快速入門指南。

## 目錄

- [Django vs Node.js 概念對比](#django-vs-nodejs-概念對比)
- [Python 基礎速成](#python-基礎速成)
- [Django 核心概念](#django-核心概念)
- [Django REST Framework 介紹](#django-rest-framework-介紹)
- [常用命令對照表](#常用命令對照表)

---

## Django vs Node.js 概念對比

### 框架對比

| Node.js/Express | Django | 說明 |
|----------------|--------|------|
| Express | Django | Web 框架 |
| package.json | requirements.txt / pyproject.toml | 依賴管理 |
| npm / yarn / pnpm | pip / poetry | 套件管理器 |
| node_modules/ | venv/ | 依賴安裝目錄 |
| .env | .env / settings.py | 環境變數配置 |
| app.js / server.js | wsgi.py / asgi.py | 應用程式入口 |
| routes/ | urls.py | 路由配置 |
| controllers/ | views.py | 業務邏輯 |
| models/ (ORM) | models.py | 資料模型 |
| middleware/ | middleware.py | 中介軟體 |
| .env | .env + settings.py | 環境變數 + 配置 |
| controllers/ | views.py | 控制器/視圖 |
| services/ | services.py (custom) | 業務邏輯層 |
| validators/ | serializers.py | 驗證器 |

### 資料库對比

| Node.js | Django | 說明 |
|---------|--------|------|
| Sequelize / TypeORM | Django ORM | ORM 框架 (內建) |
| migrations/ | migrations/ | 資料库遷移 |
| User.findAll() | User.objects.all() | 查詢所有 |
| User.findOne({where}) | User.objects.get(...) | 查詢單一筆 |
| User.findByPk(id) | User.objects.get(pk=id) | 按主鍵查詢 |
| User.findAll({where}) | User.objects.filter(...) | 條件查詢 |
| User.create({...}) | User.objects.create(...) | 建立記錄 |
| user.save() | user.save() | 儲存記錄 |
| user.destroy() | user.delete() | 刪除記錄 |
| User.count() | User.objects.count() | 計數 |
| User.findAll({include}) | select_related() / prefetch_related() | 關聯查詢 |
| User.findAll({order}) | User.objects.order_by() | 排序 |
| User.findAll({limit, offset}) | User.objects.all()[offset:limit] | 分頁 |

### API 對比

| Express | Django REST Framework | 說明 |
|---------|----------------------|------|
| app.get('/api/users') | @api_view(['GET']) | 路由裝飾器 |
| res.json({data}) | Response({data}) | JSON 回應 |
| req.body | request.data | 請求本體 |
| req.params | request.query_params | 查詢參數 |
| req.user | request.user | 當前使用者 |
| JWT middleware | TokenAuthentication | 認證中介軟體 |
| Joi / Zod | Serializers | 資料驗證 |
| express.Router() | DefaultRouter() | 路由管理 |
| app.use(middleware) | MIDDLEWARE setting | 中介軟體註冊 |
| res.status(200) | status.HTTP_200_OK | HTTP 狀態碼 |

---

## Python 基礎速成

### 1. 語法差異

#### 變數宣告

```javascript
// JavaScript
const name = "John";
let age = 25;
var isActive = true;
```

```python
# Python (無需宣告類型，無分號)
name = "John"
age = 25
is_active = True  # 注意: 首字母大寫
```

#### 函式定義

```javascript
// JavaScript
function greet(name) {
  return `Hello, ${name}!`;
}

const add = (a, b) => a + b;
```

```python
# Python (使用縮排，不用大括號)
def greet(name):
    return f"Hello, {name}!"  # f-string 類似模板字串

def add(a, b):
    return a + b
```

#### 條件敘述

```javascript
// JavaScript
if (age >= 18) {
  console.log("Adult");
} else {
  console.log("Minor");
}
```

```python
# Python (使用縮排代替大括號)
if age >= 18:
    print("Adult")
else:
    print("Minor")
```

#### 迴圈

```javascript
// JavaScript
for (let i = 0; i < 5; i++) {
  console.log(i);
}

users.forEach(user => {
  console.log(user.name);
});
```

```python
# Python
for i in range(5):
    print(i)

for user in users:
    print(user.name)
```

#### 物件 / 字典

```javascript
// JavaScript
const user = {
  name: "John",
  age: 25,
  email: "john@example.com"
};

console.log(user.name);
console.log(user['age']);
```

```python
# Python (字典)
user = {
    "name": "John",
    "age": 25,
    "email": "john@example.com"
}

print(user["name"])  # 字典只能用方括號訪問
print(user.get("age"))  # 安全訪問
```

#### 陣列 / 列表

```javascript
// JavaScript
const fruits = ["apple", "banana", "orange"];
fruits.push("grape");
const first = fruits[0];
```

```python
# Python (列表)
fruits = ["apple", "banana", "orange"]
fruits.append("grape")
first = fruits[0]
```

#### 類別

```javascript
// JavaScript
class User {
  constructor(name, email) {
    this.name = name;
    this.email = email;
  }

  greet() {
    return `Hello, ${this.name}`;
  }
}

const user = new User("John", "john@example.com");
```

```python
# Python
class User:
    def __init__(self, name, email):  # 建構函式
        self.name = name  # self 類似 this
        self.email = email

    def greet(self):
        return f"Hello, {self.name}"

user = User("John", "john@example.com")  # 無需 new
```

### 2. 常用資料類型

| JavaScript | Python | 說明 |
|-----------|--------|------|
| true / false | True / False | 布林值 (首字母大寫) |
| null | None | 空值 |
| undefined | None | 未定義 |
| "string" | "string" 或 'string' | 字串 |
| 123 | 123 | 整數 |
| 123.45 | 123.45 | 浮點數 |
| [] | [] | 陣列/列表 |
| {} | {} | 物件/字典 |

### 3. 模組匯入

```javascript
// JavaScript
import { User } from './models/User';
const express = require('express');
export default app;
```

```python
# Python
from models import User  # 相對匯入
import os  # 標準函式庫匯入
from django.db import models  # 第三方函式庫匯入
```

---

## Django 核心概念

### 1. 專案結構

Django 專案由一個**專案 (Project)** 和多個**應用程式 (App)** 組成：

```
nobodyclimb-backend/          # 專案根目錄
├── manage.py                 # 管理腳本 (類似 npm scripts)
├── config/                   # 專案配置目錄
│   ├── __init__.py
│   ├── settings.py           # 全局配置 (類似 config.js)
│   ├── urls.py               # 根路由 (主路由表)
│   ├── wsgi.py               # WSGI 入口
│   └── asgi.py               # ASGI 入口
├── apps/                     # 應用程式目錄
│   ├── users/                # 使用者應用程式
│   │   ├── models.py         # 資料模型 (類似 User model)
│   │   ├── views.py          # 視圖/控制器
│   │   ├── serializers.py    # 序列化器 (資料驗證)
│   │   ├── urls.py           # 應用程式路由
│   │   └── admin.py          # 後台管理
│   ├── posts/                # 文章應用程式
│   └── gyms/                 # 攀岩館應用程式
├── requirements.txt          # 依賴列表
└── .env                      # 環境變數
```

### 2. MTV 架構模式

Django 使用 **MTV (Model-Template-View)** 模式，類似 MVC：

| MVC | MTV | 說明 |
|-----|-----|------|
| Model | Model | 資料模型 |
| View | Template | 視圖模板 (前後端分離时不常用) |
| Controller | View | 業務邏輯 |

**對於 API 開發，主要關注 Model 和 View。**

### 3. Models (資料模型)

**類似 Sequelize/TypeORM 的模型定義：**

```python
# models.py
from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    """使用者模型"""
    display_name = models.CharField(max_length=100, blank=True)
    bio = models.TextField(blank=True)
    avatar = models.URLField(blank=True)
    climbing_start_year = models.CharField(max_length=4, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'
        ordering = ['-created_at']

class Post(models.Model):
    """文章模型"""
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    content = models.TextField()
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
```

**常用欄位類型：**

| Django | 說明 | JavaScript 對應 |
|--------|------|----------------|
| CharField | 短字串 | string |
| TextField | 長文字 | string |
| IntegerField | 整數 | number |
| BooleanField | 布林值 | boolean |
| DateTimeField | 日期時間 | Date |
| ForeignKey | 外鍵關係 | relation |
| JSONField | JSON 資料 | object/array |
| URLField | URL | string |

### 4. Views (視圖)

**類似 Express 的 controller/route handler：**

```python
# views.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

@api_view(['GET', 'POST'])
def user_list(request):
    """使用者列表"""
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

**等價的 Express 程式碼：**

```javascript
// Express
app.get('/api/users', async (req, res) => {
  const users = await User.findAll();
  res.json(users);
});

app.post('/api/users', async (req, res) => {
  const user = await User.create(req.body);
  res.status(201).json(user);
});
```

### 5. URLs (路由)

```python
# urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('users/', views.user_list),           # GET/POST /api/users/
    path('users/<int:pk>/', views.user_detail), # GET/PUT/DELETE /api/users/1/
]
```

**等價的 Express 程式碼：**

```javascript
// Express
app.get('/api/users', userList);
app.post('/api/users', userList);
app.get('/api/users/:id', userDetail);
```

### 6. Serializers (序列化器)

**Serializers 是 DRF 的核心，結合了 Zod/Joi 驗證 + JSON 轉換器的功能：**

#### 基本 Serializer 對比

**Zod (Node.js):**

```javascript
import { z } from 'zod';

const userSchema = z.object({
  username: z.string().min(3).max(150),
  email: z.string().email(),
  displayName: z.string().optional(),
  bio: z.string().optional(),
  age: z.number().int().positive()
});

// 驗證
const result = userSchema.safeParse(data);
if (!result.success) {
  console.error(result.error);
}
```

**Django REST Framework Serializer:**

```python
from rest_framework import serializers

class UserSerializer(serializers.Serializer):
    """基本序列化器 - 類似 Zod schema"""
    username = serializers.CharField(min_length=3, max_length=150)
    email = serializers.EmailField()
    display_name = serializers.CharField(required=False, allow_blank=True)
    bio = serializers.CharField(required=False, allow_blank=True)
    age = serializers.IntegerField(min_value=1)
    
    def validate_age(self, value):
        """自定義欄位驗證"""
        if value < 18:
            raise serializers.ValidationError("必須年滿 18 歲")
        return value
    
    def validate(self, data):
        """跨欄位驗證"""
        if data['username'] == data.get('display_name'):
            raise serializers.ValidationError("使用者名稱和顯示名稱不能相同")
        return data
```

#### ModelSerializer - 更強大的版本

**DRF 的 ModelSerializer 自動從 Model 生成驗證規則：**

```python
class UserSerializer(serializers.ModelSerializer):
    """模型序列化器 - 自動映射 Model 欄位"""
    
    # 可以添加額外的計算欄位
    full_name = serializers.SerializerMethodField()
    post_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'display_name', 
            'bio', 'avatar', 'full_name', 'post_count'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'email': {'required': True, 'allow_blank': False},
            'password': {'write_only': True, 'min_length': 8}
        }
    
    def get_full_name(self, obj):
        """計算欄位 - 類似 getter"""
        return f"{obj.first_name} {obj.last_name}".strip()
    
    def create(self, validated_data):
        """自定義建立邏輯"""
        return User.objects.create_user(**validated_data)
    
    def update(self, instance, validated_data):
        """自定義更新邏輯"""
        # 特殊處理密碼
        password = validated_data.pop('password', None)
        instance = super().update(instance, validated_data)
        if password:
            instance.set_password(password)
            instance.save()
        return instance
```

**Node.js 無直接等價物** - 需要組合多個函式庫：

```javascript
// Node.js 需要組合 Zod + 手動轉換
const userSchema = z.object({...});

// 手動序列化
function serializeUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: `${user.firstName} ${user.lastName}`.trim(),
    postCount: user.posts?.length || 0
  };
}

// 手動驗證 + 建立
async function createUser(data) {
  const validated = userSchema.parse(data);  // Zod 驗證
  return await User.create(validated);        // Sequelize 建立
}
```

#### 嵌套 Serializers

**處理關聯數據：**

```python
class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug']

class PostSerializer(serializers.ModelSerializer):
    # 嵌套序列化器 - 顯示完整的關聯對象
    author = UserSerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    
    # 或者只接收 ID 列表進行寫入
    tag_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Post
        fields = ['id', 'title', 'content', 'author', 'tags', 'tag_ids']
    
    def create(self, validated_data):
        tag_ids = validated_data.pop('tag_ids', [])
        post = Post.objects.create(**validated_data)
        if tag_ids:
            post.tags.set(tag_ids)
        return post
```

**Node.js 對照：**

```javascript
// Express + Zod
const postSchema = z.object({
  title: z.string(),
  content: z.string(),
  tagIds: z.array(z.number()).optional()
});

app.post('/posts', async (req, res) => {
  const data = postSchema.parse(req.body);
  const post = await Post.create(data, {
    include: [{ model: Tag }, { model: User, as: 'author' }]
  });
  res.json(serializePost(post));  // 手動序列化
});
```

#### 常用 Serializer 欄位類型

| Zod (Node.js) | DRF Serializer | 說明 |
|--------------|----------------|------|
| z.string() | CharField() | 字串 |
| z.string().email() | EmailField() | 電子郵件 |
| z.string().url() | URLField() | URL |
| z.number() | IntegerField() | 整數 |
| z.number() | FloatField() | 浮點數 |
| z.boolean() | BooleanField() | 布林值 |
| z.date() | DateTimeField() | 日期時間 |
| z.enum([...]) | ChoiceField() | 選項 |
| z.array(z.string()) | ListField() | 列表 |
| z.object({...}) | 嵌套 Serializer | 嵌套對象 |
| z.string().optional() | CharField(required=False) | 可選欄位 |

#### 驗證錯誤處理

**DRF 自動格式化驗證錯誤：**

```python
# 驗證失敗時
serializer = UserSerializer(data=invalid_data)
if not serializer.is_valid():
    print(serializer.errors)
    # 輸出:
    # {
    #     'email': ['Enter a valid email address.'],
    #     'age': ['Ensure this value is greater than or equal to 1.']
    # }
```

**Node.js (Zod) 對照：**

```javascript
try {
  userSchema.parse(invalid_data);
} catch (error) {
  console.log(error.errors);
  // [
  //   { path: ['email'], message: 'Invalid email' },
  //   { path: ['age'], message: 'Number must be greater than 0' }
  // ]
}
```

#### 序列化 vs 反序列化

**Django Serializers 同時處理兩個方向：**

```python
# 序列化（Model → JSON）- 類似 JSON.stringify()
user = User.objects.get(id=1)
serializer = UserSerializer(user)
json_data = serializer.data  # Python dict，可轉為 JSON

# 反序列化（JSON → Model）- 類似驗證 + 建立
data = {'username': 'john', 'email': 'john@example.com'}
serializer = UserSerializer(data=data)
if serializer.is_valid():
    user = serializer.save()  # 儲存到資料庫
```

**Node.js 需要分開處理：**

```javascript
// 序列化
const jsonData = JSON.stringify(user);

// 反序列化 + 驗證
const validated = userSchema.parse(JSON.parse(data));
const user = await User.create(validated);
```

---

## Django REST Framework 介紹

Django REST Framework (DRF) 是 Django 的擴充，專門用于建構 RESTful API。

### 1. ViewSets (視圖集) vs Express Route Handlers

#### ViewSets 概念

**ViewSets 是 DRF 的核心概念，它將 CRUD 操作集中到一個類中，類似 Express 的資源路由控制器。**

#### 基本對比：函數式 API View vs Express Handler

**Express (Node.js):**

```javascript
// routes/users.js
const express = require('express');
const router = express.Router();

// List all users
router.get('/', async (req, res) => {
  const users = await User.findAll();
  res.json(users);
});

// Create user
router.post('/', async (req, res) => {
  const user = await User.create(req.body);
  res.status(201).json(user);
});

// Get single user
router.get('/:id', async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json(user);
});

// Update user
router.put('/:id', async (req, res) => {
  const user = await User.findByPk(req.params.id);
  await user.update(req.body);
  res.json(user);
});

// Delete user
router.delete('/:id', async (req, res) => {
  const user = await User.findByPk(req.params.id);
  await user.destroy();
  res.status(204).send();
});

module.exports = router;
```

**Django REST Framework (函數式 View):**

```python
# views.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

@api_view(['GET', 'POST'])
def user_list(request):
    """列出所有使用者或建立新使用者"""
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

@api_view(['GET', 'PUT', 'DELETE'])
def user_detail(request, pk):
    """取得、更新或刪除單一使用者"""
    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = UserSerializer(user)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = UserSerializer(user, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
```

#### ViewSet：更強大的方式

**DRF 的 ViewSet 將所有 CRUD 操作集中管理：**

```python
# views.py
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly

class UserViewSet(viewsets.ModelViewSet):
    """
    完整的 CRUD ViewSet - 自動提供所有操作
    
    自動生成的動作：
    - list()    -> GET /users/
    - create()  -> POST /users/
    - retrieve() -> GET /users/{id}/
    - update()  -> PUT /users/{id}/
    - partial_update() -> PATCH /users/{id}/
    - destroy() -> DELETE /users/{id}/
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    # 可以覆寫特定方法來自定義行為
    def retrieve(self, request, pk=None):
        """自定義單一使用者查詢 - 增加瀏覽計數"""
        user = self.get_object()
        user.profile_views += 1
        user.save()
        serializer = self.get_serializer(user)
        return Response(serializer.data)
```

**Node.js 沒有直接等價物** - 最接近的是類似的資源控制器模式：

```javascript
// controllers/UserController.js
class UserController {
  async index(req, res) {
    const users = await User.findAll();
    res.json(users);
  }
  
  async create(req, res) {
    const user = await User.create(req.body);
    res.status(201).json(user);
  }
  
  async show(req, res) {
    const user = await User.findByPk(req.params.id);
    res.json(user);
  }
  
  async update(req, res) {
    const user = await User.findByPk(req.params.id);
    await user.update(req.body);
    res.json(user);
  }
  
  async destroy(req, res) {
    const user = await User.findByPk(req.params.id);
    await user.destroy();
    res.status(204).send();
  }
}

// routes/users.js
const controller = new UserController();
router.get('/', controller.index);
router.post('/', controller.create);
router.get('/:id', controller.show);
router.put('/:id', controller.update);
router.delete('/:id', controller.destroy);
```

#### ViewSet 與 Router 自動路由

**DRF 的 Router 自動將 ViewSet 映射到 URL：**

```python
# urls.py
from rest_framework.routers import DefaultRouter
from .views import UserViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = router.urls

# 自動生成的路由：
# GET    /users/          -> list()
# POST   /users/          -> create()
# GET    /users/{pk}/     -> retrieve()
# PUT    /users/{pk}/     -> update()
# PATCH  /users/{pk}/     -> partial_update()
# DELETE /users/{pk}/     -> destroy()
```

**Express 需要手動定義所有路由：**

```javascript
router.get('/users', controller.index);
router.post('/users', controller.create);
router.get('/users/:id', controller.show);
router.put('/users/:id', controller.update);
router.delete('/users/:id', controller.destroy);
```

#### 自定義 ViewSet 動作（Custom Actions）

**ViewSets 可以添加額外的端點：**

```python
from rest_framework.decorators import action

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """列出最近註冊的使用者 - GET /users/recent/"""
        recent_users = User.objects.order_by('-created_at')[:10]
        serializer = self.get_serializer(recent_users, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def follow(self, request, pk=None):
        """關注使用者 - POST /users/{id}/follow/"""
        user = self.get_object()
        request.user.following.add(user)
        return Response({'status': 'following'})
    
    @action(detail=True, methods=['get'])
    def posts(self, request, pk=None):
        """取得使用者的文章 - GET /users/{id}/posts/"""
        user = self.get_object()
        posts = user.posts.all()
        serializer = PostSerializer(posts, many=True)
        return Response(serializer.data)
```

**Express 對照：**

```javascript
// 需要手動添加每個路由
router.get('/users/recent', controller.getRecent);
router.post('/users/:id/follow', controller.follow);
router.get('/users/:id/posts', controller.getPosts);
```

#### ViewSet 類型對比

| ViewSet 類型 | 提供的動作 | Express 等價 | 使用場景 |
|-------------|----------|-------------|---------|
| **ViewSet** | 無（需手動實現） | 空控制器類 | 完全自定義 |
| **GenericViewSet** | 提供基礎功能，無預設動作 | 基礎控制器 | 選擇性實現動作 |
| **ReadOnlyModelViewSet** | list(), retrieve() | GET 端點 | 唯讀 API |
| **ModelViewSet** | 全部 CRUD 動作 | 完整 CRUD 控制器 | 標準資源 API |

**範例：ReadOnlyModelViewSet**

```python
class VideoViewSet(viewsets.ReadOnlyModelViewSet):
    """影片 API - 僅供讀取"""
    queryset = Video.objects.all()
    serializer_class = VideoSerializer
    
    # 只提供 GET 操作
    # - GET /videos/         -> 列表
    # - GET /videos/{id}/    -> 詳情
    # POST, PUT, DELETE 自動返回 405 Method Not Allowed
```

#### 權限控制對比

**DRF ViewSet 權限：**

```python
from rest_framework.permissions import IsAuthenticated, AllowAny
from apps.core.permissions import IsOwnerOrReadOnly

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    
    def get_permissions(self):
        """根據動作設定不同權限"""
        if self.action in ['create']:
            # 建立需要登入
            permission_classes = [IsAuthenticated]
        elif self.action in ['update', 'partial_update', 'destroy']:
            # 編輯和刪除需要是作者
            permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
        else:
            # 列表和詳情公開
            permission_classes = [AllowAny]
        return [permission() for permission in permission_classes]
```

**Express 中介軟體對照：**

```javascript
// middleware/auth.js
const requireAuth = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  next();
};

const requireOwner = async (req, res, next) => {
  const post = await Post.findByPk(req.params.id);
  if (post.authorId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

// 需要為每個路由手動添加
router.get('/posts', getAllPosts);  // 公開
router.post('/posts', requireAuth, createPost);  // 需登入
router.put('/posts/:id', requireAuth, requireOwner, updatePost);  // 需是作者
router.delete('/posts/:id', requireAuth, requireOwner, deletePost);
```

#### ViewSet 優缺點總結

**✅ ViewSet 優點：**

- 自動生成標準 CRUD 端點，減少重複代碼
- 路由自動管理，無需手動配置
- 內建分頁、過濾、權限等功能
- 統一的 API 結構和慣例

**⚠️ ViewSet 可能的挑戰（對 Node.js 開發者）：**

- 學習曲線：需要理解類別繼承和 Mixin
- 「魔法」較多：自動行為可能不夠明確
- 靈活性較低：高度自定義可能需要覆寫很多方法

**💡 建議：**

- 標準 CRUD 操作 → 使用 ModelViewSet（最快）
- 需要自定義邏輯 → 使用 GenericViewSet + Mixins
- 完全自定義 API → 使用函數式 @api_view（類似 Express）

### 2. 認證與權限

```python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
}
```

**類似 Express JWT middleware：**

```javascript
// Express
app.use('/api/protected', authenticateToken);
```

### 3. 分頁

```python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20
}
```

**自動為列表視圖新增分頁：**

```json
{
  "count": 100,
  "next": "http://api.example.com/users/?page=2",
  "previous": null,
  "results": [...]
}
```

### 4. 過濾和搜尋

```python
# views.py
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['author', 'tags']
    search_fields = ['title', 'content']
    ordering_fields = ['created_at', 'likes']
```

**支援的查詢：**

- `/api/posts/?author=1` - 過濾
- `/api/posts/?search=攀岩` - 搜尋
- `/api/posts/?ordering=-created_at` - 排序

---

## 常用命令對照表

### 專案管理

| 功能 | Node.js | Django |
|-----|---------|--------|
| 初始化專案 | `npm init` | `django-admin startproject myproject` |
| 建立應用程式 | - | `python manage.py startapp myapp` |
| 安裝依賴 | `npm install` | `pip install -r requirements.txt` |
| 新增依賴 | `npm install express` | `pip install django` |
| 啟動開發伺服器 | `npm run dev` | `python manage.py runserver` |
| 執行測試 | `npm test` | `python manage.py test` |

### 資料库

| 功能 | Node.js (Sequelize) | Django |
|-----|---------------------|--------|
| 建立遷移 | `npx sequelize migration:create` | `python manage.py makemigrations` |
| 執行遷移 | `npx sequelize db:migrate` | `python manage.py migrate` |
| 回滚遷移 | `npx sequelize db:migrate:undo` | `python manage.py migrate app_name zero` |
| 資料库 shell | - | `python manage.py dbshell` |

### 其他

| 功能 | Django 命令 |
|-----|------------|
| 建立超级使用者 | `python manage.py createsuperuser` |
| 收集靜態檔案 | `python manage.py collectstatic` |
| 進入 Python shell | `python manage.py shell` |
| 清除快取 | `python manage.py clear_cache` |

---

## 虛擬環境 (類似 node_modules)

Python 使用虛擬環境隔離依賴：

```bash
# 建立虛擬環境
python -m venv venv

# 啟動虛擬環境
# macOS/Linux
source venv/bin/activate

# Windows
venv\Scripts\activate

# 停用虛擬環境
deactivate
```

**類別比：**

- `venv/` = `node_modules/`
- `requirements.txt` = `package.json`
- `pip install` = `npm install`

---

## Django 術語表 - Node.js 開發者速查

### 核心概念對照

| Django 術語 | Node.js 等價 | 說明 | 範例 |
|-----------|------------|------|------|
| **Project** | Application | 整個應用程式 | nobodyclimb-backend |
| **App** | Module/Feature | 功能模組 | users/, posts/, gyms/ |
| **Model** | ORM Model/Entity | 數據模型 | User, Post |
| **View** | Route Handler/Controller | 請求處理器 | user_list(), UserViewSet |
| **Serializer** | Validator + Transformer | 驗證+序列化 | UserSerializer |
| **ViewSet** | Resource Controller | 資源控制器 | UserViewSet |
| **URLconf** | Router | 路由配置 | urls.py |
| **Middleware** | Middleware | 中介軟體 | middleware.py |
| **Migration** | Migration | 數據庫遷移 | 0001_initial.py |
| **QuerySet** | Query Builder | 查詢構建器 | User.objects.all() |
| **Manager** | Repository | 數據訪問層 | User.objects |
| **Template** | View Template | 視圖模板 | （前後端分離不常用）|

### ORM 術語對照

| Django ORM | Sequelize/TypeORM | 說明 |
|-----------|------------------|------|
| `Model.objects.all()` | `Model.findAll()` | 查詢所有 |
| `Model.objects.get()` | `Model.findOne()` / `findByPk()` | 查詢單筆 |
| `Model.objects.filter()` | `Model.findAll({ where })` | 條件查詢 |
| `Model.objects.create()` | `Model.create()` | 建立記錄 |
| `instance.save()` | `instance.save()` | 儲存記錄 |
| `instance.delete()` | `instance.destroy()` | 刪除記錄 |
| `select_related()` | `include: []` (eager loading) | JOIN 查詢 |
| `prefetch_related()` | `include: []` (separate queries) | 預載入 |
| `annotate()` | `attributes: [[fn, 'alias']]` | 添加計算欄位 |
| `aggregate()` | `Model.findAll({ attributes })` | 聚合函數 |
| `Q objects` | `Op.and`, `Op.or` | 複雜查詢 |

### HTTP/API 術語對照

| Django/DRF | Express | 說明 |
|-----------|---------|------|
| `request.data` | `req.body` | 請求體 |
| `request.query_params` | `req.query` | 查詢參數 |
| `request.user` | `req.user` | 當前使用者 |
| `Response()` | `res.json()` | JSON 回應 |
| `status.HTTP_200_OK` | `res.status(200)` | HTTP 狀態碼 |
| `@api_view(['GET'])` | `router.get()` | 路由裝飾器 |
| `permission_classes` | middleware | 權限檢查 |
| `authentication_classes` | middleware | 認證檢查 |
| `DefaultRouter()` | `express.Router()` | 路由器 |
| `@action` | custom route | 自定義端點 |

### 設定和配置術語

| Django | Node.js | 說明 |
|--------|---------|------|
| `settings.py` | `config.js` + `.env` | 配置文件 |
| `INSTALLED_APPS` | dependencies | 已安裝應用 |
| `MIDDLEWARE` | `app.use()` | 中介軟體列表 |
| `DATABASES` | database config | 資料庫配置 |
| `SECRET_KEY` | `JWT_SECRET` | 密鑰 |
| `DEBUG` | `NODE_ENV` | 調試模式 |
| `ALLOWED_HOSTS` | CORS config | 允許的主機 |
| `STATIC_URL` | `/public` | 靜態文件路徑 |

### 命令行工具對照

| Django 命令 | Node.js/npm 等價 | 說明 |
|-----------|-----------------|------|
| `python manage.py` | `npm run` | 執行命令 |
| `runserver` | `npm run dev` | 啟動開發伺服器 |
| `makemigrations` | `npx prisma migrate dev` | 建立遷移 |
| `migrate` | `npx sequelize db:migrate` | 執行遷移 |
| `shell` | `node` (REPL) | 交互式 shell |
| `createsuperuser` | custom script | 建立管理員 |
| `test` | `npm test` | 執行測試 |
| `collectstatic` | `npm run build` | 收集靜態文件 |

### 常用縮寫

- **DRF**: Django REST Framework
- **ORM**: Object-Relational Mapping（物件關聯映射）
- **MTV**: Model-Template-View（Django 架構模式）
- **WSGI**: Web Server Gateway Interface（Python Web 伺服器介面）
- **ASGI**: Asynchronous Server Gateway Interface（非同步伺服器介面）
- **CBV**: Class-Based Views（類別視圖）
- **FBV**: Function-Based Views（函數視圖）

---

## Node.js 開發者常見陷阱

### 1. Python 語法差異

#### 陷阱：縮排很重要

❌ **錯誤（JavaScript 思維）：**

```python
# 這樣會報錯！Python 使用縮排而非大括號
def my_function():
return "Hello"  # IndentationError!
```

✅ **正確：**

```python
def my_function():
    return "Hello"  # 必須縮排 4 個空格或 1 個 Tab
```

#### 陷阱：布林值首字母大寫

❌ **錯誤：**

```python
is_active = true  # NameError: name 'true' is not defined
```

✅ **正確：**

```python
is_active = True  # Python 的布林值首字母大寫
is_deleted = False
value = None  # 不是 null
```

### 2. 非同步處理差異

#### 陷阱：Django 預設是同步的

**Node.js (非同步)：**

```javascript
// Node.js 中一切都是非同步的
const users = await User.findAll();
const posts = await Post.findAll();
```

**Django (同步)：**

```python
# Django ORM 預設是同步的，不需要 await
users = User.objects.all()  # 不用 await！
posts = Post.objects.all()
```

**💡 重點：** Django 3.1+ 支援 async views，但大部分情況下不需要。ORM 操作是同步的，這簡化了很多事情。

### 3. QuerySet 是惰性的（Lazy Evaluation）

#### 陷阱：QuerySet 不會立即執行

❌ **錯誤理解：**

```python
# Node.js 開發者可能認為這會執行查詢
users = User.objects.filter(is_active=True)
# 實際上還沒有查詢資料庫！
```

✅ **正確理解：**

```python
users = User.objects.filter(is_active=True)  # 建立 QuerySet，未執行
# 只有在實際使用時才執行查詢：
for user in users:  # 現在才執行查詢
    print(user.name)
    
# 或者
count = users.count()  # 執行查詢
list_users = list(users)  # 執行查詢
```

**Node.js 對照：**

```javascript
// Sequelize 立即返回 Promise
const users = await User.findAll({ where: { isActive: true } });
// 已經執行了查詢
```

### 4. 裝飾器語法（Decorators）

#### 陷阱：@ 符號不是註解

❌ **錯誤理解（認為是註解）：**

```python
@api_view(['GET'])  # 這不是註解！
def my_view(request):
    pass
```

✅ **正確理解：**

```python
# 裝飾器是函數包裝器，類似 JavaScript 的高階函數
@api_view(['GET'])  # 包裝函數
@permission_classes([IsAuthenticated])  # 可以堆疊
def my_view(request):
    return Response({'message': 'Hello'})
```

**Node.js 對照（中介軟體）：**

```javascript
const requireAuth = (req, res, next) => { /* ... */ };

// Express 中介軟體類似裝飾器
app.get('/api/protected', requireAuth, (req, res) => {
    res.json({ message: 'Hello' });
});
```

### 5. 類別視圖（Class-Based Views）

#### 陷阱：不熟悉類別繼承

❌ **Node.js 開發者困惑：**

```python
# 這麼多方法從哪裡來？
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    # list(), create(), retrieve() 方法在哪裡定義的？
```

✅ **理解繼承鏈：**

```python
# ModelViewSet 繼承了多個 Mixin，提供標準 CRUD 方法
# 相當於組合了多個功能模組

# 如果不習慣，可以使用函數式視圖（更像 Express）
@api_view(['GET', 'POST'])
def user_list(request):
    if request.method == 'GET':
        # ...
    elif request.method == 'POST':
        # ...
```

### 6. Django 命名慣例

#### 陷阱：欄位命名使用 snake_case

❌ **錯誤（JavaScript 風格）：**

```python
class User(models.Model):
    displayName = models.CharField(max_length=100)  # 不符合 Python 慣例
    createdAt = models.DateTimeField(auto_now_add=True)
```

✅ **正確（Python 風格）：**

```python
class User(models.Model):
    display_name = models.CharField(max_length=100)  # snake_case
    created_at = models.DateTimeField(auto_now_add=True)
```

**Serializer 可以自動轉換：**

```python
class UserSerializer(serializers.ModelSerializer):
    # 自動將 snake_case 轉為 camelCase（如需要）
    class Meta:
        model = User
        fields = '__all__'
    
    def to_representation(self, instance):
        # 可以自定義序列化格式
        data = super().to_representation(instance)
        return {
            'displayName': data['display_name'],  # 手動轉換
            'createdAt': data['created_at']
        }
```

### 7. 資料庫事務

#### 陷阱：忘記使用事務

❌ **錯誤（可能導致數據不一致）：**

```python
user = User.objects.create(username='john')
profile = Profile.objects.create(user=user)
# 如果第二行失敗，user 已經被建立了！
```

✅ **正確（使用事務）：**

```python
from django.db import transaction

@transaction.atomic
def create_user_with_profile(username):
    user = User.objects.create(username=username)
    profile = Profile.objects.create(user=user)
    # 如果任何操作失敗，全部回滾
    return user
```

**Node.js 對照（Sequelize）：**

```javascript
await sequelize.transaction(async (t) => {
  const user = await User.create({ username: 'john' }, { transaction: t });
  const profile = await Profile.create({ userId: user.id }, { transaction: t });
});
```

### 8. 環境變數讀取

#### 陷阱：直接使用 os.environ 可能出錯

❌ **不夠安全：**

```python
SECRET_KEY = os.environ['SECRET_KEY']  # KeyError if not set!
```

✅ **更好的方式：**

```python
from decouple import config

SECRET_KEY = config('SECRET_KEY')  # 會給出清晰的錯誤訊息
DEBUG = config('DEBUG', default=False, cast=bool)  # 提供預設值和類型轉換
```

### 9. 相對導入

#### 陷阱：不理解 Python 的導入系統

❌ **錯誤：**

```python
# apps/users/views.py
from serializers import UserSerializer  # ModuleNotFoundError!
```

✅ **正確：**

```python
# 絕對導入（推薦）
from apps.users.serializers import UserSerializer

# 相對導入
from .serializers import UserSerializer
```

### 10. 分頁結果處理

#### 陷阱：忘記分頁會改變響應格式

❌ **錯誤理解：**

```python
# Node.js 開發者可能期望直接返回陣列
users = User.objects.all()
serializer = UserSerializer(users, many=True)
return Response(serializer.data)  # 返回 [...]
```

✅ **理解分頁：**

```python
# 如果啟用了分頁，DRF 自動包裝響應
# 回應格式變為：
{
    "count": 100,
    "next": "http://api.example.com/users/?page=2",
    "previous": null,
    "results": [...]  # 實際數據在 results 中！
}
```

**前端需要相應調整：**

```javascript
// 錯誤
const users = await api.get('/users');
users.forEach(user => {...});  // TypeError!

// 正確
const response = await api.get('/users');
const users = response.data.results;  // 從 results 取資料
const totalCount = response.data.count;
```

---

## 下一步

閱讀完這份基礎檔案后，繼續查看：

1. [快速入門實作](../../specs/001-django-rest-framework/quickstart.md) - 30 分鐘快速上手
2. [Django REST Framework 專案規劃](./02-project-structure-and-planning.md)
3. [API 設計與實作指南](./03-api-implementation-guide.md)
4. [部署指南](./04-deployment-guide.md)

---

## 快速参考

### Python 速查

```python
# 匯入
from module import Class
import os

# 條件
if condition:
    pass
elif other_condition:
    pass
else:
    pass

# 迴圈
for item in items:
    print(item)

# 函式
def my_function(arg1, arg2="default"):
    return arg1 + arg2

# 類別
class MyClass:
    def __init__(self, value):
        self.value = value

    def method(self):
        return self.value

# 列表推導式 (類似 map)
squares = [x**2 for x in range(10)]

# 字典推導式
user_dict = {user.id: user.name for user in users}

# 例外處理
try:
    result = risky_operation()
except Exception as e:
    print(f"Error: {e}")
finally:
    cleanup()
```

### Django ORM 速查

### 基本查詢對比

**Sequelize/TypeORM vs Django ORM:**

```javascript
// Node.js (Sequelize)
const users = await User.findAll();
const user = await User.findByPk(1);
const activeUsers = await User.findAll({
  where: { isActive: true, age: { [Op.gte]: 18 } }
});
```

```python
# Django ORM (更直觀的語法)
users = User.objects.all()
user = User.objects.get(pk=1)
active_users = User.objects.filter(is_active=True, age__gte=18)
```

### 常用查詢操作

```python
# 查詢所有記錄
User.objects.all()                    # 類似 User.findAll()

# 條件過濾
User.objects.filter(age__gte=18)      # WHERE age >= 18
User.objects.filter(name__icontains='john')  # LIKE '%john%' (不區分大小寫)
User.objects.exclude(is_active=False) # 反向過濾

# 查詢單一筆記錄
User.objects.get(id=1)                # 類似 User.findByPk(1)
User.objects.get(email='user@example.com')  # 按任意欄位查詢
User.objects.first()                  # 第一筆記錄
User.objects.last()                   # 最後一筆記錄

# 排序
User.objects.order_by('created_at')   # 升序
User.objects.order_by('-created_at')  # 降序（注意負號）
User.objects.order_by('name', '-age') # 多欄位排序

# 限制結果數量
User.objects.all()[:10]               # 前 10 筆（分頁）
User.objects.all()[10:20]             # 第 11-20 筆

# 統計
User.objects.count()                  # 總數
User.objects.filter(is_active=True).count()  # 條件計數
```

### 建立和更新

```python
# 建立記錄（方法 1）
user = User.objects.create(
    name="John",
    email="john@example.com",
    age=25
)

# 建立記錄（方法 2）
user = User(name="John", email="john@example.com")
user.save()

# 更新單一記錄
user = User.objects.get(id=1)
user.name = "Jane"
user.age = 26
user.save()

# 批量更新
User.objects.filter(age__lt=18).update(is_minor=True)

# Get or Create (避免重複)
user, created = User.objects.get_or_create(
    email='user@example.com',
    defaults={'name': 'John', 'age': 25}
)
```

### 刪除操作

```python
# 刪除單一記錄
user = User.objects.get(id=1)
user.delete()

# 批量刪除
User.objects.filter(is_active=False).delete()

# 清空表格（小心使用！）
User.objects.all().delete()
```

### 關聯查詢（JOIN）

```python
# select_related - 用於 ForeignKey 和 OneToOne（執行 SQL JOIN）
# 類似 Sequelize 的 include
posts = Post.objects.select_related('author').all()
# SELECT * FROM posts INNER JOIN users ON posts.author_id = users.id

# prefetch_related - 用於 ManyToMany 和反向 ForeignKey（分開查詢）
posts = Post.objects.prefetch_related('tags', 'comments').all()
# 執行多次查詢並在 Python 中組合結果

# 實際使用範例
post = Post.objects.select_related('author').prefetch_related('tags').get(id=1)
print(post.author.name)  # 不會額外查詢
print([tag.name for tag in post.tags.all()])  # 不會額外查詢
```

**Node.js 對照：**

```javascript
// Sequelize
const posts = await Post.findAll({
  include: [
    { model: User, as: 'author' },
    { model: Tag, as: 'tags' },
    { model: Comment, as: 'comments' }
  ]
});
```

### 聚合和分組

```python
from django.db.models import Count, Avg, Sum, Max, Min

# 計數
User.objects.count()  # 總使用者數

# 聚合函數
Post.objects.aggregate(
    avg_likes=Avg('likes'),
    max_views=Max('views'),
    total_posts=Count('id')
)
# 返回: {'avg_likes': 42.5, 'max_views': 1000, 'total_posts': 50}

# 分組查詢（GROUP BY）
Post.objects.values('author').annotate(
    post_count=Count('id'),
    avg_likes=Avg('likes')
)
# 每個作者的文章數和平均按讚數
```

### 複雜查詢（Q objects）

```python
from django.db.models import Q

# OR 查詢
User.objects.filter(Q(name='John') | Q(email='john@example.com'))

# AND + OR 組合
User.objects.filter(
    Q(age__gte=18) & (Q(name='John') | Q(name='Jane'))
)

# NOT 查詢
User.objects.filter(~Q(is_active=False))
```

**Node.js 對照：**

```javascript
// Sequelize
const users = await User.findAll({
  where: {
    [Op.or]: [
      { name: 'John' },
      { email: 'john@example.com' }
    ]
  }
});
```

### 查詢欄位過濾器

Django ORM 提供強大的欄位查詢語法：

```python
# 精確匹配
User.objects.filter(name='John')           # name = 'John'
User.objects.filter(name__exact='John')    # 同上（明確語法）

# 不區分大小寫
User.objects.filter(name__iexact='john')   # ILIKE 'john'

# 包含
User.objects.filter(name__contains='oh')   # LIKE '%oh%'
User.objects.filter(name__icontains='oh')  # ILIKE '%oh%'

# 開始/結束
User.objects.filter(name__startswith='Jo') # LIKE 'Jo%'
User.objects.filter(name__endswith='hn')   # LIKE '%hn'

# 範圍
User.objects.filter(age__in=[18, 25, 30])  # age IN (18, 25, 30)
User.objects.filter(age__range=(18, 30))   # age BETWEEN 18 AND 30

# 比較
User.objects.filter(age__gt=18)            # age > 18
User.objects.filter(age__gte=18)           # age >= 18
User.objects.filter(age__lt=65)            # age < 65
User.objects.filter(age__lte=65)           # age <= 65

# 空值
User.objects.filter(bio__isnull=True)      # bio IS NULL
User.objects.filter(bio__isnull=False)     # bio IS NOT NULL

# 日期
User.objects.filter(created_at__year=2024) # YEAR(created_at) = 2024
User.objects.filter(created_at__month=10)  # MONTH(created_at) = 10
User.objects.filter(created_at__day=13)    # DAY(created_at) = 13
```

---

## 學習資源

### 官方文件

- [Django 官方文件](https://docs.djangoproject.com/)
- [Django REST Framework 檔案](https://www.django-rest-framework.org/)
- [Python 官方教學](https://docs.python.org/3/tutorial/)

### 推薦教學

- Django Girls Tutorial (適合初學者)
- Real Python - Django Tutorials
- TestDriven.io - Django REST Framework

### 社群

- Django Forum
- r/django (Reddit)
- Stack Overflow

---

**下一步：** 繼續閱讀 [Django REST Framework 專案規劃](./02-project-structure-and-planning.md)
