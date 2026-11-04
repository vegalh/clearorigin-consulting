import { describe, expect, it } from 'vitest';
import { createSeedData } from './seed';
import { generateAvailableSlots } from '@/lib/scheduling/index';
import { localDateString } from '@/lib/scheduling/timezone';

describe('createSeedData', () => {
  const referenceDate = new Date('2026-11-04T12:00:00Z');

  it('is deterministic for a fixed reference date', () => {
    const a = createSeedData(referenceDate);
    const b = createSeedData(referenceDate);
    expect(a.bookings.map((bk) => [bk.instructorId, bk.startAtUtc, bk.status])).toEqual(
      b.bookings.map((bk) => [bk.instructorId, bk.startAtUtc, bk.status]),
    );
  });

  it('seeds 3-4 instructors, several session types, and at least one blocked date', () => {
    const data = createSeedData(referenceDate);
    expect(data.instructors.length).toBeGreaterThanOrEqual(3);
    expect(data.instructors.length).toBeLessThanOrEqual(4);
    expect(data.sessionTypes.length).toBeGreaterThanOrEqual(3);
    expect(data.availabilityExceptions.some((e) => e.type === 'blocked_day')).toBe(true);
  });

  it('seeds confirmed, cancelled, and completed bookings', () => {
    const data = createSeedData(referenceDate);
    const statuses = new Set(data.bookings.map((b) => b.status));
    expect(statuses.has('confirmed')).toBe(true);
    expect(statuses.has('cancelled')).toBe(true);
    expect(statuses.has('completed')).toBe(true);
  });

  it('produces at least one fully booked slot: the extra-hours exception leaves zero openings', () => {
    const data = createSeedData(referenceDate);
    const liang = data.instructors.find((i) => i.id === 'liang-wu')!;
    const conversationPractice = data.sessionTypes.find((s) => s.id === 'conversation-practice')!;
    const extraHoursException = data.availabilityExceptions.find(
      (e) => e.instructorId === 'liang-wu' && e.type === 'extra_hours',
    )!;
    expect(extraHoursException).toBeDefined();

    const slots = generateAvailableSlots({
      instructor: liang,
      sessionType: conversationPractice,
      recurringRules: data.recurringAvailability,
      exceptions: data.availabilityExceptions,
      existingBookings: data.bookings,
      now: referenceDate,
    });

    const slotsOnExceptionDate = slots.filter(
      (slot) => localDateString(new Date(slot.startUtc), liang.timezone) === extraHoursException.date,
    );
    expect(slotsOnExceptionDate.length).toBe(0);
  });

  it('does not generate any slot during the blocked_day exception for Maya Chen', () => {
    const data = createSeedData(referenceDate);
    const maya = data.instructors.find((i) => i.id === 'maya-chen')!;
    const blockedDay = data.availabilityExceptions.find((e) => e.instructorId === 'maya-chen' && e.type === 'blocked_day')!;

    const slots = generateAvailableSlots({
      instructor: maya,
      sessionType: data.sessionTypes[0],
      recurringRules: data.recurringAvailability,
      exceptions: data.availabilityExceptions,
      existingBookings: data.bookings,
      now: referenceDate,
    });

    const slotsOnBlockedDate = slots.filter(
      (slot) => localDateString(new Date(slot.startUtc), maya.timezone) === blockedDay.date,
    );
    expect(slotsOnBlockedDate.length).toBe(0);
  });
});
