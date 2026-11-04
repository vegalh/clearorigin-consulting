import { useAppData } from '@/state/AppDataContext';

export function Footer() {
  const { resetDemoData } = useAppData();

  return (
    <footer className="border-t border-co-line bg-co-paper">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-xs sm:px-6 text-co-muted sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl leading-relaxed">
          This is an interactive prototype built to demonstrate a booking experience for{' '}
          <a
            href="https://clearoriginconsulting.com"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-co-orange-dark underline underline-offset-2"
          >
            ClearOrigin Consulting
          </a>
          . Instructors, courses, prices, availability, and bookings shown here are fictional demo data stored only in this
          browser. Payments are simulated — no real money moves, no payment details are collected, and no real meeting links are
          created.
        </p>
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Reset all demo data back to the original seed? This clears anything you changed in this browser.')) {
              resetDemoData();
            }
          }}
          className="shrink-0 rounded-full border border-co-line px-4 py-2 font-medium text-co-ink transition-colors hover:border-co-orange-dark hover:text-co-orange-dark"
        >
          Reset demo data
        </button>
      </div>
    </footer>
  );
}
