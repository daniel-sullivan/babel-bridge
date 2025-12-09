import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { TranslationProvider, useTranslationContext, translationReducer } from '../../src/context/TranslationContext'
import type { TranslationState } from '../../src/types/translation'

const createWrapper = ({ children }: { children: React.ReactNode }) => (
  <TranslationProvider>{children}</TranslationProvider>
)

describe('TranslationContext', () => {
  describe('useTranslationContext', () => {
    it('provides initial state', () => {
      const { result } = renderHook(() => useTranslationContext(), { wrapper: createWrapper })

      const { state } = result.current
      expect(state.context.targetLang).toBe('')
      expect(state.context.contextId).toBeNull()
      expect(state.history).toEqual([])
      expect(state.loading).toEqual({
        translate: false,
        improve: false,
        languageDetection: false
      })
      expect(state.loadingTarget).toBeNull()
      expect(state.error).toBeNull()
    })

    it('provides dispatch function', () => {
      const { result } = renderHook(() => useTranslationContext(), { wrapper: createWrapper })

      expect(typeof result.current.dispatch).toBe('function')
    })

    it('updates state when actions are dispatched', () => {
      const { result } = renderHook(() => useTranslationContext(), { wrapper: createWrapper })

      act(() => {
        result.current.dispatch({
          type: 'SET_LOADING',
          payload: { type: 'translate', value: true }
        })
      })

      expect(result.current.state.loading.translate).toBe(true)

      act(() => {
        result.current.dispatch({
          type: 'SET_LOADING_TARGET',
          payload: 'es-ES'
        })
      })

      expect(result.current.state.loadingTarget).toBe('es-ES')
    })
  })

  describe('translationReducer', () => {
    let initialState: TranslationState

    beforeEach(() => {
      initialState = {
        context: {
          contextId: null,
          output: '',
          sourceLang: '',
          targetLang: 'ja-JP'
        },
        history: [],
        loading: {
          translate: false,
          improve: false,
          languageDetection: false
        },
        loadingTarget: null,
        error: null
      }
    })

    it('handles SET_LOADING action', () => {
      const action = {
        type: 'SET_LOADING' as const,
        payload: { type: 'translate' as const, value: true }
      }

      const newState = translationReducer(initialState, action)

      expect(newState.loading.translate).toBe(true)
      expect(newState.loading.improve).toBe(false)
    })

    it('handles SET_LOADING_TARGET action', () => {
      const action = {
        type: 'SET_LOADING_TARGET' as const,
        payload: 'es-ES'
      }

      const newState = translationReducer(initialState, action)

      expect(newState.loadingTarget).toBe('es-ES')
    })

    it('handles SET_ERROR action', () => {
      const action = {
        type: 'SET_ERROR' as const,
        payload: 'Translation failed'
      }

      const newState = translationReducer(initialState, action)

      expect(newState.error).toBe('Translation failed')
    })

    it('handles SET_TRANSLATION_CONTEXT action', () => {
      const newContext = {
        contextId: 'ctx-123',
        output: 'Hola',
        sourceLang: 'en-US',
        targetLang: 'es-ES'
      }

      const action = {
        type: 'SET_TRANSLATION_CONTEXT' as const,
        payload: newContext
      }

      const newState = translationReducer(initialState, action)

      expect(newState.context).toEqual(newContext)
    })

    it('handles SET_OUTPUT action', () => {
      const action = {
        type: 'SET_OUTPUT' as const,
        payload: 'Hello World'
      }

      const newState = translationReducer(initialState, action)

      expect(newState.context.output).toBe('Hello World')
    })

    it('handles ADD_HISTORY_ITEM action', () => {
      const historyItem = {
        kind: 'initial' as const,
        text: 'Hello',
        at: Date.now()
      }

      const action = {
        type: 'ADD_HISTORY_ITEM' as const,
        payload: historyItem
      }

      const newState = translationReducer(initialState, action)

      expect(newState.history).toHaveLength(1)
      expect(newState.history[0]).toEqual(historyItem)
    })

    it('handles RESET_HISTORY action', () => {
      const stateWithHistory = {
        ...initialState,
        history: [
          { kind: 'initial' as const, text: 'Hello', at: Date.now() },
          { kind: 'improve' as const, text: 'Hi', at: Date.now() }
        ]
      }

      const action = {
        type: 'RESET_HISTORY' as const
      }

      const newState = translationReducer(stateWithHistory, action)

      expect(newState.history).toEqual([])
    })

    it('returns current state for unknown actions', () => {
      const action = {
        type: 'UNKNOWN_ACTION' as any
      }

      const newState = translationReducer(initialState, action)

      expect(newState).toBe(initialState)
    })
  })
})
