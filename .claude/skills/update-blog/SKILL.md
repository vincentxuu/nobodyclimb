---
name: update-blog
description: 更新 NobodyClimb 既有文章、補来源或修連結，保留文章身分與首次發表日期，修改原稿並開 PR，由部署時的同步入庫。新增文章用 write-blog。
---

# 更新既有文章

先讀 [project-rules](../project-rules/SKILL.md)、[metadata](../write-blog/references/metadata.md) 與 [來源規則](../write-blog/references/source-policy.md)。

1. 依 URL、ID 或標題定位唯一文章，確認此次範圍；多個候選無法判定才詢問。只要求補來源/影片/錯字，維持原教學與主題。
2. 取得最新 repo 原稿及目標環境目前文章資料。已有原稿的文章直接改原稿，不需要 baseline；尚無原稿的 legacy 文章第一次納入時才依 metadata 的 baseline 格式保存版控基準，並用 `operation: update`。歷史 seed migration 不是最新文章。同步以 repo 為準，會覆蓋線上內容，所以原稿與線上資料有分歧要先解決；legacy 文章缺少可靠 baseline 就回報阻礙，仍可做研究/草稿，不交付可發布更新。
3. 保留 ID、slug、作者、created_at/published_at 與互動資料；只改授權內容欄位。新事實融入原段，不堆「補充」補丁。實質新增/修正/結論改變在正文加日期與範圍的更新紀錄；小錯字不強制。
4. 同步受影響標題、摘要、tags、參考資料、圖片、FAQ 與相關文章連結；三語同步受影響內容、來源與報告，內容沒變的 sibling 不改。既有單語文的缺語譯稿以 create 新增並互連，列表暫混語言。不藉更新擴增新的多語產品功能。主題已变成另一篇才考慮新稿與互連。
5. 用 [verify-blog](../verify-blog/SKILL.md) 核對新/受影響主張；[review-blog](../review-blog/SKILL.md) 檢查接縫。兩輪以上或腳本替換後從頭回讀數字、指代、承諾與結論；維持 `<id>.sources.json`、`<id>.review.md` 可 review。
6. 依 [publishing](../write-blog/references/publishing.md) 檢查原稿並跑本地 D1 同步驗證後開 PR；不新增文章 migration，也不直接寫線上。

交付改動與保留範圍、來源、檢查/未驗限制、PR 連結與目標環境。只要求改稿則停止在改稿，未開 PR/未 production 分別說明。
