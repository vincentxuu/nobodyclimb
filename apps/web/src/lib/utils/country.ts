/**
 * 國家相關工具函數
 */

// 國旗對照表
const COUNTRY_FLAGS: Record<string, string> = {
  台灣: '🇹🇼',
  泰國: '🇹🇭',
  越南: '🇻🇳',
  中國: '🇨🇳',
  日本: '🇯🇵',
  韓國: '🇰🇷',
  美國: '🇺🇸',
  西班牙: '🇪🇸',
  法國: '🇫🇷',
  義大利: '🇮🇹',
  希臘: '🇬🇷',
  土耳其: '🇹🇷',
  馬來西亞: '🇲🇾',
  印尼: '🇮🇩',
  菲律賓: '🇵🇭',
  澳洲: '🇦🇺',
  紐西蘭: '🇳🇿',
  英國: '🇬🇧',
  德國: '🇩🇪',
  瑞士: '🇨🇭',
}

/**
 * 根據國家名稱取得對應的國旗 emoji
 * @param country 國家名稱
 * @returns 國旗 emoji，若無對應則回傳地球 emoji
 */
export function getCountryFlag(country: string): string {
  return COUNTRY_FLAGS[country] || '🌍'
}

/**
 * 國家名稱（資料庫存的中文值）→ 訊息檔 `Countries` 的 key。
 *
 * 中文國名是存進資料庫、也拿來比對國旗的值，不可翻譯；
 * 顯示時用這張表換成 key，再由 `useCountryName()` 依語系查顯示名稱。
 */
const COUNTRY_MESSAGE_KEYS: Record<string, string> = {
  台灣: 'TW',
  泰國: 'TH',
  越南: 'VN',
  中國: 'CN',
  日本: 'JP',
  韓國: 'KR',
  美國: 'US',
  西班牙: 'ES',
  法國: 'FR',
  義大利: 'IT',
  希臘: 'GR',
  土耳其: 'TR',
  馬來西亞: 'MY',
  印尼: 'ID',
  菲律賓: 'PH',
  澳洲: 'AU',
  紐西蘭: 'NZ',
  英國: 'GB',
  德國: 'DE',
  瑞士: 'CH',
  其他: 'OTHER',
}

/**
 * 取得國家在訊息檔 `Countries` 中的 key，無對應（使用者自行輸入的國名）時回傳 undefined
 */
export function getCountryMessageKey(country: string): string | undefined {
  return COUNTRY_MESSAGE_KEYS[country]
}

/**
 * 常見攀岩國家列表（值會存進資料庫，維持中文；顯示請用 `useCountryName()`）
 */
export const COMMON_COUNTRIES = [
  '台灣',
  '泰國',
  '越南',
  '中國',
  '日本',
  '韓國',
  '美國',
  '西班牙',
  '法國',
  '義大利',
  '希臘',
  '土耳其',
  '馬來西亞',
  '印尼',
  '菲律賓',
  '澳洲',
  '紐西蘭',
  '英國',
  '德國',
  '瑞士',
  '其他',
]
