import type { AppData, AvailabilityException, Booking, Student } from '@/types';
import { SCHEMA_VERSION } from '@/types';
import { demoInstructors, getInstructorById } from './instructors';
import { demoSessionTypes, getSessionTypeById } from './sessionTypes';
import { demoRecurringAvailability } from './availability';
import { confirmBooking, generateAvailableSlots } from '@/lib/scheduling/index';
import { addCalendarDays, localDateString, localWeekday, zonedWallTimeToUtc } from '@/lib/scheduling/timezone';

/** Find the next date (>= `minDaysOut` days from `referenceDate`) that falls on `targetWeekday` in `timezone`. */
function nextLocalDateForWeekday(
  referenceDate: Date,
  timezone: string,
  targetWeekday: number,
  minDaysOut: number,
): string {
  const startDate = localDateString(referenceDate, timezone);
  for (let offset = minDaysOut; offset < minDaysOut + 14; offset += 1) {
    const dateStr = addCalendarDays(startDate, offset);
    const noonUtc = zonedWallTimeToUtc(dateStr, '12:00', timezone);
    if (localWeekday(noonUtc, timezone) === targetWeekday) return dateStr;
  }
  throw new Error(`No matching weekday found within range for ${timezone}`);
}

const demoStudents: Student[] = [
  { id: 'student-alex', fullName: 'Alex Johnson', email: 'alex.johnson@example.com' },
  { id: 'student-jordan', fullName: 'Jordan Lee', email: 'jordan.lee@example.com' },
];

/**
 * Build a fresh, deterministic set of demo data anchored to `referenceDate`.
 * Deterministic given a fixed `referenceDate` (no randomness), so tests can
 * pass a fixed date and get reproducible results, while the running app
 * calls this with "now" so the demo always has believable near-term
 * bookings and exceptions instead of data that silently expires.
 */
export function createSeedData(referenceDate: Date = new Date()): AppData {
  const maya = getInstructorById('maya-chen')!;
  const david = getInstructorById('david-okafor')!;
  const priya = getInstructorById('priya-nandakumar')!;
  const liang = getInstructorById('liang-wu')!;

  const conversationPractice = getSessionTypeById('conversation-practice')!;
  const personalizedSession = getSessionTypeById('personalized-session')!;
  const discoveryConversation = getSessionTypeById('discovery-conversation')!;

  // --- Availability exceptions -------------------------------------------------
  const mayaBlockedDate = nextLocalDateForWeekday(referenceDate, maya.timezone, 4, 9); // a future Thursday
  const priyaBlockedRangeDate = nextLocalDateForWeekday(referenceDate, priya.timezone, 2, 3); // a future Tuesday
  const liangFullyBookedDate = nextLocalDateForWeekday(referenceDate, liang.timezone, 1, 5); // a future Monday (no recurring rule)

  const availabilityExceptions: AvailabilityException[] = [
    {
      id: 'exc-maya-blocked-day',
      instructorId: maya.id,
      date: mayaBlockedDate,
      type: 'blocked_day',
      note: 'Out of office (demo exception).',
    },
    {
      id: 'exc-priya-blocked-range',
      instructorId: priya.id,
      date: priyaBlockedRangeDate,
      type: 'blocked_range',
      startTime: '11:00',
      endTime: '12:00',
      note: 'Holding this hour for admin work (demo exception).',
    },
    {
      id: 'exc-liang-extra-hours',
      instructorId: liang.id,
      date: liangFullyBookedDate,
      type: 'extra_hours',
      startTime: '19:00',
      endTime: '19:30',
      note: 'One-off evening slot (demo exception).',
    },
  ];

  const bookings: Booking[] = [];
  const nowIso = referenceDate.toISOString();

  // --- Upcoming booking #1: Maya Chen / Conversation Practice -----------------
  const mayaSlots = generateAvailableSlots({
    instructor: maya,
    sessionType: conversationPractice,
    recurringRules: demoRecurringAvailability,
    exceptions: availabilityExceptions,
    existingBookings: bookings,
    now: referenceDate,
  });
  if (mayaSlots[2]) {
    const result = confirmBooking({
      instructor: maya,
      sessionType: conversationPractice,
      recurringRules: demoRecurringAvailability,
      exceptions: availabilityExceptions,
      existingBookings: bookings,
      slot: mayaSlots[2],
      studentId: 'student-alex',
      meetingProvider: 'zoom',
      studentNotes: 'Would like to practice ordering food and small talk.',
      now: referenceDate,
    });
    if (result.ok) bookings.push(result.booking);
  }

  // --- Upcoming booking #2: Priya Nandakumar / Personalized Session -----------
  const priyaSlots = generateAvailableSlots({
    instructor: priya,
    sessionType: personalizedSession,
    recurringRules: demoRecurringAvailability,
    exceptions: availabilityExceptions,
    existingBookings: bookings,
    now: referenceDate,
  });
  if (priyaSlots[1]) {
    const result = confirmBooking({
      instructor: priya,
      sessionType: personalizedSession,
      recurringRules: demoRecurringAvailability,
      exceptions: availabilityExceptions,
      existingBookings: bookings,
      slot: priyaSlots[1],
      studentId: 'student-jordan',
      meetingProvider: 'google_meet',
      studentNotes: 'Focusing on IELTS speaking part 2.',
      now: referenceDate,
    });
    if (result.ok) bookings.push(result.booking);
  }

  // --- Cancelled booking: David Okafor / Discovery Conversation ---------------
  const davidSlots = generateAvailableSlots({
    instructor: david,
    sessionType: discoveryConversation,
    recurringRules: demoRecurringAvailability,
    exceptions: availabilityExceptions,
    existingBookings: bookings,
    now: referenceDate,
  });
  if (davidSlots[0]) {
    const result = confirmBooking({
      instructor: david,
      sessionType: discoveryConversation,
      recurringRules: demoRecurringAvailability,
      exceptions: availabilityExceptions,
      existingBookings: bookings,
      slot: davidSlots[0],
      studentId: 'student-alex',
      meetingProvider: 'zoom',
      now: referenceDate,
    });
    if (result.ok) {
      bookings.push({ ...result.booking, status: 'cancelled', updatedAt: nowIso });
    }
  }

  // --- Fully-booked demo slot: Liang Wu's one-off Monday evening window -------
  const liangSlots = generateAvailableSlots({
    instructor: liang,
    sessionType: conversationPractice,
    recurringRules: demoRecurringAvailability,
    exceptions: availabilityExceptions,
    existingBookings: bookings,
    now: referenceDate,
  });
  // The extra-hours window is exactly one session long, so there is exactly
  // one generated slot for that date/session-type combination.
  const liangTargetSlot = liangSlots.find((slot) => {
    return new Date(slot.startUtc).getTime() === zonedWallTimeToUtc(liangFullyBookedDate, '19:00', liang.timezone).getTime();
  });
  if (liangTargetSlot) {
    const result = confirmBooking({
      instructor: liang,
      sessionType: conversationPractice,
      recurringRules: demoRecurringAvailability,
      exceptions: availabilityExceptions,
      existingBookings: bookings,
      slot: liangTargetSlot,
      studentId: 'student-jordan',
      meetingProvider: 'zoom',
      now: referenceDate,
    });
    if (result.ok) bookings.push(result.booking);
  }

  // --- Completed (past) booking: Liang Wu / Conversation Practice -------------
  const pastStart = new Date(referenceDate.getTime() - 4 * 24 * 60 * 60 * 1000);
  const pastEnd = new Date(pastStart.getTime() + conversationPractice.durationMinutes * 60 * 1000);
  bookings.push({
    id: 'booking-past-liang',
    instructorId: liang.id,
    studentId: 'student-alex',
    sessionTypeId: conversationPractice.id,
    startAtUtc: pastStart.toISOString(),
    endAtUtc: pastEnd.toISOString(),
    status: 'completed',
    meetingProvider: 'google_meet',
    meetingUrl: null,
    studentNotes: 'Reviewed travel vocabulary.',
    createdAt: pastStart.toISOString(),
    updatedAt: pastStart.toISOString(),
  });

  return {
    schemaVersion: SCHEMA_VERSION,
    instructors: demoInstructors,
    sessionTypes: demoSessionTypes,
    recurringAvailability: demoRecurringAvailability,
    availabilityExceptions,
    bookings,
    students: demoStudents,
  };
}
