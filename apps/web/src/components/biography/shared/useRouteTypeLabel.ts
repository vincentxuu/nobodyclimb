'use client'

import { useMessages } from 'next-intl'

/**
 * 路線型態（資料庫存的中文值）→ 訊息檔 `BiographyMisc.routeTypes` 的 key。
 *
 * `favorite_route_types` 存的是中文值（如「抱石」），既有使用者資料也是中文，不可翻譯；
 * 顯示時用這張表換成 key，再依語系查顯示文字。
 */
const ROUTE_TYPE_MESSAGE_KEYS: Record<string, string> = {
  // 攀登方式
  抱石: 'bouldering',
  運動攀登: 'sport',
  頂繩攀登: 'topRope',
  速度攀登: 'speed',
  傳統攀登: 'trad',
  // 地形型態
  平板岩: 'slab',
  垂直岩壁: 'vertical',
  外傾岩壁: 'overhang',
  屋簷: 'roof',
  裂隙: 'crack',
  稜線: 'arete',
  壁面: 'face',
  煙囪: 'chimney',
  // 動作風格
  動態路線: 'dynamic',
  跑酷風格: 'parkour',
  協調性: 'coordination',
  靜態: 'static',
  技術性: 'technical',
  力量型: 'power',
  耐力型: 'endurance',
}

/**
 * 回傳一個函式：把存檔用的中文路線型態轉成目前語系的顯示文字。
 * 不在對照表內的值（使用者自訂的路線型態）原樣回傳。
 */
export function useRouteTypeLabel() {
  const messages = useMessages() as Record<string, unknown>
  const misc = (messages.BiographyMisc ?? {}) as { routeTypes?: Record<string, string> }

  return (value: string): string => {
    const key = ROUTE_TYPE_MESSAGE_KEYS[value.trim()]
    return (key && misc.routeTypes?.[key]) || value
  }
}
