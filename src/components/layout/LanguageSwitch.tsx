import { useI18n } from '@/i18n/useI18n';
import { LANGS } from '@/i18n/types';

/** EN | 中文 segmented switch. The choice is remembered on this device. */
export function LanguageSwitch() {
  const { lang, setLang, m } = useI18n();
  return (
    <div role="group" aria-label={m.nav.language} className="flex items-center rounded-full border border-co-line p-0.5 text-xs">
      {LANGS.map((l) => (
        <button
          key={l.id}
          type="button"
          lang={l.htmlLang}
          onClick={() => setLang(l.id)}
          aria-pressed={lang === l.id}
          className={`rounded-full px-2.5 py-1 font-medium transition-colors ${
            lang === l.id ? 'bg-co-ink text-co-bg' : 'text-co-muted hover:text-co-ink'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
