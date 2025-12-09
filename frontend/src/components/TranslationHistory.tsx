import React, { useState } from 'react'
import {
  Paper,
  Box,
  Typography,
  Button,
  Collapse,
  List,
  ListItem,
  Chip,
  Divider
} from '@mui/material'
import { ExpandLess, ExpandMore, SwapHoriz } from '@mui/icons-material'
import { useTranslation } from '../hooks/useTranslation'
import { HistoryItem } from '../types/translation'
import { toLanguageName } from '../utils/languages'

export function TranslationHistory() {
  const { history, context, preview } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [historyReverse, setHistoryReverse] = useState<Record<number, { active: boolean; preview?: string }>>({})

  if (history.length === 0) return null

  const toggleHistoryItem = async (index: number) => {
    if (!context.sourceLang) return

    const reverse = historyReverse[index]
    if (reverse?.active) {
      // Switch back to translation
      setHistoryReverse(prev => ({
        ...prev,
        [index]: { ...reverse, active: false }
      }))
      return
    }

    if (reverse?.preview) {
      // Show cached preview
      setHistoryReverse(prev => ({
        ...prev,
        [index]: { active: true, preview: reverse.preview }
      }))
      return
    }

    // Generate preview
    try {
      const historyItem = history[index]
      if (!historyItem) return

      const result = await preview(historyItem.text, context.sourceLang.split('-')[0])
      setHistoryReverse(prev => ({
        ...prev,
        [index]: { active: true, preview: result }
      }))
    } catch (err) {
      console.error('History reverse preview error:', err)
    }
  }

  return (
    <Paper elevation={0} sx={{ backgroundColor: 'background.paper' }}>
      <Button
        fullWidth
        onClick={() => setIsOpen(!isOpen)}
        endIcon={isOpen ? <ExpandLess /> : <ExpandMore />}
        startIcon={
          <Chip
            label={history.length}
            size="small"
            color="primary"
            sx={{ fontSize: '0.75rem' }}
          />
        }
        sx={{
          justifyContent: 'flex-start',
          p: 2,
          color: 'text.primary',
        }}
        data-testid="history-toggle"
      >
        <Typography variant="body2">
          {isOpen ? 'Hide' : 'Show'} context history
        </Typography>
      </Button>

      <Collapse in={isOpen} timeout="auto" unmountOnExit>
        <Divider />
        <List dense data-testid="history-list" sx={{ px: 2, pb: 2 }}>
          {history.map((item, index) => (
            <HistoryItemComponent
              key={index}
              item={item}
              index={index}
              sourceLang={context.sourceLang}
              reverse={historyReverse[index]}
              onToggleReverse={() => toggleHistoryItem(index)}
            />
          ))}
        </List>
      </Collapse>
    </Paper>
  )
}

interface HistoryItemComponentProps {
  item: HistoryItem
  index: number
  sourceLang: string
  reverse?: { active: boolean; preview?: string }
  onToggleReverse: () => void
}

function HistoryItemComponent({
  item,
  index,
  sourceLang,
  reverse,
  onToggleReverse
}: HistoryItemComponentProps) {
  const displayText = reverse?.active ? reverse.preview : item.text
  const badgeText = item.kind === 'initial' ? 'Initial' : `Improve: ${item.feedback}`

  return (
    <ListItem
      disablePadding
      sx={{ display: 'block', mb: 1 }}
      data-testid={`history-item-${index}`}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Chip
          label={badgeText}
          size="small"
          variant="outlined"
          sx={{ fontSize: '0.75rem' }}
        />
        <Typography variant="caption" color="text.secondary">
          {new Date(item.at).toLocaleString()}
        </Typography>
        <Box sx={{ flex: 1 }} />

        {sourceLang && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<SwapHoriz />}
            onClick={onToggleReverse}
            title={
              reverse?.active
                ? 'Show translation'
                : `Show in original (${toLanguageName(sourceLang)})`
            }
            data-testid={`history-reverse-${index}`}
            sx={{ fontSize: '0.75rem', py: 0.25, px: 1 }}
          >
            {reverse?.active ? 'Translation' : 'Original'}
          </Button>
        )}
      </Box>

      <Box
        sx={{
          p: 1.5,
          backgroundColor: 'background.default',
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
          fontSize: '0.875rem',
          lineHeight: 1.4,
        }}
        id={`history-text-${index}`}
      >
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
          {displayText || 'Loading...'}
        </Typography>
      </Box>
    </ListItem>
  )
}
