'use client'

import { useState } from 'react'

// =============================================
// Guardrail 關鍵字清單輸入（Enter 新增、支援多行貼上）
// =============================================

export function GuardrailTagInput({
  label,
  desc,
  configKey,
  tags,
  onChange,
}: {
  label: string
  desc: string
  configKey: string
  tags: string[]
  onChange: (_tags: string[]) => void
}) {
  const [input, setInput] = useState('')

  const addTag = (text: string) => {
    const trimmed = text.trim()
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed])
    }
  }

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag(input)
      setInput('')
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text')
    if (text.includes('\n')) {
      e.preventDefault()
      const lines = text
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
      const newTags = [...tags]
      for (const line of lines) {
        if (!newTags.includes(line)) newTags.push(line)
      }
      onChange(newTags)
      setInput('')
    }
  }

  return (
    <div className="rounded-xl border border-wb-20 bg-white overflow-hidden">
      <div className="border-b border-wb-10 px-5 py-4">
        <h2 className="text-sm font-semibold text-wb-100">{label}</h2>
        <p className="mt-0.5 text-xs text-wb-50">{desc}</p>
      </div>
      <div className="px-5 py-4 space-y-3">
        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag, i) => (
              <span
                key={`${tag}-${i}`}
                className="inline-flex items-center gap-1 rounded-md bg-wb-05 border border-wb-20 px-2 py-1 font-mono text-xs text-wb-80"
              >
                {tag}
                <button
                  onClick={() => removeTag(i)}
                  className="ml-0.5 text-wb-40 hover:text-red-500 transition-colors"
                  aria-label={`刪除 ${tag}`}
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Input */}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="輸入關鍵字後按 Enter 新增，支援多行貼上"
          className="w-full rounded-lg border border-wb-20 bg-white px-3 py-2 text-sm text-wb-100 placeholder:text-wb-40 outline-none focus:border-wb-50 focus:ring-1 focus:ring-wb-50 transition-colors font-mono"
        />

        <div className="flex items-center gap-3">
          <p className="font-mono text-[10px] text-wb-30 bg-wb-5 rounded px-1 py-0.5 inline-block">
            {configKey}
          </p>
          <p className="text-xs text-wb-40">
            目前共 <span className="font-semibold text-wb-80">{tags.length}</span> 個
          </p>
        </div>
      </div>
    </div>
  )
}
