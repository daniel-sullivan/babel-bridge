import { Language } from '../types/translation'

export const COMMON_LANGUAGES: Language[] = [
  { code: 'ja', label: 'Japanese' },
  { code: 'en', label: 'English' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'es', label: 'Spanish' },
  { code: 'de', label: 'German' },
  { code: 'fr', label: 'French' },
  { code: 'it', label: 'Italian' },
  { code: 'zh', label: 'Chinese (zh)' },
  { code: 'ko', label: 'Korean' },
  { code: 'ru', label: 'Russian' },
  { code: 'ar', label: 'Arabic' },
  { code: 'hi', label: 'Hindi' },
  { code: 'nl', label: 'Dutch' },
  { code: 'sv', label: 'Swedish' },
  { code: 'tr', label: 'Turkish' },
]

export const LANGUAGE_NAMES: Record<string, string> = {
  'en': 'English',
  'en-US': 'American English',
  'ja': 'Japanese',
  'ja-JP': 'Japanese',
  'es': 'Spanish',
  'es-ES': 'Spanish',
  'de': 'German',
  'de-DE': 'German',
  'fr': 'French',
  'it': 'Italian',
  'pt': 'Portuguese',
  'zh': 'Chinese',
  'ko': 'Korean',
  'ru': 'Russian',
  'ar': 'Arabic',
  'hi': 'Hindi',
  'nl': 'Dutch',
  'sv': 'Swedish',
  'tr': 'Turkish'
}

export const LANGUAGE_TO_COUNTRY: Record<string, string> = {
  en: 'GB',
  ja: 'JP',
  es: 'ES',
  de: 'DE',
  fr: 'FR',
  it: 'IT',
  zh: 'CN',
  ko: 'KR',
  pt: 'PT',
  ru: 'RU',
  ar: 'SA',
  hi: 'IN',
  nl: 'NL',
  sv: 'SE',
  tr: 'TR'
}

export function toLanguageName(langTag: string): string {
  return LANGUAGE_NAMES[langTag] || langTag
}

export function getPrimaryLang(code: string): string {
  return code.split('-')[0].toLowerCase()
}

export function getAvailableLanguages(excludeLang?: string): Language[] {
  if (!excludeLang) return COMMON_LANGUAGES

  const exclude = getPrimaryLang(excludeLang)
  return COMMON_LANGUAGES.filter(l => getPrimaryLang(l.code) !== exclude)
}
