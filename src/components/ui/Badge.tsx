import type { ReactNode } from 'react';
import type { BookingStatus } from '@/types';
import { bookingStatusDescriptors, type StatusDescriptor, type StatusTone } from '@/lib/checkout';
import { useI18n } from '@/i18n/useI18n';

const toneClasses: Record<StatusTone, string> = {
  success: 'bg-co-sage/25 text-co-sage-dark',
  pending: 'bg-co-pale/70 text-co-orange-dark',
  warning: 'bg-co-clay/15 text-co-clay',
  neutral: 'bg-co-ink/5 text-co-muted',
  muted: 'bg-co-line text-co-muted',
};

/** A small rounded status label. `prefix` (e.g. "Booking", "Payment") keeps different statuses distinguishable. */
export function StatusPill({ descriptor, prefix }: { descriptor: StatusDescriptor; prefix?: string }) {
  const { m } = useI18n();
  const labels = m.status[descriptor.group] as Record<string, string>;
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${toneClasses[descriptor.tone]}`}>
      {prefix && <span className="font-normal opacity-75">{prefix}:</span>}
      {labels[descriptor.key] ?? descriptor.label}
    </span>
  );
}

export function StatusBadge({ status, prefix }: { status: BookingStatus; prefix?: string }) {
  return <StatusPill descriptor={bookingStatusDescriptors[status]} prefix={prefix} />;
}

export function Badge({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full bg-co-sage/25 px-3 py-1 text-xs font-medium text-co-sage-dark ${className}`}>
      {children}
    </span>
  );
}

/** Marks content (copy, prices, policy) that ClearOrigin has not yet approved. */
export function DraftLabel({ children }: { children?: ReactNode }) {
  const { m } = useI18n();
  return (
    <span className="inline-flex items-center rounded-full border border-dashed border-co-clay/50 px-2.5 py-0.5 text-[11px] font-medium text-co-clay">
      {children ?? m.common.draftPending}
    </span>
  );
}

/** Labels anything simulated in the prototype (payments, meetings). */
export function DemoLabel({ children }: { children?: ReactNode }) {
  const { m } = useI18n();
  return (
    <span className="inline-flex items-center rounded-full bg-co-ink px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-co-bg">
      {children ?? m.common.demo}
    </span>
  );
}
