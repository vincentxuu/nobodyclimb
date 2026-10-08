/**
 * 岩場／岩館資料中「重複出現的枚舉值」→ 訊息檔 key 的對照
 *
 * 資料值本身（中文）維持不變，仍用於比對邏輯（封面產生器、篩選等）；
 * 只有顯示時才透過訊息檔翻譯。對照表查不到的值原樣顯示。
 */

type CragDataKey = keyof IntlMessages['CragData']
type GymDataKey = keyof IntlMessages['GymData']

const ROCK_TYPE_KEYS: Record<string, CragDataKey> = {
  四稜砂岩: 'rockSzelengSandstone',
  珊瑚礁石灰岩: 'rockCoralLimestone',
  石英質砂岩: 'rockQuartziteSandstone',
}

const CLIMBING_TYPE_KEYS: Record<string, CragDataKey> = {
  sport: 'climbSport',
  trad: 'climbTrad',
  boulder: 'climbBoulder',
  mixed: 'climbMixed',
}

const AMENITY_KEYS: Record<string, CragDataKey> = {
  停車場: 'amenityParking',
  廁所: 'amenityRestroom',
  公廁: 'amenityPublicRestroom',
  海灘: 'amenityBeach',
  浮潛: 'amenitySnorkeling',
  便利商店: 'amenityConvenienceStore',
  '7-11便利商店': 'amenitySevenEleven',
  餐廳: 'amenityRestaurant',
  民宿: 'amenityGuesthouse',
  泥漿溫泉: 'amenityMudHotSpring',
  附近溫泉: 'amenityNearbyHotSpring',
  溪流: 'amenityStream',
  船帆石周邊民宿: 'amenityGuesthousesSailRock',
  墾丁大街餐廳: 'amenityRestaurantsKentingStreet',
  恆春鎮機能完善: 'amenityHengchunTown',
}

const SEASON_KEYS: Record<string, CragDataKey> = {
  春: 'seasonSpring',
  夏: 'seasonSummer',
  秋: 'seasonAutumn',
  冬: 'seasonWinter',
}

const TRANSPORT_TYPE_KEYS: Record<string, CragDataKey> = {
  開車: 'transportDrive',
  大眾運輸: 'transportPublic',
  '高鐵+客運': 'transportHsrBus',
  捷運: 'transportMrt',
  公車: 'transportBus',
  步行: 'transportWalk',
}

const FACILITY_KEYS: Record<string, GymDataKey> = {
  抱石區: 'facilityBouldering',
  先鋒攀登: 'facilityLead',
  上方確保: 'facilityTopRope',
  速度攀登: 'facilitySpeed',
  體能訓練區: 'facilityTraining',
  休息區: 'facilityRest',
  淋浴設施: 'facilityShower',
  置物櫃: 'facilityLockers',
}

const GYM_TYPE_KEYS: Record<string, GymDataKey> = {
  bouldering: 'typeBouldering',
  lead: 'typeLead',
  mixed: 'typeMixed',
}

type CragDataT = (key: CragDataKey) => string
type GymDataT = (key: GymDataKey) => string

const lookup = <K extends string>(
  t: (key: K) => string,
  keys: Record<string, K>,
  value: string
): string => {
  const key = keys[value.trim()]
  return key ? t(key) : value
}

/** 岩石類型（如「四稜砂岩」） */
export const rockTypeLabel = (t: CragDataT, value: string) => lookup(t, ROCK_TYPE_KEYS, value)

/** 岩場設施 */
export const amenityLabel = (t: CragDataT, value: string) => lookup(t, AMENITY_KEYS, value)

/** 季節（春／夏／秋／冬） */
export const seasonLabel = (t: CragDataT, value: string) => lookup(t, SEASON_KEYS, value)

/** 交通方式類型（開車、捷運…） */
export const transportTypeLabel = (t: CragDataT, value: string) =>
  lookup(t, TRANSPORT_TYPE_KEYS, value)

/** 攀登類型：後端回傳 `sport`、`trad` 等代碼，可能以逗號串接 */
export const climbingTypesLabel = (t: CragDataT, value: string) =>
  value
    .split(',')
    .map((type) => lookup(t, CLIMBING_TYPE_KEYS, type))
    .join(t('typeSeparator'))

/** 把多個已翻譯的值串成一句話裡的列舉（中文「、」、英文「, 」） */
export const joinLabels = (t: CragDataT, labels: string[]) => labels.join(t('listSeparator'))

/** 岩館設施 */
export const facilityLabel = (t: GymDataT, value: string) => lookup(t, FACILITY_KEYS, value)

/** 岩館類型（bouldering／lead／mixed） */
export const gymTypeLabel = (t: GymDataT, type: string) => lookup(t, GYM_TYPE_KEYS, type)
