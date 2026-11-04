import { useAppData } from '@/state/AppDataContext';
import { useI18n } from '@/i18n/useI18n';

export function Footer() {
  const { resetDemoData } = useAppData();
  const { m } = useI18n();

  return (
    <footer className="border-t border-co-line bg-co-paper">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-xs text-co-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="max-w-2xl leading-relaxed">
          {m.footer.beforeLink}
          <a
            href="https://clearoriginconsulting.com"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-co-orange-dark underline underline-offset-2"
          >
            ClearOrigin Consulting
          </a>
          {m.footer.afterLink}
        </p>
        <button
          type="button"
          onClick={() => {
            if (window.confirm(m.footer.resetConfirm)) {
              resetDemoData();
            }
          }}
          className="shrink-0 rounded-full border border-co-line px-4 py-2 font-medium text-co-ink transition-colors hover:border-co-orange-dark hover:text-co-orange-dark"
        >
          {m.footer.reset}
        </button>
      </div>
    </footer>
  );
}
