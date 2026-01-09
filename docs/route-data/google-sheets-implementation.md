# Google Sheets 路線資訊管理實作指南

**專案**: nobodyclimb-fe - 路線資訊管理
**建立日期**: 2025-12-03
**最後更新**: 2025-12-04
**方案**: Google Sheets + Cloudflare Worker API
**適用場景**: 多人協作編輯，零技術門檻，完全免費，支援中英雙語
**參考來源**: 基於 `/docs/route-data-refactor/` 的 CSV 範本和資料對應文件

## 📋 目錄

1. [架構概述](#架構概述)
2. [Google Sheets 設計](#google-sheets-設計)
3. [試算表設定步驟](#試算表設定步驟)
4. [Google Sheets API 設定](#google-sheets-api-設定)
5. [Cloudflare Worker 實作](#cloudflare-worker-實作)
6. [Frontend 整合](#frontend-整合)
7. [編輯指南](#編輯指南)
8. [資料驗證與品質控制](#資料驗證與品質控制)
9. [常見問題](#常見問題)

---

## 架構概述

### 系統架構圖

```
┌─────────────────────────────────────────────────┐
│  Google Sheets (資料來源)                        │
│  ├─ Sheet 1: 岩場資訊 (Crags)                   │
│  ├─ Sheet 2: 路線資訊 (Routes)                  │
│  ├─ Sheet 3: 路線影片 (Route Videos)            │
│  └─ Sheet 4: 路線圖片 (Route Images)            │
└─────────────────────────────────────────────────┘
                    ↓
        Google Sheets API (讀取)
                    ↓
┌─────────────────────────────────────────────────┐
│  Cloudflare Worker (資料轉換層)                  │
│  ├─ 讀取 Google Sheets                          │
│  ├─ 轉換為 JSON 格式                            │
│  ├─ 快取到 KV Storage (5分鐘)                  │
│  └─ 提供 REST API                               │
└─────────────────────────────────────────────────┘
                    ↓
         /api/routes?crag=龍洞 (JSON)
                    ↓
┌─────────────────────────────────────────────────┐
│  Next.js Frontend (Cloudflare Pages)            │
│  ├─ 呼叫 Worker API                             │
│  ├─ 渲染路線資訊                                │
│  └─ 顯示 YouTube + Instagram 影片               │
└─────────────────────────────────────────────────┘
```

### 資料流程

```
編輯者 → Google Sheets 編輯 → 自動儲存
                                  ↓
                         Worker 讀取 (5分鐘快取)
                                  ↓
                         Frontend 顯示更新
```

---

## Google Sheets 設計

### 試算表結構

建立一個名為 **「NobodyClimb 路線資料庫」** 的 Google Sheets，包含 4 個工作表：

### Sheet 1: 岩場資訊 (Crags)

| 欄位 | 說明 | 範例 | 驗證規則 |
|------|------|------|----------|
| A: crag_id | 岩場ID | longdong | 必填，英文小寫 |
| B: name | 中文名稱 | 龍洞 | 必填 |
| C: name_en | 英文名稱 | Long Dong | 必填 |
| D: location | 中文位置 | 新北市貢寮區 | 必填 |
| E: location_en | 英文位置 | Gongliao District, New Taipei City | 必填 |
| F: description | 中文描述 | 龍洞岩場是台灣最知名... | - |
| G: description_en | 英文描述 | Long Dong is Taiwan's most famous... | - |
| H: type | 中文岩場類型 | 海蝕岩場 | 下拉選單 |
| I: type_en | 英文岩場類型 | Sea Cliff | 下拉選單 |
| J: rock_type | 中文岩石類型 | 砂岩、石灰岩混合 | - |
| K: rock_type_en | 英文岩石類型 | Sandstone and Limestone Mix | - |
| L: routes_count | 路線數量 | 500 | 數字 |
| M: difficulty_range | 難度範圍 | 5.6 - 5.14a | - |
| N: height_range | 高度範圍 | 5-30m | - |
| O: latitude | 緯度 | 25.1078 | 數字 |
| P: longitude | 經度 | 121.9188 | 數字 |
| Q: status | 狀態 | 已發佈 | 下拉選單 |

**範例資料**：

| crag_id | name | name_en | location | location_en | type | type_en | status |
|---------|------|---------|----------|-------------|------|---------|--------|
| longdong | 龍洞 | Long Dong | 新北市貢寮區 | Gongliao District, New Taipei City | 海蝕岩場 | Sea Cliff | 已發佈 |
| guanzilin | 關子嶺 | Guanziling | 台南市白河區 | Baihe District, Tainan City | 山岳岩場 | Mountain Crag | 已發佈 |
| defulan | 德芙蘭 | Defulan | 苗栗縣泰安鄉 | Taian Township, Miaoli County | 山岳岩場 | Mountain Crag | 已發佈 |
| shoushan | 壽山 | Shoushan | 高雄市鼓山區 | Gushan District, Kaohsiung City | 珊瑚礁岩場 | Coral Limestone Crag | 已發佈 |
| kenting | 墾丁 | Kenting | 屏東縣恆春鎮 | Hengchun Township, Pingtung County | 海岸岩場 | Coastal Crag | 已發佈 |

---

### Sheet 2: 路線資訊 (Routes)

這是**最重要**的工作表，儲存所有路線的基本資訊。支援中英雙語。

| 欄位 | 說明 | 範例 | 驗證規則 |
|------|------|------|----------|
| A: route_id | 路線ID | LD329 | 必填，2-3字母+3-4數字 |
| B: crag_id | 所屬岩場ID | longdong | 必填，下拉選單 |
| C: area | 中文區域名稱 | 音樂廳 | 必填 |
| D: area_en | 英文區域名稱 | Music Hall | 必填 |
| E: name | 中文路線名稱 | 肥牛 | 必填 |
| F: english_name | 英文路線名稱 | Fat Cow | 必填 |
| G: grade | 難度等級 | 5.6 | 必填，下拉選單 |
| H: length | 長度 | 10m | 必填，數字+m |
| I: type | 中文攀登類型 | 傳統攀登 | 必填，下拉選單 |
| J: type_en | 英文攀登類型 | Traditional Climbing | 必填，下拉選單 |
| K: first_ascent | 首登者 | 吳招坤 | - |
| L: first_ascent_date | 首登日期 | 1988-07-01 | 日期 YYYY-MM-DD |
| M: description | 中文路線描述 | 可步行下撤 | - |
| N: description_en | 英文路線描述 | Walk-off descent available | - |
| O: protection | 中文保護裝備 | 固定保護點，共8個316-TW Bolt | - |
| P: protection_en | 英文保護裝備 | Fixed protection, 8 316-TW bolts total | - |
| Q: tips | 中文攀登攻略 | 建議佩戴岩盔，確保者提高警覺 | - |
| R: tips_en | 英文攀登攻略 | Helmet recommended, belayer stay alert | - |
| S: safety_rating | 安全評級 | ●●● | 符號 |
| T: popularity | 人氣值 | 4.5 | 數字，0-5 |
| U: views | 瀏覽次數 | 1245 | 數字 |
| V: status | 狀態 | 已發佈 | 下拉選單 |
| W: created_by | 建立者 | user@example.com | - |
| X: created_date | 建立日期 | 2025-12-03 | 日期 |
| Y: updated_date | 更新日期 | 2025-12-04 | 日期 |

**範例資料**：

| route_id | crag_id | area | area_en | name | english_name | grade | length | type | type_en | status |
|----------|---------|------|---------|------|--------------|-------|--------|------|---------|--------|
| LD329 | longdong | 音樂廳 | Music Hall | 肥牛 | Fat Cow | 5.6 | 10m | 傳統攀登 | Traditional Climbing | 已發佈 |
| LD330 | longdong | 音樂廳 | Music Hall | 瘦馬 | Skinny Horse | 5.9 | 9m | 傳統攀登 | Traditional Climbing | 已發佈 |
| LD338 | longdong | 音樂廳 | Music Hall | 直接嘗試 | Direct Attempt | 5.11d | 16m | 運動攀登 | Sport Climbing | 已發佈 |
| LD367 | longdong | 音樂廳 | Music Hall | Fucking Fall | Fucking Fall | 5.11a | 15m | 運動攀登 | Sport Climbing | 已發佈 |
| LD523 | longdong | 校門口 | School Gate | V槽 | V-Groove | 5.10b | 15m | 運動攀登 | Sport Climbing | 已發佈 |
| LD525 | longdong | 校門口 | School Gate | 無名小卒 | Nowhere Man | 5.12a | 20m | 運動攀登 | Sport Climbing | 已發佈 |
| LD526 | longdong | 校門口 | School Gate | 水虎魚 | Piranha | 5.11c | 18m | 運動攀登 | Sport Climbing | 已發佈 |
| LD305 | longdong | 大禮堂 | Grand Auditorium | 龍脊中路 | Dragon Ridge Center | 5.5 | 33m | 傳統攀登 | Traditional Climbing | 已發佈 |

---

### Sheet 3: 路線影片 (Route Videos)

| 欄位 | 說明 | 範例 | 驗證規則 |
|------|------|------|----------|
| A: video_id | 影片ID | V001 | 自動產生 |
| B: route_id | 所屬路線ID | LD329 | 必填，下拉選單 |
| C: order | 排序 | 1 | 數字，1,2,3... |
| D: source | 來源 | youtube | 下拉選單 |
| E: url | 影片網址 | https://youtube.com/watch?v=... | 必填，URL格式 |
| F: title | 中文影片標題 | 肥牛攀登影片 | - |
| G: title_en | 英文影片標題 | Fat Cow Climbing Video | - |
| H: description | 中文影片描述 | 展示關鍵動作 | - |
| I: description_en | 英文影片描述 | Demonstrating key moves | - |
| J: author | 上傳者 | 攀岩老手 | - |
| K: upload_date | 上傳日期 | 2023-10-15 | 日期 YYYY-MM-DD |
| L: duration_sec | 時長（秒） | 324 | 數字 |
| M: status | 狀態 | 已發佈 | 下拉選單 |

**範例資料**：

| video_id | route_id | order | source | url | title | title_en | status |
|----------|----------|-------|--------|-----|-------|----------|--------|
| V001 | LD329 | 1 | youtube | https://www.youtube.com/watch?v=AbCdEfGhIjK | 肥牛攀登影片 | Fat Cow Climbing | 已發佈 |
| V002 | LD330 | 1 | instagram | https://www.instagram.com/p/ABC123/ | 瘦馬完攀 | Skinny Horse Ascent | 已發佈 |
| V003 | LD338 | 1 | youtube | https://www.youtube.com/watch?v=LmNoPqRsTuV | 直接嘗試攻略 | Direct Attempt Guide | 已發佈 |
| V004 | LD367 | 1 | youtube | https://www.youtube.com/watch?v=WxYzAbCdEfG | Fucking Fall 首攀 | Fucking Fall First Ascent | 已發佈 |

---

### Sheet 4: 路線圖片 (Route Images)

| 欄位 | 說明 | 範例 | 驗證規則 |
|------|------|------|----------|
| A: image_id | 圖片ID | IMG001 | 自動產生 |
| B: route_id | 所屬路線ID | LD329 | 必填，下拉選單 |
| C: order | 排序 | 1 | 數字 |
| D: url | 圖片網址 | https://imgur.com/abc123.jpg | 必填，URL格式 |
| E: caption | 中文說明 | 起攀段 | - |
| F: caption_en | 英文說明 | Starting section | - |
| G: uploaded_by | 上傳者 | user@example.com | - |
| H: uploaded_date | 上傳日期 | 2025-12-03 | 日期 YYYY-MM-DD |
| I: status | 狀態 | 已發佈 | 下拉選單 |

**範例資料**：

| image_id | route_id | order | url | caption | caption_en | status |
|----------|----------|-------|-----|---------|------------|--------|
| IMG001 | LD329 | 1 | https://imgur.com/fatcow1.jpg | 起攀段 | Starting section | 已發佈 |
| IMG002 | LD329 | 2 | https://imgur.com/fatcow2.jpg | 關鍵動作 | Key moves | 已發佈 |
| IMG003 | LD330 | 1 | https://imgur.com/skinnyhorse1.jpg | 頂部段落 | Top section | 已發佈 |

---

## 試算表設定步驟

### 步驟 1: 建立 Google Sheets

1. 前往 [Google Sheets](https://sheets.google.com)
2. 點擊「空白試算表」
3. 命名為 **「NobodyClimb 路線資料庫」**

### 步驟 2: 建立工作表

1. 建立 4 個工作表（Sheet）：
   - `Crags` (岩場資訊)
   - `Routes` (路線資訊)
   - `RouteVideos` (路線影片)
   - `RouteImages` (路線圖片)

### 步驟 3: 設定欄位標題

**在每個 Sheet 的第 1 行**輸入欄位名稱（如上方表格）

**重要提示**：
- 第 1 行是欄位名稱（會在 API 中使用）
- 資料從第 2 行開始輸入
- 不要刪除或移動欄位順序

### 步驟 4: 設定資料驗證（防止輸入錯誤）

#### 4.1 Routes 工作表驗證

**G 欄: grade (難度)**

1. 選取 `G2:G1000`
2. 資料 → 資料驗證
3. 條件：清單
4. 輸入值（逗號分隔）：
   ```
   5.5,5.6,5.7,5.8,5.9,5.9+,5.10a,5.10b,5.10c,5.10d,5.11a,5.11b,5.11c,5.11d,5.12a,5.12b,5.12c,5.12d,5.13a,5.13b,5.13c,5.13d,5.14a,5.14b,5.14c,5.14d,5.15a,5.15b,5.15c,5.15d
   ```
5. 勾選「顯示下拉式清單」
6. 顯示拒絕輸入

**I 欄: type (中文攀登類型)**

1. 選取 `I2:I1000`
2. 資料驗證 → 清單
3. 輸入值：
   ```
   運動攀登,傳統攀登,抱石,上方架繩,混合
   ```

**J 欄: type_en (英文攀登類型)**

1. 選取 `J2:J1000`
2. 資料驗證 → 清單
3. 輸入值：
   ```
   Sport Climbing,Traditional Climbing,Bouldering,Top Rope,Mixed
   ```

**B 欄: crag_id (岩場ID)**

1. 選取 `B2:B1000`
2. 資料驗證 → 範圍內的清單
3. 範圍：`Crags!A2:A100`（從岩場工作表讀取）

**V 欄: status (狀態)**

1. 選取 `V2:V1000`
2. 資料驗證 → 清單
3. 輸入值：
   ```
   草稿,待審核,已發佈,已下架
   ```

#### 4.2 RouteVideos 工作表驗證

**B 欄: route_id (路線ID)**

1. 選取 `B2:B1000`
2. 資料驗證 → 範圍內的清單
3. 範圍：`Routes!A2:A1000`

**D 欄: source (來源)**

1. 選取 `D2:D1000`
2. 資料驗證 → 清單
3. 輸入值：
   ```
   youtube,instagram
   ```

**M 欄: status (狀態)**

1. 選取 `M2:M1000`
2. 資料驗證 → 清單
3. 輸入值：`草稿,已發佈,已下架`

#### 4.3 RouteImages 工作表驗證

同樣設定 `route_id` 和 `status` 的驗證規則。

### 步驟 5: 設定條件式格式化（視覺提示）

**標示必填欄位空白**

1. 選取 Routes 工作表的 `A2:D1000`（route_id, crag_id, name, english_name）
2. 格式 → 條件式格式化
3. 格式規則：
   - 格式化儲存格條件：**空白**
   - 格式樣式：**淺紅色背景**

**標示不同狀態**

1. 選取 `O2:O1000`（status 欄）
2. 條件式格式化
3. 新增規則：
   - 條件：**文字完全相符** → `已發佈`
   - 格式：**綠色背景**
4. 新增規則：
   - 條件：**文字完全相符** → `草稿`
   - 格式：**黃色背景**

### 步驟 6: 建立範本（加速新增資料）

**在 Routes 工作表**：

1. 在第 2 行填寫範本資料（含公式）
2. 在 A2 輸入：`=CONCATENATE(B2, LPAD(ROW()-1, 3, "0"))`
   - 自動產生路線ID（如 LD001, LD002...）
3. 在 Q2 輸入：`=TODAY()`（自動填寫建立日期）
4. 在 R2 輸入：`=TODAY()`（自動填寫更新日期）

**複製範本**：
- 新增路線時，複製第 2 行 → 貼到新行
- 只需填寫 B-N 欄，其他欄位自動產生

### 步驟 7: 設定共用與權限

1. 點擊右上角「共用」
2. 新增協作者的 Gmail 帳號
3. 權限設定：
   - **編輯者**：可新增、修改資料
   - **檢視者**：唯讀
4. 設定「知道連結的任何人」→ **檢視者**（API 使用）

### 步驟 8: 取得 Spreadsheet ID

**從網址列複製 ID**：

```
https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
                                        ↑
                                複製這段 ID
```

範例：
```
https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit

Spreadsheet ID: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
```

**儲存此 ID**，後續 API 設定會用到。

---

## Google Sheets API 設定

### 方法 1: 服務帳號（推薦）

#### 步驟 1: 建立 Google Cloud 專案

1. 前往 [Google Cloud Console](https://console.cloud.google.com)
2. 建立新專案：「NobodyClimb API」
3. 選擇專案

#### 步驟 2: 啟用 Google Sheets API

1. 左側選單：「API 和服務」→「程式庫」
2. 搜尋「Google Sheets API」
3. 點擊「啟用」

#### 步驟 3: 建立服務帳號

1. 左側選單：「API 和服務」→「憑證」
2. 點擊「建立憑證」→「服務帳號」
3. 服務帳號名稱：`nobodyclimb-sheets-reader`
4. 角色：無需設定（使用 Sheet 共用權限）
5. 完成

#### 步驟 4: 建立金鑰

1. 點擊剛建立的服務帳號
2. 「金鑰」分頁 → 「新增金鑰」→「JSON」
3. 下載 JSON 檔案（例：`nobodyclimb-sheets-12345.json`）

**JSON 內容範例**：

```json
{
  "type": "service_account",
  "project_id": "nobodyclimb-api",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "nobodyclimb-sheets-reader@nobodyclimb-api.iam.gserviceaccount.com",
  "client_id": "123456789...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token"
}
```

#### 步驟 5: 分享 Sheet 給服務帳號

1. 打開你的 Google Sheets
2. 點擊「共用」
3. 新增 `client_email`（例：`nobodyclimb-sheets-reader@...`）
4. 權限：**檢視者**
5. 取消勾選「傳送通知」
6. 共用

✅ 完成！服務帳號現在可以讀取你的 Sheets。

---

### 方法 2: API Key（簡單但有限制）

**步驟 1**: 建立 API Key

1. Google Cloud Console → 憑證
2. 建立憑證 → API 金鑰
3. 複製金鑰

**步驟 2**: 設定 Sheet 公開

1. 打開 Google Sheets
2. 共用 → 知道連結的任何人 → **檢視者**

**限制**：
- ⚠️ Sheet 必須設為「知道連結的任何人可檢視」
- ⚠️ 無法讀取私人 Sheet

**建議**：使用方法 1（服務帳號）較安全。

---

## Cloudflare Worker 實作

### 架構說明

Worker 扮演的角色：
1. 從 Google Sheets 讀取資料
2. 轉換為 JSON 格式
3. 快取到 KV Storage（5 分鐘）
4. 提供 REST API 給 Frontend

### 步驟 1: 建立 Cloudflare Worker

```bash
# 安裝 Wrangler CLI
npm install -g wrangler

# 登入 Cloudflare
wrangler login

# 建立 Worker 專案
mkdir nobodyclimb-api
cd nobodyclimb-api
wrangler init

# 選擇
# - TypeScript: Yes
# - Fetch handler: Yes
```

### 步驟 2: 建立 KV Namespace（快取）

```bash
# 建立 KV namespace
wrangler kv:namespace create ROUTES_CACHE

# 輸出範例：
# { binding = "ROUTES_CACHE", id = "abc123..." }

# 記下 id，加到 wrangler.toml
```

**編輯 `wrangler.toml`**：

```toml
name = "nobodyclimb-api"
main = "src/index.ts"
compatibility_date = "2025-12-03"

# KV Namespace
[[kv_namespaces]]
binding = "ROUTES_CACHE"
id = "abc123..."  # 替換成你的 KV ID

# 環境變數
[vars]
SPREADSHEET_ID = "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
CACHE_TTL = "300"  # 5 分鐘
```

### 步驟 3: 設定 Secret（服務帳號金鑰）

```bash
# 將服務帳號 JSON 轉為單行字串
cat nobodyclimb-sheets-12345.json | jq -c . > credentials.txt

# 設定為 Secret
wrangler secret put GOOGLE_CREDENTIALS

# 貼上 credentials.txt 的內容，按 Enter
```

### 步驟 4: 實作 Worker 程式碼

**安裝依賴**：

```bash
npm install googleapis
```

**`src/index.ts`**：

```typescript
import { google } from 'googleapis'

interface Env {
  ROUTES_CACHE: KVNamespace
  GOOGLE_CREDENTIALS: string
  SPREADSHEET_ID: string
  CACHE_TTL: string
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }

    // Handle OPTIONS (CORS preflight)
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    try {
      // API 路由
      if (path === '/api/routes') {
        const cragId = url.searchParams.get('crag')
        const routes = await getRoutes(env, cragId)
        return Response.json(routes, { headers: corsHeaders })
      }

      if (path === '/api/crags') {
        const crags = await getCrags(env)
        return Response.json(crags, { headers: corsHeaders })
      }

      // 健康檢查
      if (path === '/health') {
        return Response.json({ status: 'ok' }, { headers: corsHeaders })
      }

      return Response.json(
        { error: 'Not found' },
        { status: 404, headers: corsHeaders }
      )
    } catch (error) {
      console.error('Error:', error)
      return Response.json(
        { error: 'Internal server error' },
        { status: 500, headers: corsHeaders }
      )
    }
  },
}

/**
 * 取得路線資料
 */
async function getRoutes(env: Env, cragId?: string | null): Promise<any[]> {
  // 快取 key
  const cacheKey = cragId ? `routes_${cragId}` : 'routes_all'

  // 檢查快取
  const cached = await env.ROUTES_CACHE.get(cacheKey)
  if (cached) {
    console.log('Cache hit:', cacheKey)
    return JSON.parse(cached)
  }

  console.log('Cache miss, fetching from Sheets...')

  // 從 Google Sheets 讀取
  const sheets = await getSheetsClient(env)

  // 讀取路線資料 (更新為 Y 欄以支援新的 i18n 欄位)
  const routesResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: env.SPREADSHEET_ID,
    range: 'Routes!A2:Y1000',
  })

  const routeRows = routesResponse.data.values || []

  // 讀取影片資料 (更新為 M 欄以支援 i18n)
  const videosResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: env.SPREADSHEET_ID,
    range: 'RouteVideos!A2:M1000',
  })

  const videoRows = videosResponse.data.values || []

  // 讀取圖片資料 (更新為 I 欄以支援 i18n)
  const imagesResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: env.SPREADSHEET_ID,
    range: 'RouteImages!A2:I1000',
  })

  const imageRows = imagesResponse.data.values || []

  // 轉換為結構化資料
  const routes = routeRows
    .map((row) => {
      const routeId = row[0]
      const routeCragId = row[1]

      // 如果有指定 cragId，只回傳該岩場的路線
      if (cragId && routeCragId !== cragId) {
        return null
      }

      return {
        id: routeId,
        cragId: routeCragId,
        area: {
          zh: row[2] || '',
          en: row[3] || ''
        },
        name: {
          zh: row[4] || '',
          en: row[5] || ''
        },
        grade: row[6] || '',
        length: row[7] || '',
        type: {
          zh: row[8] || '',
          en: row[9] || ''
        },
        firstAscent: row[10] || '',
        firstAscentDate: row[11] || '',
        description: {
          zh: row[12] || '',
          en: row[13] || ''
        },
        protection: {
          zh: row[14] || '',
          en: row[15] || ''
        },
        tips: {
          zh: row[16] || '',
          en: row[17] || ''
        },
        safetyRating: row[18] || '',
        popularity: parseFloat(row[19]) || 0,
        views: parseInt(row[20]) || 0,
        status: row[21] || 'draft',

        // 關聯影片 (更新欄位索引以支援 i18n)
        videos: videoRows
          .filter((v) => v[1] === routeId && v[12] === '已發佈')
          .sort((a, b) => parseInt(a[2]) - parseInt(b[2]))
          .map((v) => ({
            id: v[0],
            source: v[3],
            url: v[4],
            embedUrl: convertToEmbedUrl(v[4], v[3]),
            title: {
              zh: v[5] || '',
              en: v[6] || ''
            },
            description: {
              zh: v[7] || '',
              en: v[8] || ''
            },
            author: v[9] || '',
            uploadDate: v[10] || '',
            duration: parseInt(v[11]) || 0,
          })),

        // 關聯圖片 (更新欄位索引以支援 i18n)
        images: imageRows
          .filter((img) => img[1] === routeId && img[8] === '已發佈')
          .sort((a, b) => parseInt(a[2]) - parseInt(b[2]))
          .map((img) => ({
            url: img[3],
            caption: {
              zh: img[4] || '',
              en: img[5] || ''
            }
          })),
      }
    })
    .filter((route) => route !== null && route.status === '已發佈')

  // 快取結果
  const cacheTtl = parseInt(env.CACHE_TTL) || 300
  await env.ROUTES_CACHE.put(cacheKey, JSON.stringify(routes), {
    expirationTtl: cacheTtl,
  })

  return routes
}

/**
 * 取得岩場資料
 */
async function getCrags(env: Env): Promise<any[]> {
  const cacheKey = 'crags_all'

  // 檢查快取
  const cached = await env.ROUTES_CACHE.get(cacheKey)
  if (cached) {
    return JSON.parse(cached)
  }

  const sheets = await getSheetsClient(env)

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: env.SPREADSHEET_ID,
    range: 'Crags!A2:Q1000',  // 更新為 Q 欄以支援新的 i18n 欄位
  })

  const rows = response.data.values || []

  const crags = rows
    .filter((row) => row[16] === '已發佈')  // status 現在在第 17 欄 (Q)
    .map((row) => ({
      id: row[0],
      name: {
        zh: row[1],
        en: row[2]
      },
      location: {
        zh: row[3],
        en: row[4]
      },
      description: {
        zh: row[5] || '',
        en: row[6] || ''
      },
      type: {
        zh: row[7] || '',
        en: row[8] || ''
      },
      rockType: {
        zh: row[9] || '',
        en: row[10] || ''
      },
      routesCount: parseInt(row[11]) || 0,
      difficultyRange: row[12] || '',
      heightRange: row[13] || '',
      latitude: parseFloat(row[14]) || 0,
      longitude: parseFloat(row[15]) || 0,
    }))

  // 快取
  const cacheTtl = parseInt(env.CACHE_TTL) || 300
  await env.ROUTES_CACHE.put(cacheKey, JSON.stringify(crags), {
    expirationTtl: cacheTtl,
  })

  return crags
}

/**
 * 建立 Google Sheets 客戶端
 */
async function getSheetsClient(env: Env) {
  const credentials = JSON.parse(env.GOOGLE_CREDENTIALS)

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })

  return google.sheets({ version: 'v4', auth })
}

/**
 * 轉換為嵌入 URL
 */
function convertToEmbedUrl(url: string, source: string): string {
  if (source === 'youtube') {
    // https://www.youtube.com/watch?v=VIDEO_ID
    // https://youtu.be/VIDEO_ID
    // -> https://www.youtube.com/embed/VIDEO_ID
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([^&]+)/,
      /(?:youtu\.be\/)([^?]+)/,
      /(?:youtube\.com\/embed\/)([^?]+)/,
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) {
        return `https://www.youtube.com/embed/${match[1]}`
      }
    }
  }

  // Instagram 使用原始 URL
  return url
}
```

### 步驟 5: 測試 Worker

```bash
# 本地測試
wrangler dev

# 測試 API
curl http://localhost:8787/api/routes
curl http://localhost:8787/api/routes?crag=longdong
curl http://localhost:8787/api/crags
```

### 步驟 6: 部署 Worker

```bash
# 部署到 Cloudflare
wrangler deploy

# 輸出範例：
# Published nobodyclimb-api (1.23 sec)
#   https://nobodyclimb-api.your-subdomain.workers.dev
```

**記下 Worker URL**，例如：
```
https://nobodyclimb-api.xiaoxu.workers.dev
```

---

## Frontend 整合

### 步驟 1: 建立 API 客戶端

**`src/lib/api/sheets-api.ts`**：

```typescript
const API_BASE_URL = 'https://nobodyclimb-api.xiaoxu.workers.dev'

/**
 * 取得所有岩場
 */
export async function getCrags() {
  const response = await fetch(`${API_BASE_URL}/api/crags`, {
    next: { revalidate: 300 }, // 快取 5 分鐘
  })

  if (!response.ok) {
    throw new Error('Failed to fetch crags')
  }

  return response.json()
}

/**
 * 取得路線資料
 */
export async function getRoutes(cragId?: string) {
  const url = cragId
    ? `${API_BASE_URL}/api/routes?crag=${cragId}`
    : `${API_BASE_URL}/api/routes`

  const response = await fetch(url, {
    next: { revalidate: 300 }, // 快取 5 分鐘
  })

  if (!response.ok) {
    throw new Error('Failed to fetch routes')
  }

  return response.json()
}
```

### 步驟 2: 更新岩場頁面

**`src/app/crag/[id]/page.tsx`**：

```typescript
import { getRoutes } from '@/lib/api/sheets-api'
import { CragRouteSection } from '@/components/crag/route-section'

export default async function CragDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // 從 Google Sheets API 讀取路線資料
  const routes = await getRoutes(id)

  return (
    <main className="min-h-screen bg-gray-50">
      {/* ... 岩場資訊 ... */}

      {/* 路線資訊 */}
      <CragRouteSection routes={routes} />
    </main>
  )
}
```

### 步驟 3: 測試整合

```bash
# 啟動開發伺服器
npm run dev

# 訪問岩場頁面
open http://localhost:3000/crag/longdong
```

✅ 現在路線資料會從 Google Sheets 動態讀取！

---

## 編輯指南

### 編輯者操作手冊

#### 新增路線的標準流程

**步驟 1: 開啟 Google Sheets**

前往：`https://docs.google.com/spreadsheets/d/[YOUR_ID]/edit`

**步驟 2: 切換到 Routes 工作表**

**步驟 3: 複製範本行（第 2 行）**

1. 點擊第 2 行的行號（整行選取）
2. Ctrl+C（複製）
3. 點擊最後一行的下一行
4. Ctrl+V（貼上）

**步驟 4: 填寫路線資訊**

| 欄位 | 填寫方式 | 範例 |
|------|----------|------|
| A: route_id | 自動產生（公式） | LD004 |
| B: crag_id | 下拉選單選擇 | longdong |
| C: name | 輸入中文名稱 | 微風輕拂 |
| D: english_name | 輸入英文名稱 | Gentle Breeze |
| E: grade | 下拉選單選擇 | 5.7 |
| F: length | 輸入數字+m | 15m |
| G: type | 下拉選單選擇 | 運動攀登 |
| H: area | 輸入區域名稱 | 音樂廳 |
| I: first_ascent | 輸入首登資訊 | 陳小華, 1998 |
| J: description | 輸入詳細描述 | 完美的入門級路線... |
| K: protection | 輸入保護裝備 | 密集的固定保護點 |
| L: tips | 輸入攀登攻略 | 適合初學者的第一條... |
| M: popularity | 輸入數字 0-5 | 4.9 |
| N: views | 輸入數字 | 0 |
| O: status | 下拉選單選擇 | 草稿 |
| P: created_by | 自動填入（公式） | your@email.com |
| Q: created_date | 自動填入（公式） | 2025-12-03 |
| R: updated_date | 自動更新（公式） | 2025-12-03 |

**步驟 5: 新增影片**

切換到 `RouteVideos` 工作表：

| route_id | order | source | url | title |
|----------|-------|--------|-----|-------|
| LD004 | 1 | youtube | https://youtube.com/watch?v=... | 攀登示範 |
| LD004 | 2 | instagram | https://instagram.com/p/... | 完攀影片 |

**步驟 6: 新增圖片**

1. 先將圖片上傳到 [Imgur](https://imgur.com) 或其他圖床
2. 複製圖片網址
3. 切換到 `RouteImages` 工作表：

| route_id | order | url | caption |
|----------|-------|-----|---------|
| LD004 | 1 | https://imgur.com/abc123.jpg | 起攀段 |
| LD004 | 2 | https://imgur.com/def456.jpg | 頂部段 |

**步驟 7: 審核與發佈**

1. 確認所有資訊正確
2. 將 Routes 工作表的 `status` 改為 **「已發佈」**
3. 將 RouteVideos 的 `status` 改為 **「已發佈」**
4. 將 RouteImages 的 `status` 改為 **「已發佈」**

**步驟 8: 等待更新**

- 快取時間：5 分鐘
- 5 分鐘後前端會顯示新路線

---

### 常見編輯場景

#### 場景 1: 修改路線描述

1. 找到該路線的那一行
2. 直接編輯 `description` 欄位
3. 更新 `updated_date`（自動）
4. 儲存

#### 場景 2: 新增影片

1. 切換到 `RouteVideos` 工作表
2. 新增一行
3. 填寫 `route_id`, `order`, `source`, `url`, `title`
4. `status` 設為「已發佈」

#### 場景 3: 更換圖片

1. 上傳新圖片到 Imgur
2. 在 `RouteImages` 工作表找到該圖片
3. 更新 `url` 欄位
4. 或新增一行，將舊圖片 `status` 改為「已下架」

#### 場景 4: 下架路線

1. 將 Routes 的 `status` 改為「已下架」
2. 該路線會從網站消失（但資料保留）

---

## 資料驗證與品質控制

### 自動驗證腳本

建立一個 Google Apps Script 來驗證資料品質。

**步驟 1: 開啟腳本編輯器**

1. 在 Google Sheets 中：擴充功能 → Apps Script
2. 刪除預設程式碼
3. 貼上以下程式碼

**`Code.gs`**：

```javascript
/**
 * 驗證路線資料
 */
function validateRouteData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const routesSheet = ss.getSheetByName('Routes')
  const data = routesSheet.getDataRange().getValues()

  const errors = []

  // 從第 2 行開始（第 1 行是標題）
  for (let i = 1; i < data.length; i++) {
    const row = data[i]
    const rowNum = i + 1

    // A: route_id - 必須是 2 字母 + 3 數字
    const routeId = row[0]
    if (!/^[A-Z]{2}\d{3}$/.test(routeId)) {
      errors.push(`Row ${rowNum}: route_id 格式錯誤 "${routeId}"，應為 2 字母 + 3 數字（如 LD001）`)
    }

    // C: name - 必填
    if (!row[2]) {
      errors.push(`Row ${rowNum}: name 欄位為空`)
    }

    // E: grade - 必須是有效的 YDS 難度
    const grade = row[4]
    const validGrades = /^5\.[0-9]{1,2}[a-d+]?$/
    if (grade && !validGrades.test(grade)) {
      errors.push(`Row ${rowNum}: grade 格式錯誤 "${grade}"`)
    }

    // F: length - 必須是數字 + m
    const length = row[5]
    if (length && !/^\d+m$/.test(length)) {
      errors.push(`Row ${rowNum}: length 格式錯誤 "${length}"，應為數字+m（如 25m）`)
    }

    // J: description - 必填且至少 20 字
    const description = row[9]
    if (!description || description.length < 20) {
      errors.push(`Row ${rowNum}: description 過短（至少 20 字）`)
    }
  }

  // 顯示結果
  if (errors.length === 0) {
    SpreadsheetApp.getUi().alert('✅ 驗證通過！所有資料格式正確。')
  } else {
    const message = `❌ 發現 ${errors.length} 個錯誤：\n\n` + errors.join('\n')
    SpreadsheetApp.getUi().alert(message)
  }
}

/**
 * 在選單中新增驗證按鈕
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi()
  ui.createMenu('📋 資料驗證')
    .addItem('驗證路線資料', 'validateRouteData')
    .addItem('檢查重複 ID', 'checkDuplicateIds')
    .addItem('驗證影片 URL', 'validateVideoUrls')
    .addToUi()
}

/**
 * 檢查重複的路線 ID
 */
function checkDuplicateIds() {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const routesSheet = ss.getSheetByName('Routes')
  const data = routesSheet.getDataRange().getValues()

  const idCount = {}
  const duplicates = []

  for (let i = 1; i < data.length; i++) {
    const routeId = data[i][0]
    if (!routeId) continue

    if (idCount[routeId]) {
      duplicates.push(`Row ${i + 1}: 重複的 route_id "${routeId}"`)
    } else {
      idCount[routeId] = 1
    }
  }

  if (duplicates.length === 0) {
    SpreadsheetApp.getUi().alert('✅ 沒有重複的路線 ID')
  } else {
    const message = `❌ 發現 ${duplicates.length} 個重複 ID：\n\n` + duplicates.join('\n')
    SpreadsheetApp.getUi().alert(message)
  }
}

/**
 * 驗證影片 URL 格式
 */
function validateVideoUrls() {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const videosSheet = ss.getSheetByName('RouteVideos')
  const data = videosSheet.getDataRange().getValues()

  const errors = []

  for (let i = 1; i < data.length; i++) {
    const row = data[i]
    const rowNum = i + 1
    const source = row[3]
    const url = row[4]

    if (!url) continue

    if (source === 'youtube') {
      const isValidYouTube =
        url.includes('youtube.com/watch?v=') ||
        url.includes('youtu.be/') ||
        url.includes('youtube.com/embed/')

      if (!isValidYouTube) {
        errors.push(`Row ${rowNum}: 無效的 YouTube URL "${url}"`)
      }
    } else if (source === 'instagram') {
      const isValidIG = url.includes('instagram.com/')

      if (!isValidIG) {
        errors.push(`Row ${rowNum}: 無效的 Instagram URL "${url}"`)
      }
    }
  }

  if (errors.length === 0) {
    SpreadsheetApp.getUi().alert('✅ 所有影片 URL 格式正確')
  } else {
    const message = `❌ 發現 ${errors.length} 個錯誤：\n\n` + errors.join('\n')
    SpreadsheetApp.getUi().alert(message)
  }
}
```

**步驟 2: 儲存並授權**

1. 點擊「儲存」圖示
2. 專案名稱：「Route Data Validator」
3. 重新整理 Google Sheets
4. 選單列會出現「📋 資料驗證」選單

**步驟 3: 執行驗證**

1. 點擊「📋 資料驗證」→「驗證路線資料」
2. 第一次執行需要授權
3. 完成後會顯示驗證結果

---

### 資料品質檢查清單

**發佈前檢查**：

- [ ] 路線 ID 格式正確（如 LD001）
- [ ] 所有必填欄位已填寫
- [ ] 難度格式正確（5.6 - 5.15d）
- [ ] 長度格式正確（數字+m）
- [ ] 描述至少 20 字
- [ ] 影片 URL 有效
- [ ] 圖片 URL 可訪問
- [ ] 狀態設為「已發佈」
- [ ] 無重複的路線 ID

---

## 常見問題

### Q1: 更新資料後多久會在網站顯示？

**A**: 5 分鐘內（快取時間）。

如果需要立即更新，可以手動清除快取：

```bash
# 使用 Wrangler CLI
wrangler kv:key delete --binding=ROUTES_CACHE "routes_longdong"
wrangler kv:key delete --binding=ROUTES_CACHE "routes_all"
```

---

### Q2: 如何上傳圖片？

**A**: Google Sheets 無法直接儲存圖片，需要使用圖床服務：

**推薦圖床**：
1. **Imgur** (https://imgur.com) - 免費，無需註冊
2. **Cloudflare R2** - 需要設定，但速度快
3. **GitHub** - 可以用 repository 存圖片

**Imgur 上傳步驟**：
1. 前往 https://imgur.com
2. 點擊「New post」
3. 上傳圖片
4. 複製「Direct link」
5. 貼到 Google Sheets 的 `url` 欄位

---

### Q3: 如何備份資料？

**A**: Google Sheets 自動備份，也可以手動匯出：

**方法 1: 版本歷史**
1. 檔案 → 版本記錄 → 查看版本記錄
2. 可回溯到任何時間點

**方法 2: 下載備份**
1. 檔案 → 下載 → Microsoft Excel (.xlsx)
2. 定期備份到電腦

**方法 3: 自動備份腳本**

可以寫一個 Apps Script 定期匯出到 Google Drive：

```javascript
function autoBackup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const folder = DriveApp.getFolderById('YOUR_FOLDER_ID')

  const date = Utilities.formatDate(new Date(), 'GMT+8', 'yyyy-MM-dd')
  const fileName = `Routes_Backup_${date}`

  ss.copy(fileName)
  const file = DriveApp.getFilesByName(fileName).next()
  file.moveTo(folder)
}
```

設定觸發條件：每天自動執行。

---

### Q4: 多人同時編輯會衝突嗎？

**A**: 不會。Google Sheets 支援即時協作，多人可以同時編輯不同的儲存格。

**注意事項**：
- 避免同時編輯同一個儲存格
- 使用留言功能溝通
- 可以在編輯者姓名旁看到其他人的游標

---

### Q5: API 呼叫次數有限制嗎？

**A**: 有限制，但通常不會超過：

**Google Sheets API**：
- 免費版：每天 100 次讀取請求
- 每 100 秒 500 次請求

**解決方案**：
- ✅ Worker 快取 5 分鐘（大幅減少 API 呼叫）
- ✅ Frontend 快取 5 分鐘
- 實際 API 呼叫：每 5 分鐘 1 次

**預估使用量**：
- 每天訪客 1000 人
- 每人瀏覽 5 個頁面
- 因快取，實際 API 呼叫：約 288 次/天（遠低於限制）

---

### Q6: 如何新增新的岩場？

**A**: 在 `Crags` 工作表新增一行：

| crag_id | name | english_name | location | type | status |
|---------|------|--------------|----------|------|--------|
| guanzilin | 關子嶺 | Guanziling | 台南市白河區 | 山岳岩場 | 已發佈 |

然後在 `Routes` 工作表的 `crag_id` 欄位就可以選擇新岩場。

---

### Q7: 影片無法播放怎麼辦？

**A**: 檢查以下項目：

1. **URL 格式正確**
   - YouTube: `https://www.youtube.com/watch?v=VIDEO_ID`
   - Instagram: `https://www.instagram.com/p/POST_ID/`

2. **影片是公開的**
   - YouTube: 不能是「不公開」或「私人」
   - Instagram: 不能是私人帳號

3. **URL 沒有多餘空格**

4. **source 欄位正確**
   - YouTube 影片 → `youtube`
   - Instagram 影片 → `instagram`

---

### Q8: 可以匯入現有的路線資料嗎？

**A**: 可以！

**方法 1: CSV 匯入**
1. 準備 CSV 檔案（格式同 Google Sheets）
2. 檔案 → 匯入 → 上傳
3. 選擇「附加到目前工作表」

**方法 2: 從程式碼匯入**

如果你有現有的 JSON 或 TypeScript 資料：

```typescript
// scripts/import-to-sheets.ts
import { google } from 'googleapis'

async function importData() {
  // 讀取現有資料
  const routes = require('./existing-routes.json')

  // 轉換為 Sheets 格式
  const rows = routes.map(route => [
    route.id,
    route.cragId,
    route.name,
    route.englishName,
    // ... 其他欄位
  ])

  // 寫入 Google Sheets
  const auth = new google.auth.GoogleAuth({ /* ... */ })
  const sheets = google.sheets({ version: 'v4', auth })

  await sheets.spreadsheets.values.append({
    spreadsheetId: 'YOUR_SPREADSHEET_ID',
    range: 'Routes!A2',
    valueInputOption: 'RAW',
    requestBody: {
      values: rows
    }
  })
}
```

---

## 總結

### ✅ 完成設定後，你將擁有

1. **Google Sheets 資料庫**
   - 4 個工作表（岩場、路線、影片、圖片）
   - 資料驗證（防止錯誤）
   - 條件式格式化（視覺提示）
   - 多人即時協作

2. **Cloudflare Worker API**
   - REST API 端點
   - 自動快取（5 分鐘）
   - YouTube + Instagram 影片支援
   - CORS 支援

3. **Next.js Frontend 整合**
   - 動態讀取路線資料
   - 影片嵌入播放
   - 圖片展示

### 🎯 優勢

- ✅ **零學習成本**：所有人都會用試算表
- ✅ **即時協作**：多人同時編輯
- ✅ **完全免費**：無任何費用
- ✅ **版本控制**：自動記錄變更歷史
- ✅ **5 分鐘上線**：更新資料後快速顯示

### ⚠️ 限制

- ❌ 圖片需要外部圖床
- ❌ 資料驗證較弱（相比 CMS）
- ❌ API 有每日呼叫限制（但快取可解決）

### 📚 相關資源

- [Google Sheets API 文件](https://developers.google.com/sheets/api)
- [Cloudflare Workers 文件](https://developers.cloudflare.com/workers/)
- [Imgur API](https://apidocs.imgur.com/)

---

---

## 📝 資料轉換與匯入

### 從現有 CSV 資料轉換

本文件已根據 `/docs/route-data-refactor/` 中的 CSV 範本更新。如果你有現有的路線資料需要轉換，請參考以下文件：

1. **CSV 範本說明**: `/docs/route-data-refactor/CSV-Template-README.md`
   - 詳細說明各個 CSV 範本的結構
   - 包含真實的龍洞路線資料範例

2. **資料對應文件**: `/docs/route-data-refactor/CSV-Data-Mapping.md` ⭐ **必讀**
   - 詳細的欄位對應表
   - Python 轉換腳本範例
   - 資料驗證檢查清單

3. **多語言支援**: `/docs/route-data-refactor/CSV-Template-i18n-README.md`
   - 中英雙語欄位命名規則
   - 翻譯對照表
   - 自動翻譯工具建議

### 現有資料來源

路線資料已整理至以下目錄：

```
/docs/route-data-refactor/
├── longdong/      # 龍洞岩場 (音樂廳、校門口、大禮堂等9個區域)
├── defulan/       # 德芙蘭
├── guanziling/    # 關子嶺
├── shoushan/      # 壽山
└── kenting/       # 墾丁
```

### 批次轉換步驟

1. 參考 `CSV-Data-Mapping.md` 中的 Python 腳本
2. 轉換現有 CSV 為新範本格式
3. 驗證資料品質
4. 匯入 Google Sheets

---

## 🔄 版本更新記錄

### v2.0 - 2025-12-04
- ✅ 更新為支援中英雙語的新架構
- ✅ 調整欄位以符合 CSV 範本 (`name_en`, `area`, `area_en` 等)
- ✅ 更新 Cloudflare Worker 程式碼以支援 i18n 結構
- ✅ 新增真實的龍洞路線資料範例
- ✅ 擴展岩場清單至5個 (龍洞、關子嶺、德芙蘭、壽山、墾丁)
- ✅ 調整欄位索引以對應新的資料結構

### v1.0 - 2025-12-03
- 初始版本
- 基本 Google Sheets + Cloudflare Worker 架構

---

**文件版本**: v2.0
**最後更新**: 2025-12-04
**適用專案**: NobodyClimb 路線資訊管理
**預估設定時間**: 2-3 小時（首次設定）
**資料來源**: 基於 `/docs/route-data-refactor/` 的真實路線資料
