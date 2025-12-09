import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import LanguageButtons from '../../src/LanguageButtons'
import { createTestWrapper } from '../test-utils'

describe('LanguageButtons', () => {
  it('should render LanguageSelector component', () => {
    const mockOnTranslate = vi.fn()

    render(
      <LanguageButtons
        loading={false}
        onTranslate={mockOnTranslate}
      />,
      { wrapper: createTestWrapper() }
    )

    // Should render language buttons
    expect(screen.getByTestId('language-button-ja')).toBeInTheDocument()
    expect(screen.getByTestId('language-more-button')).toBeInTheDocument()
  })

  it('should pass props correctly to LanguageSelector', () => {
    const mockOnTranslate = vi.fn()

    render(
      <LanguageButtons
        excludeLang="en-US"
        loading={true}
        loadingTarget="es-ES"
        onTranslate={mockOnTranslate}
      />,
      { wrapper: createTestWrapper() }
    )

    // Verify that the component renders without errors
    expect(screen.getByTestId('language-button-ja')).toBeInTheDocument()

    // The loading state should be reflected in the component (buttons disabled)
    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      expect(button).toHaveAttribute('disabled')
    })
  })

  it('should handle minimal props', () => {
    const mockOnTranslate = vi.fn()

    render(
      <LanguageButtons
        loading={false}
        onTranslate={mockOnTranslate}
      />,
      { wrapper: createTestWrapper() }
    )

    expect(screen.getByTestId('language-button-ja')).toBeInTheDocument()
  })

  it('should be a functional component', () => {
    expect(typeof LanguageButtons).toBe('function')
    expect(LanguageButtons.name).toBe('LanguageButtons')
  })
})
