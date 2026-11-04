import { Clock } from 'lucide-react';

/** Calm, non-animated countdown for a checkout hold. */
export function HoldCountdown({ expiresAt, now }: { expiresAt: string; now: Date }) {
  const remainingMs = Math.max(0, new Date(expiresAt).getTime() - now.getTime());
  const minutes = Math.floor(remainingMs / 60_000);
  const seconds = Math.floor((remainingMs % 60_000) / 1000);
  const low = remainingMs < 2 * 60_000;
  return (
    <div
      role="timer"
      aria-live="off"
      className={`flex items-center gap-2 rounded-co-sm border px-3 py-2 text-sm ${
        low ? 'border-co-orange-dark/40 bg-co-pale/50 text-co-orange-dark' : 'border-co-line bg-co-paper text-co-ink'
      }`}
    >
      <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>
        Time held for you: <strong className="tabular-nums">{minutes}:{String(seconds).padStart(2, '0')}</strong>
      </span>
    </div>
  );
}
