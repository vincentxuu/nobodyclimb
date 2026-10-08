/**
 * 岩場／岩館「說明文字」的多語系對照層
 *
 * 頁面顯示的岩場與岩館資料來自後端 API（中文）。日文與英文說明放在
 * `src/data/i18n/{ja,en}/` 的對照檔，以 id 為 key，依語系動態載入後覆蓋到 API 資料上。
 *
 * 取值順序：ja → 日文 → 英文 → 中文；en → 英文 → 中文；zh → 中文。
 *
 * 每筆對照都帶著翻譯當下的中文原文（`zh`）。只有在目前的中文與原文完全相同時才套用譯文，
 * 中文被改過（例如新增封閉、落石公告）就退回中文，避免顯示過期的譯文。
 */

import type { AdaptedCragDetail, AdaptedRouteDetail } from '@/lib/adapters/crag-adapter'
import type { CragArea, CragRoute } from '@/lib/crag-data'
import type { GymDetailData } from '@/lib/gym-data'

export type DataLocale = 'zh' | 'en' | 'ja'

/** 一筆對照：翻譯當下的中文原文與譯文 */
export interface OverlayEntry {
  zh: string
  text: string
}

type OverlayFields = Record<string, OverlayEntry | undefined>

export interface CragOverlay {
  /** 岩場層級欄位（description、approach、parking、liveVideoTitle、liveVideoDescription） */
  crag?: OverlayFields
  /** 交通方式說明（沒有 id，以中文原文比對） */
  transportation?: OverlayEntry[]
  areas?: Record<string, OverlayFields | undefined>
  routes?: Record<string, OverlayFields | undefined>
}

export interface GymOverlay {
  gyms?: Record<string, OverlayFields | undefined>
}

type OverlayLocale = Exclude<DataLocale, 'zh'>
type Loader<T> = () => Promise<T>

const asOverlay =
  <T>(load: () => Promise<{ default: unknown }>): Loader<T> =>
  () =>
    load().then((m) => m.default as T)

// 逐檔列出 import，讓 bundler 能依「語系 × 岩場」拆 chunk：只下載當前頁面需要的那一份
const cragLoaders: Record<OverlayLocale, Record<string, Loader<CragOverlay>>> = {
  ja: {
    longdong: asOverlay(() => import('@/data/i18n/ja/crags/longdong.json')),
    kenting: asOverlay(() => import('@/data/i18n/ja/crags/kenting.json')),
    shoushan: asOverlay(() => import('@/data/i18n/ja/crags/shoushan.json')),
    guanziling: asOverlay(() => import('@/data/i18n/ja/crags/guanziling.json')),
    defulan: asOverlay(() => import('@/data/i18n/ja/crags/defulan.json')),
  },
  en: {
    longdong: asOverlay(() => import('@/data/i18n/en/crags/longdong.json')),
    kenting: asOverlay(() => import('@/data/i18n/en/crags/kenting.json')),
    shoushan: asOverlay(() => import('@/data/i18n/en/crags/shoushan.json')),
    guanziling: asOverlay(() => import('@/data/i18n/en/crags/guanziling.json')),
    defulan: asOverlay(() => import('@/data/i18n/en/crags/defulan.json')),
  },
}

const gymLoaders: Record<OverlayLocale, Loader<GymOverlay>> = {
  ja: asOverlay(() => import('@/data/i18n/ja/gyms.json')),
  en: asOverlay(() => import('@/data/i18n/en/gyms.json')),
}

/** 各語系的退回順序（不含最後的中文） */
const FALLBACK_CHAIN: Record<DataLocale, OverlayLocale[]> = {
  zh: [],
  en: ['en'],
  ja: ['ja', 'en'],
}

export function toDataLocale(locale: string): DataLocale {
  return locale === 'ja' || locale === 'en' ? locale : 'zh'
}

async function loadChain<T>(
  locale: string,
  pick: (l: OverlayLocale) => Loader<T> | undefined
): Promise<T[]> {
  const loaded = await Promise.all(
    FALLBACK_CHAIN[toDataLocale(locale)].map(async (l) => {
      const load = pick(l)
      if (!load) return null
      try {
        return await load()
      } catch (error) {
        // 對照檔載入失敗時退回中文，不讓整頁壞掉
        console.error(`Failed to load ${l} data overlay:`, error)
        return null
      }
    })
  )
  return loaded.filter((o): o is Awaited<T> => o !== null)
}

/** 依語系載入岩場對照檔（依退回順序排列；zh 回傳空陣列） */
export function loadCragOverlays(locale: string, cragId: string): Promise<CragOverlay[]> {
  return loadChain(locale, (l) => cragLoaders[l][cragId])
}

/** 依語系載入岩館對照檔（依退回順序排列；zh 回傳空陣列） */
export function loadGymOverlays(locale: string): Promise<GymOverlay[]> {
  return loadChain(locale, (l) => gymLoaders[l])
}

// ============ 取值 ============

function resolve<T>(
  overlays: T[],
  zh: string | null | undefined,
  getEntry: (overlay: T) => OverlayEntry | undefined
): string {
  if (!zh) return zh ?? ''
  const source = zh.trim()
  for (const overlay of overlays) {
    const entry = getEntry(overlay)
    if (entry?.text && entry.zh.trim() === source) return entry.text
  }
  return zh
}

function resolveOptional<T>(
  overlays: T[],
  zh: string | null | undefined,
  getEntry: (overlay: T) => OverlayEntry | undefined
): string | undefined {
  return zh ? resolve(overlays, zh, getEntry) : (zh ?? undefined)
}

/** 岩場層級的文字沒有穩定 id（交通方式是陣列），直接以中文原文比對 */
function findCragText(overlay: CragOverlay, zh: string): OverlayEntry | undefined {
  const source = zh.trim()
  const fields = Object.values(overlay.crag ?? {})
  return [...fields, ...(overlay.transportation ?? [])].find((entry) => entry?.zh.trim() === source)
}

/** 岩場層級文字（說明、停車、進場、交通方式、即時影像標題等） */
export function localizeCragText(overlays: CragOverlay[], zh: string | null | undefined): string {
  return resolve(overlays, zh, (o) => (zh ? findCragText(o, zh) : undefined))
}

export function localizeAreaDescription(
  overlays: CragOverlay[],
  areaId: string,
  zh: string | null | undefined,
  /** 資料既有的英文說明（API 的 description_en） */
  existingEn?: string | null,
  locale?: string
): string {
  // 英文頁優先用資料既有的英文欄位
  if (zh && existingEn && locale === 'en') return existingEn
  return resolve(overlays, zh, (o) => o.areas?.[areaId]?.description)
}

type RouteTextField = 'description' | 'protection' | 'tips'

export function localizeRouteText(
  overlays: CragOverlay[],
  routeId: string,
  field: RouteTextField,
  zh: string | null | undefined
): string {
  return resolve(overlays, zh, (o) => o.routes?.[routeId]?.[field])
}

// ============ 套用到頁面用的資料結構 ============

export function localizeCragAreas(
  areas: CragArea[],
  overlays: CragOverlay[],
  locale: string
): CragArea[] {
  if (overlays.length === 0) return areas
  return areas.map((area) => ({
    ...area,
    description: area.description
      ? localizeAreaDescription(overlays, area.id, area.description, area.descriptionEn, locale)
      : area.description,
  }))
}

export function localizeCragDetail(
  crag: AdaptedCragDetail,
  overlays: CragOverlay[],
  locale: string
): AdaptedCragDetail {
  if (overlays.length === 0) return crag
  return {
    ...crag,
    description: localizeCragText(overlays, crag.description),
    parking: localizeCragText(overlays, crag.parking),
    liveVideoTitle: crag.liveVideoTitle
      ? localizeCragText(overlays, crag.liveVideoTitle)
      : crag.liveVideoTitle,
    liveVideoDescription: crag.liveVideoDescription
      ? localizeCragText(overlays, crag.liveVideoDescription)
      : crag.liveVideoDescription,
    transportation: crag.transportation.map((item) => ({
      ...item,
      description: localizeCragText(overlays, item.description),
    })),
    areas: localizeCragAreas(crag.areas, overlays, locale),
  }
}

export function localizeCragRoutes(routes: CragRoute[], overlays: CragOverlay[]): CragRoute[] {
  if (overlays.length === 0) return routes
  return routes.map((route) => ({
    ...route,
    description: resolveOptional(
      overlays,
      route.description,
      (o) => o.routes?.[route.id]?.description
    ),
    protection: resolveOptional(
      overlays,
      route.protection,
      (o) => o.routes?.[route.id]?.protection
    ),
    tips: resolveOptional(overlays, route.tips, (o) => o.routes?.[route.id]?.tips),
  }))
}

export function localizeRouteDetail<T extends AdaptedRouteDetail>(
  route: T,
  overlays: CragOverlay[]
): T {
  if (overlays.length === 0) return route
  return {
    ...route,
    description: localizeRouteText(overlays, route.id, 'description', route.description),
    protection: localizeRouteText(overlays, route.id, 'protection', route.protection),
    tips: localizeRouteText(overlays, route.id, 'tips', route.tips),
  }
}

export function localizeGymDetail(gym: GymDetailData, overlays: GymOverlay[]): GymDetailData {
  if (overlays.length === 0) return gym
  const text = (field: string, zh: string | null | undefined) =>
    resolve(overlays, zh, (o) => o.gyms?.[gym.id]?.[field])
  const optional = (field: string, zh: string | null | undefined) =>
    resolveOptional(overlays, zh, (o) => o.gyms?.[gym.id]?.[field])

  return {
    ...gym,
    description: text('description', gym.description),
    notes: text('notes', gym.notes),
    pricing: { ...gym.pricing, notes: optional('pricingNotes', gym.pricing.notes) },
    transportation: {
      mrt: optional('mrt', gym.transportation.mrt),
      bus: optional('bus', gym.transportation.bus),
      train: optional('train', gym.transportation.train),
      parking: optional('parking', gym.transportation.parking),
    },
  }
}
