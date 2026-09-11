-- ai_mode: 頂層執行模式（agent = Agent loop 為主 | pipeline = 傳統 RAG pipeline）
-- 從現有 rag_strategy 推導：react → agent，其他 → pipeline
INSERT OR IGNORE INTO ai_config (key, value)
  SELECT 'ai_mode',
    CASE WHEN value = 'react' THEN 'agent' ELSE 'pipeline' END
  FROM ai_config WHERE key = 'rag_strategy'
  UNION ALL
  SELECT 'ai_mode', 'agent' WHERE NOT EXISTS (SELECT 1 FROM ai_config WHERE key = 'rag_strategy');

-- 改名 react_* → agent_*（Phase 0 留下的 TODO）
UPDATE ai_config SET key = 'agent_max_turns'    WHERE key = 'react_max_turns';
UPDATE ai_config SET key = 'agent_token_budget' WHERE key = 'react_token_budget';
UPDATE ai_config SET key = 'agent_usd_to_twd'   WHERE key = 'react_usd_to_twd';
UPDATE ai_config SET key = 'agent_models'        WHERE key = 'react_models';
