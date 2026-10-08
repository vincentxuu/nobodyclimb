import { describe, expect, it } from 'vitest'
import { saveTurn } from '../chat'

// 用 in-memory 的假 D1 驗 saveTurn 的 batch 內容與 regenerate 語意

interface Row {
  id: string
  session_id: string
  role: string
  content: string
  created_at: number
  status: string | null
}

function fakeD1(seed: Row[] = []) {
  const rows = [...seed]
  const titles = new Map<string, string>([['s1', '新對話']])
  const prepare = (sql: string) => ({
    bind: (...args: unknown[]) => ({
      sql,
      args,
      // saveTurn 只透過 batch 執行
    }),
  })
  const batch = async (stmts: Array<{ sql: string; args: unknown[] }>) => {
    for (const { sql, args } of stmts) {
      if (sql.startsWith('DELETE')) {
        const sid = args[0] as string
        const last = [...rows].filter((r) => r.session_id === sid).at(-1)
        if (last?.role === 'assistant') rows.splice(rows.indexOf(last), 1)
      } else if (sql.includes("'user'")) {
        rows.push({
          id: args[0] as string,
          session_id: args[1] as string,
          role: 'user',
          content: args[2] as string,
          created_at: args[3] as number,
          status: null,
        })
      } else if (sql.includes("'assistant'")) {
        rows.push({
          id: args[0] as string,
          session_id: args[1] as string,
          role: 'assistant',
          content: args[2] as string,
          created_at: args[7] as number,
          status: args[6] as string | null,
        })
      } else if (sql.startsWith('UPDATE chat_sessions')) {
        const [, def, title, sid] = args as [number, string, string, string]
        if (titles.get(sid) === def) titles.set(sid, title)
      }
    }
    return []
  }
  return { db: { prepare, batch } as never, rows, titles }
}

describe('saveTurn', () => {
  it('一般回合：user + assistant 一起寫入，第一則 user 訊息成為標題', async () => {
    const { db, rows, titles } = fakeD1()
    await saveTurn(
      's1',
      { userContent: '龍洞有什麼路線？', regenerate: false, assistant: { content: '有很多' } },
      db
    )
    expect(rows.map((r) => [r.role, r.content])).toEqual([
      ['user', '龍洞有什麼路線？'],
      ['assistant', '有很多'],
    ])
    expect(titles.get('s1')).toBe('龍洞有什麼路線？')
  })

  it('regenerate：不新增 user 訊息，取代最後一則 assistant', async () => {
    const { db, rows } = fakeD1([
      { id: 'u1', session_id: 's1', role: 'user', content: 'Q', created_at: 1, status: null },
      {
        id: 'a1',
        session_id: 's1',
        role: 'assistant',
        content: '舊答案',
        created_at: 1,
        status: null,
      },
    ])
    await saveTurn(
      's1',
      { userContent: 'Q', regenerate: true, assistant: { content: '新答案' } },
      db
    )
    expect(rows.map((r) => [r.role, r.content])).toEqual([
      ['user', 'Q'],
      ['assistant', '新答案'],
    ])
  })

  it('regenerate 但最後一則是 user：不刪任何東西，只補上回答', async () => {
    const { db, rows } = fakeD1([
      { id: 'u1', session_id: 's1', role: 'user', content: 'Q', created_at: 1, status: null },
    ])
    await saveTurn('s1', { userContent: 'Q', regenerate: true, assistant: { content: '答案' } }, db)
    expect(rows.map((r) => r.role)).toEqual(['user', 'assistant'])
  })

  it('中斷的部分回答以 status=stopped 寫入', async () => {
    const { db, rows } = fakeD1()
    await saveTurn(
      's1',
      { userContent: 'Q', regenerate: false, assistant: { content: '半', status: 'stopped' } },
      db
    )
    expect(rows.at(-1)).toMatchObject({ role: 'assistant', content: '半', status: 'stopped' })
  })
})
