import twemoji from 'twemoji'
import { getPrimaryLang, LANGUAGE_TO_COUNTRY } from '../utils/languages'

export function getFlagSvgUrl(languageCode: string): string | null {
  const lang = getPrimaryLang(languageCode)
  const countryCode = LANGUAGE_TO_COUNTRY[lang] || lang.toUpperCase()

  if (!countryCode || countryCode.length !== 2) return null

  const codePoints = [...countryCode].map(c => 127397 + c.charCodeAt(0))
  const emoji = String.fromCodePoint(...codePoints)
  const parsed = twemoji.parse(emoji, { folder: 'svg', ext: '.svg' })
  const match = /src="([^"]+)"/.exec(parsed)

  return match ? match[1] : null
}
