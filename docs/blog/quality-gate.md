# 文章品質閘門

文章操作從 `.claude/skills/write-blog/SKILL.md` 或 `update-blog/SKILL.md` 進入。Skill 負責實際查證與獨立審稿，腳本負責可判定的規則，CI 重跑腳本。CI 通過不代表實際來源支持主張、翻譯準確或線上頁已完成驗收。

## 本地與 PR 檢查

- `pnpm blog:test`：文章工具與閘門行為測試。
- `pnpm blog:translations`：從三語原稿生成 SEO 對照 manifest。
- `pnpm blog:check`：原稿、來源台帳、審稿核准與三語對照；`backend/migrations` 出現帶 `-- blog-source:` 的文章 migration 一律失敗。
- `pnpm blog:validate-local`：用隔離本地 D1 對全部原稿跑一次同步，驗證新增、重跑無變動、更新保留首次發表日期與瀏覽數、缺作者失敗；沒有原稿時改用內建範例文章。
- `pnpm blog:sync --output <sync.sql>`：產生可重複執行的同步 SQL，供檢視或部署使用；產物不納入版控。

文章不走 migration 入庫。`deploy-api.yml` 在結構 migration 之後執行同步：缺少的文章新增，內容不同的文章更新，其餘不動。由原稿管理的文章以 repo 為準，在後台直接修改會於下次部署被覆蓋。

同步只在 push 內含 `backend/content/blog/**` 或 `scripts/blog/**` 變動時執行，因為遠端檔案匯入期間 D1 暫時無法服務查詢；同步失敗後，重跑該 job 或手動觸發 workflow 補跑。slug 在文章建立後不再同步，改原稿的 slug 不會改動資料庫。只改 tags 不會刷新 `updated_at`。

原稿和台帳以完整檔案 SHA-256 綁定審稿核准。改內容後重新查證／審稿，不能只換 hash。審稿須由未參與寫稿的 reviewer 完成；機器只能驗證審查宣告，不能認證 reviewer 的獨立性。

外部連結由 Groundlane-first 研究流程查核並保存 links 紀錄；403、429、timeout 記 uncertain，不能記 broken 或 reachable。CI 驗證紀錄覆蓋與狀態，不會自行連線重新查核。HTTP 成功與來源支持主張是兩件事。

## GitHub 合併限制

2026-10-11 讀取遠端：main/develop 尚無 branch protection，repository rulesets 為空。此次新增 Blog Content 尚未在遠端執行，故尚未具備禁止合併的遠端閘門。

此變更推送並開 PR 後：

1. 確認最新 PR head 的 Blog Content、Lint、Typecheck 及相關測試實際成功；不要用舊 SHA 的結果。
2. 在 GitHub Settings → Rules → Rulesets，為 develop/main 設 require pull request、required status checks，將 Blog Content 加為必要檢查；依現有專案需要保留其他 checks，設定權限與 bypass 時不可覆蓋既有規則。
3. 用故意失敗的測試 PR 驗證不能 merge，再恢復正確產物。不得只因設定成功就宣稱限制生效。
4. 若將來啟用 merge queue，workflow 加 `merge_group` 並提供正確 base SHA；目前 runner 以 pull_request 為適用事件。

merge 後分別確認 migrations、文章同步、API/web 部署、三語公開頁、canonical/hreflang、作者與日期。manifest 是版本庫對照，不能證明文章已在線上；詳情 API 刷新 post-meta KV 後再驗 SEO。
