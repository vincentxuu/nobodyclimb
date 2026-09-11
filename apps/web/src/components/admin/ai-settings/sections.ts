// =============================================
// 欄位定義：依使用頻率分成 collapsible sections
// =============================================

export interface ConfigField {
  key: string
  label: string
  placeholder: string
  hint: string
  kind?: 'text' | 'select' | 'textarea'
  options?: { value: string; label: string }[]
}

export interface FieldRow {
  /** 列標題（可選），用來在同一 section 內分小組 */
  title?: string
  fields: ConfigField[]
}

export interface GuardrailConfig {
  key: string
  label: string
  desc: string
}

export interface SectionDef {
  id: string
  title: string
  desc: string
  defaultOpen?: boolean
  rows?: FieldRow[]
  /** 以 ToggleGrid 呈現的 0/1 開關 */
  toggles?: ConfigField[]
  guardrails?: GuardrailConfig[]
  /** 獨立儲存的自訂面板 */
  panel?: 'pipeline' | 'cost'
}

const ON_OFF_OPTIONS = [
  { value: '1', label: '啟用' },
  { value: '0', label: '停用' },
]

const RAG_TOOL_FIELDS: ConfigField[] = [
  {
    key: 'rag_tool_textNormalize',
    label: '繁簡正規化',
    placeholder: '1',
    hint: '統一繁簡異體字，解決 embedding 偏差（textNormalize）',
  },
  {
    key: 'rag_tool_hyde',
    label: 'HyDE',
    placeholder: '1',
    hint: '假設性文件生成，擴展搜尋範圍（hyde）',
  },
  {
    key: 'rag_tool_queryExpansion',
    label: '查詢擴展',
    placeholder: '1',
    hint: '多角度改寫查詢（queryExpansion / multiQuery）',
  },
  {
    key: 'rag_tool_semanticRerank',
    label: '語意重排序',
    placeholder: '1',
    hint: 'Cross-encoder 精排（semanticRerank）',
  },
  {
    key: 'rag_tool_diversityFilter',
    label: '多樣性過濾',
    placeholder: '1',
    hint: 'MMR 去重（diversityFilter）',
  },
  {
    key: 'rag_tool_domainRerank',
    label: '領域重排序',
    placeholder: '1',
    hint: '影片數加權 + 已完攀排除（domainRerank）',
  },
  {
    key: 'rag_tool_responseQualityJudge',
    label: '回應品質評估',
    placeholder: '1',
    hint: 'Groundedness + Quality 評分（responseQualityJudge）',
  },
  {
    key: 'rag_tool_retrievalQualityJudge',
    label: '檢索品質評估',
    placeholder: '0',
    hint: '檢索後評估 recall 是否足夠（retrievalQualityJudge，Corrective 模式專用）',
  },
  {
    key: 'rag_tool_generationRetry',
    label: '生成重試',
    placeholder: '1',
    hint: '品質不足時改寫 query 或重新生成（generationRetry / selfReflection）',
  },
  {
    key: 'rag_tool_queryRewrite',
    label: '查詢改寫',
    placeholder: '1',
    hint: '品質回饋驅動的查詢改寫（queryRewrite）',
  },
  {
    key: 'rag_tool_contextCompression',
    label: '上下文壓縮',
    placeholder: '0',
    hint: '多源結果合併後壓縮 context（contextCompression，Deep 模式專用）',
  },
  {
    key: 'rag_tool_conversationMemory',
    label: '對話記憶',
    placeholder: '1',
    hint: '跨 session 對話記憶萃取（conversationMemory）',
  },
]

export const SECTIONS: SectionDef[] = [
  {
    id: 'strategy',
    title: 'RAG 策略',
    desc: '查詢走哪套檢索策略、由哪個引擎執行；儲存後立即生效',
    defaultOpen: true,
    rows: [
      {
        fields: [
          {
            key: 'rag_strategy',
            label: 'RAG 策略',
            placeholder: 'thorough',
            hint: 'fast = 低延遲（1-2s）；thorough = 完整精排（3-6s）；corrective = 檢索品質修正（4-8s）；deep = 子問題分解（6-12s）；custom = 自訂工具開關；agentic = 多輪動態搜尋；react = ReAct Agent；auto = 依複雜度自動選擇',
            kind: 'select',
            options: [
              { value: 'fast', label: 'fast — 低延遲（跳過 HyDE/Judge）' },
              { value: 'thorough', label: 'thorough — 完整精排' },
              { value: 'corrective', label: 'corrective — 檢索品質修正' },
              { value: 'deep', label: 'deep — 子問題分解 + 並行 + 合成' },
              { value: 'custom', label: 'custom — 自訂工具開關' },
              { value: 'agentic', label: 'agentic — 多輪動態搜尋' },
              { value: 'react', label: 'react — ReAct Agent 動態工具選擇' },
              { value: 'auto', label: 'auto — 依複雜度自動選擇' },
              { value: 'baseline', label: 'baseline — 同 thorough（向後相容）' },
              { value: 'plan-execute', label: 'plan-execute — 子任務規劃（舊版 deep）' },
            ],
          },
          {
            key: 'use_langgraph_engine',
            label: '執行引擎',
            placeholder: '0',
            hint: '決定上方 RAG 策略由哪套引擎執行：Pipeline 為線性 steps，LangGraph 為 state graph（同一策略對應各自實作）。策略選 react 時走獨立的 ReAct Agent，不套用此設定',
            kind: 'select',
            options: [
              { value: '0', label: 'Pipeline Engine（原始）' },
              { value: '1', label: 'LangGraph 引擎' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'tools',
    title: 'RAG 工具開關',
    desc: 'rag_strategy = custom 時的預設工具開關。未設定的工具預設開啟，明確停用才跳過；也可透過 API request body 的 rag_tools 逐次覆寫',
    defaultOpen: true,
    toggles: RAG_TOOL_FIELDS,
  },
  {
    id: 'models',
    title: '模型',
    desc: '各 pipeline 階段使用的 AI 模型，更換後立即生效',
    rows: [
      {
        fields: [
          {
            key: 'llm_model',
            label: '複雜查詢模型',
            placeholder: '@cf/google/gemma-3-12b-it',
            hint: 'complex queryType 的主力生成模型（Stage 6 LLM C）',
          },
          {
            key: 'simple_model',
            label: '簡單查詢模型',
            placeholder: '@cf/meta/llama-3.1-8b-instruct',
            hint: 'simple queryType 的輕量生成模型，速度較快',
          },
        ],
      },
      {
        fields: [
          {
            key: 'lightweight_model',
            label: '輕量模型',
            placeholder: '@cf/meta/llama-3.1-8b-instruct',
            hint: 'Judge 品質評判 + 通識回答（general-knowledge 路徑）使用',
          },
          {
            key: 'embedding_model',
            label: 'Embedding 模型',
            placeholder: '@cf/baai/bge-m3',
            hint: '文字轉向量模型，更換後需重新索引所有文件',
          },
        ],
      },
      {
        fields: [
          {
            key: 'contextual_rag_model',
            label: 'Contextual RAG 模型',
            placeholder: '@cf/meta/llama-3.1-8b-instruct',
            hint: '索引時生成語意摘要（Contextual RAG）使用的輕量 LLM，不影響查詢路徑',
          },
        ],
      },
    ],
  },
  {
    id: 'retrieval',
    title: '檢索',
    desc: 'Vectorize / BM25 候選池、RRF 門檻、查詢擴展與其超時',
    rows: [
      {
        title: '候選池與輸出',
        fields: [
          {
            key: 'max_results',
            label: '最終文件數',
            placeholder: '5',
            hint: 'MMR 選取後傳給 LLM C 的文件數（1–20）',
          },
          {
            key: 'list_response_limit',
            label: '清單輸出上限',
            placeholder: '10',
            hint: 'SQL 清單/影片/路線列表的最大輸出條數（3–50）',
          },
          {
            key: 'merge_top_k',
            label: 'Vectorize 候選池',
            placeholder: '10',
            hint: '每路 Vectorize 搜尋候選數（5–50），多岩場查詢自動 ×2',
          },
        ],
      },
      {
        fields: [
          {
            key: 'bm25_top_k',
            label: 'BM25 候選數',
            placeholder: '10',
            hint: 'FTS5 全文搜尋每次回傳的候選文件數（5–50），與向量路一同 RRF 合併',
          },
          {
            key: 'multi_query_count',
            label: 'Multi-Query 子查詢數',
            placeholder: '3',
            hint: 'Complex 查詢擴展為 N 個角度的子查詢（1–5）',
          },
          {
            key: 'min_vector_score',
            label: 'Vector Score 門檻',
            placeholder: '0.5',
            hint: '/ai/search 純語義搜尋端點的向量相似度門檻（0–1）',
          },
        ],
      },
      {
        title: 'RRF 門檻',
        fields: [
          {
            key: 'min_rrf_score',
            label: '無 filter',
            placeholder: '0.005',
            hint: '無 metadata filter 時過濾低分文件，越低 recall 越高（0–1）',
          },
          {
            key: 'min_rrf_score_filtered',
            label: '有 filter',
            placeholder: '0.002',
            hint: '有 grade/crag filter 時放寬門檻，因 metadata 已保障相關性',
          },
        ],
      },
      {
        title: '查詢擴展超時',
        fields: [
          {
            key: 'hyde_timeout_ms',
            label: 'HyDE 超時（ms）',
            placeholder: '5000',
            hint: 'HyDE 假設文件生成超時 → 跳過，使用原始查詢（1000–10000）',
          },
          {
            key: 'multi_query_timeout_ms',
            label: 'Multi-Query 超時（ms）',
            placeholder: '5000',
            hint: 'Multi-Query 擴展超時 → 跳過，使用原始查詢（1000–10000）',
          },
        ],
      },
      {
        title: 'Tool Selection',
        fields: [
          {
            key: 'tool_confidence_threshold',
            label: '信心閾值',
            placeholder: '0.7',
            hint: 'Tool Selection confidence 低於此值時降級為 general_knowledge（0–1）',
          },
        ],
      },
    ],
  },
  {
    id: 'ranking',
    title: '排名',
    desc: 'MMR 多樣性、Cross-encoder 與熱門度加權、Reranker 過濾',
    rows: [
      {
        fields: [
          {
            key: 'mmr_lambda',
            label: 'MMR Lambda',
            placeholder: '0.6',
            hint: 'λ 越高越重視相關性，越低結果越多樣（0.0–1.0，建議 0.5–0.7）',
          },
        ],
      },
      {
        title: '權重（兩者自動歸一化）',
        fields: [
          {
            key: 'reranker_weight',
            label: 'Cross-encoder 權重',
            placeholder: '0.7',
            hint: '比例越高，cross-encoder 分數佔比越大',
          },
          {
            key: 'popularity_weight',
            label: '熱門度權重',
            placeholder: '0.3',
            hint: '依路線影片數量加權，無需與 reranker_weight 合計恰好為 1',
          },
        ],
      },
      {
        title: 'Reranker 過濾',
        fields: [
          {
            key: 'reranker_relevance_threshold',
            label: '相關性閾值',
            placeholder: '0.3',
            hint: 'Reranker score 低於此值的文件直接丟棄，減少 context 雜訊（0–1）',
          },
          {
            key: 'reranker_min_keep',
            label: '最低保留數',
            placeholder: '2',
            hint: '即使全部低於閾值，至少保留 score 最高的前 N 筆（1–20）',
          },
        ],
      },
    ],
  },
  {
    id: 'quality',
    title: '品質',
    desc: 'Token 上限、Groundedness 閾值、Judge 與 Self-Reflection',
    rows: [
      {
        title: 'Token 限制',
        fields: [
          {
            key: 'max_tokens_generation',
            label: '生成',
            placeholder: '800',
            hint: '主力生成（LLM C）與 self-reflection 重生成（200–2000）',
          },
          {
            key: 'max_tokens_gk',
            label: '通識',
            placeholder: '600',
            hint: 'general-knowledge 路徑（不走 RAG）的 max_tokens（200–2000）',
          },
          {
            key: 'high_consumption_threshold',
            label: '高消耗門檻',
            placeholder: '1000',
            hint: '超過此 token 數時日誌標記 is_high_consumption，供監控告警',
          },
        ],
      },
      {
        title: 'Groundedness 閾值',
        fields: [
          {
            key: 'groundedness_disclaimer_low',
            label: '強警示',
            placeholder: '0.6',
            hint: '低於此值時在回答前注入強警示（0–1）',
          },
          {
            key: 'groundedness_disclaimer_mid',
            label: '輕警示',
            placeholder: '0.8',
            hint: '低於此值時注入提醒（應大於強警示閾值）',
          },
          {
            key: 'groundedness_flag_threshold',
            label: '自動送審',
            placeholder: '0.5',
            hint: '低於此值時自動寫入 ai_flagged_responses 待人工審核',
          },
        ],
      },
      {
        title: 'Judge',
        fields: [
          {
            key: 'judge_timeout_ms',
            label: '逾時（ms）',
            placeholder: '8000',
            hint: 'Judge LLM 呼叫逾時上限，超時則跳過評分（1000–30000）',
          },
          {
            key: 'judge_context_truncate',
            label: 'Context 截斷（字）',
            placeholder: '2000',
            hint: '傳給 Judge LLM 的 context 最大字元數（200–3000）',
          },
          {
            key: 'judge_regen_quality_max',
            label: '重生成觸發門檻',
            placeholder: '2',
            hint: 'quality 等於或低於此值時觸發重生成（1=很差、2=差、3=好、4=優）',
          },
        ],
      },
      {
        title: 'Self-Reflection',
        fields: [
          {
            key: 'self_reflection_min_length',
            label: '最小觸發長度（字）',
            placeholder: '50',
            hint: '回答字元數低於此值時跳過 self-reflection（10–500）',
          },
        ],
      },
    ],
  },
  {
    id: 'chat',
    title: '對話',
    desc: '多輪對話歷史深度、KV 快取與語義快取',
    rows: [
      {
        fields: [
          {
            key: 'chat_history_depth',
            label: '歷史深度（則）',
            placeholder: '6',
            hint: '帶入 LLM 的最近對話訊息數（1 輪 = 2 則）（2–20）',
          },
          {
            key: 'assistant_history_truncate',
            label: 'Assistant 歷史截斷（字）',
            placeholder: '500',
            hint: '歷史 assistant 訊息傳入 LLM 前的截斷長度（100–2000）',
          },
          {
            key: 'cache_ttl',
            label: '快取 TTL（秒）',
            placeholder: '3600',
            hint: '相同查詢的 KV 快取存活時間（60–86400）',
          },
        ],
      },
      {
        title: '語義快取（僅匿名且無對話歷史）',
        fields: [
          {
            key: 'semantic_cache_enabled',
            label: '啟用語義快取',
            placeholder: '0',
            hint: '建議先在測試環境驗證命中率再開啟',
            kind: 'select',
            options: ON_OFF_OPTIONS,
          },
          {
            key: 'semantic_cache_threshold',
            label: '相似度門檻',
            placeholder: '0.95',
            hint: 'Cosine similarity 高於此值視為相同問題（0.80–1.00）',
          },
        ],
      },
    ],
  },
  {
    id: 'advanced',
    title: '進階策略',
    desc: 'Agentic / Plan-Execute / ReAct 各策略的專屬參數，僅對應策略啟用時生效',
    rows: [
      {
        title: 'Agentic（多輪動態搜尋）',
        fields: [
          {
            key: 'agentic_max_steps',
            label: '最大搜尋輪數',
            placeholder: '3',
            hint: '最多執行幾次額外搜尋（1–5），每輪 +0.5–1s 延遲',
          },
          {
            key: 'agentic_min_docs_to_answer',
            label: '提前結束文件數',
            placeholder: '3',
            hint: '累積超過此數量的文件後提前結束迴圈（1–10）',
          },
        ],
      },
      {
        title: 'Plan-and-Execute',
        fields: [
          {
            key: 'plan_execute_max_steps',
            label: '最大子任務數',
            placeholder: '4',
            hint: '規劃階段最多生成幾個子任務（1–8）',
          },
          {
            key: 'plan_execute_min_entities',
            label: 'Auto 最低實體數',
            placeholder: '2',
            hint: '僅 auto 模式：子任務數少於此值時降級為 agentic（1–5）',
          },
          {
            key: 'adaptive_plan_enabled',
            label: 'Adaptive Replan',
            placeholder: '1',
            hint: '子任務結果為空時自動生成替代子任務',
            kind: 'select',
            options: ON_OFF_OPTIONS,
          },
        ],
      },
      {
        fields: [
          {
            key: 'planning_timeout_ms',
            label: '規劃超時（ms）',
            placeholder: '8000',
            hint: 'Planning LLM 超時則 fallback 到 agentic（3000–15000）',
          },
          {
            key: 'plan_step_timeout_ms',
            label: '子任務超時（ms）',
            placeholder: '5000',
            hint: '每個子任務（embedding + 搜尋）超時回傳空結果（2000–10000）',
          },
          {
            key: 'synthesis_timeout_ms',
            label: '合成超時（ms）',
            placeholder: '8000',
            hint: 'Synthesis LLM 超時使用 fallback 拼接（3000–15000）',
          },
        ],
      },
      {
        title: 'ReAct Agent',
        fields: [
          {
            key: 'react_max_turns',
            label: '最大 Turn 數',
            placeholder: '3',
            hint: '1 turn = 1 次 orchestrator call，每輪 2-3s（1–5）',
          },
          {
            key: 'react_token_budget',
            label: 'Token 預算',
            placeholder: '8000',
            hint: '累計 token 上限，優先於 maxTurns 觸發停止（2000–20000）',
          },
          {
            key: 'react_usd_to_twd',
            label: 'USD → TWD 匯率',
            placeholder: '32.0',
            hint: '成本 dashboard 換算用，月結時手動校正即可',
          },
        ],
      },
      {
        fields: [
          {
            key: 'react_models',
            label: '模型配置（JSON ModelMap）',
            placeholder:
              '{"orchestrator":{"provider":"workers-ai","model":"@cf/meta/llama-4-scout-17b-16e-instruct"},...}',
            hint: '每個觸點（orchestrator/hyde/multiQuery/textToSql/rerank/judge/embedding）可獨立配置 provider（workers-ai/anthropic/openai/google/github）+ model + 可選 fallback chain。留空使用預設值',
            kind: 'textarea',
          },
        ],
      },
    ],
  },
  {
    id: 'timeout',
    title: '超時與熔斷',
    desc: '各階段超時上限（超時後自動降級）與 Workers AI 熔斷器',
    rows: [
      {
        title: 'Pipeline 超時',
        fields: [
          {
            key: 'pipeline_timeout_ms',
            label: '整體（ms）',
            placeholder: '40000',
            hint: '整個 pipeline 的最大執行時間，超時回傳 408（5000–60000）',
          },
          {
            key: 'embedding_timeout_ms',
            label: 'Embedding（ms）',
            placeholder: '3000',
            hint: '向量嵌入超時 → 降級為僅 BM25 搜尋（1000–10000）',
          },
        ],
      },
      {
        fields: [
          {
            key: 'search_timeout_ms',
            label: '搜尋（ms）',
            placeholder: '4000',
            hint: 'Hybrid Search 超時（1000–15000）',
          },
          {
            key: 'generation_timeout_ms',
            label: 'LLM 生成（ms）',
            placeholder: '18000',
            hint: '生成超時 → 回傳超時錯誤訊息，跳過 evaluation（3000–30000）',
          },
        ],
      },
      {
        title: 'Circuit Breaker',
        fields: [
          {
            key: 'circuit_breaker_threshold',
            label: '熔斷觸發次數',
            placeholder: '5',
            hint: '連續失敗幾次後觸發 Open 狀態（2–20）',
          },
          {
            key: 'circuit_breaker_reset_ms',
            label: '冷卻時間（ms）',
            placeholder: '30000',
            hint: 'Open 狀態持續多久後進入 Half-Open 探測（5000–120000）',
          },
        ],
      },
    ],
  },
  {
    id: 'safety',
    title: '安全',
    desc: '輸出截斷上限與輸入 / 輸出防護關鍵字清單',
    rows: [
      {
        fields: [
          {
            key: 'max_output_length',
            label: '輸出最大字元數',
            placeholder: '3000',
            hint: '回應超過此字元數時自動截斷並提示（500–10000）',
          },
        ],
      },
    ],
    guardrails: [
      {
        key: 'prompt_injection_keywords',
        label: '輸入防護：Prompt Injection 關鍵字',
        desc: '含有這些關鍵字的輸入會被拒絕（不分大小寫）',
      },
      {
        key: 'jailbreak_patterns',
        label: '輸入防護：Jailbreak 模式',
        desc: '用於偵測角色扮演、繞過限制等越獄嘗試（不分大小寫）',
      },
      {
        key: 'system_prompt_leakage_patterns',
        label: '輸出防護：System Prompt 洩漏模式',
        desc: '輸出包含這些模式時視為 system prompt 洩漏，整段回答會替換為錯誤訊息',
      },
      {
        key: 'input_blocklist',
        label: '輸入防護：自訂黑名單',
        desc: '補充上方規則的自訂封鎖詞，適合加入特定業務需求的禁止詞彙',
      },
    ],
  },
  {
    id: 'pipeline',
    title: 'Pipeline Flow',
    desc: '各 stage 開關與執行順序（獨立儲存）',
    panel: 'pipeline',
  },
  {
    id: 'cost',
    title: '費用',
    desc: 'LLM 供應商每百萬 token 費率，供 Log 詳情頁費用分析使用（獨立儲存）',
    panel: 'cost',
  },
]

// =============================================
// 工具函式
// =============================================

export function sectionKeys(section: SectionDef): string[] {
  const keys: string[] = []
  for (const row of section.rows ?? []) for (const f of row.fields) keys.push(f.key)
  for (const t of section.toggles ?? []) keys.push(t.key)
  for (const g of section.guardrails ?? []) keys.push(g.key)
  return keys
}

export function parseTagList(json: string): string[] {
  try {
    const arr = JSON.parse(json) as string[]
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}
