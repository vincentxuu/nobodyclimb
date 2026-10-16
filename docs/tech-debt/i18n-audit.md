# NobodyClimb Web i18n 盤點報告

**狀態**: 🟢 P0/P1/P2/P3 已實作（P4 未做）
**建立日期**: 2026-10-16
**最後更新**: 2026-10-16
**影響範圍**: `apps/web/messages/{locale}/{module}.json`、`apps/web/src/i18n/`、`apps/web/src/app/[locale]/**`
**對照基準**: next-intl 官方 Design principles / Request configuration / Server & Client Components

> **2026-10-16 更新**：本報告的 P0～P3 已於同日實作完成，見文末「六、已完成的改善」。P4（catch-all／扁平 key／重複概念 namespace 重整）尚未處理。

---

## 執行摘要

目前 web 的 i18n 是 **「單檔 + namespace 分區」**：三個語系各一個大 JSON，靠 70 個頂層 namespace 做邏輯分組。

- ✅ 做到了「按模組分 namespace」，且**三語系 key 完全對齊**（3,543 個 leaf key 一字不差）。
- ❌ 沒有做到 next-intl 官方建議的兩件事：**依 namespace 拆檔** 與 **只把需要的 namespace 送到 client**。
- 核心痛點不在「沒拆檔」，而在 **1) client 全量載入整個語系檔**、**2) 譯文大量重複**、**3) catch-all namespace 失序**。

> 重要釐清：**拆檔本身不會降低 client payload**。若只為了「好看」，官方其實建議單檔 + editor 工具即可；真正的效能紅利在於 **page 層只 `pick` 需要的 namespace 傳給 `NextIntlClientProvider`**。

---

## 一、現況數據

| 項目 | 數值 |
|------|------|
| 訊息檔 | 3 個（`zh.json` / `en.json` / `ja.json`） |
| 檔案大小 | zh 185 KB / en 193 KB / ja 232 KB（各約 4,400 行） |
| 頂層 namespace | 70 個（三語系完全一致） |
| Leaf key 總數 | 3,543（zh / en / ja **完全對齊，0 缺漏、0 多出**） |
| 載入方式 | `request.ts:14` 整包 `import()`；`layout.tsx:108` 用 `getMessages()` 全量丟進 `NextIntlClientProvider` |
| 動態 namespace 存取 | 8 處以 `useMessages() as Record<string, unknown>` 手動取值 |
| 重複譯文 | **298 組**相同字串散落在多個 namespace |
| 未被使用的 namespace | 0（70 個全都有被引用，含動態存取） |
| 巢狀子路徑呼叫 | ~30 處（如 `useTranslations('Quiz.landing')`） |

### 關鍵程式碼位置

```ts
// apps/web/src/i18n/request.ts:14 —— 整包載入
messages: (await import(`../../messages/${locale}.json`)).default,
```

```tsx
// apps/web/src/app/[locale]/layout.tsx:70,108 —— 全量送到 client（根 layout，每一頁都背）
const messages = await getMessages()
...
<NextIntlClientProvider messages={messages}>
```

```ts
// apps/web/src/i18n/types.d.ts —— 型別以 zh.json 為 source of truth（✅ 良好）
type Messages = typeof messages
interface IntlMessages extends Messages {}
```

---

## 二、逐項對照最佳實踐

| next-intl 官方建議 | 現況 | 評價 |
|---|---|---|
| 依 namespace 分檔（`common.json`、`about.json`…）並於 runtime merge | 單檔 | ⚠️ 未做 |
| 只把需要的 namespace 傳給 `NextIntlClientProvider`（`pick(messages, [...])`） | 全量傳 | ❌ 未做 |
| namespace 通常以「元件名」為單位 | 頁面 / 元件 / 雜項混在一起 | ⚠️ 不一致 |
| 巢狀結構優先，避免前綴式扁平 key | `CragData.rockXxx`、`GymData.facilityXxx` 扁平前綴 | ⚠️ 部分違反 |
| 共用字串集中一個 `common` 並重複利用 | 有 `Common` 也有 `SharedUI`，內容重疊 | ⚠️ 未收斂 |
| 型別安全（以 default locale 當 source of truth） | `types.d.ts` 用 `zh.json` | ✅ 有做 |
| 用工具靜態檢查 key drift / ICU 參數不一致 | 僅 format-commit skill 的人工檢查 | ⚠️ 未自動化 |
| RSC-first、訊息盡量留在 server | 多數為 client component | ⚠️ 部分 |

參考來源：
- next-intl〈Design principles〉— Splitting of messages、nested style、type-safety
- next-intl〈Request configuration〉— "How can I split my messages into multiple files?"
- next-intl〈Server & Client Components〉— Option 1–4，建議 push only required messages
- next-intl〈Organizing keys〉/ 〈Reusing messages〉— 以元件名為 namespace、共用字串重用

---

## 三、主要問題（依影響排序）

### 1. 全量訊息送到 client（效能，最大痛點）

`layout.tsx` 是**根 layout**，`<NextIntlClientProvider messages={messages}>` 拿到的是整個語系檔（ja 232 KB）。等於**每一頁**都背著全站 70 個 namespace、3,543 個 key 的譯文。

官方明確建議在 **page 層**用：

```ts
import pick from 'lodash/pick'
const messages = await getMessages()
const clientMessages = pick(messages, ['Common', 'CragPage'])
```

只送當前頁需要的 namespace。這是投報率最高的一項。

### 2. 譯文重複（298 組）

相同字串重複出現在多個 namespace，代表**共用字串沒有收斂到單一來源**。改一次文案要改十幾個地方，也容易翻不一致。代表案例：

| 字串 | 出現次數 | 散落位置（節錄） |
|------|---------|-----------------|
| `儲存中...` | 12 | `BiographyPage`、`ProfilePage`、`GalleryUI.edit`、`Ascent.form`… |
| `請稍後再試` | 11 | `BlogPage`、`ProfilePage`、`Auth`、`BiographyMisc`… |
| `載入中...` | 10 | `CragPage`、`GymPage`、`Common`、`SharedUI`、`Auth`… |
| `上傳失敗` | 8 | `SharedUI`、`GalleryUI.upload`、`BiographyMisc`… |
| `確認` / `取消` / `關閉` | 各 2+ | `Common` 與 `SharedUI` 各一份 |

`Common` 與 `SharedUI` 內容高度重疊（`confirm`、`cancel`、`close`、`loading` 都各有），是優先合併對象。

### 3. Catch-all namespace

`Common`、`SharedUI`、`LibMisc`、`ProfilePagesMisc`、`BiographyMisc`、`CragData`、`GymData`、`Countries`、`Badges` 屬於「找不到歸屬就丟這裡」。其中 `BiographyMisc`（30 key）一個就混了 CTA、上傳訊息、route type 對照表、story prompt 範例、story category meta，語意完全不內聚。

### 4. 扁平前綴 key 而非巢狀

`CragData.rockSzelengSandstone` / `seasonSpring` / `amenityParking`；`GymData.facilityBouldering` / `typeMixed`。next-intl 建議改成 `CragData.rock.szelengSandstone` 的巢狀結構，可讀性與型別提示都更好。

### 5. 動態 namespace 存取繞過型別（8 處）

| 檔案 | 取用的 namespace |
|------|-----------------|
| `src/lib/hooks/useBadgeText.ts` | `Badges` |
| `src/lib/hooks/useCountryName.ts` | `Countries` |
| `src/lib/hooks/useBiographyTagText.ts` | `BiographyTags` |
| `src/lib/hooks/useBiographyStoryText.ts` | `BiographyStories` |
| `src/lib/hooks/useBiographyQuestions.ts` | `BiographyQuestions` |
| `src/components/profile/RouteTypeSelector.tsx` | `ProfileSections` |
| `src/components/biography/shared/useRouteTypeLabel.ts` | `BiographyMisc` |
| `src/components/biography/story-prompt-modal.tsx` | `BiographyMisc` |

這些是「後端 id → 顯示文字」的查表需求，用 `as Record<string, unknown>` 手動取值，**型別安全在此破功**——某語系少一個 key 不會被 typecheck 抓到，正是漂移風險最高的區域。

### 6. 概念重複的 namespace

`Home` vs `HomePage`、`AuthPage` vs `Auth`、`GalleryPage` vs `GalleryUI`、`StoryPage` vs `StoryDetail`、`BlogPage` vs `BlogCategories`。同一概念兩套命名，新人容易放錯檔案。

### 7. 沒有自動化一致性檢查

三語系目前剛好對齊，但只靠人（format-commit skill 手動看 diff）。`add-web-page` skill 也只能用文字提醒「要同時改三檔」。缺一個 CI 可跑的腳本。

---

## 四、做得好的地方（別過度自責）

- **三語系 key 完全對齊**：3,543 個 leaf key 在 zh / en / ja 一字不差，這其實不容易。
- **型別安全有接上**：`IntlMessages` 以 `zh.json` 為來源，多數 `t('...')` 有 autocomplete 與編譯期檢查。
- **70 個 namespace 全部有被使用**，沒有明顯的 dead translation。
- 已有 **i18n 健康檢查寫進 commit 流程**（format-commit skill 步驟 2）。

---

## 五、建議路線（低風險、可分階段）

| 階段 | 動作 | 風險 | 效益 | 狀態 |
|---|---|---|---|---|
| **P0** | 新增 `scripts/i18n/check-i18n.mjs`：驗三語系 key 對齊 + 找未使用 namespace + 模組對應一致，掛進 CI | 極低 | 防漂移，取代人工檢查 | ✅ 已完成 |
| **P1** | 收斂重複字串、合併 `Common` 與 `SharedUI` | 低-中 | 減少重複來源 | ✅ 部分完成（見下） |
| **P2** | 依模組**拆檔**（`messages/{locale}/{module}.json`）並在 `request.ts` merge | 中 | 可維護性提升 | ✅ 已完成 |
| **P3** | 各 route 只送需要的 namespace 給 `NextIntlClientProvider` | 中 | client payload 下降 37–80% | ✅ 已完成 |
| **P4** | 清 catch-all namespace、扁平 key 改巢狀、消除重複概念 namespace（`Home`/`HomePage` 等） | 中-高 | 結構一致 | ⬜ 未做 |

> P0、P1、P3 為建議優先序。P2（拆檔）只有在 P3 一起做時才有效能意義；單獨做只是整理檔案。

---

## 六、已完成的改善（2026-10-16）

### P2 — 依模組拆檔

`messages/{zh,en,ja}.json`（3 個大檔）→ `messages/{locale}/{module}.json`（3 語系 × 17 模組）。
每個模組檔內仍是原本的頂層 namespace，由各語系的 `index.ts` 靜態合併回同一個物件，**runtime 行為完全等價**。

- 模組 ↔ namespace 對應表：`scripts/i18n/modules.mjs`
- 重建 index：`node scripts/i18n/split-messages.mjs`（一次性遷移工具，原單檔已移除）

### P0 — 自動化檢查 + CI

- `scripts/i18n/check-i18n.mjs`：三語系 leaf key 對齊、模組檔內容與對應表一致、`index.ts` 齊全、未被引用的 namespace（warning）。
- `scripts/i18n/analyze-namespaces.mjs verify`：`client-namespaces.ts` 是否最新、每個 route 是否都接上 `RouteMessages`。
- 掛進 `.github/workflows/ci.yml` 的 `i18n` job；本機用 `pnpm i18n:check`。

### P3 — 只送需要的 namespace（本報告最大痛點）

- 根 layout 只把「全域 chrome」需要的 17 個 namespace（navbar / footer / chat / share / claim…）送進 client。
- 每個 route 以 `<RouteMessages route="...">`（`src/i18n/route-messages.tsx`）加上該 route client 元件需要的 namespace。
- 清單由 `scripts/i18n/analyze-namespaces.mjs emit` 依 import 關係**靜態分析**產生，存於 `src/i18n/client-namespaces.ts`。

**實測 zh payload 變化**（全量 102.2 KB）：

| route | 送出 | 省下 |
|---|---|---|
| admin / chat / ig-final-comparison / search | 20.5–20.8 KB | −80% |
| gallery / games / gym / share / upload / videos | 21.5–22.7 KB | −78~79% |
| quiz | 25.1 KB | −75% |
| story | 30.6 KB | −70% |
| blog / bucket-list / auth | 32.8–35.2 KB | −66~68% |
| home | 39.1 KB | −62% |
| biography | 47.0 KB | −54% |
| crag | 49.7 KB | −51% |
| profile | 64.2 KB | −37% |

> 每個 route 的下限是 core（20.5 KB）：`StoryPromptWrapper`、`ChatWidget` 等**全域掛載**的 client 元件本身就用到 `BiographyEditor`、`Chat` 等大 namespace。若日後想再往下壓，需把這些全域元件改成 lazy / 條件載入（屬 P4 範圍）。

### P1 — 重複字串（部分完成）

- ✅ 合併 `Common` 與 `SharedUI` → 統一為 `Common`（`SharedUI` 的 `loading`/`cancel`/`confirm`/`close` 與 `Common` 同值，無衝突），22 個元件改為 `useTranslations('Common')`。
- ⬜ 其餘 ~298 組重複**未動**：多數是「人物誌」「攀岩足跡」這類**領域標籤**，在不同情境（導覽列、頁標題、麵包屑）本就可能各自演化，硬併會造成不必要的耦合。要做屬 P4。

---

## 附錄 A：重複譯文樣本（前 20 大群組）

| 字串 | 次數 |
|------|------|
| 人物誌 | 14 |
| （選填） | 14 |
| 儲存中... | 12 |
| 請稍後再試 | 11 |
| 載入中... | 10 |
| 攀岩足跡 | 10 |
| 更新失敗 | 8 |
| 上傳失敗 | 8 |
| 上傳照片 | 7 |
| 小故事 | 7 |
| 儲存失敗 | 7 |
| 部落格 | 6 |
| 攀爬紀錄 | 6 |
| 人生清單 | 6 |
| 核心故事 | 6 |
| 操作失敗 | 6 |
| 你與攀岩的相遇 | 6 |
| 基本資料 | 6 |
| 社群連結 | 6 |
| 我的人物誌 | 5 |

（完整 298 組可用報告產出時的分析腳本重跑。）

## 附錄 B：70 個 namespace 清單（依性質分類）

- **頁面級**：`HomePage` `CragPage` `GymPage` `BiographyPage` `GalleryPage` `VideosPage` `BlogPage` `SearchPage` `ProfilePage` `AuthPage` `BucketListPage` `GamesPage` `SharePage` `UploadPage` `AboutPage` `ErrorPage` `StoryPage` `StoryDetail`
- **元件級**：`Navbar` `Footer` `LocaleSwitcher` `MobileMenu` `UserMenu` `ShareButton` `ShareInvitation` `NotificationCenter` `RankBadge` `InstagramEmbed` `AnonymousShare` `ClaimContent` `Weather` `TrafficCameras` `VideosFilter` `GalleryUI` `Editor` `AiTool`
- **功能 / 流程**：`Auth` `BiographyEditor` `BiographyQuestions` `BucketListForm` `ProfileDashboard` `ProfileEditor` `ProfileEvolution` `ProfileGallery` `ProfileGoals` `ProfileSetup` `ProfileTraining` `ProfileSections` `Onboarding` `Chat` `Quiz` `RopeGame` `RouteStory` `Ascent` `Validation`
- **領域資料對照表**：`CragData` `CragFaq` `GymData` `Countries` `Badges` `BlogCategories`
- **catch-all / 雜項**：`Common` `SharedUI` `LibMisc` `ProfilePagesMisc` `BiographyMisc` `Home` `Metadata`
- **其他**：`BiographyStories` `BiographyTags`

## 附錄 C：驗證方式

原「現況數據」章節的數字，是拆檔前對 `messages/{zh,en,ja}.json` 跑一次性分析腳本得到的（該三檔已於 P2 移除，可從 git 歷史取回）。現在的常態檢查用：

```bash
pnpm i18n:check   # 三語系 key 對齊 + 模組對應 + route 接線
pnpm i18n:emit    # 重新產生 src/i18n/client-namespaces.ts
```
