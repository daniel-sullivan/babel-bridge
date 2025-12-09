import { useState, useEffect, useCallback } from 'react'
import { useTranslationContext } from '../context/TranslationContext'
import { identifyLanguage } from '../api'

const LANGUAGE_DETECTION_DELAY = 1000 // ms

export function useLanguageDetection() {
  const { dispatch } = useTranslationContext()
  const [sourceLang, setSourceLang] = useState<string>('')

  const detectLanguage = useCallback(async (text: string, currentTargetLang?: string) => {
    if (!text.trim()) {
      setSourceLang('')
      dispatch({ type: 'SET_LOADING', payload: { type: 'languageDetection', value: false } })
      return
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: { type: 'languageDetection', value: true } })
      const response = await identifyLanguage({ source: text.trim() })
      setSourceLang(response.lang)

      // Return detected language for potential auto-switching logic
      return response.lang
    } catch (err) {
      console.error('Language identification failed:', err)
      setSourceLang('')
      return null
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { type: 'languageDetection', value: false } })
    }
  }, [dispatch])

  const detectLanguageDebounced = useCallback((text: string, currentTargetLang?: string) => {
    const timeoutId = setTimeout(() => {
      detectLanguage(text, currentTargetLang)
    }, LANGUAGE_DETECTION_DELAY)

    return () => clearTimeout(timeoutId)
  }, [detectLanguage])

  // Clear source language when text is empty
  useEffect(() => {
    return () => {
      setSourceLang('')
      dispatch({ type: 'SET_LOADING', payload: { type: 'languageDetection', value: false } })
    }
  }, [dispatch])

  return {
    sourceLang,
    detectLanguageDebounced,
    detectLanguage
  }
}
