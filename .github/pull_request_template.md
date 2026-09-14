## Why is this necessary?

<!-- 解決什麼問題、為什麼需要這個變更？
- 問題的根因是什麼？
- 相關的 Issue 或需求連結（如有） -->

## How does it address?

<!-- 怎麼解決的？主要改了什麼？
- 依 app/package 條列變更（web / backend / packages）
- 跨 app 變更標明依賴順序 -->

## Reviewer 需要判斷的事

<!-- 需要「人」判斷的決策點（產品邏輯、邊界 case、API contract、跨 app 影響）。
     每條附 path:line。純機械性變更寫：「無重大決策點，請抽查下方檢查清單」。 -->

## Test evidence

<!-- 後端：貼 vitest 輸出。前端：附截圖（desktop + mobile 390px）。
     如適用，涵蓋 loading / 有資料 / empty / error 四態。 -->

## Risk

<!-- 風險點、相容性、需要留意的取捨。無則寫 None -->

## Checklist

- [ ] lint / typecheck 通過
- [ ] 測試通過
- [ ] 無硬編 secret 或 API key
- [ ] 修改範圍契合需求，無夾帶
