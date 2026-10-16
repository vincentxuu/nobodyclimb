/**
 * P2：把 messages/{locale}.json 這個單一大檔，拆成
 *      messages/{locale}/{module}.json 多個模組檔，並產生 messages/{locale}/index.ts。
 *
 * 用法：node scripts/i18n/split-messages.mjs
 *
 * 產生後會自我驗證：合併所有模組檔的結果必須與原檔完全相同（key 集合 + 值）。
 * 驗證失敗會以非 0 退出碼結束，不會留下半成品。
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { LOCALES, MODULES, moduleNames } from './modules.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const MESSAGES_DIR = join(__dirname, '..', '..', 'apps', 'web', 'messages')

function readMonolith(locale) {
  return JSON.parse(readFileSync(join(MESSAGES_DIR, `${locale}.json`), 'utf8'))
}

function buildIndexTs() {
  const mods = moduleNames()
  const imports = mods.map((m) => `import ${m} from './${m}.json'`).join('\n')
  const spread = mods.map((m) => `  ...${m},`).join('\n')
  return `${imports}

// 由 scripts/i18n/split-messages.mjs 產生，請勿手動編輯。
// 新增模組後重跑：node scripts/i18n/split-messages.mjs
const messages = {
${spread}
}

export default messages
`
}

function mergeModules(locale) {
  const merged = {}
  for (const mod of moduleNames()) {
    const data = JSON.parse(readFileSync(join(MESSAGES_DIR, locale, `${mod}.json`), 'utf8'))
    Object.assign(merged, data)
  }
  return merged
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

function main() {
  const originals = {}
  for (const locale of LOCALES) originals[locale] = readMonolith(locale)

  // 檢查對應表是否完整涵蓋所有 namespace，且無重複
  const allNamespaces = Object.keys(originals[LOCALES[0]])
  const mapped = Object.values(MODULES).flat()
  const mappedSet = new Set(mapped)
  if (mappedSet.size !== mapped.length) {
    throw new Error(
      `modules.mjs 有 namespace 被重複指派：${mapped.filter((n, i) => mapped.indexOf(n) !== i)}`
    )
  }
  const missing = allNamespaces.filter((ns) => !mappedSet.has(ns))
  const unknown = mapped.filter((ns) => !allNamespaces.includes(ns))
  if (missing.length) throw new Error(`modules.mjs 漏掉 namespace：${missing.join(', ')}`)
  if (unknown.length)
    throw new Error(`modules.mjs 有訊息檔不存在的 namespace：${unknown.join(', ')}`)

  // 寫入模組檔
  for (const locale of LOCALES) {
    const mono = originals[locale]
    const dir = join(MESSAGES_DIR, locale)
    mkdirSync(dir, { recursive: true })
    for (const [mod, namespaces] of Object.entries(MODULES)) {
      const subset = {}
      for (const ns of namespaces) subset[ns] = mono[ns]
      writeFileSync(join(dir, `${mod}.json`), `${JSON.stringify(subset, null, 2)}\n`)
    }
    writeFileSync(join(dir, 'index.ts'), buildIndexTs())
  }

  // 自我驗證：合併結果必須等於原檔
  for (const locale of LOCALES) {
    const merged = mergeModules(locale)
    if (stableStringify(merged) !== stableStringify(originals[locale])) {
      throw new Error(`${locale} 合併結果與原檔不一致，已中止`)
    }
  }

  // 通過驗證後才移除舊單檔
  for (const locale of LOCALES) {
    const oldFile = join(MESSAGES_DIR, `${locale}.json`)
    if (existsSync(oldFile)) rmSync(oldFile)
  }

  console.log(
    `✅ 拆分完成：${LOCALES.length} 個語系 × ${moduleNames().length} 個模組；合併結果已驗證與原檔一致。`
  )
}

main()
