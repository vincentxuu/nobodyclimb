# CSV 範本說明文件

本資料夾包含 NobodyClimb 路線資料庫的 CSV 範本，基於現有龍洞岩場路線資料設計。

## 📋 範本檔案

### 1. CSV-Template-Crags.csv (岩場資訊)
**用途**: 儲存所有岩場的基本資訊

**範例資料**: 包含龍洞岩場的基本資訊（使用真實資料）

**欄位說明**:
- `crag_id`: 岩場唯一識別碼（longdong）
- `name`: 岩場中文名稱（龍洞）
- `name_en`: 岩場英文名稱（Long Dong）
- `location`: 岩場地理位置（新北市貢寮區）
- `location_en`: 英文地理位置
- `description`: 岩場描述（待填寫）
- `description_en`: 英文描述（待填寫）
- `type`: 岩場類型（待填寫，如：海蝕岩場）
- `type_en`: 岩場類型英文（待填寫，如：Sea Cliff）
- `rock_type`: 岩石類型（待填寫）
- `rock_type_en`: 岩石類型英文（待填寫）
- `routes_count`: 路線總數（約500條）
- `difficulty_range`: 難度範圍（5.6 - 5.14a）
- `height_range`: 高度範圍（5-30m）
- `latitude`: 緯度（25.1078）
- `longitude`: 經度（121.9188）
- `status`: 狀態（已發佈）

---

### 2. CSV-Template-Routes.csv (路線資訊)
**用途**: 儲存所有攀登路線的詳細資訊

**範例資料**: 包含8條真實的龍洞路線

| route_id | 路線名稱 | 英文名稱 | 難度 | 區域 | 類型 |
|----------|---------|---------|------|------|------|
| LD329 | 肥牛 | Fat Cow | 5.6 | 音樂廳 | 傳統攀登 |
| LD330 | 瘦馬 | Skinny Horse | 5.9 | 音樂廳 | 傳統攀登 |
| LD338 | 直接嘗試 | Direct Attempt | 5.11d | 音樂廳 | 運動攀登 |
| LD367 | Fucking Fall | Fucking Fall | 5.11a | 音樂廳 | 運動攀登 |
| LD523 | V槽 | V-Groove | 5.10b | 校門口 | 運動攀登 |
| LD525 | 無名小卒 | Nowhere Man | 5.12a | 校門口 | 運動攀登 |
| LD526 | 水虎魚 | Piranha | 5.11c | 校門口 | 運動攀登 |
| LD305 | 龍脊中路 | Dragon Ridge Center | 5.5 | 大禮堂 | 傳統攀登 |

**欄位說明**:
- `route_id`: 路線唯一識別碼（格式：LD + 路線編號）
- `crag_id`: 所屬岩場ID（longdong）
- `area`: 路線所在區域（音樂廳、校門口、大禮堂等）
- `area_en`: 區域英文名稱（Music Hall, School Gate等）
- `name`: 路線中文名稱
- `english_name`: 路線英文名稱
- `grade`: 難度等級（YDS系統）
- `length`: 路線長度（如：25m）
- `type`: 攀登類型（運動攀登、傳統攀登）
- `type_en`: 攀登類型英文（Sport Climbing, Traditional Climbing）
- `first_ascent`: 首登者姓名
- `first_ascent_date`: 首登日期（格式：YYYY-MM-DD）
- `description`: 路線描述
- `description_en`: 英文描述（待填寫）
- `protection`: 保護裝備資訊
- `protection_en`: 保護裝備英文描述（待填寫）
- `tips`: 攀登攻略和建議
- `tips_en`: 攀登攻略英文（待填寫）
- `safety_rating`: 安全評級（●●●）
- `popularity`: 人氣值（待填寫）
- `views`: 瀏覽次數（待填寫）
- `status`: 狀態（已發佈）
- `created_by`: 建立者Email（待填寫）
- `created_date`: 建立日期（待填寫）
- `updated_date`: 最後更新日期（待填寫）

---

### 3. CSV-Template-RouteVideos.csv (路線影片)
**用途**: 儲存每條路線相關的攀登影片

**範例資料**: 僅包含欄位標題（待收集真實影片資料）

**欄位說明**:
- `video_id`: 影片唯一識別碼（如：V001）
- `route_id`: 所屬路線ID（必須對應 Routes 資料表）
- `order`: 影片排序（1, 2, 3...）
- `source`: 影片來源（youtube 或 instagram）
- `url`: 影片完整網址
- `title`: 影片標題
- `title_en`: 影片英文標題（待填寫）
- `description`: 影片描述
- `description_en`: 影片英文描述（待填寫）
- `author`: 上傳者/作者
- `upload_date`: 上傳日期
- `duration_sec`: 影片長度（秒）
- `status`: 狀態（草稿、已發佈、已下架）

**資料收集方式**:
1. 從 YouTube 搜尋「龍洞攀岩」、路線名稱等關鍵字
2. 從 Instagram 搜尋 #龍洞 #longdong #climbing 等標籤
3. 記錄影片URL、標題、作者等資訊

---

### 4. CSV-Template-RouteImages.csv (路線圖片)
**用途**: 儲存每條路線的相關圖片

**範例資料**: 僅包含欄位標題（待收集真實圖片資料）

**欄位說明**:
- `image_id`: 圖片唯一識別碼（如：IMG001）
- `route_id`: 所屬路線ID（必須對應 Routes 資料表）
- `order`: 圖片排序（1, 2, 3...）
- `url`: 圖片網址（需上傳至圖床如Imgur）
- `caption`: 圖片說明文字
- `caption_en`: 圖片英文說明（待填寫）
- `uploaded_by`: 上傳者Email
- `uploaded_date`: 上傳日期
- `status`: 狀態（草稿、已發佈、已下架）

**圖片上傳建議**:
- 使用 Imgur (https://imgur.com) - 免費且穩定
- 或使用 Cloudflare R2 - 速度更快但需設定

---

### 5. CSV-Data-Mapping.md (資料對應文件) ⭐ 重要
**用途**: 詳細說明如何從現有龍洞岩場 CSV 轉換為新範本格式

**內容包括**:
- 欄位對應表（原始欄位 → 新範本欄位）
- 路線種類轉換對照
- Protection 欄位生成規則
- Description 和 Tips 欄位拆分邏輯
- Python 轉換腳本範例
- 資料驗證檢查清單

**這是最重要的文件**，詳細說明了如何批次轉換現有資料！

---

## 🔄 從現有資料轉換

### 快速開始

1. **閱讀對應文件**
   ```bash
   cat CSV-Data-Mapping.md
   ```

2. **手動轉換少量資料**（測試用）
   - 開啟現有 CSV：`龍洞岩場攀登路線資料庫 - 音樂廳.csv`
   - 參考 `CSV-Data-Mapping.md` 的對應規則
   - 手動填入 `CSV-Template-Routes.csv`

3. **使用腳本批次轉換**（推薦）
   - 參考 `CSV-Data-Mapping.md` 中的 Python 腳本
   - 修改腳本以符合實際需求
   - 執行轉換並驗證結果

### 轉換注意事項

1. **路線編號格式化**
   - 原始: `# 329`
   - 轉換後: `LD329`

2. **路線名稱分離**
   - 原始: `肥牛\nFat Cow`
   - 分離為: name=`肥牛`, english_name=`Fat Cow`

3. **路線種類標準化**
   - `運攀 | Sport` → type=`運動攀登`, type_en=`Sport Climbing`
   - `傳攀 | Trad` → type=`傳統攀登`, type_en=`Traditional Climbing`

4. **Bolt資料簡化**
   - 從 B01-B18 統計數量和類型
   - 生成文字描述：`固定保護點，共8個316-TW Bolt`

---

## 📤 匯入 Google Sheets 步驟

### 步驟 1: 建立試算表
1. 前往 [Google Sheets](https://sheets.google.com)
2. 建立新試算表：「NobodyClimb 路線資料庫」
3. 建立 4 個工作表：`Crags`, `Routes`, `RouteVideos`, `RouteImages`

### 步驟 2: 匯入 CSV 檔案
1. 開啟 `Crags` 工作表
2. 檔案 → 匯入 → 上傳 → 選擇 `CSV-Template-Crags.csv`
3. 匯入位置：「取代目前工作表」
4. 重複以上步驟匯入其他 3 個 CSV

### 步驟 3: 設定資料驗證（參考 Google Sheets 實作指南）
- 為 `grade`, `type`, `status` 等欄位設定下拉選單
- 設定 `crag_id`, `route_id` 的關聯驗證

---

## ✅ 資料品質檢查

### 必填欄位檢查

**Crags 表**:
- [x] crag_id
- [x] name
- [x] name_en
- [x] location
- [ ] description（待填寫）
- [ ] type（待填寫）

**Routes 表**:
- [x] route_id
- [x] crag_id
- [x] area
- [x] name
- [x] english_name
- [x] grade
- [x] type
- [ ] description（部分待填寫）
- [ ] description_en（待翻譯）
- [ ] protection_en（待翻譯）

### 資料驗證規則

1. **route_id 格式**: `^LD\d{3,4}$`
2. **grade 格式**: `^5\.[0-9]{1,2}[a-d+]?$`
3. **type**: 只能是「運動攀登」「傳統攀登」「抱石」「上方架繩」「混合」
4. **status**: 只能是「草稿」「待審核」「已發佈」「已下架」

---

## 🎯 待完成事項

### 高優先級
- [ ] 完成所有龍洞路線資料轉換（約500條）
- [ ] 填寫 Crags 的 description, type, rock_type 欄位
- [ ] 收集並新增路線影片資料
- [ ] 收集並新增路線圖片資料

### 中優先級
- [ ] 翻譯所有 description 為英文
- [ ] 翻譯所有 protection 為英文
- [ ] 翻譯所有 tips 為英文
- [ ] 填寫 popularity, views 等統計資料

### 低優先級
- [ ] 新增其他岩場資料（關子嶺、德芙蘭等）
- [ ] 補充首登者和首登日期資訊
- [ ] 優化路線描述內容

---

## 📚 相關文件

- **資料對應文件**: `CSV-Data-Mapping.md` ⭐ **必讀**
- **多語言支援**: `CSV-Template-i18n-README.md`
- **Google Sheets 實作指南**: `/docs/route-data/google-sheets-implementation.md`
- **需求文件**: `/docs/route-data-refactor/demand.md`
- **現有路線資料**: `/docs/route-data-refactor/longdong/*.csv`

---

## 🚀 下一步

1. **批次轉換現有資料**
   - 使用 `CSV-Data-Mapping.md` 中的腳本
   - 轉換所有龍洞岩場分區資料
   - 驗證轉換結果

2. **收集多媒體資料**
   - 搜尋並收集路線影片
   - 拍攝或收集路線圖片
   - 上傳圖片至 Imgur

3. **翻譯英文內容**
   - 翻譯路線描述
   - 翻譯保護裝備資訊
   - 翻譯攀登建議

4. **匯入 Google Sheets**
   - 建立試算表並匯入資料
   - 設定資料驗證規則
   - 分享給團隊成員編輯

5. **整合 API**
   - 參考 Google Sheets 實作指南
   - 建立 Cloudflare Worker
   - 實作 REST API

---

**文件版本**: v2.0
**建立日期**: 2025-12-04
**最後更新**: 2025-12-04
**維護者**: NobodyClimb Team

**重要提醒**: 所有範例資料均來自現有龍洞岩場資料庫，為真實資料。
