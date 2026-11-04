import { beforeEach, describe, expect, it } from 'vitest';
import { SCHEMA_VERSION } from '@/types';
import { createSeedData } from '@/data/seed';
import { migrateToLatest, migrateV1ToV2 } from './migrations';
import { BACKUP_KEY_PREFIX, STORAGE_KEY, storageService } from './storageService';

/** A v1 snapshot exactly as the v1 app persisted it (no courses/orders/payments, v1 session types). */
function v1Snapshot() {
  const v2 = createSeedData(new Date('2026-11-04T12:00:00Z'));
  return {
    schemaVersion: 1 as const,
    instructors: v2.instructors.map(({ qualifications: _q, approach: _a, courseIds: _c, ...rest }) => rest),
    sessionTypes: v2.sessionTypes.filter((s) => s.legacy),
    recurringAvailability: v2.recurringAvailability,
    availabilityExceptions: v2.availabilityExceptions,
    students: [...v2.students, { id: 'student-custom', fullName: 'Custom Person', email: 'custom@example.com' }],
    bookings: [
      {
        id: 'v1-booking',
        instructorId: 'maya-chen',
        studentId: 'student-alex',
        sessionTypeId: 'conversation-practice',
        startAtUtc: '2026-11-20T15:00:00.000Z',
        endAtUtc: '2026-11-20T15:30:00.000Z',
        status: 'confirmed' as const,
        meetingProvider: 'google_meet' as const,
        meetingUrl: null,
        studentNotes: 'Made in v1',
        createdAt: '2026-11-01T00:00:00.000Z',
        updatedAt: '2026-11-01T00:00:00.000Z',
      },
    ],
  };
}

describe('v1 → v2 migration', () => {
  it('keeps every v1 booking and student, marking bookings as legacy', () => {
    const v1 = v1Snapshot();
    const v2 = migrateV1ToV2(v1);
    expect(v2.schemaVersion).toBe(2);
    expect(v2.bookings).toHaveLength(1);
    expect(v2.bookings[0]).toMatchObject({
      id: 'v1-booking',
      studentNotes: 'Made in v1',
      paymentMode: 'legacy',
      meeting: { provider: 'google_meet', status: 'pending_creation', url: null },
    });
    expect(v2.students.map((s) => s.id)).toContain('student-custom');
    expect(v2.orders).toEqual([]);
  });

  it('keeps legacy session types resolvable and adds the V3 catalog', () => {
    const v2 = migrateV1ToV2(v1Snapshot());
    expect(v2.sessionTypes.find((s) => s.id === 'conversation-practice')?.legacy).toBe(true);
    expect(v2.courses.length).toBeGreaterThan(0);
    expect(v2.instructors.every((i) => i.courseIds && i.courseIds.length > 0)).toBe(true);
  });

  it('chains v1 → v3 and gives instructors sign-in emails', () => {
    const result = migrateToLatest(v1Snapshot());
    expect(result.ok && result.data.schemaVersion).toBe(SCHEMA_VERSION);
    expect(result.ok && result.data.instructors.every((i) => i.email)).toBe(true);
    expect(result.ok && result.data.bookings.map((b) => b.id)).toEqual(['v1-booking']);
  });

  it('migrates v2 data by refreshing instructor accounts and keeping everything else', () => {
    const v2 = { ...createSeedData(new Date('2026-11-04T12:00:00Z')), schemaVersion: 2 };
    v2.instructors = v2.instructors.map(({ email: _e, ...rest }) => rest);
    const result = migrateToLatest(JSON.parse(JSON.stringify(v2)));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.migratedFrom).toBe(2);
    expect(result.data.instructors.find((i) => i.id === 'maya-chen')?.email).toBe('maya.chen@instructors.example.com');
    expect(result.data.bookings).toEqual(v2.bookings);
    expect(result.data.packageBalances).toEqual(v2.packageBalances);
  });

  it('rejects unknown versions and corrupt shapes instead of guessing', () => {
    expect(migrateToLatest({ schemaVersion: 99 }).ok).toBe(false);
    expect(migrateToLatest({ schemaVersion: 1, bookings: 'nope' }).ok).toBe(false);
    expect(migrateToLatest(null).ok).toBe(false);
  });
});

describe('storageService', () => {
  beforeEach(() => window.localStorage.clear());

  it('migrates stored v1 data on load and keeps a backup of the original', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(v1Snapshot()));
    const loaded = storageService.load();
    expect(loaded.schemaVersion).toBe(SCHEMA_VERSION);
    expect(loaded.bookings.some((b) => b.id === 'v1-booking')).toBe(true);
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)!).schemaVersion).toBe(SCHEMA_VERSION);
    const backups = Object.keys(window.localStorage).filter((k) => k.startsWith(BACKUP_KEY_PREFIX));
    expect(backups).toHaveLength(1);
  });

  it('backs up unreadable data before reseeding, so nothing is silently lost', () => {
    window.localStorage.setItem(STORAGE_KEY, '{not json');
    const loaded = storageService.load();
    expect(loaded.schemaVersion).toBe(SCHEMA_VERSION);
    const backupKey = Object.keys(window.localStorage).find((k) => k.startsWith(BACKUP_KEY_PREFIX))!;
    expect(window.localStorage.getItem(backupKey)).toBe('{not json');
  });
});
