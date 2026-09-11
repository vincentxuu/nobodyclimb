# Services 架構重新設計

> 2026-09-11 規劃，尚未開工。接在 `16-agent-first-architecture.md` 之後。
> v2：參考 Claude Code、Codex、Pi、OpenCode、looplane、OMP 六家 agent 架構後修正。
> v3：整合垂直領域 agent 研究結論（`18-vertical-domain-agent-research.md`）。

## 問題

現在 `backend/src/services/` 是扁平結構，所有東西放在同一層：

```
services/
├── agent/              ← Agent loop + 工具
├── ai-graph/           ← LangGraph 編排
├── pipeline/           ← PipelineEngine 編排
├── tools/              ← 共用工具（Phase 1 抽出來的）
├── query/              ← 入口路由 + 底層函式庫（混在一起）
├── recommendation.ts   ← 推薦服務
├── ai-training.ts      ← AI 訓練計畫
├── personalization.ts  ← 個人化 prompt
├── text-to-sql.ts      ← SQL 生成
├── weather.ts          ← 天氣查詢
├── evolution.ts        ← 攀登進化追蹤
├── memory-extractor.ts ← 記憶萃取
├── embedding.ts        ← 向量化
├── tool-registry.ts    ← pipeline 工具註冊
└── ...其他
```

問題：
1. **query/ 身兼兩職**：既是入口路由（QueryService.ask），又是底層函式庫（retrieval、documents、nlp），名字也暗示「查詢」是唯一用途
2. **領域服務散落**：recommendation、ai-training、weather 各自獨立檔案，沒有跟 Agent 工具對齊
3. **工具與服務脫鉤**：Agent 的 `tools/search-routes.ts` 直接呼叫 `tools/hybrid-search.ts` + `query/nlp.ts`，沒有經過任何領域服務
4. **擴展方向受限**：如果要加教練、訓練計畫生成、攀登分析等新能力，沒有清楚的放置位置

## 目標

Agent 不只是問答機器人，它是攀岩領域 Agent。查詢只是其中一種能力，推薦、教練、數據分析、訓練計畫都是平行的服務。架構應該反映這個方向。

## 業界參考

六家 agent 的架構分析：

| 層 | Claude Code | Codex | Pi | OpenCode | looplane | OMP |
|---|---|---|---|---|---|---|
| 入口 | `query/` | `codex_thread` | `agent/agent-loop` | `agent.ts` | `agent/runner` | `packages/agent` |
| 工具定義 | `tools/XxxTool/` 每個一目錄 | `tools/handlers/` 扁平 | `core/tools/` 扁平 | `.opencode/tool/` | `tooling/` 扁平 | `.omp/tools/` |
| 工具執行 | `services/tools/` | `tools/orchestrator` | `core/tools/index` | 無獨立層 | `tooling/executor` | 無獨立層 |
| 服務層 | `services/` 扁平目錄 | 無 | `core/` 扁平 | `packages/core/` | 無 | `crates/` |

**共通模式**：
- 工具定義扁平排列，不按領域分目錄
- 工具跟 agent 放一起（Claude Code 的 `tools/`、Pi 的 `coding-agent/core/tools/`）
- 服務層扁平，每個 service 一個檔案或一個小目錄
- 沒有人用 `capabilities/` 或三層嵌套

**我們與 coding agent 的差異**：
這些都是通用 coding agent，只有一個領域。我們是垂直領域 agent，有多個不相關的業務模組（搜尋 vs 天氣 vs 教練 vs 推薦），但不需要因此建深層嵌套，扁平 + 命名分群就夠了。

## 目標結構

```
services/
├── agent/                    ← Agent 核心（不動）
│   ├── agent-loop.ts         ← while loop
│   ├── registry.ts           ← 工具註冊
│   ├── classifier.ts         ← 零 LLM 快速分流
│   ├── guards.ts             ← output guards
│   ├── resilience.ts         ← retry + fallback + circuit breaker
│   ├── cache.ts              ← KV 快取
│   ├── tracker.ts            ← token 追蹤
│   ├── types.ts              ← ToolContext, Tool, AgentResult
│   └── tools/                ← Agent 工具定義（薄呼叫層，保留在 agent 裡）
│       ├── search-routes.ts  ← 呼叫 tools/hybrid-search + core/nlp
│       ├── search-crags.ts
│       ├── recommend.ts      ← 呼叫 tools/hybrid-search + domain/recommendation
│       ├── sql-query.ts      ← 呼叫 domain/text-to-sql
│       ├── weather.ts        ← 呼叫 domain/weather
│       ├── user-profile.ts
│       ├── crag-info.ts
│       └── index.ts          ← createToolRegistry()，條件式註冊
│
├── tools/                    ← 共用檢索/排名工具（不動，已驗證）
│   ├── hybrid-search.ts
│   ├── cross-encoder.ts
│   ├── mmr.ts
│   ├── popularity-rerank.ts
│   ├── parse-query.ts
│   ├── build-filters.ts
│   └── judge-answer.ts
│
├── core/                     ← 底層原語（現 query/ 裡的純函式搬過來）
│   ├── retrieval.ts          ← searchBM25, mergeResults, applyMMR
│   ├── documents.ts          ← getDocuments, extractTitle, buildExcerpt, buildUrl
│   ├── nlp.ts                ← extractGradeFilter, extractTypeFilter, extractLocationFilter
│   ├── llm.ts                ← generateHyDE, runJudge, parseQueryWithLLM
│   ├── filters.ts            ← buildFiltersFromParsed
│   ├── embedding.ts          ← EmbeddingService（現 embedding.ts）
│   └── config.ts             ← loadPipelineConfig, RAG_STRATEGIES
│
├── domain/                   ← 領域服務（現有散落的 service 檔案收攏）
│   ├── recommendation.ts     ← RecommendationService
│   ├── training.ts           ← AITrainingService
│   ├── personalization.ts    ← buildPersonalizedSystemPrompt, getRecentAscents
│   ├── text-to-sql.ts        ← TextToSqlService
│   ├── weather.ts            ← WeatherService
│   ├── evolution.ts          ← 攀登進化追蹤
│   └── memory.ts             ← extractMemoriesFromQuery
│
├── orchestrators/            ← Pipeline + ai-graph（過渡期，保留到退場）
│   ├── pipeline/
│   │   ├── engine.ts
│   │   └── steps/            ← 薄 wrapper，呼叫 tools/
│   └── ai-graph/
│       ├── graphs/
│       └── nodes/            ← 薄 wrapper，呼叫 tools/
│
└── entry.ts                  ← ai_mode 路由（現 query/index.ts）
```

## 設計原則

1. **工具跟 agent 放一起**。工具定義（prompt、parameters、formatResult）是 agent 專屬的，共用邏輯已在 tools/ 和 core/，agent 工具只是薄呼叫層。跟 Claude Code 和 Pi 的模式一致。

2. **服務層扁平**。domain/ 裡每個服務一個檔案，不分群不嵌套。新增服務就加一個檔案，不動目錄結構。

3. **core/ 是純函式庫**。沒有 class、沒有狀態、沒有 env 依賴（除了 embedding 和 config）。tools/ 包裝它們加上 env 存取和 trace。

4. **entry.ts 只做路由**。判斷 ai_mode → 呼叫 agent 或 orchestrator，不做任何業務邏輯。

5. **新增 Agent 能力的步驟**：
   - 建 `domain/xxx.ts`（業務邏輯）
   - 建 `agent/tools/xxx.ts`（工具定義，呼叫 domain/xxx）
   - 在 `agent/tools/index.ts` 註冊
   - 不動任何現有程式碼

## 搬遷計畫

### 要搬的檔案

| 現在位置 | 目標位置 | 類型 |
|---------|---------|------|
| `query/retrieval.ts` | `core/retrieval.ts` | 搬遷 |
| `query/documents.ts` | `core/documents.ts` | 搬遷 |
| `query/nlp.ts` | `core/nlp.ts` | 搬遷 |
| `query/llm.ts` | `core/llm.ts` | 搬遷 |
| `query/filters.ts` | `core/filters.ts` | 搬遷 |
| `query/config.ts` | `core/config.ts` | 搬遷 |
| `query/types.ts` | `core/types.ts` | 搬遷 |
| `query/plan-execute.ts` | `core/plan-execute.ts` | 搬遷 |
| `query/cache-log.ts` | `core/cache-log.ts` | 搬遷 |
| `query/index.ts` | `entry.ts` | 搬遷 + 改名 |
| `embedding.ts` | `core/embedding.ts` | 搬遷 |
| `recommendation.ts` | `domain/recommendation.ts` | 搬遷 |
| `ai-training.ts` | `domain/training.ts` | 搬遷 |
| `personalization.ts` | `domain/personalization.ts` | 搬遷 |
| `text-to-sql.ts` | `domain/text-to-sql.ts` | 搬遷 |
| `weather.ts` | `domain/weather.ts` | 搬遷 |
| `evolution.ts` | `domain/evolution.ts` | 搬遷 |
| `memory-extractor.ts` | `domain/memory.ts` | 搬遷 |
| `tool-registry.ts` | `orchestrators/tool-registry.ts` | 搬遷 |
| `pipeline/` | `orchestrators/pipeline/` | 搬遷 |
| `ai-graph/` | `orchestrators/ai-graph/` | 搬遷 |

### 不動的

- `agent/`（已經是對的位置）
- `tools/`（已經是對的位置）
- Agent 工具留在 `agent/tools/`

### 執行方式

一個 PR，用 `git mv` 搬遷 + 更新所有 import 路徑。純搬遷不改邏輯，行為零變更。
約 21 個檔案搬位置，估計 60+ 個 import 路徑要更新。

## 未來擴展：新 capability 範例

### 教練（coaching）

```
domain/training.ts          ← 已存在的 AITrainingService，加上新方法
agent/tools/coaching.ts     ← 新工具：suggest_training_plan, analyze_weakness
agent/tools/index.ts        ← registry.registerTool(coachingTool)
```

### 記憶（主動式）

```
domain/memory.ts            ← 已存在的 extractMemoriesFromQuery，加上 recall
agent/tools/memory.ts       ← 新工具：recall_memory, save_memory
```

### 路線規劃（未來）

```
domain/route-planning.ts    ← 新服務：多天行程規劃
agent/tools/route-plan.ts   ← 新工具：plan_trip
```

## 垂直領域 Agent 研究結論整合

> 詳細研究見 `18-vertical-domain-agent-research.md`，以下為影響架構設計的關鍵結論。

### 工具數量的紅線與應對

業界共識：**同時載入超過 8 個工具就是設計問題**。

| 工具數量 | 風險 | 應對 |
|---------|------|------|
| ≤ 8 | 可控 | 全部載入（我們現在：7 個） |
| 8–20 | LLM 選錯工具機率顯著上升 | Capability Manifest + routing classifier |
| 20+ | context window 被工具定義吃掉 40-50% | Tool Search / Agent-as-a-Tool |

**對我們的影響**：目前 7 個安全，但教練（coaching）、記憶（memory）、路線規劃（route-plan）加上去就會到 10+。不能等到超過才處理。

### Capability Manifest 模式

研究發現 MCP 的 `tools/list`、A2A 的 Agent Card、Skills 架構正在收斂成「Capability Manifest」標準。每個 capability 自帶觸發條件和 prompt fragment：

```typescript
// agent/tools/manifests.ts
export const TOOL_MANIFESTS = {
  search: {
    name: 'search',
    description: '搜尋攀岩路線和岩場',
    triggers: ['路線', '岩場', '搜尋', '找', '有哪些', '推薦路線'],
    tools: ['search_routes', 'search_crags'],
    promptFragment: '你可以搜尋台灣攀岩路線和岩場資料庫...',
    requiresAuth: false,
  },
  recommend: {
    name: 'recommend',
    description: '個人化路線推薦',
    triggers: ['推薦', '建議', '適合我', '下一條'],
    tools: ['recommend'],
    promptFragment: '你可以根據使用者的攀登歷史推薦路線...',
    requiresAuth: true,
  },
  weather: {
    name: 'weather',
    description: '查詢岩場天氣',
    triggers: ['天氣', '下雨', '適合攀岩嗎', '出門'],
    tools: ['weather'],
    promptFragment: '你可以查詢岩場天氣預報...',
    requiresAuth: false,
  },
  // ...
}
```

**實作步驟**（納入搬遷計畫 Phase A 之後）：
1. 定義 `ToolManifest` 型別
2. 每個工具補上 manifest
3. `createToolRegistry()` 改為接受 manifest 列表，條件式註冊
4. system prompt 從 manifest 的 `promptFragment` 動態組裝

### Agent-as-a-Tool（sub-agent 模式）

AWS Strands SDK 推廣的模式。當 capability 需要自己的推理能力時，把它包成 sub-agent：

```
orchestrator agent（7 個基礎工具 + 2 個 sub-agent 工具）
├── search_routes, search_crags, sql_query, weather, ...  ← 直接工具
├── recommend_agent  ← sub-agent，自帶推薦專屬 system prompt + 工具
└── coaching_agent   ← sub-agent，自帶教練專屬 system prompt + 工具
```

**好處**：每個 sub-agent 有獨立的 context，不會互相污染。orchestrator 只需要知道「何時呼叫推薦 agent」，不需要知道推薦邏輯。

**時機**：等 capability 超過 10 個且出現 LLM 選錯工具的問題時再引入。現在不需要。

### System Prompt 動態組裝

研究發現生產系統的 system prompt 分四層：

| 層 | 內容 | 更新頻率 |
|---|---|---|
| 靜態層 | identity、rules、few-shot | 部署時 |
| Session 層 | user profile、capability context | 每 session |
| Turn 層 | conversation state、RAG results | 每輪 |
| Conditional 層 | tool results、capability prompt fragments | 條件式 |

**對我們的影響**：目前 `buildAgentBasePrompt()` 是靜態模板 + 工具描述。需要改成：
- 靜態層：攀岩助理人設 + 硬規則
- Session 層：使用者個人化（`buildPersonalizedSystemPrompt` 已有）
- Turn 層：已有（chat history 注入）
- Conditional 層：**缺**。應該根據啟用的 capability manifest 動態注入 prompt fragment

### Domain Schema Adapter

VAA 框架指出垂直領域 agent 需要統一的 domain schema 轉換層。攀岩領域有：
- 難度系統：V-scale（抱石）、Font（歐洲）、YDS（美國）、grade_numeric（內部數值）
- 座標格式：岩場位置
- 攀登記錄結構：ascent_type、style

這些目前散在 `query/nlp.ts`（gradeToNumeric、gradeToPosition）和各個工具裡。

**建議**：在 `domain/` 或 `core/` 建一個 `climbing-schema.ts`，集中管理：
```typescript
export function normalizeGrade(input: string): { system: 'yds' | 'v-scale' | 'font'; numeric: number; display: string }
export function gradeRange(center: number, spread: number): { $gte: number; $lte: number }
export function parseRouteType(input: string): 'sport' | 'trad' | 'boulder' | 'mixed'
```

## 演進路線（整合研究結論後）

```
Phase A（近期）：目錄搬遷
  query/ → core/ + entry.ts
  散落 service → domain/
  純搬遷，不改邏輯
      ↓
Phase B（短期）：Capability Manifest + 動態 Prompt
  為每個工具定義 manifest（triggers、promptFragment）
  createToolRegistry() 改為 manifest-driven
  system prompt 改為動態組裝
  climbing-schema.ts 統一領域知識
      ↓
Phase C（中期）：Dynamic Tool Loading
  classifier 先分類查詢意圖
  只載入相關 capability 的工具（從 7 全載入 → 按需 3-5 個）
  為 10+ 工具的未來做準備
      ↓
Phase D（長期）：Agent-as-a-Tool
  推薦、教練升級為 sub-agent
  每個 sub-agent 有獨立 context + 專屬 system prompt
  orchestrator 只管 routing
      ↓
Phase E（更遠）：MCP Server 分離
  純工具型 capability 封裝成 MCP server
  支持第三方 capability 接入
```

Phase A 和 B 可以在同一季做完。Phase C 在工具數量接近 10 時觸發。Phase D 和 E 視產品方向決定。
