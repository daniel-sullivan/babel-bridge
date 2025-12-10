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
    console.log('PWA: hostname =', window.location.hostname)

    // For development localhost OR production HTTPS: if no beforeinstallprompt after 2 seconds,
    // assume it's available for testing/installation
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    const isDev = process.env.NODE_ENV === 'development'
    const isHTTPS = window.location.protocol === 'https:'
    const isProductionDomain = !isLocalhost && isHTTPS

    let timeoutId: NodeJS.Timeout | null = null
    if ((isDev && isLocalhost) || isProductionDomain) {
      timeoutId = setTimeout(() => {
        if (!isInstallable && !isIOS()) {
          console.log('PWA: No beforeinstallprompt after 2s, enabling for production/localhost')
          setIsInstallable(true)
        }
      }, 2000)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      if (timeoutId) clearTimeout(timeoutId)
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

  // Show button if:
  // 1. Actually installable (beforeinstallprompt fired), OR
  // 2. iOS device (can always install via Safari), OR
  // 3. Development mode AND localhost (for testing), OR
  // 4. Production domain with HTTPS (assume PWA is available)
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  const isDev = process.env.NODE_ENV === 'development'
  const isHTTPS = window.location.protocol === 'https:'
  const isProductionDomain = !isLocalhost && isHTTPS

  const shouldShowButton = isInstallable || isIOS() || (isDev && isLocalhost) || isProductionDomain

  if (!shouldShowButton) {
    console.log('PWA: Button hidden - not installable, not iOS, not dev+localhost, not production HTTPS')
    return null
  }

  console.log('PWA: Button will show - installable:', isInstallable, 'iOS:', isIOS(), 'dev+localhost:', isDev && isLocalhost, 'production:', isProductionDomain)

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
