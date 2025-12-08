import React, { useRef, useState, useEffect, forwardRef } from 'react';
import twemoji from 'twemoji';

const commonLanguages: { code: string; label: string }[] = [
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
];

// Helper: get primary language subtag (e.g., 'en' from 'en-US')
function getPrimaryLang(code: string): string {
  return code.split('-')[0].toLowerCase();
}

function flagSvgUrl(code: string): string | null {
  // Always use the primary language for flag lookup
  const lang = getPrimaryLang(code);
  // Map language to country code for flag emoji
  const langToCountry: Record<string, string> = {
    en: 'GB', ja: 'JP', es: 'ES', de: 'DE', fr: 'FR', it: 'IT', zh: 'CN', ko: 'KR', pt: 'PT', ru: 'RU', ar: 'SA', hi: 'IN', nl: 'NL', sv: 'SE', tr: 'TR'
  };
  const cc = langToCountry[lang] || lang.toUpperCase();
  if (!cc || cc.length !== 2) return null;
  const codePoints = [...cc].map(c => 127397 + c.charCodeAt(0));
  const emoji = String.fromCodePoint(...codePoints);
  const parsed = twemoji.parse(emoji, { folder: 'svg', ext: '.svg' });
  const match = /src="([^"]+)"/.exec(parsed);
  return match ? match[1] : null;
}

interface LanguageButtonsProps {
  excludeLang?: string; // BCP-47 code to exclude (e.g. detected source)
  loading: boolean;
  loadingTarget?: string | null; // show spinner on specific language
  onTranslate: (code: string) => void;
}

const LanguageButtons = forwardRef<HTMLDivElement, LanguageButtonsProps>(
  function LanguageButtons({ excludeLang, loading, loadingTarget, onTranslate }, ref) {
    // Compute visible languages, excluding the detected source if provided
    const exclude = excludeLang ? getPrimaryLang(excludeLang) : '';
    const availableLanguages = commonLanguages.filter(l => getPrimaryLang(l.code) !== exclude);
    const [visibleCount, setVisibleCount] = useState(availableLanguages.length);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number; alignRight?: boolean } | null>(null);
    const rowRef = useRef<HTMLDivElement>(null);
    const moreBtnRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
      if (typeof ref === 'function') ref(rowRef.current);
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = rowRef.current;
    }, [ref]);

    useEffect(() => {
      let frame: number | null = null;
      function measure() {
        console.log('LanguageButtons measure called');
        const row = rowRef.current;
        if (!row) return;
        var availableWidth = row.offsetWidth;
        console.log('containerWidth:', availableWidth);
        let visible = 0;

        // Build the full list of buttons in order to get their real widths. This should include the More button (size we need its width too)
        const btns = Array.from(row.children).filter(
          el => (el as HTMLElement).classList.contains('language-btn')
        ) as HTMLElement[];

        for (let i = 0; i < btns.length; ++i) {
          const w = btns[i].offsetWidth + 8;
          availableWidth -= w;
          visible++;
          if (availableWidth <= 220) break;
        }

        console.log('visible:', visible);
        setVisibleCount(visible);
      }
      function onResize() {
        if (frame) cancelAnimationFrame(frame);
        frame = requestAnimationFrame(measure);
      }
      window.addEventListener('resize', onResize);
      measure();
      return () => {
        window.removeEventListener('resize', onResize);
        if (frame) cancelAnimationFrame(frame);
      };
    }, [availableLanguages.length]);

    const openDropdown = () => {
      if (dropdownOpen) {
        setDropdownOpen(false);
        return;
      }
      if (moreBtnRef.current) {
        const rect = moreBtnRef.current.getBoundingClientRect();
        const menuWidth = 240;
        let left = rect.left + window.scrollX;
        let alignRight = false;
        if (left + menuWidth > window.innerWidth - 8) {
          left = Math.max(window.innerWidth - menuWidth - 8, 8);
          alignRight = true;
        }
        setDropdownPos({
          top: rect.bottom + window.scrollY + 4,
          left,
          width: rect.width,
          alignRight
        });
      }
      setDropdownOpen(true);
    };
    const closeDropdown = () => setDropdownOpen(false);

    // Close dropdown on outside click/tap
    useEffect(() => {
      if (!dropdownOpen) return;
      function handleEvent(e: MouseEvent | TouchEvent) {
        const menu = document.querySelector('.language-buttons-row .menu');
        const moreBtn = moreBtnRef.current;
        if (menu && (menu === e.target || (menu as HTMLElement).contains(e.target as Node))) return;
        if (moreBtn && (moreBtn === e.target || moreBtn.contains(e.target as Node))) return;
        setDropdownOpen(false);
      }
      document.addEventListener('mousedown', handleEvent);
      document.addEventListener('touchstart', handleEvent);
      return () => {
        document.removeEventListener('mousedown', handleEvent);
        document.removeEventListener('touchstart', handleEvent);
      };
    }, [dropdownOpen]);

    // Move selected language to front of the array
    function moveLangToFront(code: string) {
      const lang = getPrimaryLang(code);
      const idx = commonLanguages.findIndex(l => getPrimaryLang(l.code) === lang);
      if (idx > 0) {
        const [item] = commonLanguages.splice(idx, 1);
        commonLanguages.unshift(item);
      }
    }

    return (
      <div className="language-buttons-row" ref={rowRef}>
        {availableLanguages.map((l, i) => {
          const svg = flagSvgUrl(l.code);
          const isLoadingTarget = loadingTarget && getPrimaryLang(loadingTarget) === getPrimaryLang(l.code);
          return (
            <button
              key={l.code}
              className={`pill language-btn ${isLoadingTarget ? 'loading' : ''}`}
              style={{ display: i < visibleCount ? 'inline-flex' : 'none' }}
              onClick={() => onTranslate(l.code)}
              title={`Translate to ${l.label}`}
              disabled={loading}
            >
              {isLoadingTarget ? (
                <span className="btn-spinner" aria-hidden="true"><span className="spinner" style={{ width: 14, height: 14 }} /></span>
              ) : svg ? (
                <img src={svg} className="flag-img" alt="" />
              ) : (
                <span className="flag" role="img" aria-label="globe">🌐</span>
              )}
              <span className="label" style={{ marginLeft: 6 }}>{l.label}</span>
            </button>
          );
        })}
        {visibleCount < availableLanguages.length && (
          <div className="dropdown">
            <button
              className="pill"
              ref={moreBtnRef}
              aria-haspopup="menu"
              aria-expanded={dropdownOpen}
              onClick={openDropdown}
              style={{ minWidth: 80 }}
            >
              More ▾
            </button>
            {dropdownOpen && dropdownPos && (
              <ul
                className="menu"
                role="menu"
                style={{
                  top: dropdownPos.top,
                  left: dropdownPos.left,
                  minWidth: dropdownPos.width,
                  maxWidth: 280,
                  position: 'fixed',
                  zIndex: 9999,
                  right: dropdownPos.alignRight ? 8 : undefined
                }}
                onMouseLeave={closeDropdown}
                onTouchMove={e => {
                  // Prevent background scroll when scrolling the menu
                  e.stopPropagation();
                }}
                onWheel={e => {
                  // Prevent background scroll on wheel
                  e.stopPropagation();
                }}
              >
                {availableLanguages.slice(visibleCount).map((l) => {
                  const svg = flagSvgUrl(l.code);
                  return (
                    <li key={l.code} role="menuitem">
                      <button className="menu-item" onClick={()=>{ moveLangToFront(l.code); closeDropdown(); onTranslate(l.code) }}>
                        {svg ? (
                          <img src={svg} className="flag-img" alt="" />
                        ) : (
                          <span className="flag" role="img" aria-label="globe">🌐</span>
                        )}
                        {l.label} ({l.code})
                      </button>
                    </li>
                  );
                })}
                <li className="divider" />
                <li role="menuitem">
                  <button className="menu-item" onClick={() => {
                    const tag = prompt('Enter custom BCP‑47 language tag (e.g., en-GB)') || ''
                    const trimmed = tag.trim()
                    closeDropdown()
                    if (trimmed) { onTranslate(trimmed) }
                  }}>Custom…</button>
                </li>
              </ul>
            )}
          </div>
        )}
        {/* Add scrollable menu for mobile and ensure correct display type and pointer events */}
        <style>{`
@media (max-width: 600px) {
  .language-buttons-row .menu {
    max-height: 60vh;
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-y;
    display: block !important;
    width: 100vw !important;
    left: 0 !important;
    right: 0 !important;
    background: var(--panel, #222);
    pointer-events: auto;
    z-index: 9999;
  }
}
`}</style>
      </div>
    );
  }
);

export default LanguageButtons;
