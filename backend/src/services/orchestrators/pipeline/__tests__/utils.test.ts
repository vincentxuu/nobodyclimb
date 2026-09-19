import { describe, expect, it } from 'vitest'
import type { AISource } from '../../../../types'
import { isAssistantVoiceQuestion, mergeCarryOverSources, parseSuggestedQuestions } from '../utils'

const ROUTE_LIST =
  '根據您的完攀記錄，我為您推薦以下 5.11 範圍的路線：\n\n- ⛰ 磨繩子，難度等級：5.11b，類型：運攀，岩場：壽山。'

describe('isAssistantVoiceQuestion', () => {
  it('含「您」一律視為助理反問（2026-09-19 preview 實際外洩的建議問題）', () => {
    expect(
      isAssistantVoiceQuestion(
        '這些路線的難度都接近您完攀的美人照鏡 5.11b，您想先從哪個岩場開始嘗試？'
      )
    ).toBe(true)
    expect(isAssistantVoiceQuestion('您偏好運攀還是抱石路線？')).toBe(true)
  })

  it('「你 + 意願動詞」是助理問使用者', () => {
    expect(isAssistantVoiceQuestion('你想先挑戰哪一條？')).toBe(true)
    expect(isAssistantVoiceQuestion('這幾條裡，你偏好哪個岩場？')).toBe(true)
  })

  it('使用者向助理提問的句子不擋', () => {
    expect(isAssistantVoiceQuestion('這條路線適合初學者嗎？')).toBe(false)
    expect(isAssistantVoiceQuestion('壽山的 5.11 路線有哪些特色？')).toBe(false)
    expect(isAssistantVoiceQuestion('你推薦哪一條？')).toBe(false)
  })
})

describe('parseSuggestedQuestions', () => {
  it('SUGGESTIONS 區塊裡的助理反問句被剔除，其餘保留', () => {
    const raw = `${ROUTE_LIST}\n\n---SUGGESTIONS---\n1. 這些路線的難度都接近您完攀的美人照鏡 5.11b，您想先從哪個岩場開始嘗試？\n2. 您偏好運攀還是抱石路線？\n3. 壽山平台上區域怎麼去？`
    const { answer, suggested_questions } = parseSuggestedQuestions(raw)
    expect(suggested_questions).toEqual(['壽山平台上區域怎麼去？'])
    expect(answer).toBe(ROUTE_LIST)
  })

  it('全部違規時回傳空陣列，不拿反問句充數', () => {
    const raw = `${ROUTE_LIST}\n\n---SUGGESTIONS---\n1. 您想先從哪個岩場開始？\n2. 您需要更多資訊嗎？`
    expect(parseSuggestedQuestions(raw).suggested_questions).toEqual([])
  })

  it('去除重複、markdown 粗體與列點符號，最多 3 條', () => {
    const raw = `${ROUTE_LIST}\n\n---SUGGESTIONS---\n- **龍洞第一洞怎麼去？**\n- 龍洞第一洞怎麼去？\n- 壽山有停車場嗎？\n- 墾丁龍牆的難度分佈？\n- 德芙蘭適合新手嗎？`
    expect(parseSuggestedQuestions(raw).suggested_questions).toEqual([
      '龍洞第一洞怎麼去？',
      '壽山有停車場嗎？',
      '墾丁龍牆的難度分佈？',
    ])
  })

  it('無分隔符：尾端連續問句視為建議，反問句只剝離不保留', () => {
    const raw = `${ROUTE_LIST}\n\n壽山平台上區域怎麼去？\n您想先從哪個岩場開始？`
    const { answer, suggested_questions } = parseSuggestedQuestions(raw)
    expect(suggested_questions).toEqual(['壽山平台上區域怎麼去？'])
    expect(answer).toBe(ROUTE_LIST)
  })

  it('無分隔符：只有一行尾端問句時視為正文，不剝離', () => {
    const raw = `${ROUTE_LIST}\n\n您想先從哪個岩場開始？`
    const { answer, suggested_questions } = parseSuggestedQuestions(raw)
    expect(suggested_questions).toEqual([])
    expect(answer).toBe(raw)
  })
})

const src = (id: string, title: string): AISource => ({
  id,
  type: 'route',
  title,
  excerpt: '',
  score: 0,
})

describe('mergeCarryOverSources', () => {
  it('只併入回答有提到的上一輪來源，保持原順序並放在檢索結果前面', () => {
    const merged = mergeCarryOverSources(
      '「望著大海」攀到頂可以看到海，熱身路線則沒有提到風景',
      [src('r1', '熱身路線'), src('r2', '好痛'), src('r3', '望著大海')],
      [src('r9', '看起來我可以')]
    )
    expect(merged.map((s) => s.id)).toEqual(['r1', 'r3', 'r9'])
  })

  it('依 id 去重，同一路線同時在兩邊只留一筆', () => {
    const merged = mergeCarryOverSources(
      '熱身路線',
      [src('r1', '熱身路線')],
      [src('r1', '熱身路線'), src('r2', '好痛')]
    )
    expect(merged.map((s) => s.id)).toEqual(['r1', 'r2'])
  })

  it('沒有 carry-over 時等同檢索結果', () => {
    expect(
      mergeCarryOverSources('任何回答', undefined, [src('r2', '好痛')]).map((s) => s.id)
    ).toEqual(['r2'])
  })
})
