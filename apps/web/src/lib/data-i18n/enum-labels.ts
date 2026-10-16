/**
 * 岩場／岩館資料中「重複出現的枚舉值」→ 訊息檔 key 的對照
 *
 * 資料值本身（中文）維持不變，仍用於比對邏輯（封面產生器、篩選等）；
 * 只有顯示時才透過訊息檔翻譯。對照表查不到的值原樣顯示。
 */

import type { Messages, useTranslations } from 'next-intl'

/** 把物件型別攤平成以 `.` 串接的巢狀 leaf key（如 `'amenity.parking'`） */
type LeafKeys<T> = {
  [K in keyof T & string]: T[K] extends Record<string, unknown> ? `${K}.${LeafKeys<T[K]>}` : K
}[keyof T & string]

type CragDataKey = LeafKeys<Messages['CragData']>
type GymDataKey = LeafKeys<Messages['GymData']>

const ROCK_TYPE_KEYS: Record<string, CragDataKey> = {
  四稜砂岩: 'rock.szelengSandstone',
  珊瑚礁石灰岩: 'rock.coralLimestone',
  石英質砂岩: 'rock.quartziteSandstone',
}

const CLIMBING_TYPE_KEYS: Record<string, CragDataKey> = {
  sport: 'climb.sport',
  trad: 'climb.trad',
  boulder: 'climb.boulder',
  mixed: 'climb.mixed',
}

const AMENITY_KEYS: Record<string, CragDataKey> = {
  停車場: 'amenity.parking',
  廁所: 'amenity.restroom',
  公廁: 'amenity.publicRestroom',
  海灘: 'amenity.beach',
  浮潛: 'amenity.snorkeling',
  便利商店: 'amenity.convenienceStore',
  '7-11便利商店': 'amenity.sevenEleven',
  餐廳: 'amenity.restaurant',
  民宿: 'amenity.guesthouse',
  泥漿溫泉: 'amenity.mudHotSpring',
  附近溫泉: 'amenity.nearbyHotSpring',
  溪流: 'amenity.stream',
  船帆石周邊民宿: 'amenity.guesthousesSailRock',
  墾丁大街餐廳: 'amenity.restaurantsKentingStreet',
  恆春鎮機能完善: 'amenity.hengchunTown',
}

const SEASON_KEYS: Record<string, CragDataKey> = {
  春: 'season.spring',
  夏: 'season.summer',
  秋: 'season.autumn',
  冬: 'season.winter',
}

const TRANSPORT_TYPE_KEYS: Record<string, CragDataKey> = {
  開車: 'transport.drive',
  大眾運輸: 'transport.public',
  '高鐵+客運': 'transport.hsrBus',
  捷運: 'transport.mrt',
  公車: 'transport.bus',
  步行: 'transport.walk',
}

const FACILITY_KEYS: Record<string, GymDataKey> = {
  抱石區: 'facility.bouldering',
  先鋒攀登: 'facility.lead',
  上方確保: 'facility.topRope',
  速度攀登: 'facility.speed',
  體能訓練區: 'facility.training',
  休息區: 'facility.rest',
  淋浴設施: 'facility.shower',
  置物櫃: 'facility.lockers',
}

const GYM_TYPE_KEYS: Record<string, GymDataKey> = {
  bouldering: 'type.bouldering',
  lead: 'type.lead',
  mixed: 'type.mixed',
}

type CragDataT = ReturnType<typeof useTranslations<'CragData'>>
type GymDataT = ReturnType<typeof useTranslations<'GymData'>>

const cragLookup = (t: CragDataT, keys: Record<string, CragDataKey>, value: string): string => {
  const key = keys[value.trim()]
  return key ? t(key) : value
}

const gymLookup = (t: GymDataT, keys: Record<string, GymDataKey>, value: string): string => {
  const key = keys[value.trim()]
  return key ? t(key) : value
}

/** 岩石類型（如「四稜砂岩」） */
export const rockTypeLabel = (t: CragDataT, value: string) => cragLookup(t, ROCK_TYPE_KEYS, value)

/** 岩場設施 */
export const amenityLabel = (t: CragDataT, value: string) => cragLookup(t, AMENITY_KEYS, value)

/** 季節（春／夏／秋／冬） */
export const seasonLabel = (t: CragDataT, value: string) => cragLookup(t, SEASON_KEYS, value)

/** 交通方式類型（開車、捷運…） */
export const transportTypeLabel = (t: CragDataT, value: string) =>
  cragLookup(t, TRANSPORT_TYPE_KEYS, value)

/** 攀登類型：後端回傳 `sport`、`trad` 等代碼，可能以逗號串接 */
export const climbingTypesLabel = (t: CragDataT, value: string) =>
  value
    .split(',')
    .map((type) => cragLookup(t, CLIMBING_TYPE_KEYS, type))
    .join(t('typeSeparator'))

/** 把多個已翻譯的值串成一句話裡的列舉（中文「、」、英文「, 」） */
export const joinLabels = (t: CragDataT, labels: string[]) => labels.join(t('listSeparator'))

/** 岩館設施 */
export const facilityLabel = (t: GymDataT, value: string) => gymLookup(t, FACILITY_KEYS, value)

/** 岩館類型（bouldering／lead／mixed） */
export const gymTypeLabel = (t: GymDataT, type: string) => gymLookup(t, GYM_TYPE_KEYS, type)
