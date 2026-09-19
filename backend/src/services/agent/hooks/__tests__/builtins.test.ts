import { describe, expect, it, vi } from 'vitest'
import type { ModelMap } from '../../types'
import { BASE_THINKING_PATTERNS, createBuiltinHooks } from '../builtins'

// 2026-09-19 preview 實際外洩的 GLM-4.7-flash 推理文字（節錄）
const LEAKED_REASONING = `1. **分析使用者請求**：
    *   使用者輸入：「這些路線的難度都接近您完攀的美人照鏡 5.11b，您想先從哪個岩場開始嘗試？」
    *   上下文：使用者之前完攀了「美人照鏡 5.11b」。
    *   之前的模型回答：我列出了 10 條推薦路線，來自龍洞、壽山、墾丁和德芙蘭。
    *   當前限制：我必須先呼叫工具才能回答，但我只能在這一回合中呼叫一次工具。
2. **分析之前的工具結果（上下文）**：
    *   龍洞：位於新北，戶外岩壁，天然岩場。
3. **制定策略**：
    *   使用者詢問「哪個岩場？」。
    *   我必須遵循嚴格指令：「格式... 每一條必須是問句」`

const MODELS = {
  orchestrator: { provider: 'workers-ai', model: '@cf/zai-org/glm-4.7-flash', maxTokens: 1024 },
} as unknown as ModelMap

function makeEnv(regenerated: string) {
  return {
    AI: {
      run: vi.fn().mockResolvedValue({
        choices: [{ message: { content: regenerated } }],
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      }),
    },
  } as any
}

function getThinkingLeakHook(env: any, hookRecords: any[] = []) {
  const hooks = createBuiltinHooks({ env, userId: null, models: MODELS, hookRecords })
  const hook = hooks.find((h) => h.name === 'thinking_leak_guard')
  if (!hook) throw new Error('thinking_leak_guard not found')
  return hook
}

describe('thinking_leak_guard', () => {
  it('BASE_THINKING_PATTERNS 對 GLM 結構化推理至少命中 3 個', () => {
    const hits = BASE_THINKING_PATTERNS.filter((p) => new RegExp(p).test(LEAKED_REASONING))
    expect(hits.length).toBeGreaterThanOrEqual(3)
  })

  it('DB config 只有舊 Llama patterns 時，仍靠基底 patterns 攔下 GLM 推理並重生成', async () => {
    const env = makeEnv('龍洞、壽山、墾丁、德芙蘭各有特色，建議先從壽山平台上開始。')
    const records = [
      {
        name: 'thinking_leak_guard',
        implementation: 'builtin:thinking_leak_guard',
        enabled: 1,
        // 與 migration 0079 相同：沒有任何 GLM 風格 pattern
        config: JSON.stringify({
          patterns: [
            '我需要根據',
            '我應該推薦',
            '我必須根據',
            '讓我看看',
            '讓我分析',
            '現在我需要',
          ],
          threshold: 3,
        }),
      },
    ]
    const hook = getThinkingLeakHook(env, records)
    const result = await hook.execute({
      answer: LEAKED_REASONING,
      query: '您想先從哪個岩場開始嘗試？',
      models: MODELS,
      env,
    })
    expect(result).toMatchObject({ allow: true })
    expect((result as { replacement?: string }).replacement).toBe(
      '龍洞、壽山、墾丁、德芙蘭各有特色，建議先從壽山平台上開始。'
    )
    // 重生成必須關 thinking
    expect(env.AI.run.mock.calls[0][1].chat_template_kwargs).toEqual({ enable_thinking: false })
  })

  it('重生成 content 仍為空 → 拒絕放行，改用固定 fallback 訊息', async () => {
    const env = makeEnv('')
    const hook = getThinkingLeakHook(env)
    const result = await hook.execute({
      answer: LEAKED_REASONING,
      query: '哪個岩場？',
      models: MODELS,
      env,
    })
    expect(result).toMatchObject({ allow: false, reason: 'thinking_leak' })
    expect((result as { replacement?: string }).replacement).toContain('抱歉')
  })

  it('正常回答不觸發', async () => {
    const env = makeEnv('不該被呼叫')
    const hook = getThinkingLeakHook(env)
    const result = await hook.execute({
      answer:
        '根據您的完攀記錄，推薦以下 5.11 範圍的路線：\n- ⛰ 磨繩子，難度等級：5.11b，類型：運攀，岩場：壽山。',
      query: '推薦路線',
      models: MODELS,
      env,
    })
    expect(result).toEqual({ allow: true })
    expect(env.AI.run).not.toHaveBeenCalled()
  })
})
