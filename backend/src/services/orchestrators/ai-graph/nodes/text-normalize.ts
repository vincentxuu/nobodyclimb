import { GraphState } from '../state'

/**
 * 查詢文字正規化節點。
 *
 * 統一繁簡體異體字，讓 embedding 模型不會因為繁簡差異而錯失語意相同的內容。
 * 例如「攀巖」→「攀岩」、「龙洞」→「龍洞」。
 *
 * 注意：這裡是正規化（normalize），不是翻譯。
 * 目的是消除同義異形字的 embedding 偏差，不改變語意。
 */

// 攀岩領域常見的繁簡異體字對照（雙向統一到站內慣用字）
const NORMALIZE_MAP: ReadonlyArray<readonly [RegExp, string]> = [
  // 簡體 → 站內繁體慣用字
  [/攀巖/g, '攀岩'],
  [/巖場/g, '岩場'],
  [/巖壁/g, '岩壁'],
  [/巖石/g, '岩石'],
  [/龙洞/g, '龍洞'],
  [/关子岭/g, '關子嶺'],
  [/热海/g, '熱海'],
  [/难度/g, '難度'],
  [/路线/g, '路線'],
  [/抱石/g, '抱石'], // 簡繁同形，但確保一致
  [/运动攀/g, '運動攀'],
  [/传统攀/g, '傳統攀'],
  // 正式異體字 → 站內慣用字（OpenCC 可能產生的）
  [/巖/g, '岩'],
  [/臺/g, '台'],
]

export async function textNormalizeNode(state: GraphState): Promise<Partial<GraphState>> {
  const query = state.request.query
  if (!query) return {}

  let normalized = query
  let changed = false

  for (const [pattern, replacement] of NORMALIZE_MAP) {
    const before = normalized
    normalized = normalized.replace(pattern, replacement)
    if (before !== normalized) changed = true
  }

  if (!changed) return {}

  return {
    request: {
      ...state.request,
      query: normalized,
    },
    trace: {
      text_normalize: {
        original: query,
        normalized,
      },
    },
  }
}
