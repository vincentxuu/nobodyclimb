# Mellow Climbing YouTube Channel Information

## Channel Overview
- **Channel Name**: Mellow Climbing
- **Channel URL**: https://www.youtube.com/@mellowclimbing
- **Channel Description**: [需要手動更新]
- **Subscriber Count**: [需要手動更新]
- **Total Videos**: [需要手動更新]
- **Channel Created Date**: [需要手動更新]

## Channel Statistics
- **Total Views**: [需要手動更新]
- **Average Views per Video**: [需要手動更新]
- **Upload Frequency**: [需要手動更新]

## Video List

### 收集方法
由於 YouTube 使用動態載入內容，需要使用以下方法之一來收集影片資訊：

1. **手動收集**：直接訪問頻道頁面，手動複製影片資訊
2. **YouTube Data API**：使用 Google YouTube Data API v3
3. **第三方工具**：使用 YouTube 資料擷取工具
4. **yt-dlp 自動化收集**：使用 yt-dlp 工具自動收集並轉換（推薦）

### 方案四：使用 yt-dlp 自動化收集（推薦）

#### 通用版本 - 適用於任何 YouTube 頻道
我們提供了通用的自動化腳本，可以收集任何 YouTube 頻道的資料：

```bash
# 通用腳本語法
./scripts/collect-youtube-data.sh <頻道URL> <輸出名稱> [頻道名稱] [頻道ID] [頻道類型] [精選閾值]

# 範例：收集 Mellow Climbing 頻道
./scripts/collect-youtube-data.sh "https://www.youtube.com/@mellowclimbing" "mellow"

# 範例：收集 Petzl 頻道並自定義設定
./scripts/collect-youtube-data.sh "https://www.youtube.com/@PetzlSportVideos" "petzl" "Petzl Sport Videos" "@PetzlSportVideos" "climbing" "10000"

# 範例：收集技術頻道
./scripts/collect-youtube-data.sh "https://www.youtube.com/@TechChannel" "tech" "Tech Channel" "@TechChannel" "tech"
```

#### 腳本功能
這個通用腳本會：
1. 自動從任何 YouTube 頻道收集影片資料
2. 智能推導頻道名稱和 ID（如果未提供）
3. 根據頻道類型進行智能分類（攀岩、技術、通用等）
4. 可自定義精選影片的觀看次數閾值
5. 生成對應的 TypeScript 檔案
6. 提供詳細的執行報告和統計資訊

#### 支援的頻道類型
- `climbing`: 攀岩頻道（預設），包含戶外攀岩、室內攀岩、競技攀岩、裝備評測等分類
- `tech`: 技術頻道，包含教學、評測、新聞等分類
- `general`: 通用頻道，使用基本分類邏輯

#### 詳細步驟說明

##### 1. 前置準備
確保已安裝必要工具：
```bash
# 檢查 yt-dlp
which yt-dlp

# 如果未安裝，使用以下命令安裝：
brew install yt-dlp
# 或
pip install yt-dlp
```

##### 2. 執行收集腳本
```bash
# 賦予執行權限（第一次執行需要）
chmod +x scripts/collect-youtube-data.sh

# 基本用法：只需要 URL 和輸出名稱
./scripts/collect-youtube-data.sh "https://www.youtube.com/@channelname" "output_name"

# 完整用法：指定所有參數
./scripts/collect-youtube-data.sh "URL" "名稱" "顯示名稱" "@channelid" "類型" "閾值"
```

##### 2.1 具體範例
```bash
# 收集 Mellow Climbing（最簡單）
./scripts/collect-youtube-data.sh "https://www.youtube.com/@mellowclimbing" "mellow"

# 收集 Petzl（完整參數）
./scripts/collect-youtube-data.sh "https://www.youtube.com/@PetzlSportVideos" "petzl" "Petzl Sport Videos" "@PetzlSportVideos" "climbing" "10000"

# 收集其他攀岩頻道
./scripts/collect-youtube-data.sh "https://www.youtube.com/@AlexHonnold" "honnold" "Alex Honnold" "@AlexHonnold" "climbing"
```

##### 3. 腳本執行流程
腳本會自動執行以下步驟：

1. **檢查環境**：確認 yt-dlp 和 Node.js 已安裝
2. **收集資料**：使用 yt-dlp 從 YouTube 獲取影片資訊
3. **資料轉換**：調用 `convert-mellow-videos.js` 轉換資料格式
4. **檔案生成**：生成專案所需的 TypeScript 檔案
5. **清理整理**：清理暫存檔案，保留備份

##### 4. 輸出檔案
執行完成後會產生：
- `{輸出名稱}_videos.json`：原始 JSON 資料（備份用）
- `src/lib/constants/{輸出名稱}_videos.ts`：轉換後的 TypeScript 影片資料

例如，執行 `./scripts/collect-youtube-data.sh "..." "mellow"` 會產生：
- `mellow_videos.json`
- `src/lib/constants/mellow_videos.ts`

### 影片清單模板

請按以下格式填寫影片資訊：

| # | 影片標題 | URL | 觀看次數 | 上傳日期 | 影片長度 | 備註 |
|---|---------|-----|----------|----------|----------|------|
| 1 | [影片標題] | [影片連結] | [觀看次數] | [日期] | [時長] | [備註] |
| 2 | [影片標題] | [影片連結] | [觀看次數] | [日期] | [時長] | [備註] |
| 3 | [影片標題] | [影片連結] | [觀看次數] | [日期] | [時長] | [備註] |

### 最新影片（範例格式）

#### 影片 1
- **標題**: [影片標題]
- **URL**: https://www.youtube.com/watch?v=[VIDEO_ID]
- **觀看次數**: [數字]
- **上傳日期**: [YYYY-MM-DD]
- **影片長度**: [HH:MM:SS]
- **簡介**: [影片簡短描述]

#### 影片 2
- **標題**: [影片標題]
- **URL**: https://www.youtube.com/watch?v=[VIDEO_ID]
- **觀看次數**: [數字]
- **上傳日期**: [YYYY-MM-DD]
- **影片長度**: [HH:MM:SS]
- **簡介**: [影片簡短描述]

## 熱門影片 (按觀看次數排序)

1. [影片標題] - [觀看次數] views
2. [影片標題] - [觀看次數] views
3. [影片標題] - [觀看次數] views
4. [影片標題] - [觀看次數] views
5. [影片標題] - [觀看次數] views

## 播放清單

| 播放清單名稱 | 影片數量 | 建立日期 | URL |
|-------------|---------|----------|-----|
| [清單名稱] | [數量] | [日期] | [連結] |

## 資料收集實施方案

### 方案一：使用 YouTube Data API v3

#### 任務清單
- [ ] 1. 申請 Google Cloud Platform 帳號
- [ ] 2. 建立新專案並啟用 YouTube Data API v3
- [ ] 3. 產生 API 金鑰
- [ ] 4. 安裝 Python 相依套件
- [ ] 5. 執行資料收集腳本
- [ ] 6. 格式化並儲存資料

#### 詳細步驟

##### Step 1: 設置 API 環境
1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立新專案或選擇現有專案
3. 在 API 庫中搜尋並啟用 "YouTube Data API v3"
4. 建立憑證 > API 金鑰
5. 複製 API 金鑰備用

##### Step 2: 安裝 Python 套件
```bash
pip install google-api-python-client pandas
```

##### Step 3: 完整的資料收集腳本
```python
import googleapiclient.discovery
import pandas as pd
import json
from datetime import datetime

# 設定 API 金鑰
API_KEY = "YOUR_API_KEY_HERE"
CHANNEL_URL = "https://www.youtube.com/@mellowclimbing"

def get_channel_id_from_username(youtube, username):
    """從用戶名獲取頻道 ID"""
    request = youtube.channels().list(
        part="id",
        forUsername=username.replace("@", "")
    )
    response = request.execute()
    
    if response.get("items"):
        return response["items"][0]["id"]
    
    # 如果 forUsername 找不到，使用 search
    request = youtube.search().list(
        part="snippet",
        q=username,
        type="channel",
        maxResults=1
    )
    response = request.execute()
    
    if response.get("items"):
        return response["items"][0]["snippet"]["channelId"]
    
    return None

def get_channel_info(youtube, channel_id):
    """獲取頻道詳細資訊"""
    request = youtube.channels().list(
        part="snippet,statistics,contentDetails",
        id=channel_id
    )
    response = request.execute()
    
    if response.get("items"):
        channel = response["items"][0]
        return {
            "title": channel["snippet"]["title"],
            "description": channel["snippet"]["description"],
            "published_at": channel["snippet"]["publishedAt"],
            "subscriber_count": channel["statistics"]["subscriberCount"],
            "view_count": channel["statistics"]["viewCount"],
            "video_count": channel["statistics"]["videoCount"],
            "uploads_playlist_id": channel["contentDetails"]["relatedPlaylists"]["uploads"]
        }
    return None

def get_all_videos(youtube, playlist_id):
    """獲取播放清單中的所有影片"""
    videos = []
    next_page_token = None
    
    while True:
        request = youtube.playlistItems().list(
            part="snippet,contentDetails",
            playlistId=playlist_id,
            maxResults=50,
            pageToken=next_page_token
        )
        response = request.execute()
        
        for item in response.get("items", []):
            video_id = item["contentDetails"]["videoId"]
            videos.append({
                "video_id": video_id,
                "title": item["snippet"]["title"],
                "published_at": item["snippet"]["publishedAt"],
                "description": item["snippet"]["description"][:200]  # 截取前200字
            })
        
        next_page_token = response.get("nextPageToken")
        if not next_page_token:
            break
    
    return videos

def get_video_details(youtube, video_ids):
    """批量獲取影片詳細資訊"""
    video_details = []
    
    # YouTube API 一次最多處理 50 個影片
    for i in range(0, len(video_ids), 50):
        batch_ids = video_ids[i:i+50]
        request = youtube.videos().list(
            part="statistics,contentDetails",
            id=",".join(batch_ids)
        )
        response = request.execute()
        
        for item in response.get("items", []):
            video_details.append({
                "video_id": item["id"],
                "view_count": item["statistics"].get("viewCount", "0"),
                "like_count": item["statistics"].get("likeCount", "0"),
                "comment_count": item["statistics"].get("commentCount", "0"),
                "duration": item["contentDetails"]["duration"]
            })
    
    return video_details

def main():
    # 初始化 YouTube API
    youtube = googleapiclient.discovery.build("youtube", "v3", developerKey=API_KEY)
    
    # 獲取頻道 ID
    channel_id = "UCXRlFaithPvjCfBQAFweDBQ"  # Mellow Climbing 的頻道 ID
    
    print("正在獲取頻道資訊...")
    channel_info = get_channel_info(youtube, channel_id)
    
    if not channel_info:
        print("無法獲取頻道資訊")
        return
    
    print(f"頻道名稱: {channel_info['title']}")
    print(f"訂閱數: {channel_info['subscriber_count']}")
    print(f"總觀看次數: {channel_info['view_count']}")
    print(f"影片數量: {channel_info['video_count']}")
    
    # 獲取所有影片
    print("\n正在獲取影片列表...")
    videos = get_all_videos(youtube, channel_info["uploads_playlist_id"])
    
    # 獲取影片詳細資訊
    print("正在獲取影片詳細資訊...")
    video_ids = [v["video_id"] for v in videos]
    video_details = get_video_details(youtube, video_ids)
    
    # 合併資料
    video_dict = {v["video_id"]: v for v in video_details}
    for video in videos:
        if video["video_id"] in video_dict:
            video.update(video_dict[video["video_id"]])
    
    # 儲存為 JSON
    output_data = {
        "channel_info": channel_info,
        "videos": videos,
        "collected_at": datetime.now().isoformat()
    }
    
    with open("mellow_climbing_data.json", "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
    
    # 儲存為 CSV
    df = pd.DataFrame(videos)
    df.to_csv("mellow_climbing_videos.csv", index=False, encoding="utf-8")
    
    print(f"\n資料收集完成！共收集 {len(videos)} 部影片")
    print("資料已儲存至:")
    print("- mellow_climbing_data.json")
    print("- mellow_climbing_videos.csv")

if __name__ == "__main__":
    main()
```

### 方案二：使用 yt-dlp 工具

#### 任務清單
- [ ] 1. 安裝 yt-dlp
- [ ] 2. 執行命令獲取頻道資訊
- [ ] 3. 獲取所有影片的詳細資料
- [ ] 4. 解析 JSON 資料
- [ ] 5. 格式化並產生報告

#### 詳細步驟

##### Step 1: 安裝 yt-dlp
```bash
# macOS (使用 Homebrew)
brew install yt-dlp

# 或使用 pip
pip install yt-dlp

# Windows (使用 pip)
pip install yt-dlp
```

##### Step 2: 獲取頻道所有影片資訊
```bash
# 獲取頻道資訊和影片列表（JSON 格式）
yt-dlp --dump-json --flat-playlist "https://www.youtube.com/@mellowclimbing/videos" > mellow_videos_flat.json

# 獲取每個影片的詳細資訊（包含觀看次數、時長等）
yt-dlp --dump-json "https://www.youtube.com/@mellowclimbing/videos" > mellow_videos_detailed.json
```

##### Step 3: Python 腳本解析資料
```python
import json
import pandas as pd
from datetime import datetime

def parse_yt_dlp_data(json_file):
    """解析 yt-dlp 產生的 JSON 資料"""
    videos = []
    
    with open(json_file, 'r', encoding='utf-8') as f:
        for line in f:
            try:
                video = json.loads(line)
                videos.append({
                    'title': video.get('title', ''),
                    'url': video.get('url', '') or f"https://www.youtube.com/watch?v={video.get('id', '')}",
                    'video_id': video.get('id', ''),
                    'view_count': video.get('view_count', 0),
                    'like_count': video.get('like_count', 0),
                    'duration': video.get('duration', 0),
                    'upload_date': video.get('upload_date', ''),
                    'description': video.get('description', '')[:200],
                    'channel': video.get('channel', ''),
                    'channel_id': video.get('channel_id', ''),
                    'subscriber_count': video.get('channel_follower_count', 0)
                })
            except json.JSONDecodeError:
                continue
    
    return videos

def generate_markdown_report(videos, output_file):
    """生成 Markdown 格式的報告"""
    if not videos:
        print("沒有找到影片資料")
        return
    
    # 計算統計資料
    total_views = sum(v['view_count'] for v in videos if v['view_count'])
    avg_views = total_views / len(videos) if videos else 0
    
    # 找出最熱門的影片
    top_videos = sorted(videos, key=lambda x: x['view_count'] or 0, reverse=True)[:10]
    
    # 生成 Markdown
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(f"# Mellow Climbing YouTube 頻道資料報告\n\n")
        f.write(f"生成時間: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        
        f.write(f"## 頻道統計\n\n")
        f.write(f"- 頻道名稱: {videos[0]['channel'] if videos else 'N/A'}\n")
        f.write(f"- 總影片數: {len(videos)}\n")
        f.write(f"- 總觀看次數: {total_views:,}\n")
        f.write(f"- 平均觀看次數: {avg_views:,.0f}\n\n")
        
        f.write(f"## Top 10 熱門影片\n\n")
        f.write("| 排名 | 標題 | 觀看次數 | 上傳日期 | 連結 |\n")
        f.write("|------|------|----------|----------|------|\n")
        
        for i, video in enumerate(top_videos, 1):
            title = video['title'][:50] + '...' if len(video['title']) > 50 else video['title']
            upload_date = video['upload_date']
            if upload_date and len(upload_date) == 8:
                upload_date = f"{upload_date[:4]}-{upload_date[4:6]}-{upload_date[6:]}"
            
            f.write(f"| {i} | {title} | {video['view_count']:,} | {upload_date} | [觀看]({video['url']}) |\n")
        
        f.write(f"\n## 所有影片列表\n\n")
        f.write("| # | 標題 | 觀看次數 | 上傳日期 | 時長(秒) | 連結 |\n")
        f.write("|---|------|----------|----------|----------|------|\n")
        
        for i, video in enumerate(videos, 1):
            title = video['title'][:40] + '...' if len(video['title']) > 40 else video['title']
            upload_date = video['upload_date']
            if upload_date and len(upload_date) == 8:
                upload_date = f"{upload_date[:4]}-{upload_date[4:6]}-{upload_date[6:]}"
            
            f.write(f"| {i} | {title} | {video['view_count']:,} | {upload_date} | {video['duration']} | [觀看]({video['url']}) |\n")
    
    print(f"報告已生成: {output_file}")

def main():
    # 解析 JSON 資料
    videos = parse_yt_dlp_data('mellow_videos_detailed.json')
    
    # 生成報告
    generate_markdown_report(videos, 'mellow_climbing_report.md')
    
    # 儲存為 CSV
    df = pd.DataFrame(videos)
    df.to_csv('mellow_climbing_videos.csv', index=False, encoding='utf-8')
    
    print(f"共處理 {len(videos)} 部影片")

if __name__ == "__main__":
    main()
```

##### Step 4: 簡化版一鍵執行腳本
```bash
#!/bin/bash
# save as: collect_youtube_data.sh

echo "開始收集 Mellow Climbing 頻道資料..."

# 獲取影片資料
yt-dlp --dump-json "https://www.youtube.com/@mellowclimbing/videos" > mellow_videos.json

# 使用 Python 處理資料
python3 << 'EOF'
import json
import sys

videos = []
with open('mellow_videos.json', 'r') as f:
    for line in f:
        try:
            video = json.loads(line)
            print(f"標題: {video.get('title', 'N/A')}")
            print(f"觀看次數: {video.get('view_count', 0):,}")
            print(f"連結: https://www.youtube.com/watch?v={video.get('id', '')}")
            print("-" * 50)
            videos.append(video)
        except:
            pass

print(f"\n總共收集到 {len(videos)} 部影片")
EOF

echo "資料收集完成！"
```

## 更新記錄

- **最後更新日期**: 2025-08-19
- **更新者**: [您的名字]
- **更新內容**: 建立初始文件模板

## 注意事項

1. YouTube 的觀看次數和訂閱數會即時變動
2. 某些影片可能會被設為私人或刪除
3. 建議定期更新此文件以保持資訊準確性
4. 可以使用 YouTube Studio 分析工具獲取更詳細的數據（需要頻道擁有者權限）

## 使用新的自動化收集方案

### 執行示例

#### 範例 1：收集 Mellow Climbing 頻道
```bash
# 進入專案目錄
cd /Users/xiaoxu/Projects/nobodyclimb-fe

# 執行收集（最簡單的方式）
./scripts/collect-youtube-data.sh "https://www.youtube.com/@mellowclimbing" "mellow"
```

#### 範例 2：收集 Petzl 頻道（完整參數）
```bash
./scripts/collect-youtube-data.sh "https://www.youtube.com/@PetzlSportVideos" "petzl" "Petzl Sport Videos" "@PetzlSportVideos" "climbing" "10000"
```

### 預期輸出
```
🚀 開始收集 YouTube 頻道資料...
📺 頻道 URL: https://www.youtube.com/@mellowclimbing
🏷️  頻道名稱: Mellow Climbing
🆔 頻道 ID: @mellowclimbing
📂 輸出名稱: mellow
📊 頻道類型: climbing
⭐ 精選閾值: 50000

📥 步驟 1: 收集影片資料...
⏳ 正在從 https://www.youtube.com/@mellowclimbing 收集資料...
✅ 成功收集 156 部影片資料

🔄 步驟 2: 轉換資料格式...
✅ 轉換完成: 156 部影片
📊 分類統計: 戶外攀岩: 89, 裝備評測: 23, 教學影片: 18, 競技攀岩: 15, 紀錄片: 11
⭐ 精選影片: 23 部

🎉 YouTube 頻道資料收集完成！
```

### 在專案中使用
轉換完成後，可以在 React 組件中使用：

```typescript
// 匯入對應的影片資料（根據輸出名稱）
import { videoList } from '@/lib/constants/mellow_videos'
// 或
import { videoList } from '@/lib/constants/petzl_videos'

// 在組件中使用
export default function VideosPage() {
  return (
    <div>
      <h1>影片列表</h1>
      {videoList.map(video => (
        <div key={video.id}>
          <h3>{video.title}</h3>
          <p>觀看次數: {video.viewCount}</p>
          <p>分類: {video.category}</p>
          <p>頻道: {video.channel}</p>
          {video.featured && <span>⭐ 精選</span>}
        </div>
      ))}
    </div>
  )
}
```

### 批量收集多個頻道
可以建立一個批次腳本來收集多個頻道：

```bash
#!/bin/bash
# batch-collect.sh

echo "開始批量收集 YouTube 頻道資料..."

# 收集攀岩相關頻道
./scripts/collect-youtube-data.sh "https://www.youtube.com/@mellowclimbing" "mellow" "Mellow Climbing" "@mellowclimbing" "climbing" "50000"
./scripts/collect-youtube-data.sh "https://www.youtube.com/@PetzlSportVideos" "petzl" "Petzl Sport Videos" "@PetzlSportVideos" "climbing" "10000"
./scripts/collect-youtube-data.sh "https://www.youtube.com/@AlexHonnold" "honnold" "Alex Honnold" "@AlexHonnold" "climbing" "20000"

echo "所有頻道收集完成！"
```

### 定期更新
建議定期執行腳本以保持影片資料的最新狀態：

```bash
# 可以設定為定期任務（crontab）
# 每週日更新一次影片資料
0 0 * * 0 cd /path/to/nobodyclimb-fe && ./scripts/collect-youtube-data.sh "https://www.youtube.com/@mellowclimbing" "mellow"

# 或者批量更新多個頻道
0 2 * * 0 cd /path/to/nobodyclimb-fe && ./batch-collect.sh
```

### 進階用法

#### 自定義分類邏輯
可以修改 `scripts/convert-youtube-videos.js` 中的 `categorizeVideo` 函數來調整分類邏輯：

```javascript
function categorizeVideo(title, description = '', channelType = 'climbing') {
  const content = (title + ' ' + description).toLowerCase();
  
  if (channelType === 'climbing') {
    // 攀岩分類邏輯
    if (content.includes('boulder')) return '抱石';
    if (content.includes('competition')) return '競技攀岩';
    // 新增自定義關鍵字...
  }
  // 更多自定義邏輯...
}
```

#### 錯誤處理和重試
如果收集過程中遇到網路問題，可以重新執行腳本：

```bash
# 腳本會自動跳過已存在的檔案，或者刪除舊檔案重新開始
rm mellow_videos.json  # 刪除舊的 JSON 檔案
./scripts/collect-youtube-data.sh "https://www.youtube.com/@mellowclimbing" "mellow"
```

## 相關資源

- [YouTube Data API Documentation](https://developers.google.com/youtube/v3)
- [yt-dlp GitHub](https://github.com/yt-dlp/yt-dlp)
- [YouTube Channel URL](https://www.youtube.com/@mellowclimbing)
- [Petzl Sport Videos Channel](https://www.youtube.com/@PetzlSportVideos)