import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '../test-utils'
import { ModalsContainer } from '../../src/components/ModalsContainer'

// Mock the hooks using factory functions to avoid hoisting issues
vi.mock('../../src/hooks/useTranslation', () => ({
  useTranslation: vi.fn()
}))

vi.mock('../../src/context/TranslationContext', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useTranslationContext: vi.fn()
  }
})

describe('ModalsContainer', () => {
  beforeEach(async () => {
    const { useTranslation } = await import('../../src/hooks/useTranslation')
    const { useTranslationContext } = await import('../../src/context/TranslationContext')

    vi.mocked(useTranslation).mockReturnValue({
      error: null,
      loading: {
        translate: false,
        improve: false,
        languageDetection: false
      },
      context: {
        contextId: null,
        output: '',
        sourceLang: '',
        targetLang: ''
      },
      improve: vi.fn()
    } as any)

    vi.mocked(useTranslationContext).mockReturnValue({
      dispatch: vi.fn()
    } as any)
  })

  it('renders modal container', () => {
    render(<ModalsContainer />)
    // Component should render without crashing
    expect(true).toBe(true)
  })

  it('renders error modal when error exists', async () => {
    const { useTranslation } = await import('../../src/hooks/useTranslation')
    const { useTranslationContext } = await import('../../src/context/TranslationContext')

    const mockDispatch = vi.fn()

    vi.mocked(useTranslationContext).mockReturnValue({
      dispatch: mockDispatch
    } as any)

    vi.mocked(useTranslation).mockReturnValue({
      error: 'Test error message',
      loading: {
        translate: false,
        improve: false,
        languageDetection: false
      },
      context: {
        contextId: null,
        output: '',
        sourceLang: '',
        targetLang: ''
      },
      improve: vi.fn()
    } as any)

    render(<ModalsContainer />)

    // Error modal should be visible
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Test error message')).toBeInTheDocument()
  })

  it('does not render error modal when no error', async () => {
    const { useTranslation } = await import('../../src/hooks/useTranslation')

    vi.mocked(useTranslation).mockReturnValue({
      error: null,
      loading: {
        translate: false,
        improve: false,
        languageDetection: false
      },
      context: {
        contextId: null,
        output: '',
        sourceLang: '',
        targetLang: ''
      },
      improve: vi.fn()
    } as any)

    render(<ModalsContainer />)

    // Error modal should not be visible
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders without crashing', () => {
    expect(() => render(<ModalsContainer />)).not.toThrow()
  })
})
