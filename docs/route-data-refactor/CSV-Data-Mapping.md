# 現有資料到新範本的對應關係

本文件說明如何將現有的龍洞岩場 CSV 資料轉換為新的範本格式。

## 📋 欄位對應表

### Routes 表 - 詳細對應

| 新範本欄位 | 原始CSV欄位 | 轉換規則 | 範例 |
|-----------|-----------|---------|------|
| `route_id` | 路線編號 | 去除 # 和空格，加上岩場代碼前綴 | `# 329` → `LD329` |
| `crag_id` | (固定值) | 根據檔案來源設定 | 龍洞 → `longdong` |
| `area` | 分區 | 直接使用（去除換行符） | `音樂廳\nMusic Hall` → `音樂廳` |
| `area_en` | 分區 | 提取英文部分 | `音樂廳\nMusic Hall` → `Music Hall` |
| `name` | 路線名稱 | 提取中文部分 | `肥牛\nFat Cow` → `肥牛` |
| `english_name` | 路線名稱 | 提取英文部分 | `肥牛\nFat Cow` → `Fat Cow` |
| `grade` | 難度 | 直接使用 | `5.11c` |
| `length` | 高度 | 去除空格 | `10 m` → `10m` |
| `type` | 路線種類 | 轉換為中文標準格式 | `傳攀 \| Trad` → `傳統攀登` |
| `type_en` | 路線種類 | 轉換為英文標準格式 | `傳攀 \| Trad` → `Traditional Climbing` |
| `first_ascent` | 首攀 | 直接使用（去除換行符） | `吳招坤\nJau-Kuen Wu` → `吳招坤` |
| `first_ascent_date` | 首攀日期 | 轉換為 YYYY-MM-DD 格式 | `1988 / 07` → `1988-07-01` |
| `description` | 路線資訊描述 | 直接使用（去除 `–`）| `可步行下撤` |
| `description_en` | - | 需要翻譯 | (待填寫) |
| `protection` | B01-B18, A01-A02 | 彙總為文字描述 | `固定保護點，共8個316-TW Bolt` |
| `protection_en` | - | 需要翻譯 | `Fixed protection, 8 316-TW bolts` |
| `tips` | - | 從描述中提取建議部分 | - |
| `tips_en` | - | 需要翻譯 | - |
| `safety_rating` | 安全評級 | 直接使用 | `●●●` |
| `popularity` | - | 預設為空或設定初始值 | - |
| `views` | - | 預設為0 | `0` |
| `status` | 路線狀態 | 轉換狀態值 | `已拉測` → `已發佈` |
| `created_by` | - | 預設為空 | - |
| `created_date` | 日期 | 使用最早的日期 | - |
| `updated_date` | 日期 | 使用最新的日期 | - |

## 🔄 路線種類轉換對照

| 原始格式 | type (中文) | type_en (英文) |
|---------|-----------|---------------|
| `運攀 \| Sport` | 運動攀登 | Sport Climbing |
| `傳攀 \| Trad` | 傳統攀登 | Traditional Climbing |
| `上方架繩 \| Toprope` | 上方架繩 | Top Rope |
| `抱石 \| Boulder` | 抱石 | Bouldering |
| `混合` | 混合 | Mixed |

## 🔄 路線狀態轉換

| 原始狀態 | 新狀態 |
|---------|-------|
| `已拉測` | 已發佈 |
| `待拉測` | 待審核 |
| `已更新` | 已發佈 |
| (空白) | 草稿 |

## 📝 Protection 欄位生成規則

從 B01-B18 和 A01-A02 欄位統計生成：

### 範例 1: 運動攀登路線
**原始資料**:
- B01: 316-TW
- B02: 316-TW
- B03: 316-TW
- A01: 316-TW
- A02: 316-TW
- Bolt統計: 5

**生成的 protection**:
```
固定保護點，共5個316-TW Bolt
```

**生成的 protection_en**:
```
Fixed protection, 5 316-TW bolts total
```

### 範例 2: 傳統攀登路線（共用 Anchor）
**原始資料**:
- A01: 共用
- A02: 共用
- 路線資訊描述: 與 <龍脊中路> 共用 Anchor

**生成的 protection**:
```
與龍脊中路共用 Anchor
```

**生成的 protection_en**:
```
Shares anchor with Dragon Ridge Center
```

### 範例 3: 傳統攀登路線（無固定保護點）
**原始資料**:
- Bolt統計: 0
- 路線資訊描述: 需自行架設確保站

**生成的 protection**:
```
需自備傳統保護裝備，自行架設確保站
```

**生成的 protection_en**:
```
Requires traditional protection gear, set up own anchor
```

## 📝 Description 和 Tips 欄位拆分

### 原則
- **description**: 路線的基本描述、特色、歷史
- **tips**: 攀登建議、注意事項、下撤方式

### 範例處理

**原始資料** (路線資訊描述):
```
原為上方架繩路線，2012更新為運動攀登路線
–
2012/07/18 - 全線更新 (章醫師、小翔、Daco)
```

**拆分後**:
- **description**: `原為上方架繩路線，2012更新為運動攀登路線`
- **tips**: (留空)
- **備註**: 更新資訊放入內部備註欄位

---

**原始資料**:
```
可步行下撤
```

**拆分後**:
- **description**: (留空)
- **tips**: `可步行下撤`

---

**原始資料**:
```
岩質極差，有鬆動岩塊與草坡，不易架設支點。強烈建議配戴岩盔。
–
無 Anchor
```

**拆分後**:
- **description**: `岩質極差，有鬆動岩塊與草坡，不易架設支點`
- **tips**: `強烈建議配戴岩盔`
- **protection**: `無固定保護點，無 Anchor`

## 🏔️ Crag 資料來源

從各 CSV 檔案的標題行提取：

### 範例: 音樂廳.csv
**標題行**:
```csv
"  音樂廳
  Music Hall",153,支 Bolt,103,條攀登路線
```

**提取資訊**:
- 分區名稱（中文）: 音樂廳
- 分區名稱（英文）: Music Hall
- Bolt 總數: 153
- 路線總數: 103

### Crags 表生成

只需要一筆龍洞岩場的資料：

| 欄位 | 值 | 來源 |
|-----|---|------|
| crag_id | longdong | 固定值 |
| name | 龍洞 | 固定值 |
| name_en | Long Dong | 固定值 |
| location | 新北市貢寮區 | 固定值 |
| routes_count | 500+ | 統計所有分區 |
| difficulty_range | 5.6 - 5.14a | 從所有路線統計 |

## 🎬 Videos 和 Images 資料

目前原始 CSV 沒有影片和圖片資料，需要：

1. **手動收集**
   - 從 YouTube 搜尋龍洞攀岩影片
   - 從 Instagram 搜尋相關貼文
   - 記錄影片/圖片URL

2. **資料格式**
   ```csv
   video_id,route_id,order,source,url,title,title_en
   V001,LD367,1,youtube,https://youtube.com/watch?v=...,Fucking Fall攀登影片,Fucking Fall Climbing Video
   ```

## 🔧 轉換腳本建議

### Python 轉換腳本架構

```python
import csv
import re
from datetime import datetime

def parse_route_name(name_field):
    """
    分離中英文路線名稱
    輸入: "肥牛\nFat Cow"
    輸出: ("肥牛", "Fat Cow")
    """
    parts = name_field.strip().split('\n')
    zh = parts[0].strip()
    en = parts[1].strip() if len(parts) > 1 else ''
    return zh, en

def convert_route_type(type_field):
    """
    轉換路線類型
    輸入: "傳攀 | Trad"
    輸出: ("傳統攀登", "Traditional Climbing")
    """
    mapping = {
        '運攀': ('運動攀登', 'Sport Climbing'),
        '傳攀': ('傳統攀登', 'Traditional Climbing'),
        '上方架繩': ('上方架繩', 'Top Rope'),
        '抱石': ('抱石', 'Bouldering'),
    }

    for key, value in mapping.items():
        if key in type_field:
            return value
    return ('', '')

def count_bolts(row):
    """
    統計 Bolt 數量
    檢查 B01-B18 和 A01-A02 欄位
    """
    bolt_count = 0
    bolt_type = None

    # B01 在第11欄，A01 在第29欄
    for i in range(10, 28):  # B01-B18
        if row[i] and row[i] != '共用' and 'Bolt' not in row[i]:
            bolt_count += 1
            if not bolt_type:
                bolt_type = row[i]

    return bolt_count, bolt_type

def convert_csv(input_file, output_file, crag_id, area_name):
    """
    轉換單個 CSV 檔案
    """
    with open(input_file, 'r', encoding='utf-8') as infile:
        reader = csv.reader(infile)

        # 跳過標題行
        next(reader)
        next(reader)

        routes = []

        for row in reader:
            if not row[1]:  # 路線編號為空，跳過
                continue

            # 提取路線編號
            route_num = row[1].replace('#', '').strip()
            route_id = f"{crag_id.upper()}{route_num}"

            # 分離名稱
            name_zh, name_en = parse_route_name(row[2])

            # 轉換類型
            type_zh, type_en = convert_route_type(row[4])

            # 統計 Bolt
            bolt_count, bolt_type = count_bolts(row)

            if bolt_count > 0:
                protection = f"固定保護點，共{bolt_count}個{bolt_type} Bolt"
                protection_en = f"Fixed protection, {bolt_count} {bolt_type} bolts total"
            elif '共用' in str(row):
                protection = row[8]  # 使用描述欄位
                protection_en = ""
            else:
                protection = "需自備傳統保護裝備"
                protection_en = "Requires traditional protection gear"

            route = {
                'route_id': route_id,
                'crag_id': crag_id,
                'area': area_name.split('\n')[0],
                'area_en': area_name.split('\n')[1] if '\n' in area_name else '',
                'name': name_zh,
                'english_name': name_en,
                'grade': row[3],
                'length': row[5].replace(' ', ''),
                'type': type_zh,
                'type_en': type_en,
                'first_ascent': parse_route_name(row[6])[0] if row[6] else '',
                'first_ascent_date': row[7] if row[7] else '',
                'description': row[8].split('–')[0].strip() if row[8] else '',
                'description_en': '',
                'protection': protection,
                'protection_en': protection_en,
                'tips': '',
                'tips_en': '',
                'safety_rating': row[9],
                'popularity': '',
                'views': '',
                'status': '已發佈' if row[34] == '已拉測' else '待審核',
                'created_by': '',
                'created_date': '',
                'updated_date': row[35] if len(row) > 35 else '',
            }

            routes.append(route)

    # 寫入新 CSV
    with open(output_file, 'w', encoding='utf-8', newline='') as outfile:
        fieldnames = list(routes[0].keys())
        writer = csv.DictWriter(outfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(routes)

# 使用範例
convert_csv(
    'longdong/龍洞岩場攀登路線資料庫 - 音樂廳.csv',
    'CSV-Template-Routes-MusicHall.csv',
    'longdong',
    '音樂廳\nMusic Hall'
)
```

## 📊 預期輸出統計

轉換完成後預期的資料量：

| 分區 | 路線數 | 範例 route_id |
|-----|-------|--------------|
| 音樂廳 | 103 | LD329-LD431 |
| 校門口 | 51 | LD521-LD571 |
| 大禮堂 | 43 | LD303-LD345 |
| 第一洞 | ? | LD001-LD099 |
| 第二洞 | ? | LD101-LD199 |
| 其他區域 | ? | - |

**總計**: 約 500+ 條路線

## ✅ 資料驗證檢查清單

轉換後必須檢查：

- [ ] 所有 route_id 唯一且格式正確
- [ ] name 和 english_name 都有值
- [ ] grade 格式符合 YDS 標準
- [ ] type 只包含標準類型
- [ ] protection 描述清楚
- [ ] 沒有遺失必填欄位
- [ ] 日期格式統一為 YYYY-MM-DD
- [ ] 狀態欄位只包含四種標準狀態

---

**文件版本**: v1.0
**建立日期**: 2025-12-04
**維護者**: NobodyClimb Team
