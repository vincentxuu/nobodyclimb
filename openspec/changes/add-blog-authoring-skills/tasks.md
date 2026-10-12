## 1. Skills 與共用資源
- [x] 1.1 建立新增、更新、審稿、查證、潤稿 skills。
- [x] 1.2 建立攀岩模板、metadata、來源證據、連結與媒體、PR 發布規則。
- [x] 1.3 整合 edit-blog 到同一更新流程，保留既有工具。

## 2. 可執行工具
- [x] 2.1 宣告並鎖定 Markdown/YAML 依賴，提供 check/generate CLI。
- [x] 2.2 驗證作者、分類、HTML/URL、原稿與 migration 一致性。
- [x] 2.3 新增與更新 SQL 檢查目標、基準衝突及 posts/tags 一致性。
- [x] 2.4 提供 PR 文章品質 CI，不寫遠端。

## 3. 驗證
- [x] 3.1 執行 skill 格式與引用路徑驗證。
- [x] 3.2 執行 SQL/Markdown 行為測試及本地 D1 驗證。
- [x] 3.3 用隔離情境檢查 skill 的新增、更新與來源衝突行為。
- [x] 3.4 執行適用 lint/typecheck/慣例檢查並記錄結果與限制。

## 驗證紀錄

- 2026-10-11：六個 skill quick_validate、OpenSpec strict、13 個工具測試、lint、typecheck、check-conventions 通過。
- 隔離本地 D1：新增/更新成功、缺作者、重複 ID、baseline 衝突共六案例通過，沒有遠端寫入。
- 三語完整產物與 migrations 整合檢查通過，臨時資料已清理；fresh-context 新增/更新/矛盾來源試用通過。
- 未 commit/push/開 PR；遠端 CI、merge、部署與讀者頁驗證尚未執行。

## 4. 品質閘門補強（使用者於 2026-10-11 授權調整）
- [x] 4.1 原稿／來源 hash、結構審稿與連結紀錄阻擋。
- [x] 4.2 新 migration 的隔離本地 D1 CI 與歷史 migration 保護。
- [x] 4.3 三語 manifest 與 canonical/hreflang 真實文章 ID。
- [x] 4.4 最終測試與限制紀錄。

遠端設定讀取：main/develop branch protection API 回覆 Branch not protected，repository rulesets 為空。新 Blog Content job 尚未在遠端跑過，required check 尚未設定；本地修改不能宣稱 merge 已被阻擋。

補強驗證：22 個工具測試、2 個 web SEO 測試、lint/typecheck/慣例檢查、六個 skill 格式檢查通過。三語原稿+來源+核准+manifest+SQL 整合通過；改動來源台帳後舊核准被拒絕。以合成 Git diff 驅動實際 CI runner，三篇原稿共九個隔離 D1 情境通過，並清理所有 fixtures。非空三語 manifest 的 web typecheck 亦通過，生成物已還原。遠端 CI、required checks、部署與公開頁仍未驗證。
