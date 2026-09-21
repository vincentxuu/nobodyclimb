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

/** 寫入 user 訊息，並更新 session 的 updated_at 與 title（第一則 user 訊息前 50 字作為標題） */
export async function insertUserMessage(
  sessionId: string,
  content: string,
  db: D1Database
): Promise<string> {
  const id = crypto.randomUUID()
  const now = Math.floor(Date.now() / 1000)
  await db.batch([
    db
      .prepare(
        `INSERT INTO chat_messages (id, session_id, role, content, created_at) VALUES (?, ?, 'user', ?, ?)`
      )
      .bind(id, sessionId, content, now),
    db
      .prepare(
        `UPDATE chat_sessions SET updated_at = ?, title = CASE WHEN title = ? THEN ? ELSE title END WHERE id = ?`
      )
      .bind(now, DEFAULT_SESSION_TITLE, content.slice(0, 50), sessionId),
  ])
  return id
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
 * 寫入 assistant 訊息。replaceLast = true（重新生成）時先刪掉該 session 最後一則訊息
 * （僅當它是 assistant 訊息），再寫入新回答。
 */
export async function insertAssistantMessage(
  sessionId: string,
  input: AssistantMessageInput,
  db: D1Database,
  opts: { replaceLast?: boolean } = {}
): Promise<string> {
  const id = crypto.randomUUID()
  const now = Math.floor(Date.now() / 1000)
  const statements = []
  if (opts.replaceLast) {
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
  }
  statements.push(
    db
      .prepare(
        `INSERT INTO chat_messages (id, session_id, role, content, suggested_questions, query_id, sources, status, created_at)
         VALUES (?, ?, 'assistant', ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        sessionId,
        input.content,
        input.suggestedQuestions?.length ? JSON.stringify(input.suggestedQuestions) : null,
        input.queryId ?? null,
        input.sources?.length ? JSON.stringify(input.sources) : null,
        input.status ?? null,
        now
      ),
    db.prepare(`UPDATE chat_sessions SET updated_at = ? WHERE id = ?`).bind(now, sessionId)
  )
  await db.batch(statements)
  return id
}
