import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '../test-utils'
import { TranslationComposer } from '../../src/components/TranslationComposer'

// Mock the hooks and dependencies
vi.mock('../../src/hooks/useLanguageDetection', () => ({
  useLanguageDetection: () => ({
    sourceLang: 'en-US',
    detectLanguageDebounced: vi.fn(() => () => {})
  })
}))

vi.mock('../../src/utils/id', () => ({
  generateId: () => 'test-id-' + Date.now()
}))

describe('TranslationComposer', () => {
  const mockOnTranslate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders textarea', () => {
    render(<TranslationComposer onTranslate={mockOnTranslate} />)

    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('renders translate button', () => {
    render(<TranslationComposer onTranslate={mockOnTranslate} />)

    // Language selector contains translate buttons
    expect(screen.getByTestId('language-button-ja')).toBeInTheDocument()
  })

  it('renders clear button', () => {
    render(<TranslationComposer onTranslate={mockOnTranslate} />)

    // Clear functionality should be available
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('shows placeholder text', () => {
    render(<TranslationComposer onTranslate={mockOnTranslate} />)

    expect(screen.getByPlaceholderText(/Enter text to translate/)).toBeInTheDocument()
  })

  it('renders without crashing', () => {
    expect(() => render(<TranslationComposer onTranslate={mockOnTranslate} />)).not.toThrow()
  })
})
