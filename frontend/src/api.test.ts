import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { __resetSessionCache, startTranslation } from './api'

declare const global: typeof globalThis

const okSession = () => new Response('', { status: 200 })
const okStart = () =>
  new Response(JSON.stringify({ contextId: 'ctx-1', result: 'hola', sourceLang: 'en' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('fetch', vi.fn())
  __resetSessionCache()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

test('startTranslation includes session fetch', async () => {
  const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>
  fetchMock.mockResolvedValueOnce(okSession())
  fetchMock.mockResolvedValueOnce(okStart())

  await startTranslation({ source: 'Hello', lang: 'es' })

  expect(fetchMock).toHaveBeenNthCalledWith(1, '/session', { credentials: 'include' })
  const [, options] = fetchMock.mock.calls[1]
  expect(options).toMatchObject({
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  })
})

test('startTranslation retries once on 401 after refreshing session', async () => {
  const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>
  const refreshedStart = () =>
    new Response(JSON.stringify({ contextId: 'ctx-2', result: 'salut', sourceLang: 'en' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  // session, first 401, refresh session, second start success
  fetchMock
    .mockResolvedValueOnce(okSession())
    .mockResolvedValueOnce(new Response('', { status: 401 }))
    .mockResolvedValueOnce(okSession())
    .mockResolvedValueOnce(refreshedStart())

  await startTranslation({ source: 'Hello', lang: 'fr' })

  expect(fetchMock).toHaveBeenCalledTimes(4)
  const retryOptions = fetchMock.mock.calls[3][1] as RequestInit
  expect(retryOptions?.headers).toMatchObject({
    'Content-Type': 'application/json',
  })
})
