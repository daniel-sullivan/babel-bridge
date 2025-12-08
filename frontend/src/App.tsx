import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { improveTranslation, previewTranslation, startTranslation, identifyLanguage } from './api'
import logoUrl from './assets/logo.svg'
import LanguageButtons from './LanguageButtons';

type Message = { id: string; text: string }

// Utility function for generating UUIDs
function uuidv4() {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      const r = array[0] % 16;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  // Fallback: Math.random (not cryptographically secure)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c: string) {
    var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Language helper function
const toLanguageName = (langTag: string): string => {
  const names: Record<string, string> = {
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
  };
  return names[langTag] || langTag;
};

export default function App() {
  // Core state
  const [isChain, setIsChain] = useState(false)
  const [messages, setMessages] = useState<Message[]>([{ id: uuidv4(), text: '' }])
  const [lang, setLang] = useState('ja')
  const [customLang, setCustomLang] = useState('')
  const [loading, setLoading] = useState<'translate' | 'improve' | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Translation state
  const [contextId, setContextId] = useState<string | null>(null)
  const [output, setOutput] = useState<string>('')
  const [sourceLang, setSourceLang] = useState<string>('')
  const [sourceLangLoading, setSourceLangLoading] = useState<boolean>(false)
  const [reverseView, setReverseView] = useState<{
    active: boolean
    forwardText: string
    preview?: string
  }>({ active: false, forwardText: '' })

  // UI state
  const [improveOpen, setImproveOpen] = useState(false)
  const [improveFeedback, setImproveFeedback] = useState('')
  const [historyOpen, setHistoryOpen] = useState(false)
  const [history, setHistory] = useState<
    ({ kind: 'initial'; text: string; at: number } | { kind: 'improve'; feedback: string; text: string; at: number })[]
  >([])
  const [historyReverse, setHistoryReverse] = useState<Record<number, { active: boolean; preview?: string }>>({})

  // Track which target language button is showing loading
  const [translatingTarget, setTranslatingTarget] = useState<string | null>(null)

  // Refs
  const improveInput = useRef<HTMLInputElement>(null)
  const singleTextareaRef = useRef<HTMLTextAreaElement>(null)

  // Computed values
  const selectedLang = useMemo(() => (customLang.trim() ? customLang.trim() : lang), [lang, customLang])
  const lastMessage = messages[messages.length - 1]

  // Auto-resize single textarea
  useEffect(() => {
    if (!isChain && singleTextareaRef.current) {
      const textarea = singleTextareaRef.current
      const adjustHeight = () => {
        textarea.style.height = 'auto'
        textarea.style.height = `${textarea.scrollHeight}px`
      }
      adjustHeight()

      const handleInput = () => adjustHeight()
      textarea.addEventListener('input', handleInput)
      return () => textarea.removeEventListener('input', handleInput)
    }
  }, [isChain, lastMessage.text])

  // Debounced language identification
  const debouncedIdentify = useCallback(async (text: string) => {
    if (!text.trim()) {
      setSourceLang('')
      setSourceLangLoading(false)
      return
    }

    try {
      setSourceLangLoading(true)
      const res = await identifyLanguage({ source: text.trim() })
      setSourceLang(res.lang)

      // Auto-switch if detected language matches selected
      if (res.lang && selectedLang.toLowerCase() === res.lang.toLowerCase()) {
        setLang(res.lang.toLowerCase() === 'en' ? 'ja' : 'en');
        setCustomLang('');
      }
    } catch (e) {
      console.error('Language identification failed:', e)
      setSourceLang('')
    } finally {
      setSourceLangLoading(false)
    }
  }, [selectedLang])

  // Debounced identification effect
  useEffect(() => {
    if (!lastMessage.text.trim()) {
      setSourceLang('')
      setSourceLangLoading(false)
      return
    }

    const timeoutId = setTimeout(() => {
      debouncedIdentify(lastMessage.text)
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [lastMessage.text, debouncedIdentify])

  // Message management
  const updateMessage = useCallback((id: string, text: string) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, text } : m))
  }, [])

  const addMessage = useCallback(() => {
    const newMessage = { id: uuidv4(), text: '' }
    setMessages(prev => [...prev, newMessage])
    if (!isChain) setIsChain(true)
  }, [isChain])

  const removeMessage = useCallback((id: string) => {
    setMessages(prev => {
      const filtered = prev.filter(m => m.id !== id)
      // Keep at least one message
      return filtered.length > 0 ? filtered : [{ id: uuidv4(), text: '' }]
    })
  }, [])

  // Translation functions
  const handleTranslate = useCallback(async (targetLang: string) => {
    if (!lastMessage.text.trim()) {
      setError('Please enter a message to translate')
      return
    }

    setLoading('translate')
    setTranslatingTarget(targetLang)
    setError(null)
    setReverseView({ active: false, forwardText: '' })

    try {
      const res = await startTranslation({
        source: lastMessage.text.trim(),
        lang: targetLang
      })

      // Update selected language for footer display
      setLang(targetLang)
      setCustomLang('')

      setContextId(res.contextId)
      setOutput(res.result)
      setSourceLang(res.sourceLang || '')
      setReverseView({ active: false, forwardText: res.result })

      const historyItem = {
        kind: 'initial' as const,
        text: res.result,
        at: Date.now()
      }
      setHistory([historyItem])
      setHistoryReverse({})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Translation failed')
      console.error('Translation error:', err)
    } finally {
      setLoading(null)
      setTranslatingTarget(null)
    }
  }, [lastMessage.text])

  const handleImprove = useCallback(async (feedback: string) => {
    if (!contextId) return

    setLoading('improve')
    try {
      const res = await improveTranslation({
        contextId,
        feedback: feedback.trim()
      })

      setOutput(res.result)
      setReverseView({ active: false, forwardText: res.result })

      const historyItem = {
        kind: 'improve' as const,
        feedback: feedback.trim(),
        text: res.result,
        at: Date.now()
      }
      setHistory(prev => [...prev, historyItem])
      setHistoryReverse({})
      setImproveOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Improvement failed')
      console.error('Improve error:', err)
    } finally {
      setLoading(null)
    }
  }, [contextId])

  const handleReverse = useCallback(async () => {
    if (!reverseView.forwardText || !sourceLang) return

    if (reverseView.active) {
      setReverseView(prev => ({ ...prev, active: false }))
      setOutput(reverseView.forwardText)
      return
    }

    if (reverseView.preview) {
      setReverseView(prev => ({ ...prev, active: true }))
      setOutput(reverseView.preview)
      return
    }

    try {
      const res = await previewTranslation({
        source: reverseView.forwardText,
        lang: sourceLang.split('-')[0]
      })

      setReverseView(prev => ({
        ...prev,
        active: true,
        preview: res.result
      }))
      setOutput(res.result)
    } catch (err) {
      console.error('Reverse preview error:', err)
      setError('Preview failed')
    }
  }, [reverseView, sourceLang])

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <img src={logoUrl} alt="BabelBridge logo" className="logo" />
          <span>BabelBridge</span>
        </div>
      </header>

      <main className="content">
        <section className="composer">
          {isChain ? (
            <>
              <div className="composer-header">
                <h2>Input{sourceLang && ` — ${toLanguageName(sourceLang)}`}</h2>
                {sourceLangLoading && (
                  <span className="lang-loading" aria-live="polite" aria-hidden="false" title="Detecting language">
                    <span className="spinner" style={{ width: 14, height: 14 }} />
                  </span>
                )}
                {sourceLang && !sourceLangLoading && <div className="sr-only" aria-live="polite">Detected language: {toLanguageName(sourceLang)}</div>}
              </div>
              <ol className="messages">
                {messages.map((m, i) => (
                  <li key={m.id} className="message">
                    <div className="message-row">
                      <textarea
                        value={m.text}
                        onChange={(e) => updateMessage(m.id, e.target.value)}
                        placeholder={i === messages.length - 1 ? 'Final message to translate…' : 'Earlier context (optional)…'}
                        style={{ minHeight: '40px' }}
                      />
                      <div className="msg-actions">
                        <span className="index">{i + 1}</span>
                        {messages.length > 1 && (
                          <button className="icon-btn" aria-label="Remove message" title="Remove message" onClick={() => removeMessage(m.id)}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
              <div>
                <button className="icon-btn" aria-label="Add message" title="Add message" onClick={addMessage}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <span className="icon-label">Add</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="composer-header">
                <h2>Input{sourceLang && ` — ${toLanguageName(sourceLang)}`}</h2>
                {sourceLangLoading && (
                  <span className="lang-loading" aria-live="polite" aria-hidden="false" title="Detecting language">
                    <span className="spinner" style={{ width: 14, height: 14 }} />
                  </span>
                )}
                {sourceLang && !sourceLangLoading && <div className="sr-only" aria-live="polite">Detected language: {toLanguageName(sourceLang)}</div>}
              </div>
              <div className="single-message-row">
                <textarea
                  ref={singleTextareaRef}
                  className="single"
                  value={lastMessage.text}
                  onChange={(e) => updateMessage(lastMessage.id, e.target.value)}
                  placeholder="Enter text to translate…"
                />
                <div className="single-actions">
                  <button className="icon-btn" aria-label="Add message" title="Add message" onClick={addMessage}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span className="icon-label">Add</span>
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="translate-controls" role="group" aria-label="Translate to">
            <LanguageButtons
              excludeLang={sourceLang}
              loading={loading === 'translate'}
              loadingTarget={translatingTarget}
              onTranslate={handleTranslate}
            />
          </div>
        </section>

        <section className="result">
          <div className="result-header">
            <h2>Output</h2>
            <div className="spacer" />
            {output && sourceLang && (
              <button
                className="ghost small"
                onClick={handleReverse}
                title={reverseView.active ? `Show translation` : `Show in original (${toLanguageName(sourceLang)})`}
              >
                {reverseView.active ? 'Show translation' : `Original (${toLanguageName(sourceLang)})`}
              </button>
            )}
            <button
              className="secondary"
              disabled={!output || loading === 'improve'}
              onClick={() => {setImproveOpen(true); setImproveFeedback('')}}
            >
              {loading === 'improve' ? 'Improving…' : 'Improve'}
            </button>
          </div>

          <div id="output" className={`output ${output ? 'fade-in' : ''}`} aria-live="polite">
            {output || 'No output yet'}
          </div>

          {sourceLang && output && (
            <div className="detected-lang muted">
              Translated from {toLanguageName(sourceLang)}
            </div>
          )}

          {history.length > 0 && (
            <div className="history-inline">
              <button
                className="history-toggle"
                onClick={() => setHistoryOpen(prev => !prev)}
              >
                <span>{historyOpen ? 'Hide' : 'Show'} context history</span>
                <span className="count">{history.length}</span>
              </button>

              {historyOpen && (
                <ol className="history-list">
                  {history.map((item, i) => (
                    <li key={i} className="history-item">
                      <div className="row">
                        <span className="badge">
                          {item.kind === 'initial' ? 'Initial' : `Improve: ${item.feedback}`}
                        </span>
                        <span className="time">
                          {new Date(item.at).toLocaleString()}
                        </span>
                        {sourceLang && (
                          <button
                            className="ghost small"
                            onClick={() => {
                              const reverse = historyReverse[i]
                              if (reverse?.active) {
                                setHistoryReverse(prev => ({
                                  ...prev,
                                  [i]: { ...reverse, active: false }
                                }))
                              } else {
                                setHistoryReverse(prev => ({
                                  ...prev,
                                  [i]: { active: true, preview: reverse?.preview }
                                }))
                              }
                            }}
                            title={historyReverse[i]?.active ? 'Show translation' : `Show in original (${toLanguageName(sourceLang)})`}
                          >
                            {historyReverse[i]?.active ? 'Show translation' : `Original (${toLanguageName(sourceLang)})`}
                          </button>
                        )}
                      </div>
                      <div className="text" id={`history-text-${i}`}>
                        {historyReverse[i]?.active ? (historyReverse[i].preview || 'Loading...') : item.text}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </section>
      </main>

      <footer className="footer">
        <span>Last target: {toLanguageName(selectedLang)} {selectedLang === 'ja' ? '🇯🇵' : selectedLang === 'es' ? '🇪🇸' : selectedLang === 'de' ? '🇩🇪' : selectedLang === 'en' ? '🇺🇸' : '🌐'}</span>
        <span className="dot" />
        <a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie" target="_blank" rel="noreferrer">
          Session via cookie
        </a>
      </footer>

      {/* Error Modal */}
      {error && (
        <div className="modal-backdrop" onClick={() => setError(null)}>
          <div className="modal error-modal" onClick={(e) => e.stopPropagation()}>
            <div className="error" role="alert">
              <div className="error-content">
                <h3>Error</h3>
                <p>{error}</p>
              </div>
              <button className="ghost" aria-label="Dismiss" onClick={() => setError(null)}>×</button>
            </div>
          </div>
        </div>
      )}

      {/* Improve Modal */}
      {improveOpen && (
        <div className="modal-backdrop" onClick={() => {setImproveOpen(false); setImproveFeedback('')}}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Improve output</h3>
            <input
              ref={improveInput}
              className="modal-input"
              type="text"
              value={improveFeedback}
              onChange={(e) => setImproveFeedback(e.target.value)}
              placeholder="e.g. More formal, add details..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && improveFeedback.trim()) {
                  handleImprove(improveFeedback)
                  setImproveFeedback('')
                }
                if (e.key === 'Escape') {
                  setImproveOpen(false)
                  setImproveFeedback('')
                }
              }}
              autoFocus
            />
            <div className="modal-actions">
              <button
                className="ghost"
                onClick={() => {setImproveOpen(false); setImproveFeedback('')}}
              >
                Cancel
              </button>
              <button
                className={`primary ${loading === 'improve' ? 'loading' : ''}`}
                onClick={() => {
                  if (improveFeedback.trim()) {
                    handleImprove(improveFeedback)
                    setImproveFeedback('')
                  }
                }}
                disabled={!improveFeedback.trim() || loading === 'improve'}
                tabIndex={0}
                aria-label="Apply"
              >
                <span className="btn-spinner" aria-hidden="true"><span className="spinner" style={{ width: 16, height: 16 }} /></span>
                <span className="modal-label">Apply</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
