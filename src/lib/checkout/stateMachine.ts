import type { BookingStatus, OrderStatus, PaymentStatus } from '@/types';

/**
 * The single source of truth for which status changes are legal. Every
 * mutation in services/checkoutService.ts goes through `assertTransition`,
 * so an illegal jump (e.g. held → confirmed without payment, or confirming an
 * expired hold) fails loudly instead of silently corrupting local state.
 */
export const BOOKING_TRANSITIONS: Record<BookingStatus, readonly BookingStatus[]> = {
  // held → confirmed is only used for package-credit redemption (no payment involved).
  held: ['pending_payment', 'confirmed', 'expired', 'cancelled'],
  // pending_payment → held when an attempt fails / is cancelled / times out and the hold still has time.
  pending_payment: ['confirmed', 'held', 'expired', 'cancelled'],
  confirmed: ['cancelled', 'completed'],
  cancelled: [],
  expired: [],
  completed: [],
};

export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ['paid', 'expired', 'cancelled', 'refund_pending'],
  paid: ['refund_pending'],
  refund_pending: ['refunded'],
  refunded: [],
  expired: ['refund_pending'],
  cancelled: [],
  not_required: [],
};

export const PAYMENT_TRANSITIONS: Record<PaymentStatus, readonly PaymentStatus[]> = {
  processing: ['succeeded', 'failed', 'cancelled', 'timed_out'],
  succeeded: [],
  failed: [],
  cancelled: [],
  timed_out: [],
};

export function canTransitionBooking(from: BookingStatus, to: BookingStatus): boolean {
  return BOOKING_TRANSITIONS[from].includes(to);
}

export function canTransitionOrder(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
}

export function canTransitionPayment(from: PaymentStatus, to: PaymentStatus): boolean {
  return PAYMENT_TRANSITIONS[from].includes(to);
}

export class TransitionError extends Error {}

export function assertTransition(kind: 'booking' | 'order' | 'payment', from: string, to: string): void {
  const table: Record<string, readonly string[]> =
    kind === 'booking' ? BOOKING_TRANSITIONS : kind === 'order' ? ORDER_TRANSITIONS : PAYMENT_TRANSITIONS;
  if (!table[from]?.includes(to)) {
    throw new TransitionError(`Illegal ${kind} transition: ${from} → ${to}`);
  }
}

/** Statuses that represent an in-progress checkout (the slot is reserved but not confirmed). */
export const CHECKOUT_STATUSES: readonly BookingStatus[] = ['held', 'pending_payment'];
