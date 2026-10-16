/**
 * P0：i18n 健康檢查（供 CI 與本機使用）。
 *
 * 檢查項目：
 *  1. 三語系（zh/en/ja）的 namespace 與 key 集合完全一致
 *  2. modules.mjs 涵蓋所有 namespace，且模組檔內容與宣告一致
 *  3. 各語系 index.ts 存在
 *  4. 找出程式碼「已定義但從未被引用」的 namespace（warning，不阻擋）
 *
 * 用法：node scripts/i18n/check-i18n.mjs
 * 有任何「錯誤」時以非 0 退出碼結束。
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { LOCALES, MODULES } from './modules.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..')
const MESSAGES_DIR = join(ROOT, 'apps', 'web', 'messages')
const SRC_DIR = join(ROOT, 'apps', 'web', 'src')

const errors = []
const warnings = []

function readModuleFile(locale, mod) {
  const p = join(MESSAGES_DIR, locale, `${mod}.json`)
  if (!existsSync(p)) {
    errors.push(`缺少模組檔：apps/web/messages/${locale}/${mod}.json`)
    return null
  }
  return JSON.parse(readFileSync(p, 'utf8'))
}

function leafKeys(obj, prefix = '') {
  const out = []
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) out.push(...leafKeys(v, path))
    else out.push(path)
  }
  return out
}

function collect(locale) {
  const namespaces = {}
  for (const mod of Object.keys(MODULES)) {
    const data = readModuleFile(locale, mod)
    if (data) Object.assign(namespaces, data)
  }
  return namespaces
}

function diff(a, b) {
  const setB = new Set(b)
  return a.filter((x) => !setB.has(x))
}

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
    const p = join(dir, entry.name)
    if (entry.isDirectory()) walk(p, acc)
    else if (/\.(ts|tsx)$/.test(entry.name)) acc.push(p)
  }
  return acc
}

function findReferencedNamespaces() {
  const roots = new Set()
  const res = [
    /useTranslations\(\s*['"]([A-Za-z0-9_.]+)['"]/g,
    /getTranslations\(\s*['"]([A-Za-z0-9_.]+)['"]/g,
    /namespace:\s*['"]([A-Za-z0-9_.]+)['"]/g,
    /messages\.([A-Z][A-Za-z0-9_]+)/g,
  ]
  for (const file of walk(SRC_DIR)) {
    const src = readFileSync(file, 'utf8')
    for (const re of res) {
      let m
      while ((m = re.exec(src))) roots.add(m[1].split('.')[0])
    }
  }
  return roots
}

// --- 1. 三語系 key 對齊 ---
const byLocale = {}
for (const locale of LOCALES) byLocale[locale] = collect(locale)

const keysByLocale = {}
for (const locale of LOCALES) {
  keysByLocale[locale] = leafKeys(byLocale[locale]).sort()
}

const base = LOCALES[0]
for (const locale of LOCALES.slice(1)) {
  const missing = diff(keysByLocale[base], keysByLocale[locale])
  const extra = diff(keysByLocale[locale], keysByLocale[base])
  if (missing.length)
    errors.push(
      `${locale} 缺少 ${missing.length} 個 key（相對於 ${base}）：${missing.slice(0, 10).join(', ')}${missing.length > 10 ? ' …' : ''}`
    )
  if (extra.length)
    errors.push(
      `${locale} 多出 ${extra.length} 個 key（相對於 ${base}）：${extra.slice(0, 10).join(', ')}${extra.length > 10 ? ' …' : ''}`
    )
}

// --- 2. 模組宣告 vs 檔案內容 ---
for (const locale of LOCALES) {
  for (const [mod, namespaces] of Object.entries(MODULES)) {
    const data = readModuleFile(locale, mod)
    if (!data) continue
    const inFile = Object.keys(data).sort()
    const expected = [...namespaces].sort()
    if (inFile.join(',') !== expected.join(',')) {
      errors.push(
        `apps/web/messages/${locale}/${mod}.json 內容與 modules.mjs 不符：檔案=[${inFile.join(', ')}] 宣告=[${expected.join(', ')}]`
      )
    }
  }
}

// --- 3. index.ts 存在 ---
for (const locale of LOCALES) {
  if (!existsSync(join(MESSAGES_DIR, locale, 'index.ts'))) {
    errors.push(`缺少 apps/web/messages/${locale}/index.ts（重跑 split-messages.mjs 產生）`)
  }
}

// --- 4. 未被引用的 namespace（warning） ---
const referenced = findReferencedNamespaces()
const defined = Object.keys(byLocale[base])
const unreferenced = defined.filter((ns) => !referenced.has(ns))
if (unreferenced.length) {
  warnings.push(
    `以下 ${unreferenced.length} 個 namespace 在 apps/web/src 找不到引用（可能是動態字串或死訊息）：${unreferenced.join(', ')}`
  )
}

// --- 輸出 ---
if (warnings.length) {
  console.log('⚠️  i18n 檢查提醒')
  for (const w of warnings) console.log(`   - ${w}`)
}
if (errors.length) {
  console.error('❌ i18n 檢查失敗')
  for (const e of errors) console.error(`   - ${e}`)
  process.exit(1)
}
console.log('✅ i18n 檢查通過（三語系 key 對齊、模組檔一致、index.ts 齊全）')
