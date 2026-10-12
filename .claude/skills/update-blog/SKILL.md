---
name: update-blog
description: 更新 NobodyClimb 既有文章、補来源或修連結，保留文章身分與首次發表日期，產出有基準保護的新 migration 並開 PR。新增文章用 write-blog。
---

# 更新既有文章

先讀 [project-rules](../project-rules/SKILL.md)、[metadata](../write-blog/references/metadata.md) 與 [來源規則](../write-blog/references/source-policy.md)。

1. 依 URL、ID 或標題定位唯一文章，確認此次範圍；多個候選無法判定才詢問。只要求補來源/影片/錯字，維持原教學與主題。
2. 取得最新 repo 原稿及目標環境目前文章資料，依 metadata 的 baseline 格式保存版控基準。歷史 migration 不是最新文章。原稿與線上資料有分歧先解決，不能以舊稿覆蓋他人編輯；缺少可靠 baseline 就回報阻礙，仍可做研究/草稿，不生成可發布更新。
3. 保留 ID、slug、作者、created_at/published_at 與互動資料；只改授權內容欄位。`operation: update`，填 baseline 路徑。新事實融入原段，不堆「補充」補丁。實質新增/修正/結論改變在正文加日期與範圍的更新紀錄；小錯字不強制。
4. 同步受影響標題、摘要、tags、參考資料、圖片、FAQ 與相關文章連結；三語同步受影響內容、來源與報告，取各語 baseline；只為內容確實變更的稿生成新 migration，未變 sibling 保留原 migration。既有單語文的缺語譯稿以 create 新增並互連，列表暫混語言。不藉更新擴增新的多語產品功能。主題已变成另一篇才考慮新稿與互連。
5. 用 [verify-blog](../verify-blog/SKILL.md) 核對新/受影響主張；[review-blog](../review-blog/SKILL.md) 檢查接縫。兩輪以上或腳本替換後從頭回讀數字、指代、承諾與結論；維持 `<id>.sources.json`、`<id>.review.md` 可 review。
6. 依 [publishing](../write-blog/references/publishing.md) 生成新的 update migration，驗本地正常更新、缺目標、基準衝突與零筆變更，檢查一致性後開 PR；禁止改歷史 migration 或直接寫線上。

交付改動與保留範圍、來源、檢查/未驗限制、PR 連結與目標環境。只要求改稿則停止在改稿，未開 PR/未 production 分別說明。
