import { formatInTimeZone } from 'date-fns-tz';

/** "Thursday, November 5" for `isoUtc` as seen in `timezone`. */
export function formatDisplayDate(isoUtc: string, timezone: string): string {
  return formatInTimeZone(new Date(isoUtc), timezone, 'EEEE, MMMM d');
}

/** "3:30 PM" for `isoUtc` as seen in `timezone`. */
export function formatDisplayTime(isoUtc: string, timezone: string): string {
  return formatInTimeZone(new Date(isoUtc), timezone, 'h:mm a');
}

/** "3:30 PM – 4:00 PM" range for a start/end pair. */
export function formatDisplayTimeRange(startIsoUtc: string, endIsoUtc: string, timezone: string): string {
  return `${formatDisplayTime(startIsoUtc, timezone)} \u2013 ${formatDisplayTime(endIsoUtc, timezone)}`;
}

/** Short weekday + day-of-month, e.g. "Thu 5", used in the 7-day picker. */
export function formatShortWeekday(isoUtc: string, timezone: string): { weekday: string; day: string; month: string } {
  return {
    weekday: formatInTimeZone(new Date(isoUtc), timezone, 'EEE'),
    day: formatInTimeZone(new Date(isoUtc), timezone, 'd'),
    month: formatInTimeZone(new Date(isoUtc), timezone, 'MMM'),
  };
}

export function browserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

/** All IANA timezones the browser knows about, for the timezone selector. */
export function supportedTimezones(): string[] {
  const withSupportedValuesOf = Intl as unknown as { supportedValuesOf?: (key: string) => string[] };
  if (typeof withSupportedValuesOf.supportedValuesOf === 'function') {
    try {
      return withSupportedValuesOf.supportedValuesOf('timeZone');
    } catch {
      // fall through to the static fallback list below
    }
  }
  return [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Sao_Paulo',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Shanghai',
    'Asia/Tokyo',
    'Asia/Kolkata',
    'Australia/Sydney',
    'UTC',
  ];
}
