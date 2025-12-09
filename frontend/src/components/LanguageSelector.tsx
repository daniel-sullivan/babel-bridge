import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Divider,
  CircularProgress,
  Typography,
  useTheme,
  useMediaQuery,
  Fade,
  Grow
} from '@mui/material'
import { ExpandMore } from '@mui/icons-material'
import { Language } from '../types/translation'
import { getAvailableLanguages, getPrimaryLang, COMMON_LANGUAGES } from '../utils/languages'
import { getFlagSvgUrl } from '../utils/flags'

interface LanguageSelectorProps {
  excludeLang?: string
  loading: boolean
  loadingTarget?: string | null
  onTranslate: (languageCode: string) => void
}

export function LanguageSelector({ excludeLang, loading, loadingTarget, onTranslate }: LanguageSelectorProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [visibleCount, setVisibleCount] = useState(6)
  const containerRef = useRef<HTMLDivElement>(null)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.down('md'))

  const availableLanguages = getAvailableLanguages(excludeLang)

  // Calculate how many language buttons can fit
  const calculateVisibleCount = useCallback(() => {
    if (!containerRef.current) {
      // Fallback based on screen size
      if (isMobile) return 2
      if (isTablet) return 4
      return 6
    }

    const containerWidth = containerRef.current.offsetWidth
    const buttonWidth = 120 // Approximate width per language button
    const moreButtonWidth = 120 // Width of "More" button (increased to ensure full visibility)
    const gap = 8 // Gap between buttons
    const padding = 32 // Container padding (16px on each side = 32px total)

    // Always reserve space for the More button, even if all languages could theoretically fit
    // Formula: containerWidth = padding + (n * buttonWidth) + ((n-1) * gap) + gap + moreButtonWidth
    // Solving for n: n = (containerWidth - padding - moreButtonWidth - gap) / (buttonWidth + gap)
    const availableWidth = containerWidth - padding - moreButtonWidth - gap
    const maxButtons = Math.floor(availableWidth / (buttonWidth + gap))

    // Always keep at least one language in the More menu (except when there's only 1 total language)
    const maxVisibleLanguages = availableLanguages.length <= 1 ? availableLanguages.length : availableLanguages.length - 1

    // Ensure at least 1 visible, but cap at maxVisibleLanguages
    return Math.max(1, Math.min(maxButtons, maxVisibleLanguages))
  }, [containerRef, isMobile, isTablet, availableLanguages.length])

  // Update visible count on resize
  useEffect(() => {
    const updateCount = () => setVisibleCount(calculateVisibleCount())

    updateCount()

    const resizeObserver = new ResizeObserver(updateCount)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    window.addEventListener('resize', updateCount)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateCount)
    }
  }, [calculateVisibleCount])

  const visibleLanguages = availableLanguages.slice(0, visibleCount)
  const overflowLanguages = availableLanguages.slice(visibleCount)

  const open = Boolean(anchorEl)

  const handleMoreClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  function handleLanguageSelect(languageCode: string) {
    // Move language to front for better UX
    const langIndex = COMMON_LANGUAGES.findIndex(l => getPrimaryLang(l.code) === getPrimaryLang(languageCode))
    if (langIndex > 0) {
      const [language] = COMMON_LANGUAGES.splice(langIndex, 1)
      COMMON_LANGUAGES.unshift(language)
    }

    handleClose()
    onTranslate(languageCode)
  }

  function handleCustomLanguage() {
    const customLang = prompt('Enter custom BCP‑47 language tag (e.g., en-GB)')?.trim()
    if (customLang) {
      handleLanguageSelect(customLang)
    }
  }

  return (
    <Box
      ref={containerRef}
      sx={{
        display: 'flex',
        gap: 1,
        alignItems: 'center',
        width: '100%',
        overflow: 'hidden'
      }}
    >
      {/* Visible language buttons with directional fade transitions */}
      {availableLanguages.map((language, index) => {
        const isVisible = index < visibleCount
        const animationDelay = isVisible
          ? index * 50 // Left to right when appearing
          : (availableLanguages.length - index - 1) * 35 // Right to left when disappearing (slightly longer)

        return (
          <Grow
            key={language.code}
            in={isVisible}
            timeout={{
              enter: 300 + animationDelay,
              exit: 250 + animationDelay // Longer exit animation for smoother More button transition
            }}
            style={{
              transformOrigin: isVisible ? 'center left' : 'center right',
            }}
            unmountOnExit
          >
            <Button
              variant="outlined"
              onClick={() => handleLanguageSelect(language.code)}
              disabled={loading}
              startIcon={
                loading && loadingTarget === language.code ? (
                  <CircularProgress size={14} color="secondary" />
                ) : (
                  <LanguageFlag languageCode={language.code} />
                )
              }
              sx={{
                borderRadius: '999px',
                px: 1.5,
                py: 0.75,
                minWidth: 'auto',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                opacity: loading ? 0.7 : 1,
              }}
              title={`Translate to ${language.label}`}
              data-testid={`language-button-${language.code}`}
            >
              <Typography variant="body2" sx={{ ml: 0.5 }}>
                {language.label}
              </Typography>
            </Button>
          </Grow>
        )
      })}

      {/* More dropdown - animated in sync with the language buttons */}
      {availableLanguages.length > 1 && (
        <Grow
          in={true}
          timeout={{
            enter: 300 + (visibleCount * 50), // Appears after the last visible button
            exit: 50 // Much faster exit to move aggressively to new position
          }}
          style={{
            transformOrigin: 'center left',
            transition: 'transform 150ms cubic-bezier(0.4, 0.0, 0.2, 1), opacity 150ms cubic-bezier(0.4, 0.0, 0.2, 1)', // Faster, more aggressive transition
          }}
        >
          <Button
            variant="outlined"
            onClick={handleMoreClick}
            disabled={loading}
            endIcon={<ExpandMore />}
            sx={{
              borderRadius: '999px',
              px: 1.5,
              py: 0.75,
              minWidth: 90,
              flexShrink: 0,
              whiteSpace: 'nowrap',
              transition: 'all 120ms cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Custom easing for position changes
            }}
            aria-haspopup="menu"
            aria-expanded={open}
            data-testid="language-more-button"
            title="More languages"
          >
            More ▾
          </Button>
        </Grow>
      )}

      {/* Menu for More dropdown */}
      {availableLanguages.length > 1 && (
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          MenuListProps={{
            'aria-labelledby': 'more-languages-button',
            dense: true,
          }}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          {overflowLanguages.map((language) => (
            <MenuItem
              key={language.code}
              onClick={() => handleLanguageSelect(language.code)}
              data-testid={`language-option-${language.code}`}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LanguageFlag languageCode={language.code} />
                <Typography variant="body2">
                  {language.label} ({language.code})
                </Typography>
              </Box>
            </MenuItem>
          ))}
          <Divider />
          <MenuItem
            onClick={handleCustomLanguage}
            data-testid="language-custom-option"
          >
            <Typography variant="body2">Custom…</Typography>
          </MenuItem>
        </Menu>
      )}
    </Box>
  )
}


interface LanguageFlagProps {
  languageCode: string
}

function LanguageFlag({ languageCode }: LanguageFlagProps) {
  const flagUrl = getFlagSvgUrl(languageCode)

  if (flagUrl) {
    return (
      <Box
        component="img"
        src={flagUrl}
        alt=""
        sx={{
          width: '1.2em',
          height: '1.2em',
          display: 'inline-block',
          verticalAlign: 'text-bottom',
        }}
      />
    )
  }

  return (
    <Typography component="span" role="img" aria-label="globe">
      🌐
    </Typography>
  )
}
