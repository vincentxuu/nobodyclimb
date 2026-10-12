/**
 * 延後載入 expo/fetch。
 *
 * expo/fetch 依賴原生模組，模組不可用（舊 dev client、jest）時只會讓這次串流在送出前失敗，
 * 不會讓整個 ChatWidget 載入失敗。獨立成模組是為了讓測試能直接 mock 載入結果
 * （jest-expo 的 babel 設定不轉譯 dynamic import）。
 */
export function loadExpoFetch() {
  return import('expo/fetch')
}
