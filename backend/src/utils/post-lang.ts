import { z } from 'zod'

/**
 * 文章語系篩選
 *
 * posts.lang 為 NULL 代表未標語系（使用者自行發表），所有語系都顯示；
 * 有標語系的三語文章只在對應語系出現。
 */
export type PostLang = 'zh' | 'en' | 'ja'

/** query 參數：zh/en/ja 篩選該語系，all 不篩選；未帶時視為 zh。 */
export const postLangQuerySchema = z.object({
  lang: z.enum(['zh', 'en', 'ja', 'all']).optional(),
})

/**
 * 未帶 lang 時視為 zh，讓尚未傳語系的舊版 client 不會看到其他語言的文章。
 * 回傳 undefined 表示不篩選。
 */
export function resolvePostLang(lang: PostLang | 'all' | undefined): PostLang | undefined {
  return lang === 'all' ? undefined : (lang ?? 'zh')
}

/** WHERE 條件片段，需綁定一個語系參數。alias 為 posts 的別名，沒有別名時傳空字串。 */
export function postLangClause(alias = 'p'): string {
  const column = alias ? `${alias}.lang` : 'lang'
  return `(${column} IS NULL OR ${column} = ?)`
}
