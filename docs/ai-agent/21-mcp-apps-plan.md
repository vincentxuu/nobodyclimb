# MCP Apps 互動卡片規劃

> 狀態：規劃中（2026-10-20）｜尚未開 OpenSpec change，定案後再拆 `openspec/changes/add-mcp-apps/`

## 一句話

把岩場、路線、天氣做成 **MCP Apps 互動卡片**（SEP-1865）：使用者在 Claude、ChatGPT、VS Code 等 AI 對話裡問「這週末去龍洞好嗎」，對話中直接出現一張可以切日期、篩路線的岩場卡。先做對外的唯讀 MCP server，再決定自家 AI 對話要不要也顯示這些卡片。

## 為什麼做

- **曝光管道**：Claude（web／Desktop／iOS）、ChatGPT、VS Code Copilot 都已支援 MCP Apps（[官方支援表](https://modelcontextprotocol.io/extensions/apps/overview)）。做一次 server，多個 AI 產品都能用，使用者不用先來我們網站。
- **資料剛好適合**：岩場、路線、天氣都是結構化資料，已有公開 API，做成卡片比純文字好讀得多。
- **省 token**：卡片 HTML 是固定模板，模型只產生工具參數；使用者在卡上切日期、篩難度時，卡片直接呼叫工具，不經過模型。

## MCP Apps 怎麼運作

```
使用者問「龍洞這週末適合爬嗎」
  → 模型呼叫工具 get_crag_conditions(crag="龍洞")
  → MCP server 回傳：
      content           純文字摘要（給模型讀，也是不支援卡片時的備援）
      structuredContent 岩場、天氣、熱門路線 JSON（給卡片用）
      工具定義的 _meta.ui.resourceUri = "ui://nobodyclimb/crag-card"
  → 對話產品（host）讀 ui:// 資源拿到卡片 HTML，放進沙箱 iframe，把資料傳進去
  → 使用者在卡上點「週六」「5.10–5.11」
  → 卡片透過 host 呼叫 list_crag_routes（只給卡片用的工具），更新畫面
```

官方 SDK 與規格重點（2026-10-20 查證）：

| 項目 | 內容 | 來源 |
|---|---|---|
| SDK | `@modelcontextprotocol/ext-apps` 2.0.3；server 端需 `@modelcontextprotocol/server` v2（不是舊的 `@modelcontextprotocol/sdk`）、`zod ^4.2` | [npm](https://registry.npmjs.org/@modelcontextprotocol/ext-apps)、[repo](https://github.com/modelcontextprotocol/ext-apps) |
| Server API | `registerAppTool(server, name, config, cb)`、`registerAppResource(server, name, uri, config, read)`、`RESOURCE_MIME_TYPE = "text/html;profile=mcp-app"` | [API 文件](https://apps.extensions.modelcontextprotocol.io/api/modules/server-helpers.html) |
| 卡片端 API | `new App(...)`；先設 `ontoolresult` 等 handler 再 `connect()`；`callServerTool`、`openLink`、`sendMessage`、`updateModelContext` | 同上 |
| 只給卡片用的工具 | 工具 `_meta.ui.visibility: ["app"]`：模型看不到，卡片可以呼叫 | [規格](https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx) |
| CSP | 資源 `contents[]._meta.ui.csp`：`connectDomains`、`resourceDomains`；沒宣告的網域一律擋 | 同上 |
| Cloudflare 部署 | `createMcpHandler`（`agents/mcp/server`）無狀態、不需 Durable Object；`McpAgent` 已 deprecated | [Cloudflare 文件](https://developers.cloudflare.com/agents/model-context-protocol/apis/handler-api/) |
| Claude 接入 | Streamable HTTP；**允許免登入（authless）**；server 要能從 Anthropic IP 連到 | [Claude 文件](https://claude.com/docs/connectors/building/authentication) |

## 現況（2026-10-20 盤點）

| 面向 | 現況 | 位置 |
|---|---|---|
| MCP server | **沒有**。任何 `package.json` 都沒有 `@modelcontextprotocol/*`、`agents` | — |
| 公開唯讀 API | 岩場、路線、區域、岩館、搜尋、天氣都有，GET 免登入 | `backend/src/routes/crags.ts:83-673`、`gyms.ts`、`search.ts:22`、`weather.ts:36,75` |
| 天氣 | 中央氣象署 CWA，需 `CWA_API_KEY`，沒設回 503；回傳含 `forecast[]` | `backend/src/routes/weather.ts:20-32`、`packages/types/src/content.ts:448` |
| 使用者寫入 API | `POST /ascents`、`POST /bucket-list`、`goals`、`training` 都要 JWT | `ascents.ts:330`、`bucket-list.ts:536` |
| 登入 | 自家 JWT（jose）＋Google 登入；**沒有 OAuth 授權伺服器** | `backend/src/middleware/auth.ts`、`routes/auth.ts` |
| 自家 agent 的 MCP client | 手寫 JSON-RPC，只有 `tools/list`、`tools/call`；`initialize` 只在 health check 送、`capabilities: {}`；丟掉 `_meta`、`structuredContent`；沒有 `resources/read`；不處理 SSE 與 `Mcp-Session-Id` | `backend/src/services/agent/mcp/client.ts:9-89` |
| 工具快照 | `tool_snapshot` 只存 name／description／inputSchema，`_meta.ui` 會在同步時遺失 | `services/agent/mcp/registry.ts:80-168`、`migrations/0078_mcp_plugins.sql` |
| 結果轉文字 | 只留 `type === 'text'`，上限 3000 字 | `services/agent/mcp/adapter.ts:15,24-34` |
| 前端對話 | SSE 事件只有 token／progress／done，沒有卡片類型；沒有 iframe／sandbox 程式 | `routes/ai.ts:121,302`、`apps/web/src/lib/chat/messages.ts:23-36`、`components/ai/ChatMessage.tsx` |

結論：**對外 server（階段 1）不用動現有 agent**，可以獨立做。讓自家對話也顯示卡片（階段 3）要改 client、資料表、SSE、前端四層。

## 卡片元件架構：schema 先行，一份元件兩種輸出

一個工具結果有三種去處：給模型讀的純文字、站內對話的卡片、外部 AI 的 MCP App 卡片。三者共用**同一份資料格式**，畫面只寫一次 React 元件，不為了共用而在站內也走 iframe。

```
packages/cards/
  src/schemas/crag-card.ts                ← zod 4 schema：工具結果的唯一正本（見下方 zod 版本）
  src/CragCard.tsx                        ← 純展示 React 元件，只吃符合 schema 的 props
  src/mcp-app/crag-card.tsx               ← 薄包裝：ext-apps 的 React 入口接資料 → <CragCard>
  styles/cards.css                        ← 卡片自帶、編譯好的樣式
apps/mcp/                                 ← 階段 1 的 MCP Worker：工具回傳 schema 資料，資源回傳打包好的單一 HTML
```

| 用在哪 | 怎麼畫 |
|---|---|
| 外部 AI（Claude、ChatGPT） | `src/mcp-app/*` 用 Vite 打成單一 HTML 檔，當成 `ui://` 資源 |
| 站內對話（階段 3） | 依工具名稱對應元件（`crag_card` → `<CragCard>`），直接 import，不經過 iframe |
| 不支援卡片的地方 | 工具的 `content` 純文字摘要 |

為什麼這樣做：

- **主流框架對自家工具介面都是這樣處理**：AI SDK 的 generative UI 依工具 part 畫 React 元件（`apps/web` 已裝 `ai`）。沙箱 iframe 是給不可信的第三方程式碼用的，自家元件不需要。
- **官方 SDK 支援 React 包裝**：`@modelcontextprotocol/ext-apps` 有 `./react` 匯出，同一個元件可以包成 MCP App，不用另寫一份 HTML。
- **只有 schema 是正本**：MCP Worker、站內元件、MCP App 包裝都對同一份 schema 驗證，改欄位時三處一起報型別錯誤。

元件規則：

1. **純展示**：只吃 props，不直接打 API、不讀 Zustand store。互動（切日期、篩難度、翻頁）透過 `onAction` 回呼往外丟。站內版本接自家 API，MCP App 版本接 `app.callServerTool`。
2. **樣式自帶**：iframe 讀不到 `apps/web` 的 Tailwind 設定。卡片用自己的編譯後 CSS（`styles/cards.css`），站內與 iframe 才會長得一樣；顏色沿用 `docs/color-system.md` 的色票。
3. **純文字摘要必備**：沒有卡片時資訊也要完整。
4. **寫入要在卡上確認**（階段 2）：卡片先顯示預覽，使用者按確認才呼叫寫入工具；寫入工具設 `visibility: ["app"]`。
5. **套件慣例**：照 project-rules，apps 吃 `packages/*` 的 `dist`，改完要重 build（`add-shared-code` skill）。

**待決定：zod 版本。** ext-apps 要 zod ^4.2，`apps/web` 與 `packages/schemas` 目前是 zod 3。選項：(a) 卡片 schema 單獨放 `packages/cards` 用 zod 4，站內只用它推導出的 TypeScript 型別；(b) 整個 monorepo 升 zod 4。建議先 (a)，不擴大這次的範圍。

## 階段 1：公開唯讀 MCP server（建議先做）

### 部署形態

**建議：獨立 Worker `nobodyclimb-mcp`，用 service binding 呼叫既有 `nobodyclimb-api`。**

| 選項 | 優點 | 缺點 |
|---|---|---|
| **獨立 Worker（建議）** | 新依賴（`agents`、MCP SDK v2、zod 4）不進主 API bundle；壞了不影響主站；可獨立限流與部署 | 多一份 wrangler 設定與 deploy workflow |
| 掛在主 API 的 `/mcp` 路由 | 少一個部署單位 | 主 API 目前用 zod 3（`hono-openapi`），ext-apps 要 zod ^4.2，混在一起風險高 |

- 位置：`apps/mcp/`（pnpm workspace 新 app），卡片元件與 schema 放 `packages/cards`（見「卡片元件架構」）。
- 資料一律打既有公開 API（service binding），不直接讀 D1，避免同一份查詢邏輯寫兩次。
- 網域：待定（例如 `mcp.nobodyclimb.cc/mcp`）。
- 卡片 HTML：`packages/cards` 的 MCP App 包裝用 Vite 打成單一 HTML 檔（JS／CSS inline），build 時嵌進 Worker，`registerAppResource` 的 read callback 直接回傳字串。

### 工具與卡片

| 工具 | 給誰用 | 輸入 | 對應 API | 卡片 |
|---|---|---|---|---|
| `find_crags` | 模型＋卡片 | `region?`、`climbing_type?`、`keyword?` | `GET /crags`、`GET /search?type=crags` | **岩場清單卡**：封面、地區、岩質、難度範圍、路線數；點一張 → 呼叫 `get_crag_conditions` |
| `get_crag_conditions` | 模型＋卡片 | `crag`（id／slug／名稱） | `GET /crags/slug/:slug`、`GET /weather/coordinates`、`GET /crags/:id/routes` 前 N 條 | **岩場卡**：天氣（今天到後天切換、降雨機率、濕度）、最佳季節、步行時間、熱門路線 |
| `list_crag_routes` | **只給卡片**（`visibility: ["app"]`） | `crag_id`、`grade_min?`、`grade_max?`、`type?`、`page?` | `GET /crags/:id/routes` | 岩場卡內的路線篩選器（難度、類型、分頁） |
| `find_gyms` | 模型＋卡片 | `city?`、`keyword?` | `GET /gyms` | **岩館卡**（第二批再做） |

設計原則：

- 每個工具的 `content` 都要有完整的純文字摘要。不支援卡片的 host（例如自家現有 agent）只看得到這段，必須能獨立讀懂。
- `structuredContent` 放卡片需要的欄位就好，不整包轉傳 API 回應；工具結果要遠低於 Claude 的約 15 萬字上限。
- 卡片上的「看完整頁面」用 `openLink` 開 `nobodyclimb.cc` 對應頁，把流量導回站上。
- CSP：卡片資料都從工具結果來，不需要 `connectDomains`；岩場封面圖要把 R2 圖片網域加進 `resourceDomains`（網域待確認）。

### 防濫用

- 免登入公開 server，任何人都能打。在 Worker 依 IP 或 `Origin` 做每日限流（KV），超過回工具錯誤，不回 HTTP 500。
- 天氣走 CWA 有呼叫額度：同一座標的天氣在 Worker 端快取 30 分鐘。
- 不暴露任何需要 JWT 的 API；階段 1 完全唯讀。

### 驗收

1. 本機用 MCPJam 或 ext-apps repo 的範例 host 連 `http://localhost:8787/mcp`：三支工具都列得出來，岩場卡顯示得出來，切日期與篩難度不經過模型。
2. 部署 preview 後在 Claude 加成自訂 connector（authless）：問「龍洞這週末天氣適合攀岩嗎」會出現岩場卡；在 Claude iOS 也能正常顯示。
3. 不支援卡片的 host：只顯示純文字摘要，內容完整。
4. 超過限流：回可讀的工具錯誤。

### 待查（實作前先確認）

- ext-apps 的 `registerAppTool` 掛在 `createMcpHandler` 工廠產生的 `McpServer` 上能不能正常運作：型別上相容（都用 `@modelcontextprotocol/server` v2），但還沒實測。版本對齊 `agents` 內建的 `@modelcontextprotocol/server` 2.3.1。
- 無狀態模式下 `getUiCapability` 拿不拿得到 client 能力：官方 client matrix 提到新版改成每次請求帶 `_meta`。保險做法是**一律註冊卡片工具**，靠 `content` 純文字當備援，不依賴能力協商。

## 階段 2：需要登入的寫入卡片（之後再評估）

| 卡片 | 用途 | 對應 API |
|---|---|---|
| 快速記錄攀登 | 「我今天完攀了 XX」→ 預填表單，使用者在卡上確認才送出 | `POST /ascents` |
| 加入願望清單 | 岩場卡上的按鈕 | `POST /bucket-list`（需先有 biography，否則 404） |
| 個人統計卡 | 難度分布、月份趨勢、切換年份 | `GET /ascents/stats?year=` |

卡關點：**我們沒有 OAuth 授權伺服器**，外部 host 要代表使用者呼叫就必須有。候選做法是 Cloudflare 的 `@cloudflare/workers-oauth-provider` 包在 MCP Worker 外層，登入頁沿用既有 Google 登入（實作前需查官方文件確認）。寫入卡片一律「卡片顯示預覽 → 使用者按確認 → 才呼叫寫入工具」，寫入工具設 `visibility: ["app"]`，不讓模型直接寫。

## 階段 3：自家 AI 對話顯示卡片（先決定要不要做）

分成兩件事，難度差很多：

**3a. 自家卡片（建議做）**：沿用上面的「卡片元件架構」，站內直接 import `packages/cards` 的元件。

- agent 呼叫自家工具時，在 `POST /ai/ask` 送新的 SSE 事件 `{"type":"card", card, data}`（`data` 符合 schema）。
- `ChatMessageData` 加 `cards` 欄位，`ChatMessage.tsx` 與 `ChatClient.tsx` 依 `card` 名稱對應元件。
- 對話紀錄要存卡片資料，重新整理後卡片還在。
- 不需要沙箱、不需要改 MCP client。

**3b. 第三方 MCP server 的卡片（有需要才做）**：admin 可以接外部 MCP server（`/admin/ai/mcp`），要讓那些 server 的卡片在站上顯示，才需要做完整的 MCP Apps host。四層都要改：

| 層 | 要改什麼 |
|---|---|
| MCP client | `initialize` 宣告 `capabilities.extensions["io.modelcontextprotocol/ui"] = { mimeTypes: ["text/html;profile=mcp-app"] }`、送 `notifications/initialized`、保存 `Mcp-Session-Id`、處理 SSE 回應；保留 `_meta`、`structuredContent`；新增 `resources/read`。建議直接換成官方 `@modelcontextprotocol/client` v2，不再擴充手寫 client |
| 資料表 | `tool_snapshot` 加 `meta` 欄位存工具的 `_meta`（新 migration，`0084`，`schema.sql` 同步改） |
| 串流 | `POST /ai/ask` 新增 SSE 事件 `{"type":"ui_resource", tool, resource_uri, html, structured_content}`；對話紀錄也要存，重新整理後卡片還在 |
| 前端 | `ChatMessageData` 加卡片欄位；新增卡片元件，依規格用**雙層 iframe**：外層 sandbox proxy 放在**不同網域**（例如 `cards.nobodyclimb.cc`），內層套 CSP；卡片發起的 `tools/call` 打新後端路由 `POST /ai/mcp-apps/call`，驗證使用者、server 有啟用、工具 `visibility` 含 `app` 才轉送 |

Mobile 另外評估：用既有的 `react-native-webview` 當卡片 host，但沙箱與 CSP 行為要重新驗。

## 不做

- 不在階段 1 開放任何寫入。
- 不讓模型直接呼叫寫入工具。
- 不在主 API Worker 混用 zod 3 與 zod 4。

## 待決定

1. MCP server 網域與 Worker 名稱。
2. 階段 1 卡片範圍：只做岩場（`find_crags`＋`get_crag_conditions`＋`list_crag_routes`），還是連岩館一起。
3. 要不要申請上架 Claude connector 目錄（上架有額外審核要求，需另查）。
4. 卡片 schema 的 zod 版本：建議只在 `packages/cards` 用 zod 4（見「卡片元件架構」）。
5. 階段 3b（第三方卡片 host）要不要做；3a 自家卡片沿用共用元件即可。

## 相關文件

- [`01-architecture.md`](./01-architecture.md)：AI 系統架構
- [`04-frontend-integration.md`](./04-frontend-integration.md)：前端整合
- [`16-agent-first-architecture.md`](./16-agent-first-architecture.md)：agent-first 重構計畫
- [`20-chat-optimization.md`](./20-chat-optimization.md)：對話 SSE 與配額
- `openspec/changes/add-ai-harness-byok/`、`openspec/changes/react-agent/`
