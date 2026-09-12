import { capture, type CaptureInput } from '@lanefoundry/gatelane-sdk/capture'
import { setStorage } from '@lanefoundry/gatelane-sdk/storage'
import { HttpStorage } from '@lanefoundry/gatelane-sdk/storage-http'
import type { Env } from '../types'

let initialized = false

export function initGatelane(env: Env): void {
  if (initialized) return
  const endpoint = (env as unknown as Record<string, string>).GATELANE_ENDPOINT
  const token = (env as unknown as Record<string, string>).GATELANE_CAPTURE_TOKEN
  if (endpoint && token) {
    setStorage(new HttpStorage({ endpoint, token }))
  }
  initialized = true
}

export { capture, type CaptureInput }
