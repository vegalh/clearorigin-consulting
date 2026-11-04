import type { Booking, MeetingProvider } from '@/types';

/**
 * Integration points for a future real backend.
 *
 * `availabilityService` + `bookingService` together act as today's "local
 * scheduling provider": they expose the same shape of operations
 * (read availability, confirm, cancel, reschedule) that a real provider like
 * Cal.com, Calendly, or a custom Supabase-backed API would need to support.
 * Swapping the backend later means replacing what's inside those two files
 * (and `storageService`) — the pages and components do not talk to
 * localStorage or the scheduling engine directly, only to these services.
 *
 * See docs/PROTOTYPE_PLAN.md §8 for the provider comparison.
 */
export type BookingOutcome = { ok: true; booking: Booking } | { ok: false; reason: string };

/**
 * Abstraction boundary for generating a real meeting link once Zoom/Google
 * Meet (directly, or via Cal.com) is integrated. The v1 mock always resolves
 * to `null` — the prototype must never fabricate a meeting URL.
 */
export interface MeetingLinkProvider {
  createMeetingLink(provider: MeetingProvider, booking: Booking): Promise<string | null>;
}

export const mockMeetingLinkProvider: MeetingLinkProvider = {
  async createMeetingLink() {
    return null;
  },
};
