import type { ToolManifest } from '../types'

export const TOOL_MANIFESTS: ToolManifest[] = [
  {
    name: 'search',
    description: '搜尋攀岩路線和岩場',
    triggers: ['路線', '岩場', '搜尋', '找', '有哪些', '推薦路線', '在哪', '怎麼去'],
    tools: ['search_routes', 'search_crags'],
    promptFragment:
      '你可以搜尋台灣攀岩路線和岩場資料庫（混合向量 + 全文檢索），根據名稱、難度、類型、位置等條件查找路線或岩場。',
    requiresAuth: false,
  },
  {
    name: 'recommend',
    description: '個人化路線推薦',
    triggers: ['推薦', '建議', '適合我', '下一條', '推薦我'],
    tools: ['recommend'],
    promptFragment:
      '你可以根據使用者的攀登歷史和能力，推薦個人化的下一條攀岩路線，會自動排除已完攀路線。',
    requiresAuth: true,
  },
  {
    name: 'weather',
    description: '查詢岩場天氣',
    triggers: ['天氣', '下雨', '適合攀岩嗎', '出門', '會不會下雨'],
    tools: ['weather'],
    promptFragment: '你可以查詢指定岩場的天氣預報（溫度、降雨機率、風速），幫助判斷是否適合出發攀岩。',
    requiresAuth: false,
  },
  {
    name: 'data',
    description: '結構化資料查詢與統計',
    triggers: ['幾條', '有多少', '統計', '分佈', '排名', '列出', '清單', 'FA', '首攀', '影片'],
    tools: ['sql_query', 'crag_info'],
    promptFragment:
      '你可以查詢攀岩資料庫的結構化資料：路線統計、難度分佈、岩場詳細資訊、首攀紀錄、影片等。',
    requiresAuth: false,
  },
  {
    name: 'profile',
    description: '使用者個人攀登檔案',
    triggers: ['我的', '我爬過', '我的記錄', '我的等級', '個人', '完攀'],
    tools: ['user_profile'],
    promptFragment:
      '你可以查詢使用者的攀岩歷史、能力等級、近期完攀記錄與偏好，用於個人化建議。',
    requiresAuth: true,
  },
]

/** 根據使用者是否登入，回傳啟用的 manifest 清單 */
export function getActiveManifests(isAuthenticated: boolean): ToolManifest[] {
  return TOOL_MANIFESTS.filter((m) => !m.requiresAuth || isAuthenticated)
}

/** 從啟用的 manifests 組裝 system prompt 的 capability 描述區塊 */
export function buildCapabilityPromptSection(manifests: ToolManifest[]): string {
  return manifests.map((m) => `- **${m.name}**：${m.promptFragment}`).join('\n')
}
