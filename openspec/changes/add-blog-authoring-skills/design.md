## Context

NobodyClimb 正文為 HTML；網址使用文章 ID，slug 為獨立唯一欄位。品牌作者依現有 `username = 'nobodyclimb'` 解析。main/develop push 的 API workflow 會套用 numbered migrations，分別部署 production/preview。

## Decisions

- 原稿與來源證據放 `backend/content/blog/`，讓 PR 可讀並保持後端部署 path 一致。
- 不新增另一条直接寫 D1 發布路徑；生成工具只讀本地檔案並寫 SQL。既有 scripts/blog/export.mjs 與 push.mjs 不變。
- 精簡入口按需讀共用 references/templates；機械檢查使用腳本，事實支持力與可讀性由審稿判斷。
- 拒絕 renderer 不支援或有風險的 HTML/URL，不把移除後的內容當完成交付。
- 更新用目前資料的 baseline，更新衝突、缺作者、目標缺失必須顯式失敗；不採零筆更新仍成功。
- skill 依專案 commit 與 push 規則交付 PR，不自行 merge。未驗公開頁不得稱已發布。

## Risks / Trade-offs

- preview/production 文章可能有分歧：更新必須核對目標環境基準，衝突不自動覆蓋。
- SQL/Markdown 可能漂移：重生成 parity 檢查，已發布 migration 不改寫。
- 來源可達不等於支持主張：網路狀態與語意查證分層。
- 三語 SEO 用版控原稿生成 manifest，canonical 依正文語系、hreflang 對應實際 ID；未管理歷史文章不宣告不存在的翻譯。SEO KV runtime 保持原行為，merge 後須詳情回讀及 metadata 核對。
- 既有共享工作樹有未追蹤工具與稿件：只改本次明列路徑，保留其餘內容。

## 品質閘門補強

- 原稿／來源與結構審稿以完整 bytes hash 綁定；未解 blocking、未完成分層審稿、矛盾/過時主張、未確認連結阻擋 CI。未知主張須明示 qualification。
- 真正語意支持力與 reviewer 獨立性無法由 hash 認證，仍由獨立 PR review 確認。
- CI 使用 PR base SHA 到 HEAD，僅套用新增 managed migrations 到隔離 local D1；不改寫歷史 migration。此測試模擬基準與作者，不能证明正式資料無衝突，正式 migration 仍具基準衝突保護。
- 新 job 尚未推送／遠端執行，main/develop 無保護；具體啟用與驗收流程見 docs/blog/quality-gate.md。
