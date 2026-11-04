import { describe, expect, it } from 'vitest';
import { assertTransition, canTransitionBooking, canTransitionOrder, TransitionError } from './stateMachine';
import { configuredCurrencies, coursePrice, formatMoney, perLessonPrice } from './money';
import { demoCourses } from '@/data/courses';
import { demoInstructors } from '@/data/instructors';

describe('booking state machine', () => {
  it.each([
    ['held', 'pending_payment'],
    ['held', 'expired'],
    ['held', 'cancelled'],
    ['held', 'confirmed'], // package-credit redemption
    ['pending_payment', 'confirmed'],
    ['pending_payment', 'held'],
    ['pending_payment', 'expired'],
    ['confirmed', 'cancelled'],
    ['confirmed', 'completed'],
  ] as const)('allows %s → %s', (from, to) => {
    expect(canTransitionBooking(from, to)).toBe(true);
  });

  it.each([
    ['expired', 'confirmed'],
    ['expired', 'pending_payment'],
    ['cancelled', 'confirmed'],
    ['confirmed', 'confirmed'],
    ['completed', 'cancelled'],
    ['confirmed', 'held'],
  ] as const)('rejects %s → %s', (from, to) => {
    expect(canTransitionBooking(from, to)).toBe(false);
    expect(() => assertTransition('booking', from, to)).toThrow(TransitionError);
  });

  it('keeps refunds on the order, separate from booking cancellation', () => {
    expect(canTransitionOrder('paid', 'refund_pending')).toBe(true);
    expect(canTransitionOrder('paid', 'refunded')).toBe(false);
    expect(canTransitionOrder('cancelled', 'paid')).toBe(false);
  });
});

describe('catalog pricing', () => {
  it('formats money with an explicit currency code', () => {
    expect(formatMoney({ amountMinor: 4000, currency: 'USD' })).toBe('$40.00 USD');
    expect(formatMoney({ amountMinor: 28000, currency: 'CNY' })).toBe('¥280.00 CNY');
  });

  it('only offers configured currencies and never converts', () => {
    const trial = demoCourses.find((c) => c.id === 'trial-lesson')!;
    expect(configuredCurrencies(trial)).toEqual(['USD', 'CNY']);
    const usdOnly = { ...trial, prices: { USD: 1500 } };
    expect(coursePrice(usdOnly, 'CNY')).toBeNull();
  });

  it('has a duration and price for every course, and package details for packages', () => {
    for (const course of demoCourses) {
      expect([30, 45, 60]).toContain(course.durationMinutes);
      expect(configuredCurrencies(course).length).toBeGreaterThan(0);
      if (course.category === 'package') {
        expect(course.sessionCount).toBeGreaterThan(1);
        expect(course.redeemsCourseIds?.length).toBeGreaterThan(0);
        expect(course.terms?.length).toBeGreaterThan(0);
        expect(perLessonPrice(course, 'USD')!.amountMinor).toBeLessThan(coursePrice(course, 'USD')!.amountMinor);
      }
    }
  });

  it('only lets instructors teach courses that exist, and every course has a teacher', () => {
    const courseIds = new Set(demoCourses.map((c) => c.id));
    for (const instructor of demoInstructors) {
      for (const id of instructor.courseIds ?? []) expect(courseIds.has(id)).toBe(true);
    }
    for (const course of demoCourses) {
      expect(demoInstructors.some((i) => i.courseIds?.includes(course.id))).toBe(true);
    }
  });

  it('packages can be redeemed with at least one instructor who teaches the redeemable course', () => {
    for (const pkg of demoCourses.filter((c) => c.category === 'package')) {
      for (const redeemable of pkg.redeemsCourseIds!) {
        expect(demoInstructors.some((i) => i.courseIds?.includes(redeemable))).toBe(true);
      }
    }
  });
});
