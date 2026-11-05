import { readFileSync } from 'node:fs'
import { Converter } from 'opencc-js/cn2t'
import jpShinjitai from 'opencc-js/dict/JPShinjitaiCharactersRev'
import stCharacters from 'opencc-js/dict/STCharacters'

// 中文稿的簡體字形檢查。刻意只抓高把握的情況，寧可漏抓也不要誤判：
//   1. 沒有繁體用法的簡體字（OpenCC 會轉換，且不在 Big5 常用與次常用字內），如「会」「温」。
//   2. 繁簡共用但常被簡體誤用的字，依 OpenCC 的詞組判斷，如「午后」→「午後」；「皇后」不受影響。
// 日文專有名詞（含假名，或含日本新字體）不檢查；其餘例外列在 zh-hant-allow.json。
const sharedForms = new Set(['后', '里', '干'])
const toTraditional = Converter({ from: 'cn', to: 'tw' })
const big5 = new Set()
{
  const decoder = new TextDecoder('big5')
  // Big5 常用字 0xA440–0xC67E、次常用字 0xC940–0xF9D5。
  for (let lead = 0xa4; lead <= 0xf9; lead++) {
    if (lead > 0xc6 && lead < 0xc9) continue
    for (let trail = 0x40; trail <= 0xfe; trail++) {
      if ((trail > 0x7e && trail < 0xa1) || (lead === 0xf9 && trail > 0xd5)) continue
      big5.add(decoder.decode(Uint8Array.of(lead, trail)))
    }
  }
}
// 字典格式為「來源字 目標字|…」：STCharacters 是簡→繁，JPShinjitaiCharactersRev 是舊字體→新字體。
const column = (dictionary, index) =>
  new Set(dictionary.split('|').map((entry) => entry.split(' ')[index]))
const simplified = column(stCharacters, 0)
const japaneseOnly = new Set(
  [...column(jpShinjitai, 1)].filter((char) => !simplified.has(char) && !big5.has(char))
)
export const defaultAllow = JSON.parse(
  readFileSync(new URL('./zh-hant-allow.json', import.meta.url), 'utf8')
).phrases

const blank = (match) => ' '.repeat(match.length)
/** 回傳 [{ char, suggestion, context }]；text 為 Markdown 或純文字。 */
export function findSimplified(text, allow = defaultAllow) {
  let prose = text
    .replace(/```[\s\S]*?```/g, blank)
    .replace(/`[^`\n]*`/g, blank)
    // 連結文字多為來源的原文標題，連同網址一併略過。
    .replace(/\[[^\]\n]*\]\([^)\n]*\)/g, blank)
    .replace(/https?:\/\/[^\s<)]+/g, blank)
  for (const phrase of allow) prose = prose.replaceAll(phrase, blank(phrase))
  const findings = []
  for (const [run] of prose.matchAll(/[\p{Script=Han}぀-ヿ々〆ー・]+/gu)) {
    const chars = [...run]
    if (chars.some((char) => /[぀-ヿ]/.test(char) || japaneseOnly.has(char))) continue
    const converted = [...toTraditional(run)]
    chars.forEach((char, index) => {
      const context = chars.slice(Math.max(0, index - 6), index + 7).join('')
      if (simplified.has(char) && !big5.has(char))
        findings.push({ char, suggestion: converted[index] ?? '', context })
      else if (
        sharedForms.has(char) &&
        converted.length === chars.length &&
        converted[index] !== char
      )
        findings.push({ char, suggestion: converted[index], context })
    })
  }
  return findings
}
