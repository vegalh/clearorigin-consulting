/**
 * Core data model for the ClearOrigin booking prototype.
 *
 * All persisted records are demo/local data (see storageService). Nothing
 * here represents verified ClearOrigin staff, services, or pricing — see
 * docs/PROTOTYPE_PLAN.md for the research notes and disclaimers.
 */

/** Bump this whenever the persisted shape changes so storageService can reset safely. */
export const SCHEMA_VERSION = 1;

/** 0 = Sunday ... 6 = Saturday, matching `Date#getDay()`. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};

export type SessionDurationMinutes = 15 | 30 | 45 | 60;

export interface SessionType {
  id: string;
  name: string;
  durationMinutes: SessionDurationMinutes;
  description: string;
  /** Demo pricing only — always rendered with a "demo price" label. */
  demoPriceUsd?: number;
}

export interface Instructor {
  id: string;
  name: string;
  title: string;
  /** Initials shown on a neutral generated avatar (no stock photos used). */
  avatarInitials: string;
  avatarColorClass: string;
  languages: string[];
  specialties: string[];
  bio: string;
  /** IANA timezone the instructor's recurring schedule is defined in. */
  timezone: string;
  sessionTypeIds: string[];
  isDemo: true;
}

export interface RecurringAvailability {
  id: string;
  instructorId: string;
  dayOfWeek: Weekday;
  /** Local wall-clock time in the instructor's timezone, "HH:mm". */
  startTime: string;
  endTime: string;
}

export type AvailabilityExceptionType = 'blocked_day' | 'extra_hours' | 'blocked_range';

export interface AvailabilityException {
  id: string;
  instructorId: string;
  /** Calendar date in the instructor's timezone, "yyyy-MM-dd". */
  date: string;
  type: AvailabilityExceptionType;
  /** Required for 'extra_hours' and 'blocked_range'. */
  startTime?: string;
  endTime?: string;
  note?: string;
}

export interface Student {
  id: string;
  fullName: string;
  email: string;
}

export type BookingStatus = 'confirmed' | 'cancelled' | 'completed';
export type MeetingProvider = 'zoom' | 'google_meet';

export interface Booking {
  id: string;
  instructorId: string;
  studentId: string;
  sessionTypeId: string;
  /** ISO 8601 UTC instants — the only source of truth for booked time. */
  startAtUtc: string;
  endAtUtc: string;
  status: BookingStatus;
  meetingProvider: MeetingProvider;
  /** Always null in v1 — no real meeting is ever created. */
  meetingUrl: string | null;
  studentNotes?: string;
  createdAt: string;
  updatedAt: string;
}

/** A single bookable start time, already resolved to UTC. */
export interface TimeSlot {
  startUtc: string;
  endUtc: string;
}

export interface AppData {
  schemaVersion: number;
  instructors: Instructor[];
  sessionTypes: SessionType[];
  recurringAvailability: RecurringAvailability[];
  availabilityExceptions: AvailabilityException[];
  bookings: Booking[];
  students: Student[];
}

export type DemoRole = 'student' | 'instructor';
