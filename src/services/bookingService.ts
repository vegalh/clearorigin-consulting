import type { AppData, Instructor, MeetingProvider, SessionType, TimeSlot } from '@/types';
import { cancelBooking, confirmBooking, rescheduleBooking } from '@/lib/scheduling';
import type { BookingOutcome } from './types';

export interface CreateBookingArgs {
  instructor: Instructor;
  sessionType: SessionType;
  slot: TimeSlot;
  studentId: string;
  meetingProvider: MeetingProvider;
  studentNotes?: string;
  now?: Date;
}

export function createBooking(appData: AppData, args: CreateBookingArgs): BookingOutcome {
  return confirmBooking({
    instructor: args.instructor,
    sessionType: args.sessionType,
    recurringRules: appData.recurringAvailability,
    exceptions: appData.availabilityExceptions,
    existingBookings: appData.bookings,
    slot: args.slot,
    studentId: args.studentId,
    meetingProvider: args.meetingProvider,
    studentNotes: args.studentNotes,
    now: args.now,
  });
}

export function cancelExistingBooking(appData: AppData, bookingId: string, now?: Date): BookingOutcome {
  const booking = appData.bookings.find((b) => b.id === bookingId);
  if (!booking) {
    return { ok: false, reason: 'Booking not found.' };
  }
  return cancelBooking(booking, now);
}

export function rescheduleExistingBooking(
  appData: AppData,
  bookingId: string,
  newSlot: TimeSlot,
  now?: Date,
): BookingOutcome {
  const booking = appData.bookings.find((b) => b.id === bookingId);
  if (!booking) {
    return { ok: false, reason: 'Booking not found.' };
  }
  const instructor = appData.instructors.find((i) => i.id === booking.instructorId);
  if (!instructor) {
    return { ok: false, reason: 'Instructor not found.' };
  }

  return rescheduleBooking({
    booking,
    instructor,
    recurringRules: appData.recurringAvailability,
    exceptions: appData.availabilityExceptions,
    existingBookings: appData.bookings,
    newSlot,
    now,
  });
}
