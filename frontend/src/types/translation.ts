// Core domain types for translation functionality

export interface Message {
  id: string
  text: string
}

export interface TranslationContext {
  contextId: string | null
  output: string
  sourceLang: string
  targetLang: string
}

export interface HistoryItem {
  kind: 'initial' | 'improve'
  text: string
  at: number
  feedback?: string
}

export interface ReverseView {
  active: boolean
  forwardText: string
  preview?: string
}

export interface Language {
  code: string
  label: string
}

export interface TranslationState {
  context: TranslationContext
  history: HistoryItem[]
  loading: {
    translate: boolean
    improve: boolean
    languageDetection: boolean
  }
  loadingTarget: string | null
  error: string | null
}
