---
name: review-blog
description: 審查 NobodyClimb 文章的 metadata、模板覆蓋、來源/連結/媒體、摘要承諾與可讀性，交付分級位置報告。單獨 review 不自動改正文；事實查證交 verify-blog。
---

# 文章審稿

讀 [metadata](../write-blog/references/metadata.md)、[寫作](../write-blog/references/writing.md) 與 [來源/連結/媒體](../write-blog/references/source-policy.md)，使用 [報告模板](../write-blog/templates/review-report.md)。先讀全文、來源台帳與讀者問題，再看 diff。

分層檢查：

- 機械：`node scripts/blog/article.mjs check <draft> [--migration <path>]`；metadata、placeholder、HTML 保留內容與原稿/SQL 一致性，SQL 有正確 create/update 與作者策略。
- 事實：讀 verify 報告，檢查未驗/衝突主張及 metadata 衍生內容是否超出證據；需要時執行 [verify-blog](../verify-blog/SKILL.md)，不拿 checker green 作 confirmed。
- 覆蓋：前三段主題/讀者/用途；核心構成、先備知識、具體例子、限制與下一步是否足以回答讀者問題。每個比較對象覆蓋相等嗎？來源缺項是否被悄悄省略？真缺內容就指出，不能因現有句子全對就判完整。
- 連結/媒體：重要主張原位有精準來源、文末清單、站內真實 ID、錨點/重導、圖片來源/使用依據/alt、字幕與原音證據範圍。403/429/timeout 列待確認，200 不代表支持主張。
- 結構與聲音：標題/摘要承諾，段落邏輯、長句、數字/但書密度、指代、重複與台灣用語；建議可執行。更新接縫與先前仍成立的內容是否遺失？涉及同題相關文列出需同步部分，避免雙份過時內容。

報告用「必修/建議/可選」，每項列位置、證據、讀者影響、具體修法；必修未解不宣稱 ready。單獨 review 預設不改正文；主新增/更新任務可直接迭代。存 `<id>.review.md` 隨 PR 版控，列本地檢查與未驗範圍，全文回讀不能省略。

核准必須由未參與寫稿的 fresh-context 獨立 reviewer（subagent 或人工）執行，作者不能自填 approved；CI 无法認證 reviewer 身分，PR review 需確認實際獨立審查。核准交付另存 `<id>.review.json`，依 [核准與 hash 規則](../write-blog/references/publishing.md#綁定原稿與查證版本的審稿核准) 和 [結構模板](../write-blog/templates/review.json)。逐段比較 zh/en/ja 的數字、限定、否定與引用，寫 factual/translation/editorial 的實際結論；未解必修或未完成任一層用 changes_requested。核准須綁定原稿和來源台帳完整 bytes，改稿或改台帳使舊核准失效。CI 只核对宣告與版本，不替代獨立內容判斷。
