# 三篇文章對照與翻譯檢查

本模板是任務對照清單，不作本文原稿。完成時須產出三份獨立 `<id>.md` 及各自的 sources.json/review.md/review.json。

| 語言 | 實際 ID／原稿 | 本次變更 | 狀態 |
| --- | --- | --- | --- |
| zh | 中文 ID | 新增／修改／不變 | |
| en | 英文 ID | 新增／修改／不變 | |
| ja | 日文 ID | 新增／修改／不變 | |

三份 frontmatter 的 `translation_group` 都是中文 ID；`translations` 都是相同 `{zh: 中文ID, en: 英文ID, ja: 日文ID}`。lang 分別 zh/en/ja，同 group category/tags/cover_image/status/is_featured/author_username 相同。

正文附「繁體中文」「English」「日本語」互連，使用 `/blog/<zh-id>`、`/en/blog/<en-id>`、`/ja/blog/<ja-id>`。三篇沿用現有 DB，列表暫時混列。

## 跨語檢查

- 每語標題、摘要、全文、來源、必要更新紀錄與互連都完整。
- 姓名/術語首次對照、數字/單位、日期/時區/季別、否定與限制一致。
- 自然用語、摘要承諾、引語說話者/原語、原始 URL 不變。
- 更新各語受影響內容與來源台帳位置；未變 sibling 不做無實質改動的修改。
- 本文三篇、介面 locale 與 DB 無語系欄位的界線在 PR 說明。
