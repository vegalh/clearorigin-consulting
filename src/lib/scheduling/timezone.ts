import { fromZonedTime, toZonedTime, formatInTimeZone } from 'date-fns-tz';

/**
 * Thin wrappers around date-fns-tz so the rest of the engine never has to
 * think about DST directly. All conversions resolve the correct UTC offset
 * for the *specific date* being converted, which is what makes daylight
 * saving transitions "just work".
 */

/** "yyyy-MM-dd" calendar date for `instant` as seen in `timezone`. */
export function localDateString(instant: Date, timezone: string): string {
  return formatInTimeZone(instant, timezone, 'yyyy-MM-dd');
}

/** 0 (Sun) - 6 (Sat) weekday for `instant` as seen in `timezone`. */
export function localWeekday(instant: Date, timezone: string): number {
  const zoned = toZonedTime(instant, timezone);
  return zoned.getDay();
}

/**
 * Resolve a local wall-clock date + "HH:mm" time in `timezone` to the
 * correct UTC instant, correctly handling DST on that specific date.
 */
export function zonedWallTimeToUtc(dateStr: string, timeStr: string, timezone: string): Date {
  return fromZonedTime(`${dateStr}T${timeStr}:00`, timezone);
}

/**
 * Add `days` calendar days to `dateStr` ("yyyy-MM-dd"). Pure calendar-date
 * arithmetic done with UTC getters/setters so the host machine's local
 * timezone can never shift the date by one day.
 */
export function addCalendarDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const base = new Date(Date.UTC(year, month - 1, day));
  base.setUTCDate(base.getUTCDate() + days);
  const y = base.getUTCFullYear();
  const m = String(base.getUTCMonth() + 1).padStart(2, '0');
  const d = String(base.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
