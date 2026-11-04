import type {
  AvailabilityException,
  Booking,
  Instructor,
  MeetingProvider,
  RecurringAvailability,
  SessionType,
  TimeSlot,
} from '@/types';
import { validateSlot } from './validate';

export type BookingResult = { ok: true; booking: Booking } | { ok: false; reason: string };

export interface ConfirmBookingInput {
  instructor: Instructor;
  sessionType: SessionType;
  recurringRules: RecurringAvailability[];
  exceptions: AvailabilityException[];
  existingBookings: Booking[];
  slot: TimeSlot;
  studentId: string;
  meetingProvider: MeetingProvider;
  studentNotes?: string;
  now?: Date;
}

/**
 * Create a new confirmed booking, revalidating availability first so two
 * near-simultaneous requests for the same slot cannot both succeed within
 * one browser session (see storageService for the single-device caveat).
 */
export function confirmBooking(input: ConfirmBookingInput): BookingResult {
  const { instructor, recurringRules, exceptions, existingBookings, slot, studentId, meetingProvider, studentNotes, now = new Date() } =
    input;

  const validation = validateSlot({ instructor, slot, recurringRules, exceptions, existingBookings, now });
  if (!validation.ok) {
    return { ok: false, reason: validation.reason };
  }

  const nowIso = now.toISOString();
  const booking: Booking = {
    id: crypto.randomUUID(),
    instructorId: instructor.id,
    studentId,
    sessionTypeId: input.sessionType.id,
    startAtUtc: slot.startUtc,
    endAtUtc: slot.endUtc,
    status: 'confirmed',
    meetingProvider,
    meetingUrl: null,
    studentNotes,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  return { ok: true, booking };
}

/** Cancel a confirmed booking. Historical record is preserved with status 'cancelled'. */
export function cancelBooking(booking: Booking, now: Date = new Date()): BookingResult {
  if (booking.status === 'cancelled') {
    return { ok: false, reason: 'This booking is already cancelled.' };
  }

  return {
    ok: true,
    booking: { ...booking, status: 'cancelled', updatedAt: now.toISOString() },
  };
}

export interface RescheduleBookingInput {
  booking: Booking;
  instructor: Instructor;
  recurringRules: RecurringAvailability[];
  exceptions: AvailabilityException[];
  /** All bookings for the instructor, including the one being rescheduled. */
  existingBookings: Booking[];
  newSlot: TimeSlot;
  now?: Date;
}

/**
 * Move a confirmed booking to a new slot with the same instructor. The
 * original booking is left untouched unless the new slot passes full
 * revalidation, so a failed reschedule never loses the existing reservation.
 */
export function rescheduleBooking(input: RescheduleBookingInput): BookingResult {
  const { booking, instructor, recurringRules, exceptions, existingBookings, newSlot, now = new Date() } = input;

  if (booking.status !== 'confirmed') {
    return { ok: false, reason: 'Only confirmed bookings can be rescheduled.' };
  }

  const validation = validateSlot({
    instructor,
    slot: newSlot,
    recurringRules,
    exceptions,
    existingBookings,
    now,
    ignoreBookingId: booking.id,
  });
  if (!validation.ok) {
    return { ok: false, reason: validation.reason };
  }

  return {
    ok: true,
    booking: {
      ...booking,
      startAtUtc: newSlot.startUtc,
      endAtUtc: newSlot.endUtc,
      updatedAt: now.toISOString(),
    },
  };
}
