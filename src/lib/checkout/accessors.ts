import type { Booking, BookingMeeting, PaymentMode } from '@/types';

/** v1 bookings have no `meeting` block; derive one from their stored provider. */
export function meetingOf(booking: Booking): BookingMeeting {
  if (booking.meeting) return booking.meeting;
  return {
    provider: booking.meetingProvider,
    status: booking.status === 'held' || booking.status === 'pending_payment' ? 'awaiting_confirmation' : 'pending_creation',
    url: null,
  };
}

export function paymentModeOf(booking: Booking): PaymentMode {
  return booking.paymentMode ?? 'legacy';
}

/** Short, human-friendly reference derived from an id (no randomness, so it is stable). */
export function referenceFromId(id: string): string {
  return `CO-${id.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase()}`;
}
