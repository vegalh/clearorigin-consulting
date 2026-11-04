import type { Booking } from '@/types';

/**
 * Whether a booking currently occupies its time range. Confirmed bookings
 * always do; a checkout hold (`held` / `pending_payment`) does only until its
 * `holdExpiresAt`, so an abandoned checkout frees the slot on its own even
 * before the expiry sweep rewrites its status.
 */
export function blocksSlot(booking: Pick<Booking, 'status' | 'holdExpiresAt'>, now: Date): boolean {
  if (booking.status === 'confirmed') return true;
  if (booking.status === 'held' || booking.status === 'pending_payment') {
    return !!booking.holdExpiresAt && new Date(booking.holdExpiresAt).getTime() > now.getTime();
  }
  return false;
}
