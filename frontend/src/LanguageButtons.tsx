import React from 'react'
import { LanguageSelector } from './components/LanguageSelector'

// The original tests import `LanguageButtons` from src/LanguageButtons
// Provide a default export compatible with the previous API.

interface Props {
  excludeLang?: string
  loading: boolean
  loadingTarget?: string | null
  onTranslate: (languageCode: string) => void
}

export default function LanguageButtons(props: Props) {
  const { excludeLang, loading, loadingTarget, onTranslate } = props
  return (
    <LanguageSelector
      excludeLang={excludeLang}
      loading={loading}
      loadingTarget={loadingTarget}
      onTranslate={onTranslate}
    />
  )
}
