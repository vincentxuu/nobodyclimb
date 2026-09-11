import type { RagToolToggles } from '../../../../types'
import { GraphState } from '../state'

type NodeFn = (state: GraphState) => Promise<Partial<GraphState>>

/**
 * 包裝節點函式，檢查 ragTools 開關。
 * 如果 ragTools[name] === false，跳過該節點（返回空 state）。
 * 未設定或 true 則正常執行。
 */
export function withToggle(name: keyof RagToolToggles, node: NodeFn): NodeFn {
  return async (state: GraphState) => {
    if (state.ragTools?.[name] === false) return {}
    return node(state)
  }
}
