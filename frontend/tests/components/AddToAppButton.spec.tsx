import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AddToAppButton } from '../../src/components/AddToAppButton'

// Mock process.env for testing
const originalEnv = process.env.NODE_ENV
const mockMatchMedia = vi.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}))

// Set up global mocks before all tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
})

describe('AddToAppButton', () => {
  let mockUserAgent: string

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    mockMatchMedia.mockClear()

    // Store original userAgent
    mockUserAgent = navigator.userAgent

    // Mock console.log to avoid test noise
    vi.spyOn(console, 'log').mockImplementation(() => {})

    // Reset event listeners
    window.removeEventListener = vi.fn()
    window.addEventListener = vi.fn()

    // Set NODE_ENV for testing
    process.env.NODE_ENV = 'development'
  })

  afterEach(() => {
    // Restore userAgent
    Object.defineProperty(navigator, 'userAgent', {
      value: mockUserAgent,
      configurable: true
    })

    // Restore NODE_ENV
    process.env.NODE_ENV = originalEnv

    vi.restoreAllMocks()
  })

  const mockUserAgentAs = (userAgent: string) => {
    Object.defineProperty(navigator, 'userAgent', {
      value: userAgent,
      configurable: true
    })
  }

  const mockStandaloneMode = (isStandalone: boolean) => {
    mockMatchMedia.mockImplementation(query => {
      if (query === '(display-mode: standalone)') {
        return {
          matches: isStandalone,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }
      }
      return {
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }
    })
  }

  describe('Component Rendering', () => {
    it('renders without crashing', () => {
      expect(() => render(<AddToAppButton />)).not.toThrow()
    })

    it('shows button in development mode', () => {
      // Ensure development mode is set
      process.env.NODE_ENV = 'development'

      render(<AddToAppButton />)

      expect(screen.getByRole('button')).toBeInTheDocument()
      expect(screen.getByText(/Add to Desktop/)).toBeInTheDocument()
    })

    it('does not show button when in standalone mode', () => {
      mockStandaloneMode(true)
      render(<AddToAppButton />)

      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
  })

  describe('iOS Detection', () => {
    it('shows iOS-specific button text and icon for iPhone', () => {
      mockUserAgentAs('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)')
      process.env.NODE_ENV = 'development'

      render(<AddToAppButton />)

      expect(screen.getByText(/Add to Home Screen/)).toBeInTheDocument()
      expect(screen.getByTestId('PhoneIphoneIcon')).toBeInTheDocument()
    })

    it('shows iOS-specific button text for iPad', () => {
      mockUserAgentAs('Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X)')
      process.env.NODE_ENV = 'development'

      render(<AddToAppButton />)

      expect(screen.getByText(/Add to Home Screen/)).toBeInTheDocument()
    })

    it('shows desktop button text for non-iOS devices', () => {
      mockUserAgentAs('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
      process.env.NODE_ENV = 'development'

      render(<AddToAppButton />)

      expect(screen.getByText(/Add to Desktop/)).toBeInTheDocument()
      expect(screen.getByTestId('LaptopMacIcon')).toBeInTheDocument()
    })
  })

  describe('Install Prompt Handling', () => {
    let mockBeforeInstallPromptEvent: any

    beforeEach(() => {
      mockBeforeInstallPromptEvent = {
        preventDefault: vi.fn(),
        prompt: vi.fn().mockResolvedValue(undefined),
        userChoice: Promise.resolve({ outcome: 'accepted' })
      }
    })

    it('sets installable state when beforeinstallprompt fires', async () => {
      const { rerender } = render(<AddToAppButton />)

      // Simulate the beforeinstallprompt event
      const eventHandler = vi.mocked(window.addEventListener).mock.calls
        .find(call => call[0] === 'beforeinstallprompt')?.[1] as EventListener

      if (eventHandler) {
        eventHandler(mockBeforeInstallPromptEvent)
      }

      rerender(<AddToAppButton />)

      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('calls preventDefault on beforeinstallprompt event', () => {
      render(<AddToAppButton />)

      const eventHandler = vi.mocked(window.addEventListener).mock.calls
        .find(call => call[0] === 'beforeinstallprompt')?.[1] as EventListener

      if (eventHandler) {
        eventHandler(mockBeforeInstallPromptEvent)
      }

      expect(mockBeforeInstallPromptEvent.preventDefault).toHaveBeenCalled()
    })
  })

  describe('iOS Instructions', () => {
    it('shows iOS installation instructions when clicked on iOS', async () => {
      mockUserAgentAs('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)')
      process.env.NODE_ENV = 'development'

      render(<AddToAppButton />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText(/To install: tap the Share button/)).toBeInTheDocument()
      })
    })

    it('closes iOS instructions when close button is clicked', async () => {
      mockUserAgentAs('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)')
      process.env.NODE_ENV = 'development'

      render(<AddToAppButton />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText(/To install: tap the Share button/)).toBeInTheDocument()
      })

      // The close button doesn't have accessible text, so we'll find it by test-id
      const closeButton = screen.getByTestId('CloseIcon').closest('button')
      fireEvent.click(closeButton!)

      await waitFor(() => {
        expect(screen.queryByText(/To install: tap the Share button/)).not.toBeInTheDocument()
      })
    })
  })

  describe('Desktop Install Prompt', () => {
    it('triggers install prompt when button is clicked on desktop', async () => {
      mockUserAgentAs('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
      process.env.NODE_ENV = 'development'

      const mockPrompt = vi.fn().mockResolvedValue(undefined)
      const mockUserChoice = Promise.resolve({ outcome: 'accepted' })

      const mockEvent = {
        preventDefault: vi.fn(),
        prompt: mockPrompt,
        userChoice: mockUserChoice
      }

      const { rerender } = render(<AddToAppButton />)

      // Simulate beforeinstallprompt event after component is mounted
      const eventHandler = vi.mocked(window.addEventListener).mock.calls
        .find(call => call[0] === 'beforeinstallprompt')?.[1] as EventListener

      if (eventHandler) {
        eventHandler(mockEvent as any)
      }

      // Rerender to reflect state change
      rerender(<AddToAppButton />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(mockPrompt).toHaveBeenCalled()
      })
    })
  })

  describe('Event Listeners', () => {
    it('adds event listeners on mount', () => {
      render(<AddToAppButton />)

      expect(window.addEventListener).toHaveBeenCalledWith('beforeinstallprompt', expect.any(Function))
      expect(window.addEventListener).toHaveBeenCalledWith('appinstalled', expect.any(Function))
    })

    it('removes event listeners on unmount', () => {
      const { unmount } = render(<AddToAppButton />)

      unmount()

      expect(window.removeEventListener).toHaveBeenCalledWith('beforeinstallprompt', expect.any(Function))
      expect(window.removeEventListener).toHaveBeenCalledWith('appinstalled', expect.any(Function))
    })
  })

  describe('Button Styling', () => {
    it('applies correct styling to the button', () => {
      process.env.NODE_ENV = 'development'
      render(<AddToAppButton />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('MuiButton-outlined')
      expect(button).toHaveStyle({ textTransform: 'none' })
    })

    it('centers the button in its container', () => {
      process.env.NODE_ENV = 'development'
      render(<AddToAppButton />)

      const button = screen.getByRole('button')
      const container = button.closest('div')

      expect(container).toHaveStyle({
        display: 'flex',
        justifyContent: 'center'
      })
    })
  })

  describe('Accessibility', () => {
    it('has accessible button text', () => {
      process.env.NODE_ENV = 'development'
      render(<AddToAppButton />)

      const button = screen.getByRole('button')
      expect(button).toHaveAccessibleName(/Add to Desktop/)
    })

    it('has accessible close button in iOS instructions', async () => {
      mockUserAgentAs('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)')
      process.env.NODE_ENV = 'development'

      render(<AddToAppButton />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      await waitFor(() => {
        const closeIcon = screen.getByTestId('CloseIcon')
        const closeButton = closeIcon.closest('button')
        expect(closeButton).toBeInTheDocument()
        expect(closeButton).toHaveAttribute('type', 'button')
      })
    })
  })
})
