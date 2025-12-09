import React, { createContext, useContext, useReducer, ReactNode } from 'react'
import { TranslationState, TranslationContext as TContext, HistoryItem } from '../types/translation'

// Define action types
export type TranslationAction =
  | { type: 'SET_LOADING'; payload: { type: keyof TranslationState['loading']; value: boolean } }
  | { type: 'SET_LOADING_TARGET'; payload: string | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_TRANSLATION_CONTEXT'; payload: TContext }
  | { type: 'SET_OUTPUT'; payload: string }
  | { type: 'ADD_HISTORY_ITEM'; payload: HistoryItem }
  | { type: 'RESET_HISTORY' }

// Initial state
const initialState: TranslationState = {
  context: {
    contextId: null,
    output: '',
    sourceLang: '',
    targetLang: ''
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

// Reducer
export function translationReducer(state: TranslationState, action: TranslationAction): TranslationState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.type]: action.payload.value
        }
      }
    case 'SET_LOADING_TARGET':
      return { ...state, loadingTarget: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'SET_TRANSLATION_CONTEXT':
      return { ...state, context: action.payload }
    case 'SET_OUTPUT':
      return {
        ...state,
        context: { ...state.context, output: action.payload }
      }
    case 'ADD_HISTORY_ITEM':
      return {
        ...state,
        history: [...state.history, action.payload]
      }
    case 'RESET_HISTORY':
      return { ...state, history: [] }
    default:
      return state
  }
}

// Context
interface TranslationContextValue {
  state: TranslationState
  dispatch: React.Dispatch<TranslationAction>
}

export const TranslationContext = createContext<TranslationContextValue | null>(null)

// Provider component
interface TranslationProviderProps {
  children: ReactNode
}

export function TranslationProvider({ children }: TranslationProviderProps) {
  const [state, dispatch] = useReducer(translationReducer, initialState)

  return (
    <TranslationContext.Provider value={{ state, dispatch }}>
      {children}
    </TranslationContext.Provider>
  )
}

// Hook to use translation context
export function useTranslationContext() {
  const context = useContext(TranslationContext)
  if (!context) {
    throw new Error('useTranslationContext must be used within a TranslationProvider')
  }
  return context
}
