import type {
  AvailabilityException,
  Booking,
  Instructor,
  RecurringAvailability,
  SessionType,
  TimeSlot,
} from '@/types';
import { AVAILABILITY_HORIZON_DAYS, SLOT_INTERVAL_MS } from './constants';
import { addCalendarDays, localDateString, localWeekday, zonedWallTimeToUtc } from './timezone';

interface LocalWindow {
  startTime: string; // "HH:mm"
  endTime: string;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

/** Subtract a blocked [start,end) range from a list of local windows. */
function subtractRange(windows: LocalWindow[], blockStart: string, blockEnd: string): LocalWindow[] {
  const blockStartMin = timeToMinutes(blockStart);
  const blockEndMin = timeToMinutes(blockEnd);
  const result: LocalWindow[] = [];

  for (const window of windows) {
    const startMin = timeToMinutes(window.startTime);
    const endMin = timeToMinutes(window.endTime);

    if (blockEndMin <= startMin || blockStartMin >= endMin) {
      // No overlap with this window.
      result.push(window);
      continue;
    }
    if (blockStartMin > startMin) {
      result.push({ startTime: window.startTime, endTime: minutesToTime(Math.min(blockStartMin, endMin)) });
    }
    if (blockEndMin < endMin) {
      result.push({ startTime: minutesToTime(Math.max(blockEndMin, startMin)), endTime: window.endTime });
    }
  }

  return result;
}

/**
 * Resolve the final local availability windows for a single calendar date,
 * applying recurring rules first and then date-specific exceptions in a
 * fixed, documented order: full-day block, then extra hours, then blocked
 * ranges. This keeps instructor edits predictable instead of order-dependent
 * on how exceptions happen to be stored.
 */
export function resolveLocalWindowsForDate(
  dateStr: string,
  weekday: number,
  recurringRules: RecurringAvailability[],
  exceptions: AvailabilityException[],
): LocalWindow[] {
  let windows: LocalWindow[] = recurringRules
    .filter((rule) => rule.dayOfWeek === weekday)
    .map((rule) => ({ startTime: rule.startTime, endTime: rule.endTime }));

  const dayExceptions = exceptions.filter((exception) => exception.date === dateStr);

  if (dayExceptions.some((exception) => exception.type === 'blocked_day')) {
    windows = [];
  }

  for (const exception of dayExceptions) {
    if (exception.type === 'extra_hours' && exception.startTime && exception.endTime) {
      windows.push({ startTime: exception.startTime, endTime: exception.endTime });
    }
  }

  for (const exception of dayExceptions) {
    if (exception.type === 'blocked_range' && exception.startTime && exception.endTime) {
      windows = subtractRange(windows, exception.startTime, exception.endTime);
    }
  }

  return windows
    .filter((window) => timeToMinutes(window.endTime) > timeToMinutes(window.startTime))
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
}

export interface GenerateSlotsParams {
  instructor: Instructor;
  sessionType: SessionType;
  recurringRules: RecurringAvailability[];
  exceptions: AvailabilityException[];
  /** Only 'confirmed' bookings should be passed in — cancelled bookings release their slot. */
  existingBookings: Booking[];
  /** Defaults to `new Date()`; pass explicitly in tests for determinism. */
  now?: Date;
  horizonDays?: number;
}

/**
 * Generate bookable slots for one instructor + session type, honoring
 * recurring availability, date exceptions, existing confirmed bookings, and
 * the instructor's timezone (including DST). Returned slots are UTC instants
 * ready for display conversion or persistence.
 */
export function generateAvailableSlots(params: GenerateSlotsParams): TimeSlot[] {
  const {
    instructor,
    sessionType,
    recurringRules,
    exceptions,
    existingBookings,
    now = new Date(),
    horizonDays = AVAILABILITY_HORIZON_DAYS,
  } = params;

  const durationMs = sessionType.durationMinutes * 60 * 1000;
  const confirmedBookings = existingBookings.filter(
    (booking) => booking.status === 'confirmed' && booking.instructorId === instructor.id,
  );
  // Defensively scope to this instructor even if the caller passed the full
  // app-wide rule/exception lists — otherwise another instructor's rule for
  // the same weekday (or an exception that happens to share a date string)
  // would leak into this instructor's generated availability.
  const instructorRules = recurringRules.filter((rule) => rule.instructorId === instructor.id);
  const instructorExceptions = exceptions.filter((exception) => exception.instructorId === instructor.id);

  const slots: TimeSlot[] = [];
  const startDate = localDateString(now, instructor.timezone);

  for (let dayOffset = 0; dayOffset <= horizonDays; dayOffset += 1) {
    const dateStr = addCalendarDays(startDate, dayOffset);
    // Resolve the weekday for this specific local date (not `now`'s weekday),
    // using noon as an anchor so we never trip over a DST boundary at midnight.
    const noonUtcForDate = zonedWallTimeToUtc(dateStr, '12:00', instructor.timezone);
    const weekday = localWeekday(noonUtcForDate, instructor.timezone);

    const windows = resolveLocalWindowsForDate(dateStr, weekday, instructorRules, instructorExceptions);

    for (const window of windows) {
      const windowStartUtc = zonedWallTimeToUtc(dateStr, window.startTime, instructor.timezone);
      const windowEndUtc = zonedWallTimeToUtc(dateStr, window.endTime, instructor.timezone);

      for (
        let slotStart = windowStartUtc.getTime();
        slotStart + durationMs <= windowEndUtc.getTime();
        slotStart += SLOT_INTERVAL_MS
      ) {
        const slotEnd = slotStart + durationMs;
        if (slotStart <= now.getTime()) continue; // reject past (and in-progress) times

        const hasConflict = confirmedBookings.some((booking) => {
          const bookingStart = new Date(booking.startAtUtc).getTime();
          const bookingEnd = new Date(booking.endAtUtc).getTime();
          return slotStart < bookingEnd && slotEnd > bookingStart;
        });
        if (hasConflict) continue;

        slots.push({
          startUtc: new Date(slotStart).toISOString(),
          endUtc: new Date(slotEnd).toISOString(),
        });
      }
    }
  }

  return slots;
}
