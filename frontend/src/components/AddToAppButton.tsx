import React, { useState, useEffect } from 'react'
import { Box, Button, Snackbar, Alert, IconButton } from '@mui/material'
import { GetApp, Close, PhoneIphone, LaptopMac } from '@mui/icons-material'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function AddToAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)
  const [isInstallable, setIsInstallable] = useState(false)
  const [showDebugInfo, setShowDebugInfo] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('PWA: beforeinstallprompt event fired')
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
    }

    const handleAppInstalled = () => {
      console.log('PWA: app installed')
      setIsInstallable(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Debug logging
    console.log('PWA: Component mounted, checking conditions...')
    console.log('PWA: isIOS =', isIOS())
    console.log('PWA: isInStandaloneMode =', isInStandaloneMode())
    console.log('PWA: hasBeforeInstallPrompt =', 'onbeforeinstallprompt' in window)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent)
  }

  const isInStandaloneMode = () => {
    try {
      const matchMediaResult = window.matchMedia('(display-mode: standalone)')
      return (matchMediaResult && matchMediaResult.matches) ||
             (window.navigator as any).standalone === true
    } catch (e) {
      // Fallback for test environments or browsers without matchMedia
      return (window.navigator as any).standalone === true
    }
  }

  const handleInstallClick = async () => {
    if (isIOS()) {
      setShowIOSInstructions(true)
      return
    }

    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setDeferredPrompt(null)
        setIsInstallable(false)
      }
    }
  }

  // Don't show the button if already installed
  if (isInStandaloneMode()) {
    console.log('PWA: Button hidden - already in standalone mode')
    return null
  }

  // Show button if: installable OR iOS OR development mode (force show for testing)
  const shouldShowButton = isInstallable || isIOS() || process.env.NODE_ENV === 'development'

  if (!shouldShowButton) {
    console.log('PWA: Button hidden - not installable, not iOS, not dev mode')
    return null
  }

  console.log('PWA: Button will show - installable:', isInstallable, 'iOS:', isIOS(), 'dev:', process.env.NODE_ENV)

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          mt: 2,
          mb: 1,
        }}
      >
        <Button
          variant="outlined"
          startIcon={isIOS() ? <PhoneIphone /> : <LaptopMac />}
          onClick={handleInstallClick}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            px: 3,
            py: 1,
          }}
        >
          Add to {isIOS() ? 'Home Screen' : 'Desktop'}
        </Button>
      </Box>

      {/* iOS Installation Instructions */}
      <Snackbar
        open={showIOSInstructions}
        onClose={() => setShowIOSInstructions(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        autoHideDuration={8000}
      >
        <Alert
          severity="info"
          sx={{ maxWidth: '90vw' }}
          action={
            <IconButton
              size="small"
              color="inherit"
              onClick={() => setShowIOSInstructions(false)}
            >
              <Close fontSize="small" />
            </IconButton>
          }
        >
          To install: tap the Share button in Safari, then tap "Add to Home Screen"
        </Alert>
      </Snackbar>
    </>
  )
}
