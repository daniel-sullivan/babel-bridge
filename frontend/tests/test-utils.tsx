import React, { ReactElement, useReducer } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { vi } from 'vitest'
import { TranslationProvider, TranslationContext } from '../src/context/TranslationContext'
import { translationReducer } from '../src/context/TranslationContext'
import type { TranslationState } from '../src/types/translation'

// Default test state
const defaultTestState: TranslationState = {
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

// Test provider that can accept initial state
const TestTranslationProvider = ({ children, initialState }: {
  children: React.ReactNode,
  initialState?: Partial<TranslationState>
}) => {
  const mergedState = { ...defaultTestState, ...initialState }
  const [state, dispatch] = useReducer(translationReducer, mergedState)

  return (
    <TranslationContext.Provider value={{ state, dispatch }}>
      {children}
    </TranslationContext.Provider>
  )
}

// Simple wrapper with just the translation context
const createTestWrapper = (initialState?: Partial<TranslationState>) => {
  const TestWrapper = ({ children }: { children: React.ReactNode }) => {
    return (
      <TestTranslationProvider initialState={initialState}>
        {children}
      </TestTranslationProvider>
    )
  }
  return TestWrapper
}

// Mock modal state for components that need it
const mockModalState = {
  improveModalOpen: false,
  settingsModalOpen: false,
  aboutModalOpen: false,
  setImproveModalOpen: vi.fn(),
  setSettingsModalOpen: vi.fn(),
  setAboutModalOpen: vi.fn()
}

// Custom render function that includes providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: createTestWrapper(), ...options })

// Helper to create mock context for components that need it
export const createMockTranslationContext = () => ({
  state: defaultTestState,
  dispatch: vi.fn()
})

// re-export everything
export * from '@testing-library/react'

// override render method
export { customRender as render, createTestWrapper, mockModalState }
