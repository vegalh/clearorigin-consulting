import { describe, expect, it } from 'vitest';
import { cancelBooking, confirmBooking, rescheduleBooking } from './booking';
import { zonedWallTimeToUtc } from './timezone';
import type { Booking, Instructor, RecurringAvailability, SessionType } from '@/types';

const instructor: Instructor = {
  id: 'test-instructor',
  name: 'Test Instructor',
  title: 'Test Coach',
  avatarInitials: 'TI',
  avatarColorClass: 'bg-co-green',
  languages: ['English'],
  specialties: ['Testing'],
  bio: 'Fixture instructor.',
  timezone: 'America/New_York',
  sessionTypeIds: ['thirty-min'],
  isDemo: true,
};

const sessionType: SessionType = {
  id: 'thirty-min',
  name: 'Thirty Minute Session',
  durationMinutes: 30,
  description: 'test fixture',
};

const mondayRule: RecurringAvailability = {
  id: 'mon-rule',
  instructorId: instructor.id,
  dayOfWeek: 1,
  startTime: '09:00',
  endTime: '12:00',
};

const now = new Date('2026-02-20T00:00:00Z');
const validSlot = {
  startUtc: zonedWallTimeToUtc('2026-03-02', '09:00', instructor.timezone).toISOString(),
  endUtc: zonedWallTimeToUtc('2026-03-02', '09:30', instructor.timezone).toISOString(),
};

describe('confirmBooking', () => {
  it('creates a confirmed booking for a valid, available slot', () => {
    const result = confirmBooking({
      instructor,
      sessionType,
      recurringRules: [mondayRule],
      exceptions: [],
      existingBookings: [],
      slot: validSlot,
      studentId: 'student-1',
      meetingProvider: 'zoom',
      now,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.booking.status).toBe('confirmed');
      expect(result.booking.meetingUrl).toBeNull();
      expect(result.booking.startAtUtc).toBe(validSlot.startUtc);
    }
  });

  it('rejects a slot that overlaps an existing confirmed booking', () => {
    const existing: Booking = {
      id: 'existing-1',
      instructorId: instructor.id,
      studentId: 'student-0',
      sessionTypeId: sessionType.id,
      startAtUtc: validSlot.startUtc,
      endAtUtc: validSlot.endUtc,
      status: 'confirmed',
      meetingProvider: 'zoom',
      meetingUrl: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const result = confirmBooking({
      instructor,
      sessionType,
      recurringRules: [mondayRule],
      exceptions: [],
      existingBookings: [existing],
      slot: validSlot,
      studentId: 'student-1',
      meetingProvider: 'zoom',
      now,
    });

    expect(result.ok).toBe(false);
  });

  it('rejects a slot outside any available window', () => {
    const outsideSlot = {
      startUtc: zonedWallTimeToUtc('2026-03-02', '13:00', instructor.timezone).toISOString(),
      endUtc: zonedWallTimeToUtc('2026-03-02', '13:30', instructor.timezone).toISOString(),
    };
    const result = confirmBooking({
      instructor,
      sessionType,
      recurringRules: [mondayRule],
      exceptions: [],
      existingBookings: [],
      slot: outsideSlot,
      studentId: 'student-1',
      meetingProvider: 'zoom',
      now,
    });
    expect(result.ok).toBe(false);
  });

  it('rejects a slot in the past', () => {
    const pastSlot = {
      startUtc: zonedWallTimeToUtc('2026-02-01', '09:00', instructor.timezone).toISOString(),
      endUtc: zonedWallTimeToUtc('2026-02-01', '09:30', instructor.timezone).toISOString(),
    };
    const result = confirmBooking({
      instructor,
      sessionType,
      recurringRules: [mondayRule],
      exceptions: [],
      existingBookings: [],
      slot: pastSlot,
      studentId: 'student-1',
      meetingProvider: 'zoom',
      now,
    });
    expect(result.ok).toBe(false);
  });
});

describe('cancelBooking', () => {
  it('marks a confirmed booking as cancelled and preserves the record', () => {
    const booking: Booking = {
      id: 'b1',
      instructorId: instructor.id,
      studentId: 'student-1',
      sessionTypeId: sessionType.id,
      startAtUtc: validSlot.startUtc,
      endAtUtc: validSlot.endUtc,
      status: 'confirmed',
      meetingProvider: 'zoom',
      meetingUrl: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    const result = cancelBooking(booking, now);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.booking.status).toBe('cancelled');
      expect(result.booking.id).toBe(booking.id);
      expect(result.booking.startAtUtc).toBe(booking.startAtUtc);
    }
  });

  it('rejects cancelling an already-cancelled booking', () => {
    const booking: Booking = {
      id: 'b1',
      instructorId: instructor.id,
      studentId: 'student-1',
      sessionTypeId: sessionType.id,
      startAtUtc: validSlot.startUtc,
      endAtUtc: validSlot.endUtc,
      status: 'cancelled',
      meetingProvider: 'zoom',
      meetingUrl: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    const result = cancelBooking(booking, now);
    expect(result.ok).toBe(false);
  });
});

describe('rescheduleBooking', () => {
  const existingBooking: Booking = {
    id: 'b1',
    instructorId: instructor.id,
    studentId: 'student-1',
    sessionTypeId: sessionType.id,
    startAtUtc: validSlot.startUtc,
    endAtUtc: validSlot.endUtc,
    status: 'confirmed',
    meetingProvider: 'zoom',
    meetingUrl: null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  it('moves a confirmed booking to a new valid slot', () => {
    const newSlot = {
      startUtc: zonedWallTimeToUtc('2026-03-02', '10:00', instructor.timezone).toISOString(),
      endUtc: zonedWallTimeToUtc('2026-03-02', '10:30', instructor.timezone).toISOString(),
    };
    const result = rescheduleBooking({
      booking: existingBooking,
      instructor,
      recurringRules: [mondayRule],
      exceptions: [],
      existingBookings: [existingBooking],
      newSlot,
      now,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.booking.startAtUtc).toBe(newSlot.startUtc);
      expect(result.booking.id).toBe(existingBooking.id);
    }
  });

  it('leaves the original booking untouched when the new slot is invalid', () => {
    const conflictingBooking: Booking = {
      ...existingBooking,
      id: 'b2',
      startAtUtc: zonedWallTimeToUtc('2026-03-02', '10:00', instructor.timezone).toISOString(),
      endAtUtc: zonedWallTimeToUtc('2026-03-02', '10:30', instructor.timezone).toISOString(),
    };
    const result = rescheduleBooking({
      booking: existingBooking,
      instructor,
      recurringRules: [mondayRule],
      exceptions: [],
      existingBookings: [existingBooking, conflictingBooking],
      newSlot: {
        startUtc: conflictingBooking.startAtUtc,
        endUtc: conflictingBooking.endAtUtc,
      },
      now,
    });
    expect(result.ok).toBe(false);
  });

  it('rejects rescheduling a cancelled booking', () => {
    const cancelled: Booking = { ...existingBooking, status: 'cancelled' };
    const newSlot = {
      startUtc: zonedWallTimeToUtc('2026-03-02', '10:00', instructor.timezone).toISOString(),
      endUtc: zonedWallTimeToUtc('2026-03-02', '10:30', instructor.timezone).toISOString(),
    };
    const result = rescheduleBooking({
      booking: cancelled,
      instructor,
      recurringRules: [mondayRule],
      exceptions: [],
      existingBookings: [cancelled],
      newSlot,
      now,
    });
    expect(result.ok).toBe(false);
  });
});
