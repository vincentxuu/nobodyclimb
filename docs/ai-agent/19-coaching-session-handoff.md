# AI 攀岩教練 — Session 交接文件

> 2026-09-14 開發 session 整理

---

## 一、今天完成的 PR

| PR | 內容 | 狀態 |
|---|---|---|
| #405 | Coaching agent 串接人格型態 + 訓練學派 | ✅ 已合 |
| #406 | Layer 3 AI 微調層（訓練歷史 + 完成模式 + 回饋） | ✅ 已合 |
| #407 | Coaching agent 整合測試（10 案例） | ✅ 已合 |
| #408 | `GET /coaching/analysis` 結構化 API | ✅ 已合 |
| #409 | `/profile/training` 教練頁面 + 導航 | ✅ 已合 |
| #410 | Profile layout auth hydration fix | ✅ 已合 |
| #411 | CI 品質門檻 + PR template + AI workflow 遷移 Cloudflare Workers AI | ✅ 已合 |
| #413 | Cascading Intent Router + 模型升級 + 後台模型設定面板 | ✅ 已合 |
| develop 直推 | CloudflareProvider 格式修正、model ID 修正、lint 全量格式化、pre-commit hook、web test fix | ✅ 已推 |

## 二、架構變更

### Cascading Intent Router

```
用戶輸入
  ├─ greeting/system → 固定回覆（0 LLM call）
  ├─ general_knowledge → 小模型直接回答
  ├─ coaching triggers 唯一命中 → 直接呼叫 coachingSubAgent（跳過 agent loop）
  └─ 其他 → agent loop（LLM 選 tool）
              └─ agent loop 失敗 → fallback 到 pipeline
```

- `detectDirectRoute()` 在 `classifier.ts`
- 目前只直接路由 `coaching`，`recommend` 留在 agent loop
- 理由：coaching 是獨立分析流程不需搭配其他 tool；recommend 常需搭配 search

### 模型升級

預設值（code defaults，DB 無覆寫時使用）：

| Role | 模型 | 用途 |
|---|---|---|
| orchestrator | `@cf/zai-org/glm-5.3-flash` | Agent loop tool selection |
| orchestrator fallback | `@cf/zai-org/glm-4.7-flash` | |
| hyde / multiQuery / textToSql | `@cf/zai-org/glm-4.7-flash` | 查詢處理 |
| judge | `@cf/qwen/qwen3-30b-a3b-fp8` | 品質評估（不同家族避免 bias） |
| rerank | `@cf/baai/bge-reranker-v2-m3` | 搜尋重排序 |
| embedding | `@cf/baai/bge-m3` | 向量嵌入 |
| Pipeline llm_model | `@cf/zai-org/glm-5.3-flash` | Pipeline 回答生成 |
| Pipeline lightweight | `@cf/zai-org/glm-4.7-flash` | Pipeline 分類/壓縮 |

後台 `/admin/ai/agent` 可即時切換，Agent 模式 7 個 role + Pipeline 模式 3 個 role。

### CloudflareProvider 格式修正

`parseWorkersAIResponse()` 統一處理所有 Workers AI 模型的回傳格式：

```
content fallback chain: response → choices[0].message.content → reasoning_content → reasoning → ''
tool_calls: 頂層 tool_calls → 頂層 toolCalls → choices[0].message.tool_calls（空陣列也 fallback）
```

9 個 unit test 覆蓋：舊格式、新格式、空字串 fallback、null fallback、reasoning_content、reasoning、空陣列 tool_calls、空回應。

## 三、模型相容性測試結果

用 `wrangler dev` + `env.AI.run()` 實測原始回傳格式：

| Model | content | reasoning_content | reasoning | 教練測試 | 備註 |
|---|---|---|---|---|---|
| `glm-5.3-flash` | `""` | ✅ 有值 | - | ✅ 3020 字 | 推理模型，回答在 reasoning_content |
| `glm-4.7-flash` | `null` | ✅ 有值 | - | ✅ | 同上 |
| `qwen3-30b-a3b-fp8` | ✅ 有值 | - | - | ✅ 470-680 字 | 正常模型 |
| `qwen3.8-27b` | `null` | - | `null` | ⚠️ 空 | thinking 模型，需大 token budget |
| `llama-4-scout-17b` | ✅ 有值 | - | - | ✅ 1094-1258 字 | 舊格式 `{ response }` |
| `deepseek-v4-flash` | ✅ 有值 | ✅ 有值 | - | ✅ 524-1554 字 | 品質最好，有人格+學派 |
| `deepseek-v4-pro` | ✅ 有值 | ✅ 有值 | - | ✅ | 同上 |
| `mistral-small-3.1-24b` | 未測 | 未測 | - | 未測 | 需實測 |
| `gemma-4-26b` | 未測 | 未測 | - | 未測 | 需實測 |

### 教練回應品質排名

1. **deepseek-v4-flash** — 最完整（碎岩者、MacLeod、力量型、弱點、耐力、訓練、指板、人格）
2. **llama-4-scout** — 很完整（同上 7 個關鍵詞）
3. **glm-5.3-flash** — 有碎岩者和 MacLeod，但回答在 reasoning_content
4. **qwen3-30b** — 有弱點/耐力/訓練，但沒提到人格型態

## 四、待做事項

### 高優先

1. **批量模型測試腳本修正** — 目前 curl 30s 超時對推理模型不夠，token 15 分鐘過期對跑 9 個模型不夠。需要：
   - 每個模型重新登入取 token
   - 超時改 60s+
   - 或用 gatelane 跑（需先修 gatelane 的 `trace-store-fs` export 問題）

2. **Cloudflare API Token Workers AI 權限** — CI 的 auto-pr-description 和 code-review workflow 用 Cloudflare Workers AI，但 GitHub 的 `CLOUDFLARE_API_TOKEN` 沒有 Workers AI 權限。需去 Cloudflare Dashboard → API Tokens → 編輯 → 加 `Account > Workers AI > Read`

3. **preview DB 的 ai_config** — 目前已清掉覆寫（用 code defaults）。如果要在後台切模型，要先確認後台 UI 寫入的格式和 `loadModelMap()` / `loadPipelineConfig()` 讀取的格式一致

### 中優先

4. **qwen3.8-27b 的 thinking mode** — 如果要支援，需要在 `env.AI.run()` 時加 `enable_thinking: true` 或調大 `max_tokens`。目前建議不用這個模型當 orchestrator

5. **recommend 路由優化** — 目前走 agent loop，小模型可能選錯 tool。glm-5.3-flash 的 function calling 效果待驗證

6. **gatelane 整合** — `gatelane.yaml` 已寫好 12 個功能測試 + red team + blue team。需要：
   - 修 gatelane 的 `trace-store-fs` build 問題
   - 加 Cloudflare Workers AI 的 API token 做 LLM judge（或用 OpenAI/Anthropic key）

### 低優先

7. **streamChat 也要支援新格式** — `CloudflareProvider.streamChat()` 還是只解析 `{ response }` 的 SSE 格式，新模型可能回 OpenAI 相容的 SSE（`choices[0].delta.content`）

8. **debug log 清理** — `cloudflare.ts` 裡有 `console.error` debug log，確認功能穩定後移除

## 五、檔案索引

| 路徑 | 內容 |
|---|---|
| `backend/src/services/agent/classifier.ts` | 查詢分類 + `detectDirectRoute` intent routing |
| `backend/src/services/agent/index.ts` | `runAgent` 主入口 + 預設模型 + intent routing 呼叫 |
| `backend/src/services/agent/sub-agents/coaching-agent.ts` | Coaching sub-agent（gatherContext + synthesize） |
| `backend/src/services/agent/sub-agents/weakness-analysis.ts` | 結構化弱點分析 + 練習推薦 |
| `backend/src/services/orchestrators/ai-graph/providers/cloudflare.ts` | `parseWorkersAIResponse` 統一格式解析 |
| `backend/src/services/core/config.ts` | Pipeline 預設模型 |
| `backend/src/routes/coaching.ts` | `GET /coaching/analysis` API |
| `apps/web/src/app/[locale]/profile/training/page.tsx` | 教練頁面 |
| `apps/web/src/app/[locale]/admin/ai/agent/page.tsx` | 後台模型設定面板 |
| `gatelane.yaml` | 功能測試設定 |
| `.github/workflows/ci.yml` | CI 品質門檻 |
| `.husky/pre-commit` | Pre-commit hook（biome check） |

## 六、測試帳號

- **Preview URL**: https://preview.nobodyclimb.cc
- **Email**: `test-coach@nobodyclimb.cc`
- **Password**: `Test1234!`
- **User ID**: `c3d0a0b26f0a0c0e2bc9db60f84748a8`
- **人格型態**: PGB（碎岩者）
- **攀登記錄**: 12 筆（sport 為主）
- **訓練進度**: 6 天（完成 4/6）
- **Quota**: `daily_ai_limit: 50, daily_token_limit: 500000`（需定期重設 `daily_ai_used` 和 `daily_token_used`）
