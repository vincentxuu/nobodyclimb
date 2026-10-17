# 原稿與發布資料

可版控原稿放 `backend/content/blog/<id>.md`。frontmatter 不是 Astro schema；`scripts/blog/article.mjs` 嚴拒未知 key。分類以 `packages/types/src/content.ts` 的 `PostCategory` 即時核對，tags 先查既有文章保持命名一致。

```yaml
---
id: "填入32位小寫hex"
slug: "具體且不重複的文章slug"
title: "具體標題"
excerpt: "與正文一致的摘要"
category: competition
tags: ["世界盃", "攀岩賽事"]
cover_image: null
status: published
is_featured: 0
author_username: nobodyclimb
operation: create
lang: zh
translation_group: "中文文章ID"
translations: {zh: "中文文章ID", en: "英文文章ID", ja: "日文文章ID"}
---
```

create 的 ID 用專案 `generateId()` 等價的 16-byte 隨機 hex，例如 `node -e "process.stdout.write(require('node:crypto').randomBytes(16).toString('hex'))"`；不要用 slug 當 ID。上述佔位字只作說明，不能交付。slug 唯一，公開文章詳情連結依實際 `/blog/<id>` 驗。

必填：id、slug、title、excerpt、category、tags（非空字串陣列，不重複）、cover_image（安全 URL 或 null）、status（published）、is_featured（數字 0/1）、author_username（nobodyclimb）、operation（create/update）、lang、translation_group、translations。多語必填欄位為 lang（zh/en/ja）、translation_group（中文文章 ID）、translations（三語實際 ID 對照）；沒有 published_at/date/locale frontmatter 欄位；新文章首次發布日期由首次同步入庫時設定，賽事日期寫正文。`author_username` 是品牌別名；同步腳本以固定的品牌帳號 `users.id` 對應，不依賴線上 username。

## 更新 baseline

update 保留既有 ID（允許 legacy `post_...`）、slug 和作者；frontmatter 改 `operation: update`，增加 `baseline: "<id>.baseline.json"`，檔案同原稿目錄並版控。snapshot 取目前目標文章的公開內容欄位和 tags：

`id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, updated_at, tags`

使用保存的公開 API 回應產生白名單基準，三語各保存自己的回應、各取自己的 baseline：

```bash
pnpm blog:baseline <saved-public-api-response.json> --output backend/content/blog/<id>.baseline.json
```

回應需 `success: true`、完整文章內容與 tags、作者 username 為 nobodyclimb；helper 僅本地讀檔及輸出白名單，不自行連 remote。不要把 cookies、token 或私人回應存 repo。

所有欄位都要在基準，nullable 欄位以 null 明示；不得夾 users 私人資料或 secrets。content 是現況 HTML，不用 Markdown 假代。只允許這些 keys，沒有 created_at。工具比對完整基準與 tags，缺目標/衝突顯式 SQL 失敗；不改 created_at、published_at、view_count 等互動資訊。

## 原稿、證據與多語交付

每篇附 `<id>.sources.json`、`<id>.review.md`、`<id>.review.json`；update 再附 baseline。來源和審稿報告版控，可暫存的研究/計畫放任務目錄，不把台帳只留 /tmp。

依使用者要求，每篇同時新增三份完整原稿，各有唯一隨機 ID：`backend/content/blog/<zh-id>.md`、`<en-id>.md`、`<ja-id>.md`。每份填 lang、translation_group（中文 ID）、translations（三份 ID 對照），並各附 sources.json/review.md/review.json。不是把三語放同一原稿或 translations.md。

同 group 的 category、tags、cover_image、status、is_featured、author_username 相同；title/excerpt/body 自然翻譯。正文三語互連：中文 `/blog/<zh-id>`、英文 `/en/blog/<en-id>`、日文 `/ja/blog/<ja-id>`，連結名稱用「繁體中文」「English」「日本語」。術語首次對照，數字、日期、單位、否定、限制與原始來源 URL 一致。

本站沿用現有 DB 的三篇文章，不新增 locale 表、不改 API/renderer。group/mapping 用原稿與 checker 維護；同步時將原稿的 lang 寫入 `posts.lang`，列表 API 依介面語系只回傳該語系與未標語系（使用者自行發表）的文章。公開 locale 路由是三篇互連，不宣稱已实现本文語系切換資料模型。

三份原稿放同一 PR。更新同步三語原稿/來源/報告；沒有實際內容變更的 sibling 不改。baseline 只在第一次把 legacy 文章納入原稿管理時需要，每篇取自己的 baseline。已存在 legacy 單篇文章要先補其餘兩篇，再建立完整對照；新增譯稿 operation=create，既有文 operation=update。各語正文與資料的改動依實際 baseline 判斷，不能為了湊三份 update 無變更稿。

正文从 H2 開始，文章標題只在 frontmatter title；不得保留模板 H1、說明或 `<>` 提示。raw HTML 不接受，使用普通 Markdown 由工具生成支援的 HTML。
