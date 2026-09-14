import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from './client'

// =============================================
// 型別定義
// =============================================

export interface AIDashboardData {
  total_queries: number
  queries_today: number
  avg_latency_ms: number | null
  success_rate: number | null
  total_tokens: number
  tokens_today: number
  queries_weekly: { day: string; count: number }[]
  tokens_weekly: { day: string; tokens: number }[]
  top_queries: { query: string; count: number }[]
  health: { status: 'healthy' | 'unhealthy' | 'unknown' }
}

export interface AIQueryLog {
  id: string
  user_id: string | null
  username: string | null
  display_name: string | null
  query: string
  latency_ms: number | null
  feedback_score: number | null
  created_at: string
  query_type:
    | 'simple'
    | 'complex'
    | 'general-knowledge'
    | 'guardrails_blocked'
    | 'pipeline_timeout'
    | 'circuit_breaker_rejected'
    | null
  groundedness_score: number | null
  auto_score: number | null
  embedding_ms: number | null
  retrieval_ms: number | null
  generation_ms: number | null
  token_count: number | null
  is_high_consumption: number | null
  cache_hit: number | null
  hyde_triggered: number | null
}

export interface AILogsResponse {
  logs: AIQueryLog[]
  total: number
  page: number
  limit: number
}

// =============================================
// AI Log Detail (structured pipeline view)
// =============================================

interface PipelineStageBase {
  service: string
  description?: string
  skipped: boolean
}

export interface AILogDetail {
  id: string
  query: string
  response: string | null
  sources: Array<{ title?: string; type?: string; score?: number }>
  user: { id: string | null; username: string | null; display_name: string | null }
  created_at: string
  latency: {
    total_ms: number | null
    embedding_ms: number | null
    retrieval_ms: number | null
    generation_ms: number | null
  }
  quality: {
    groundedness_score: number | null
    auto_score: number | null
    feedback_score: number | null
    feedback_text: string | null
    flags: Array<{ type: string; is_reviewed: boolean; created_at: string }>
  }
  pipeline: {
    guardrails_input: PipelineStageBase
    cache: PipelineStageBase & { hit: boolean; cache_type?: 'kv' | 'semantic' }
    quota_check: PipelineStageBase
    query_parsing: PipelineStageBase & { query_type: string | null }
    text_to_sql: PipelineStageBase & { path: string | null; candidate_count: number | null }
    hyde: PipelineStageBase & { triggered: boolean }
    filter: PipelineStageBase & Record<string, unknown>
    embedding: PipelineStageBase & { duration_ms: number | null }
    retrieval: PipelineStageBase & {
      duration_ms: number | null
      top_score: number | null
      doc_count: number | null
    }
    generation: PipelineStageBase & {
      model: string | null
      duration_ms: number | null
      token_count: number | null
      is_high_consumption: boolean
    }
    self_reflection: PipelineStageBase & { triggered: boolean }
    judge: PipelineStageBase & {
      groundedness_score: number | null
      auto_score: number | null
      raw_scores?: Record<string, number>
      criteria?: string[]
    }
    guardrails_output: PipelineStageBase
    memory_extraction: PipelineStageBase
  }
  pipeline_trace: {
    guardrails_input?: {
      passed: boolean
      checks_run: string[]
      triggered_check: string | null
      triggered_keyword: string | null
      query_length: number
      blocklist_size: number
    }
    quota_check?: {
      rank: string
      daily_ai_used: number
      daily_ai_limit: number
      estimated_tokens: number
      result: 'passed' | 'admin_bypass'
    }
    query_parsing?: {
      tool: string
      query_type: string
      alternatives: string[]
      params: Record<string, unknown>
      fallback_used?: boolean
      confidence?: number
      retrieval_method?: string
    }
    text_to_sql?: {
      path?: string | null
      candidate_count?: number | null
      context_preview?: string | null
      candidates?: Array<{
        name: string
        grade?: string | null
        route_type?: string | null
        crag_name?: string | null
        bolt_count?: number | null
        height?: number | null
        description?: string | null
      }>
    }
    tool_selection?: {
      selected_tool: string
      confidence: number
      alternative?: string
      fallback?: {
        triggered: boolean
        from_tool?: string
        to_tool?: string
        reason?: string
      }
    }
    cache?: {
      type: 'kv' | 'semantic'
    }
    filter?: {
      applied: Record<string, unknown>
      source: string
      history_supplemented?: boolean
      matched_texts?: Record<string, string>
      resolved_ids?: { area_id?: string; crag_id?: string | string[] }
    }
    hyde?: {
      document: string
    }
    multi_query?: {
      queries: string[]
    }
    retrieval?: {
      retrieval_method?: string
      paths: string[]
      path_counts?: Record<string, number>
      path_results?: Record<string, Array<{ id: string; score: number; name?: string }>>
      bm25_fts_query?: string | null
      candidates_before_filter: number
      candidates_after_filter: number
      crag_fallback: boolean
      crag_fallback_stage?: 'grade' | null
      reranker_used?: boolean
      rrf?: {
        paths_count: number
        merged_count: number
        min_score_threshold: number
        after_threshold_count: number
      }
      crag_fallback_detail?: {
        trigger_reason: string
        retries: Array<{ removed_filter: string; candidates_after: number }>
      } | null
      reranker?: {
        input_count?: number
        top_scores?: Array<{ title: string; score: number }>
        skipped_reason?: string
      }
    }
    generation?: {
      context_doc_count: number
      personalized: boolean
      regen_triggered: boolean
      ability_level?: number | null
      memory_summary_length?: number
      suggested_questions?: string[]
      context_doc_titles?: string[]
      prompt_template?: 'personalized' | 'default'
      memory_summary_preview?: string | null
    }
    embedding?: {
      early_vector_reused: boolean
      hyde_embedded: boolean
      expanded_count: number
      skipped?: boolean
      reason?: string
    }
    self_reflection?: {
      original_quality: number | null
      original_groundedness: number | null
      regen_quality: number | null
      regen_groundedness: number | null
      regen_accepted: boolean
      first_judge_quality?: number | null
      first_judge_groundedness?: number | null
      regen_reason?: 'quality_below_threshold' | 'groundedness_below_threshold' | 'both'
      second_judge_quality?: number | null
      second_judge_groundedness?: number | null
      acceptance_reason?: 'regen_accepted' | 'original_kept'
    }
    guardrails_output?: {
      original_length: number
      output_length: number
      system_prompt_leaked: boolean
      pii_count: number
      truncated: boolean
    }
    memory_extraction?: {
      triggered: boolean
      async: boolean
      reason?: string
    }
    agentic?: {
      steps: Array<{
        step: number
        type: string
        refinedQuery?: string
        docs_retrieved?: number
        targetTool?: string
        reason?: string
        subQueries?: string[]
        verifyQuery?: string
      }>
      total_paths: number
      final_doc_count: number
      termination_reason?: 'enough_docs' | 'max_steps' | 'no_improvement'
      initial_search?: {
        initial_results_count: number
        min_docs_to_answer: number
        min_quality_score: number
        min_rrf_score: number
        quality_check?: { unique_count: number; avg_score: number; passed: boolean }
      }
    }
    plan_execute?: {
      strategy: string
      planning_duration_ms: number
      plan?: {
        steps: Array<{
          id: number
          query: string
          tool: string
          depends_on: number[]
          filters?: Record<string, unknown>
        }>
        execution_mode: string
      }
      steps?: Array<{
        stepId: number
        query: string
        tool: string
        result_count: number
        duration_ms: number
        error?: string
      }>
      execution_duration_ms?: number
      synthesis_duration_ms?: number
      total_duration_ms: number
      sources_count?: number
      adaptive_replan?: boolean
      adaptive_replan_info?: {
        trigger_step_id: number
        reason: string
        new_steps: Array<{ id: number; query: string; tool: string }>
      }
      plan_fallback?: {
        reason: string
        target: string
        step_count?: number
        min_required?: number
        error?: string
      }
    }
    multi_tool?: {
      steps?: Array<{
        stepId: number
        query: string
        tool: string
        result_count: number
        duration_ms: number
        error?: string
      }>
      execution_mode?: string
      total_duration_ms?: number
      sources_count?: number
      fallback?: boolean
      error?: string
    }
    token_breakdown?: {
      tool_selection?: {
        prompt_tokens: number
        completion_tokens: number
        total_tokens: number
        model: string
        estimated: boolean
      }
      text_to_sql?: {
        prompt_tokens: number
        completion_tokens: number
        total_tokens: number
        model: string
        estimated: boolean
      }
      hyde?: {
        prompt_tokens: number
        completion_tokens: number
        total_tokens: number
        model: string
        estimated: boolean
      }
      multi_query?: {
        prompt_tokens: number
        completion_tokens: number
        total_tokens: number
        model: string
        estimated: boolean
      }
      agentic_decisions?: Array<{
        step: number
        prompt_tokens: number
        completion_tokens: number
        total_tokens: number
        model: string
        estimated: boolean
      }>
      planning?: {
        prompt_tokens: number
        completion_tokens: number
        total_tokens: number
        model: string
        estimated: boolean
      }
      synthesis?: {
        prompt_tokens: number
        completion_tokens: number
        total_tokens: number
        model: string
        estimated: boolean
      }
      adaptive_replan?: {
        prompt_tokens: number
        completion_tokens: number
        total_tokens: number
        model: string
        estimated: boolean
      }
      main_generation?: {
        prompt_tokens: number
        completion_tokens: number
        total_tokens: number
        model: string
        estimated: boolean
      }
      self_reflection_regen?: {
        prompt_tokens: number
        completion_tokens: number
        total_tokens: number
        model: string
        estimated: boolean
      }
      judge?: {
        prompt_tokens: number
        completion_tokens: number
        total_tokens: number
        model: string
        estimated: boolean
      }
      judge_2nd?: {
        prompt_tokens: number
        completion_tokens: number
        total_tokens: number
        model: string
        estimated: boolean
      }
    }
    mmr_selection?: {
      lambda: number
      input_count: number
      selected_count: number
      popularity_weight: number
      top_selected?: Array<{
        title: string
        relevance_score: number
        popularity_score: number
        final_score: number
      }>
    }
    popularity_rerank?: {
      top_selected: Array<{
        title: string
        relevance_score: number
        popularity_score: number
        final_score: number
      }>
      popularity_weight: number
      doc_count: number
    }
    judge_detail?: {
      criteria: string[]
      raw_scores: Record<string, number>
    }
    degraded?: boolean
    degraded_stages?: string[]
    circuit_breaker?: {
      state: 'closed' | 'open' | 'half-open'
      failures: number
      action: 'allow' | 'reject' | 'probe'
    }
    pipeline_execution?: Array<{
      step: string
      status: string
      duration_ms?: number
      timeout?: boolean
      skipped?: boolean
      error?: string
    }>
    // React Agent 策略
    strategy?: string
    turn_count?: number
    tool_call_count?: number
    per_model_stats?: Array<{
      provider: string
      model: string
      inputTokens?: number
      outputTokens?: number
      calls?: number
      prompt_tokens?: number
      completion_tokens?: number
      cost_usd?: number
      cost_twd?: number
    }>
    // Agent turn-level traces
    turn_traces?: Array<{
      turn: number
      llmDurationMs: number
      tools: Array<{
        name: string
        durationMs: number
        resultCount?: number
        cacheHit?: boolean
        trace?: {
          embedding?: { duration_ms: number }
          retrieval?: {
            retrieval_method?: string
            paths: string[]
            path_counts?: Record<string, number>
            path_results?: Record<string, Array<{ id: string; score: number; name?: string }>>
            bm25_fts_query?: string | null
            candidates_before_filter: number
            candidates_after_filter: number
            crag_fallback: boolean
            crag_fallback_stage?: 'grade' | null
            reranker_used?: boolean
            rrf?: {
              paths_count: number
              merged_count: number
              min_score_threshold: number
              after_threshold_count: number
            }
            crag_fallback_detail?: {
              trigger_reason: string
              retries: Array<{ removed_filter: string; candidates_after: number }>
            } | null
          }
          filter?: Record<string, unknown>
          text_to_sql?: {
            template?: string
            params?: Record<string, unknown>
            query_ms?: number
            row_count?: number
          }
        }
      }>
      provider: string
      model: string
      usedFallback: boolean
    }>
    cost_usd?: number
    cost_twd?: number
  } | null
}

export interface AIKnowledgeSource {
  type: 'route' | 'crag'
  label: string
  total: number
  indexed: number
  last_indexed_at: string | null
}

export interface AIPrompt {
  id: string
  name: string
  version: number
  content?: string
  variables?: string
  status: 'draft' | 'active' | 'archived'
  created_at: string
  updated_at: string
}

export interface AIPromptDefault {
  name: string
  label: string
  content: string
  variables: string[]
}

export interface AIStats {
  total_queries: number
  total_tokens: number
  cache_hits: number
  avg_tokens: number
  total_prompt_tokens: number
  total_completion_tokens: number
  trace_count: number
  by_type: { simple: number; complex: number; general: number; blocked: number }
}

export interface CostProvider {
  id: string
  name: string
  input_per_1m: number
  output_per_1m: number
}

export const DEFAULT_COST_PROVIDERS: CostProvider[] = [
  // 現用模型
  {
    id: 'cf-gemma-3-12b',
    name: 'Cloudflare Gemma 3 12B',
    input_per_1m: 0.345,
    output_per_1m: 0.556,
  },
  // OpenAI GPT-5 系列（2026 主流）
  { id: 'openai-gpt-5-4', name: 'OpenAI GPT-5.4', input_per_1m: 2.5, output_per_1m: 15.0 },
  { id: 'openai-gpt-5', name: 'OpenAI GPT-5', input_per_1m: 1.25, output_per_1m: 10.0 },
  { id: 'openai-gpt-5-mini', name: 'OpenAI GPT-5 mini', input_per_1m: 0.25, output_per_1m: 2.0 },
  { id: 'openai-gpt-5-nano', name: 'OpenAI GPT-5 nano', input_per_1m: 0.05, output_per_1m: 0.4 },
  // Google Gemini
  {
    id: 'google-gemini-31-pro',
    name: 'Google Gemini 3.1 Pro',
    input_per_1m: 2.0,
    output_per_1m: 12.0,
  },
  {
    id: 'google-gemini-3-flash',
    name: 'Google Gemini 3 Flash',
    input_per_1m: 0.5,
    output_per_1m: 3.0,
  },
  {
    id: 'google-gemini-31-flash-lite',
    name: 'Google Gemini 3.1 Flash-Lite',
    input_per_1m: 0.25,
    output_per_1m: 1.5,
  },
  // Anthropic Claude
  {
    id: 'anthropic-claude-opus-46',
    name: 'Anthropic Claude Opus 4.6',
    input_per_1m: 5.0,
    output_per_1m: 25.0,
  },
  {
    id: 'anthropic-claude-sonnet-46',
    name: 'Anthropic Claude Sonnet 4.6',
    input_per_1m: 3.0,
    output_per_1m: 15.0,
  },
  {
    id: 'anthropic-claude-haiku-45',
    name: 'Anthropic Claude Haiku 4.5',
    input_per_1m: 1.0,
    output_per_1m: 5.0,
  },
]

// =============================================
// API 函式
// =============================================

export async function getAIDashboard(): Promise<AIDashboardData> {
  const res = await apiClient.get<{ success: boolean; data: AIDashboardData }>(
    '/admin/ai/dashboard'
  )
  return res.data.data
}

export async function getAILogs(params: {
  page?: number
  limit?: number
  from?: string
  to?: string
  feedback_min?: number
  feedback_max?: number
  query_type?: string
  search?: string
  user_id?: string
}): Promise<AILogsResponse> {
  const query = new URLSearchParams()
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))
  if (params.from) query.set('from', params.from)
  if (params.to) query.set('to', params.to)
  if (params.feedback_min !== undefined) query.set('feedback_min', String(params.feedback_min))
  if (params.feedback_max !== undefined) query.set('feedback_max', String(params.feedback_max))
  if (params.query_type) query.set('query_type', params.query_type)
  if (params.search) query.set('search', params.search)
  if (params.user_id) query.set('user_id', params.user_id)
  const res = await apiClient.get<{ success: boolean; data: AILogsResponse }>(
    `/admin/ai/logs?${query.toString()}`
  )
  return res.data.data
}

export async function getAILogDetail(id: string): Promise<AILogDetail> {
  const res = await apiClient.get<{ success: boolean; data: AILogDetail }>(`/admin/ai/logs/${id}`)
  return res.data.data
}

export async function getAIKnowledge(): Promise<{ sources: AIKnowledgeSource[] }> {
  const res = await apiClient.get<{ success: boolean; data: { sources: AIKnowledgeSource[] } }>(
    '/admin/ai/knowledge'
  )
  return res.data.data
}

export async function getAIPromptDefaults(): Promise<AIPromptDefault[]> {
  const res = await apiClient.get<{ success: boolean; data: AIPromptDefault[] }>(
    '/admin/ai/prompts/defaults'
  )
  return res.data.data
}

export async function getAIPromptsByName(name: string): Promise<AIPrompt[]> {
  const res = await apiClient.get<{ success: boolean; data: AIPrompt[] }>(
    `/admin/ai/prompts?name=${encodeURIComponent(name)}`
  )
  return res.data.data
}

export async function getAIPrompts(): Promise<AIPrompt[]> {
  const res = await apiClient.get<{ success: boolean; data: AIPrompt[] }>('/admin/ai/prompts')
  return res.data.data
}

export async function getAIPrompt(id: string): Promise<AIPrompt> {
  const res = await apiClient.get<{ success: boolean; data: AIPrompt }>(`/admin/ai/prompts/${id}`)
  return res.data.data
}

export async function createAIPrompt(data: {
  name: string
  content: string
  variables?: string[]
  status?: 'draft' | 'active' | 'archived'
}): Promise<{ id: string }> {
  const res = await apiClient.post<{ success: boolean; data: { id: string } }>(
    '/admin/ai/prompts',
    data
  )
  return res.data.data
}

export async function updateAIPrompt(
  id: string,
  data: { content?: string; variables?: string[]; status?: 'draft' | 'active' | 'archived' }
): Promise<void> {
  await apiClient.put(`/admin/ai/prompts/${id}`, data)
}

export async function deleteAIPrompt(id: string): Promise<void> {
  await apiClient.delete(`/admin/ai/prompts/${id}`)
}

export async function getAIStats(params: { from: string; to: string }): Promise<AIStats> {
  const query = new URLSearchParams({ from: params.from, to: params.to })
  const res = await apiClient.get<{ success: boolean; data: AIStats }>(
    `/admin/ai/stats?${query.toString()}`
  )
  return res.data.data
}

export async function getAIConfig(): Promise<Record<string, string>> {
  const res = await apiClient.get<{ success: boolean; data: Record<string, string> }>(
    '/admin/ai/config'
  )
  return res.data.data
}

export async function updateAIConfig(config: Record<string, string>): Promise<void> {
  await apiClient.put('/admin/ai/config', config)
}

// =============================================
// TanStack Query Hooks
// =============================================

export function useAIDashboard() {
  return useQuery({
    queryKey: ['admin-ai-dashboard'],
    queryFn: getAIDashboard,
    staleTime: 60 * 1000,
  })
}

export function useAILogs(params: Parameters<typeof getAILogs>[0]) {
  return useQuery({
    queryKey: ['admin-ai-logs', params],
    queryFn: () => getAILogs(params),
    staleTime: 30 * 1000,
  })
}

export function useAILogDetail(id: string) {
  return useQuery<AILogDetail>({
    queryKey: ['admin-ai-log', id],
    queryFn: () => getAILogDetail(id),
    enabled: !!id,
    refetchInterval: (query) => {
      const judge = query.state.data?.pipeline?.judge
      if (!judge || judge.skipped || judge.auto_score != null) return false
      // Judge 失敗時分數永遠是 null，建立超過 30s 後停止輪詢
      const createdAt = query.state.data?.created_at
      if (createdAt && Date.now() - new Date(createdAt).getTime() > 30_000) return false
      return 1000
    },
  })
}

export function useAIKnowledge() {
  return useQuery({
    queryKey: ['admin-ai-knowledge'],
    queryFn: getAIKnowledge,
    staleTime: 60 * 1000,
  })
}

export function useAIPromptDefaults() {
  return useQuery({
    queryKey: ['admin-ai-prompt-defaults'],
    queryFn: getAIPromptDefaults,
    staleTime: 10 * 60 * 1000,
  })
}

export function useAIPromptsByName(name: string) {
  return useQuery({
    queryKey: ['admin-ai-prompts', name],
    queryFn: () => getAIPromptsByName(name),
    enabled: !!name,
    staleTime: 30 * 1000,
  })
}

export function useCreateAIPrompt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createAIPrompt,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-ai-prompts'] })
      queryClient.invalidateQueries({ queryKey: ['admin-ai-prompts', variables.name] })
    },
  })
}

export function useAIPrompts() {
  return useQuery({
    queryKey: ['admin-ai-prompts'],
    queryFn: getAIPrompts,
    staleTime: 60 * 1000,
  })
}

export function useAIPrompt(id: string) {
  return useQuery({
    queryKey: ['admin-ai-prompt', id],
    queryFn: () => getAIPrompt(id),
    enabled: !!id,
  })
}

export function useUpdateAIPrompt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateAIPrompt>[1] }) =>
      updateAIPrompt(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ai-prompts'] })
    },
  })
}

export function useDeleteAIPrompt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteAIPrompt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ai-prompts'] })
    },
  })
}

export function useAIStats(params: { from: string; to: string } | null) {
  return useQuery({
    queryKey: ['admin-ai-stats', params],
    queryFn: () => getAIStats(params!),
    enabled: !!params,
    staleTime: 60 * 1000,
  })
}

export function useAIConfig() {
  return useQuery({
    queryKey: ['admin-ai-config'],
    queryFn: getAIConfig,
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdateAIConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateAIConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ai-config'] })
    },
  })
}

// =============================================
// 用戶等級管理
// =============================================

export interface UserRankDetail {
  user_id: string
  score: number
  rank_id: string
  rank_display_name: string
  rank_override_id: string | null
  daily_ai_used: number
  daily_ai_limit: number
  last_reset_date: string
  last_score_calculated_at: string | null
  updated_at: string
  score_breakdown: {
    biography_fields: number
    biography_bucket_list: number
    biography_public: number
    core_stories: number
    one_liners: number
    stories: number
    route_ascents: number
    bucket_list_items: number
    bucket_list_completed: number
    total: number
  }
}

export type RankId = 'foothill' | 'wall' | 'ridge' | 'summit'

export async function getUserRankDetail(userId: string): Promise<UserRankDetail> {
  const res = await apiClient.get<{ success: boolean; data: UserRankDetail }>(
    `/admin/ai/users/${userId}/rank`
  )
  return res.data.data
}

export async function recalculateUserRank(userId: string): Promise<void> {
  await apiClient.post('/admin/ai/recalculate-ranks', { user_id: userId })
}

export async function overrideUserRank(userId: string, rank: RankId | null): Promise<void> {
  await apiClient.put(`/admin/ai/users/${userId}/rank-override`, { rank })
}

export function useUserRankDetail(userId: string | null) {
  return useQuery({
    queryKey: ['admin-user-rank', userId],
    queryFn: () => getUserRankDetail(userId!),
    enabled: !!userId,
    staleTime: 30 * 1000,
  })
}

export function useRecalculateRank() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: recalculateUserRank,
    onSuccess: (_data, userId) => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-rank', userId] })
    },
  })
}

export function useOverrideUserRank() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, rank }: { userId: string; rank: RankId | null }) =>
      overrideUserRank(userId, rank),
    onSuccess: (_data, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-rank', userId] })
    },
  })
}

// =============================================
// Pipeline Steps 管理
// =============================================

export interface PipelineStepInfo {
  id: string
  name: string
  description: string
  phase: 'pre-retrieval' | 'retrieval' | 'post-retrieval' | 'generation' | 'evaluation'
  enabled: boolean
  order: number
  requires: string[]
  provides: string[]
  skipWhen: Array<{ field: string; operator: string; value: unknown }>
}

export interface PipelineStepUpdate {
  id: string
  enabled: boolean
  order: number
}

export async function fetchPipelineSteps(): Promise<PipelineStepInfo[]> {
  const res = await apiClient.get<{ success: boolean; data: PipelineStepInfo[] }>(
    '/admin/ai/pipeline-steps'
  )
  return res.data.data
}

export async function updatePipelineSteps(steps: PipelineStepUpdate[]): Promise<void> {
  await apiClient.put('/admin/ai/pipeline-steps', { steps })
}

export function usePipelineSteps() {
  return useQuery({
    queryKey: ['admin-ai-pipeline-steps'],
    queryFn: fetchPipelineSteps,
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdatePipelineSteps() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updatePipelineSteps,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ai-pipeline-steps'] })
    },
  })
}

// =============================================
// Metrics 趨勢分析
// =============================================

export interface MetricsDailyLatency {
  embedding_p50: number | null
  embedding_p95: number | null
  retrieval_p50: number | null
  retrieval_p95: number | null
  generation_p50: number | null
  generation_p95: number | null
  total_p50: number | null
  total_p95: number | null
}

export interface MetricsDailyQuality {
  avg_groundedness: number | null
  avg_auto_score: number | null
  avg_feedback_score: number | null
}

export interface MetricsDailyCache {
  hit_rate: number
  kv_hits: number
  semantic_hits: number
  misses: number
}

export interface MetricsDaily {
  date: string
  query_count: number
  latency: MetricsDailyLatency
  quality: MetricsDailyQuality
  cache: MetricsDailyCache
  query_types: Record<string, number>
  anomalies: string[]
}

export interface MetricsSummary {
  total_queries: number
  avg_latency_ms: number | null
  avg_groundedness: number | null
  cache_hit_rate: number | null
}

export interface MetricsResponse {
  range: string
  daily: MetricsDaily[]
  summary: MetricsSummary
}

export type MetricsRange = '7d' | '30d' | '90d'

export function useAIMetrics(range: MetricsRange) {
  return useQuery({
    queryKey: ['admin-ai-metrics', range],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: MetricsResponse }>(
        `/admin/ai/metrics?range=${range}`
      )
      return res.data.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

// =============================================
// Tool Management
// =============================================

export interface AdminTool {
  id: string
  name: string
  description: string | null
  parameters: string | null
  enabled: number
  category: string | null
  tags: string | null
  description_override: string | null
  config: string | null
  source: string
  requires_auth: number
  stats_call_count: number
  stats_error_count: number
  stats_avg_latency_ms: number | null
  created_at: string
  updated_at: string
}

export async function getAdminTools(): Promise<AdminTool[]> {
  const res = await apiClient.get<{ success: boolean; data: AdminTool[] }>('/admin/ai/tools')
  return res.data.data
}

export async function updateAdminTool(
  name: string,
  data: { enabled?: number; description_override?: string | null; config?: string | null }
): Promise<void> {
  await apiClient.put(`/admin/ai/tools/${name}`, data)
}

export function useAdminTools() {
  return useQuery<AdminTool[]>({
    queryKey: ['admin-ai-tools'],
    queryFn: getAdminTools,
  })
}

export function useUpdateAdminTool() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ name, data }: { name: string; data: Parameters<typeof updateAdminTool>[1] }) =>
      updateAdminTool(name, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ai-tools'] })
    },
  })
}

// =============================================
// Hook Management
// =============================================

export type HookEvent =
  | 'pre_loop'
  | 'pre_turn'
  | 'pre_tool'
  | 'post_tool'
  | 'post_loop'
  | 'post_response'

export type HookType = 'gate' | 'enrich' | 'observe'

export interface AdminHook {
  id: string
  name: string
  description: string | null
  event: HookEvent
  hook_type: HookType
  implementation: string
  config: string | null
  priority: number
  enabled: number
  matcher: string | null
  handler_type: string
  handler_ref: string | null
  blocking: number
  timeout_ms: number
  on_failure: 'fail_open' | 'fail_closed'
  source_plugin_id: string | null
  created_at: string
  updated_at: string
}

export interface HookExecution {
  id: string
  hook_id: string
  session_id: string | null
  decision: 'allow' | 'deny' | 'modify' | 'noop' | null
  duration_ms: number | null
  error: string | null
  executed_at: string
}

export interface EnablementRecord {
  subject_type: string
  subject_id: string
  component_type: 'skill' | 'tool' | 'hook' | 'command'
  component_id: string
  pinned_version_id: string | null
  source_plugin_id: string | null
  enabled: number
}

export async function getAdminHooks(): Promise<AdminHook[]> {
  const res = await apiClient.get<{ success: boolean; data: AdminHook[] }>('/admin/ai/hooks')
  return res.data.data
}

export async function updateAdminHook(
  id: string,
  data: {
    enabled?: number
    config?: string | null
    priority?: number
    description?: string | null
    matcher?: string | null
    timeout_ms?: number
    on_failure?: string
    blocking?: number
  }
): Promise<void> {
  await apiClient.put(`/admin/ai/hooks/${id}`, data)
}

export async function getHookExecutions(hookId: string): Promise<HookExecution[]> {
  const res = await apiClient.get<{ success: boolean; data: HookExecution[] }>(
    `/admin/ai/hooks/${hookId}/executions`
  )
  return res.data.data
}

export async function getEnablement(
  subjectType = 'agent',
  subjectId = 'default'
): Promise<EnablementRecord[]> {
  const res = await apiClient.get<{ success: boolean; data: EnablementRecord[] }>(
    `/admin/ai/enablement?subject_type=${subjectType}&subject_id=${subjectId}`
  )
  return res.data.data
}

export function useAdminHooks() {
  return useQuery<AdminHook[]>({
    queryKey: ['admin-ai-hooks'],
    queryFn: getAdminHooks,
  })
}

export function useUpdateAdminHook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateAdminHook>[1] }) =>
      updateAdminHook(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ai-hooks'] })
    },
  })
}

export function useHookExecutions(hookId: string) {
  return useQuery<HookExecution[]>({
    queryKey: ['admin-ai-hook-executions', hookId],
    queryFn: () => getHookExecutions(hookId),
    enabled: !!hookId,
  })
}

export function useEnablement(subjectType = 'agent', subjectId = 'default') {
  return useQuery<EnablementRecord[]>({
    queryKey: ['admin-ai-enablement', subjectType, subjectId],
    queryFn: () => getEnablement(subjectType, subjectId),
  })
}

// =============================================
// Admin Skill Management
// =============================================

// ---------------------------------------------------------------------------
// Skill types (multi-table: skill + skill_version + skill_file + skill_binding)
// ---------------------------------------------------------------------------

export interface SkillVersionSummary {
  id: string
  version_number: number
  status: 'draft' | 'published' | 'deprecated'
  description: string
  published_at: string | null
  created_at: string
}

export interface SkillVersion extends SkillVersionSummary {
  name: string
  body: string | null
  allowed_tools: string[]
  content_hash: string
  token_count: number | null
  metadata: Record<string, unknown> | null
}

export interface SkillFile {
  id: string
  path: string
  size_bytes: number | null
  content_type: string | null
}

export interface SkillBinding {
  id: string
  enabled: boolean
  pinned_version_id: string | null
}

export interface AdminSkill {
  id: string
  tenant_id: string
  slug: string
  display_name: string | null
  scope: 'personal' | 'team' | 'org' | 'public'
  owner_id: string | null
  source: 'builtin' | 'custom' | 'marketplace'
  latest_version_id: string | null
  created_at: string
  version?: SkillVersion | null
  binding?: SkillBinding | null
  versions?: SkillVersionSummary[]
  files?: SkillFile[]
}

// ---------------------------------------------------------------------------
// Skill API functions
// ---------------------------------------------------------------------------

export async function getAdminSkills(): Promise<AdminSkill[]> {
  const res = await apiClient.get<{ success: boolean; data: AdminSkill[] }>('/admin/ai/skills')
  return res.data.data
}

export async function getAdminSkill(id: string): Promise<AdminSkill> {
  const res = await apiClient.get<{ success: boolean; data: AdminSkill }>(`/admin/ai/skills/${id}`)
  return res.data.data
}

export async function createAdminSkill(data: {
  slug: string
  display_name?: string
  scope?: string
  description: string
  body?: string
  allowed_tools?: string[]
}): Promise<AdminSkill> {
  const res = await apiClient.post<{ success: boolean; data: AdminSkill }>('/admin/ai/skills', data)
  return res.data.data
}

export async function updateAdminSkill(
  id: string,
  data: { display_name?: string; scope?: string }
): Promise<void> {
  await apiClient.put(`/admin/ai/skills/${id}`, data)
}

export async function publishSkillVersion(
  id: string,
  data: { description: string; body?: string; allowed_tools?: string[] }
): Promise<SkillVersion> {
  const res = await apiClient.post<{ success: boolean; data: SkillVersion }>(
    `/admin/ai/skills/${id}/versions`,
    data
  )
  return res.data.data
}

export async function updateSkillBinding(
  id: string,
  data: { enabled?: boolean; pinned_version_id?: string | null }
): Promise<void> {
  await apiClient.put(`/admin/ai/skills/${id}/binding`, data)
}

export async function deprecateSkillVersion(skillId: string, versionId: string): Promise<void> {
  await apiClient.put(`/admin/ai/skills/${skillId}/versions/${versionId}`, {
    status: 'deprecated',
  })
}

export async function deleteAdminSkill(id: string): Promise<void> {
  await apiClient.delete(`/admin/ai/skills/${id}`)
}

export async function importSkill(content: string): Promise<AdminSkill> {
  const res = await apiClient.post<{ success: boolean; data: AdminSkill }>(
    '/admin/ai/skills/import',
    { content }
  )
  return res.data.data
}

export async function exportSkill(id: string): Promise<string> {
  const res = await apiClient.get<{ success: boolean; data: { content: string } }>(
    `/admin/ai/skills/${id}/export`
  )
  return res.data.data.content
}

export async function testSkillTrigger(
  query: string
): Promise<{ matched: Array<{ slug: string; description: string; scope: string }> }> {
  const res = await apiClient.post<{
    success: boolean
    data: { matched: Array<{ slug: string; description: string; scope: string }> }
  }>('/admin/ai/skills/test-trigger', { query })
  return res.data.data
}

// ---------------------------------------------------------------------------
// Skill query hooks
// ---------------------------------------------------------------------------

export function useAdminSkills() {
  return useQuery<AdminSkill[]>({
    queryKey: ['admin-ai-skills'],
    queryFn: getAdminSkills,
  })
}

export function useAdminSkill(id: string) {
  return useQuery<AdminSkill>({
    queryKey: ['admin-ai-skill', id],
    queryFn: () => getAdminSkill(id),
    enabled: !!id,
  })
}

export function useCreateAdminSkill() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createAdminSkill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ai-skills'] })
    },
  })
}

export function useUpdateAdminSkill() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateAdminSkill>[1] }) =>
      updateAdminSkill(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ai-skills'] })
    },
  })
}

export function usePublishSkillVersion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof publishSkillVersion>[1] }) =>
      publishSkillVersion(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ai-skills'] })
    },
  })
}

export function useUpdateSkillBinding() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateSkillBinding>[1] }) =>
      updateSkillBinding(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ai-skills'] })
    },
  })
}

export function useDeleteAdminSkill() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteAdminSkill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ai-skills'] })
    },
  })
}

// =============================================
// MCP Server Types & API
// =============================================

export interface AdminMCPServer {
  id: string
  tenant_id: string
  name: string
  description: string | null
  transport: string
  url: string | null
  auth_type: string
  secret_ref: string | null
  enabled: number
  health_status: 'healthy' | 'unhealthy' | 'unknown'
  last_health_check: string | null
  source_plugin_id: string | null
  created_at: string
  updated_at: string
  tool_count?: number
}

export interface ToolSnapshot {
  id: string
  server_id: string
  tool_name: string
  qualified_key: string
  description: string
  input_schema: string
  schema_hash: string
  first_seen_at: string
  last_seen_at: string
  removed_at: string | null
}

export async function getAdminMCPServers(): Promise<AdminMCPServer[]> {
  const res = await apiClient.get<{ success: boolean; data: AdminMCPServer[] }>('/admin/ai/mcp')
  return res.data.data
}

export async function createMCPServer(data: {
  name: string
  url: string
  transport?: string
  auth_type?: string
  secret_ref?: string
  description?: string
}): Promise<AdminMCPServer> {
  const res = await apiClient.post<{ success: boolean; data: AdminMCPServer }>(
    '/admin/ai/mcp',
    data
  )
  return res.data.data
}

export async function updateMCPServer(
  id: string,
  data: {
    url?: string
    transport?: string
    auth_type?: string
    secret_ref?: string
    description?: string | null
    enabled?: number
  }
): Promise<void> {
  await apiClient.put(`/admin/ai/mcp/${id}`, data)
}

export async function deleteMCPServer(id: string): Promise<void> {
  await apiClient.delete(`/admin/ai/mcp/${id}`)
}

export async function discoverMCPTools(
  id: string
): Promise<{ added: number; updated: number; removed: number }> {
  const res = await apiClient.post<{
    success: boolean
    data: { added: number; updated: number; removed: number }
  }>(`/admin/ai/mcp/${id}/discover`)
  return res.data.data
}

export async function healthCheckMCP(id: string): Promise<{ healthy: boolean }> {
  const res = await apiClient.post<{ success: boolean; data: { healthy: boolean } }>(
    `/admin/ai/mcp/${id}/health`
  )
  return res.data.data
}

export async function getMCPTools(id: string): Promise<ToolSnapshot[]> {
  const res = await apiClient.get<{ success: boolean; data: ToolSnapshot[] }>(
    `/admin/ai/mcp/${id}/tools`
  )
  return res.data.data
}

export async function testMCPTool(
  serverId: string,
  toolName: string,
  input: Record<string, unknown>
): Promise<unknown> {
  const res = await apiClient.post<{ success: boolean; data: unknown }>(
    `/admin/ai/mcp/${serverId}/test`,
    { tool_name: toolName, input }
  )
  return res.data.data
}

export function useAdminMCPServers() {
  return useQuery<AdminMCPServer[]>({
    queryKey: ['admin-ai-mcp'],
    queryFn: getAdminMCPServers,
  })
}

export function useCreateMCPServer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createMCPServer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ai-mcp'] })
    },
  })
}

export function useUpdateMCPServer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateMCPServer>[1] }) =>
      updateMCPServer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ai-mcp'] })
    },
  })
}

export function useDeleteMCPServer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteMCPServer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ai-mcp'] })
    },
  })
}

export function useMCPTools(serverId: string) {
  return useQuery<ToolSnapshot[]>({
    queryKey: ['admin-ai-mcp-tools', serverId],
    queryFn: () => getMCPTools(serverId),
    enabled: !!serverId,
  })
}

export function useDiscoverMCPTools() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: discoverMCPTools,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ai-mcp'] })
      queryClient.invalidateQueries({ queryKey: ['admin-ai-mcp-tools'] })
    },
  })
}

export function useHealthCheckMCP() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: healthCheckMCP,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ai-mcp'] })
    },
  })
}

// =============================================
// Plugin Types & API
// =============================================

export interface AdminPlugin {
  id: string
  tenant_id: string
  subject_type: string
  subject_id: string
  plugin_version_id: string
  installed_at: string
  name: string
  semver: string
  description: string | null
  manifest?: Record<string, unknown>
  component_counts?: { skills: number; mcp_servers: number; hooks: number }
}

export async function getAdminPlugins(): Promise<AdminPlugin[]> {
  const res = await apiClient.get<{ success: boolean; data: AdminPlugin[] }>('/admin/ai/plugins')
  return res.data.data
}

export async function installPlugin(
  manifest: Record<string, unknown>
): Promise<{ plugin_id: string; skills: number; mcp_servers: number }> {
  const res = await apiClient.post<{
    success: boolean
    data: { plugin_id: string; skills: number; mcp_servers: number }
  }>('/admin/ai/plugins', { manifest })
  return res.data.data
}

export async function uninstallPlugin(id: string): Promise<void> {
  await apiClient.delete(`/admin/ai/plugins/${id}`)
}

export function useAdminPlugins() {
  return useQuery<AdminPlugin[]>({
    queryKey: ['admin-ai-plugins'],
    queryFn: getAdminPlugins,
  })
}

export function useInstallPlugin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: installPlugin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ai-plugins'] })
      queryClient.invalidateQueries({ queryKey: ['admin-ai-mcp'] })
      queryClient.invalidateQueries({ queryKey: ['admin-ai-skills'] })
    },
  })
}

export function useUninstallPlugin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: uninstallPlugin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ai-plugins'] })
      queryClient.invalidateQueries({ queryKey: ['admin-ai-mcp'] })
      queryClient.invalidateQueries({ queryKey: ['admin-ai-skills'] })
    },
  })
}
