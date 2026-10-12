---
name: verify-blog
description: 查證 NobodyClimb 文章的賽制、成績、日期、訓練、安全、裝備規格及引語，更新來源台帳並交付逐條報告。單獨執行不修改正文，不代替內容覆蓋審查。
---

# 事實查證

讀 [來源與媒體規則](../write-blog/references/source-policy.md)。定位唯一原稿，抽出正文、標題、摘要、表格、FAQ、alt 的所有可驗主張，記位置/原句/風險；不要只查帶數字的句子。

依 Groundlane-first 規則完整取得主要來源，核對人名、日期/季別、賽制、排名/紀錄、費用、裝備規格、研究限制、傷害/訓練建議與直接引語。數字示例重算單位、分母、假設；比較核對級別與測量條件。來源支持力與 URL 可達性分開判定；官方來源也可能版本不同或彼此衝突。

用 [台帳模板](../write-blog/templates/sources.json) 記 source 与 claim，狀態用 `confirmed/outdated/contradicted/misframed/unverifiable`。取不到內容就留下未驗範圍，不以訓練記憶或搜尋摘要判 confirmed；歷史事實不是自動 outdated。圖片/影音記使用依據及取得範圍，不用文字字幕聲稱原音實測。

單獨查證只更新伴隨原稿的 `<id>.sources.json` 與 [審稿報告](../write-blog/templates/review-report.md)，列各判定、支持位置、建議修法、來源/方法與缺口，不 auto-fix 正文。完整新增/更新任務中交回主流程修正後再核對。

結尾明列「已核對 N 條宣告、尚未核對的範圍；本查證不評估文章對主題的覆蓋完整度」。機械 checker 不能代替本流程。

台帳更新 `source_sha256` 綁定完整原稿，並按來源規則維護 `links` 的可達性紀錄；來源支持力與 HTTP 成功仍分開判斷。改動台帳後舊 review.json 的 evidence hash 失效，交回 review-blog 重新審查，單獨 verify 不自動核准 factual/translation/editorial。
