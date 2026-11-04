import { createContext } from 'react';
import type { Lang } from './types';

export interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export const I18nContext = createContext<I18nContextValue | null>(null);
