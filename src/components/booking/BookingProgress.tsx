import { Check } from 'lucide-react';
import { BOOKING_STEPS, type BookingStep } from './bookingSteps';

/**
 * Course → Schedule → Details → Payment → Confirmation. On phones it collapses
 * to "Step 3 of 5 · Details" plus a slim bar so the current step stays clear
 * without crowding the screen.
 */
export function BookingProgress({ current }: { current: BookingStep }) {
  const index = BOOKING_STEPS.indexOf(current);
  return (
    <nav aria-label="Booking progress" className="mb-8">
      <div className="sm:hidden">
        <p className="text-xs font-medium text-co-muted">
          Step {index + 1} of {BOOKING_STEPS.length} · <span className="text-co-ink">{current}</span>
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-co-line">
          <div className="h-full rounded-full bg-co-orange-dark" style={{ width: `${((index + 1) / BOOKING_STEPS.length) * 100}%` }} />
        </div>
      </div>
      <ol className="hidden items-center gap-2 sm:flex">
        {BOOKING_STEPS.map((step, i) => {
          const state = i < index ? 'done' : i === index ? 'current' : 'upcoming';
          return (
            <li key={step} className="flex flex-1 items-center gap-2 last:flex-none" aria-current={state === 'current' ? 'step' : undefined}>
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  state === 'done'
                    ? 'bg-co-sage-dark text-white'
                    : state === 'current'
                      ? 'bg-co-orange-dark text-white'
                      : 'border border-co-line bg-co-paper text-co-muted'
                }`}
              >
                {state === 'done' ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : i + 1}
              </span>
              <span className={`whitespace-nowrap text-sm ${state === 'current' ? 'font-medium text-co-ink' : 'text-co-muted'}`}>{step}</span>
              {i < BOOKING_STEPS.length - 1 && <span className="mx-1 h-px flex-1 bg-co-line" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
