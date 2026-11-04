import type { ContentStatus } from '@/types';

/**
 * Configurable booking rules. These are DRAFT values for the prototype and
 * are not legally binding — ClearOrigin must confirm the real policy.
 */
export interface BookingPolicy {
  /** How long a checkout hold reserves a slot. */
  holdMinutes: number;
  /** Cancelling at least this long before the start restores a credit / opens a refund review. */
  cancellationNoticeHours: number;
  /** Rescheduling is allowed until this long before the start. */
  rescheduleNoticeHours: number;
  /** A payment still "processing" after this long is treated as timed out (e.g. after a page reload). */
  paymentTimeoutSeconds: number;
  status: ContentStatus;
}

export const bookingPolicy: BookingPolicy = {
  holdMinutes: 10,
  cancellationNoticeHours: 24,
  rescheduleNoticeHours: 24,
  paymentTimeoutSeconds: 30,
  status: 'proposed',
};

/** Plain-language summary shown at checkout and before cancelling. */
export function policySummary(policy: BookingPolicy = bookingPolicy): string[] {
  return [
    `Your time is held for ${policy.holdMinutes} minutes while you check out. Unpaid holds are released automatically.`,
    `You can reschedule up to ${policy.rescheduleNoticeHours} hours before the lesson starts.`,
    `Cancelling at least ${policy.cancellationNoticeHours} hours ahead returns a package credit, or opens a refund review for paid lessons. Later cancellations may not be eligible.`,
    'Refunds are reviewed by ClearOrigin and are never automatic in this prototype.',
  ];
}
