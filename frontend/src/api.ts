export type StartRequest = { source: string; lang: string }
export type StartResponse = { contextId: string; result: string; sourceLang: string }
export type ImproveRequest = { contextId: string; feedback: string }
export type ImproveResponse = { result: string }
export type PreviewRequest = { source: string; lang: string }
export type PreviewResponse = { result: string }
export type IdentifyRequest = { source: string }
export type IdentifyResponse = { lang: string }

let sessionPromise: Promise<void> | null = null

export function __resetSessionCache() {
  sessionPromise = null
}

async function ensureSession(): Promise<void> {
  if (!sessionPromise) {
    sessionPromise = fetch('/session', { credentials: 'include' })
      .then(() => undefined)
      .catch(() => undefined)
  }
  return sessionPromise
}

async function json<T>(res: Response): Promise<T> {
  const text = await res.text()
  try {
    return JSON.parse(text) as T
  } catch {
    // @ts-ignore
    return text as T
  }
}

// Centralized POST helper for API calls with session
async function apiPost<T>(url: string, body: any): Promise<T> {
  await ensureSession()

  const doFetch = async (): Promise<Response> =>
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(body),
    })

  let res = await doFetch()

  // If session is invalid, refresh once and retry
  if (res.status === 401) {
    __resetSessionCache()
    await ensureSession()
    res = await doFetch()
  }

  if (!res.ok) {
    const data = await json<any>(res)
    throw new Error(data?.error || `${url} failed: ${res.status}`)
  }
  return json<T>(res)
}

export async function startTranslation(req: StartRequest): Promise<StartResponse> {
  return apiPost<StartResponse>('/api/translate/start', req)
}

export async function improveTranslation(req: ImproveRequest): Promise<ImproveResponse> {
  return apiPost<ImproveResponse>('/api/translate/improve', req)
}

export async function previewTranslation(req: PreviewRequest): Promise<PreviewResponse> {
  return apiPost<PreviewResponse>('/api/translate/preview', req)
}

export async function identifyLanguage(req: IdentifyRequest): Promise<IdentifyResponse> {
  return apiPost<IdentifyResponse>('/api/translate/identify', req)
}
