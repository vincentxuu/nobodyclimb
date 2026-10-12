---
name: edit-blog
description: 編輯 NobodyClimb 已有文章。接受文章 URL、ID 或原稿路徑，沿用 update-blog 的查證、審稿與 PR 流程；不直接覆蓋線上 D1。
---

# 編輯既有文章

先讀 [update-blog](../update-blog/SKILL.md)，依其中的基準取得、保留文章身分、內容更新、查證、審稿與 PR 流程執行。

原有 `scripts/blog/export.mjs` 和 `push.mjs` 保留供既有操作使用，不是這套 skill 的發布路徑。匯出只供對照，並不完整保存作者、tags 與更新基準；不要把匯出檔或歷史 seed migration 當作目前線上文章的完整快照。

- URL 的 `/blog/<id>` 是文章 ID，不是資料庫 slug。
- 先依 update-blog 取得最新原稿與目標環境的現況，再修改；legacy 文章第一次納入時才需要完整 baseline。
- PR 內交付版控 Markdown、來源與 review 報告。
- main/develop merge 由既有 workflow 入庫與部署；不要使用 `push.mjs` 取代 PR，也不要為了這套流程執行遠端寫入。
- 只要求檢查時，使用 [review-blog](../review-blog/SKILL.md)；只要求查證時，使用 [verify-blog](../verify-blog/SKILL.md)。
