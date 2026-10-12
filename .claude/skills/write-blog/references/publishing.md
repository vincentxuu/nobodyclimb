# 品質檢查、同步入庫與 PR

原稿是單一編輯來源；文章不生成 migration，也不把 SQL 納入版控。從 repo root 執行：

```bash
node scripts/blog/article.mjs check backend/content/blog/<id>.md
```

三語各有獨立原稿、來源與報告。執行 `node scripts/blog/check-all.mjs` 檢查全部原稿、group 與證據結構；`backend/migrations` 內出現文章 migration 會失敗。

入庫由部署時的同步腳本完成：`deploy-api.yml` 在結構 migration 後執行 `scripts/blog/sync.mjs` 產生的 SQL。缺少的文章新增並設定首次發表日期；內容不同的文章更新，保留 `published_at`、`created_at` 與瀏覽數；內容相同則不動。slug 只在新增時寫入，之後不可改；只改 tags 不會刷新 `updated_at`。同步只在 push 內含文章或 `scripts/blog/**` 變動時執行。作者以品牌帳號的 `users.id` 對應，不依賴 username。由原稿管理的文章以 repo 為準，後台直接修改會在下次部署被覆蓋；要改就改原稿。

Checker 驗格式、支援 HTML 與 placeholder；來源支持力、外連可達性、圖片權利及內容覆蓋由 verify/review 驗，不能把 checker green 稱事實全對。不能拿沒有實質變更湊三語更新。不要寫正式遠端 DB。

原稿完成後執行本地 D1 同步驗證：

```bash
pnpm blog:validate-local
```

helper 使用隔離 temp config 與本地 DB，對全部原稿跑一次同步：驗新增後 posts/tags 與原稿一致、重跑不改動任何資料、內容變更時更新並保留首次發表日期與瀏覽數、缺作者時失敗且不留文章；finally 清理，不連 remote。記錄實際命令與結果，不把一般 SQLite 測試宣稱 D1 實測。

## 綁定原稿與查證版本的審稿核准

每篇必須有 `<id>.review.md`（可閱讀報告）及 `<id>.review.json`（[結構模板](../templates/review.json)）。先完成查證與三語逐段對照，再審閱全文；由未參與寫稿的 fresh-context 獨立 reviewer（subagent 或人工）執行，提供原稿、來源、三語及必要規範，避免將作者預設結論當審查結果；作者不可自行填 approved。記實際識別，不編造人工簽核。CI 不能認證 reviewer 身分或證明獨立性，需由 PR review 實際確認。

sources.json 的 `source_sha256` 與 review.json 的 `source_sha256` 綁定完整原稿檔案；review.json 的 `evidence_sha256` 綁定完整來源台帳檔案。用以下命令取得 hash；不自行正規化換行或 YAML：

```bash
shasum -a 256 backend/content/blog/<id>.md backend/content/blog/<id>.sources.json
```

先更新台帳原稿 hash，再計算台帳 hash；原稿或台帳有任何變更，重新核對受影響項與全文，再產生新核准，不能只機械替換 hash。`sections.factual/translation/editorial` 各必須 passed=true 並有實際 notes；檢查三語數字、限制、否定、引語與來源一致。`findings` 各記 severity blocking/advisory、resolved boolean、notes；未解 blocking 或未完成分層審稿用 changes_requested，禁止 approved。無必修項才填 decision=approved。

產生/更新三語後执行 `node scripts/blog/translation-manifest.mjs --write`，將生成的 `apps/web/src/lib/data/blog-translations.json` 一併納入 PR。`pnpm blog:check` 會核對 manifest、原稿、台帳、links 與審稿 hash/核准。這是可機讀的審查宣告，CI 無法證明來源實際支持主張或翻譯語意正確；仍須真正執行 verify/review，而非模板填滿即通過。

## Commit 與開 PR

1. 檢查 diff 和明確擁有的檔案，保留別人的工作；feature branch 對最新 `origin/develop`，預設 PR base `develop`。
2. 讀 [pre-commit-check](../../pre-commit-check/SKILL.md) 跑 lint/typecheck；以現行 root script 與 project-rules 判斷工具，不複製 QuidProQuo 的 Astro/pnpm verify 指令。
3. 讀 [format-commit](../../format-commit/SKILL.md)，按本站規則展示 message，使用者確認後 commit；既有授權有效時不要重複詢問。只 stage 原稿、來源台帳、review.md/review.json、baseline、生成 blog-translations.json 與必要媒體的明確路徑。
4. 使用者要 push 時依本站規則詢問「要 review 嗎？」；已有回答/授權不重問。Yes 讀 [code-review](../../code-review/SKILL.md) 後 push；No 直接 push feature branch。沒有授權時先完成可 review 產物及檢查，說明尚待 commit/push。
5. 開 PR，參考 [PR 模板](../templates/pr-body.md)。指出讀者可見改動、來源版本/日期、驗證證據、未驗缺口與部署目標；確認 CI 的 SHA 是最新 PR head。不要宣稱遠端 branch protection 或 required checks 已啟用，除非本次確認。

merge 後由 workflow 部署並執行文章同步：`develop` 是 preview；`main` 是 production。開到 develop 不等於正式上線。Skill 不直接 merge、呼叫 push.mjs 寫 DB、`wrangler deploy` 或 `wrangler d1 execute --remote`。

## Merge 後驗收（有後續授權/情境時）

報告分列 PR、CI、同步/deploy、讀者頁證據。查看文章詳情、列表、NobodyClimb 作者、tags、日期、來源/圖片，以及頁面 HTML/SEO metadata。現有 post-meta KV 由詳情讀取刷新，同步不會自動刷新；回讀詳情後再驗 meta，不因 merge green 就宣稱 SEO 正確。新增文章的 created/published 日期與賽事日期分開；更新保留首次發表日期，見 [Google publication dates](https://developers.google.com/search/docs/appearance/publication-dates)。

本地行為驗證參考 Cloudflare D1 的 [local development](https://developers.cloudflare.com/d1/best-practices/local-development/)；必要檢查最新 SHA 參考 [GitHub required checks](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks)。入庫失敗與部署失敗分開回報，不自動做線上修復。

截至本次調整，main/develop 尚未保護此新 job，新增 CI 尚未在遠端執行。此工具阻擋本地/CI 檢查，不代表 GitHub 已禁止 merge；將 job 設為 required check 並驗證最新 SHA 後才能聲稱遠端合併閘門生效。
