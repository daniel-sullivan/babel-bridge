import React from 'react'
import { Box, Container, AppBar, Toolbar, Typography, Paper } from '@mui/material'
import { TranslationProvider } from './context/TranslationContext'
import { useTranslation } from './hooks/useTranslation'
import { TranslationComposer } from './components/TranslationComposer'
import { TranslationOutput } from './components/TranslationOutput'
import { TranslationHistory } from './components/TranslationHistory'
import { ModalsContainer } from './components/ModalsContainer'
import logoUrl from './assets/logo.svg'

function AppContent() {
  const { translate, context } = useTranslation()

  const handleTranslate = async (text: string, targetLang: string) => {
    try {
      await translate(text, targetLang)
    } catch (err) {
      // Error handling is managed by the translation hook
      console.error('Translation failed:', err)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppHeader />

      <Container
        component="main"
        maxWidth="lg"
        sx={{
          flex: 1,
          py: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        <TranslationComposer onTranslate={handleTranslate} />

        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <TranslationOutput />
          <TranslationHistory />
        </Box>
      </Container>

      <AppFooter />
      <ModalsContainer />
    </Box>
  )
}

function AppHeader() {
    return (
        <AppBar
            position="sticky"
            elevation={0}
            sx={{
                background: 'linear-gradient(180deg, rgba(0,0,0,0.45), rgba(0,0,0,0))',
                borderBottom: '1px solid #111827',
                backdropFilter: 'blur(6px) saturate(1.05)',
            }}
        >
            <Toolbar sx={{ gap: 1.5, minHeight: 56 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                    <Box
                        component="img"
                        src={logoUrl}
                        alt="BabelBridge logo"
                        sx={{
                            height: 40,
                            borderRadius: 2,
                        }}
                    />
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 700,
                            letterSpacing: 0.3,
                        }}
                    >
                        BabelBridge
                    </Typography>
                </Box>
            </Toolbar>
        </AppBar>
    )
}

function AppFooter() {
  return (
    <Box
      component="footer"
      sx={{
        py: 2,
        px: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderTop: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
      }}
    >
      <Typography
        variant="body2"
        component="a"
        href="https://github.com/daniel-sullivan/babel-bridge"
        target="_blank"
        rel="noreferrer"
        sx={{
          color: 'text.secondary',
          textDecoration: 'none',
          '&:hover': {
            textDecoration: 'underline',
          },
        }}
      >
        © 2025 Daniel Sullivan
      </Typography>
    </Box>
  )
}


export default function App() {
  return (
    <TranslationProvider>
      <AppContent />
    </TranslationProvider>
  )
}
