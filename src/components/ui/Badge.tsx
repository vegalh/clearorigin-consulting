import type { ReactNode } from 'react';
import type { BookingStatus } from '@/types';

const statusClasses: Record<BookingStatus, string> = {
  confirmed: 'bg-co-pale text-co-green',
  cancelled: 'bg-co-line text-co-muted line-through',
  completed: 'bg-co-ink/5 text-co-muted',
};

const statusLabels: Record<BookingStatus, string> = {
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  completed: 'Completed',
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statusClasses[status]}`}>
      {statusLabels[status]}
    </span>
  );
}

export function Badge({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full bg-co-pale px-3 py-1 text-xs font-medium text-co-green ${className}`}>
      {children}
    </span>
  );
}
