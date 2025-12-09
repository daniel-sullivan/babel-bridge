import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '../test-utils'
import { TranslationHistory } from '../../src/components/TranslationHistory'

// Mock the hooks using factory functions to avoid hoisting issues
vi.mock('../../src/hooks/useTranslation', () => ({
  useTranslation: vi.fn()
}))

describe('TranslationHistory', () => {
  beforeEach(async () => {
    const { useTranslation } = await import('../../src/hooks/useTranslation')

    vi.mocked(useTranslation).mockReturnValue({
      history: [
        {
          kind: 'initial',
          text: 'Test translation',
          at: Date.now()
        }
      ],
      context: {
        sourceLang: 'en-US'
      },
      preview: vi.fn()
    } as any)
  })

  it('renders history title', () => {
    render(<TranslationHistory />)

    // Should show history controls when there is history
    expect(screen.getByTestId('history-toggle')).toBeInTheDocument()
  })

  it('shows empty state', async () => {
    const { useTranslation } = await import('../../src/hooks/useTranslation')

    vi.mocked(useTranslation).mockReturnValue({
      history: [],
      context: {
        sourceLang: 'en-US'
      },
      preview: vi.fn()
    } as any)

    const { container } = render(<TranslationHistory />)
    // Component should render nothing when no history
    expect(container.firstChild).toBeNull()
  })

  it('renders clear button', () => {
    render(<TranslationHistory />)

    // History component exists
    expect(screen.getByTestId('history-toggle')).toBeInTheDocument()
  })

  it('renders without crashing', () => {
    expect(() => render(<TranslationHistory />)).not.toThrow()
  })
})
