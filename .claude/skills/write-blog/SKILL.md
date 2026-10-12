---
name: write-blog
description: 為 NobodyClimb 新增攀岩文章，產出可版控 Markdown、來源台帳與審稿報告，完成 feature branch PR。適用寫文章、賽事介紹、指南或報導；更新既有文用 update-blog。
---

# 新增 NobodyClimb 文章

文章同時產出繁中、英文、日文，以 `nobodyclimb` 品牌帳號發文。交付終點是 **開 PR**；merge 才由既有 workflow 入庫與部署。只要求草稿時停在草稿，不自行擴大發布授權。

1. 先讀 [project-rules](../project-rules/SKILL.md)，檢查最新目標分支、工作樹與既有同題文章；保留他人修改。將讀者問題、大綱與進度寫入任務暫存目錄。
2. 讀 [metadata](references/metadata.md)，選 [模板](references/writing.md#模板選擇)。先定讀者看完能做的決定，再依問題找來源；章節可增刪。
3. 依 [來源與媒體規則](references/source-policy.md) 研究，建立版控來源台帳。不能用搜尋摘要、自己的舊對話或官方頁面標題充當已核實證據。
4. 按 [寫作指引](references/writing.md) 產出 zh/en/ja 三份獨立 `backend/content/blog/<id>.md`（各語唯一 ID，同 translation_group 與 translations 對照）；將 `<id>.sources.json`、`<id>.review.md` 與 `<id>.review.json` 放同目錄。NobodyClimb 不虛構親身攀登、採訪、測試或資格。
5. 執行 [verify-blog](../verify-blog/SKILL.md) 核對事實，再 [review-blog](../review-blog/SKILL.md) 檢查覆蓋、metadata、連結、媒體與可讀性。完整寫作任務內直接修正已確認問題，更新台帳及報告；單獨查證/review 預設只報告。
6. 依 [PR 發布](references/publishing.md) 檢查原稿與本地 D1 同步行為，執行必要專案品質檢查，再依 commit/push 規則開 PR。預設 base `develop`，明示合併後只到 preview。

交付原稿、來源與審稿報告、檢查結果、PR 連結與剩餘缺口。未開 PR 就回報尚未完成此步；開 PR 不宣稱文章已上線。三語依 [language bundle](templates/language-bundle.md) 完整交付並同步更新；保留來源與事實一致。三篇沿用現有 DB，正文互連，列表暫混語言；沒有 DB locale 欄位。
