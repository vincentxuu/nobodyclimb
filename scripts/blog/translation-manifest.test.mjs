import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { buildTranslationManifest, checkTranslationManifest } from './translation-manifest.mjs'

const ids = { zh: 'a'.repeat(32), en: 'b'.repeat(32), ja: 'c'.repeat(32) }
test('完整三語組才納入 manifest，對照變更使產生物失效', () => {
  const root = mkdtempSync(join(tmpdir(), 'blog-translations-'))
  const directory = join(root, 'backend/content/blog')
  const output = join(root, 'apps/web/src/lib/data/blog-translations.json')
  mkdirSync(directory, { recursive: true })
  mkdirSync(join(root, 'apps/web/src/lib/data'), { recursive: true })
  try {
    for (const lang of ['zh', 'en', 'ja']) {
      writeFileSync(
        join(directory, `${ids[lang]}.md`),
        `---\nid: ${ids[lang]}\nlang: ${lang}\nstatus: published\ntranslation_group: ${ids.zh}\ntranslations:\n  zh: ${ids.zh}\n  en: ${ids.en}\n  ja: ${ids.ja}\n---\n## Body\n`
      )
    }
    const manifest = buildTranslationManifest(root)
    assert.equal(Object.keys(manifest.articles).length, 3)
    assert.deepEqual(manifest.articles[ids.en], { lang: 'en', translations: ids })
    writeFileSync(output, `${JSON.stringify(manifest, null, 2)}\n`)
    checkTranslationManifest(root)
    writeFileSync(output, '{}\n')
    assert.throws(() => checkTranslationManifest(root), /過期/)
    rmSync(join(directory, `${ids.ja}.md`))
    assert.throws(() => buildTranslationManifest(root), /不完整/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
