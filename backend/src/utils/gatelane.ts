import type { Env } from '../types'

let initialized = false
let captureImpl: ((input: unknown, call: () => Promise<unknown>) => Promise<unknown>) | null = null

export function initGatelane(env: Env): void {
  if (initialized) return
  initialized = true
  const endpoint = (env as unknown as Record<string, string>).GATELANE_ENDPOINT
  const token = (env as unknown as Record<string, string>).GATELANE_CAPTURE_TOKEN
  if (!endpoint || !token) return

  import('@lanefoundry/gatelane-sdk/storage').then(({ setStorage }) =>
    import('@lanefoundry/gatelane-sdk/storage-http').then(({ HttpStorage }) =>
      setStorage(new HttpStorage({ endpoint, token }))
    )
  ).catch(() => {})
}

export async function capture<T>(
  input: { prompt: Array<{ role: string; content: string }>; model?: string; metadata?: Record<string, unknown> },
  call: () => Promise<T>,
): Promise<T> {
  if (!captureImpl) {
    try {
      const mod = await import('@lanefoundry/gatelane-sdk/capture')
      captureImpl = mod.capture as unknown as typeof captureImpl
    } catch {
      return call()
    }
  }
  return captureImpl!(input, call) as Promise<T>
}
