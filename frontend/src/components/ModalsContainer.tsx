import React, { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  AlertTitle,
  IconButton,
  CircularProgress
} from '@mui/material'
import { Close } from '@mui/icons-material'
import { useTranslation } from '../hooks/useTranslation'
import { useTranslationContext } from '../context/TranslationContext'

export function ModalsContainer() {
  const { error } = useTranslation()
  const { dispatch } = useTranslationContext()

  return (
    <>
      <ErrorModal
        open={Boolean(error)}
        error={error || ''}
        onClose={() => dispatch({ type: 'SET_ERROR', payload: null })}
      />
      <ImproveModal />
    </>
  )
}

interface ErrorModalProps {
  open: boolean
  error: string
  onClose: () => void
}

function ErrorModal({ open, error, onClose }: ErrorModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      data-testid="error-modal"
    >
      <DialogContent sx={{ p: 3 }}>
        <Alert
          severity="error"
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={onClose}
              data-testid="error-dismiss"
            >
              <Close fontSize="inherit" />
            </IconButton>
          }
        >
          <AlertTitle>Error</AlertTitle>
          <span data-testid="error-message">{error}</span>
        </Alert>
      </DialogContent>
    </Dialog>
  )
}

function ImproveModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [feedback, setFeedback] = useState('')
  const { improve, loading } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)

  // Listen for improve modal open events
  useEffect(() => {
    const handleOpenImprove = () => {
      setIsOpen(true)
      setFeedback('')
    }

    window.addEventListener('openImproveModal', handleOpenImprove)
    return () => window.removeEventListener('openImproveModal', handleOpenImprove)
  }, [])

  const handleClose = () => {
    setIsOpen(false)
    setFeedback('')
  }

  const handleApply = async () => {
    if (!feedback.trim()) return

    try {
      await improve(feedback)
      handleClose()
    } catch (err) {
      // Error handling is managed by the useTranslation hook
      console.error('Improve failed:', err)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && feedback.trim() && !loading.improve) {
      handleApply()
    }
  }

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      data-testid="improve-modal"
    >
      <DialogTitle>Improve output</DialogTitle>

      <DialogContent>
        <TextField
          inputRef={inputRef}
          fullWidth
          variant="outlined"
          placeholder="e.g. More formal, add details..."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          onKeyDown={handleKeyDown}
          data-testid="improve-feedback-input"
          autoFocus
          sx={{ mt: 1 }}
        />
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button
          onClick={handleClose}
          data-testid="improve-cancel-button"
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleApply}
          disabled={!feedback.trim() || loading.improve}
          data-testid="improve-apply-button"
          startIcon={loading.improve ? <CircularProgress size={16} /> : null}
        >
          {loading.improve ? 'Applying...' : 'Apply'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
