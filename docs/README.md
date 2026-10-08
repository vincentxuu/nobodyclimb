# docs 索引

> 規範衝突時，以 `.claude/skills/project-rules/SKILL.md` 為準，本目錄的舊文件僅供參考。
> 標「待確認」表示只讀了開頭，尚未確認是否仍符合現況。

## 現行規範入口

- [`.claude/skills/project-rules/SKILL.md`](../.claude/skills/project-rules/SKILL.md)：專案憲法（不變量、禁令、事實表）
- [`CLAUDE.md`](../CLAUDE.md)：AI 開發入口與常用指令
- [`README.md`](../README.md) / [`README.zh-TW.md`](../README.zh-TW.md)：專案介紹、快速開始、部署

## 現行設計文件（開頭確認為 Hono / D1 / 現有系統）

- `DEPLOYMENT-GUIDE.md`：Cloudflare Workers 完整部署指南
- `database-migration-guide.md`：D1 production → preview 的 schema 與資料複製
- `color-system.md`：品牌色彩系統
- `icon-usage-guide.md`：Lucide React icon 使用清單
- `backend/image-management.md`：圖片上傳、儲存、刪除流程（Hono + R2）
- `interact/`：互動功能（按讚、留言、追蹤、收藏）後端實作
- `techstack/`：技術棧文件（web / app / backend / cicd / monorepo），標註最後更新 2025-01-29，待確認是否仍準確
- `ai-agent/`：AI Agent 實作文件 01–19，入口見 `ai-agent/README.md`
- `app-ui/`：Web 與 App 共用的設計系統參考
- `design/`：UI 設計提案、admin dashboard 重設計與示意圖
- `log-design/`：Logging 設計
- `refactoring/`：entity type 命名規範與重構計畫
- `prd/`：產品需求文件（PRD）

## 歷史 plan / 研究 / 讀書筆記

規劃類（實作狀態待確認）：
- `plan.md`：Admin Crag 匯入匯出功能規劃
- `author-profile-design.md`：作者個人檔案設計，狀態「規劃中」
- `climbing-routes-database-plan.md`：岩場與路線資料庫規劃
- `combine-climbing-records-plan.md`：攀爬記錄 × 人生清單整合計畫
- `statistics-system-plan.md`：統計系統規劃，狀態 Draft
- `bio/`、`persona/`：人物誌章節、內容與任務規劃
- `crag-redesign/`：岩場頁面重新設計
- `nav-profile/`：導覽與個人頁面速查與改善提案
- `route-data-refactor/`：路線資料 CSV 範本與對應
- `route-social-media-integration/`：路線社群媒體整合規劃
- `ig-show-video/`：Instagram 貼文內容顯示說明與實作
- `yt-data/`：YouTube 資料收集規劃與腳本
- `roadmap/`：產品開發路線圖與任務清單
- `service-design/`：飛輪策略、冷啟動、商業模式等服務設計
- `games/rope-system/`：繩結系統產品規格、技術架構、資料庫 schema
- `superpowers/`：`plans/`、`specs/`，內容待確認
- `tech-debt/`：自動儲存修正、互動系統統一

研究與內容：
- `research/`：攀岩人格測驗、訓練知識庫、Langfuse 整合等研究
- `blog/`：部落格文章題材規劃

讀書筆記（與本專案實作無直接關係）：
- `CHAPTER 10：DESIGN A NOTIFICATION SYSTEM.md`：《系統設計面試指南》第 10 章（簡體中文轉錄）
- `notification-system-design-study-guide.md`、`notification-system-design-study-guide-concise.md`：以 NobodyClimb 為案例的通知系統導讀

除錯紀錄（原始 log / 對話紀錄，非文件）：
- `bug/`、`rag-fix/`、`react-agent/`

## 已過時

- `backend/` 內的 Django REST Framework 文件：`README.md`、`01`–`06`、`STYLE_GUIDE.md`、`quick-reference.md`，已在檔案最上方標註過時。本專案 backend 為 Hono + Cloudflare D1，請看 `backend/src`。`backend/image-management.md` 不在此列。

## 待清理

