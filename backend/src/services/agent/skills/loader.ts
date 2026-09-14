import type { SkillContent } from './types'

export async function loadSkillContent(
  storage: R2Bucket,
  skillName: string
): Promise<SkillContent | null> {
  const key = `skills/${skillName}/SKILL.md`
  const obj = await storage.get(key)
  if (!obj) return null

  const text = await obj.text()
  return parseSkillMd(text)
}

export function parseSkillMd(raw: string): SkillContent {
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!fmMatch) {
    return { frontmatter: {}, body: raw }
  }

  const frontmatter: Record<string, unknown> = {}
  let currentKey: string | null = null
  let currentList: string[] | null = null

  for (const line of fmMatch[1].split('\n')) {
    const listItem = line.match(/^\s+-\s+(.+)/)
    if (listItem && currentKey) {
      if (!currentList) currentList = []
      currentList.push(listItem[1].trim())
      frontmatter[currentKey] = currentList
      continue
    }

    if (currentList) {
      currentList = null
      currentKey = null
    }

    const kv = line.match(/^(\w[\w-]*)\s*:\s*(.*)/)
    if (kv) {
      currentKey = kv[1]
      const val = kv[2].trim()
      if (val === '' || val === '|') {
        // list or multiline follows
      } else if (val === 'true') frontmatter[currentKey] = true
      else if (val === 'false') frontmatter[currentKey] = false
      else if (/^\d+$/.test(val)) frontmatter[currentKey] = parseInt(val, 10)
      else frontmatter[currentKey] = val.replace(/^["']|["']$/g, '')
    }
  }

  return { frontmatter, body: fmMatch[2].trim() }
}

export function serializeSkillMd(frontmatter: Record<string, unknown>, body: string): string {
  const lines: string[] = ['---']
  for (const [key, value] of Object.entries(frontmatter)) {
    if (Array.isArray(value)) {
      lines.push(`${key}:`)
      for (const item of value) {
        lines.push(`  - ${item}`)
      }
    } else if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      lines.push(`${key}: ${value}`)
    }
  }
  lines.push('---')
  lines.push('')
  lines.push(body)
  return lines.join('\n')
}

export async function saveSkillContent(
  storage: R2Bucket,
  skillName: string,
  content: string
): Promise<void> {
  const key = `skills/${skillName}/SKILL.md`
  await storage.put(key, content, {
    httpMetadata: { contentType: 'text/markdown' },
  })
}
