import { PERSONALITY_TYPES, QUIZ_QUESTIONS, TRAINING_PLANS } from '@nobodyclimb/constants'
import en from '../../../../messages/en.json'
import ja from '../../../../messages/ja.json'
import zh from '../../../../messages/zh.json'
import { translateTrainingText } from '../training-i18n'

// constants 的測驗資料是繁中單一來源；這裡確保新增／修改資料時，譯文不會漏掉
const MESSAGES = { zh, en, ja } as const
const HAN_ONLY = /^[一-鿿\s，。、：；！？「」（）]+$/

function collectTrainingTexts(): string[] {
  const texts = new Set<string>()
  for (const plan of Object.values(TRAINING_PLANS)) {
    for (const week of plan.weeks) {
      texts.add(week.theme)
      for (const day of week.days) {
        texts.add(day.title)
        texts.add(day.description)
        for (const exercise of day.exercises) {
          texts.add(exercise.name)
          texts.add(exercise.description)
        }
      }
    }
  }
  return [...texts]
}

describe('測驗在地化資料', () => {
  it.each(['zh', 'en', 'ja'] as const)('%s 訊息檔涵蓋所有題目', (locale) => {
    const questions = MESSAGES[locale].Quiz.questions as Record<string, string>
    for (const question of QUIZ_QUESTIONS) {
      expect(questions[question.id]).toBeTruthy()
    }
  })

  it('zh 題目文字與 constants 一致（計分資料來源不變）', () => {
    const questions = zh.Quiz.questions as Record<string, string>
    for (const question of QUIZ_QUESTIONS) {
      expect(questions[question.id]).toBe(question.textZh)
    }
  })

  it.each(['zh', 'en', 'ja'] as const)('%s 訊息檔涵蓋所有人格類型', (locale) => {
    const personalities = MESSAGES[locale].Quiz.personalities as Record<
      string,
      { name: string; strengths: string[]; blindSpots: string[] }
    >
    for (const type of PERSONALITY_TYPES) {
      const localized = personalities[type.code]
      expect(localized?.name).toBeTruthy()
      expect(localized.strengths).toHaveLength(type.strengths.length)
      expect(localized.blindSpots).toHaveLength(type.blindSpots.length)
    }
  })

  it.each(['en', 'ja'] as const)('訓練計畫的每段文字都有 %s 譯文', (locale) => {
    const untranslated = collectTrainingTexts().filter((text) => {
      const translated = translateTrainingText(text, locale)
      // 日文譯文可能與繁中同形（純漢字詞），只有英文才要求一定不同
      return !translated || (locale === 'en' && translated === text)
    })
    expect(untranslated).toEqual([])
  })

  it('英文譯文不殘留純中文內容', () => {
    const leftovers = collectTrainingTexts()
      .map((text) => translateTrainingText(text, 'en'))
      .filter((text) => HAN_ONLY.test(text))
    expect(leftovers).toEqual([])
  })

  it('繁中與未知語系回傳原文', () => {
    const [sample] = collectTrainingTexts()
    expect(translateTrainingText(sample, 'zh')).toBe(sample)
    expect(translateTrainingText(sample, 'fr')).toBe(sample)
  })
})
