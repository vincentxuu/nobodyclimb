# 垂直領域 AI Agent 架構設計研究

> 研究日期：2026-09-11
> 研究範圍：非 coding agent 的垂直領域 AI Agent 架構模式，聚焦多能力（multi-capability）agent 的設計與擴展

---

## 一、垂直領域 Agent 案例分析

### 1.1 案例一：Amazon Health AI（醫療）

**架構模式**：Core Agent + Sub-Agents + Auditors + Sentinels

Amazon Health AI 是目前文件記載最完整的垂直 agent 系統之一，部署在消費者等級的醫療場景中。架構特點：

- **核心對話 Agent 與動作 Agent 分離**：對話 agent 負責理解與回覆，動作 agent 負責執行（排程、開處方、查保險）
- **多層監督**：每個動作 agent 都有獨立的 auditor agent 驗證輸出合規性
- **Sentinel 守衛**：獨立的守衛 agent 監控全域行為，防止越界

**業務能力分群**：按臨床工作流切分——文件生成、用藥核對、排程、衛教材料，每個工作流是一個 sub-agent。

> 來源：WOWHOW, "Amazon Health AI: Multi-Agent Architecture on Bedrock 2026"

### 1.2 案例二：Personal Health Agent / PHA（Google Research，健康教練）

**架構模式**：Orchestrator + 3 Specialist Sub-Agents

這個案例跟 NobodyClimb 最像——同樣是健康/健身領域、非受管制場景、需要整合多種能力。PHA 的三個 sub-agent：

| Sub-Agent | 職責 | 工具 |
|-----------|------|------|
| Data Science Agent | 分析穿戴裝置時序資料、健康紀錄 | Python code execution, 統計分析 |
| Domain Expert Agent | 整合個人健康數據 + 權威醫學資訊 | Web search, NCBI API, 資料處理 |
| Health Coach Agent | 個人化健康指導、行為改變 | Motivational Interviewing 技巧、進度追蹤 |

**Orchestrator 的四階段工作流**：
1. 理解使用者需求
2. 動態指派主要 + 支援 agent
3. Self-reflection 確保品質
4. 維護對話記憶以支持個人化

**關鍵設計決策**：
- Agent 分工參考人類醫療團隊的協作方式
- Orchestrator 根據 query 分析結果動態決定由哪個 agent 主導
- 評估結果：整合系統的使用者偏好率（49.1%）遠高於單一 agent（約 25%）

> 來源：Xu et al., "The Anatomy of a Personal Health Agent", arXiv:2508.20148

### 1.3 案例三：Sierra AI（客戶體驗）

**架構模式**：15+ Purpose-built Models + Supervisors

Sierra 是客服垂直領域的標竿，ARR 已超過 $150M。架構特點：

- **不是一個大模型**：由 15+ 個目的型模型（purpose-built models）協作
- **Supervisor 層**：獨立的監督模型負責 guardrails、policy、品質檢查
- **Agent Data Platform**：跨 session 的持久記憶，支援跨多次對話的客服案件

**業務能力分群**：按客服場景（退貨、技術支援、帳務、FAQ）各有專門模型，supervisor 確保輸出符合品牌政策。

> 來源：The AI Runtime, "The Anatomy of a Production Vertical Agent", 2026-05

### 1.4 案例四：Biomni（Stanford，生物醫學研究）

**架構模式**：Retrieval-Augmented Planning + Code-based Execution

Biomni 面對的問題跟我們類似——工具數量龐大（150 個工具、105 套件、59 資料庫），需要動態選擇。

- **Action Discovery Agent**：自動從學術論文中提取需要的工具和資料庫
- **LLM-based Tool Selection**：用獨立的 LLM 做 prompt-based retrieval，從龐大工具集中動態挑選相關子集
- **Code as Universal Interface**：不用 function calling，而是讓 agent 寫 code 來組合工具調用
- **Adaptive Planning**：先產生計畫，執行中持續修正

**對 context window 壓力的處理**：
> "As the tool, software, and database space is vast, the query task may only use a small set of these resources. To avoid long context, a prompt-based retriever is utilized."

> 來源：Stanford, "Biomni: A General-Purpose Biomedical AI Agent", 2025

### 1.5 案例五：MindHYVE（多垂直領域平台）

**架構模式**：Four-Layer Architecture + Named Digital Employees

MindHYVE 用同一套架構服務醫療、法律、教育、神學、金融五個垂直領域：

- **Layer 1 — Substrate**：Azure 基礎設施、安全、合規
- **Layer 2 — Eve-Genesis**：每個垂直領域一個 synthetic-reasoning corpus，用 LoRA fine-tune reasoning model
- **Layer 3 — Eve-Fusion (Compound Reasoning)**：5 個模型組成的推理管線——routing classifier → domain reasoner → 3 frontier models
- **Layer 4 — Operating System**：每個垂直領域包裝成一個 Digital Employee（ChironAI 醫療、JustineAI 法律⋯⋯）

**關鍵設計**：進入新垂直領域只需要新的 Eve-Genesis edition（訓練資料）+ LoRA fine-tune，不需要新架構。

> 來源：MindHYVE.ai, "The Four-Layer Architecture"

---

## 二、Multi-capability Agent 架構模式

### 2.1 工具數量增長時的核心問題

業界共識：**超過 8 個工具同時載入 context，就是設計問題，不是能力問題**。

| 工具數量 | 問題 | 解法 |
|---------|------|------|
| ≤ 8 | 可控 | 全部載入 context |
| 8–20 | LLM 選錯工具的機率顯著上升 | 分群 + routing |
| 20–50 | Context window 被工具定義吃掉 40-50% | 動態載入（Tool Search / RAG-based retrieval） |
| 50+ | Naive 全載入的正確率低於 50% | Hierarchical tool selection / Code execution |

> 來源：MLflow, "AI Agent Tool Use Best Practices"; Zylos Research, "Tool-Augmented LLM Agents"

### 2.2 解法一：Hierarchical Tool Selection（兩階段選擇）

生產環境的標準做法。LLM 先呼叫一個「搜尋工具」的工具，從目錄中檢索相關工具，然後才載入實際要用的工具。

```
User Query
    ↓
LLM + meta-tool("search_tools")
    ↓
Tool Catalog (embedding-indexed)
    ↓
Top-K relevant tools loaded
    ↓
LLM + selected tools → execution
```

**實證**：語義工具路由（semantic tool routing）在大型目錄中達到 86.4% 的正確率，而 naive 全載入在規模化後低於 50%。

**Anthropic 的實作——Tool Search**：
- 當 MCP 工具超過 context window 10% 時自動啟動
- 只載入工具名稱和描述（~100 tokens/tool），需要時才載入完整 schema
- 17 個 built-in skills 只佔 ~1,700 tokens；同等的 MCP 工具要 55,000+，**32 倍的差距**

> 來源：Anthropic, "Tool Search"; Hexaware, "Context Window Truth"

### 2.3 解法二：Agent-as-a-Tool（把 Agent 包成工具）

AWS Strands SDK 推廣的模式。不是把 20 個工具都給一個 agent，而是把專業 agent 包裝成 orchestrator 的工具。

```python
orchestrator = Agent(
    system_prompt="""
    - 研究問題 → research_assistant
    - 產品推薦 → product_recommendation_assistant
    - 旅行規劃 → trip_planning_assistant
    - 簡單問題 → 直接回答
    """,
    tools=[research_assistant, product_assistant, trip_assistant]
)
```

**好處**：每個 sub-agent 自帶專屬 system prompt、工具集、domain context，不會互相污染。

> 來源：AWS, "Build Multi-Agent Systems Using the Agents as Tools Pattern"

### 2.4 解法三：Code Execution 取代 Tool Calling

Anthropic 的 "Code Execution with MCP" 模式：agent 不直接呼叫工具，而是寫 code 來呼叫工具。

- **98.7% fewer tokens** compared to direct tool calling
- **10x faster** task completion
- 零 context bloat

適用場景：工具調用邏輯複雜（需要 loop、conditional、parallel）、工具輸出需要加工後才有用。

> 來源：Anthropic, "Code Execution with MCP", 2025

### 2.5 解法四：Logits Masking（Manus 的做法）

動態載入/移除工具會破壞 KV cache（cached vs uncached tokens 的成本差 10 倍）。Manus 的解法：

- 所有工具定義一直留在 context 中
- 透過 logits masking 在 decoding 層面抑制不該被選的工具
- 保持 KV cache 的命中率

> 來源：Henry Vu, "What Fills the Context Window"

### 2.6 解法五：Tool Usage Inertia（AutoTool 論文）

利用「工具使用慣性」——工具調用有可預測的序列模式。用有向圖紀錄工具間的轉移機率，預測下一個可能用到的工具，不需要完整的 LLM inference。

- 減少 30% 推理成本
- 維持競爭力的任務完成率

> 來源：AutoTool, AAAI 2026

---

## 三、領域知識注入模式

### 3.1 System Prompt 動態組裝

生產系統的 system prompt 不是靜態文字，而是多來源組裝的結果：

```
┌─────────────────────────────────┐
│ System Prompt (2,000-4,050 tokens) │
├─────────────────────────────────┤
│ Identity block (~350 tokens)     │  ← 靜態：人設、語調
│ Boundaries (~280 tokens)         │  ← 靜態：硬規則
│ Conversation state (50-100)      │  ← 動態：每輪更新
│ Patient context (80-700)         │  ← 動態：每 session
│ Approach + tools + guides (~470) │  ← 靜態：方法論
│ Few-shot examples (~550)         │  ← 靜態
│ RAG results (0-1,500)            │  ← 條件式：有檢索時注入
└─────────────────────────────────┘
```

**實務 pattern**：
1. **靜態層**（identity、rules、few-shot）在 session 開始時載入，不變
2. **Session 層**（user profile、context）每個 session 從 DB 拉取
3. **Turn 層**（conversation state、RAG results）每一輪動態注入
4. **Conditional 層**（tool results）只在工具被呼叫時才出現

> 來源：Henry Vu, "What Fills the Context Window"

### 3.2 領域 Prompt Template 與工具定義共置管理

最佳實踐是**將 prompt template 與工具定義放在同一個模組**，形成「Capability Package」：

```
capability/
├── manifest.json        # name, description, triggers
├── system-prompt.md     # 領域專屬 system prompt 片段
├── tools/               # 工具定義 + 實作
│   ├── search-routes.ts
│   └── weather.ts
├── few-shots/           # 領域專屬 few-shot examples
└── guardrails/          # 輸出驗證規則
```

Anthropic 的 Skills 概念就是這個模式的具體實作：
- 每個 Skill 只在 discovery 時載入名稱 + 描述（~100 tokens）
- 被觸發時才載入完整指令
- 可以互相呼叫（composable）

> 來源：Anthropic, "Building Effective AI Agents", 2026

### 3.3 RAG Context 與工具結果整合

生產系統中，RAG 結果和工具結果需要被統一管理：

**Pattern 1 — RAG as a Tool**：
- 檢索不是固定管線步驟，而是 agent 按需調用的工具
- Agent 自己決定何時需要外部知識、查什麼知識庫
- 適合我們的場景：agent 決定要查路線資料庫、岩場知識庫、還是天氣 API

**Pattern 2 — Temporal and Contextual Routing**：
- 根據 query intent 路由到不同檢索器
- 即時資訊（天氣）走 real-time API
- 靜態知識（岩場資訊）走 vector DB
- 個人數據（攀登記錄）走 SQL query

**Pattern 3 — Context Budget Management**：
- 每個來源有 token 預算上限
- 檢索結果先壓縮再注入 context
- Anthropic 的建議：MCP 工具輸出上限 25,000 tokens（可調）

> 來源：ZBrain, "Adaptive RAG for Agentic AI"; Anthropic documentation

---

## 四、可擴展性設計

### 4.1 加一個新 Capability 的最小步驟

根據研究，最可擴展的架構應該讓新增 capability 只需要：

1. **定義 Capability Manifest**（JSON/YAML）：名稱、描述、觸發條件
2. **實作工具函式**：input/output schema + 業務邏輯
3. **提供領域 prompt 片段**：讓 LLM 知道何時及如何使用這個 capability
4. **（可選）few-shot examples**：提升選擇精準度
5. **註冊到 registry**：加入工具索引，讓 routing 或 tool search 可以發現

**不需要**：修改 orchestrator 邏輯、改 system prompt 主體、重新部署其他 capability。

### 4.2 MCP Server 模式與 Capability 分離

MCP 是否適合用在垂直領域的 capability 分離？**答案是「適合但有限制」**。

**適合的場景**：
- Capability 是 stateless 的 request-response（查天氣、搜路線）
- 需要跨多個 agent 共享同一組工具
- 工具實作可以獨立部署和更新

**不適合的場景**：
- Capability 需要自己的 AI 推理能力（此時應該用 A2A 而非 MCP）
- Capability 之間有複雜的狀態依賴
- 每個 MCP server 的工具定義都會佔 context window

**實務建議**：
- 用 MCP 封裝「純工具型」capability（天氣 API、地理查詢、數據統計）
- 用 sub-agent 封裝「需要推理的」capability（推薦引擎、教練建議）
- 控制同時連接的 MCP server 數量，只連需要的

> 來源：Anthropic Claude Code documentation; DEV Community, "MCP vs A2A"

### 4.3 Capability Manifest 概念

業界正在收斂出「Capability Manifest」的標準概念：

| 協議 | Discovery 機制 | 描述 |
|------|---------------|------|
| MCP | `tools/list` endpoint + `mcp.json` descriptor | 每個 server 暴露工具列表 |
| A2A | Agent Card (`agent.json`) at well-known URL | 描述 agent 能力、認證方式 |
| MCP Registry | 開放目錄 + OpenAPI schema | "App store for MCP servers" |
| STEM Agent | Skill Registry with maturation lifecycle | Skills 從 recurring patterns 中結晶 |

**對我們的啟示**：為每個 capability 定義一個標準化的 manifest，包含：
```json
{
  "name": "weather",
  "description": "查詢岩場天氣和攀岩條件預報",
  "triggers": ["天氣", "下雨", "適合攀岩嗎", "weather"],
  "tools": ["get_weather_forecast", "get_climbing_conditions"],
  "prompt_fragment": "...",
  "priority": "medium",
  "requires_user_context": false
}
```

> 來源：Zylos Research, "Dynamic Tool Discovery and Capability Negotiation", 2026

---

## 五、VAA 框架：生產級垂直 Agent 的七大元件

The AI Runtime 提出的 Vertical Agent Anatomy (VAA) 是目前最完整的生產級垂直 agent 架構框架：

| 元件 | 職責 | 對應的生產案例 |
|------|------|--------------|
| 1. LLM | 語言理解與生成 | 所有案例的基礎 |
| 2. Router | 決定下游模型、工具、政策、人員 | Sierra 的 15+ model routing |
| 3. Specialist Model Constellation | 領域專精模型群 + 監督者 | Hippocratic 的 22 個監督 LLM |
| 4. Deterministic Policy Layer | 非 LLM 的規則門衛 | 保險核保規則、臨床指南 |
| 5. Domain Schema Adapter | LLM 輸出 ↔ 行業標準 schema 轉換 | FHIR、HL7、MISMO |
| 6. Long-horizon State Store | 跨天/週/季的持久記憶 | Tennr 的 RaeLM、Sierra 的 Agent Data Platform |
| 7. Human Checkpoint Router | 信心分級 + 人工審查路由 | Anterior 的 confidence-tiered routing |
| +. Regulator-Replay Audit Trail | 可重現的決策審計軌跡 | HIPAA、FCRA 合規要求 |

**核心觀點**：LLM 是七個元件中最小的一個。圍繞 LLM 的確定性腳手架（harness）才是生產級系統的重心。

**對非受管制垂直領域的啟示**：不是每個元件都必須存在，但缺少得越多，系統就越像 demo 而非產品。攀岩領域不需要 HIPAA 等級的 audit trail，但 domain schema adapter（路線難度系統、岩場座標）和 long-horizon state store（攀登記憶）同樣是差異化的關鍵。

> 來源：The AI Runtime, "The Anatomy of a Production Vertical Agent", 2026-05

---

## 六、跟我們架構的對照分析

### 6.1 現有架構盤點

```
backend/src/services/
├── agent/                    # Agent Loop 層
│   ├── agent-loop.ts         # 核心迴圈
│   ├── classifier.ts         # 意圖分類
│   ├── guards.ts             # 護欄
│   ├── registry.ts           # 工具註冊
│   ├── resilience.ts         # 韌性（重試、熔斷）
│   ├── pricing.ts            # 定價
│   ├── tracker.ts            # 追蹤
│   └── tools/                # 7 個 Agent 工具
│       ├── crag-info.ts      # 岩場資訊
│       ├── recommend.ts      # 推薦
│       ├── search-crags.ts   # 搜尋岩場
│       ├── search-routes.ts  # 搜尋路線
│       ├── sql-query.ts      # SQL 查詢
│       ├── user-profile.ts   # 使用者檔案
│       └── weather.ts        # 天氣
│
├── ai-graph/                 # RAG 圖管線層（共用檢索基礎設施）
│   ├── graphs/               # 9 種 RAG 策略
│   ├── nodes/                # 25+ 可組合節點
│   ├── providers/            # LLM provider 抽象
│   └── shared/               # 共用元件
│
├── tools/                    # 底層工具層（純函式）
│   ├── hybrid-search.ts
│   ├── cross-encoder.ts
│   ├── mmr.ts
│   └── ...
│
├── pipeline/                 # Legacy pipeline 層
│   ├── steps/                # Pipeline steps
│   └── ...
│
└── query/                    # Query 處理層
    ├── config.ts
    ├── retrieval.ts
    └── ...
```

### 6.2 跟業界模式的對照

| 維度 | 業界最佳實踐 | NobodyClimb 現狀 | 評估 |
|------|-------------|-----------------|------|
| 工具數量 | ≤8 個同時載入 | 7 個 ✓ | 目前安全；擴展到 15+ 時需要 tool search |
| Agent loop | ReAct / tool-calling loop | agent-loop.ts ✓ | 有基礎 |
| 意圖分類 | Router / Classifier 前置 | classifier.ts ✓ | 已有，但不確定是否有動態路由 |
| Guardrails | 確定性政策層 | guards.ts ✓ | 有基礎 |
| 工具註冊 | 動態 registry + manifest | registry.ts ✓ | 有 registry，需要確認是否有 manifest |
| 共用檢索 | RAG as a Tool | ai-graph/ ✓ | 架構成熟（9 策略、25+ 節點） |
| 記憶管理 | Long-horizon state store | memory-extractor.ts ✓ | 有基礎 |
| Domain schema | 轉換層 | 散落各處 | ⚠️ 缺少統一的 domain schema adapter |
| Capability manifest | 標準化的能力描述 | 無 | ❌ 工具定義直接寫在 code 裡 |
| 動態工具載入 | Tool Search / RAG-based | 無 | ⚠️ 目前 7 個不需要，但需要為擴展準備 |
| 個人化 | 跨 session 的使用者模型 | personalization.ts ✓ | 有基礎 |
| Observability | 追蹤 + 成本 | langfuse.ts, tracker.ts ✓ | 有基礎 |

### 6.3 架構合理性評估

**做得好的地方**：
1. **四層結構基本正確**：agent/ → ai-graph/ → tools/ → query/ 的分層符合業界的 orchestration → retrieval → execution 模式
2. **RAG 基礎設施成熟**：9 種策略 + 25+ 可組合節點在垂直領域 agent 中算是很完整的
3. **工具數量控制得當**：7 個工具在 ≤8 的安全線內
4. **有 guards 和 resilience**：生產級的韌性設計（熔斷器、重試）

**最大的風險和缺口**：

#### 風險 1：Capability 與 Agent Core 耦合過深
目前 7 個工具直接放在 `agent/tools/` 下，工具定義和 agent loop 綁在一起。當需要加到 15+ 個工具時，沒有動態載入機制。

**建議**：引入 Capability Manifest 模式，每個 capability 自帶 manifest + prompt fragment + tools，透過 registry 動態註冊和發現。

#### 風險 2：缺少 Domain Schema Adapter
攀岩領域有自己的 domain schema（難度等級系統 V-scale/Font/YDS、岩場座標格式、攀登記錄結構），但目前散落在各個工具中，沒有統一的轉換層。

**建議**：抽出 `domain/` 層，集中管理攀岩領域的 schema 定義和轉換邏輯。

#### 風險 3：System Prompt 靜態
目前的 system prompt 大概是一大段靜態文字。隨著 capability 增加，需要動態組裝——根據啟用的 capability、使用者 profile、對話 context 來組裝。

**建議**：實作 prompt assembler，讓每個 capability 貢獻自己的 prompt fragment。

#### 風險 4：沒有 Capability 間的隔離
當推薦工具和天氣工具同時在 context 中，LLM 可能混淆（例如把天氣資訊錯誤地用在推薦邏輯中）。

**建議**：考慮 Agent-as-a-Tool 模式，把「推薦」和「教練」包裝成 sub-agent，各自帶獨立的 system prompt 和工具集。

### 6.4 建議的演進路線

```
Phase 1（現在 → 近期）：Capability Manifest
  - 為每個工具定義 manifest（name, description, triggers, prompt_fragment）
  - 工具從 agent/tools/ 搬到獨立的 capabilities/ 目錄
  - Registry 改為從 manifest 自動註冊

Phase 2（中期）：Dynamic Tool Loading
  - 實作 tool search / semantic routing
  - System prompt 從靜態改為動態組裝
  - 支持 capability 的 lazy loading

Phase 3（長期）：Agent-as-a-Tool
  - 把複雜 capability（推薦、教練）升級為 sub-agent
  - Orchestrator 只管理 routing 和 context
  - 每個 sub-agent 有獨立的 context window

Phase 4（更遠）：MCP Server 分離
  - 純工具型 capability 封裝成獨立的 MCP server
  - 支持第三方 capability 接入
  - Capability 可以獨立部署和更新
```

---

## 七、關鍵決策框架

### 7.1 何時使用哪種架構模式

| 你的情況 | 建議架構 |
|---------|---------|
| 單一任務、單一領域、一個 context window 搞定 | Single-agent ReAct loop |
| 多個明確階段、有清楚的 handoff | Sequential pipeline |
| 需要平行處理多個專業工作 | Hierarchical（orchestrator + workers） |
| 高風險決策需要共識或對抗驗證 | Collaborative / peer-to-peer |
| 工具 8-20 個、領域不重疊 | Tool grouping + routing classifier |
| 工具 20+ 個 | Hierarchical tool selection / Agent-as-a-Tool |

### 7.2 何時使用 MCP vs A2A vs 直接整合

| 判斷維度 | MCP | A2A | 直接整合 |
|---------|-----|-----|---------|
| 工具是 stateless 的？ | ✓ | | |
| 遠端系統有自己的 AI？ | | ✓ | |
| 需要低延遲？ | | | ✓ |
| 需要跨多個 agent 共享？ | ✓ | ✓ | |
| 內部微服務之間？ | | | ✓ |

---

## 八、參考資料

### 生產案例
1. WOWHOW, "Amazon Health AI: Multi-Agent Architecture on Bedrock 2026"
2. The AI Runtime, "The Anatomy of a Production Vertical Agent", 2026-05
3. Xu et al., "The Anatomy of a Personal Health Agent", arXiv:2508.20148, 2025
4. Stanford, "Biomni: A General-Purpose Biomedical AI Agent", PMC, 2025
5. MindHYVE.ai, "The Four-Layer Architecture — Agentic AI OS"
6. SaaSMag, "Vertical AI Agents Are Eating Horizontal SaaS in 2026"
7. IdeaProof, "Vertical AI Agents: The 2026 Playbook"

### 架構模式
8. Anthropic, "Building Effective AI Agents: Architecture Patterns", 2026
9. Zylos Research, "Tool-Augmented LLM Agents: Production Architecture Patterns", 2026-04
10. Zylos Research, "Dynamic Tool Discovery and Capability Negotiation", 2026-03
11. AWS, "Build Multi-Agent Systems Using the Agents as Tools Pattern"
12. Cowork.ink, "AI Agent Architecture: Components, Patterns & Design (2026)"
13. AgileSoftLabs, "Multi-Agent AI Systems: Enterprise Guide", 2026-03

### 工具選擇與 Context 管理
14. MLflow, "AI Agent Tool Use Best Practices for Practitioners"
15. Hexaware, "Context Window Truth: Why Long Context Window Fails"
16. Henry Vu, "What Fills the Context Window: A Guide to Context Engineering"
17. StackOne, "Agentic Context Engineering: How to Keep Agents Sharp"
18. arXiv, "Dynamic Tool Gating and Lazy Schema Loading", 2604.21816
19. AutoTool, "Efficient Tool Selection for LLM Agents", AAAI 2026
20. StatsIG, "Tool Calling Optimization: Efficient Agent Actions"

### 協議與標準
21. DEV Community, "MCP vs A2A: The Complete Guide to AI Agent Protocols in 2026"
22. arXiv, "MCP Tool Descriptions Are Smelly!", 2602.14878
23. Damian Galarza, "MCPs vs Agent Skills: Understanding the Difference", 2026-02
24. STEM Agent, "Self-adapting, Tool-enabled, Extensible, Multi-agent", arXiv:2603.22359

### 領域知識注入
25. arXiv, "How to Build AI Agents by Augmenting LLMs with Codified Human Expert Domain Knowledge", 2601.15153
26. Digital Applied, "Context Engineering: Agent Reliability Playbook 2026"
27. DeepSet, "Context Engineering: The Next Frontier Beyond Prompt Engineering"

### 垂直領域標準化
28. arXiv:2501.00881, "Standardization of Vertical AI Agent Design Patterns", 2025
29. Fast.io, "Vertical AI Agents: Industry-Specific Agents Explained (2026)"
30. PMC, "A Foundational Architecture for AI Agents in Healthcare"
