import type {
  AppData,
  AvailabilityException,
  Booking,
  LearnerProfile,
  MeetingConfiguration,
  MeetingProvider,
  Order,
  PackageCreditBalance,
  Payment,
  Student,
} from '@/types';
import { SCHEMA_VERSION } from '@/types';
import { demoInstructors, getInstructorById } from './instructors';
import { demoSessionTypes, getSessionTypeById } from './sessionTypes';
import { demoCourses } from './courses';
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
  // Jordan is a parent booking lessons for a child, so the learner profile carries only a first name.
  { id: 'student-jordan', fullName: 'Jordan Lee', email: 'jordan.lee@example.com' },
];

export const demoMeetingConfigurations: MeetingConfiguration[] = [
  { instructorId: 'maya-chen', provider: 'zoom' },
  { instructorId: 'david-okafor', provider: 'google_meet' },
  { instructorId: 'priya-nandakumar', provider: 'google_meet' },
  { instructorId: 'liang-wu', provider: 'zoom' },
];

const alexLearner: LearnerProfile = { name: 'Alex Johnson', bookedByGuardian: false, level: 'beginner', goal: 'everyday_conversation' };
const miaLearner: LearnerProfile = { name: 'Mia', bookedByGuardian: true, level: 'heritage', goal: 'heritage_connection' };

const DAY_MS = 24 * 60 * 60 * 1000;

/** Upcoming demo lessons start at least this far out, so they stay inside the reschedule/cancel notice window. */
const MIN_LEAD_MS = 2 * DAY_MS;

/** V3 fields for a seeded booking (orders/credits are attached separately). */
function v3Fields(
  courseId: string,
  provider: MeetingProvider,
  learner: LearnerProfile,
  confirmedAt: string,
): Pick<Booking, 'courseId' | 'meeting' | 'learner' | 'confirmedAt'> {
  return { courseId, meeting: { provider, status: 'pending_creation', url: null }, learner, confirmedAt };
}

function paidOrder(id: string, reference: string, studentId: string, courseId: string, bookingId: string, amountMinor: number, at: string, kind: Order['kind'] = 'lesson'): Order {
  return {
    id,
    reference,
    studentId,
    courseId,
    bookingId,
    kind,
    amount: { amountMinor, currency: 'USD' },
    status: 'paid',
    attemptCount: 1,
    createdAt: at,
    updatedAt: at,
  };
}

function succeededPayment(order: Order): Payment {
  return {
    id: `pay-${order.id}`,
    orderId: order.id,
    method: 'card_demo',
    amount: order.amount,
    status: 'succeeded',
    idempotencyKey: `${order.id}:1`,
    providerRef: `demo_seed_${order.id.slice(-6)}`,
    simulated: true,
    createdAt: order.createdAt,
    updatedAt: order.createdAt,
  };
}

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

  const lesson30 = getSessionTypeById('lesson-30')!;
  const lesson45 = getSessionTypeById('lesson-45')!;
  const lesson60 = getSessionTypeById('lesson-60')!;
  const trial30 = getSessionTypeById('trial-30')!;

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
  const orders: Order[] = [];
  const payments: Payment[] = [];
  const nowIso = referenceDate.toISOString();

  // --- Upcoming booking #1: Maya Chen / 45-minute lesson, paid with a package credit ---
  const mayaSlots = generateAvailableSlots({
    instructor: maya,
    sessionType: lesson45,
    recurringRules: demoRecurringAvailability,
    exceptions: availabilityExceptions,
    existingBookings: bookings,
    now: referenceDate,
  }).filter((slot) => new Date(slot.startUtc).getTime() >= referenceDate.getTime() + MIN_LEAD_MS);
  if (mayaSlots[2]) {
    const result = confirmBooking({
      instructor: maya,
      sessionType: lesson45,
      recurringRules: demoRecurringAvailability,
      exceptions: availabilityExceptions,
      existingBookings: bookings,
      slot: mayaSlots[2],
      studentId: 'student-alex',
      meetingProvider: 'zoom',
      studentNotes: 'Would like to practice ordering food and small talk.',
      now: referenceDate,
    });
    if (result.ok) {
      bookings.push({
        ...result.booking,
        ...v3Fields('lesson-45', 'zoom', alexLearner, nowIso),
        paymentMode: 'package_credit',
        packageBalanceId: 'balance-alex-5x45',
      });
    }
  }

  // --- Upcoming booking #2: Priya Nandakumar / 60-minute lesson, paid (booked by a parent) ---
  const priyaSlots = generateAvailableSlots({
    instructor: priya,
    sessionType: lesson60,
    recurringRules: demoRecurringAvailability,
    exceptions: availabilityExceptions,
    existingBookings: bookings,
    now: referenceDate,
  }).filter((slot) => new Date(slot.startUtc).getTime() >= referenceDate.getTime() + MIN_LEAD_MS);
  if (priyaSlots[1]) {
    const result = confirmBooking({
      instructor: priya,
      sessionType: lesson60,
      recurringRules: demoRecurringAvailability,
      exceptions: availabilityExceptions,
      existingBookings: bookings,
      slot: priyaSlots[1],
      studentId: 'student-jordan',
      meetingProvider: 'google_meet',
      studentNotes: 'Mia is preparing for her school Chinese speaking test.',
      now: referenceDate,
    });
    if (result.ok) {
      const order = paidOrder('order-jordan-priya', 'CO-JP0001', 'student-jordan', 'lesson-60', result.booking.id, 5200, nowIso);
      orders.push(order);
      payments.push(succeededPayment(order));
      bookings.push({ ...result.booking, ...v3Fields('lesson-60', 'google_meet', miaLearner, nowIso), paymentMode: 'paid', orderId: order.id });
    }
  }

  // --- Cancelled booking: David Okafor / Trial lesson, refund under review -----
  const davidSlots = generateAvailableSlots({
    instructor: david,
    sessionType: trial30,
    recurringRules: demoRecurringAvailability,
    exceptions: availabilityExceptions,
    existingBookings: bookings,
    now: referenceDate,
  });
  if (davidSlots[0]) {
    const result = confirmBooking({
      instructor: david,
      sessionType: trial30,
      recurringRules: demoRecurringAvailability,
      exceptions: availabilityExceptions,
      existingBookings: bookings,
      slot: davidSlots[0],
      studentId: 'student-alex',
      meetingProvider: 'zoom',
      now: referenceDate,
    });
    if (result.ok) {
      const order = { ...paidOrder('order-alex-david', 'CO-AD0001', 'student-alex', 'trial-lesson', result.booking.id, 1500, nowIso), status: 'refund_pending' as const };
      orders.push(order);
      payments.push(succeededPayment(order));
      bookings.push({
        ...result.booking,
        ...v3Fields('trial-lesson', 'google_meet', alexLearner, nowIso),
        paymentMode: 'paid',
        orderId: order.id,
        status: 'cancelled',
        cancelledAt: nowIso,
        updatedAt: nowIso,
      });
    }
  }

  // --- Fully-booked demo slot: Liang Wu's one-off Monday evening window -------
  const liangSlots = generateAvailableSlots({
    instructor: liang,
    sessionType: lesson30,
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
      sessionType: lesson30,
      recurringRules: demoRecurringAvailability,
      exceptions: availabilityExceptions,
      existingBookings: bookings,
      slot: liangTargetSlot,
      studentId: 'student-jordan',
      meetingProvider: 'zoom',
      now: referenceDate,
    });
    if (result.ok) {
      const order = paidOrder('order-jordan-liang', 'CO-JL0001', 'student-jordan', 'lesson-30', result.booking.id, 2800, nowIso);
      orders.push(order);
      payments.push(succeededPayment(order));
      bookings.push({ ...result.booking, ...v3Fields('lesson-30', 'zoom', miaLearner, nowIso), paymentMode: 'paid', orderId: order.id });
    }
  }

  // --- Completed (past) booking: Liang Wu / 45-minute lesson with a package credit ---
  const pastStart = new Date(referenceDate.getTime() - 4 * DAY_MS);
  const pastEnd = new Date(pastStart.getTime() + lesson45.durationMinutes * 60 * 1000);
  bookings.push({
    id: 'booking-past-liang',
    instructorId: liang.id,
    studentId: 'student-alex',
    sessionTypeId: lesson45.id,
    startAtUtc: pastStart.toISOString(),
    endAtUtc: pastEnd.toISOString(),
    status: 'completed',
    meetingProvider: 'google_meet',
    meetingUrl: null,
    studentNotes: 'Reviewed travel vocabulary.',
    ...v3Fields('lesson-45', 'google_meet', alexLearner, pastStart.toISOString()),
    paymentMode: 'package_credit',
    packageBalanceId: 'balance-alex-5x45',
    createdAt: pastStart.toISOString(),
    updatedAt: pastStart.toISOString(),
  });

  // --- Alex's 5-lesson package: bought 10 days ago, two credits used ----------------
  const purchasedAt = new Date(referenceDate.getTime() - 10 * DAY_MS).toISOString();
  const packageOrder = paidOrder('order-alex-package', 'CO-AP0001', 'student-alex', 'package-5x45', 'booking-past-liang', 18500, purchasedAt, 'package');
  orders.push(packageOrder);
  payments.push(succeededPayment(packageOrder));
  const packageBalances: PackageCreditBalance[] = [
    {
      id: 'balance-alex-5x45',
      studentId: 'student-alex',
      packageCourseId: 'package-5x45',
      orderId: packageOrder.id,
      totalCredits: 5,
      redemptions: bookings
        .filter((b) => b.packageBalanceId === 'balance-alex-5x45')
        .map((b) => ({ bookingId: b.id, status: 'consumed' as const, at: b.createdAt })),
      purchasedAt,
      expiresAt: new Date(new Date(purchasedAt).getTime() + 90 * DAY_MS).toISOString(),
    },
  ];

  return {
    schemaVersion: SCHEMA_VERSION,
    instructors: demoInstructors,
    sessionTypes: demoSessionTypes,
    courses: demoCourses,
    recurringAvailability: demoRecurringAvailability,
    availabilityExceptions,
    bookings,
    students: demoStudents,
    orders,
    payments,
    packageBalances,
    meetingConfigurations: demoMeetingConfigurations,
  };
}
