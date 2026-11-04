import type { AppData, Booking, BookingStatus, MeetingLinkStatus } from '@/types';
import { meetingOf, paymentModeOf } from './accessors';

export type StatusTone = 'success' | 'pending' | 'warning' | 'neutral' | 'muted';

export interface StatusDescriptor {
  /** English label (source text). The UI translates via `group` + `key`. */
  label: string;
  tone: StatusTone;
  group: 'booking' | 'meeting' | 'payment';
  key: string;
}

export const bookingStatusDescriptors: Record<BookingStatus, StatusDescriptor> = {
  held: { label: 'Held', tone: 'pending', group: 'booking', key: 'held' },
  pending_payment: { label: 'Pending payment', tone: 'pending', group: 'booking', key: 'pending_payment' },
  confirmed: { label: 'Confirmed', tone: 'success', group: 'booking', key: 'confirmed' },
  cancelled: { label: 'Cancelled', tone: 'muted', group: 'booking', key: 'cancelled' },
  expired: { label: 'Hold expired', tone: 'muted', group: 'booking', key: 'expired' },
  completed: { label: 'Completed', tone: 'neutral', group: 'booking', key: 'completed' },
};

export const meetingStatusDescriptors: Record<MeetingLinkStatus, StatusDescriptor> = {
  awaiting_confirmation: { label: 'Link after confirmation', tone: 'neutral', group: 'meeting', key: 'awaiting_confirmation' },
  pending_creation: { label: 'Link not created (demo)', tone: 'neutral', group: 'meeting', key: 'pending_creation' },
  created: { label: 'Link ready', tone: 'success', group: 'meeting', key: 'created' },
  needs_attention: { label: 'Link needs attention', tone: 'warning', group: 'meeting', key: 'needs_attention' },
};

const pay = (key: string, label: string, tone: StatusTone): StatusDescriptor => ({ label, tone, group: 'payment', key });

/**
 * Payment status for a booking, kept separate from the booking status (e.g.
 * "Cancelled" + "Refund pending review"). Never exposes method or provider
 * references, so it is safe to show to instructors.
 */
export function describePayment(booking: Booking, data: Pick<AppData, 'orders' | 'payments' | 'packageBalances'>): StatusDescriptor {
  const mode = paymentModeOf(booking);
  if (mode === 'legacy') return pay('legacy', 'Recorded before payments', 'muted');

  const order = booking.orderId ? data.orders.find((o) => o.id === booking.orderId) : undefined;

  if (!order) {
    const balance = data.packageBalances.find((b) => b.id === booking.packageBalanceId);
    const redemption = balance?.redemptions.find((r) => r.bookingId === booking.id);
    if (redemption?.status === 'restored') return pay('credit_restored', 'Credit returned', 'neutral');
    if (redemption?.status === 'forfeited') return pay('credit_forfeited', 'Credit used (late cancellation)', 'muted');
    if (redemption?.status === 'consumed') return pay('credit_consumed', 'Package credit', 'success');
    return pay('credit_pending', 'Package credit (on confirmation)', 'pending');
  }

  switch (order.status) {
    case 'paid':
      return order.kind === 'package' ? pay('paid_package', 'Paid · package (simulated)', 'success') : pay('paid', 'Paid (simulated)', 'success');
    case 'pending': {
      const attempts = data.payments.filter((p) => p.orderId === order.id);
      if (attempts.some((p) => p.status === 'processing')) return pay('processing', 'Payment processing', 'pending');
      if (attempts.length > 0) return pay('not_completed', 'Payment not completed', 'warning');
      return pay('pending', 'Payment pending', 'pending');
    }
    case 'refund_pending':
      return pay('refund_pending', 'Refund pending review', 'warning');
    case 'refunded':
      return pay('refunded', 'Refunded', 'neutral');
    case 'expired':
      return pay('expired', 'Not paid · hold expired', 'muted');
    case 'cancelled':
      return pay('cancelled', 'Not paid · checkout cancelled', 'muted');
    case 'not_required':
      return pay('not_required', 'No payment required', 'neutral');
  }
}

export function describeMeeting(booking: Booking): StatusDescriptor {
  return meetingStatusDescriptors[meetingOf(booking).status];
}
