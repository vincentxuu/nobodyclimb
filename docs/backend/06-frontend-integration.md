> ⚠️ 過時：本專案 backend 為 Hono + Cloudflare D1，請以 backend/src 與 project-rules 為準

# Next.js + Django REST Framework 前端集成指南

> 完整的前後端整合方案

## 目錄

- [架構概覽](#架構概覽)
- [TypeScript 類型生成](#typescript-類型生成)
- [API 客戶端設置](#api-客戶端設置)
- [JWT 認證流程](#jwt-認證流程)
- [TanStack Query 整合](#tanstack-query-整合)
- [錯誤處理模式](#錯誤處理模式)
- [開發工作流程](#開發工作流程)

---

## 架構概覽

### 技術棧

**Frontend (Next.js 14)**

- React 18 + TypeScript
- App Router
- Zustand (狀態管理)
- TanStack Query (數據獲取)
- Axios (HTTP 客戶端)
- Zod (驗證)

**Backend (Django)**

- Django 5.0
- Django REST Framework 3.14
- PostgreSQL 15
- djangorestframework-simplejwt

### 通信流程

```
┌─────────────────┐         ┌──────────────────┐         ┌────────────────┐
│   Next.js App   │  HTTP   │  Django REST API │  SQL    │   PostgreSQL   │
│  (Port 3000)    │◄───────►│   (Port 8000)    │◄───────►│   (Port 5432)  │
└─────────────────┘         └──────────────────┘         └────────────────┘
       │                              │
       │ 1. 發送請求                   │
       │    GET /api/v1/posts/       │
       │    Authorization: Bearer... │
       │                              │
       │◄─────────────────────────────│
       │ 2. 返回 JSON                 │
       │    { results: [...] }       │
```

---

## TypeScript 類型生成

### 方法 1：手動維護類型

根據 Django Serializer 創建 TypeScript 介面。

**Backend (Django):**

```python
# apps/posts/serializers.py
class PostSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    
    class Meta:
        model = Post
        fields = [
            'id', 'title', 'slug', 'content', 'summary',
            'cover_image', 'author', 'tags', 'likes', 'views',
            'created_at', 'updated_at'
        ]
```

**Frontend (TypeScript):**

```typescript
// src/types/post.ts
export interface User {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  avatar?: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary: string;
  coverImage: string;
  author: User;
  tags: Tag[];
  likes: number;
  views: number;
  createdAt: string;  // ISO 8601 format
  updatedAt: string;
}

// 分頁響應
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
```

### 方法 2：使用 drf-spectacular 自動生成

**Backend 配置:**

```python
# requirements.txt
drf-spectacular==0.27.2

# config/settings/base.py
INSTALLED_APPS = [
    # ...
    'drf_spectacular',
]

REST_FRAMEWORK = {
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

SPECTACULAR_SETTINGS = {
    'TITLE': 'NobodyClimb API',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}

# config/urls.py
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema')),
]
```

**生成 TypeScript 類型:**

```bash
# 下載 OpenAPI schema
curl http://localhost:8000/api/schema/ -o openapi.yaml

# 使用 openapi-typescript 生成類型
npx openapi-typescript openapi.yaml -o src/types/api.ts
```

**package.json:**

```json
{
  "scripts": {
    "generate:types": "curl http://localhost:8000/api/schema/ -o openapi.yaml && openapi-typescript openapi.yaml -o src/types/api.ts"
  },
  "devDependencies": {
    "openapi-typescript": "^6.7.5"
  }
}
```

---

## API 客戶端設置

### 創建 Axios 實例

```typescript
// src/lib/api.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/authStore';

// 創建 axios 實例
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 請求攔截器：自動添加 JWT token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// 響應攔截器：處理 token 刷新
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    
    // Token 過期，嘗試刷新
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        
        if (!refreshToken) {
          throw new Error('No refresh token');
        }
        
        // 刷新 token
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh/`,
          { refresh: refreshToken }
        );
        
        const { access } = response.data;
        
        // 更新 token
        useAuthStore.getState().setTokens(access, refreshToken);
        
        // 重試原請求
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        // 刷新失敗，登出
        useAuthStore.getState().logout();
        
        // 重定向到登入頁
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
```

### 欄位命名轉換

Django 使用 `snake_case`，前端使用 `camelCase`。

**選項 1：後端轉換（推薦）**

```python
# requirements.txt
djangorestframework-camel-case==1.4.2

# config/settings/base.py
REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': (
        'djangorestframework_camel_case.render.CamelCaseJSONRenderer',
    ),
    'DEFAULT_PARSER_CLASSES': (
        'djangorestframework_camel_case.parser.CamelCaseJSONParser',
    ),
}
```

**選項 2：前端轉換**

```typescript
// src/lib/api.ts
import camelcaseKeys from 'camelcase-keys';
import snakecaseKeys from 'snakecase-keys';

apiClient.interceptors.request.use((config) => {
  if (config.data) {
    config.data = snakecaseKeys(config.data, { deep: true });
  }
  return config;
});

apiClient.interceptors.response.use((response) => {
  if (response.data) {
    response.data = camelcaseKeys(response.data, { deep: true });
  }
  return response;
});
```

---

## JWT 認證流程

### Zustand Store

```typescript
// src/store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types/user';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  
  // Actions
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
      isAuthenticated: false,
      
      setTokens: (access, refresh) =>
        set({
          accessToken: access,
          refreshToken: refresh,
          isAuthenticated: true,
        }),
      
      setUser: (user) => set({ user }),
      
      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    }
  )
);
```

### 認證 API

```typescript
// src/services/auth.ts
import { apiClient } from '@/lib/api';
import type { User } from '@/types/user';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  passwordConfirm: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export const authService = {
  // 登入
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>(
      '/auth/login/',
      credentials
    );
    return data;
  },
  
  // 註冊
  async register(userData: RegisterData): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>(
      '/auth/register/',
      userData
    );
    return data;
  },
  
  // 獲取當前用戶
  async getCurrentUser(): Promise<User> {
    const { data } = await apiClient.get<User>('/auth/me/');
    return data;
  },
  
  // 刷新 token
  async refreshToken(refreshToken: string): Promise<{ access: string }> {
    const { data } = await apiClient.post('/auth/refresh/', {
      refresh: refreshToken,
    });
    return data;
  },
  
  // 登出
  async logout(): Promise<void> {
    await apiClient.post('/auth/logout/');
  },
};
```

### 登入組件

```typescript
// src/components/LoginForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth';

export function LoginForm() {
  const router = useRouter();
  const { setTokens, setUser } = useAuthStore();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const credentials = {
      username: formData.get('username') as string,
      password: formData.get('password') as string,
    };
    
    try {
      const response = await authService.login(credentials);
      
      // 保存 tokens 和用戶資料
      setTokens(response.access, response.refresh);
      setUser(response.user);
      
      // 重定向到首頁
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || '登入失敗，請檢查帳號密碼');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded">
          {error}
        </div>
      )}
      
      <div>
        <label htmlFor="username" className="block text-sm font-medium">
          用戶名
        </label>
        <input
          type="text"
          name="username"
          id="username"
          required
          className="mt-1 block w-full rounded-md border-gray-300"
        />
      </div>
      
      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          密碼
        </label>
        <input
          type="password"
          name="password"
          id="password"
          required
          className="mt-1 block w-full rounded-md border-gray-300"
        />
      </div>
      
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? '登入中...' : '登入'}
      </button>
    </form>
  );
}
```

### 受保護的路由

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-storage')?.value;
  
  // 檢查是否有 token
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  try {
    const authData = JSON.parse(token);
    
    // 檢查是否已認證
    if (!authData.state?.accessToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/posts/create'],
};
```

---

## TanStack Query 整合

### 配置 Query Client

```typescript
// src/providers/QueryProvider.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 分鐘
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### 文章 API Hooks

```typescript
// src/hooks/usePosts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { Post, PaginatedResponse } from '@/types/post';

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

// 獲取單篇文章
export function usePost(id: string) {
  return useQuery({
    queryKey: ['posts', id],
    queryFn: async () => {
      const { data } = await apiClient.get<Post>(`/posts/${id}/`);
      return data;
    },
    enabled: !!id,
  });
}

// 創建文章
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

// 更新文章
export function useUpdatePost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Post> & { id: string }) => {
      const { data } = await apiClient.put<Post>(`/posts/${id}/`, updates);
      return data;
    },
    onSuccess: (data) => {
      // 更新快取
      queryClient.setQueryData(['posts', data.id], data);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

// 刪除文章
export function useDeletePost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/posts/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

// 按讚文章
export function useLikePost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post(`/posts/${id}/like/`);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['posts', id] });
    },
  });
}
```

### 使用範例

```typescript
// src/app/posts/page.tsx
'use client';

import { usePosts } from '@/hooks/usePosts';
import { PostCard } from '@/components/PostCard';
import { Spinner } from '@/components/Spinner';

export default function PostsPage() {
  const { data, isLoading, error } = usePosts(1);
  
  if (isLoading) return <Spinner />;
  if (error) return <div>載入失敗：{error.message}</div>;
  
  return (
    <div>
      <h1>文章列表</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.results.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
```

---

## 錯誤處理模式

### 統一錯誤類型

```typescript
// src/types/error.ts
export interface APIError {
  detail?: string;
  code?: string;
  [field: string]: string[] | string | undefined;
}

export interface ValidationErrors {
  [field: string]: string[];
}
```

### 錯誤處理 Hook

```typescript
// src/hooks/useApiError.ts
import { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';
import type { APIError } from '@/types/error';

export function useApiError() {
  const handleError = (error: unknown) => {
    if (error instanceof AxiosError) {
      const apiError = error.response?.data as APIError;
      
      // 全局錯誤訊息
      if (apiError?.detail) {
        toast.error(apiError.detail);
        return { detail: apiError.detail };
      }
      
      // 欄位驗證錯誤
      const fieldErrors: Record<string, string> = {};
      Object.entries(apiError || {}).forEach(([field, messages]) => {
        if (Array.isArray(messages)) {
          fieldErrors[field] = messages.join(', ');
          toast.error(`${field}: ${messages.join(', ')}`);
        }
      });
      
      return { fields: fieldErrors };
    }
    
    // 未知錯誤
    toast.error('發生未知錯誤');
    return { detail: '發生未知錯誤' };
  };
  
  return { handleError };
}
```

### 表單錯誤顯示

```typescript
// src/components/PostForm.tsx
'use client';

import { useCreatePost } from '@/hooks/usePosts';
import { useApiError } from '@/hooks/useApiError';
import { useState } from 'react';

export function PostForm() {
  const createPost = useCreatePost();
  const { handleError } = useApiError();
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    
    const formData = new FormData(e.currentTarget);
    const postData = {
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      summary: formData.get('summary') as string,
      coverImage: formData.get('coverImage') as string,
    };
    
    try {
      await createPost.mutateAsync(postData);
      // 成功處理...
    } catch (error) {
      const errorResult = handleError(error);
      if (errorResult.fields) {
        setErrors(errorResult.fields);
      }
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title">標題</label>
        <input type="text" name="title" id="title" />
        {errors.title && (
          <p className="text-red-600 text-sm">{errors.title}</p>
        )}
      </div>
      
      <div>
        <label htmlFor="content">內容</label>
        <textarea name="content" id="content" />
        {errors.content && (
          <p className="text-red-600 text-sm">{errors.content}</p>
        )}
      </div>
      
      <button type="submit" disabled={createPost.isPending}>
        {createPost.isPending ? '提交中...' : '提交'}
      </button>
    </form>
  );
}
```

---

## 開發工作流程

### 並行開發

**1. 使用 API Mocks（開發初期）**

```typescript
// src/mocks/handlers.ts
import { rest } from 'msw';

export const handlers = [
  rest.get('/api/v1/posts/', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        count: 2,
        next: null,
        previous: null,
        results: [
          {
            id: '1',
            title: 'Mock Post 1',
            content: 'Content...',
            author: { id: '1', username: 'test' },
          },
        ],
      })
    );
  }),
];
```

**2. 環境變數配置**

```bash
# .env.local (開發環境)
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# .env.production
NEXT_PUBLIC_API_URL=https://api.nobodyclimb.cc/api/v1
```

**3. 開發腳本**

```json
// package.json
{
  "scripts": {
    "dev": "next dev",
    "dev:with-mock": "next dev --env .env.mock",
    "generate:types": "curl http://localhost:8000/api/schema/ -o openapi.yaml && openapi-typescript openapi.yaml -o src/types/api.ts"
  }
}
```

### 調試技巧

**1. React Query Devtools**

已在 QueryProvider 中配置，開發時可查看所有查詢狀態。

**2. Axios 請求日誌**

```typescript
// src/lib/api.ts
if (process.env.NODE_ENV === 'development') {
  apiClient.interceptors.request.use((config) => {
    console.log('📤 Request:', config.method?.toUpperCase(), config.url, config.data);
    return config;
  });
  
  apiClient.interceptors.response.use(
    (response) => {
      console.log('📥 Response:', response.status, response.config.url, response.data);
      return response;
    },
    (error) => {
      console.error('❌ Error:', error.response?.status, error.config?.url, error.response?.data);
      return Promise.reject(error);
    }
  );
}
```

---

## 下一步

繼續閱讀：

- [測試指南](./05-testing-guide.md)
- [部署指南](./04-deployment-guide.md)
- [API 實作指南](./03-api-implementation-guide.md)

---

**快速參考：**

```bash
# 安裝依賴
npm install axios @tanstack/react-query zustand

# 生成類型
npm run generate:types

# 開發
npm run dev
```
