# Primitive brief for NobodyClimb

- Date — 2026-11-26
- Author — Claude（依 primitive-first-design Skill 產出，待人審）
- Mode — ideal-first（再用 D1 migrations 與 backend 程式做材料驗證）
- System reviewed — nobodyclimb `claude/stoic-gauss-7jvnxa`，讀 migrations 0000～0083、`backend/src/db/schema.sql`、`content-interactions-repository.ts`、`routes/posts.ts`、`services/rank.ts`；未讀 web 與 mobile UI

## Core job

攀岩者把自己爬過的路線與經驗記下來，連結到地點與其他攀岩者的故事，並從中得到回饋與成長。

## Candidate inventory

| Candidate | Level | Treatment |
|---|---|---|
| user／biography | Object | 保留為 Person |
| crag、sector、route、gym | Object | 合併為巢狀 Place |
| user_route_ascents | Object | 保留為 Ascent |
| bucket_list_items、user_goals | Object（疑似 Ascent 的未來式） | 候選合併進 Ascent |
| climber_ranks、user_ranks、rank 分數 | Derived information | 由 Ascent 與 Story 推導 |
| biography_core_stories、one_liners、stories、route_stories、posts | Object | 合併為有型別的 Story |
| likes、comments、content_reactions、bookmarks、reviews | Object | 合併為 Reaction（含留言） |
| notifications | Derived／Workflow | 由 Reaction、Follow 事件推導 |
| follows | Object | 保留為 Relationship |
| galleries、videos | Object | 併入 Media，附著在 Story 或 Place |
| quiz_results、training_progress | Object | 待驗證 |
| chat_sessions、tools、hooks、skills、mcp_server | Object | 屬 AI 層，另見 Capability |

## Primitives

| Primitive | Definition | Concepts it subsumes |
|---|---|---|
| **Place** | 巢狀的地點：岩場、sector、路線、岩館 | crags、sectors、routes、gyms |
| **Ascent** | 某人在某路線上的一次嘗試或完攀，帶方式（flash、onsight、redpoint、attempt…） | user_route_ascents、（假設）bucket_list_items、user_goals |
| **Story** | 附著在 Person 或 Place 的有型別文字（beta、conditions、safety、first_ascent、experience…） | core story、one-liner、story、route_story、post |
| **Reaction** | 任何人對任何 Story／Media／Place 的回應：按讚、快速反應、留言 | likes、content_reactions、comments、bookmarks |
| **Person** | 攀岩者與其公開檔案 | users、biographies |

## Derived information

| Derived item | Derivation rule |
|---|---|
| 目標是否完成 | 存在符合目標條件的完攀 Ascent（假設，目前是手動 `status`） |
| 攀岩等級／rank | 由 Ascent 的難度與數量，加上 Story、bucket list 的貢獻計分；`services/rank.ts` 已是推導函式，不是儲存值 |
| 路線評價與數字 | 由 Reaction／review 聚合；`rating_avg`、`review_count`、`comment_count` 是儲存的快取 |
| 通知 | 由針對自己內容的 Reaction 與 Follow 事件產生 |

## Invariants

- 一個 Ascent 屬於一位 Person 與一條 Route。
- 同一人對同一內容的同一種快速反應只能有一筆（`UNIQUE(content_type, content_id, reaction_type, user_id)`）。
- Route 必屬一個 Crag（`ON DELETE CASCADE`）。

## Six checks

| Check | Result |
|---|---|
| 1. Subtraction | 拿掉 Ascent，就只剩內容社群，不再是攀岩產品；拿掉 Place，Ascent 無處可指。Reaction 與 Story 是社群層，不能拿掉但可以統一。 |
| 2. Same underlying behavior | **Reaction 的證據最硬**：`likes`、`comments`、`content_reactions` 都是 `(entity_type/content_type, entity_id)` 多型，每次擴充內容種類都要重建表：migrations 出現 `likes_new`、`likes_new2`、`comments_new2`、`comments_new3`、`content_reactions_new`。**程式碼已有分歧**：`content-interactions-repository.ts` 的 `ContentType` 只有 `core_story | one_liner | story`，但資料表 CHECK 已加入 `route_story`。 |
| 3. Three-layer alignment | 資料層：Reaction 分散在 3 張表，且同樣的 `entity_type` 檢查清單寫在不同表裡。流程層：`routes/posts.ts` 用 `${table}` 動態拼表名處理 like 與 bookmark，是抽象不足的症狀。介面層：Web 已有統一的 `ContentInteractionBar`（按讚、快速反應、留言），所以介面其實已經當成同一個東西。 |
| 4. Emergence | 「岩況回報」＝已有 `route_story` 的 `conditions`，不需新表。「朋友在這條路線完攀」＝Ascent 加 Follow 的 query。「年度回顧」＝Ascent 的聚合。「路線收藏」＝Reaction 的一種，目前走 bookmarks 另一張表。 |
| 5. Work with real materials | 已讀 schema、migrations、互動 repository、posts 路由與 rank。已確認 `likes` 與 `comments` 同時服務 post、gallery、video、gym、crag 與傳記內容。 |
| 6. Swan | 介面層面已近似；缺口是資料層與程式的分歧。 |

## Product decisions to confirm

| Question | Suggested default | Decision, date, and decision-maker |
|---|---|---|
| Reaction 是否收斂成單一表？ | 是。以 `target_type` 加 `target_id` 加 `kind`（like／quick／bookmark），留言保持獨立因為有內容與巢狀 | |
| 目標（Goal）要不要併進 Ascent？ | 先在文件定義；實作前確認 `rank.ts` 與 `coaching-agent` 都依賴 `bucket_list_items`／`user_goals`，改動面不小 | |
| 多型 `target_type` 如何避免重建表？ | 用應用層驗證加索引，移除 DB CHECK 清單（需評估資料完整性） | |
| Story 的四張舊表要不要合併？ | 先不動，優先處理 Reaction | |

## Design implications

- 新增任何「可被回應的內容種類」前，先確認 Reaction 是否已支援，不要再開新表。
- 目標達成應由 Ascent 推導，不該靠使用者手動切換狀態。
- 通知文字由事件類型與目標種類決定，不要為每種內容寫一個通知。

## Mapping to the real system

| Primitive | Current implementation | Gap | Decision owner |
|---|---|---|---|
| Place | `crags`／`sectors`／`routes`／`gyms` | 無明顯缺口 | 待確認 |
| Ascent | `user_route_ascents`（0037） | 目標在別處；rank 讀 bucket list | 待確認 |
| Story | 4 張傳記內容表加 `route_stories` 加 `posts` | 型別分散 | 待確認 |
| Reaction | `likes`、`comments`、`content_reactions`、`bookmarks` | 型別清單重複；repository 與 DB CHECK 不一致 | 待確認 |

## Unverified hypotheses

- 目標與 Ascent 可合併：讀 `services/domain/goals.ts`、`routes/bucket-list.ts` 與 coaching agent 確認欄位語意。
- `ContentType` 缺 `route_story` 是否造成實際缺陷：讀 `routes/route-stories.ts` 的按讚路徑。
- AI 層（tools、hooks、skills、mcp）與 quidproquo 的 Capability 同構：已確認 migrations 0074～0080 結構相近，內容未逐欄比對。
