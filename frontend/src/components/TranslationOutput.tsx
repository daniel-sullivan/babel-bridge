import React, { useState } from 'react'
import { Paper, Box, Typography, Button, CircularProgress, Fade } from '@mui/material'
import { SwapHoriz } from '@mui/icons-material'
import { useTranslation } from '../hooks/useTranslation'
import { toLanguageName } from '../utils/languages'
import { ReverseView } from '../types/translation'

export function TranslationOutput() {
  const { context, loading, preview } = useTranslation()
  const [reverseView, setReverseView] = useState<ReverseView>({
    active: false,
    forwardText: '',
    preview: undefined
  })

  const handleReverse = async () => {
    if (!context.output || !context.sourceLang) return

    if (reverseView.active) {
      // Switch back to translation
      setReverseView(prev => ({ ...prev, active: false }))
      return
    }

    if (reverseView.preview) {
      // Show cached preview
      setReverseView(prev => ({ ...prev, active: true }))
      return
    }

    // Generate preview
    try {
      const result = await preview(context.output, context.sourceLang.split('-')[0])
      setReverseView({
        active: true,
        forwardText: context.output,
        preview: result
      })
    } catch (err) {
      console.error('Reverse preview error:', err)
    }
  }

  // Update reverse view when translation output changes
  React.useEffect(() => {
    if (context.output !== reverseView.forwardText) {
      setReverseView({
        active: false,
        forwardText: context.output,
        preview: undefined
      })
    }
  }, [context.output, reverseView.forwardText])

  const displayText = reverseView.active ? reverseView.preview : context.output
  const hasOutput = Boolean(context.output)

  return (
    <Paper elevation={0} sx={{ p: 3, backgroundColor: 'background.paper' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Typography variant="h6" component="h2">
          Output
        </Typography>
        <Box sx={{ flex: 1 }} />

        {hasOutput && context.sourceLang && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<SwapHoriz />}
            onClick={handleReverse}
            title={
              reverseView.active
                ? 'Show translation'
                : `Show in original (${toLanguageName(context.sourceLang)})`
            }
            data-testid="reverse-translation-button"
            sx={{ mr: 1 }}
          >
            {reverseView.active
              ? 'Translation'
              : `Original`}
          </Button>
        )}

        <ImproveButton disabled={!hasOutput || loading.improve} />
      </Box>

      <Box
        sx={{
          minHeight: '120px',
          maxHeight: '400px',
          overflowY: 'auto',
          p: 1.5,
          backgroundColor: 'background.default',
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
          fontSize: '1rem',
          lineHeight: 1.5,
        }}
        aria-live="polite"
        data-testid="translation-output"
      >
        <Fade in={hasOutput} timeout={300}>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {displayText || 'No output yet'}
          </Typography>
        </Fade>
      </Box>

      {context.sourceLang && hasOutput && (
        <Typography className="detected-lang" variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Translated from {toLanguageName(context.sourceLang)}
        </Typography>
      )}
    </Paper>
  )
}

interface ImproveButtonProps {
  disabled: boolean
}

function ImproveButton({ disabled }: ImproveButtonProps) {
  const { loading } = useTranslation()

  return (
    <Button
      variant="outlined"
      disabled={disabled}
      onClick={() => {
        // Dispatch event to open improve modal
        window.dispatchEvent(new CustomEvent('openImproveModal'))
      }}
      data-testid="improve-button"
      startIcon={loading.improve ? <CircularProgress size={16} /> : null}
    >
      {loading.improve ? 'Improving…' : 'Improve'}
    </Button>
  )
}
