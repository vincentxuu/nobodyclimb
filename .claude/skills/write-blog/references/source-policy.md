# 來源、連結與媒體

## 工具與取得範圍

所有公開網頁研究 Groundlane-first：先搜尋完整 callable inventory（包含 deferred tools），找到 Groundlane `web_search` 找候選、`web_fetch` 讀主要來源全文、`web_extract` 做 selector/table 抽取。沒有掛載或一次 bounded request 整體失敗後，從 inventory 選最符合任務的其他 MCP；沒有合適 MCP 才用平台 web search/fetch/open。簡短揭露 Groundlane 失敗與實際 fallback，並記台帳；fallback 不當 Groundlane 驗證證據。指定工具/禁 fallback 時遵照使用者要求。

不得用退役 `stealth_fetch`、`WebFetch`、`web-fetch`、`fetch_page` 或 Playwright 抓頁內容。Fallback 限公開頁，不傳 secrets、cookie、token、認證內容或私有資料。若委派 subagent，prompt 必須包含相同工具與 fallback 邊界。

搜尋摘要只找線索。可完整讀就完整讀；截斷、selector 抽取、付費牆、影片字幕缺段都記實際範圍。無法取得支持段落時標 `unverifiable`，不能說已核實全文。

## 台帳與查證

使用 [來源台帳](../templates/sources.json)，隨原稿版控。每條 claim 記 `location/claim/verdict/sources/reason`；其 sources 記 `url/title/publisher/source_date/accessed_at/read_scope/evidence/tool`。read_scope 用 full/partial/summary；summary 不能支持 confirmed。頂層記 article_id、source_sha256（完整原稿位元組的 SHA-256）、checked_at 與 media（url/purpose/alt/source_url/usage_basis）；checked_at/accessed_at 必須 ISO 8601 並帶時區，reason 必填非空。封面及正文媒體都要入台帳，記使用依據與查核日期。有季別/版本在 evidence 明示。

狀態：`confirmed`（原文支持）、`outdated`（曾成立但已變）、`contradicted`（原文相反）、`misframed`（數字或原話對，但比較/推論錯）、`unverifiable`（證據不足）。發布 gate 阻擋 outdated/contradicted/misframed；先修正文並重新查證，不把已知錯誤當可發布紀錄。unverifiable 只有明示不確定時可保留：claim 加 `disposition: qualified`、`qualification` 非空，qualification 原句必須存在正文；獨立 reviewer 判斷措辭確實傳达不確定且不誤導，不以隨意一句話或 hash 過關。無法合理限定則移除主張。自己設計的計算另記算式、假設與單位，不假冒外部事實。

官方協會/主辦單位/成績表與規則核實賽事；岩館/管理單位核實費用、開放與進入限制；廠商核實規格，不直接把廣告當獨立效能證據；原始研究及專業組織支援訓練與傷害主張；本人原訪談核對引語。來源數按權威、支持力與風險决定，不能硬湊兩份；同一公告的轉載算同一來源。安全、傷害、效能比較、研究推論或來源衝突要加驗適當專業來源與方法限制。

賽程、規則、排名、紀錄、價格、開放狀態核實目前版本；歷史資料標當時季別。比較核對級別、時間、單位、分母、樣本與測量條件；成績與世界紀錄不能互推。直接引語回原文，保留說話者、語境及否定，不從中文反譯原話。

## 連結

主要外部主張與首次重要外部對象原位連到精準來源，文末清單不能取代 inline link。連結文字說明用途，見 [W3C link purpose](https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html)。主要比較對象分別有來源，不全部掛泛首頁。

台帳 `links` 必填：每個正文外部 link、claim 來源 URL、media source_url 各記唯一 `url/checked_at/tool/status/status_code/reason`。status 為 reachable/broken/uncertain；status_code 是 HTTP 整數或 null（工具未提供時如實記錄）。200/重導須核對最終目的內容及錨點，才記 reachable。broken/uncertain 均阻擋核准；先重新確認、修復或替換/移除不可靠引用，不將 timeout 假稱壞連結，也不虛構 200。沒有自動豁免。

可達性與主張支持力分別驗：404/410 是壞連結；403/429/timeout 是待確認；200 仍需核對主張。重導核對目的主題；錨點、頁碼、時間碼核對真正支持內容。站內文章網址按實際 `/blog/<id>` 與目前 locale 行為驗，不把 slug 當 ID；沒有讀取權限時明列未驗範圍。

## 圖片與影音

圖片記來源、作者、使用依據與 alt；可公開看不代表可轉載。不明使用權改用連結或可用素材。資訊圖 alt 描述用途，複雜路線圖另附完整文字說明。W3C 建議裝飾圖空 alt；本站本文工具只接受非空 alt 的資訊圖片，裝飾圖省略，見 [W3C images](https://www.w3.org/WAI/tutorials/images/)。封面沒有正文圖片語法的 alt 欄位，不自行 invent DB 欄位；審稿記錄預期描述並驗實際 UI。

影片採公開來源連結；本站目前 DOMPurify 不保留 iframe。對影片內容提出主張時核對可取得字幕/逐字稿或原音，分別記字幕核對、原音回聽、時間定位與播放實測；拿不到原音不宣稱回聽。沒有時間碼不能按文字比例估造。短引文、摘要、翻譯與外部字幕入口都不冒充頁內完整逐字稿；全文轉載先確認依據。
