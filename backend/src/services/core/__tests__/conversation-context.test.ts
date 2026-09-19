import { describe, expect, it, vi } from 'vitest'
import type { AIChatMessage, AIDocument, AISource, Env } from '../../../types'
import {
  buildCarryOverContext,
  buildCarryOverSummary,
  findPreviousTurnSources,
  isFollowUpQuery,
  loadCarryOverDocuments,
  normalizeForMatch,
  rewriteFollowUpQuery,
  sanitizeRewrittenQuery,
} from '../conversation-context'

const history: AIChatMessage[] = [
  { role: 'user', content: '我剛完攀剃刀邊緣 5.10c，推薦我類似難度的路線' },
  {
    role: 'assistant',
    content:
      '根據你的攀岩經驗和剃刀邊緣 5.10c 的難度，推薦以下路線：⛰ [熱身路線](/crag/a/route/r1)，難度等級：5.10c',
  },
]

const sources: AISource[] = [
  { id: 'r1', type: 'route', title: '熱身路線', excerpt: '龍洞 · 5.10c · 運攀 · 校門口', score: 1 },
  { id: 'r2', type: 'route', title: '好痛', excerpt: '壽山 · 5.10c · 運攀 · 平台下', score: 0.9 },
  { id: 'v1', type: 'video', title: '影片', excerpt: '', score: 0.5 },
]

// 最小 D1 stub：依 SQL 關鍵字回不同結果
function fakeDb(opts: {
  logs?: Array<{ response: string; sources: string }>
  docs?: AIDocument[]
  bindSpy?: (args: unknown[]) => void
}): D1Database {
  return {
    prepare: (sql: string) => ({
      bind: (...args: unknown[]) => {
        opts.bindSpy?.(args)
        return {
          all: async () => ({
            results: sql.includes('ai_query_logs') ? (opts.logs ?? []) : (opts.docs ?? []),
          }),
        }
      },
    }),
  } as unknown as D1Database
}

function doc(
  id: string,
  text: string,
  metadata: Record<string, unknown> | null = null
): AIDocument {
  return {
    id: `doc-${id}`,
    type: 'route',
    source_id: id,
    text,
    metadata: metadata ? JSON.stringify(metadata) : null,
    embedding_id: `emb-${id}`,
    created_at: '',
    updated_at: '',
  }
}

describe('isFollowUpQuery', () => {
  it('沒有對話歷史一律不是追問', () => {
    expect(isFollowUpQuery('這些路線中哪一個有機會看到風景？', [])).toBe(false)
  })

  it('含指代詞且有歷史視為追問', () => {
    expect(isFollowUpQuery('這些路線中哪一個有機會看到風景？', history)).toBe(true)
    expect(isFollowUpQuery('其中最短的是哪條？', history)).toBe(true)
    expect(isFollowUpQuery('第二條的難度是多少', history)).toBe(true)
  })

  it('沿用既有的上下文依賴詞（還有 / 附近）', () => {
    expect(isFollowUpQuery('還有其他的嗎', history)).toBe(true)
  })

  it('獨立問題不是追問', () => {
    expect(isFollowUpQuery('龍洞有哪些 5.11 的運攀路線？', history)).toBe(false)
  })
})

describe('normalizeForMatch', () => {
  it('去掉連結、標點與英數後只比 CJK 開頭', () => {
    const withLinks = '根據你的攀岩經驗，推薦 [熱身路線](/crag/a/route/r1)，難度 5.10c'
    const plain = '根據你的攀岩經驗，推薦 熱身路線，難度 5.10c'
    expect(normalizeForMatch(withLinks)).toBe(normalizeForMatch(plain))
  })

  it('簡繁差異不影響比對', () => {
    expect(normalizeForMatch('根据你的攀岩经验')).toBe(normalizeForMatch('根據你的攀岩經驗'))
  })
})

describe('findPreviousTurnSources', () => {
  it('匿名使用者回傳空陣列且不查 DB', async () => {
    const bindSpy = vi.fn()
    const result = await findPreviousTurnSources(fakeDb({ bindSpy }), null, history)
    expect(result).toEqual([])
    expect(bindSpy).not.toHaveBeenCalled()
  })

  it('以回答開頭比對找出對應 log，並過濾掉 video 來源', async () => {
    const db = fakeDb({
      logs: [
        { response: '另一個對話的回答內容完全不同的文字', sources: JSON.stringify(sources) },
        {
          response:
            '根據你的攀岩經驗和剃刀邊緣 5.10c 的難度，推薦以下路線：⛰ 熱身路線，難度等級：5.10c',
          sources: JSON.stringify(sources),
        },
      ],
    })
    const result = await findPreviousTurnSources(db, 'u1', history)
    expect(result.map((s) => s.id)).toEqual(['r1', 'r2'])
  })

  it('沒有任何 log 對得上就回傳空陣列', async () => {
    const db = fakeDb({
      logs: [{ response: '完全不相干的回答', sources: JSON.stringify(sources) }],
    })
    expect(await findPreviousTurnSources(db, 'u1', history)).toEqual([])
  })

  it('DB 例外時安全降級', async () => {
    const db = {
      prepare: () => {
        throw new Error('boom')
      },
    } as unknown as D1Database
    expect(await findPreviousTurnSources(db, 'u1', history)).toEqual([])
  })
})

describe('loadCarryOverDocuments', () => {
  it('依 sources 順序回傳文件，缺的略過', async () => {
    const db = fakeDb({ docs: [doc('r2', '路線名稱：好痛'), doc('r1', '路線名稱：熱身路線')] })
    const result = await loadCarryOverDocuments(db, sources)
    expect(result.map((d) => d.source_id)).toEqual(['r1', 'r2'])
  })

  it('沒有 sources 不查 DB', async () => {
    const bindSpy = vi.fn()
    expect(await loadCarryOverDocuments(fakeDb({ bindSpy }), [])).toEqual([])
    expect(bindSpy).not.toHaveBeenCalled()
  })
})

describe('buildCarryOverContext / buildCarryOverSummary', () => {
  it('完整文件區塊含標頭、路線連結與分隔線', () => {
    const ctx = buildCarryOverContext([
      doc('r1', '路線名稱：熱身路線\n難度等級：5.10c', { crag_id: 'c1' }),
      doc('r2', '路線名稱：好痛'),
    ])
    expect(ctx).toContain('上一輪回答提及的路線')
    expect(ctx).toContain('路線連結：/crag/c1/route/r1')
    expect(ctx).toContain('\n\n---\n\n')
    expect(ctx).toContain('路線名稱：好痛')
  })

  it('空文件回傳 null', () => {
    expect(buildCarryOverContext([])).toBeNull()
    expect(buildCarryOverSummary([])).toBeNull()
  })

  it('精簡清單只列名稱與摘要', () => {
    const summary = buildCarryOverSummary(sources.slice(0, 2))
    expect(summary).toContain('- 熱身路線（龍洞 · 5.10c · 運攀 · 校門口）')
    expect(summary).toContain('- 好痛（壽山 · 5.10c · 運攀 · 平台下）')
  })
})

describe('sanitizeRewrittenQuery', () => {
  it('取第一行並去掉前綴與引號', () => {
    expect(
      sanitizeRewrittenQuery(
        '改寫後的問題：「熱身路線、好痛哪一條看得到風景？」\n（說明）',
        '這些哪條'
      )
    ).toBe('熱身路線、好痛哪一條看得到風景？')
  })

  it('空白、過長或與原句相同視為失敗', () => {
    expect(sanitizeRewrittenQuery('', 'q')).toBeNull()
    expect(sanitizeRewrittenQuery('x'.repeat(200), 'q')).toBeNull()
    expect(sanitizeRewrittenQuery('這些哪條', '這些哪條')).toBeNull()
  })
})

describe('rewriteFollowUpQuery', () => {
  function envWith(run: (...args: unknown[]) => Promise<unknown>): Env {
    return { AI: { run } } as unknown as Env
  }

  it('改寫成功回傳獨立問題與 usage', async () => {
    const run = vi.fn(async () => ({
      response: '熱身路線、好痛、表皮摩擦力這幾條路線中，哪一條攀到頂能看到風景？',
      usage: { prompt_tokens: 100, completion_tokens: 20, total_tokens: 120 },
    }))
    const result = await rewriteFollowUpQuery({
      env: envWith(run),
      query: '這些路線中哪一個有機會看到風景？',
      recentHistory: history,
      previousSources: sources.slice(0, 2),
      model: 'test-model',
    })
    expect(result?.rewritten).toContain('熱身路線')
    expect(result?.usage.total_tokens).toBe(120)
    // prompt 應帶入上一輪的路線名稱，模型才有東西可代換
    const prompt = (run.mock.calls[0] as unknown[])[1] as { messages: Array<{ content: string }> }
    expect(prompt.messages[0].content).toContain('熱身路線、好痛')
  })

  it('模型失敗時回傳 null，不拋錯', async () => {
    const result = await rewriteFollowUpQuery({
      env: envWith(async () => {
        throw new Error('down')
      }),
      query: '這些哪條',
      recentHistory: history,
      previousSources: [],
      model: 'test-model',
    })
    expect(result).toBeNull()
  })
})
