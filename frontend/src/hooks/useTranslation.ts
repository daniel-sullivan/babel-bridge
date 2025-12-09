import { useCallback } from 'react'
import { useTranslationContext } from '../context/TranslationContext'
import {
  startTranslation,
  improveTranslation,
  previewTranslation,
  type StartRequest,
  type ImproveRequest,
  type PreviewRequest
} from '../api'
import { HistoryItem } from '../types/translation'

export function useTranslation() {
  const { state, dispatch } = useTranslationContext()

  const translate = useCallback(async (source: string, targetLang: string) => {
    if (!source.trim()) {
      dispatch({ type: 'SET_ERROR', payload: 'Please enter a message to translate' })
      return
    }

    dispatch({ type: 'SET_LOADING', payload: { type: 'translate', value: true } })
    dispatch({ type: 'SET_LOADING_TARGET', payload: targetLang })
    dispatch({ type: 'SET_ERROR', payload: null })

    try {
      const request: StartRequest = { source: source.trim(), lang: targetLang }
      const response = await startTranslation(request)

      dispatch({
        type: 'SET_TRANSLATION_CONTEXT',
        payload: {
          contextId: response.contextId,
          output: response.result,
          sourceLang: response.sourceLang || '',
          targetLang
        }
      })

      const historyItem: HistoryItem = {
        kind: 'initial',
        text: response.result,
        at: Date.now()
      }

      dispatch({ type: 'RESET_HISTORY' })
      dispatch({ type: 'ADD_HISTORY_ITEM', payload: historyItem })

      return response.result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Translation failed'
      dispatch({ type: 'SET_ERROR', payload: message })
      throw err
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { type: 'translate', value: false } })
      dispatch({ type: 'SET_LOADING_TARGET', payload: null })
    }
  }, [dispatch])

  const improve = useCallback(async (feedback: string) => {
    if (!state.context.contextId) {
      throw new Error('No active translation context')
    }

    dispatch({ type: 'SET_LOADING', payload: { type: 'improve', value: true } })

    try {
      const request: ImproveRequest = {
        contextId: state.context.contextId,
        feedback: feedback.trim()
      }
      const response = await improveTranslation(request)

      dispatch({ type: 'SET_OUTPUT', payload: response.result })

      const historyItem: HistoryItem = {
        kind: 'improve',
        feedback: feedback.trim(),
        text: response.result,
        at: Date.now()
      }

      dispatch({ type: 'ADD_HISTORY_ITEM', payload: historyItem })

      return response.result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Improvement failed'
      dispatch({ type: 'SET_ERROR', payload: message })
      throw err
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { type: 'improve', value: false } })
    }
  }, [state.context.contextId, dispatch])

  const preview = useCallback(async (source: string, targetLang: string) => {
    try {
      const request: PreviewRequest = { source, lang: targetLang }
      const response = await previewTranslation(request)
      return response.result
    } catch (err) {
      console.error('Preview failed:', err)
      throw err
    }
  }, [])

  return {
    translate,
    improve,
    preview,
    context: state.context,
    history: state.history,
    loading: state.loading,
    loadingTarget: state.loadingTarget,
    error: state.error
  }
}
