import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTranslation } from '../../src/hooks/useTranslation'
import { createTestWrapper } from '../test-utils'
import * as api from '../../src/api'

// Mock the API module
vi.mock('../../src/api', () => ({
  startTranslation: vi.fn(),
  improveTranslation: vi.fn(),
  previewTranslation: vi.fn(),
}))

const mockApi = vi.mocked(api)

describe('useTranslation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('translate function', () => {
    it('should translate text successfully', async () => {
      const mockResponse = {
        contextId: 'ctx-123',
        result: 'Hola',
        sourceLang: 'en-US'
      }
      mockApi.startTranslation.mockResolvedValueOnce(mockResponse)

      const { result } = renderHook(() => useTranslation(), { wrapper: createTestWrapper() })

      await act(async () => {
        const translationResult = await result.current.translate('Hello', 'es-ES')
        expect(translationResult).toBe('Hola')
      })

      expect(mockApi.startTranslation).toHaveBeenCalledWith({
        source: 'Hello',
        lang: 'es-ES'
      })
      expect(result.current.context.contextId).toBe('ctx-123')
      expect(result.current.context.output).toBe('Hola')
      expect(result.current.history).toHaveLength(1)
    })

    it('should handle empty source text', async () => {
      const { result } = renderHook(() => useTranslation(), { wrapper: createTestWrapper() })

      await act(async () => {
        await result.current.translate('  ', 'es-ES')
      })

      expect(mockApi.startTranslation).not.toHaveBeenCalled()
      expect(result.current.error).toBe('Please enter a message to translate')
    })

    it('should handle API errors', async () => {
      const error = new Error('Translation failed')
      mockApi.startTranslation.mockRejectedValueOnce(error)

      const { result } = renderHook(() => useTranslation(), { wrapper: createTestWrapper() })

      await act(async () => {
        try {
          await result.current.translate('Hello', 'es-ES')
        } catch (e) {
          expect(e).toBe(error)
        }
      })

      expect(result.current.error).toBe('Translation failed')
    })

    it('should manage loading states correctly', async () => {
      let resolvePromise: (value: any) => void
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })
      mockApi.startTranslation.mockReturnValueOnce(promise)

      const { result } = renderHook(() => useTranslation(), { wrapper: createTestWrapper() })

      // Start translation
      act(() => {
        result.current.translate('Hello', 'es-ES')
      })

      // Check loading state is true
      expect(result.current.loading.translate).toBe(true)
      expect(result.current.loadingTarget).toBe('es-ES')

      // Resolve the promise
      await act(async () => {
        resolvePromise!({
          contextId: 'ctx-123',
          result: 'Hola',
          sourceLang: 'en-US'
        })
        await promise
      })

      // Check loading state is false
      expect(result.current.loading.translate).toBe(false)
      expect(result.current.loadingTarget).toBeNull()
    })
  })

  describe('improve function', () => {
    it('should improve translation successfully', async () => {
      const mockResponse = { result: 'Hola mejorado' }
      mockApi.improveTranslation.mockResolvedValueOnce(mockResponse)

      const { result } = renderHook(() => useTranslation(), { wrapper: createTestWrapper({
        context: {
          contextId: 'ctx-123',
          output: 'Hola',
          sourceLang: 'en-US',
          targetLang: 'es-ES'
        }
      }) })

      await act(async () => {
        const improveResult = await result.current.improve('make it more formal')
        expect(improveResult).toBe('Hola mejorado')
      })

      expect(mockApi.improveTranslation).toHaveBeenCalledWith({
        contextId: 'ctx-123',
        feedback: 'make it more formal'
      })
      expect(result.current.context.output).toBe('Hola mejorado')
      expect(result.current.history).toHaveLength(1)
    })

    it('should throw error when no context available', async () => {
      const { result } = renderHook(() => useTranslation(), { wrapper: createTestWrapper() })

      await act(async () => {
        try {
          await result.current.improve('make it formal')
          expect.fail('Should have thrown error')
        } catch (error) {
          expect(error).toEqual(new Error('No active translation context'))
        }
      })
    })

    it('should handle API errors during improvement', async () => {
      const error = new Error('Improvement failed')
      mockApi.improveTranslation.mockRejectedValueOnce(error)

      const { result } = renderHook(() => useTranslation(), { wrapper: createTestWrapper({
        context: {
          contextId: 'ctx-123',
          output: 'Hola',
          sourceLang: 'en-US',
          targetLang: 'es-ES'
        }
      }) })

      await act(async () => {
        try {
          await result.current.improve('make it formal')
        } catch (e) {
          expect(e).toBe(error)
        }
      })

      expect(result.current.error).toBe('Improvement failed')
    })
  })

  describe('preview function', () => {
    it('should preview translation successfully', async () => {
      const mockResponse = { result: 'Hola preview' }
      mockApi.previewTranslation.mockResolvedValueOnce(mockResponse)

      const { result } = renderHook(() => useTranslation(), { wrapper: createTestWrapper() })

      await act(async () => {
        const previewResult = await result.current.preview('Hello', 'es-ES')
        expect(previewResult).toBe('Hola preview')
      })

      expect(mockApi.previewTranslation).toHaveBeenCalledWith({
        source: 'Hello',
        lang: 'es-ES'
      })
    })

    it('should handle preview errors', async () => {
      const error = new Error('Preview failed')
      mockApi.previewTranslation.mockRejectedValueOnce(error)
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { result } = renderHook(() => useTranslation(), { wrapper: createTestWrapper() })

      await act(async () => {
        try {
          await result.current.preview('Hello', 'es-ES')
        } catch (e) {
          expect(e).toBe(error)
        }
      })

      expect(consoleSpy).toHaveBeenCalledWith('Preview failed:', error)
      consoleSpy.mockRestore()
    })
  })

  describe('hook state management', () => {
    it('should expose correct state properties', () => {
      const initialState = {
        context: {
          contextId: 'ctx-123',
          output: 'Test output',
          sourceLang: 'en-US',
          targetLang: 'es-ES'
        },
        history: [{ kind: 'initial' as const, text: 'Test', at: Date.now() }],
        loading: {
          translate: false,
          improve: true,
          languageDetection: false
        },
        loadingTarget: 'fr-FR',
        error: 'Test error'
      }

      const { result } = renderHook(() => useTranslation(), {
        wrapper: createTestWrapper(initialState)
      })

      expect(result.current.context).toEqual(initialState.context)
      expect(result.current.history).toEqual(initialState.history)
      expect(result.current.loading).toEqual(initialState.loading)
      expect(result.current.loadingTarget).toBe(initialState.loadingTarget)
      expect(result.current.error).toBe(initialState.error)
    })
  })
})
