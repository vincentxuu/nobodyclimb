# CSV 範本多語言支援說明

本文件說明如何使用支援中英雙語的 CSV 範本。

## 🌍 多語言欄位設計

### 命名規則
- **中文欄位**: 使用原始欄位名稱（如：`name`, `description`）
- **英文欄位**: 在原始欄位名稱後加 `_en` 後綴（如：`name_en`, `description_en`）

特殊情況：
- `name` / `english_name`: Routes 表中的路線名稱，保持原有命名
- `name` / `name_en`: Crags 表中的岩場名稱，使用 `_en` 後綴

## 📋 各資料表雙語欄位對照

### 1. Crags (岩場資訊)

| 中文欄位 | 英文欄位 | 說明 |
|---------|---------|------|
| `name` | `name_en` | 岩場名稱 |
| `location` | `location_en` | 地理位置 |
| `description` | `description_en` | 岩場描述 |
| `type` | `type_en` | 岩場類型 |
| `rock_type` | `rock_type_en` | 岩石類型 |

**範例**:
```csv
name,name_en,type,type_en
龍洞,Long Dong,海蝕岩場,Sea Cliff
```

### 2. Routes (路線資訊)

| 中文欄位 | 英文欄位 | 說明 |
|---------|---------|------|
| `area` | `area_en` | 路線區域 |
| `name` | `english_name` | 路線名稱（保持原命名） |
| `description` | `description_en` | 路線描述 |
| `protection` | `protection_en` | 保護裝備資訊 |
| `tips` | `tips_en` | 攀登攻略 |
| `type` | `type_en` | 攀登類型 |

**範例**:
```csv
area,area_en,name,english_name,type,type_en
音樂廳,Music Hall,海神,Poseidon,運動攀登,Sport Climbing
```

### 3. RouteVideos (路線影片)

| 中文欄位 | 英文欄位 | 說明 |
|---------|---------|------|
| `title` | `title_en` | 影片標題 |
| `description` | `description_en` | 影片描述 |

**範例**:
```csv
title,title_en,description,description_en
海神首攀影片,Poseidon First Ascent,展示關鍵動作和完攀過程,Demonstrating key moves and complete ascent
```

### 4. RouteImages (路線圖片)

| 中文欄位 | 英文欄位 | 說明 |
|---------|---------|------|
| `caption` | `caption_en` | 圖片說明 |

**範例**:
```csv
caption,caption_en
海神路線起攀段,Poseidon route starting section
```

## 🔄 從現有資料轉換

### 路線類型 (type) 翻譯對照表

| 中文 | 英文 |
|-----|------|
| 運動攀登 | Sport Climbing |
| 傳統攀登 | Traditional Climbing |
| 抱石 | Bouldering |
| 混合 | Mixed |
| 上方架繩 | Top Rope |

### 岩場類型 (crag type) 翻譯對照表

| 中文 | 英文 |
|-----|------|
| 海蝕岩場 | Sea Cliff |
| 山岳岩場 | Mountain Crag |
| 海岸岩場 | Coastal Crag |
| 室內岩場 | Indoor Gym |

### 岩石類型 (rock type) 翻譯對照表

| 中文 | 英文 |
|-----|------|
| 砂岩 | Sandstone |
| 石灰岩 | Limestone |
| 大理岩 | Marble |
| 花崗岩 | Granite |
| 珊瑚礁岩 | Coral Limestone |
| 火成岩 | Igneous Rock |
| 砂岩、石灰岩混合 | Sandstone and Limestone Mix |

### 狀態 (status) 翻譯對照表

| 中文 | 英文 |
|-----|------|
| 草稿 | Draft |
| 待審核 | Pending Review |
| 已發佈 | Published |
| 已下架 | Archived |

## 💻 Cloudflare Worker API 調整

### API Response 結構

```typescript
interface Route {
  id: string
  cragId: string
  area: {
    zh: string
    en: string
  }
  name: {
    zh: string
    en: string
  }
  description: {
    zh: string
    en: string
  }
  type: {
    zh: string
    en: string
  }
  // ... 其他欄位
}
```

### Worker 程式碼範例

```typescript
// 從 Google Sheets 讀取並轉換為多語言格式
function transformToI18n(row: any[]) {
  return {
    id: row[0],
    cragId: row[1],
    area: {
      zh: row[2],
      en: row[3]
    },
    name: {
      zh: row[4],
      en: row[5]
    },
    grade: row[6],
    length: row[7],
    type: {
      zh: row[8],
      en: row[9]
    },
    description: {
      zh: row[12],
      en: row[13]
    },
    protection: {
      zh: row[14],
      en: row[15]
    },
    tips: {
      zh: row[16],
      en: row[17]
    },
    // ... 其他欄位
  }
}

// 支援語言查詢參數
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const lang = url.searchParams.get('lang') || 'zh' // 預設中文

    const routes = await getRoutes(env)

    // 根據語言參數簡化回應
    if (lang === 'zh' || lang === 'en') {
      const simplifiedRoutes = routes.map(route => ({
        ...route,
        area: route.area[lang],
        name: route.name[lang],
        description: route.description[lang],
        type: route.type[lang],
        protection: route.protection[lang],
        tips: route.tips[lang]
      }))
      return Response.json(simplifiedRoutes)
    }

    // 返回完整雙語資料
    return Response.json(routes)
  }
}
```

## 🌐 Frontend 整合

### Next.js i18n 設定

**`next.config.js`**:
```javascript
module.exports = {
  i18n: {
    locales: ['zh', 'en'],
    defaultLocale: 'zh',
  },
}
```

### API 呼叫範例

```typescript
// lib/api/routes.ts
export async function getRoutes(locale: string, cragId?: string) {
  const params = new URLSearchParams({
    lang: locale,
    ...(cragId && { crag: cragId })
  })

  const response = await fetch(
    `${API_BASE_URL}/api/routes?${params}`,
    { next: { revalidate: 300 } }
  )

  return response.json()
}

// 使用範例
const routes = await getRoutes('en', 'longdong')
```

### 組件使用範例

```typescript
// components/RouteCard.tsx
import { useRouter } from 'next/router'

export function RouteCard({ route }: { route: Route }) {
  const { locale } = useRouter()

  return (
    <div>
      <h2>{locale === 'en' ? route.name.en : route.name.zh}</h2>
      <p>{locale === 'en' ? route.description.en : route.description.zh}</p>
      <span>{locale === 'en' ? route.type.en : route.type.zh}</span>
    </div>
  )
}
```

### 或使用完整雙語資料

```typescript
// 使用雙語 API（不帶 lang 參數）
const routesI18n = await getRoutesI18n(cragId)

// 在前端根據 locale 選擇顯示
function RouteDetail({ route }: { route: RouteI18n }) {
  const { locale } = useRouter()
  const t = locale === 'en' ? 'en' : 'zh'

  return (
    <div>
      <h1>{route.name[t]}</h1>
      <p>{route.description[t]}</p>
    </div>
  )
}
```

## 📝 填寫指南

### 英文翻譯注意事項

1. **專有名詞**
   - 岩場名稱：使用音譯（如：龍洞 → Long Dong）
   - 路線名稱：保留英文原名或翻譯（如：海神 → Poseidon）

2. **技術術語**
   - 使用標準攀岩英文術語
   - 參考國際攀岩協會 (IFSC) 用語

3. **描述性文字**
   - 保持專業且清晰
   - 避免直譯，應該意譯為自然英文

4. **簡化版本**
   - 如果英文描述太長，可以適度簡化
   - 保留關鍵資訊（難度、特色、注意事項）

### 快速翻譯範本

**路線描述範本**:
```
中文: 這條路線具有[特色]，適合[對象]，攀登時需要注意[重點]
英文: This route features [characteristic], suitable for [audience], requires attention to [key point]
```

**保護資訊範本**:
```
中文: 固定保護點，共[數量]個[類型] Bolt
英文: Fixed protection, [number] [type] bolts total
```

**攀登建議範本**:
```
中文: 建議[建議內容]
英文: Recommended to [recommendation]
```

## 🔧 自動化翻譯工具

### 使用 Google Translate API（選用）

```typescript
// scripts/translate.ts
import { Translate } from '@google-cloud/translate/build/src/v2'

const translate = new Translate({
  projectId: 'your-project-id',
  key: 'your-api-key'
})

async function translateText(text: string, target: string = 'en') {
  const [translation] = await translate.translate(text, target)
  return translation
}

// 批次翻譯 CSV
async function translateCSV(inputPath: string, outputPath: string) {
  const data = await readCSV(inputPath)

  for (const row of data) {
    if (!row.description_en) {
      row.description_en = await translateText(row.description)
    }
    if (!row.tips_en) {
      row.tips_en = await translateText(row.tips)
    }
  }

  await writeCSV(outputPath, data)
}
```

**注意**: 自動翻譯需要人工審核和修正，確保專業術語正確。

## 📊 資料品質檢查

### 必填欄位檢查

使用 Google Apps Script 驗證雙語欄位：

```javascript
function validateI18nFields() {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const routesSheet = ss.getSheetByName('Routes')
  const data = routesSheet.getDataRange().getValues()

  const errors = []

  for (let i = 1; i < data.length; i++) {
    const row = data[i]
    const rowNum = i + 1

    // 檢查必填的雙語欄位
    if (!row[2] || !row[3]) { // area, area_en
      errors.push(`Row ${rowNum}: area 或 area_en 為空`)
    }

    if (!row[12] || !row[13]) { // description, description_en
      errors.push(`Row ${rowNum}: description 或 description_en 為空`)
    }
  }

  if (errors.length === 0) {
    SpreadsheetApp.getUi().alert('✅ 所有雙語欄位驗證通過')
  } else {
    const message = `❌ 發現 ${errors.length} 個錯誤：\n\n` + errors.join('\n')
    SpreadsheetApp.getUi().alert(message)
  }
}
```

## 🎯 最佳實踐

1. **優先填寫中文**
   - 先完整填寫所有中文內容
   - 確保中文資料準確無誤
   - 再進行英文翻譯

2. **保持一致性**
   - 使用統一的術語翻譯
   - 建立術語對照表
   - 定期審核更新

3. **簡化英文**
   - 英文可以比中文簡潔
   - 保留關鍵資訊即可
   - 避免冗長的翻譯

4. **技術審核**
   - 請英語母語攀岩者審核
   - 確保術語專業正確
   - 檢查語法和流暢度

## 🌏 未來擴展

### 支援更多語言

可以繼續添加其他語言欄位：
- `name_ja` (日文)
- `name_ko` (韓文)
- `name_fr` (法文)

### 資料庫設計

如果未來改用資料庫，建議使用獨立的翻譯表：

```sql
-- translations 表
CREATE TABLE translations (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(50), -- 'route', 'crag', 'video', 'image'
  entity_id VARCHAR(100),
  field_name VARCHAR(50),   -- 'name', 'description', 'tips'
  locale VARCHAR(10),       -- 'zh', 'en', 'ja'
  content TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

這樣可以更靈活地支援任意數量的語言。

---

**文件版本**: v1.0
**建立日期**: 2025-12-04
**最後更新**: 2025-12-04
**維護者**: NobodyClimb Team
