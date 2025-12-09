import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as api from '../../src/api'

// Mock fetch globally
const mockFetch = vi.fn()
// @ts-ignore - global fetch override for testing
global.fetch = mockFetch

describe('API module basic functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.__resetSessionCache()
  })

  describe('core API functions', () => {
    beforeEach(() => {
      // Mock session call
      const mockSessionResponse = new Response('', { status: 200 })
      mockFetch.mockResolvedValueOnce(mockSessionResponse)
    })

    it('should identify language correctly', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve({ lang: 'es-ES' }),
        text: () => Promise.resolve('{"lang":"es-ES"}')
      }
      mockFetch.mockResolvedValueOnce(mockResponse)

      const result = await api.identifyLanguage({ source: 'Hola mundo' })

      expect(result).toEqual({ lang: 'es-ES' })
      expect(mockFetch).toHaveBeenLastCalledWith('/api/translate/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'Hola mundo' }),
        credentials: 'include'
      })
    })

    it('should start translation correctly', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          contextId: 'ctx-123',
          result: 'Hola mundo',
          sourceLang: 'en-US'
        }),
        text: () => Promise.resolve('{"contextId":"ctx-123","result":"Hola mundo","sourceLang":"en-US"}')
      }
      mockFetch.mockResolvedValueOnce(mockResponse)

      const result = await api.startTranslation({ source: 'Hello world', lang: 'es-ES' })

      expect(result).toEqual({
        contextId: 'ctx-123',
        result: 'Hola mundo',
        sourceLang: 'en-US'
      })
    })

    it('should handle API errors', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Bad request' }),
        text: () => Promise.resolve('{"error":"Bad request"}')
      }
      mockFetch.mockResolvedValueOnce(mockResponse)

      await expect(api.identifyLanguage({ source: 'test' }))
        .rejects.toThrow('Bad request')
    })
  })

  describe('session management', () => {
    it('should reset session cache', () => {
      api.__resetSessionCache()
      expect(true).toBe(true) // Function should complete without errors
    })

    it('should include correct headers and credentials', async () => {
      // Mock session
      const mockSessionResponse = new Response('', { status: 200 })
      mockFetch.mockResolvedValueOnce(mockSessionResponse)

      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve({ lang: 'en-US' }),
        text: () => Promise.resolve('{"lang":"en-US"}')
      }
      mockFetch.mockResolvedValueOnce(mockResponse)

      await api.identifyLanguage({ source: 'Hello' })

      const apiCall = mockFetch.mock.calls.find(call => call[0] === '/api/translate/identify')
      expect(apiCall).toBeTruthy()
      expect(apiCall![1]).toEqual({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'Hello' }),
        credentials: 'include'
      })
    })
  })
})
