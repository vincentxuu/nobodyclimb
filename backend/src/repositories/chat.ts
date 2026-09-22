import { D1Database } from '@cloudflare/workers-types'
import { AISource } from '../types'

const DEFAULT_SESSION_TITLE = '新對話'

export interface ChatMessageRow {
  id: string
  role: 'user' | 'assistant'
  content: string
  suggested_questions: string | null
  query_id: string | null
  sources: string | null
  status: string | null
  created_at: number
}

/** session 是否存在且屬於該使用者 */
export async function isSessionOwnedBy(
  sessionId: string,
  userId: string,
  db: D1Database
): Promise<boolean> {
  const row = await db
    .prepare(`SELECT id FROM chat_sessions WHERE id = ? AND user_id = ?`)
    .bind(sessionId, userId)
    .first()
  return !!row
}

export async function listSessionMessages(
  sessionId: string,
  db: D1Database
): Promise<ChatMessageRow[]> {
  // created_at 只到秒，同一秒內的 user / assistant 訊息以 rowid 保序
  const { results } = await db
    .prepare(
      `SELECT id, role, content, suggested_questions, query_id, sources, status, created_at
       FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC, rowid ASC`
    )
    .bind(sessionId)
    .all<ChatMessageRow>()
  return results
}

export interface AssistantMessageInput {
  content: string
  sources?: AISource[]
  suggestedQuestions?: string[]
  queryId?: string | null
  /** 'stopped' = 使用者中斷生成，content 為中斷前的部分內容 */
  status?: 'stopped' | null
}

/**
 * 一回合結束時把 user 訊息與 assistant 訊息放在同一個 batch 寫入。
 * 刻意不在作答前先寫 user 訊息：問答失敗、或請求被 client / axios 重送時，
 * 提前寫入會留下孤兒或重複的 user 訊息；改成只有真正產生回答的那一次才落地。
 * regenerate = true 時不寫 user 訊息，並先刪掉該 session 最後一則訊息（僅當它是 assistant）。
 */
export async function saveTurn(
  sessionId: string,
  turn: { userContent: string; regenerate: boolean; assistant: AssistantMessageInput },
  db: D1Database
): Promise<{ userMessageId: string | null; assistantMessageId: string }> {
  const now = Math.floor(Date.now() / 1000)
  const assistantId = crypto.randomUUID()
  const userId = turn.regenerate ? null : crypto.randomUUID()
  const statements = []
  if (turn.regenerate) {
    statements.push(
      db
        .prepare(
          `DELETE FROM chat_messages WHERE id = (
             SELECT id FROM chat_messages WHERE session_id = ?
             ORDER BY created_at DESC, rowid DESC LIMIT 1
           ) AND role = 'assistant'`
        )
        .bind(sessionId)
    )
  } else {
    statements.push(
      db
        .prepare(
          `INSERT INTO chat_messages (id, session_id, role, content, created_at) VALUES (?, ?, 'user', ?, ?)`
        )
        .bind(userId, sessionId, turn.userContent, now)
    )
  }
  const a = turn.assistant
  statements.push(
    db
      .prepare(
        `INSERT INTO chat_messages (id, session_id, role, content, suggested_questions, query_id, sources, status, created_at)
         VALUES (?, ?, 'assistant', ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        assistantId,
        sessionId,
        a.content,
        a.suggestedQuestions?.length ? JSON.stringify(a.suggestedQuestions) : null,
        a.queryId ?? null,
        a.sources?.length ? JSON.stringify(a.sources) : null,
        a.status ?? null,
        now
      ),
    // 第一則 user 訊息的前 50 字作為標題
    db
      .prepare(
        `UPDATE chat_sessions SET updated_at = ?, title = CASE WHEN title = ? THEN ? ELSE title END WHERE id = ?`
      )
      .bind(now, DEFAULT_SESSION_TITLE, turn.userContent.slice(0, 50), sessionId)
  )
  await db.batch(statements)
  return { userMessageId: userId, assistantMessageId: assistantId }
}
