# Instagram 貼文與影片整合專案規劃

## 專案概述

本專案旨在將 Instagram 的貼文與影片資訊整合至 nobodyclimb-fe 網站中，並與現有的攀岩路線（Route）、岩場（Crag）資訊進行關聯，讓使用者能夠看到與特定路線或岩場相關的 Instagram 內容。

## 需求分析

### 功能需求

1. **Instagram 內容展示**
   - 顯示 Instagram 圖片貼文
   - 顯示 Instagram 影片與 Reels
   - 支援輪播（Carousel）貼文
   - 顯示貼文說明文字（Caption）、按讚數、留言數

2. **內容關聯**
   - 將 Instagram 貼文關聯到特定攀岩路線
   - 將 Instagram 貼文關聯到特定岩場
   - 將 Instagram 貼文關聯到特定攀岩館
   - 支援多重標籤（Tags）分類

3. **內容發現**
   - 依 Hashtag 搜尋 Instagram 貼文
   - 在路線詳情頁面顯示相關 Instagram 內容
   - 在岩場詳情頁面顯示相關 Instagram 內容
   - 提供精選 Instagram 內容

4. **互動功能**
   - 使用者可為 Instagram 貼文留言（使用現有 Comment 系統）
   - 使用者可收藏 Instagram 貼文（使用現有 Bookmark 系統）
   - 點擊可開啟 Instagram 原始貼文連結

### 非功能需求

1. **效能**
   - 使用 CDN 快取 Instagram 媒體檔案
   - 實作延遲載入（Lazy Loading）
   - 優化圖片大小與格式

2. **使用者體驗**
   - 響應式設計（手機、平板、桌面）
   - 流暢的動畫效果
   - 直覺的 UI/UX

3. **資料一致性**
   - 定期同步 Instagram 資料（按讚數、留言數）
   - 處理 Instagram 內容刪除或失效情況

## 技術架構

### 系統架構圖

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js 15)                 │
├─────────────────────────────────────────────────────────────┤
│  Pages:                                                      │
│  - /crag/[id]           → 岩場詳情 + Instagram 貼文         │
│  - /instagram           → Instagram 內容瀏覽頁              │
│  - /instagram/[id]      → Instagram 貼文詳情               │
│                                                              │
│  Components:                                                 │
│  - InstagramFeed        → Instagram 內容網格               │
│  - InstagramPostCard    → 單一貼文卡片                     │
│  - InstagramPostModal   → 貼文詳情彈窗                     │
│  - InstagramCarousel    → 輪播貼文展示                     │
│  - InstagramVideoPlayer → 影片播放器                       │
└─────────────────────────────────────────────────────────────┘
                              ↓ API Calls
┌─────────────────────────────────────────────────────────────┐
│              Backend (Django REST Framework)                 │
├─────────────────────────────────────────────────────────────┤
│  Models:                                                     │
│  - InstagramPost        → Instagram 貼文資料               │
│  - Route                → 攀岩路線（已存在）               │
│  - Crag                 → 岩場（已存在）                   │
│  - Gym                  → 攀岩館（已存在）                 │
│                                                              │
│  API Endpoints:                                              │
│  - GET /api/instagram-posts/                                │
│  - GET /api/instagram-posts/{id}/                           │
│  - GET /api/crags/{id}/instagram-posts/                     │
│  - POST /api/instagram-posts/{id}/link-route/              │
│  - GET /api/instagram-posts/search?hashtag=                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  External Services                           │
├─────────────────────────────────────────────────────────────┤
│  - Instagram Basic Display API (讀取公開貼文)              │
│  - Instagram oEmbed API (嵌入貼文)                          │
│  - Cloudflare R2 (儲存媒體快取)                            │
└─────────────────────────────────────────────────────────────┘
```

### 資料模型設計

#### 1. InstagramPost Model（新增）

```python
# backend/apps/instagram/models.py

from django.db import models
from django.contrib.contenttypes.fields import GenericRelation

class InstagramPost(models.Model):
    """Instagram 貼文模型"""

    MEDIA_TYPE_CHOICES = [
        ('IMAGE', '圖片'),
        ('VIDEO', '影片'),
        ('CAROUSEL_ALBUM', '輪播'),
        ('REEL', 'Reel 短影片'),
    ]

    # Instagram 基本資訊
    id = models.AutoField(primary_key=True)
    instagram_id = models.CharField(max_length=100, unique=True, db_index=True)
    shortcode = models.CharField(max_length=50, unique=True, db_index=True)  # Instagram shortcode
    url = models.URLField(max_length=500)

    # 媒體資訊
    media_type = models.CharField(max_length=20, choices=MEDIA_TYPE_CHOICES)
    media_urls = models.JSONField(default=list)  # 媒體檔案 URLs（圖片或影片）
    thumbnail_url = models.URLField(max_length=500, blank=True)

    # 內容資訊
    caption = models.TextField(blank=True)
    username = models.CharField(max_length=100, db_index=True)
    user_profile_pic = models.URLField(max_length=500, blank=True)

    # 統計資訊
    posted_at = models.DateTimeField()
    likes_count = models.IntegerField(default=0)
    comments_count = models.IntegerField(default=0)
    views_count = models.IntegerField(default=0, null=True, blank=True)  # 影片專用

    # 關聯資訊
    related_crag = models.ForeignKey(
        'crag.Crag',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='instagram_posts'
    )
    related_gym = models.ForeignKey(
        'gym.Gym',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='instagram_posts'
    )
    # Note: 如果未來新增 Route model，加上：
    # related_route = models.ForeignKey(
    #     'route.Route',
    #     on_delete=models.SET_NULL,
    #     null=True,
    #     blank=True,
    #     related_name='instagram_posts'
    # )

    # 標籤與分類
    tags = models.JSONField(default=list)  # 自定義標籤
    hashtags = models.JSONField(default=list)  # Instagram hashtags
    location_name = models.CharField(max_length=200, blank=True)
    location_id = models.CharField(max_length=100, blank=True)

    # 系統欄位
    featured = models.BooleanField(default=False)  # 精選貼文
    is_active = models.BooleanField(default=True)  # 是否顯示（處理刪除的貼文）
    last_synced_at = models.DateTimeField(auto_now=True)  # 最後同步時間
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Generic Relations（使用現有系統）
    comments = GenericRelation('comment.Comment')
    bookmarks = GenericRelation('bookmark.Bookmark')

    class Meta:
        db_table = 'instagram_posts'
        ordering = ['-posted_at']
        indexes = [
            models.Index(fields=['-posted_at']),
            models.Index(fields=['username', '-posted_at']),
            models.Index(fields=['featured', '-posted_at']),
        ]

    def __str__(self):
        return f"@{self.username} - {self.shortcode}"

    @property
    def instagram_url(self):
        """返回 Instagram 原始貼文連結"""
        return f"https://www.instagram.com/p/{self.shortcode}/"

    def is_video(self):
        """判斷是否為影片類型"""
        return self.media_type in ['VIDEO', 'REEL']
```

#### 2. 更新現有 Model（如需要）

```python
# backend/apps/crag/models.py

class Crag(models.Model):
    # ... 現有欄位 ...

    # 新增關聯（透過 related_name 自動建立）
    # instagram_posts 會自動可用

    def get_instagram_posts(self, limit=10):
        """取得與此岩場相關的 Instagram 貼文"""
        return self.instagram_posts.filter(is_active=True)[:limit]
```

### API 設計

#### 1. RESTful Endpoints

```python
# backend/apps/instagram/urls.py

urlpatterns = [
    # Instagram 貼文管理
    path('instagram-posts/', InstagramPostListView.as_view(), name='instagram-post-list'),
    path('instagram-posts/<int:pk>/', InstagramPostDetailView.as_view(), name='instagram-post-detail'),
    path('instagram-posts/search/', InstagramPostSearchView.as_view(), name='instagram-post-search'),
    path('instagram-posts/featured/', FeaturedInstagramPostsView.as_view(), name='instagram-post-featured'),

    # 與其他資源的關聯
    path('crags/<int:crag_id>/instagram-posts/', CragInstagramPostsView.as_view(), name='crag-instagram-posts'),
    path('gyms/<int:gym_id>/instagram-posts/', GymInstagramPostsView.as_view(), name='gym-instagram-posts'),

    # Admin 功能（需要認證）
    path('instagram-posts/<int:pk>/link-crag/', LinkInstagramToCragView.as_view(), name='link-instagram-crag'),
    path('instagram-posts/<int:pk>/sync/', SyncInstagramPostView.as_view(), name='sync-instagram-post'),

    # Webhook（接收 Instagram 更新）
    path('instagram/webhook/', InstagramWebhookView.as_view(), name='instagram-webhook'),
]
```

#### 2. API Request/Response Examples

**GET /api/instagram-posts/**
```json
// Request Query Params
{
  "page": 1,
  "limit": 20,
  "media_type": "VIDEO",  // optional
  "hashtag": "龍洞",      // optional
  "username": "example",  // optional
  "crag_id": 1,           // optional
  "featured": true        // optional
}

// Response
{
  "success": true,
  "data": [
    {
      "id": 1,
      "instagramId": "abc123",
      "shortcode": "Cxy123abc",
      "url": "https://www.instagram.com/p/Cxy123abc/",
      "mediaType": "VIDEO",
      "mediaUrls": [
        "https://cdn.instagram.com/video.mp4"
      ],
      "thumbnailUrl": "https://cdn.instagram.com/thumb.jpg",
      "caption": "龍洞攀岩 #climbing #龍洞",
      "username": "climber_tw",
      "userProfilePic": "https://cdn.instagram.com/profile.jpg",
      "postedAt": "2025-12-01T10:30:00Z",
      "likesCount": 150,
      "commentsCount": 12,
      "viewsCount": 500,
      "relatedCrag": {
        "id": 1,
        "name": "龍洞",
        "slug": "longdong"
      },
      "tags": ["outdoor", "sport-climbing"],
      "hashtags": ["climbing", "龍洞", "攀岩"],
      "locationName": "龍洞攀岩場",
      "featured": true
    }
  ],
  "meta": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 92,
    "itemsPerPage": 20
  }
}
```

**GET /api/crags/{id}/instagram-posts/**
```json
// Response
{
  "success": true,
  "data": {
    "crag": {
      "id": 1,
      "name": "龍洞",
      "slug": "longdong"
    },
    "posts": [
      // ... Instagram posts array
    ]
  },
  "meta": {
    "totalPosts": 15
  }
}
```

**POST /api/instagram-posts/{id}/link-crag/**
```json
// Request Body
{
  "cragId": 1
}

// Response
{
  "success": true,
  "message": "Instagram post linked to crag successfully",
  "data": {
    // ... updated post data
  }
}
```

### Frontend 實作

#### 1. TypeScript Types

```typescript
// src/lib/types/instagram.d.ts

export type InstagramMediaType = 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | 'REEL'

export interface InstagramPost {
  id: number
  instagramId: string
  shortcode: string
  url: string
  mediaType: InstagramMediaType
  mediaUrls: string[]
  thumbnailUrl?: string
  caption: string
  username: string
  userProfilePic?: string
  postedAt: Date | string
  likesCount: number
  commentsCount: number
  viewsCount?: number
  relatedCrag?: {
    id: number
    name: string
    slug: string
  }
  relatedGym?: {
    id: number
    name: string
    slug: string
  }
  tags?: string[]
  hashtags?: string[]
  locationName?: string
  featured?: boolean
}

export interface InstagramFeedProps {
  posts: InstagramPost[]
  loading?: boolean
  onPostClick?: (post: InstagramPost) => void
  columns?: 2 | 3 | 4
}

export interface InstagramPostCardProps {
  post: InstagramPost
  onClick?: () => void
  showCaption?: boolean
  showStats?: boolean
}
```

#### 2. Components Structure

```
src/components/instagram/
├── instagram-feed.tsx           # 網格展示元件
├── instagram-post-card.tsx      # 單一貼文卡片
├── instagram-post-modal.tsx     # 貼文詳情彈窗
├── instagram-carousel.tsx       # 輪播貼文
├── instagram-video-player.tsx   # 影片播放器
├── instagram-filters.tsx        # 篩選器
└── instagram-stats.tsx          # 統計資訊顯示
```

#### 3. Component Implementation Examples

**InstagramFeed Component**

```typescript
// src/components/instagram/instagram-feed.tsx

'use client'

import { useState } from 'react'
import { InstagramPost } from '@/lib/types/instagram'
import InstagramPostCard from './instagram-post-card'
import InstagramPostModal from './instagram-post-modal'

interface InstagramFeedProps {
  posts: InstagramPost[]
  columns?: 2 | 3 | 4
  showFilters?: boolean
}

export default function InstagramFeed({
  posts,
  columns = 3,
  showFilters = false
}: InstagramFeedProps) {
  const [selectedPost, setSelectedPost] = useState<InstagramPost | null>(null)
  const [filteredPosts, setFilteredPosts] = useState(posts)

  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
  }

  return (
    <>
      {/* 篩選器 */}
      {showFilters && (
        <div className="mb-6">
          {/* InstagramFilters component */}
        </div>
      )}

      {/* Instagram 貼文網格 */}
      <div className={`grid ${gridCols[columns]} gap-4`}>
        {filteredPosts.map((post) => (
          <InstagramPostCard
            key={post.id}
            post={post}
            onClick={() => setSelectedPost(post)}
          />
        ))}
      </div>

      {/* 貼文詳情彈窗 */}
      {selectedPost && (
        <InstagramPostModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </>
  )
}
```

**InstagramPostCard Component**

```typescript
// src/components/instagram/instagram-post-card.tsx

'use client'

import Image from 'next/image'
import { InstagramPost, InstagramMediaType } from '@/lib/types/instagram'
import { Play, Heart, MessageCircle, Images } from 'lucide-react'

interface InstagramPostCardProps {
  post: InstagramPost
  onClick?: () => void
  showCaption?: boolean
}

export default function InstagramPostCard({
  post,
  onClick,
  showCaption = false
}: InstagramPostCardProps) {
  const isVideo = post.mediaType === 'VIDEO' || post.mediaType === 'REEL'
  const isCarousel = post.mediaType === 'CAROUSEL_ALBUM'
  const thumbnailUrl = post.thumbnailUrl || post.mediaUrls[0]

  return (
    <div
      className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg bg-gray-100"
      onClick={onClick}
    >
      {/* 縮圖 */}
      <Image
        src={thumbnailUrl}
        alt={post.caption || 'Instagram post'}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-105"
      />

      {/* 媒體類型指示 */}
      <div className="absolute top-2 right-2 flex gap-2">
        {isVideo && (
          <div className="rounded-full bg-black/50 p-2 backdrop-blur">
            <Play className="h-4 w-4 text-white" fill="white" />
          </div>
        )}
        {isCarousel && (
          <div className="rounded-full bg-black/50 p-2 backdrop-blur">
            <Images className="h-4 w-4 text-white" />
          </div>
        )}
      </div>

      {/* Hover 效果 - 顯示統計 */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-300 group-hover:bg-black/50">
        <div className="flex gap-6 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6" fill="white" />
            <span className="font-semibold">{post.likesCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-6 w-6" fill="white" />
            <span className="font-semibold">{post.commentsCount}</span>
          </div>
        </div>
      </div>

      {/* Caption（可選） */}
      {showCaption && post.caption && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <p className="line-clamp-2 text-sm text-white">
            {post.caption}
          </p>
        </div>
      )}
    </div>
  )
}
```

#### 4. API Service Layer

```typescript
// src/lib/api/instagram.ts

import { apiClient } from './client'
import { InstagramPost } from '@/lib/types/instagram'
import { ApiResponse, PaginatedResponse } from './types'

export const instagramService = {
  /**
   * 取得 Instagram 貼文列表
   */
  async getPosts(params?: {
    page?: number
    limit?: number
    mediaType?: string
    hashtag?: string
    username?: string
    cragId?: number
    featured?: boolean
  }): Promise<PaginatedResponse<InstagramPost>> {
    const { data } = await apiClient.get('/instagram-posts/', { params })
    return data
  },

  /**
   * 取得單一 Instagram 貼文
   */
  async getPost(id: number): Promise<ApiResponse<InstagramPost>> {
    const { data } = await apiClient.get(`/instagram-posts/${id}/`)
    return data
  },

  /**
   * 取得岩場相關的 Instagram 貼文
   */
  async getCragPosts(cragId: number): Promise<ApiResponse<InstagramPost[]>> {
    const { data } = await apiClient.get(`/crags/${cragId}/instagram-posts/`)
    return data
  },

  /**
   * 搜尋 Instagram 貼文
   */
  async searchPosts(query: {
    hashtag?: string
    username?: string
    location?: string
  }): Promise<PaginatedResponse<InstagramPost>> {
    const { data } = await apiClient.get('/instagram-posts/search/', { params: query })
    return data
  },

  /**
   * 取得精選 Instagram 貼文
   */
  async getFeaturedPosts(limit = 10): Promise<ApiResponse<InstagramPost[]>> {
    const { data } = await apiClient.get('/instagram-posts/featured/', {
      params: { limit }
    })
    return data
  },

  /**
   * 將 Instagram 貼文關聯到岩場
   */
  async linkToCrag(postId: number, cragId: number): Promise<ApiResponse<InstagramPost>> {
    const { data } = await apiClient.post(`/instagram-posts/${postId}/link-crag/`, {
      cragId
    })
    return data
  }
}
```

#### 5. 整合到現有頁面

**更新 Crag Detail Page**

```typescript
// src/app/crag/[id]/page.tsx

import InstagramFeed from '@/components/instagram/instagram-feed'
import { instagramService } from '@/lib/api/instagram'

export default async function CragDetailPage({ params }: { params: { id: string } }) {
  // ... 現有的 crag data fetching ...

  // 取得相關的 Instagram 貼文
  const instagramPosts = await instagramService.getCragPosts(parseInt(params.id))

  return (
    <div>
      {/* ... 現有的岩場資訊 ... */}

      {/* 新增 Instagram 區塊 */}
      {instagramPosts.data && instagramPosts.data.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-6 text-2xl font-bold">Instagram 攀登紀錄</h2>
          <InstagramFeed
            posts={instagramPosts.data}
            columns={3}
          />
        </section>
      )}
    </div>
  )
}
```

### Instagram API 整合

#### 1. Instagram Basic Display API

用於獲取公開的 Instagram 貼文資料。

**設定流程：**

1. 建立 Facebook App
2. 設定 Instagram Basic Display
3. 獲取 Access Token
4. 實作資料同步

**Backend 實作：**

```python
# backend/apps/instagram/services.py

import requests
from django.conf import settings
from .models import InstagramPost

class InstagramSyncService:
    """Instagram 資料同步服務"""

    BASE_URL = 'https://graph.instagram.com'

    def __init__(self, access_token=None):
        self.access_token = access_token or settings.INSTAGRAM_ACCESS_TOKEN

    def fetch_user_media(self, user_id, limit=25):
        """
        從 Instagram API 獲取使用者的媒體
        """
        url = f"{self.BASE_URL}/{user_id}/media"
        params = {
            'fields': 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username,like_count,comments_count',
            'access_token': self.access_token,
            'limit': limit
        }

        response = requests.get(url, params=params)
        response.raise_for_status()
        return response.json()

    def sync_post(self, instagram_data):
        """
        同步單一 Instagram 貼文到資料庫
        """
        # 從 permalink 提取 shortcode
        shortcode = instagram_data['permalink'].split('/p/')[-1].strip('/')

        post, created = InstagramPost.objects.update_or_create(
            instagram_id=instagram_data['id'],
            defaults={
                'shortcode': shortcode,
                'url': instagram_data['permalink'],
                'media_type': instagram_data['media_type'],
                'media_urls': [instagram_data.get('media_url', '')],
                'thumbnail_url': instagram_data.get('thumbnail_url', ''),
                'caption': instagram_data.get('caption', ''),
                'username': instagram_data['username'],
                'posted_at': instagram_data['timestamp'],
                'likes_count': instagram_data.get('like_count', 0),
                'comments_count': instagram_data.get('comments_count', 0),
                'hashtags': self._extract_hashtags(instagram_data.get('caption', '')),
            }
        )

        return post, created

    def _extract_hashtags(self, caption):
        """從 caption 提取 hashtags"""
        import re
        hashtags = re.findall(r'#(\w+)', caption)
        return hashtags

    def auto_link_to_crag(self, post):
        """
        根據 hashtags 和 location 自動關聯到岩場
        """
        from apps.crag.models import Crag

        # 岩場關鍵字對應
        crag_keywords = {
            '龍洞': ['龍洞', 'longdong', 'lungdong'],
            '龍洞南口': ['南口', 'southgate'],
            # ... 其他岩場
        }

        caption_lower = post.caption.lower()
        hashtags_lower = [tag.lower() for tag in post.hashtags]

        for crag_name, keywords in crag_keywords.items():
            if any(keyword in caption_lower or keyword in hashtags_lower for keyword in keywords):
                try:
                    crag = Crag.objects.get(name__icontains=crag_name)
                    post.related_crag = crag
                    post.save()
                    return crag
                except Crag.DoesNotExist:
                    continue

        return None
```

#### 2. Celery 定時任務

```python
# backend/apps/instagram/tasks.py

from celery import shared_task
from .services import InstagramSyncService
from .models import InstagramPost

@shared_task
def sync_instagram_posts():
    """
    定時同步 Instagram 貼文
    """
    service = InstagramSyncService()

    # 獲取要追蹤的帳號列表
    tracked_users = ['user_id_1', 'user_id_2']  # 從設定檔讀取

    for user_id in tracked_users:
        try:
            media_data = service.fetch_user_media(user_id)

            for media in media_data.get('data', []):
                post, created = service.sync_post(media)

                # 自動關聯到岩場
                if created:
                    service.auto_link_to_crag(post)

        except Exception as e:
            # Log error
            print(f"Error syncing user {user_id}: {e}")
            continue

@shared_task
def update_post_stats(post_id):
    """
    更新單一貼文的統計資訊（按讚數、留言數）
    """
    try:
        post = InstagramPost.objects.get(id=post_id)
        service = InstagramSyncService()

        # 重新獲取貼文資料
        # ... 更新統計

    except InstagramPost.DoesNotExist:
        pass
```

## 實作階段規劃

### Phase 1: Backend 基礎建設（第 1-2 週）

#### 任務清單

1. **資料庫模型**
   - [ ] 建立 InstagramPost model
   - [ ] 建立資料庫 migration
   - [ ] 設定索引與關聯
   - [ ] 撰寫 model tests

2. **API 開發**
   - [ ] 實作 InstagramPost ViewSet
   - [ ] 實作列表、詳情、搜尋 endpoints
   - [ ] 實作岩場/路線關聯 endpoints
   - [ ] 撰寫 API tests
   - [ ] 撰寫 API 文件（OpenAPI）

3. **Instagram API 整合**
   - [ ] 設定 Instagram Basic Display API
   - [ ] 實作資料同步服務
   - [ ] 實作 hashtag 提取
   - [ ] 實作自動關聯邏輯

4. **管理後台**
   - [ ] 設定 Django Admin for InstagramPost
   - [ ] 實作手動關聯功能
   - [ ] 實作批次同步功能

### Phase 2: Frontend 元件開發（第 3-4 週）

#### 任務清單

1. **Type Definitions**
   - [ ] 定義 InstagramPost interfaces
   - [ ] 更新 API types
   - [ ] 建立 Props interfaces

2. **核心元件**
   - [ ] InstagramFeed 網格展示
   - [ ] InstagramPostCard 卡片元件
   - [ ] InstagramPostModal 詳情彈窗
   - [ ] InstagramCarousel 輪播元件
   - [ ] InstagramVideoPlayer 影片播放器
   - [ ] InstagramFilters 篩選器

3. **API 整合**
   - [ ] 實作 instagramService
   - [ ] 設定 React Query hooks
   - [ ] 處理載入狀態
   - [ ] 處理錯誤狀態

4. **UI/UX**
   - [ ] 響應式設計
   - [ ] 動畫效果
   - [ ] Lazy loading
   - [ ] Skeleton loading

### Phase 3: 頁面整合（第 5 週）

#### 任務清單

1. **岩場頁面**
   - [ ] 在岩場詳情頁加入 Instagram 區塊
   - [ ] 實作相關貼文載入
   - [ ] 實作篩選與排序

2. **獨立 Instagram 頁面**
   - [ ] 建立 /instagram 瀏覽頁
   - [ ] 建立 /instagram/[id] 詳情頁
   - [ ] 實作無限滾動載入
   - [ ] 實作搜尋功能

3. **路線頁面**
   - [ ] 在路線詳情頁加入相關貼文
   - [ ] 實作貼文推薦

### Phase 4: 進階功能與優化（第 6-7 週）

#### 任務清單

1. **效能優化**
   - [ ] 圖片 CDN 快取
   - [ ] 實作 Image optimization
   - [ ] 設定 API caching
   - [ ] 實作 Prefetching

2. **進階功能**
   - [ ] 精選貼文管理
   - [ ] 批次標籤編輯
   - [ ] 貼文統計儀表板
   - [ ] 自動化同步排程

3. **使用者互動**
   - [ ] 整合 Comment 系統
   - [ ] 整合 Bookmark 系統
   - [ ] 分享功能
   - [ ] 嵌入代碼產生

4. **測試**
   - [ ] Unit tests
   - [ ] Integration tests
   - [ ] E2E tests
   - [ ] 效能測試

### Phase 5: 部署與監控（第 8 週）

#### 任務清單

1. **部署準備**
   - [ ] 環境變數設定
   - [ ] 資料庫 migration
   - [ ] Celery 設定
   - [ ] CDN 設定

2. **監控與維護**
   - [ ] 錯誤追蹤（Sentry）
   - [ ] API 監控
   - [ ] 效能監控
   - [ ] 同步任務監控

3. **文件**
   - [ ] API 文件
   - [ ] 使用者文件
   - [ ] 開發文件
   - [ ] 部署文件

## 技術挑戰與解決方案

### 挑戰 1: Instagram API 限制

**問題：**
- Instagram Basic Display API 有 rate limits
- Access token 需要定期更新
- 無法獲取所有公開貼文

**解決方案：**
1. 實作 rate limiting 控制
2. 設定 token refresh 機制
3. 使用 Instagram oEmbed API 作為備援
4. 快取資料減少 API 呼叫

### 挑戰 2: 媒體檔案儲存

**問題：**
- Instagram 媒體 URL 會過期
- 大量圖片/影片儲存成本

**解決方案：**
1. 使用 Cloudflare R2 快取媒體檔案
2. 實作自動更新過期 URL
3. 圖片壓縮與格式優化
4. CDN 加速

### 挑戰 3: 自動關聯準確度

**問題：**
- Hashtag 可能不準確
- 同一地點有多個名稱

**解決方案：**
1. 建立關鍵字對應表
2. 結合 location data
3. 提供管理後台手動調整
4. 使用 NLP 分析 caption

### 挑戰 4: 效能優化

**問題：**
- 大量圖片載入影響效能
- 無限滾動需要優化

**解決方案：**
1. Lazy loading + Intersection Observer
2. 圖片 placeholder (blur)
3. Virtual scrolling
4. API pagination + caching

## 資料流程圖

```
┌─────────────────────────────────────────────────────────────┐
│                   Instagram Data Flow                        │
└─────────────────────────────────────────────────────────────┘

1. 資料收集（Data Collection）
   ┌─────────────┐
   │ Instagram   │
   │ Basic API   │
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐     ┌──────────────┐
   │ Celery Task │────▶│ Sync Service │
   │ (每小時)     │     └──────┬───────┘
   └─────────────┘            │
                              ▼
                      ┌───────────────┐
                      │ Django Model  │
                      │ InstagramPost │
                      └───────┬───────┘
                              │
2. 自動關聯（Auto Linking）      ▼
                      ┌───────────────┐
                      │ Auto Link     │
                      │ Service       │
                      └───────┬───────┘
                              │
                              ▼
                      ┌───────────────┐
                      │ Update        │
                      │ related_crag  │
                      └───────┬───────┘
                              │
3. API 提供（API Serving）        ▼
                      ┌───────────────┐
                      │ REST API      │
                      │ Endpoints     │
                      └───────┬───────┘
                              │
                              ▼
4. Frontend 展示                 │
   ┌─────────────┐              │
   │ Next.js     │◀─────────────┘
   │ Pages       │
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │ Instagram   │
   │ Components  │
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │ User View   │
   └─────────────┘
```

## 安全性考量

### 1. API Key 管理
- Instagram Access Token 儲存在環境變數
- 不在前端暴露敏感資訊
- 定期輪換 token

### 2. 資料驗證
- 驗證 Instagram webhook 簽章
- 清理使用者輸入（XSS 防護）
- SQL injection 防護

### 3. 權限控制
- 管理後台需要認證
- 手動關聯功能需要 admin 權限
- API rate limiting

### 4. 隱私保護
- 遵守 Instagram 使用條款
- 不儲存私密貼文
- 尊重使用者刪除請求

## 監控與維護

### 1. 監控指標

- Instagram API 呼叫次數
- 同步任務成功率
- 媒體檔案可用性
- API 回應時間
- 錯誤率

### 2. 定期維護

- 清理無效貼文
- 更新統計資訊
- 檢查過期 URL
- 優化資料庫索引

### 3. 日誌記錄

```python
# 關鍵事件日誌
- Instagram API 同步開始/結束
- 新貼文建立
- 自動關聯成功/失敗
- API 錯誤
```

## 成本估算

### 1. Instagram API
- 免費（Basic Display API）
- Rate limit: 200 requests/hour

### 2. 儲存成本
- Cloudflare R2: ~$0.015/GB/月
- 估計 1000 張圖片 ≈ 500MB ≈ $0.0075/月

### 3. 運算成本
- Celery worker: 包含在現有基礎設施
- API requests: 包含在現有基礎設施

### 4. CDN 成本
- Cloudflare: 免費方案

**總計：幾乎零額外成本**

## 未來擴展

### 1. 多平台支援
- YouTube Shorts
- TikTok
- Facebook

### 2. AI 功能
- 自動標籤路線等級
- 圖片中的路線識別
- 自動生成描述

### 3. 社群功能
- 使用者上傳 Instagram 連結
- 社群投票精選貼文
- 攀登紀錄分享

### 4. 進階搜尋
- 依地點搜尋
- 依等級搜尋
- 依時間範圍搜尋
- 相似貼文推薦

## 結論

本專案將為 nobodyclimb-fe 增加豐富的視覺內容，透過整合 Instagram 貼文與影片，讓使用者能夠看到真實的攀登紀錄與經驗分享。整合後將大幅提升使用者參與度與內容豐富度。

### 關鍵成功因素

1. **良好的 API 設計**：易於擴展與維護
2. **自動化流程**：減少手動作業
3. **效能優化**：確保良好的使用者體驗
4. **彈性架構**：支援未來功能擴展

### 預期效益

- 增加 30% 使用者停留時間
- 提供真實攀登紀錄參考
- 增強社群互動
- 提升 SEO 排名（豐富內容）

---

**文件版本：** 1.0
**建立日期：** 2025-12-03
**最後更新：** 2025-12-03
**作者：** Claude Code
