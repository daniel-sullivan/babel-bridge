// theme.ts
import { createTheme } from '@mui/material/styles'

const charsSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="500" viewBox="0 0 900 500">
  <defs>
    <!-- 45° gradient: top-left (0%) -> bottom-right (100%) -->
    <linearGradient id="langGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#0f172a" stop-opacity="0" />
      <stop offset="35%"  stop-color="#2563eb" stop-opacity="0.35" />
      <stop offset="65%"  stop-color="#7c3aed" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#22c55e" stop-opacity="0.45" />
    </linearGradient>
  </defs>

  <!-- Shift whole cluster down so it occupies bottom ~quarter of page -->
  <g transform="translate(0,220)">
    <g transform="rotate(-18 120 80)">
      <text x="60"  y="110" font-family="system-ui, sans-serif" font-size="120"
            fill="url(#langGradient)" fill-opacity="0.9">漢</text>
    </g>

    <g transform="rotate(9 260 120)">
      <text x="210" y="130" font-family="system-ui, sans-serif" font-size="170"
            fill="url(#langGradient)" fill-opacity="0.75">あ</text>
    </g>

    <g transform="rotate(-5 420 140)">
      <text x="370" y="155" font-family="system-ui, sans-serif" font-size="140"
            fill="url(#langGradient)" fill-opacity="0.85">Б</text>
    </g>

    <g transform="rotate(14 580 160)">
      <text x="540" y="175" font-family="system-ui, sans-serif" font-size="130"
            fill="url(#langGradient)" fill-opacity="0.8">अ</text>
    </g>

    <g transform="rotate(-11 720 190)">
      <text x="690" y="200" font-family="system-ui, sans-serif" font-size="150"
            fill="url(#langGradient)" fill-opacity="0.8">ñ</text>
    </g>

    <g transform="rotate(6 840 210)">
      <text x="820" y="215" font-family="system-ui, sans-serif" font-size="110"
            fill="url(#langGradient)" fill-opacity="0.7">ج</text>
    </g>

    <!-- a couple of faint background glyphs for extra randomness -->
    <g transform="rotate(-24 320 210)">
      <text x="280" y="230" font-family="system-ui, sans-serif" font-size="190"
            fill="url(#langGradient)" fill-opacity="0.25">文</text>
    </g>

    <g transform="rotate(21 640 230)">
      <text x="610" y="245" font-family="system-ui, sans-serif" font-size="200"
            fill="url(#langGradient)" fill-opacity="0.22">字</text>
    </g>
  </g>
</svg>
`
const svgDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(charsSvg)}`

const NAVY = '#020617'        // page / deep background
const PANEL = '#020617'       // cards
const PANEL_SOFT = '#020617'  // inner areas

const BLUE = '#2563eb'        // from logo
const PURPLE = '#7c3aed'      // from logo
const GREEN = '#22c55e'       // from logo

const theme = createTheme({
    palette: {
        mode: 'dark',
        background: {
            default: NAVY,          // used by Boxes with bgcolor="background.default"
            paper: PANEL,           // used by Paper/Card
        },
        text: {
            primary: '#e5e7eb',
            secondary: '#9ca3af',
        },
        primary: {
            main: BLUE,
        },
        secondary: {
            main: GREEN,
        },
        divider: 'rgba(148, 163, 184, 0.35)',
        error: {
            main: '#ef4444',
        },
    },
    typography: {
        fontFamily:
            'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: 16,
        h4: {
            fontWeight: 600,
            letterSpacing: 0.01,
        },
        h6: {
            fontWeight: 600,
            fontSize: '1.02rem',
        },
        body1: {
            fontSize: '0.95rem',
            lineHeight: 1.6,
        },
        button: {
            textTransform: 'none',
            fontWeight: 500,
            letterSpacing: 0.02,
        },
    },
    shape: {
        borderRadius: 18,
    },
    components: {
        // Global body background
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    margin: 0,
                    minHeight: '100vh',
                    // SVG on top, gradient underneath
                    backgroundImage: [
                        `url("${svgDataUrl}")`,
                        'radial-gradient(circle at 0% 0%, #111827 0, #020617 40%, #000000 100%)',
                    ].join(','),
                    backgroundRepeat: 'no-repeat, no-repeat',
                    // Desktop: bottom-right bias
                    backgroundPosition: 'right 30% bottom 10%, center',
                    backgroundSize: 'auto 80vh, cover',
                    backgroundAttachment: 'fixed, fixed',
                    color: '#e5e7eb',
                    WebkitFontSmoothing: 'antialiased',
                    MozOsxFontSmoothing: 'grayscale',

                    // Mobile tweaks
                    '@media (max-width:600px)': {
                        // Center horizontally, push slightly below bottom so letters start ~middle
                        backgroundPosition: 'center bottom 10%, center',
                        // Make the SVG wider than the viewport so some part is always visible
                        backgroundSize: '120vw auto, cover',
                        // Avoid mobile "fixed background" bugs
                        backgroundAttachment: 'scroll, scroll',
                    },
                },
            },
        },

        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: 'transparent',
                    boxShadow: 'none',
                    borderBottom: '1px solid rgba(15,23,42,0.9)',
                    backdropFilter: 'blur(6px) saturate(1.1)',
                },
            },
        },
        MuiToolbar: {
            styleOverrides: {
                root: {
                    minHeight: 56,
                    paddingInline: 16,
                    gap: 16,
                },
            },
        },

        // Cards / panels (Input, Output, context history bar)
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundColor: PANEL,
                    backgroundImage: 'none',
                    borderRadius: 24,
                    border: '1px solid rgba(15,23,42,0.9)',
                    boxShadow:
                        '0 24px 80px rgba(15,23,42,0.85), 0 0 0 1px rgba(15,23,42,0.85)',
                },
            },
        },
        MuiCard: {
            defaultProps: {
                elevation: 0,
            },
            styleOverrides: {
                root: {
                    backgroundColor: PANEL,
                    borderRadius: 24,
                    border: '1px solid rgba(15,23,42,0.9)',
                },
            },
        },

        // Buttons (Original / Improve, etc.)
        MuiButton: {
            defaultProps: {
                disableElevation: true,
            },
            styleOverrides: {
                root: {
                    borderRadius: 999,
                    paddingInline: 16,
                },
                containedPrimary: {
                    background:
                        'linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #22c55e 100%)',
                    color: '#f9fafb',
                    '&:hover': {
                        background:
                            'linear-gradient(135deg, #1d4ed8 0%, #6d28d9 45%, #16a34a 100%)',
                    },
                },
                outlinedPrimary: {
                    borderColor: 'rgba(148, 163, 184, 0.7)',
                    color: '#e5e7eb',
                    backgroundColor: 'rgba(15,23,42,0.9)',
                    '&:hover': {
                        borderColor: BLUE,
                        backgroundColor: 'rgba(37,99,235,0.16)',
                    },
                },
            },
        },

        // Language chips / pills
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 999,
                    backgroundColor: PANEL_SOFT,
                    border: '1px solid rgba(148,163,184,0.45)',
                    color: '#e5e7eb',
                    fontSize: '0.85rem',
                },
                clickable: {
                    '&:hover': {
                        backgroundColor: 'rgba(37,99,235,0.18)',
                        borderColor: BLUE,
                    },
                },
                colorPrimary: {
                    background:
                        'linear-gradient(135deg, rgba(37,99,235,0.95), rgba(124,58,237,0.9))',
                    borderColor: 'transparent',
                    color: '#f9fafb',
                },
            },
        },

        // Text fields for input *and* output areas
        MuiTextField: {
            defaultProps: {
                variant: 'outlined',
                fullWidth: true,
            },
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        backgroundColor: PANEL_SOFT,
                        borderRadius: 18,
                        '& fieldset': {
                            borderColor: 'rgba(55,65,81,0.9)',
                        },
                        '&:hover fieldset': {
                            borderColor: 'rgba(148,163,184,0.9)',
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: BLUE,
                            boxShadow: '0 0 0 1px rgba(37,99,235,0.7)',
                        },
                    },
                    '& .MuiInputBase-input': {
                        color: '#e5e7eb',
                        fontSize: '0.98rem',
                    },
                    '& .MuiInputBase-input::placeholder': {
                        color: '#6b7280',
                        opacity: 1,
                    },
                },
            },
        },
        MuiInputBase: {
            styleOverrides: {
                root: {
                    color: '#e5e7eb',
                },
                multiline: {
                    padding: '14px 16px',
                },
            },
        },

        // Labels / helper text under Output
        MuiFormLabel: {
            styleOverrides: {
                root: {
                    color: '#9ca3af',
                    '&.Mui-focused': {
                        color: BLUE,
                    },
                },
            },
        },

        // Menu used for the “More” languages dropdown
        MuiMenu: {
            styleOverrides: {
                paper: {
                    backgroundColor: PANEL_SOFT,
                    borderRadius: 16,
                    border: '1px solid rgba(31,41,55,0.9)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.75)',
                },
            },
        },
        MuiMenuItem: {
            styleOverrides: {
                root: {
                    fontSize: '0.95rem',
                    '&:hover': {
                        backgroundColor: 'rgba(37,99,235,0.18)',
                    },
                },
            },
        },

        // Accordion-ish “Show context history”
        MuiAccordion: {
            styleOverrides: {
                root: {
                    backgroundColor: PANEL,
                    borderRadius: 999,
                    border: '1px solid rgba(31,41,55,0.9)',
                    boxShadow: 'none',
                    marginTop: 16,
                    '&:before': {display: 'none'},

                    '&:hover': {
                        borderColor: 'transparent',
                        boxShadow: '0 0 0 1px rgba(15,23,42,0.9)',
                        backgroundImage:
                            'linear-gradient(135deg, rgba(37,99,235,0.16), rgba(124,58,237,0.18), rgba(34,197,94,0.12))',
                    },

                    '&.Mui-expanded': {
                        margin: '16px 0 8px',
                        backgroundImage:
                            'linear-gradient(135deg, rgba(37,99,235,0.22), rgba(124,58,237,0.25), rgba(34,197,94,0.18))',
                        borderColor: 'rgba(59,130,246,0.7)',
                    },
                },
            },
        },

        MuiAccordionSummary: {
            styleOverrides: {
                root: {
                    paddingInline: 20,
                    minHeight: 52,
                    '& .MuiAccordionSummary-content': {
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                    },
                },
            },
        },

        MuiAccordionDetails: {
            styleOverrides: {
                root: {
                    padding: '8px 20px 16px',
                },
            },
        },
    }
})

export default theme