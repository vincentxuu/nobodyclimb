# Modular RAG Toolbox 設計文件

> 基於 50+ 篇 RAG 研究文章與 NobodyClimb 現有程式碼交叉分析。
> 工具名稱以語意命名，不綁定 Cloudflare — 可對應至任何向量資料庫、快取、LLM provider。

## 總覽

| 分類 | ✅ 直接用 | 🔧 需重構 | 🆕 需新建 | 合計 |
|------|----------|----------|----------|------|
| 快取層 | 1 | 1 | 0 | 2 |
| 路由層 | 0 | 2 | 1 | 3 |
| 前處理層 | 4 | 0 | 3 | 7 |
| 檢索層 | 1 | 5 | 0 | 6 |
| 後處理層 | 2 | 1 | 1 | 4 |
| 生成層 | 1 | 0 | 1 | 2 |
| 品質層 | 1 | 1 | 2 | 4 |
| 修正層 | 0 | 1 | 1 | 2 |
| 後置層 | 2 | 0 | 0 | 2 |
| 編排層 | 2 | 1 | 1 | 4 |
| 跨切面 | 6 | 0 | 0 | 6 |
| **合計** | **20** | **12** | **10** | **42** |

---

## 六套策略模式

| 模式 | 定位 | 延遲 | LLM 呼叫 | 適用查詢 |
|------|------|------|----------|---------|
| **Fast** | 低延遲、低成本 | 1-2s | 1 | simple, general-knowledge |
| **Thorough** | 高品質、單輪精排 | 3-6s | 2-4 | complex（單主題） |
| **Corrective** | 檢索品質自我修正 | 4-8s | 3-5 | complex 且首輪召回弱 |
| **Deep** | 子問題分解→並行→合成 | 6-12s | N+2 | 跨實體比較、行程規劃 |
| **Agentic** | LLM 多輪自主決策搜尋 | 8-15s | 3-8 | 開放式探索（實驗） |
| **Speculative** | 多草稿並行→驗證選最佳 | 2-4s | 4 | 高吞吐低延遲（實驗） |

---

## 工具清單

圖例：F=Fast, T=Thorough, C=Corrective, D=Deep, A=Agentic, S=Speculative

### 1. 快取層（Cache）

| # | 工具 | 狀態 | 說明 | F | T | C | D | A | S |
|---|------|------|------|---|---|---|---|---|---|
| 1 | `semanticCache` | 🔧 | 語意相似度快取。需放寬到登入用戶（目前只命中匿名） | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 2 | `responseCache` | ✅ | 回應快取（KV/Redis/SQLite 皆可） | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

### 2. 路由層（Routing）

| # | 工具 | 狀態 | 說明 | F | T | C | D | A | S |
|---|------|------|------|---|---|---|---|---|---|
| 3 | `intentClassifier` | 🔧 | 意圖分類（事實/比較/SQL/通用知識）。strategyHint 移至 graph 選擇層 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 4 | `strategyRouter` | 🆕 | 策略路由。auto 模式在入口層選 graph，不在節點內判斷 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 5 | `conditionalEdges` | 🔧 | 條件分支邏輯。加入新模式路由函式 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

### 3. 前處理層（Pre-retrieval）

| # | 工具 | 狀態 | 說明 | F | T | C | D | A | S |
|---|------|------|------|---|---|---|---|---|---|
| 6 | `metadataFilter` | ✅ | 結構化過濾條件建構（岩場/難度/區域）。含 LLM 解析 + regex 保底 + 對話歷史位置補充 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 7 | `queryEmbedding` | ✅ | 查詢向量化。支援 query/HyDE/expanded vectors 並行 embedding | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 8 | `hyde` | ✅ | Hypothetical Document Embedding。已有 skipWhen 邏輯 | — | ✓ | ✓ | ✓ | — | — |
| 9 | `queryExpansion` | ✅ | 多角度查詢改寫（Multi-Query）。已有 skipWhen 邏輯 | — | ✓ | ✓ | ✓ | — | — |
| 10 | `queryRewrite` | 🆕 | 品質回饋驅動的查詢改寫。輸入：judge 回饋 + critic gaps + 原 query → 輸出：改寫後的 query + 放寬後的 filter | — | ✓ | ✓ | — | ✓ | — |
| 11 | `textNormalize` | 🆕 | 文字正規化（繁簡統一）。解決 BGE-M3 簡中語料偏差，也需套用於 indexing | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 12 | `structuredQuery` | ✅ | 結構化資料查詢（Text-to-SQL）。含 SQL/Hybrid/Clarification 三路徑 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

### 4. 檢索層（Retrieval）

| # | 工具 | 狀態 | 說明 | F | T | C | D | A | S |
|---|------|------|------|---|---|---|---|---|---|
| 13 | `hybridRetrieval` | 🔧 | 混合檢索（向量+全文+RRF 融合+CRAG 降級）。從 hybridSearch 拆出，~210 行 | ✓ | ✓ | ✓ | ✓ | — | ✓ |
| 14 | `lexicalFallback` | 🔧 | 詞彙檢索降級（embedding 不可用時 BM25-only）。從 hybridSearch 拆出，~40 行 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 15 | `multiSourceRetrieval` | 🔧 | 多源檢索（同時查多個工具/資料源）。從 hybridSearch 拆出，~100 行 | — | ✓ | — | — | — | — |
| 16 | `retrievalFallback` | 🔧 | 檢索降級（空結果切備選資料源）。從 hybridSearch 拆出，~50 行 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 17 | `iterativeRetrieval` | 🔧 | 迭代式檢索（LLM 驅動多輪搜尋）。需修復：每輪過 rerank（目前跳過） | — | — | — | — | ✓ | — |
| 18 | `retrievalDecision` | ✅ | 檢索決策（繼續搜/回答）。含 LLM 決策 + refinedQuery + budget cap | — | — | — | — | ✓ | — |

#### hybridSearch 拆分方案（663 行 → 4 個獨立模組）

| 原始行範圍 | 新模組 | 行數 |
|-----------|--------|------|
| L377-587 | `hybridRetrieval`（vector+BM25+RRF+CRAG fallback+similar route） | ~210 |
| L15-53 | `lexicalFallback`（BM25-only） | ~40 |
| L56-155 | `multiSourceRetrieval`（multi-tool executePlan+synthesize） | ~100 |
| L601-649 | `retrievalFallback`（空結果切備選工具） | ~50 |

**刪除**：hybridSearch 內嵌的 plan-execute 分支（L185-340，~155 行）和 agentic 分支（L342-376，~35 行）。這些是 auto 模式在 baselineGraph 裡硬塞的重複邏輯，應由各自的 graph 原生節點處理。

### 5. 後處理層（Post-retrieval / Reranking）

| # | 工具 | 狀態 | 說明 | F | T | C | D | A | S |
|---|------|------|------|---|---|---|---|---|---|
| 19 | `semanticRerank` | 🔧 | 語意重排序（cross-encoder）。需加 degraded trace（目前 catch 空 block 靜默降級） | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 20 | `diversityFilter` | ✅ | 多樣性過濾（MMR） | — | ✓ | ✓ | ✓ | ✓ | — |
| 21 | `domainRerank` | ✅ | 領域特化重排序（影片數加權+已完攀排除+context 組裝） | — | ✓ | ✓ | ✓ | ✓ | — |
| 22 | `contextCompression` | 🆕 | 上下文壓縮。多源結果合併後 context 過長時，用 LLM 萃取關鍵知識條 | — | — | — | ✓ | — | — |

### 6. 生成層（Generation）

| # | 工具 | 狀態 | 說明 | F | T | C | D | A | S |
|---|------|------|------|---|---|---|---|---|---|
| 23 | `responseGeneration` | ✅ | 回應生成。含 GK/RAG 路徑 + SSE 串流 + 個人化 prompt | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| 24 | `draftAndVerify` | 🆕 | 草稿驗證。小模型從不同 chunk 子集並行生成 3 草稿 → 大模型驗證選最佳 | — | — | — | — | — | ✓ |

### 7. 品質層（Quality）

| # | 工具 | 狀態 | 說明 | F | T | C | D | A | S |
|---|------|------|------|---|---|---|---|---|---|
| 25 | `responseQualityJudge` | 🔧 | 回應品質評估（groundedness+quality+constraint）。串流模式改 async 寫回 DB | — | ✓ | ✓ | ✓ | ✓ | — |
| 26 | `retrievalQualityJudge` | 🆕 | 檢索品質評估。檢索後、生成前評估 recall 是否足夠，輸出 gaps。供 Corrective 模式決定是否 retry | — | — | ✓ | — | — | — |
| 27 | `qualitySampling` | 🆕 | 品質抽樣。依 queryType 決定是否跳過 judge（simple 30% 抽樣，complex 100%） | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| 28 | `outputSafetyCheck` | ✅ | 輸出安全檢查（長度限制+prompt 洩漏偵測） | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

### 8. 修正層（Correction）

| # | 工具 | 狀態 | 說明 | F | T | C | D | A | S |
|---|------|------|------|---|---|---|---|---|---|
| 29 | `generationRetry` | 🔧 | 生成重試。加入 queryRewrite 呼叫（目前 loopBack 用原 query）。串流模式的 skip 邏輯需配合 async judge | — | ✓ | ✓ | ✓ | ✓ | — |
| 30 | `retrievalRetry` | 🆕 | 檢索重試。retrievalQualityJudge 品質不足 → queryRewrite → 放寬 filter → 重搜。最多 retry 2 次。與 generationRetry 不同：這是「檢索後、生成前」修正 | — | — | ✓ | — | — | — |

### 9. 後置層（Post-generation）

| # | 工具 | 狀態 | 說明 | F | T | C | D | A | S |
|---|------|------|------|---|---|---|---|---|---|
| 31 | `conversationMemory` | ✅ | 對話記憶萃取。非阻塞設計（背景執行） | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 32 | `responseFinalize` | ✅ | 回應收尾（token 彙總+記錄+快取+品質 flagging+串流 async judge+語意快取寫入） | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

### 10. 編排層（Orchestration）

| # | 工具 | 狀態 | 說明 | F | T | C | D | A | S |
|---|------|------|------|---|---|---|---|---|---|
| 33 | `queryDecompose` | ✅ | 問題分解（拆子問題+依賴關係）。含 LLM 規劃 + JSON 解析 + 驗證 | — | — | — | ✓ | — | — |
| 34 | `parallelExecute` | 🔧 | 並行執行（map-reduce）。需改呼叫新模組（hybridRetrieval + 完整 rerank） | — | — | — | ✓ | — | — |
| 35 | `resultMerge` | ✅ | 結果合併（LLM 合成多源答案）。含 LLM 合成 + fallback 拼接 | — | — | — | ✓ | — | — |
| 36 | `multiSourceRetrieval` | 🔧 | 多源檢索。從 hybridSearch 抽出為獨立節點 | — | ✓ | — | — | — | — |

### 11. 跨切面服務（Cross-cutting，非 LangGraph 節點）

| # | 工具 | 狀態 | 說明 |
|---|------|------|------|
| 37 | `personalization` | ✅ | 個人化 system prompt（攀登歷史+記憶注入） |
| 38 | `langfuseObservability` | ✅ | 全鏈路 trace/span |
| 39 | `rankQuota` | ✅ | 等級積分 + 每日 AI 使用上限 |
| 40 | `multiProvider` | ✅ | LLM provider 抽象（Workers AI / OpenAI / Anthropic / Google / GitHub） |
| 41 | `circuitBreaker` | ✅ | LLM 服務斷路器 |
| 42 | `recommendation` | ✅ | 完攀後推薦進階路線 |

---

## 六套模式組裝

### Fast（1-2s · 1 LLM call）

```
semanticCache → intentClassifier → metadataFilter → queryEmbedding
→ hybridRetrieval → semanticRerank
→ responseGeneration → conversationMemory
```

跳過：hyde, queryExpansion, diversityFilter, domainRerank, responseQualityJudge, generationRetry

### Thorough（3-6s · 2-4 LLM calls）

```
semanticCache → intentClassifier → metadataFilter → queryEmbedding
→ hyde → queryExpansion → hybridRetrieval
→ semanticRerank → diversityFilter → domainRerank
→ responseGeneration → responseQualityJudge
→ [品質不足] → generationRetry(queryRewrite) → conversationMemory
```

### Corrective（4-8s · 3-5 LLM calls）

```
semanticCache → intentClassifier → metadataFilter → queryEmbedding
→ hyde → queryExpansion → hybridRetrieval
→ semanticRerank → diversityFilter → domainRerank
→ retrievalQualityJudge
→ [recall 不足] → queryRewrite → hybridRetrieval(retry) → rerank
→ responseGeneration → responseQualityJudge → conversationMemory
```

與 Thorough 的差異：在「檢索後、生成前」增加品質修正迴圈（最多 retry 2 次）

### Deep（6-12s · N+2 LLM calls）

```
semanticCache → intentClassifier → queryDecompose
→ [map-reduce] parallelExecute(每步走 hybridRetrieval + 完整 rerank)
→ resultMerge → contextCompression
→ responseGeneration → responseQualityJudge → conversationMemory
```

### Agentic（8-15s · 3-8 LLM calls）

```
semanticCache → intentClassifier → metadataFilter → queryEmbedding
→ retrievalDecision ⇄ iterativeRetrieval(每輪過 semanticRerank + diversityFilter)
→ domainRerank → responseGeneration → responseQualityJudge
→ generationRetry → conversationMemory
```

修復現有問題：iterativeRetrieval 每輪結果都過 rerank

### Speculative（2-4s · 4 LLM calls）

```
semanticCache → intentClassifier → metadataFilter → queryEmbedding
→ hybridRetrieval → semanticRerank → diversityFilter → domainRerank
→ draftAndVerify(小模型×3 → 大模型選最佳) → conversationMemory
```

---

## Auto 路由邏輯

```
intentClassifier 判斷 → queryType + complexity
  ├─ general-knowledge  → Fast（跳過 retrieval，直接 LLM）
  ├─ simple             → Fast
  ├─ complex 單主題     → Thorough
  ├─ complex 跨實體     → Deep
  ├─ sql                → structuredQuery（不變）
  └─ 其他               → Thorough（預設）
```

auto 不是第七套策略，而是在 graph 選擇層（`strategyRouter`）路由到上述六者之一。使用者/管理員也可手動指定策略做 A/B 測試。

---

## 現有檔案對照表

| 語意化名稱 | 現有檔案 | 備註 |
|-----------|---------|------|
| `semanticCache` | `nodes/semantic-cache.ts` | |
| `responseCache` | `ai-graph/index.ts` L128 | postGraphProcessing 內 |
| `intentClassifier` | `nodes/tool-selection.ts` | 425 行 |
| `strategyRouter` | — | 新建 |
| `conditionalEdges` | `routing.ts` | 84 行 |
| `metadataFilter` | `nodes/filter-build.ts` | 193 行 |
| `queryEmbedding` | `nodes/embedding.ts` | 90 行 |
| `hyde` | `nodes/hyde.ts` | 61 行 |
| `queryExpansion` | `nodes/multi-query.ts` | 50 行 |
| `queryRewrite` | — | 新建 |
| `textNormalize` | — | 新建 |
| `structuredQuery` | `nodes/text-to-sql.ts` | 560 行 |
| `hybridRetrieval` | `nodes/hybrid-search.ts` L377-587 | 從 663 行巨型函式拆出 |
| `lexicalFallback` | `nodes/hybrid-search.ts` L15-53 | 從 663 行巨型函式拆出 |
| `multiSourceRetrieval` | `nodes/hybrid-search.ts` L56-155 | 從 663 行巨型函式拆出 |
| `retrievalFallback` | `nodes/hybrid-search.ts` L601-649 | 從 663 行巨型函式拆出 |
| `iterativeRetrieval` | `nodes/agentic-retrieve.ts` | 197 行 |
| `retrievalDecision` | `nodes/agentic-decision.ts` | 236 行 |
| `semanticRerank` | `nodes/cross-encoder.ts` | 106 行 |
| `diversityFilter` | `nodes/mmr.ts` | 47 行 |
| `domainRerank` | `nodes/popularity-rerank.ts` | 189 行 |
| `contextCompression` | — | 新建 |
| `responseGeneration` | `nodes/llm-generation.ts` | 260 行 |
| `draftAndVerify` | — | 新建 |
| `responseQualityJudge` | `nodes/judge.ts` | 105 行 |
| `retrievalQualityJudge` | — | 新建 |
| `qualitySampling` | — | 新建 |
| `outputSafetyCheck` | `utils/guardrails.ts` | 內聯呼叫 |
| `generationRetry` | `nodes/self-reflection.ts` | 195 行 |
| `retrievalRetry` | — | 新建 |
| `conversationMemory` | `nodes/memory-extractor.ts` | 30 行 |
| `responseFinalize` | `ai-graph/index.ts` L62-196 | postGraphProcessing |
| `queryDecompose` | `nodes/planning.ts` | 170 行 |
| `parallelExecute` | `nodes/execute-plan-step.ts` | 55 行 |
| `resultMerge` | `nodes/synthesis.ts` | 132 行 |
| `personalization` | `services/personalization.ts` | |
| `langfuseObservability` | `utils/langfuse.ts` | |
| `rankQuota` | `services/rank.ts` | |
| `multiProvider` | `ai-graph/providers/` | 5 個 provider |
| `circuitBreaker` | `utils/circuit-breaker.ts` | |
| `recommendation` | `services/recommendation.ts` | |

---

## 實作階段

### Phase 0 — 共用基礎

- hybridSearch 拆分（663 行 → 4 個獨立模組，刪除 ~190 行重複邏輯）
- rerank pipeline 抽成共用模組（semanticRerank → diversityFilter → domainRerank）
- strategyRouter（auto 在 index.ts 層選 graph）
- queryRewrite 節點（新建）
- retrievalQualityJudge 節點（新建）
- textNormalize（繁簡正規化）

### Phase 1 — Fast + Thorough

- 建立 `graphs/fast.ts` 和 `graphs/thorough.ts`
- 覆蓋 90% 流量
- 可跑 A/B 測試（evaluate-rag.yml）

### Phase 2 — Corrective + Deep

- retrievalRetry 迴圈節點（新建）
- contextCompression 節點（新建）
- 修改 parallelExecute 呼叫新模組
- 建立 `graphs/corrective.ts` 和 `graphs/deep.ts`

### Phase 3 — Agentic + Speculative（實驗性）

- iterativeRetrieval 每輪過 rerank（重構）
- draftAndVerify 節點（新建）
- 建立 `graphs/agentic.ts`（修正版）和 `graphs/speculative.ts`
- 需 eval 驗證效益後才決定是否上線

---

## Custom 模式

`rag_strategy: "custom"` 搭配 `rag_tools` 物件，可逐個開關 12 個工具：

```json
{
  "query": "...",
  "rag_strategy": "custom",
  "rag_tools": {
    "textNormalize": true,
    "hyde": false,
    "queryExpansion": false,
    "semanticRerank": true,
    "diversityFilter": true,
    "domainRerank": true,
    "responseQualityJudge": true,
    "retrievalQualityJudge": false,
    "generationRetry": false,
    "queryRewrite": false,
    "contextCompression": false,
    "conversationMemory": true
  }
}
```

未設定的工具預設開啟。只有明確 `false` 才跳過。實作機制是 `withToggle()` 包裝器（`shared/tool-toggle.ts`），graph 拓撲不變，關掉的節點返回空 state。

---

## Eval 體系

### 指令用法

```bash
# 基本 eval
tsx evaluate-rag.ts --api-url <url> --token <jwt>

# 指定策略
tsx evaluate-rag.ts --api-url <url> --token <jwt> --strategy fast --output report-fast.json

# 加 LLM-as-Judge（較慢，每題多 3 次 LLM 呼叫）
tsx evaluate-rag.ts --api-url <url> --token <jwt> --strategy thorough --llm-judge --output report-thorough.json

# 多策略比較
tsx compare-strategies.ts report-fast.json report-thorough.json report-corrective.json
```

### Report 結構

| 區塊 | 內容 |
|------|------|
| `metrics` | tool_accuracy, faithfulness, answer_relevancy, recall@5, filter_accuracy, success_rate |
| `performance` | latency avg/p50/p95, token avg/total |
| `sub_groups` | 按 category（simple/complex/GK/edge-case）分別報每個指標 |
| `retrieval` | avg candidates, paths, bm25_only/crag_fallback/reranker_used 計數 |
| `error_distribution` | retrieval_miss / ranking_miss / generation_miss / tool_miss 分類 |
| `llm_judge`（--llm-judge） | faithfulness/relevance/correctness 的獨立 LLM 評分 |

### Golden Test Set（v1.1.0）

- 60 題，4 categories（simple 22 / complex 21 / GK 11 / edge-case 6）
- CI 標記 20 題（每 category ≥ 5）
- 17 題有 ground_truth_answer（支援 Correctness eval）
- 待補：剩餘 43 題 ground_truth_answer、全部 expected_source_ids

---

## 參考文章

本設計基於以下 quidproquo 文章的研究結論：

- RAG 系統模式完整指南（十代演化）
- Naive → Advanced → Modular RAG 三代演化
- Modular RAG Pipeline（Pipeline as DAG）
- Agentic RAG（ReAct Loop）
- CRAG（Corrective RAG）
- Self-RAG（Reflection Tokens）
- Plan-and-Execute RAG
- Speculative RAG
- RAG 三種形態與 Evaluator Paradox
- Multi-hop Retrieval RAG
- Agentic Retrieval Decisions（三個決策層）
- Ask AI Hybrid Retrieval（Planner → 多路 Hybrid → Retry）
- RAG 成本優化
- RAG A/B 測試
- RAG 失敗模式
- 繁中 Embedding RAG 失敗
- Contextual Retrieval / Late Chunking
- GraphRAG / LightRAG / HippoRAG
- LangGraph Agent Orchestration
- Stanford CS329Z Workflows 與 RAG
- Agent-Workflow-RAG-MCP 概念界線
