import type { AppData, Booking, BookingStatus, MeetingLinkStatus } from '@/types';
import { meetingOf, paymentModeOf } from './accessors';

export type StatusTone = 'success' | 'pending' | 'warning' | 'neutral' | 'muted';

export interface StatusDescriptor {
  label: string;
  tone: StatusTone;
}

export const bookingStatusDescriptors: Record<BookingStatus, StatusDescriptor> = {
  held: { label: 'Held', tone: 'pending' },
  pending_payment: { label: 'Pending payment', tone: 'pending' },
  confirmed: { label: 'Confirmed', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'muted' },
  expired: { label: 'Hold expired', tone: 'muted' },
  completed: { label: 'Completed', tone: 'neutral' },
};

export const meetingStatusDescriptors: Record<MeetingLinkStatus, StatusDescriptor> = {
  awaiting_confirmation: { label: 'Link after confirmation', tone: 'neutral' },
  pending_creation: { label: 'Link not created (demo)', tone: 'neutral' },
  created: { label: 'Link ready', tone: 'success' },
  needs_attention: { label: 'Link needs attention', tone: 'warning' },
};

/**
 * Payment status for a booking, kept separate from the booking status (e.g.
 * "Cancelled" + "Refund pending review"). Never exposes method or provider
 * references, so it is safe to show to instructors.
 */
export function describePayment(booking: Booking, data: Pick<AppData, 'orders' | 'payments' | 'packageBalances'>): StatusDescriptor {
  const mode = paymentModeOf(booking);
  if (mode === 'legacy') return { label: 'Recorded before payments', tone: 'muted' };

  const order = booking.orderId ? data.orders.find((o) => o.id === booking.orderId) : undefined;

  if (!order) {
    const balance = data.packageBalances.find((b) => b.id === booking.packageBalanceId);
    const redemption = balance?.redemptions.find((r) => r.bookingId === booking.id);
    if (redemption?.status === 'restored') return { label: 'Credit returned', tone: 'neutral' };
    if (redemption?.status === 'forfeited') return { label: 'Credit used (late cancellation)', tone: 'muted' };
    if (redemption?.status === 'consumed') return { label: 'Package credit', tone: 'success' };
    return { label: 'Package credit (on confirmation)', tone: 'pending' };
  }

  switch (order.status) {
    case 'paid':
      return { label: order.kind === 'package' ? 'Paid · package (simulated)' : 'Paid (simulated)', tone: 'success' };
    case 'pending': {
      const attempts = data.payments.filter((p) => p.orderId === order.id);
      if (attempts.some((p) => p.status === 'processing')) return { label: 'Payment processing', tone: 'pending' };
      if (attempts.length > 0) return { label: 'Payment not completed', tone: 'warning' };
      return { label: 'Payment pending', tone: 'pending' };
    }
    case 'refund_pending':
      return { label: 'Refund pending review', tone: 'warning' };
    case 'refunded':
      return { label: 'Refunded', tone: 'neutral' };
    case 'expired':
      return { label: 'Not paid · hold expired', tone: 'muted' };
    case 'cancelled':
      return { label: 'Not paid · checkout cancelled', tone: 'muted' };
    case 'not_required':
      return { label: 'No payment required', tone: 'neutral' };
  }
}

export function describeMeeting(booking: Booking): StatusDescriptor {
  return meetingStatusDescriptors[meetingOf(booking).status];
}
