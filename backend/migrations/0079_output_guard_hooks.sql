-- Add independent output guard hooks with config-driven parameters
-- Each hook is individually toggleable + configurable from admin panel

INSERT OR IGNORE INTO hooks (id, name, description, event, hook_type, implementation, config, priority, enabled, handler_type, handler_ref, blocking, timeout_ms, on_failure)
VALUES
  (hex(randomblob(16)), 'thinking_leak_guard',
   '偵測 LLM 內部推理洩漏（patterns + threshold 可從 config 調整），觸發時自動重生成',
   'post_loop', 'gate', 'builtin:thinking_leak_guard',
   '{"patterns":["我需要根據","我應該推薦","我必須根據","讓我看看","讓我分析","現在我需要","這與使用者說的.*有矛盾","根據規則\\s*\\d+","不過，根據規則"],"threshold":3,"retry_prompt":"你是 NobodyClimb 攀岩助理。用繁體中文回答。只輸出給使用者看的最終回答，禁止輸出任何內部推理、分析過程或重複內容。","fallback_message":"抱歉，AI 助理暫時無法處理您的問題，請稍後再試。"}',
   20, 1, 'builtin', 'builtin:thinking_leak_guard', 1, 10000, 'fail_open'),

  (hex(randomblob(16)), 'repetition_guard',
   '偵測 LLM 重複生成（thresholds 可從 config 調整），觸發時自動重生成',
   'post_loop', 'gate', 'builtin:repetition_guard',
   '{"min_line_length":20,"min_lines":4,"repeat_threshold":3,"fingerprint_length":60,"retry_prompt":"你是 NobodyClimb 攀岩助理。用繁體中文回答。只輸出給使用者看的最終回答，禁止輸出任何內部推理、分析過程或重複內容。","fallback_message":"抱歉，AI 助理暫時無法處理您的問題，請稍後再試。"}',
   30, 1, 'builtin', 'builtin:repetition_guard', 1, 10000, 'fail_open');

-- Register in enablement table
INSERT OR IGNORE INTO enablement (subject_type, subject_id, component_type, component_id, enabled)
  SELECT 'agent', 'default', 'hook', id, enabled
  FROM hooks
  WHERE name IN ('thinking_leak_guard', 'repetition_guard');
