import type { AppData, Booking } from '@/types';
import { SCHEMA_VERSION } from '@/types';
import { demoInstructors } from '@/data/instructors';
import { demoSessionTypes } from '@/data/sessionTypes';
import { demoCourses } from '@/data/courses';
import { demoMeetingConfigurations } from '@/data/seed';

/** The v1 persisted shape (before courses, orders, payments and credits existed). */
interface AppDataV1 {
  schemaVersion: 1;
  instructors: AppData['instructors'];
  sessionTypes: AppData['sessionTypes'];
  recurringAvailability: AppData['recurringAvailability'];
  availabilityExceptions: AppData['availabilityExceptions'];
  bookings: Booking[];
  students: AppData['students'];
}

/**
 * v1 → v2. Keeps every booking, student, availability rule and exception the
 * user created. v1 bookings become `paymentMode: 'legacy'` (they predate
 * payments, so no order is invented for them) and gain a meeting block derived
 * from their stored provider. Instructor profiles and the catalog are
 * code-owned content, so they're refreshed — v1 session types stay available
 * (as `legacy`) so old bookings still resolve.
 */
export function migrateV1ToV2(v1: AppDataV1): AppData {
  const bookings: Booking[] = v1.bookings.map((booking) => ({
    ...booking,
    paymentMode: booking.paymentMode ?? 'legacy',
    meeting: booking.meeting ?? { provider: booking.meetingProvider, status: 'pending_creation', url: null },
    confirmedAt: booking.confirmedAt ?? booking.createdAt,
  }));

  const knownInstructorIds = new Set(demoInstructors.map((i) => i.id));
  const extraInstructors = v1.instructors.filter((i) => !knownInstructorIds.has(i.id));
  const knownSessionTypeIds = new Set(demoSessionTypes.map((s) => s.id));
  const extraSessionTypes = v1.sessionTypes.filter((s) => !knownSessionTypeIds.has(s.id)).map((s) => ({ ...s, legacy: true }));

  return {
    schemaVersion: 2,
    instructors: [...demoInstructors, ...extraInstructors],
    sessionTypes: [...demoSessionTypes, ...extraSessionTypes],
    courses: demoCourses,
    recurringAvailability: v1.recurringAvailability,
    availabilityExceptions: v1.availabilityExceptions,
    bookings,
    students: v1.students,
    orders: [],
    payments: [],
    packageBalances: [],
    meetingConfigurations: demoMeetingConfigurations,
  };
}

export type MigrationResult = { ok: true; data: AppData; migratedFrom?: number } | { ok: false; reason: string };

/** Bring any known persisted version up to SCHEMA_VERSION. Unknown/corrupt shapes are rejected, never guessed at. */
export function migrateToLatest(raw: unknown): MigrationResult {
  if (!raw || typeof raw !== 'object' || !('schemaVersion' in raw)) {
    return { ok: false, reason: 'Unrecognized data.' };
  }
  const version = (raw as { schemaVersion: unknown }).schemaVersion;
  if (version === SCHEMA_VERSION) {
    const data = raw as AppData;
    if (!Array.isArray(data.bookings) || !Array.isArray(data.courses)) return { ok: false, reason: 'Corrupt v2 data.' };
    return { ok: true, data };
  }
  if (version === 1) {
    const v1 = raw as AppDataV1;
    if (!Array.isArray(v1.bookings) || !Array.isArray(v1.students)) return { ok: false, reason: 'Corrupt v1 data.' };
    return { ok: true, data: migrateV1ToV2(v1), migratedFrom: 1 };
  }
  return { ok: false, reason: `Unsupported schema version ${String(version)}.` };
}
