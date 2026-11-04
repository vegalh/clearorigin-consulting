import { formatInTimeZone } from 'date-fns-tz';
import { zhCN } from 'date-fns/locale';
import type { Lang } from '@/i18n/types';

const localeOptions = (lang: Lang) => (lang === 'zh' ? { locale: zhCN } : undefined);

/** "Thursday, November 5" / "11月5日 星期四" for `isoUtc` as seen in `timezone`. */
export function formatDisplayDate(isoUtc: string, timezone: string, lang: Lang = 'en'): string {
  return formatInTimeZone(new Date(isoUtc), timezone, lang === 'zh' ? 'M月d日 EEEE' : 'EEEE, MMMM d', localeOptions(lang));
}

/** "3:30 PM" / "15:30" for `isoUtc` as seen in `timezone`. */
export function formatDisplayTime(isoUtc: string, timezone: string, lang: Lang = 'en'): string {
  return formatInTimeZone(new Date(isoUtc), timezone, lang === 'zh' ? 'HH:mm' : 'h:mm a', localeOptions(lang));
}

/** "3:30 PM – 4:00 PM" range for a start/end pair. */
export function formatDisplayTimeRange(startIsoUtc: string, endIsoUtc: string, timezone: string, lang: Lang = 'en'): string {
  return `${formatDisplayTime(startIsoUtc, timezone, lang)} \u2013 ${formatDisplayTime(endIsoUtc, timezone, lang)}`;
}

/** Short weekday + day-of-month, e.g. "Thu 5" / "周四 5", used in the day picker. */
export function formatShortWeekday(isoUtc: string, timezone: string, lang: Lang = 'en'): { weekday: string; day: string; month: string } {
  const opts = localeOptions(lang);
  return {
    weekday: formatInTimeZone(new Date(isoUtc), timezone, 'EEE', opts),
    day: formatInTimeZone(new Date(isoUtc), timezone, 'd', opts),
    month: formatInTimeZone(new Date(isoUtc), timezone, lang === 'zh' ? 'M月' : 'MMM', opts),
  };
}

/** Calendar date such as "Jan 23, 2027" / "2027年1月23日" in the viewer's local time. */
export function formatShortDate(isoUtc: string, lang: Lang = 'en'): string {
  return new Date(isoUtc).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
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
