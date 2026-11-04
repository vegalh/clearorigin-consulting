import type { AvailabilityException, Booking, Instructor, RecurringAvailability, TimeSlot } from '@/types';
import { resolveLocalWindowsForDate } from './availability';
import { localDateString, localWeekday, zonedWallTimeToUtc } from './timezone';

export interface ValidateSlotParams {
  instructor: Instructor;
  slot: TimeSlot;
  recurringRules: RecurringAvailability[];
  exceptions: AvailabilityException[];
  /** All bookings for the instructor (any status) — filtered internally to 'confirmed'. */
  existingBookings: Booking[];
  now?: Date;
  /** Exclude this booking id from the conflict check (used when rescheduling). */
  ignoreBookingId?: string;
}

export type ValidationResult = { ok: true } | { ok: false; reason: string };

/**
 * Revalidate that a requested slot is still bookable "right now": in the
 * future, inside an available window, and not overlapping any other
 * confirmed booking. Used both when confirming a new booking and when
 * confirming a reschedule, per the booking engine's data rules.
 */
export function validateSlot(params: ValidateSlotParams): ValidationResult {
  const { instructor, slot, recurringRules, exceptions, existingBookings, now = new Date(), ignoreBookingId } = params;

  const slotStart = new Date(slot.startUtc).getTime();
  const slotEnd = new Date(slot.endUtc).getTime();

  if (Number.isNaN(slotStart) || Number.isNaN(slotEnd) || slotEnd <= slotStart) {
    return { ok: false, reason: 'The selected time is invalid.' };
  }

  if (slotStart <= now.getTime()) {
    return { ok: false, reason: 'That time has already passed. Please choose another slot.' };
  }

  const dateStr = localDateString(new Date(slotStart), instructor.timezone);
  const noonUtcForDate = zonedWallTimeToUtc(dateStr, '12:00', instructor.timezone);
  const weekday = localWeekday(noonUtcForDate, instructor.timezone);
  const windows = resolveLocalWindowsForDate(dateStr, weekday, recurringRules, exceptions);

  const fitsInWindow = windows.some((window) => {
    const windowStart = zonedWallTimeToUtc(dateStr, window.startTime, instructor.timezone).getTime();
    const windowEnd = zonedWallTimeToUtc(dateStr, window.endTime, instructor.timezone).getTime();
    return slotStart >= windowStart && slotEnd <= windowEnd;
  });

  if (!fitsInWindow) {
    return { ok: false, reason: 'That time is no longer available.' };
  }

  const conflict = existingBookings.some((booking) => {
    if (booking.status !== 'confirmed') return false;
    if (booking.id === ignoreBookingId) return false;
    const bookingStart = new Date(booking.startAtUtc).getTime();
    const bookingEnd = new Date(booking.endAtUtc).getTime();
    return slotStart < bookingEnd && slotEnd > bookingStart;
  });

  if (conflict) {
    return { ok: false, reason: 'That time was just booked. Please choose another slot.' };
  }

  return { ok: true };
}
