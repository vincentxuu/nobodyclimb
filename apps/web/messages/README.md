# i18n 訊息檔

訊息依**模組**拆成多個檔案，例如：

```
messages/
  zh/
    common.json      # Common
    chrome.json      # Navbar, Footer, LocaleSwitcher, MobileMenu, UserMenu
    crag.json        # CragPage, CragData, CragFaq, TrafficCameras
    ...
    index.ts         # 由 split-messages.mjs 產生，合併上面所有模組檔
  en/ ...
  ja/ ...
```

- 每個 JSON 檔的**頂層 key = namespace**（如 `CragPage`）。
- 模組 ↔ namespace 對應表在 `scripts/i18n/modules.mjs`。
- `index.ts` 會把同語系所有模組檔合併回一個物件，runtime 行為與舊的單一大檔完全等價。

## 新增 / 修改譯文

1. 在對應模組的**三個語系檔**（`zh` / `en` / `ja`）都加上同一個 key。
2. 若是全新的 namespace，把它補進 `scripts/i18n/modules.mjs` 對應模組的陣列。
3. 跑 `pnpm i18n:check` 驗證（CI 也會跑）。

## 相關指令

```bash
pnpm i18n:check   # 三語系 key 對齊 + 模組對應 + route 接線
pnpm i18n:emit    # 重新產生 src/i18n/client-namespaces.ts
```

## Client payload（P3）

只有該 route client 元件實際用到的 namespace 會送到瀏覽器，清單由
`scripts/i18n/analyze-namespaces.mjs` 靜態分析產生（`src/i18n/client-namespaces.ts`）。
新 route 若沒有自己的 `layout.tsx`，要新增一個並用 `<RouteMessages route="...">` 包住 children。

詳見 `docs/tech-debt/i18n-audit.md`。
