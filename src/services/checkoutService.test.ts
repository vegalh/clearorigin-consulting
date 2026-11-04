import { describe, expect, it } from 'vitest';
import type { AppData, Course, Instructor, LearnerProfile, Student, TimeSlot } from '@/types';
import { createSeedData } from '@/data/seed';
import { generateAvailableSlots } from '@/lib/scheduling';
import { remainingCredits } from '@/lib/checkout';
import { bookingPolicy } from '@/config/bookingPolicy';
import {
  applyPaymentResult,
  beginPayment,
  cancelCheckout,
  cancelConfirmedBooking,
  confirmWithCredit,
  previewCancellation,
  reconcileOrphanedPayments,
  rescheduleConfirmedBooking,
  startCheckout,
  sweep,
} from './checkoutService';
import { createMockPaymentProvider } from './payments/mockPaymentProvider';

const NOW = new Date('2026-11-04T12:00:00Z');
const minutes = (n: number) => new Date(NOW.getTime() + n * 60_000);

const contact: Student = { id: 'student-test', fullName: 'Sam Taylor', email: 'sam@example.com' };
const learner: LearnerProfile = { name: 'Sam Taylor', bookedByGuardian: false, level: 'beginner', goal: 'travel' };

function fixture() {
  const data = createSeedData(NOW);
  const maya = data.instructors.find((i) => i.id === 'maya-chen')!;
  const course = (id: string) => data.courses.find((c) => c.id === id)!;
  return { data, maya, course };
}

function slotsFor(data: AppData, instructor: Instructor, course: Course, now = NOW): TimeSlot[] {
  return generateAvailableSlots({
    instructor,
    sessionType: data.sessionTypes.find((s) => s.id === course.sessionTypeId)!,
    recurringRules: data.recurringAvailability,
    exceptions: data.availabilityExceptions,
    existingBookings: data.bookings,
    now,
  });
}

/** Hold a paid lesson for the test student and return everything needed to continue. */
function holdLesson(courseId = 'lesson-45', data = fixture().data) {
  const { maya, course } = fixture();
  const slot = slotsFor(data, maya, course(courseId))[0];
  const result = startCheckout({ courseId, instructorId: maya.id, slot, contact, learner, mode: 'paid', currency: 'USD' }, data, NOW);
  if (!result.ok) throw new Error(result.reason);
  return { ...result, slot, maya };
}

async function pay(data: AppData, bookingId: string, outcome: 'success' | 'failure' | 'cancel' | 'timeout', at = minutes(1)) {
  const started = beginPayment({ bookingId, method: 'card_demo' }, data, at);
  if (!started.ok) throw new Error(started.reason);
  const result = await createMockPaymentProvider({ outcome }).createPayment(started.request);
  return { started, applied: applyPaymentResult({ paymentId: started.paymentId, result }, started.data, at) };
}

const bookingIn = (data: AppData, id: string) => data.bookings.find((b) => b.id === id)!;
const orderFor = (data: AppData, id: string) => data.orders.find((o) => o.id === bookingIn(data, id).orderId)!;

describe('course selection & compatibility', () => {
  it('rejects an instructor who does not teach the course', () => {
    const { data, course } = fixture();
    const david = data.instructors.find((i) => i.id === 'david-okafor')!;
    const maya = data.instructors.find((i) => i.id === 'maya-chen')!;
    const slot = slotsFor(data, maya, course('lesson-45'))[0];
    const result = startCheckout({ courseId: 'lesson-45', instructorId: david.id, slot, contact, learner, mode: 'paid' }, data, NOW);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/doesn't teach/);
  });

  it('rejects a slot whose length does not match the course duration', () => {
    const { data, maya, course } = fixture();
    const thirtyMinuteSlot = slotsFor(data, maya, course('lesson-30'))[0];
    const result = startCheckout(
      { courseId: 'lesson-45', instructorId: maya.id, slot: thirtyMinuteSlot, contact, learner, mode: 'paid' },
      data,
      NOW,
    );
    expect(result.ok).toBe(false);
  });

  it('charges the configured price in the chosen currency without converting', () => {
    const { data, maya, course } = fixture();
    const slot = slotsFor(data, maya, course('lesson-45'))[0];
    const usd = startCheckout({ courseId: 'lesson-45', instructorId: maya.id, slot, contact, learner, mode: 'paid', currency: 'USD' }, data, NOW);
    const cny = startCheckout({ courseId: 'lesson-45', instructorId: maya.id, slot, contact, learner, mode: 'paid', currency: 'CNY' }, data, NOW);
    expect(usd.ok && orderFor(usd.data, usd.bookingId).amount).toEqual({ amountMinor: 4000, currency: 'USD' });
    expect(cny.ok && orderFor(cny.data, cny.bookingId).amount).toEqual({ amountMinor: 28000, currency: 'CNY' });
  });
});

describe('temporary holds', () => {
  it('creates a held booking that blocks the slot for others until it expires', () => {
    const { data, bookingId, slot, maya } = holdLesson();
    const booking = bookingIn(data, bookingId);
    expect(booking.status).toBe('held');
    expect(new Date(booking.holdExpiresAt!).getTime()).toBe(minutes(bookingPolicy.holdMinutes).getTime());
    expect(booking.meeting?.status).toBe('awaiting_confirmation');
    expect(orderFor(data, bookingId).status).toBe('pending');

    const lesson45 = data.courses.find((c) => c.id === 'lesson-45')!;
    expect(slotsFor(data, maya, lesson45).some((s) => s.startUtc === slot.startUtc)).toBe(false);

    const other = startCheckout(
      { courseId: 'lesson-45', instructorId: maya.id, slot, contact: { ...contact, id: 'someone-else' }, learner, mode: 'paid' },
      data,
      minutes(1),
    );
    expect(other.ok).toBe(false);
  });

  it('expires the hold after the configured time and releases the slot', () => {
    const { data, bookingId, slot, maya } = holdLesson();
    const later = minutes(bookingPolicy.holdMinutes + 1);
    const swept = sweep(data, later);
    expect(bookingIn(swept, bookingId).status).toBe('expired');
    expect(bookingIn(swept, bookingId).releaseReason).toBe('hold_expired');
    expect(orderFor(swept, bookingId).status).toBe('expired');
    const lesson45 = swept.courses.find((c) => c.id === 'lesson-45')!;
    expect(slotsFor(swept, maya, lesson45, later).some((s) => s.startUtc === slot.startUtc)).toBe(true);
  });

  it('releases the hold immediately when the student cancels checkout', () => {
    const { data, bookingId } = holdLesson();
    const result = cancelCheckout(bookingId, data, minutes(2));
    expect(result.ok).toBe(true);
    expect(bookingIn(result.data, bookingId).status).toBe('cancelled');
    expect(bookingIn(result.data, bookingId).releaseReason).toBe('checkout_cancelled');
    expect(bookingIn(result.data, bookingId).confirmedAt).toBeUndefined();
    expect(orderFor(result.data, bookingId).status).toBe('cancelled');
  });

  it('honors a configurable hold duration', () => {
    const { data, maya, course } = fixture();
    const slot = slotsFor(data, maya, course('lesson-45'))[0];
    const result = startCheckout({ courseId: 'lesson-45', instructorId: maya.id, slot, contact, learner, mode: 'paid' }, data, NOW, {
      ...bookingPolicy,
      holdMinutes: 3,
    });
    expect(result.ok && bookingIn(result.data, result.bookingId).holdExpiresAt).toBe(minutes(3).toISOString());
  });

  it('keeps one active checkout per student by releasing the previous hold', () => {
    const first = holdLesson();
    const { maya, course } = fixture();
    const nextSlot = slotsFor(first.data, maya, course('lesson-45'))[5];
    const second = startCheckout(
      { courseId: 'lesson-45', instructorId: maya.id, slot: nextSlot, contact, learner, mode: 'paid' },
      first.data,
      minutes(1),
    );
    expect(second.ok).toBe(true);
    if (second.ok) expect(bookingIn(second.data, first.bookingId).status).toBe('cancelled');
  });

  it('prevents overlapping reservations for the same student across instructors', () => {
    const { data, maya, course } = fixture();
    const slot = slotsFor(data, maya, course('lesson-45'))[0];
    const held = startCheckout({ courseId: 'lesson-45', instructorId: maya.id, slot, contact, learner, mode: 'paid' }, data, NOW);
    if (!held.ok) throw new Error(held.reason);
    const begun = beginPayment({ bookingId: held.bookingId, method: 'card_demo' }, held.data, NOW);
    if (!begun.ok) throw new Error(begun.reason);
    // While the first checkout is pending payment, the same student can't hold an overlapping time elsewhere.
    const priya = data.instructors.find((i) => i.id === 'priya-nandakumar')!;
    const overlapping = startCheckout(
      { courseId: 'lesson-45', instructorId: priya.id, slot, contact, learner, mode: 'paid' },
      begun.data,
      NOW,
    );
    expect(overlapping.ok).toBe(false);
  });
});

describe('simulated payment', () => {
  it('confirms the booking only after a successful payment', async () => {
    const { data, bookingId } = holdLesson();
    const { started, applied } = await pay(data, bookingId, 'success');
    expect(bookingIn(started.data, bookingId).status).toBe('pending_payment');
    expect(applied.ok).toBe(true);
    const booking = bookingIn(applied.data, bookingId);
    expect(booking.status).toBe('confirmed');
    expect(booking.confirmedAt).toBeDefined();
    expect(booking.holdExpiresAt).toBeUndefined();
    expect(booking.meeting).toEqual({ provider: 'zoom', status: 'pending_creation', url: null });
    expect(orderFor(applied.data, bookingId).status).toBe('paid');
    const payment = applied.data.payments.find((p) => p.orderId === booking.orderId)!;
    expect(payment).toMatchObject({ status: 'succeeded', simulated: true });
    expect(payment.providerRef).toMatch(/^demo_/);
  });

  it.each(['failure', 'cancel', 'timeout'] as const)('does not confirm on %s and allows a retry while the hold lasts', async (outcome) => {
    const { data, bookingId } = holdLesson();
    const { applied } = await pay(data, bookingId, outcome);
    expect(applied.ok).toBe(true);
    expect(bookingIn(applied.data, bookingId).status).toBe('held');
    expect(orderFor(applied.data, bookingId).status).toBe('pending');

    const retry = await pay(applied.data, bookingId, 'success', minutes(2));
    expect(bookingIn(retry.applied.data, bookingId).status).toBe('confirmed');
    expect(retry.started.request.idempotencyKey).toMatch(/:2$/);
  });

  it('cannot confirm an unpaid paid booking with a credit or without payment', () => {
    const { data, bookingId } = holdLesson();
    const result = confirmWithCredit(bookingId, data, minutes(1));
    expect(result.ok).toBe(false);
    expect(bookingIn(result.data, bookingId).status).toBe('held');
  });

  it('refuses a second payment while one is processing, and after success (no duplicate charges)', async () => {
    const { data, bookingId } = holdLesson();
    const first = beginPayment({ bookingId, method: 'card_demo' }, data, minutes(1));
    if (!first.ok) throw new Error(first.reason);
    expect(beginPayment({ bookingId, method: 'card_demo' }, first.data, minutes(1)).ok).toBe(false);

    const { applied } = await pay(data, bookingId, 'success');
    expect(beginPayment({ bookingId, method: 'card_demo' }, applied.data, minutes(2)).ok).toBe(false);
    expect(applied.data.payments.filter((p) => p.status === 'succeeded' && p.orderId === bookingIn(applied.data, bookingId).orderId)).toHaveLength(1);
  });

  it('treats re-applying the same result as a no-op (double confirmation is impossible)', async () => {
    const { data, bookingId } = holdLesson();
    const started = beginPayment({ bookingId, method: 'card_demo' }, data, minutes(1));
    if (!started.ok) throw new Error(started.reason);
    const result = { status: 'succeeded' as const, providerRef: 'demo_x' };
    const once = applyPaymentResult({ paymentId: started.paymentId, result }, started.data, minutes(1));
    const twice = applyPaymentResult({ paymentId: started.paymentId, result }, once.data, minutes(1));
    expect(twice.ok).toBe(true);
    expect(twice.data).toBe(once.data);
    const conflicting = applyPaymentResult({ paymentId: started.paymentId, result: { status: 'failed', providerRef: 'demo_x' } }, once.data, minutes(1));
    expect(conflicting.ok).toBe(false);
  });

  it('does not confirm an expired hold even if a late payment succeeds; flags it for refund review', async () => {
    const { data, bookingId } = holdLesson();
    const started = beginPayment({ bookingId, method: 'card_demo' }, data, minutes(1));
    if (!started.ok) throw new Error(started.reason);
    const late = minutes(bookingPolicy.holdMinutes + 1);
    const applied = applyPaymentResult(
      { paymentId: started.paymentId, result: { status: 'succeeded', providerRef: 'demo_late' } },
      started.data,
      late,
    );
    expect(applied.ok).toBe(false);
    expect(bookingIn(applied.data, bookingId).status).toBe('expired');
    expect(orderFor(applied.data, bookingId).status).toBe('refund_pending');
    expect(applied.data.payments.find((p) => p.id === started.paymentId)!.status).toBe('succeeded');
  });

  it('refuses to pay for an expired hold', () => {
    const { data, bookingId } = holdLesson();
    const result = beginPayment({ bookingId, method: 'card_demo' }, data, minutes(bookingPolicy.holdMinutes + 1));
    expect(result.ok).toBe(false);
    expect(bookingIn(result.data, bookingId).status).toBe('expired');
  });

  it('only offers payment methods configured for the order currency', () => {
    const { data, bookingId } = holdLesson();
    expect(beginPayment({ bookingId, method: 'wechat_pay_demo' }, data, minutes(1)).ok).toBe(false);
  });

  it('reconciles a payment orphaned by a page reload without corrupting the hold', () => {
    const { data, bookingId } = holdLesson();
    const started = beginPayment({ bookingId, method: 'card_demo' }, data, minutes(1));
    if (!started.ok) throw new Error(started.reason);
    // Simulate a refresh: the data survives in storage but the in-flight promise is gone.
    const restored = reconcileOrphanedPayments(JSON.parse(JSON.stringify(started.data)), minutes(2));
    expect(restored.payments.find((p) => p.id === started.paymentId)!.status).toBe('timed_out');
    expect(bookingIn(restored, bookingId).status).toBe('held');
    expect(beginPayment({ bookingId, method: 'card_demo' }, restored, minutes(2)).ok).toBe(true);
  });
});

describe('package credits', () => {
  it('creates a balance and consumes one credit when a package purchase is paid', async () => {
    const { data, bookingId } = holdLesson('package-5x45');
    expect(orderFor(data, bookingId)).toMatchObject({ kind: 'package', amount: { amountMinor: 18500, currency: 'USD' } });
    expect(data.packageBalances.filter((b) => b.studentId === contact.id)).toHaveLength(0);

    const { applied } = await pay(data, bookingId, 'success');
    const balance = applied.data.packageBalances.find((b) => b.studentId === contact.id)!;
    expect(balance.totalCredits).toBe(5);
    expect(remainingCredits(balance)).toBe(4);
    expect(bookingIn(applied.data, bookingId).packageBalanceId).toBe(balance.id);
  });

  it('does not create credits when the package payment fails', async () => {
    const { data, bookingId } = holdLesson('package-5x45');
    const { applied } = await pay(data, bookingId, 'failure');
    expect(applied.data.packageBalances.filter((b) => b.studentId === contact.id)).toHaveLength(0);
  });

  function holdWithCredit(data = fixture().data, slotIndex = 10) {
    const { maya, course } = fixture();
    const slot = slotsFor(data, maya, course('lesson-45'))[slotIndex];
    const alex = data.students.find((s) => s.id === 'student-alex')!;
    const result = startCheckout(
      { courseId: 'lesson-45', instructorId: maya.id, slot, contact: alex, learner, mode: 'package_credit', balanceId: 'balance-alex-5x45' },
      data,
      NOW,
    );
    if (!result.ok) throw new Error(result.reason);
    return result;
  }

  const alexBalance = (data: AppData) => data.packageBalances.find((b) => b.id === 'balance-alex-5x45')!;

  it('consumes a credit only when the booking is confirmed, and only once', () => {
    const seeded = fixture().data;
    expect(remainingCredits(alexBalance(seeded))).toBe(3);

    const held = holdWithCredit(seeded);
    expect(remainingCredits(alexBalance(held.data))).toBe(3); // holding reserves nothing
    const confirmed = confirmWithCredit(held.bookingId, held.data, minutes(1));
    expect(confirmed.ok).toBe(true);
    expect(bookingIn(confirmed.data, held.bookingId).status).toBe('confirmed');
    expect(remainingCredits(alexBalance(confirmed.data))).toBe(2);

    const again = confirmWithCredit(held.bookingId, confirmed.data, minutes(1));
    expect(again.ok).toBe(false);
    expect(remainingCredits(alexBalance(again.data))).toBe(2);
  });

  it('does not consume a credit when a credit hold expires', () => {
    const held = holdWithCredit();
    const swept = sweep(held.data, minutes(bookingPolicy.holdMinutes + 1));
    expect(bookingIn(swept, held.bookingId).status).toBe('expired');
    expect(remainingCredits(alexBalance(swept))).toBe(3);
  });

  it('rejects redemption against an expired or exhausted balance', () => {
    const seeded = fixture().data;
    const expired = {
      ...seeded,
      packageBalances: seeded.packageBalances.map((b) => ({ ...b, expiresAt: minutes(-1).toISOString() })),
    };
    expect(() => holdWithCredit(expired)).toThrow(/no remaining credits|expired/);
  });

  it('restores the credit on a cancellation with enough notice', () => {
    const held = holdWithCredit(fixture().data, 200); // far enough out to have notice
    const confirmed = confirmWithCredit(held.bookingId, held.data, minutes(1));
    const booking = bookingIn(confirmed.data, held.bookingId);
    expect(previewCancellation(booking, confirmed.data, minutes(2)).outcome).toBe('credit_restored');
    const cancelled = cancelConfirmedBooking(held.bookingId, confirmed.data, minutes(2));
    expect(cancelled.ok && cancelled.outcome).toBe('credit_restored');
    expect(remainingCredits(alexBalance(cancelled.data))).toBe(3);
  });

  it('forfeits the credit on a late cancellation (configured policy)', () => {
    const held = holdWithCredit(fixture().data, 0);
    const confirmed = confirmWithCredit(held.bookingId, held.data, minutes(1));
    const lateNow = new Date(new Date(bookingIn(confirmed.data, held.bookingId).startAtUtc).getTime() - 60 * 60_000);
    const cancelled = cancelConfirmedBooking(held.bookingId, confirmed.data, lateNow);
    expect(cancelled.ok && cancelled.outcome).toBe('credit_forfeited');
    expect(remainingCredits(alexBalance(cancelled.data))).toBe(2);
  });
});

describe('cancellation & rescheduling of confirmed lessons', () => {
  async function confirmedLesson(slotIndex = 300) {
    const { data, maya, course } = fixture();
    const slot = slotsFor(data, maya, course('lesson-45'))[slotIndex];
    const held = startCheckout({ courseId: 'lesson-45', instructorId: maya.id, slot, contact, learner, mode: 'paid' }, data, NOW);
    if (!held.ok) throw new Error(held.reason);
    const { applied } = await pay(held.data, held.bookingId, 'success');
    return { data: applied.data, bookingId: held.bookingId, maya };
  }

  it('keeps the record and opens a refund review (never an automatic refund) with enough notice', async () => {
    const { data, bookingId } = await confirmedLesson();
    const result = cancelConfirmedBooking(bookingId, data, minutes(5));
    expect(result.ok && result.outcome).toBe('refund_review');
    expect(bookingIn(result.data, bookingId)).toMatchObject({ status: 'cancelled', confirmedAt: expect.any(String) });
    expect(orderFor(result.data, bookingId).status).toBe('refund_pending');
  });

  it('keeps the order paid (no refund) on a late cancellation — refund status is not booking status', async () => {
    const { data, bookingId } = await confirmedLesson(0);
    const lateNow = new Date(new Date(bookingIn(data, bookingId).startAtUtc).getTime() - 30 * 60_000);
    const result = cancelConfirmedBooking(bookingId, data, lateNow);
    expect(result.ok && result.outcome).toBe('no_refund');
    expect(bookingIn(result.data, bookingId).status).toBe('cancelled');
    expect(orderFor(result.data, bookingId).status).toBe('paid');
  });

  it('cannot cancel twice', async () => {
    const { data, bookingId } = await confirmedLesson();
    const once = cancelConfirmedBooking(bookingId, data, minutes(5));
    expect(cancelConfirmedBooking(bookingId, once.data, minutes(6)).ok).toBe(false);
  });

  it('reschedules to another open slot of the same length before the deadline', async () => {
    const { data, bookingId, maya } = await confirmedLesson();
    const lesson45 = data.courses.find((c) => c.id === 'lesson-45')!;
    const newSlot = slotsFor(data, maya, lesson45).at(-1)!;
    const result = rescheduleConfirmedBooking({ bookingId, newSlot }, data, minutes(5));
    expect(result.ok).toBe(true);
    expect(bookingIn(result.data, bookingId).startAtUtc).toBe(newSlot.startUtc);
    expect(orderFor(result.data, bookingId).status).toBe('paid');
  });

  it('refuses to reschedule after the deadline or to a different lesson length', async () => {
    const { data, bookingId, maya } = await confirmedLesson(0);
    const lesson30 = data.courses.find((c) => c.id === 'lesson-30')!;
    const shorter = slotsFor(data, maya, lesson30).at(-1)!;
    expect(rescheduleConfirmedBooking({ bookingId, newSlot: shorter }, data, minutes(5)).ok).toBe(false);

    const lesson45 = data.courses.find((c) => c.id === 'lesson-45')!;
    const newSlot = slotsFor(data, maya, lesson45).at(-1)!;
    const tooLate = new Date(new Date(bookingIn(data, bookingId).startAtUtc).getTime() - 2 * 60 * 60_000);
    const result = rescheduleConfirmedBooking({ bookingId, newSlot }, data, tooLate);
    expect(result.ok).toBe(false);
  });

  it('marks confirmed lessons as completed once they end', async () => {
    const { data, bookingId } = await confirmedLesson(0);
    const after = new Date(new Date(bookingIn(data, bookingId).endAtUtc).getTime() + 1);
    expect(bookingIn(sweep(data, after), bookingId).status).toBe('completed');
  });
});
