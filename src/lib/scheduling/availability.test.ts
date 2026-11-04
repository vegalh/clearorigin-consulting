import { describe, expect, it } from 'vitest';
import { generateAvailableSlots, resolveLocalWindowsForDate } from './availability';
import { zonedWallTimeToUtc } from './timezone';
import type { AvailabilityException, Booking, Instructor, RecurringAvailability, SessionType } from '@/types';

const instructor: Instructor = {
  id: 'test-instructor',
  name: 'Test Instructor',
  title: 'Test Coach',
  avatarInitials: 'TI',
  avatarColorClass: 'bg-co-green',
  languages: ['English'],
  specialties: ['Testing'],
  bio: 'A fixture instructor used only in tests.',
  timezone: 'America/New_York',
  sessionTypeIds: ['thirty-min'],
  isDemo: true,
};

const thirtyMinSession: SessionType = {
  id: 'thirty-min',
  name: 'Thirty Minute Session',
  durationMinutes: 30,
  description: 'test fixture',
};

const mondayRule: RecurringAvailability = {
  id: 'mon-rule',
  instructorId: instructor.id,
  dayOfWeek: 1, // Monday
  startTime: '09:00',
  endTime: '12:00',
};

describe('resolveLocalWindowsForDate', () => {
  it('returns the recurring window for a matching weekday', () => {
    const windows = resolveLocalWindowsForDate('2026-03-02', 1, [mondayRule], []);
    expect(windows).toEqual([{ startTime: '09:00', endTime: '12:00' }]);
  });

  it('returns nothing for a weekday with no recurring rule', () => {
    const windows = resolveLocalWindowsForDate('2026-03-03', 2, [mondayRule], []);
    expect(windows).toEqual([]);
  });

  it('clears all windows when a blocked_day exception exists', () => {
    const exceptions: AvailabilityException[] = [
      { id: 'exc-1', instructorId: instructor.id, date: '2026-03-02', type: 'blocked_day' },
    ];
    const windows = resolveLocalWindowsForDate('2026-03-02', 1, [mondayRule], exceptions);
    expect(windows).toEqual([]);
  });

  it('adds an extra_hours window on a day with no recurring rule', () => {
    const exceptions: AvailabilityException[] = [
      {
        id: 'exc-2',
        instructorId: instructor.id,
        date: '2026-03-03',
        type: 'extra_hours',
        startTime: '18:00',
        endTime: '19:00',
      },
    ];
    const windows = resolveLocalWindowsForDate('2026-03-03', 2, [mondayRule], exceptions);
    expect(windows).toEqual([{ startTime: '18:00', endTime: '19:00' }]);
  });

  it('splits a window around a blocked_range exception', () => {
    const exceptions: AvailabilityException[] = [
      {
        id: 'exc-3',
        instructorId: instructor.id,
        date: '2026-03-02',
        type: 'blocked_range',
        startTime: '10:00',
        endTime: '10:30',
      },
    ];
    const windows = resolveLocalWindowsForDate('2026-03-02', 1, [mondayRule], exceptions);
    expect(windows).toEqual([
      { startTime: '09:00', endTime: '10:00' },
      { startTime: '10:30', endTime: '12:00' },
    ]);
  });

  it('removes a window entirely when a blocked_range fully covers it', () => {
    const exceptions: AvailabilityException[] = [
      {
        id: 'exc-4',
        instructorId: instructor.id,
        date: '2026-03-02',
        type: 'blocked_range',
        startTime: '08:00',
        endTime: '13:00',
      },
    ];
    const windows = resolveLocalWindowsForDate('2026-03-02', 1, [mondayRule], exceptions);
    expect(windows).toEqual([]);
  });
});

describe('generateAvailableSlots', () => {
  const now = new Date('2026-02-20T00:00:00Z');

  it('generates slots on a 15-minute grid that fit entirely inside the window', () => {
    const slots = generateAvailableSlots({
      instructor,
      sessionType: thirtyMinSession,
      recurringRules: [mondayRule],
      exceptions: [],
      existingBookings: [],
      now,
      horizonDays: 12, // covers Monday 2026-03-02
    });

    const windowStart = zonedWallTimeToUtc('2026-03-02', '09:00', instructor.timezone).getTime();
    const windowEnd = zonedWallTimeToUtc('2026-03-02', '12:00', instructor.timezone).getTime();
    const mondaySlots = slots.filter((s) => new Date(s.startUtc).getTime() >= windowStart && new Date(s.startUtc).getTime() < windowEnd);

    // 3 hour window, 30 min session, 15 min grid => starts at :00,:15,:30,:45... last start must leave room for 30 min.
    expect(mondaySlots.length).toBe(11);
    expect(mondaySlots[0].startUtc).toBe(new Date(windowStart).toISOString());
    const lastSlot = mondaySlots[mondaySlots.length - 1];
    expect(new Date(lastSlot.endUtc).getTime()).toBeLessThanOrEqual(windowEnd);
  });

  it('excludes past times relative to `now`', () => {
    const lateNow = zonedWallTimeToUtc('2026-03-02', '10:05', instructor.timezone);
    const slots = generateAvailableSlots({
      instructor,
      sessionType: thirtyMinSession,
      recurringRules: [mondayRule],
      exceptions: [],
      existingBookings: [],
      now: lateNow,
      horizonDays: 1,
    });
    for (const slot of slots) {
      expect(new Date(slot.startUtc).getTime()).toBeGreaterThan(lateNow.getTime());
    }
  });

  it('excludes slots that conflict with an existing confirmed booking', () => {
    const slotStart = zonedWallTimeToUtc('2026-03-02', '09:30', instructor.timezone);
    const slotEnd = zonedWallTimeToUtc('2026-03-02', '10:00', instructor.timezone);
    const existingBookings: Booking[] = [
      {
        id: 'b1',
        instructorId: instructor.id,
        studentId: 's1',
        sessionTypeId: thirtyMinSession.id,
        startAtUtc: slotStart.toISOString(),
        endAtUtc: slotEnd.toISOString(),
        status: 'confirmed',
        meetingProvider: 'zoom',
        meetingUrl: null,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    ];

    const slots = generateAvailableSlots({
      instructor,
      sessionType: thirtyMinSession,
      recurringRules: [mondayRule],
      exceptions: [],
      existingBookings,
      now,
      horizonDays: 12,
    });

    const overlapping = slots.some((slot) => {
      const start = new Date(slot.startUtc).getTime();
      const end = new Date(slot.endUtc).getTime();
      return start < slotEnd.getTime() && end > slotStart.getTime();
    });
    expect(overlapping).toBe(false);
  });

  it('ignores cancelled bookings when checking conflicts (slot is released)', () => {
    const slotStart = zonedWallTimeToUtc('2026-03-02', '09:30', instructor.timezone);
    const slotEnd = zonedWallTimeToUtc('2026-03-02', '10:00', instructor.timezone);
    const existingBookings: Booking[] = [
      {
        id: 'b1',
        instructorId: instructor.id,
        studentId: 's1',
        sessionTypeId: thirtyMinSession.id,
        startAtUtc: slotStart.toISOString(),
        endAtUtc: slotEnd.toISOString(),
        status: 'cancelled',
        meetingProvider: 'zoom',
        meetingUrl: null,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    ];

    const slots = generateAvailableSlots({
      instructor,
      sessionType: thirtyMinSession,
      recurringRules: [mondayRule],
      exceptions: [],
      existingBookings,
      now,
      horizonDays: 12,
    });

    const released = slots.some((slot) => new Date(slot.startUtc).getTime() === slotStart.getTime());
    expect(released).toBe(true);
  });

  it('handles the spring-forward DST transition correctly for recurring Monday hours', () => {
    const slots = generateAvailableSlots({
      instructor,
      sessionType: thirtyMinSession,
      recurringRules: [mondayRule],
      exceptions: [],
      existingBookings: [],
      now,
      horizonDays: 20, // covers both 2026-03-02 (EST) and 2026-03-09 (EDT)
    });

    const beforeDst = slots.find((s) => s.startUtc === '2026-03-02T14:00:00.000Z'); // 09:00 EST = 14:00Z
    const afterDst = slots.find((s) => s.startUtc === '2026-03-09T13:00:00.000Z'); // 09:00 EDT = 13:00Z

    expect(beforeDst).toBeDefined();
    expect(afterDst).toBeDefined();
  });

  it('never leaks another instructor\'s rules or exceptions, even when passed the full app-wide lists', () => {
    const otherInstructorRule: RecurringAvailability = {
      id: 'other-mon-rule',
      instructorId: 'some-other-instructor',
      dayOfWeek: 1,
      startTime: '01:00',
      endTime: '02:00',
    };
    const otherInstructorException: AvailabilityException = {
      id: 'other-exc',
      instructorId: 'some-other-instructor',
      date: '2026-03-02',
      type: 'extra_hours',
      startTime: '23:00',
      endTime: '23:30',
    };

    const scopedSlots = generateAvailableSlots({
      instructor,
      sessionType: thirtyMinSession,
      recurringRules: [mondayRule],
      exceptions: [],
      existingBookings: [],
      now,
      horizonDays: 12,
    });
    const unscopedSlots = generateAvailableSlots({
      instructor,
      sessionType: thirtyMinSession,
      recurringRules: [mondayRule, otherInstructorRule],
      exceptions: [otherInstructorException],
      existingBookings: [],
      now,
      horizonDays: 12,
    });

    expect(unscopedSlots).toEqual(scopedSlots);
  });

  it('supports 15, 30, 45 and 60 minute durations with correct end times', () => {
    const durations = [15, 30, 45, 60] as const;
    for (const durationMinutes of durations) {
      const sessionType: SessionType = { ...thirtyMinSession, id: `${durationMinutes}-min`, durationMinutes };
      const slots = generateAvailableSlots({
        instructor,
        sessionType,
        recurringRules: [mondayRule],
        exceptions: [],
        existingBookings: [],
        now,
        horizonDays: 12,
      });
      const first = slots[0];
      expect(first).toBeDefined();
      const diffMinutes = (new Date(first.endUtc).getTime() - new Date(first.startUtc).getTime()) / 60000;
      expect(diffMinutes).toBe(durationMinutes);
    }
  });
});
