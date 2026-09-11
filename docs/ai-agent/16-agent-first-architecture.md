# Agent-First 架構重構規劃

> 2026-09-11 規劃，尚未開工

## 目標

將 AI 問答從「RAG pipeline 為主、Agent 是策略之一」改為「Agent loop 為主、RAG 是 Agent 可用的工具」。
同時把三套引擎（PipelineEngine、ai-graph、react-agent）底層重複的能力統一抽成共用工具模組，讓兩種模式共用同一組工具。

## Pipeline 與 Agent 的真正差異

Pipeline 並非「一律跑完整流程」。tool-selection 步驟會先用 LLM 分類查詢意圖：
general_knowledge 會跳過檢索直接 earlyReturn、sql 走 text-to-sql、simple 跳過 HyDE 用 simple_model、
低信心查詢（< 0.7）強制降回 general_knowledge。auto 策略還能依 strategy_hint 動態選路徑。

核心差異是 **分支決策的時機**：

| | Pipeline | Agent |
|---|---|---|
| 流程分支時機 | tool-selection 一次性分類，後續照走 | 每輪重新判斷 |
| 簡單問題 | earlyReturn，不浪費 | 同樣一兩步結束 |
| 複雜問題 | auto 可動態選策略，但選完是固定路徑 | 可中途切換工具、迭代搜尋 |
| 搜尋不夠時 | self-reflection 可觸發一次 loopBack | 可自行決定再搜幾次、換方式 |
| 可預測性 | 高（分支條件預先設計） | 低（依 LLM 即時判斷） |
| 成本可預測性 | 高（路徑決定後可估） | 低（回合數與工具呼叫數動態） |
| orchestrator 開銷 | 無（流程由設定驅動） | 每輪都要 orchestrator LLM 判斷 |

兩者不是「笨 vs 聰明」的升級關係，是取捨：
- **Pipeline**：行為可預測、成本可控，適合確定性高的場景
- **Agent**：靈活、可迭代，適合工具面廣（天氣 + SQL + 檢索混用）或需要多輪推理的場景

保留雙軌讓你可以依場景選擇，Agent 失敗時也能自動 fallback 到 pipeline。

## 現況問題

1. **Agent 與 RAG 互斥**：`rag_strategy = react` 提早分支，完整 RAG 管線（HyDE、BM25 hybrid、rerank、diversity、judge）在 Agent 模式下沒用到
2. **三份重複實作**：`pipeline/steps/` (15 個)、`ai-graph/nodes/` (27 個)、`react-agent/tools/` (7 個) 三層都呼叫 `QueryService` 方法，但各自包裝
3. **命名混淆**：模組叫 `react-agent`，但它就是標準 loop agent，跟 React 框架撞名，跟業界慣例不符
4. **策略白名單不一致**：已由 PR #391 修復，但底層架構問題仍在

## 分階段清單

---

### Phase 0：改名（純 refactor，零行為變更）

**分支**：`refactor/rename-react-agent-to-loop-agent`

#### 0-1. 目錄改名

| 原路徑 | 新路徑 |
|--------|--------|
| `backend/src/services/react-agent/` | `backend/src/services/agent/` |
| `apps/web/src/app/[locale]/admin/ai/react-agent/` | `apps/web/src/app/[locale]/admin/ai/agent/` |
| `docs/react-agent/` | 併入 `docs/ai-agent/` |

#### 0-2. 函式 / 型別改名

| 原名 | 新名 | 檔案 |
|------|------|------|
| `runReactAgent` | `runAgent` | `agent/index.ts`, `query/index.ts` |
| `runReactLoop` | `runAgentLoop` | `agent/engine.ts` → `agent/agent-loop.ts` |
| `ReactAgentResult` | `AgentResult` | `agent/types.ts` |
| `ReactAgentOptions` | `AgentOptions` | `agent/types.ts` |
| `ReactConfig` | `AgentConfig` | `agent/index.ts` |
| `loadReactConfig` | `loadAgentConfig` | `agent/index.ts` |
| `RunReactAgentParams` | `RunAgentParams` | `agent/index.ts` |
| `buildReactAgentBasePrompt` | `buildAgentBasePrompt` | `utils/ai-prompts.ts` |
| `ReactAgentPage` | `AgentPage` | `admin/ai/agent/page.tsx` |

#### 0-3. 外部引用修正（共 6 處）

- `backend/src/services/query/index.ts` — import 路徑、`modelUsed` 值
- `backend/src/utils/ai-prompts.ts` — 函式名
- `apps/web/src/components/admin/admin-sidebar.tsx` — href 與 label
- `apps/web/src/components/admin/ai-settings/sections.ts` — 策略 label 文字

#### 0-4. DB config key 改名（暫不做）

以下 key 留到 Phase 2 的 migration 一併處理，程式碼加 `// TODO: Phase 2 rename to agent_*` 註解：

- `react_max_turns` → `agent_max_turns`
- `react_token_budget` → `agent_token_budget`
- `react_usd_to_twd` → `agent_usd_to_twd`
- `react_models` → `agent_models`
- `rag_strategy` 值 `'react'` → `'agent'`

#### 0-5. 驗證

- [ ] `pnpm lint` 通過
- [ ] `pnpm typecheck` 通過
- [ ] `cd backend && npx vitest run` 既有測試通過（routing 那兩條 pre-existing failure 除外）
- [ ] grep 確認 `react-agent`、`ReactAgent`、`reactAgent` 零殘留（DB key 除外）

---

### Phase 1：共用工具層抽取（絞殺式，一個工具一個 PR）

**目標**：把 `QueryService` 的方法抽成符合 `Tool` 介面的模組，放 `backend/src/services/tools/`

#### 1-0. 工具契約定義

擴充現有 `Tool` interface（`agent/types.ts`）：

```typescript
// ToolContext 瘦身：移除 queryService，改為直接依賴
interface ToolContext {
  env: Env
  userId: string | null
  locale: string
  models: ModelMap
  config: PipelineConfig
  prompts: Record<string, string>
  langfuseTrace?: LangfuseParent | null
  tracker: TokenTracker
  cache: AgentCache
  availableTools: string[]
}

// execute 回傳加結構
interface ToolOutput<T = unknown> {
  output: T
  usage?: { prompt_tokens: number; completion_tokens: number }
  trace?: Record<string, unknown>
}

// formatResult 變選配（Agent 需要，node/step 不需要）
interface Tool {
  name: string
  tags: string[]
  parameters: Record<string, unknown>
  execute(input: unknown, ctx: ToolContext): Promise<ToolOutput>
  formatResult?(raw: ToolOutput): ToolResult  // Agent 用
  prompt?(ctx: ToolContext): string            // Agent 用
  // ... 其他 meta（cacheTTL, concurrencySafe 等）
}
```

#### 1-1 ~ 1-N. 逐個抽取（依價值排序）

每個 PR 的動作相同：建工具 → node/step 改為呼叫工具 → 刪 QueryService 對應方法 → 跑測試

**優先序原則**：先做讓 Agent 能用管線級檢索品質的工具，再做 Agent 可以自己替代的能力。

| PR | 工具名 | 包裝的 QueryService 方法 | 呼叫點數 | 備註 |
|----|--------|-------------------------|---------|------|
| 1-1 | `hybrid_search` | `searchBM25`, `mergeResults`, `embed`, 向量查詢 | 5 | **最高價值**：讓 Agent 從純向量升級到 BM25+向量+RRF。帶 `mode` 參數（vector / bm25 / hybrid）。同時定下工具契約作為範本 |
| 1-2 | `rerank` | `applyMMR`, cross-encoder, popularity, personality | 4 | 配合 hybrid_search，兩個一起做 Agent 就有完整檢索能力。帶 `methods` 參數 |
| 1-3 | `parse_query` | `parseQueryWithLLM`（現 tool-selection） | 2 | 把 pipeline 的分類智慧給 Agent 用（general_knowledge earlyReturn、sql 偵測、低信心降級）。Agent 可在第一輪呼叫做分流 |
| 1-4 | `build_filters` | `extractLocationFilter`, `extractGradeFilter`, `extractTypeFilter`, `buildFiltersFromParsed` | 6 | 純 NLP，無 LLM，配合 hybrid_search 做精確篩選 |
| 1-5 | `expand_query` | `generateHyDE`, `generateMultipleQueries` | 4 | **跳過**：核心就一行 queryService 呼叫，wrapper 邏輯比共用邏輯多，抽了加碼 |
| 1-6 | `judge_retrieval` | retrieval quality judge | 2 | graph 獨有（無 pipeline 對應），暫不抽 |
| 1-7 | `judge_answer` | `runJudge` | 4 | ✅ 已完成 → `tools/judge-answer.ts` |
| 1-8 | `generate_answer` | `streamLLMGeneration` | 2 | **跳過**：pipeline 用 `env.AI.run`（含 Qwen3 特殊處理），graph 用 provider 抽象層，LLM 呼叫機制不同，硬抽會變成一堆分支 |
| 1-9 | `plan_execute` | `planQuery`, `executePlan`, `synthesize` | 1 | pipeline 獨有，暫不抽 |

Agent 原有七個工具（search_routes、search_crags、sql_query、weather、user_profile、recommend、crag_info）搬到同一個 `services/tools/` 目錄，但內容不動。

#### 1-X. 清理

- `QueryService` 縮成入口 + context 組裝，不再直接持有業務方法
- `PipelineEngine` 的 step 與 `ai-graph` 的 node 都變成薄 wrapper：判斷跳過條件 → 呼叫工具 → 寫回 state

---

### Phase 2：ai_mode 路由 + DB migration + UI 重排

**分支**：`feature/ai-mode-routing`

#### 2-1. 新設定 `ai_mode`

`ai_mode` 不是「笨 vs 聰明」的升級，是選擇由誰編排同一組工具。

```sql
-- migration: 00NN_ai_mode.sql
INSERT OR IGNORE INTO ai_config (key, value)
  VALUES ('ai_mode', CASE
    WHEN (SELECT value FROM ai_config WHERE key = 'rag_strategy') = 'react'
    THEN 'agent'
    ELSE 'pipeline'
  END);

-- 同時改名 react_* → agent_*
UPDATE ai_config SET key = 'agent_max_turns'    WHERE key = 'react_max_turns';
UPDATE ai_config SET key = 'agent_token_budget' WHERE key = 'react_token_budget';
UPDATE ai_config SET key = 'agent_usd_to_twd'   WHERE key = 'react_usd_to_twd';
UPDATE ai_config SET key = 'agent_models'        WHERE key = 'react_models';
```

schema.sql 新環境預設 `ai_mode = 'agent'`。

#### 2-2. 路由邏輯（`query/index.ts`）

```
ai_mode
├── 'agent'  → runAgent()
│     Agent 會依需要呼叫 hybrid_search、rerank、parse_query 等共用工具
│     後台 agent_tool_* 開關控制允許哪些工具
└── 'pipeline' → 看 use_langgraph_engine
      ├── true  → runAIGraph()（策略由 rag_strategy 決定）
      └── false → PipelineEngine.run()
```

Agent 失敗時 fallback 到 pipeline baseline（沿用現有邏輯）。

#### 2-3. Agent 繼承 pipeline 的分流智慧

pipeline 的 tool-selection 分流邏輯（general_knowledge earlyReturn、sql 偵測、低信心降級、信心三層）
不該丟掉。做法：

1. `parse_query` 工具（Phase 1-3）同時服務兩邊：pipeline 照現在用，Agent 可在第一輪先呼叫做分類
2. Agent 的 classifier（零 LLM 分流打招呼和通用知識）保留，作為 `parse_query` 之前的免費快速路徑
3. Agent prompt 裡加入指引：「對簡單問題不需要呼叫檢索工具，直接回答」

#### 2-4. 後台 UI 重排

| 區塊 | 內容 | 生效條件 |
|------|------|---------|
| **執行模式** | `ai_mode`（agent / pipeline），附兩者差異說明 | 永遠顯示 |
| **Agent 設定** | 回合數、token 預算、模型觸點、工具開關 | `ai_mode = agent` |
| **Pipeline 設定** | `rag_strategy`、執行引擎 | `ai_mode = pipeline` |
| **RAG 工具** | `rag_tool_*` 開關 | 兩種模式都顯示（agent 控制允許哪些、pipeline 控制步驟開關） |
| **檢索 / 排名 / 品質** | 現有參數不動 | 永遠顯示 |
| **對話 / 超時 / 安全** | 不動 | 永遠顯示 |

#### 2-5. `rag_strategy` 值清理

- 從白名單移除 `'react'`（已被 `ai_mode = agent` 取代）
- 前端下拉移除 react 選項
- 保留 `'agent'` 值向後相容，讀到時等同 `ai_mode = agent`

#### 2-6. 驗證

- [ ] 現有設定為 `react` 的環境，migration 後行為不變
- [ ] 現有設定為其他策略的環境，migration 後行為不變
- [ ] 新環境預設 agent 模式
- [ ] eval 兩邊都跑，確認品質不退化

---

### Phase 3：Agent 工具細粒度化（進階）

在 Phase 1 抽好共用工具、Phase 2 打通路由後，可進一步讓 Agent 自主組合拆細的工具：

| 工具 | Agent 何時用 |
|------|-------------|
| `expand_query` | 問題模糊、第一次搜到太少 |
| `hybrid_search` + `mode` 參數 | 每次檢索 |
| `rerank` + `methods` 參數 | 候選太多、想收斂 |
| `judge_retrieval` | 決定要不要再搜一輪 |

這樣 fast / thorough / deep 變成 prompt 裡的行為預設（「這次查詢請用最少步驟回答」vs「請仔細檢索多個來源」），不再是寫死的 graph。

**前提**：orchestrator 模型要有足夠的多步編排能力。目前用 17B 的 scout，建議先用 eval 驗證再開放。

---

### Phase 4：PipelineEngine 退場（長期，不預設時間）

**前提**：Agent + 共用工具的 eval 品質達到 pipeline 水準。

- PipelineEngine 降為 eval-only，線上全走 Agent 或 ai-graph
- `pipeline/steps/` 的 wrapper 刪除，只保留 `ai-graph/nodes/` 的 wrapper
- `use_langgraph_engine` 設定移除

---

## Sandbox（獨立線）

目前 Agent 沒有 sandbox，所有工具都靠設計限制（sql_query 只接受模板、search 沒有副作用）。

| 方案 | 適用場景 | 啟動速度 | 限制 |
|------|---------|---------|------|
| Dynamic Workers | 純運算（整理、統計、格式轉換） | 毫秒級 | 無 binding、無網路 |
| Containers (Sandbox SDK) | 需要套件的分析或產圖 | 秒級 | 費用另計 |

建議排在 Phase 3 之後，以 Dynamic Workers 先做一個 `run_analysis` 工具。

---

## 依賴關係

```
Phase 0（改名）
    ↓
Phase 1（工具抽取，1-1 ~ 1-9 依序但可並行）
    ↓
Phase 2（ai_mode 路由 + migration + UI）
    ↓
Phase 3（工具細粒度化）→ Sandbox
    ↓
Phase 4（PipelineEngine 退場，視 eval 結果決定）
```

Phase 0 與 Phase 1-1（範本 PR）可以同時開工。
Phase 2 要等 Phase 1 的 hybrid_search 和 rerank 完成，Agent 才有管線級檢索可用。

---

## 命名對照（參考業界）

| 專案 | 迴圈模組 | 工具模組 |
|------|---------|---------|
| claude-code | `src/query/` | `src/tools/` |
| pi | `packages/agent/agent-loop.ts` | 同套件 |
| codex | `core/codex_thread.rs` | `core/function_tool.rs` |
| opencode | `packages/core/` | `.opencode/tool/` |
| looplane | `agent/runner.py` | `tooling/` |
| **nobodyclimb（目標）** | `services/agent/agent-loop.ts` | `services/tools/` |
