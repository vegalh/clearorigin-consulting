import type { AppData, Instructor, SessionType, TimeSlot } from '@/types';
import { generateAvailableSlots } from '@/lib/scheduling';

/**
 * Read-only view over the booking engine for a given instructor + session
 * type, scoped to the current app data. See services/types.ts for how this
 * fits into the future-provider abstraction.
 */
export function getAvailableSlots(
  appData: AppData,
  instructor: Instructor,
  sessionType: SessionType,
  now?: Date,
): TimeSlot[] {
  return generateAvailableSlots({
    instructor,
    sessionType,
    recurringRules: appData.recurringAvailability,
    exceptions: appData.availabilityExceptions,
    existingBookings: appData.bookings,
    now,
  });
}
