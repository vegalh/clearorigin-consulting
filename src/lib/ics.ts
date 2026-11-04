import type { Booking, Instructor, SessionType } from '@/types';

/** "yyyyMMddTHHmmssZ" — the UTC timestamp format iCalendar expects. */
function toIcsUtc(isoUtc: string): string {
  return new Date(isoUtc).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function escapeIcsText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');
}

/** Builds a minimal, standards-compliant .ics file for a single confirmed booking. */
export function buildBookingIcs(booking: Booking, instructor: Instructor, sessionType: SessionType): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ClearOrigin Booking Prototype//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${booking.id}@clearorigin-booking-prototype`,
    `DTSTAMP:${toIcsUtc(booking.createdAt)}`,
    `DTSTART:${toIcsUtc(booking.startAtUtc)}`,
    `DTEND:${toIcsUtc(booking.endAtUtc)}`,
    `SUMMARY:${escapeIcsText(`${sessionType.name} with ${instructor.name} (ClearOrigin prototype)`)}`,
    `DESCRIPTION:${escapeIcsText(
      `${sessionType.description} This is a demo booking created in the ClearOrigin booking prototype; no real meeting link was generated.`,
    )}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.join('\r\n');
}

/** Triggers a browser download of the given .ics content. */
export function downloadIcsFile(filename: string, icsContent: string): void {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
