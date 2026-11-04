import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { I18nContext } from './context';
import { LANGS, type Lang } from './types';

export const LANG_STORAGE_KEY = 'clearorigin-booking-prototype:lang';

/** `?lang=zh` (shareable link) → saved choice → browser language → English. */
function initialLang(): Lang {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('lang');
    if (fromUrl === 'en' || fromUrl === 'zh') {
      window.localStorage.setItem(LANG_STORAGE_KEY, fromUrl);
      return fromUrl;
    }
    const saved = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === 'en' || saved === 'zh') return saved;
  } catch {
    // storage blocked — fall through
  }
  return navigator.language?.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      // per-device convenience only
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = LANGS.find((l) => l.id === lang)?.htmlLang ?? 'en';
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang }), [lang, setLang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
