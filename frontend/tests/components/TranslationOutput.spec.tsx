import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '../test-utils'
import { TranslationOutput } from '../../src/components/TranslationOutput'

// Mock the hooks using factory functions to avoid hoisting issues
vi.mock('../../src/hooks/useTranslation', () => ({
  useTranslation: vi.fn()
}))

describe('TranslationOutput', () => {
  beforeEach(async () => {
    const { useTranslation } = await import('../../src/hooks/useTranslation')

    vi.mocked(useTranslation).mockReturnValue({
      context: {
        contextId: 'test-context',
        output: 'Hola mundo',
        sourceLang: 'en-US',
        targetLang: 'es-ES'
      },
      loading: {
        translate: false,
        improve: false,
        languageDetection: false
      },
      preview: vi.fn()
    } as any)
  })

  it('renders empty state', async () => {
    const { useTranslation } = await import('../../src/hooks/useTranslation')

    vi.mocked(useTranslation).mockReturnValue({
      context: {
        contextId: null,
        output: '',
        sourceLang: '',
        targetLang: ''
      },
      loading: {
        translate: false,
        improve: false,
        languageDetection: false
      },
      preview: vi.fn()
    } as any)

    render(<TranslationOutput />)
    expect(screen.getByText('Output')).toBeInTheDocument()
  })

  it('renders copy button', () => {
    render(<TranslationOutput />)

    // Should render the output text
    expect(screen.getByText('Hola mundo')).toBeInTheDocument()
  })

  it('renders improve button', () => {
    render(<TranslationOutput />)

    expect(screen.getByTestId('improve-button')).toBeInTheDocument()
  })

  it('renders without crashing', () => {
    expect(() => render(<TranslationOutput />)).not.toThrow()
  })
})
