/**
 * P3 分析工具：算出每個進入點（root layout / 各 route）在 client 端實際會用到的 namespace。
 *
 * 作法：從進入點出發，沿著相對路徑與 `@/` 別名的 import / dynamic import / require
 * 追蹤同專案模組，蒐集所有 useTranslations('X')、getTranslations('X')、namespace: 'X'、
 * messages.X 用到的 namespace。
 *
 * 用法：
 *   node scripts/i18n/analyze-namespaces.mjs root          # root layout 的 core set
 *   node scripts/i18n/analyze-namespaces.mjs route <name>  # 單一 route（[locale] 下的目錄名）
 *   node scripts/i18n/analyze-namespaces.mjs all           # 全部 route
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..')
const WEB_SRC = join(ROOT, 'apps', 'web', 'src')
const APP_LOCALE = join(WEB_SRC, 'app', '[locale]')

const NS_RES = [
  /useTranslations\(\s*['"]([A-Za-z0-9_.]+)['"]/g,
  /getTranslations\(\s*['"]([A-Za-z0-9_.]+)['"]/g,
  /namespace:\s*['"]([A-Za-z0-9_.]+)['"]/g,
  /messages\.([A-Z][A-Za-z0-9_]+)/g,
]
const IMPORT_RES = [
  /(?:import|export)\s+(?:[\s\S]*?)\s*from\s*['"]([^'"]+)['"]/g,
  /import\(\s*['"]([^'"]+)['"]\s*\)/g,
  /require\(\s*['"]([^'"]+)['"]\s*\)/g,
]

function resolveSpecifier(spec, fromFile) {
  let base
  if (spec.startsWith('@/')) base = join(WEB_SRC, spec.slice(2))
  else if (spec.startsWith('.')) base = resolve(dirname(fromFile), spec)
  else return null
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    join(base, 'index.ts'),
    join(base, 'index.tsx'),
  ]
  for (const c of candidates) {
    if (existsSync(c) && statSync(c).isFile()) return c
  }
  return null
}

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue
    const p = join(dir, entry.name)
    if (entry.isDirectory()) walk(p, acc)
    else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) acc.push(p)
  }
  return acc
}

function importsOf(file) {
  const src = readFileSync(file, 'utf8')
  const out = []
  for (const re of IMPORT_RES) {
    re.lastIndex = 0
    let m
    while ((m = re.exec(src))) {
      const resolved = resolveSpecifier(m[1], file)
      if (resolved) out.push(resolved)
    }
  }
  return out
}

function namespacesOf(file) {
  const src = readFileSync(file, 'utf8')
  const out = new Set()
  for (const re of NS_RES) {
    re.lastIndex = 0
    let m
    while ((m = re.exec(src))) out.add(m[1].split('.')[0])
  }
  return out
}

function closureFrom(seeds) {
  const visited = new Set()
  const stack = [...seeds]
  while (stack.length) {
    const file = stack.pop()
    if (visited.has(file) || !existsSync(file)) continue
    visited.add(file)
    for (const dep of importsOf(file)) if (!visited.has(dep)) stack.push(dep)
  }
  return visited
}

/**
 * 回傳某組進入點的「client 端需要的 namespace」（只算會進到 client bundle 的模組）。
 * server component 的 getTranslations 走 server 端 messages，不需要 provider，故排除。
 */
function clientNamespaces(entryFiles) {
  const reachable = closureFrom(entryFiles)
  const namespaces = new Set()
  for (const file of reachable) {
    if (!CLIENT_FILES.has(file)) continue
    for (const ns of namespacesOf(file)) namespaces.add(ns)
  }
  return { namespaces: [...namespaces].sort(), files: reachable.size }
}

/** 全站所有 'use client' 模組可達的檔案集合（= 會被打進 client bundle 的模組） */
function computeClientFiles() {
  const seeds = []
  for (const file of walk(WEB_SRC)) {
    const src = readFileSync(file, 'utf8')
    if (/^\s*(['"])use client\1/.test(src)) seeds.push(file)
  }
  return closureFrom(seeds)
}

const CLIENT_FILES = computeClientFiles()

function routeDirs() {
  return readdirSync(APP_LOCALE, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((name) => name !== 'api')
    .sort()
}

/** 全部 route 的 key（含沒有自己目錄的首頁） */
function routeKeys() {
  return ['home', ...routeDirs()]
}

/** 某個 route 的進入檔 */
function routeEntries(name) {
  if (name === 'home') return [join(APP_LOCALE, 'page.tsx')]
  return walk(join(APP_LOCALE, name))
}

/** 有些 route 沒有自己的 client i18n 需求（core 已涵蓋），不強制接線 */
const WIRING_EXEMPT = new Set(['admin'])

function collectAll() {
  const { namespaces: core } = clientNamespaces([join(APP_LOCALE, 'layout.tsx')])
  const routes = {}
  for (const name of routeKeys()) {
    const { namespaces } = clientNamespaces(routeEntries(name))
    routes[name] = namespaces
  }
  return { core, routes }
}

function generateFileContent() {
  const { core, routes } = collectAll()
  const fmt = (arr) => (arr.length ? `[\n${arr.map((n) => `    '${n}',`).join('\n')}\n  ]` : '[]')
  const lines = [
    '// 由 scripts/i18n/analyze-namespaces.mjs emit 產生，請勿手動編輯。',
    '// 重新產生：node scripts/i18n/analyze-namespaces.mjs emit',
    '//',
    '// CORE_NAMESPACES：root layout 直接渲染的 client 元件（navbar、footer、chat 等）所需。',
    '// ROUTE_NAMESPACES：各 route 底下 client 元件所需的 namespace（尚未含 core）。',
    '',
    `export const CORE_NAMESPACES = ${fmt(core)} as const`,
    '',
    'export const ROUTE_NAMESPACES: Record<string, string[]> = {',
  ]
  for (const [name, ns] of Object.entries(routes)) {
    lines.push(`  ${JSON.stringify(name)}: ${fmt(ns)},`)
  }
  lines.push('}', '')
  return lines.join('\n')
}

/** 檢查每個 route 都有對應的 RouteMessages route="X" 接線 */
function checkWiring() {
  const errors = []
  const { routes } = collectAll()
  const wired = new Set()
  for (const file of walk(APP_LOCALE)) {
    const src = readFileSync(file, 'utf8')
    const re = /RouteMessages\s+route=["'`]([A-Za-z0-9_-]+)["'`]/g
    let m
    while ((m = re.exec(src))) wired.add(m[1])
  }
  for (const name of Object.keys(routes)) {
    if (WIRING_EXEMPT.has(name)) continue
    if (!wired.has(name)) {
      errors.push(
        `route "${name}" 尚未接上 RouteMessages（請在 apps/web/src/app/[locale]/${name}/layout.tsx 或對應 page.tsx 包一層 <RouteMessages route="${name}">）`
      )
    }
  }
  for (const name of wired) {
    if (!(name in routes)) errors.push(`有 RouteMessages route="${name}" 找不到對應 route`)
  }
  return errors
}

const mode = process.argv[2]

if (mode === 'root') {
  const { namespaces, files } = clientNamespaces([join(APP_LOCALE, 'layout.tsx')])
  console.log(JSON.stringify({ core: namespaces, files }, null, 2))
} else if (mode === 'route') {
  const name = process.argv[3]
  const { namespaces, files } = clientNamespaces(routeEntries(name))
  console.log(JSON.stringify({ route: name, namespaces, files }, null, 2))
} else if (mode === 'all') {
  const result = {}
  for (const name of routeKeys()) {
    const { namespaces } = clientNamespaces(routeEntries(name))
    result[name] = namespaces
  }
  console.log(JSON.stringify(result, null, 2))
} else if (mode === 'emit') {
  const outPath = join(WEB_SRC, 'i18n', 'client-namespaces.ts')
  writeFileSync(outPath, generateFileContent())
  const { core, routes } = collectAll()
  console.log(`✅ 已產生 ${outPath}`)
  console.log(`   core: ${core.length} 個 namespace；routes: ${Object.keys(routes).length}`)
} else if (mode === 'verify') {
  const errors = []
  const expected = generateFileContent()
  const outPath = join(WEB_SRC, 'i18n', 'client-namespaces.ts')
  const actual = existsSync(outPath) ? readFileSync(outPath, 'utf8') : ''
  if (actual !== expected) {
    errors.push(
      'apps/web/src/i18n/client-namespaces.ts 與目前程式碼不一致，請重跑：node scripts/i18n/analyze-namespaces.mjs emit'
    )
  }
  for (const e of checkWiring()) errors.push(e)
  if (errors.length) {
    console.error('❌ namespace 分析檢查失敗')
    for (const e of errors) console.error(`   - ${e}`)
    process.exit(1)
  }
  console.log('✅ namespace 分析檢查通過（對應表最新、所有 route 都已接上 RouteMessages）')
} else {
  console.error('用法：node scripts/i18n/analyze-namespaces.mjs root|route <name>|all|emit|verify')
  process.exit(1)
}
