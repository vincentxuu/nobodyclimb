import { describe, expect, it, vi } from 'vitest'
import { CloudflareProvider } from '../providers/cloudflare'
import { GitHubModelsProvider } from '../providers/github'
import { OpenAIProvider } from '../providers/openai'
import { isAbortError } from '../providers/tool-stream'

// 中斷靠 onToken 丟 AbortError：streamChat 不能把它跟壞掉的 SSE 行一起吞掉

function sse(lines: string[]): ReadableStream<Uint8Array> {
  const enc = new TextEncoder()
  let i = 0
  return new ReadableStream({
    pull(c) {
      if (i >= lines.length) return c.close()
      c.enqueue(enc.encode(`${lines[i++]}\n\n`))
    },
  })
}

const openAIChunk = (content: string) =>
  `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}`

const abortOnSecondToken = () => {
  let n = 0
  return vi.fn(async () => {
    n++
    if (n === 2) throw new DOMException('The operation was aborted', 'AbortError')
  })
}

describe('streamChat 遇到 onToken 丟 AbortError', () => {
  it('CloudflareProvider：reject 且不再讀後續 chunk', async () => {
    // cloudflare 有 ---SUGGESTIONS--- 滑動視窗，每個 token 要長過視窗才會即時推送
    const long = (ch: string) => ch.repeat(40)
    const stream = sse([
      openAIChunk(long('一')),
      openAIChunk(long('二')),
      openAIChunk(long('三')),
      'data: [DONE]',
    ])
    const ai = { run: vi.fn(async () => stream) }
    const provider = new CloudflareProvider(ai as never, '@cf/zai-org/glm-4.7-flash')
    const onToken = abortOnSecondToken()
    await expect(
      provider.streamChat([{ role: 'user', content: 'hi' }], { onToken })
    ).rejects.toSatisfy(isAbortError)
    expect(onToken).toHaveBeenCalledTimes(2)
  })

  it('OpenAIProvider：reject，且 fetch 收到 signal', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(sse([openAIChunk('一'), openAIChunk('二'), openAIChunk('三'), 'data: [DONE]']))
      )
    try {
      const provider = new OpenAIProvider('key', 'gpt')
      const controller = new AbortController()
      await expect(
        provider.streamChat([{ role: 'user', content: 'hi' }], {
          onToken: abortOnSecondToken(),
          signal: controller.signal,
        })
      ).rejects.toSatisfy(isAbortError)
      expect(fetchSpy.mock.calls[0][1]).toMatchObject({ signal: controller.signal })
    } finally {
      fetchSpy.mockRestore()
    }
  })

  it('GitHubModelsProvider：reject', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(sse([openAIChunk('一'), openAIChunk('二'), 'data: [DONE]'])))
    try {
      const provider = new GitHubModelsProvider('token', 'gpt')
      await expect(
        provider.streamChat([{ role: 'user', content: 'hi' }], { onToken: abortOnSecondToken() })
      ).rejects.toSatisfy(isAbortError)
    } finally {
      fetchSpy.mockRestore()
    }
  })

  it('CloudflareProvider：signal abort 後 read 結束並丟 AbortError', async () => {
    const controller = new AbortController()
    const never = new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(new TextEncoder().encode(`${openAIChunk('半')}\n\n`))
      },
    })
    const ai = { run: vi.fn(async () => never) }
    const provider = new CloudflareProvider(ai as never, '@cf/zai-org/glm-4.7-flash')
    const pending = provider.streamChat([{ role: 'user', content: 'hi' }], {
      onToken: async () => {},
      signal: controller.signal,
    })
    controller.abort()
    await expect(pending).rejects.toSatisfy(isAbortError)
  })

  it('isAbortError 只看 name，不依賴 instanceof Error', () => {
    expect(isAbortError({ name: 'AbortError' })).toBe(true)
    expect(isAbortError(new Error('AbortError'))).toBe(false)
    expect(isAbortError(null)).toBe(false)
  })
})
