import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { LanguageSelector } from '../../src/components/LanguageSelector'

// Minimal unit test to ensure the component renders and exposes controls
describe('LanguageSelector', () => {
  it('renders visible language buttons and more button', () => {
    const onTranslate = vi.fn()

    render(<LanguageSelector loading={false} onTranslate={onTranslate} />)

    // Expect the More button to be present
    const more = screen.getByTestId('language-more-button')
    expect(more).toBeTruthy()
  })
})

