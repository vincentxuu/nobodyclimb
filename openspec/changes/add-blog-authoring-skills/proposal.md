# Change: NobodyClimb 文章寫作與更新 skills

## Why

文章存於 D1，現有工具偏向匯出與直接更新，缺少可 review 的新增、查證、更新與 PR 交付流程。使用者已在本次討論確認參考 QuidProQuo 全套文章流程，並於 2026-10-11 指示實作。

## What Changes

- 提供寫作、更新、審稿、查證、潤稿入口，共用攀岩模板、metadata 與來源規則。
- 以版控 Markdown 為來源，離線驗證後生成新增或更新 D1 migration。
- 更新保留文章身分與日期，以基準檢查阻止覆蓋他人修改。
- PR 檢查來源產物與 SQL 一致性；merge 沿用既有自動 migration 與部署。
- 將現有 edit-blog 指引接到 PR 更新流程，保留既有匯出與 push 腳本。

- 每次交付中、英、日三份原稿，檢查語系對照與互連；沿用既有三個文章 ID，列表暫時混合語系。

## Impact

- Affected specs: blog-authoring
- Affected code: `.claude/skills/*-blog/`、`scripts/blog/article*.mjs`、`backend/content/blog/`、root package scripts、文章品質 CI。
- 更新 blog 頁面的 canonical/hreflang，以生成 manifest 對應真實三語 ID；不修改 DB 結構、既有 migration 或線上文章。本次不 commit、push、merge 或遠端寫入。

使用者於 2026-10-11 在品質閘門缺口討論後指示「協助調整」，授權補上 hash 審稿核准、link 台帳、D1 CI 與三語 SEO 對照。遠端必要檢查待新 job 實際執行後設定與驗證，本次不宣稱 GitHub 已阻止 merge。
