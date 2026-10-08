# AI Chat 體驗優化

> Branch：`feat/chat-optimization`。本文件是這次變更的背景與待辦清單。

## 背景

AI chat 目前有幾個直接影響體感與正確性的缺口：

- Agent 模式下，LLM 在迴圈內直接給出的答案不會逐字串流，只在 `done` 事件一次送達。
- 使用者按「停止」只中斷前端 fetch，後端 LLM / 工具照跑、配額照扣。
- 全頁 `/chat` 與浮動 widget 各自維護一份送訊息邏輯，功能落差大（全頁沒有持久化、歷史、重新生成、回饋）。
- 訊息持久化由前端另外呼叫 `saveMessage`，失敗靜默，串流途中離開頁面就遺失 assistant 訊息。
- 串流錯誤訊息寫死中文，en / ja 使用者看到中文。
- Mobile 完全沒有串流。

## 變更內容

- backend：`/ai/ask` 串流支援 client 中斷（停止 LLM / 工具並退還配額）、SSE heartbeat、錯誤事件帶錯誤碼、`ask()` 直接回傳 token usage。
- backend：agent loop 的 `chatWithTools` 支援文字逐 token 推送。
- backend：`/ai/ask` 接受 `session_id`，由後端寫入 user / assistant 訊息（含 sources）；session 列表支援分頁。
- web：抽出共用 `useChatSession` hook，widget 與全頁 `/chat` 共用；重新生成改走串流；錯誤訊息 i18n；串流重繪與自動捲動優化；修正 `next/link` 違規。
- mobile：ChatWidget 接上 SSE 串流與工具進度。

## 影響範圍

- DB：`chat_messages` 新增 `sources` 欄位（migration + schema.sql）。
- API：`/ai/ask` request 新增選填 `session_id`；SSE `error` 事件新增 `code`；`GET /ai/chat/sessions` 新增 `page` / `limit`。皆向後相容。
- 前端原本的 `saveMessage` 呼叫在帶 `session_id` 時移除，避免重複寫入。

## 待辦

### 1. Backend：串流中斷與配額（止血）

- [x] 1.1 `routes/ai.ts` 串流路徑用 `stream.onAbort()` 取得 client 中斷，將 AbortSignal 傳入 `QueryService.askStream()` → `ask()` 既有的 controller
- [x] 1.2 agent loop 與 provider 呼叫在 signal aborted 時停止後續 turn / 工具執行
- [x] 1.3 client 中斷時：尚未輸出任何正文 → 退還次數與 token 預扣量；已輸出部分回答 → 次數照扣（避免快結束才按停止白嫖）。退還邏輯抽成 `refundQuota()` 共用
- [x] 1.3a 串流開始時先註冊 `waitUntil` 撐住 invocation（wrangler dev 實測：沒有它 client 一斷線 handler 就被 runtime 取消，收尾不會執行）
- [x] 1.4 SSE heartbeat：長時間工具執行期間定期送 comment 行，避免 proxy 切線
- [x] 1.5 `QueryService.getLastTokenCount()` 提供實際 token usage，移除串流 / 非串流結束後回頭查 `ai_query_logs.token_count` 的查詢

### 2. Backend：Agent 迴圈內答案逐字串流

- [x] 2.1 `ChatWithToolsOptions` 新增選填 `onToken`；provider 支援時以串流模式呼叫並邊收 tool call 邊推文字
- [x] 2.2 Workers AI（新版 schema 模型）、OpenAI、GitHub Models 共用 `tool-stream.ts` 解析器；Anthropic / Google 與 Workers AI 舊版 schema 模型維持非串流（一次送達）
- [x] 2.2a 新增 SSE 事件 `token_reset`：以 glm-4.7-flash 實測，會呼叫工具的輪次會先吐前導文字，需要讓前端作廢已累積的文字
- [x] 2.3 `agent-loop.ts` 第二輪起將 `onToken` 傳入 `chatWithTools`（第一輪沒呼叫工具會被丟棄重試，故不串流）；開頭扣住 8 字判斷是否為「[呼叫工具: xxx]」純文字
- [x] 2.4 新增 `tool-stream.test.ts`、`agent-loop-streaming.test.ts`

### 3. Backend：訊息持久化移到後端

- [x] 3.1 migration `0081` + `schema.sql`：`chat_messages` 新增 `sources TEXT`、`status TEXT`（`schema.sql` 原本完全沒有 chat 表，一併補上完整定義）
- [x] 3.2 `/ai/ask` request schema 新增選填 `session_id`、`regenerate`；驗證 session 屬於該使用者（否則 404 `session_not_found`，不扣配額）
- [x] 3.3 帶 `session_id` 時由後端寫入 user 訊息與 assistant 訊息（含 sources、suggested_questions、query_id），並更新 session title / updated_at
- [x] 3.4 client 中斷時，已產生的部分內容以 `status = 'stopped'` 寫入
- [x] 3.5 `GET /ai/chat/sessions/:id/messages` 回傳 sources
- [x] 3.6 `GET /ai/chat/sessions` 支援 `page` / `limit`，回傳 pagination 信封

### 4. Backend：錯誤碼

- [x] 4.1 SSE `error` 事件新增 `code`（`timeout` / `circuit_open` / `internal`）；HTTP 錯誤沿用既有的 `error` 欄位（`rate_limited`、`quota_exceeded`、`token_quota_exceeded`、`InvalidInput`、`session_not_found`）

### 5. Web：共用 chat hook

- [x] 5.1 新增 `apps/web/src/hooks/useChatSession.ts`：封裝送訊息（串流 / 非串流）、停止、重新生成、session 載入 / 切換 / 新增 / 刪除、配額狀態、429 處理
- [x] 5.2 `ChatWidget.tsx` 改用 hook，移除重複的 429 處理與 `saveMessage` 呼叫
- [x] 5.3 `ChatClient.tsx` 改用 hook，補上持久化、歷史、重新生成、回饋、429 顯示
- [x] 5.4 重新生成改走串流路徑（顯示工具過程）
- [x] 5.5 widget「展開」改用 `@/i18n/navigation` 的 router，帶著目前 session 進全頁

### 6. Web：錯誤 i18n 與小修

- [x] 6.1 `askAIStream` 的 `onError` 改回傳錯誤碼，由元件以 `Chat.errors.*` 翻譯；三語系訊息檔補 key
- [x] 6.1a `askAIStream` 新增 `onReset`，hook 收到 `token_reset` 時丟掉佇列並清空該則訊息內容
- [x] 6.2 串流 429 同步更新配額狀態
- [x] 6.3 `ChatWidget.tsx` / `ChatClient.tsx` 的 `next/link`、`next/navigation` 改用 `@/i18n/navigation`
- [x] 6.4 widget textarea 隨內容自動長高
- [x] 6.5 建議問題改用 Fisher–Yates 洗牌

### 7. Web：串流效能

- [x] 7.1 自動捲動只在使用者貼近底部時觸發，串流中用 `auto` 而非 `smooth`
- [x] 7.2 token 佇列依積壓量一次吐多個，避免畫面落後與 `done` 延遲
- [x] 7.3 `ChatMessage` 以 `memo` 包裝，串流時只重繪最後一則

### 8. Mobile：串流

- [x] 8.1 `apps/mobile` ChatWidget 接上 SSE 串流（`expo/fetch`，逐字顯示、停止、`token_reset`）；建立連線階段失敗（非 4xx，401 例外）才退回一次性請求
- [x] 8.2 顯示工具進度
- [x] 8.3 帶 `session_id` 走後端持久化
- [x] 8.4 重新生成走串流；`chat_history` 不再重複送最後一則 user 訊息；前端錯誤泡泡不可重新生成
- [ ] 8.5 模擬器 / 真機驗證串流流暢度、停止按鈕、工具列外觀（尚未執行）

### 9. 驗證

- [x] 9.1 backend `npx vitest run`（321 passed）、backend `tsc`、web typecheck、web jest（79 passed）、mobile `tsc`、mobile `src/lib/ai` jest（23 passed）、`bash scripts/check-conventions.sh`。root `pnpm lint` 的 30 個錯誤全部來自未追蹤的 `.gatelane/traces/*.json`，本次變更的檔案無 lint 錯誤
- [x] 9.2a scratch worker 實測：Workers AI `stream: true` + tools 的回傳格式；client 斷線時需預先 `waitUntil` 收尾才會執行
- [ ] 9.2b 本機起 backend + web 實測：串流、停止退配額、重新整理後對話與來源仍在、en / ja 錯誤訊息（未執行：全新本機 D1 的 migration 鏈在 `0033` 失敗，與本次變更無關）
- [ ] 9.3 部署到 preview 後驗證：`migrations/0081` 已套用、agent 模式逐字串流與 `token_reset`、停止後配額與 `status='stopped'` 訊息

## Code review 後的修正（2026-09-22）

三個乾淨 context 的 reviewer（backend / web / mobile）共找到 1 High、14 Medium、約 20 Low。High 與 Medium 全部修掉，Low 列在下方待辦。

### 已修

- [x] R-H1 **停止在 `streamChat` 路徑無效**：五個 provider 的 `streamChat` 都把 `onToken` 包在吞掉所有例外的 catch 裡，AbortError 傳不出去；pipeline 模式、agent 退回 pipeline、agent 收尾 call 三條路徑按停止都會跑完並照扣。修法：catch 只吞非 AbortError；`LLMCallOptions` 新增 `signal`，fetch 傳入、Workers AI 以 `reader.cancel()` 處理；agent 收尾與 `llm-generation` 節點傳 signal。另發現 `AI.run` 等待期間中斷時 signal 已 aborted、事件不會再來，需先檢查 `aborted`
- [x] R-M1 **孤兒 / 重複 user 訊息**（backend；同時解掉 mobile 的 fallback + axios 重試最多處理 5 次的問題）：user 訊息不再在作答前寫入，改成回合結束時與 assistant 訊息同一個 `db.batch` 落地（`saveTurn`）。失敗、無正文中斷的回合不留任何訊息
- [x] R-M2 agent 串流到一半 provider 失敗且無 fallback → entry.ts 退回 pipeline 前送 `token_reset`
- [x] R-M3 中斷收尾搬進 `stream.onAbort` 當下執行（不等 `ask()` unwind），以 `settled` 旗標與正常完成 / 失敗路徑互斥；stopped 內容存檔前過 `checkOutput`
- [x] R-M4 tool call delta 沒有 `index` 時依 id / name 判斷是否為新的 call，不再互相覆蓋
- [x] R-M5 補測試：`stream-chat-abort.test.ts`（三個 provider）、`routes/__tests__/ai-ask-stream.test.ts`（正常 / 失敗 / 無正文中斷 / 有正文中斷四條路徑的配額與持久化互斥）、`repositories/__tests__/chat.test.ts`（`saveTurn` 各組合）、parser 邊界
- [x] R-M6 web widget 按新對話 / 清除後重開不再載回最近 session（`userResetRef`）
- [x] R-M7 web widget 串流中停用「展開」
- [x] R-M8 web 重新生成按鈕改用 hook 匯出的 `canRegenerate`，與 `getRegenerateTarget` 一致
- [x] R-M9 web `done` 沒帶 `answer` 時保留佇列剩餘的字
- [x] R-M10 mobile fallback 縮到「確定沒送出」（`expo/fetch` 不可用、401）
- [x] R-M11 mobile 重新生成失敗時還原舊回答
- [x] R-M12 mobile 串流結束不強制拉回底部
- [x] R-M13 mobile `MessageBubble` memo + 穩定 callback

### 未修（Low，另開任務）

backend
- [x] 快取命中時 `lastTokenCount` 改記 0（退還預扣 token，次數仍扣）
- [x] 被中斷的請求補 `query_type='client_aborted'` 的 `ai_query_logs`（trace 帶 had_partial / streamed_chars / quota_refunded）；濫用仍只靠 IP 速率限制擋，若 log 顯示有人反覆停止再加對 abort 次數的限制
- [ ] `stream_options.include_usage` 只對 Workers AI 實測，GitHub Models 未驗證
- [ ] `addTokenUsage` 之後 `getUserRank` 失敗現已改為不退款（`.catch(() => null)`），但非串流路徑同樣情況仍會 refund + addTokenUsage 都執行
- [ ] 迴圈內答案在 output guard / 連結注入前就推給使用者（正常完成由 `done.answer` 覆蓋，只影響短暫顯示）
- [ ] `schema.sql` 的 `chat_sessions.user_id INTEGER` 與 `users.id TEXT` 不一致（照抄 0048，SQLite affinity 下可運作）
- [ ] 同一 session 並發 regenerate + 新問題時順序錯置（UI 有擋）

web
- [ ] `?session=<id>` 回 404 時靜默從空白開始，壞參數留在網址上
- [ ] `ChatWidget.tsx` 殘留無效的 `eslint-disable`（repo 用 Biome）；切換語系時建議問題不重抽
- [ ] `useChatSession` 的 sessions / quota 沒走 TanStack Query，widget 與 `/chat` 同時掛載時狀態不同步（延續舊做法）
- [ ] `chat/page.tsx` metadata 寫死中文（既有）
- [ ] 缺測試：串流中切換 session、載入中搶先送出、卸載後 callback、非串流路徑、`useChatAutoScroll`
- [ ] `askAIStream` 的 `try/catch` 同時包住 callback 呼叫，callback 丟例外會被當成壞行吞掉；串流結尾 buffer 殘餘與 `decoder` flush 未處理
- [ ] 串流走原生 fetch 不經 axios 401 refresh，token 過期顯示成通用錯誤
- [ ] `createChatSession` 進行中按停止 / 新對話會留下空 session；429 擋在第一問也會
- [ ] `loadSessionsPage` / `getMyQuota` 沒有登出保護；widget 配額顯示未判斷 `isAuthenticated`
- [ ] 全頁未登入時點建議問題沒有反應
- [ ] `handleOpenHistory` 先 await 再切面板，網路慢時沒有回饋
- [ ] `done` 之後再來的事件仍會套用到已完成的訊息（後端目前不會這樣送）

mobile
- [ ] `ask.ts` 的 `!response.body` 分支帶 `status: 200`，若命中會誤判為可 fallback；建議刪掉
- [ ] 4xx 後孤兒 user 訊息仍會進 `chat_history`，形成連續兩則 user（Anthropic / Google 對此敏感）
- [x] 串流中按「清除」：後端 abort 收尾可能把 stopped 訊息寫進已刪除的 session → 已在寫入前加 session 存在檢查
- [ ] `canRegenerateMessage` 註解與實際不符：SSE error / 思考階段斷線的錯誤泡泡其實可安全重新生成
- [ ] `askAI` 的 fallback 分支與 hook 已補部分測試，仍缺 hook 層測試

