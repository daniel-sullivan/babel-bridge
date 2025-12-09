import React, { useState, useEffect, useRef } from 'react'
import {
  Paper,
  Typography,
  TextField,
  Box,
  IconButton,
  CircularProgress,
  List,
  ListItem,
  Chip
} from '@mui/material'
import { Add, Close } from '@mui/icons-material'
import { Message } from '../types/translation'
import { generateId } from '../utils/id'
import { useLanguageDetection } from '../hooks/useLanguageDetection'
import { useTranslationContext } from '../context/TranslationContext'
import { toLanguageName } from '../utils/languages'
import { LanguageSelector } from './LanguageSelector'

interface TranslationComposerProps {
  onTranslate: (text: string, targetLang: string) => void
}

export function TranslationComposer({ onTranslate }: TranslationComposerProps) {
  const [messages, setMessages] = useState<Message[]>([{ id: generateId(), text: '' }])
  const [isChain, setIsChain] = useState(false)
  const { state } = useTranslationContext()
  const { sourceLang, detectLanguageDebounced } = useLanguageDetection()

  const currentText = messages[messages.length - 1]?.text || ''

  // Language detection effect
  useEffect(() => {
    const cleanup = detectLanguageDebounced(currentText)
    return cleanup
  }, [currentText, detectLanguageDebounced])

  const updateMessage = (id: string, text: string) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, text } : m))
  }

  const addMessage = () => {
    const newMessage = { id: generateId(), text: '' }
    setMessages(prev => [...prev, newMessage])
    if (!isChain) setIsChain(true)
  }

  const removeMessage = (id: string) => {
    setMessages(prev => {
      const filtered = prev.filter(m => m.id !== id)
      return filtered.length > 0 ? filtered : [{ id: generateId(), text: '' }]
    })
  }

  const handleTranslateClick = (targetLang: string) => {
    const text = messages.map(m => m.text).join(' ').trim()
    onTranslate(text, targetLang)
  }

  return (
    <Paper elevation={0} sx={{ p: 3, backgroundColor: 'background.paper' }}>
      <Box className="composer-header" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Typography variant="h6" component="h2">
          Input
          {sourceLang && ` — ${toLanguageName(sourceLang)}`}
        </Typography>
        {state.loading.languageDetection && (
          <CircularProgress
            size={14}
            color="secondary"
            aria-label="Detecting language"
          />
        )}
        {sourceLang && !state.loading.languageDetection && (
          <Box sx={{ position: 'absolute', left: '-9999px' }} aria-live="polite">
            Detected language: {toLanguageName(sourceLang)}
          </Box>
        )}
      </Box>

      {isChain ? (
        <MultipleMessageInput
          messages={messages}
          onUpdateMessage={updateMessage}
          onRemoveMessage={removeMessage}
          onAddMessage={addMessage}
        />
      ) : (
        <SingleMessageInput
          message={messages[0]}
          onUpdateMessage={updateMessage}
          onAddMessage={addMessage}
        />
      )}

      <TranslateControls
        sourceLang={sourceLang}
        loading={state.loading.translate}
        loadingTarget={state.loadingTarget}
        onTranslate={handleTranslateClick}
      />
    </Paper>
  )
}

interface MultipleMessageInputProps {
  messages: Message[]
  onUpdateMessage: (id: string, text: string) => void
  onRemoveMessage: (id: string) => void
  onAddMessage: () => void
}

function MultipleMessageInput({
  messages,
  onUpdateMessage,
  onRemoveMessage,
  onAddMessage
}: MultipleMessageInputProps) {
  return (
    <Box sx={{ mb: 2 }}>
      <List disablePadding>
        {messages.map((message, index) => (
          <ListItem key={message.id} disablePadding sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', width: '100%', gap: 1, alignItems: 'flex-start' }}>
              <TextField
                multiline
                fullWidth
                minRows={2}
                value={message.text}
                onChange={(e) => onUpdateMessage(message.id, e.target.value)}
                placeholder={
                  index === messages.length - 1
                    ? 'Final message to translate…'
                    : 'Earlier context (optional)…'
                }
                variant="outlined"
                data-testid={`message-input-${index}`}
              />
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, pt: 1 }}>
                <Chip
                  label={index + 1}
                  size="small"
                  sx={{ width: 28, height: 28, fontSize: '0.75rem' }}
                />
                {messages.length > 1 && (
                  <IconButton
                    size="small"
                    aria-label="Remove message"
                    onClick={() => onRemoveMessage(message.id)}
                    data-testid={`remove-message-${index}`}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </Box>
          </ListItem>
        ))}
      </List>
      <IconButton
        onClick={onAddMessage}
        aria-label="Add message"
        data-testid="add-message-button"
        sx={{ mt: 1 }}
      >
        <Add />
      </IconButton>
    </Box>
  )
}

interface SingleMessageInputProps {
  message: Message
  onUpdateMessage: (id: string, text: string) => void
  onAddMessage: () => void
}

function SingleMessageInput({ message, onUpdateMessage, onAddMessage }: SingleMessageInputProps) {
  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mb: 2 }}>
      <TextField
        multiline
        fullWidth
        minRows={3}
        value={message.text}
        onChange={(e) => onUpdateMessage(message.id, e.target.value)}
        placeholder="Enter text to translate…"
        variant="outlined"
        data-testid="single-message-input"
      />
      <IconButton
        onClick={onAddMessage}
        aria-label="Add message"
        data-testid="add-message-button"
        sx={{ mt: 1 }}
      >
        <Add />
      </IconButton>
    </Box>
  )
}

interface TranslateControlsProps {
  sourceLang: string
  loading: boolean
  loadingTarget: string | null
  onTranslate: (targetLang: string) => void
}

function TranslateControls({ sourceLang, loading, loadingTarget, onTranslate }: TranslateControlsProps) {
  return (
    <Box role="group" aria-label="Translate to">
      <LanguageSelector
        excludeLang={sourceLang}
        loading={loading}
        loadingTarget={loadingTarget}
        onTranslate={onTranslate}
      />
    </Box>
  )
}
