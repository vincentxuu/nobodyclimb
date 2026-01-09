# Instagram 貼文嵌入實作指南

## ✅ 驗證結果

經過測試，**Instagram 貼文可以成功顯示在網頁上**！

測試 URL: `https://www.instagram.com/p/DQ0D25cE4Wa/`

## 可用的嵌入方法

### 方法 1: iframe 嵌入 ⭐ (推薦 - 已驗證可用)

這是最簡單、最穩定的方法。

```html
<iframe
  src="https://www.instagram.com/p/DQ0D25cE4Wa/embed/"
  width="540"
  height="700"
  frameborder="0"
  scrolling="no"
  allowtransparency="true"
  allow="encrypted-media"
  style="border: 1px solid #dbdbdb; border-radius: 3px;">
</iframe>
```

**優點：**
- ✅ 無需額外 SDK
- ✅ 立即可用
- ✅ 包含完整功能（圖片、影片、輪播）
- ✅ 自動響應式
- ✅ Instagram 官方支援

**缺點：**
- 固定尺寸（可調整）

---

## 在 Next.js 專案中使用

### 步驟 1: 使用現成的 InstagramEmbed 元件

元件位置：`src/components/instagram/instagram-embed.tsx`

**基本使用：**

```tsx
import InstagramEmbed from '@/components/instagram/instagram-embed'

export default function MyPage() {
  return (
    <div>
      <h1>攀岩紀錄</h1>
      <InstagramEmbed url="https://www.instagram.com/p/DQ0D25cE4Wa/" />
    </div>
  )
}
```

**自訂參數：**

```tsx
<InstagramEmbed
  url="https://www.instagram.com/p/DQ0D25cE4Wa/"
  width={540}
  height={600}
  captioned={true}
  className="my-custom-class"
/>
```

### 步驟 2: 在岩場詳情頁整合

```tsx
// src/app/crag/[id]/page.tsx

import InstagramEmbed from '@/components/instagram/instagram-embed'

interface CragDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function CragDetailPage({ params }: CragDetailPageProps) {
  const { id } = await params

  // TODO: 從 API 取得岩場相關的 Instagram 貼文
  // const instagramPosts = await instagramService.getCragPosts(parseInt(id))

  // 暫時使用範例資料
  const examplePosts = [
    {
      id: 1,
      url: 'https://www.instagram.com/p/DQ0D25cE4Wa/',
      caption: '龍洞攀岩紀錄'
    }
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 岩場基本資訊 */}
      <section className="mb-12">
        <h1 className="text-3xl font-bold">龍洞</h1>
        {/* ... 其他岩場資訊 ... */}
      </section>

      {/* Instagram 攀登紀錄區塊 */}
      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-bold">
          📸 Instagram 攀登紀錄
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {examplePosts.map((post) => (
            <div key={post.id} className="flex flex-col">
              <InstagramEmbed url={post.url} height={600} />
              {post.caption && (
                <p className="mt-2 text-sm text-gray-600">{post.caption}</p>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
```

---

## 元件功能特點

`InstagramEmbed` 元件包含以下功能：

### 1. **載入狀態**
- 顯示載入動畫
- 5 秒超時機制

### 2. **錯誤處理**
- 無效 URL 檢測
- 載入失敗時顯示友善訊息
- 提供 Instagram 原始連結作為後備

### 3. **URL 解析**
- 自動從 URL 提取 shortcode
- 支援各種 Instagram URL 格式

### 4. **響應式設計**
- 可自訂寬度、高度
- 自動適應容器

---

## 元件 Props 說明

```typescript
interface InstagramEmbedProps {
  /** Instagram 貼文 URL */
  url: string

  /** 寬度（預設 540px） */
  width?: number

  /** 高度（預設 700px） */
  height?: number

  /** 是否顯示 caption（預設 true） */
  captioned?: boolean

  /** 自訂 className */
  className?: string
}
```

---

## 示範頁面

訪問示範頁面查看實際效果：

```bash
npm run dev
```

然後開啟瀏覽器訪問：`http://localhost:3000/instagram-demo`

示範頁面包含：
- ✅ 單一貼文展示
- ✅ 多貼文網格展示
- ✅ 使用說明
- ✅ 功能特點說明
- ✅ 實作計畫

---

## 常見問題 (FAQ)

### Q1: 為什麼從本地檔案 (file://) 開啟無法顯示？

**A:** Instagram 嵌入需要從 HTTP/HTTPS 伺服器載入，使用 `npm run dev` 啟動開發伺服器即可。

### Q2: 如何取得 Instagram 貼文的 URL？

**A:**
1. 在 Instagram 上開啟貼文
2. 點擊右上角的「...」選單
3. 選擇「複製連結」
4. URL 格式：`https://www.instagram.com/p/[SHORTCODE]/`

### Q3: 支援哪些類型的 Instagram 內容？

**A:** 支援所有公開的 Instagram 內容：
- ✅ 單張圖片
- ✅ 影片
- ✅ 輪播（多張圖片）
- ✅ Reels 短影片

### Q4: 如果貼文被刪除或設為私人會怎樣？

**A:** 元件會顯示錯誤訊息，並提供原始 Instagram 連結供使用者查看。

### Q5: 可以自訂嵌入的樣式嗎？

**A:** 可以透過 `className` prop 加入自訂樣式，或調整 `width` 和 `height`。

### Q6: 如何批次嵌入多個貼文？

**A:** 使用陣列 map：

```tsx
{instagramUrls.map((url, index) => (
  <InstagramEmbed key={index} url={url} />
))}
```

---

## 效能優化建議

### 1. 延遲載入 (Lazy Loading)

對於頁面上有多個 Instagram 貼文的情況，建議使用延遲載入：

```tsx
'use client'

import dynamic from 'next/dynamic'

const InstagramEmbed = dynamic(
  () => import('@/components/instagram/instagram-embed'),
  {
    loading: () => <div>載入中...</div>,
    ssr: false // 僅在客戶端渲染
  }
)
```

### 2. 虛擬滾動 (Virtual Scrolling)

如果有大量貼文，考慮使用虛擬滾動：

```tsx
import { useVirtualizer } from '@tanstack/react-virtual'

// 實作虛擬滾動邏輯
```

### 3. 快取策略

使用 Next.js 的 `revalidate` 選項快取資料：

```tsx
export const revalidate = 3600 // 1 小時重新驗證
```

---

## 下一步：整合後端 API

參考 `docs/ig-show-video/plan.md` 實作完整的後端整合：

### Phase 1: Backend (1-2 週)

1. **建立 InstagramPost Django Model**
   ```python
   # backend/apps/instagram/models.py
   class InstagramPost(models.Model):
       instagram_id = models.CharField(max_length=100, unique=True)
       url = models.URLField()
       media_type = models.CharField(max_length=20)
       caption = models.TextField()
       username = models.CharField(max_length=100)
       # ... 其他欄位
   ```

2. **實作 REST API**
   ```python
   # backend/apps/instagram/views.py
   class InstagramPostViewSet(viewsets.ModelViewSet):
       queryset = InstagramPost.objects.all()
       serializer_class = InstagramPostSerializer
   ```

3. **整合 Instagram API**
   - 使用 Instagram Basic Display API
   - 實作自動同步機制
   - 定時更新統計資料

### Phase 2: Frontend API 整合 (1 週)

1. **建立 API Service**
   ```typescript
   // src/lib/api/instagram.ts
   export const instagramService = {
     async getCragPosts(cragId: number) {
       const { data } = await apiClient.get(
         `/crags/${cragId}/instagram-posts/`
       )
       return data
     }
   }
   ```

2. **使用 React Query**
   ```tsx
   const { data, isLoading } = useQuery({
     queryKey: ['instagram-posts', cragId],
     queryFn: () => instagramService.getCragPosts(cragId)
   })
   ```

---

## 測試清單

在正式部署前，請確認：

- [ ] Instagram 貼文可以正常顯示
- [ ] 載入狀態正常運作
- [ ] 錯誤處理正常運作
- [ ] 響應式設計在各種螢幕尺寸正常
- [ ] 支援圖片、影片、輪播
- [ ] 從 HTTPS 伺服器載入（正式環境）
- [ ] 效能測試（多個貼文載入時間）
- [ ] 跨瀏覽器測試（Chrome, Safari, Firefox）

---

## 資源連結

- [Instagram Embed Documentation](https://developers.facebook.com/docs/instagram/embedding)
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [專案規劃文件](./plan.md)
- [示範頁面](http://localhost:3000/instagram-demo)

---

## 總結

✅ **Instagram 貼文可以成功嵌入網頁**

使用 iframe 方法是最簡單、最穩定的選擇：
- 無需複雜設定
- 完整功能支援
- Instagram 官方支援
- 已建立可直接使用的 React 元件

現在你可以：
1. 直接使用 `InstagramEmbed` 元件
2. 查看 `/instagram-demo` 示範頁面
3. 參考 `plan.md` 實作完整的後端整合

---

**文件版本：** 1.0
**建立日期：** 2025-12-03
**最後更新：** 2025-12-03
