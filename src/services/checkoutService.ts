import type {
  AppData,
  Booking,
  BookingStatus,
  CurrencyCode,
  LearnerProfile,
  Order,
  OrderStatus,
  PackageCreditBalance,
  Payment,
  PaymentMethodId,
  PaymentStatus,
  Student,
  TimeSlot,
} from '@/types';
import { bookingPolicy as defaultPolicy, type BookingPolicy } from '@/config/bookingPolicy';
import { blocksSlot, rescheduleBooking, validateSlot } from '@/lib/scheduling';
import {
  assertTransition,
  CHECKOUT_STATUSES,
  coursePrice,
  isBalanceRedeemable,
  referenceFromId,
} from '@/lib/checkout';
import { methodsForCurrency } from './payments/methods';
import type { PaymentRequest, PaymentResult } from './payments/types';

/**
 * Checkout & booking lifecycle for V3, as pure functions over AppData.
 *
 * Every function takes the current data plus an explicit `now`, sweeps
 * expired holds first, and returns the next data — nothing here touches
 * localStorage or React. All status changes go through
 * lib/checkout/stateMachine.ts. See docs/BOOKING_V3_PLAN.md §4–7.
 *
 * PROTOTYPE LIMITATION: this logic runs in the browser, so holds only protect
 * a slot within this browser profile. Production must run the same
 * transitions server-side with database constraints and webhook-verified
 * payments.
 */

export type CheckoutResult<T extends object = object> =
  | ({ ok: true; data: AppData } & T)
  | { ok: false; reason: string; data: AppData };

const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;

function fail(data: AppData, reason: string): { ok: false; reason: string; data: AppData } {
  return { ok: false, reason, data };
}

function setBookingStatus(booking: Booking, to: BookingStatus, now: Date, patch: Partial<Booking> = {}): Booking {
  assertTransition('booking', booking.status, to);
  return { ...booking, ...patch, status: to, updatedAt: now.toISOString() };
}

function setOrderStatus(order: Order, to: OrderStatus, now: Date): Order {
  assertTransition('order', order.status, to);
  return { ...order, status: to, updatedAt: now.toISOString() };
}

function setPaymentStatus(payment: Payment, to: PaymentStatus, now: Date, patch: Partial<Payment> = {}): Payment {
  assertTransition('payment', payment.status, to);
  return { ...payment, ...patch, status: to, updatedAt: now.toISOString() };
}

function replace<T extends { id: string }>(items: T[], next: T): T[] {
  return items.map((item) => (item.id === next.id ? next : item));
}

function isHoldActive(booking: Booking, now: Date): boolean {
  return CHECKOUT_STATUSES.includes(booking.status) && blocksSlot(booking, now);
}

function overlaps(a: { startAtUtc: string; endAtUtc: string }, slot: TimeSlot): boolean {
  return (
    new Date(slot.startUtc).getTime() < new Date(a.endAtUtc).getTime() &&
    new Date(slot.endUtc).getTime() > new Date(a.startAtUtc).getTime()
  );
}

// --- Sweeps -----------------------------------------------------------------------

/**
 * Release holds whose time ran out, time out payments stuck in "processing",
 * and mark finished confirmed lessons as completed. Safe to run at any time
 * (idempotent); every other operation runs it first.
 */
export function sweep(data: AppData, now: Date, policy: BookingPolicy = defaultPolicy): AppData {
  let changed = false;
  let { bookings, orders, payments } = data;

  // 1. Payments stuck in processing past the timeout.
  payments = payments.map((payment) => {
    if (payment.status !== 'processing') return payment;
    const age = now.getTime() - new Date(payment.createdAt).getTime();
    if (age < policy.paymentTimeoutSeconds * 1000) return payment;
    changed = true;
    return setPaymentStatus(payment, 'timed_out', now, { failureReason: 'The simulated payment did not complete in time.' });
  });

  // 2. A pending_payment booking with no processing attempt goes back to held.
  bookings = bookings.map((booking) => {
    if (booking.status !== 'pending_payment') return booking;
    const stillProcessing = payments.some((p) => p.orderId === booking.orderId && p.status === 'processing');
    if (stillProcessing) return booking;
    changed = true;
    return setBookingStatus(booking, 'held', now);
  });

  // 3. Expired holds.
  bookings = bookings.map((booking) => {
    if (!CHECKOUT_STATUSES.includes(booking.status) || blocksSlot(booking, now)) return booking;
    changed = true;
    if (booking.orderId) {
      orders = orders.map((order) =>
        order.id === booking.orderId && order.status === 'pending' ? setOrderStatus(order, 'expired', now) : order,
      );
    }
    payments = payments.map((p) =>
      p.orderId === booking.orderId && p.status === 'processing'
        ? setPaymentStatus(p, 'timed_out', now, { failureReason: 'The hold expired before payment completed.' })
        : p,
    );
    return setBookingStatus(booking, 'expired', now, { releaseReason: 'hold_expired' });
  });

  // 4. Confirmed lessons that have ended.
  bookings = bookings.map((booking) => {
    if (booking.status !== 'confirmed' || new Date(booking.endAtUtc).getTime() > now.getTime()) return booking;
    changed = true;
    return setBookingStatus(booking, 'completed', now);
  });

  return changed ? { ...data, bookings, orders, payments } : data;
}

/**
 * Called once when the app boots: the mock provider's in-flight promises die
 * with the page, so any payment still "processing" can never resolve and is
 * timed out immediately (production would instead wait for the webhook).
 */
export function reconcileOrphanedPayments(data: AppData, now: Date): AppData {
  if (!data.payments.some((p) => p.status === 'processing')) return data;
  const payments = data.payments.map((p) =>
    p.status === 'processing'
      ? setPaymentStatus(p, 'timed_out', now, { failureReason: 'The page was reloaded before the simulated payment finished.' })
      : p,
  );
  return sweep({ ...data, payments }, now);
}

// --- Start checkout (place hold) ----------------------------------------------------

export interface StartCheckoutInput {
  courseId: string;
  instructorId: string;
  slot: TimeSlot;
  contact: Student;
  learner: LearnerProfile;
  notes?: string;
  /** `package_credit` books with an existing balance; otherwise the course is paid for. */
  mode: 'paid' | 'package_credit';
  balanceId?: string;
  currency?: CurrencyCode;
}

export function startCheckout(
  input: StartCheckoutInput,
  current: AppData,
  now: Date,
  policy: BookingPolicy = defaultPolicy,
): CheckoutResult<{ bookingId: string }> {
  let data = sweep(current, now, policy);

  const course = data.courses.find((c) => c.id === input.courseId);
  if (!course) return fail(data, 'That course is not available.');
  const instructor = data.instructors.find((i) => i.id === input.instructorId);
  if (!instructor) return fail(data, 'That instructor is not available.');

  // Package-credit bookings schedule the lesson course the package redeems for.
  let balance: PackageCreditBalance | undefined;
  if (input.mode === 'package_credit') {
    balance = data.packageBalances.find((b) => b.id === input.balanceId);
    if (!balance || balance.studentId !== input.contact.id) return fail(data, 'Package credits not found.');
    if (!isBalanceRedeemable(balance, now)) return fail(data, 'This package has no remaining credits, or it has expired.');
    const pkg = data.courses.find((c) => c.id === balance!.packageCourseId);
    if (!pkg?.redeemsCourseIds?.includes(course.id)) return fail(data, 'This package cannot be used for that course.');
  }

  if (!(instructor.courseIds ?? []).includes(course.id)) {
    return fail(data, `${instructor.name} doesn't teach the ${course.title}.`);
  }

  const durationMs = new Date(input.slot.endUtc).getTime() - new Date(input.slot.startUtc).getTime();
  if (durationMs !== course.durationMinutes * MS_PER_MINUTE) {
    return fail(data, 'The selected time does not match the course length.');
  }

  let amount = null;
  if (input.mode === 'paid') {
    amount = coursePrice(course, input.currency ?? 'USD');
    if (!amount) return fail(data, 'That currency is not configured for this course.');
  }

  // One active checkout per student: starting a new one releases the previous hold.
  for (const existing of data.bookings) {
    if (existing.studentId === input.contact.id && isHoldActive(existing, now) && existing.status === 'held') {
      const released = cancelCheckout(existing.id, data, now, policy);
      if (released.ok) data = released.data;
    }
  }

  // No two active reservations for the same student at overlapping times.
  const studentClash = data.bookings.some(
    (b) => b.studentId === input.contact.id && blocksSlot(b, now) && overlaps(b, input.slot),
  );
  if (studentClash) return fail(data, 'You already have a lesson or checkout at an overlapping time.');

  const validation = validateSlot({
    instructor,
    slot: input.slot,
    recurringRules: data.recurringAvailability,
    exceptions: data.availabilityExceptions,
    existingBookings: data.bookings,
    now,
  });
  if (!validation.ok) return fail(data, validation.reason);

  const nowIso = now.toISOString();
  const bookingId = crypto.randomUUID();
  const meetingProvider =
    data.meetingConfigurations.find((m) => m.instructorId === instructor.id)?.provider ?? 'zoom';

  let order: Order | undefined;
  if (amount) {
    const orderId = crypto.randomUUID();
    order = {
      id: orderId,
      reference: referenceFromId(orderId),
      studentId: input.contact.id,
      courseId: course.id,
      bookingId,
      kind: course.category === 'package' ? 'package' : 'lesson',
      amount,
      status: 'pending',
      attemptCount: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
  }

  const booking: Booking = {
    id: bookingId,
    instructorId: instructor.id,
    studentId: input.contact.id,
    sessionTypeId: course.sessionTypeId,
    courseId: course.id,
    startAtUtc: input.slot.startUtc,
    endAtUtc: input.slot.endUtc,
    status: 'held',
    meetingProvider,
    meetingUrl: null,
    meeting: { provider: meetingProvider, status: 'awaiting_confirmation', url: null },
    learner: input.learner,
    studentNotes: input.notes?.trim() || undefined,
    paymentMode: input.mode,
    orderId: order?.id,
    packageBalanceId: balance?.id,
    holdExpiresAt: new Date(now.getTime() + policy.holdMinutes * MS_PER_MINUTE).toISOString(),
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const students = data.students.some((s) => s.id === input.contact.id)
    ? data.students.map((s) => (s.id === input.contact.id ? input.contact : s))
    : [...data.students, input.contact];

  return {
    ok: true,
    bookingId,
    data: {
      ...data,
      students,
      bookings: [...data.bookings, booking],
      orders: order ? [...data.orders, order] : data.orders,
    },
  };
}

// --- Payment ----------------------------------------------------------------------

export function beginPayment(
  input: { bookingId: string; method: PaymentMethodId },
  current: AppData,
  now: Date,
  policy: BookingPolicy = defaultPolicy,
): CheckoutResult<{ paymentId: string; request: PaymentRequest }> {
  const data = sweep(current, now, policy);
  const booking = data.bookings.find((b) => b.id === input.bookingId);
  if (!booking) return fail(data, 'Checkout not found.');
  if (booking.status === 'expired') return fail(data, 'Your hold has expired. Please choose a time again.');
  if (booking.status === 'pending_payment') return fail(data, 'A payment is already in progress.');
  if (booking.status !== 'held') return fail(data, 'This checkout can no longer be paid.');
  if (booking.paymentMode !== 'paid' || !booking.orderId) return fail(data, 'This booking does not need payment.');

  const order = data.orders.find((o) => o.id === booking.orderId);
  if (!order || order.status !== 'pending') return fail(data, 'This order can no longer be paid.');
  if (!methodsForCurrency(order.amount.currency).some((m) => m.id === input.method)) {
    return fail(data, 'That payment method is not available for this currency.');
  }

  const orderPayments = data.payments.filter((p) => p.orderId === order.id);
  if (orderPayments.some((p) => p.status === 'succeeded')) return fail(data, 'This order has already been paid.');
  if (orderPayments.some((p) => p.status === 'processing')) return fail(data, 'A payment is already in progress.');

  const attempt = order.attemptCount + 1;
  const idempotencyKey = `${order.id}:${attempt}`;
  if (data.payments.some((p) => p.idempotencyKey === idempotencyKey)) {
    return fail(data, 'Duplicate payment attempt.');
  }

  const nowIso = now.toISOString();
  const payment: Payment = {
    id: crypto.randomUUID(),
    orderId: order.id,
    method: input.method,
    amount: order.amount,
    status: 'processing',
    idempotencyKey,
    providerRef: '',
    simulated: true,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  return {
    ok: true,
    paymentId: payment.id,
    request: { orderId: order.id, idempotencyKey, amount: order.amount, method: input.method },
    data: {
      ...data,
      bookings: replace(data.bookings, setBookingStatus(booking, 'pending_payment', now)),
      orders: replace(data.orders, { ...order, attemptCount: attempt, updatedAt: nowIso }),
      payments: [...data.payments, payment],
    },
  };
}

/** Create the credit balance for a purchased package and consume one credit for its first lesson. */
function grantPackage(data: AppData, order: Order, booking: Booking, now: Date): { data: AppData; balanceId: string } {
  const course = data.courses.find((c) => c.id === order.courseId)!;
  const balance: PackageCreditBalance = {
    id: crypto.randomUUID(),
    studentId: order.studentId,
    packageCourseId: course.id,
    orderId: order.id,
    totalCredits: course.sessionCount ?? 1,
    redemptions: [{ bookingId: booking.id, status: 'consumed', at: now.toISOString() }],
    purchasedAt: now.toISOString(),
    expiresAt: course.validityDays
      ? new Date(now.getTime() + course.validityDays * 24 * MS_PER_HOUR).toISOString()
      : undefined,
  };
  return { data: { ...data, packageBalances: [...data.packageBalances, balance] }, balanceId: balance.id };
}

/**
 * Apply a provider's terminal result. Only a `succeeded` result for the
 * booking's own order, arriving while the hold is still active, confirms the
 * booking. A success that arrives after the hold expired is recorded and the
 * order is flagged `refund_pending` — the lesson is NOT confirmed.
 * Re-applying the same result is a no-op (idempotent).
 */
export function applyPaymentResult(
  input: { paymentId: string; result: PaymentResult },
  current: AppData,
  now: Date,
  policy: BookingPolicy = defaultPolicy,
): CheckoutResult<{ bookingStatus: BookingStatus }> {
  let data = current;
  const payment = data.payments.find((p) => p.id === input.paymentId);
  if (!payment) return fail(data, 'Payment not found.');
  const order = data.orders.find((o) => o.id === payment.orderId);
  const booking = order && data.bookings.find((b) => b.id === order.bookingId);
  if (!order || !booking) return fail(data, 'Order not found.');

  if (payment.status !== 'processing') {
    if (payment.status === input.result.status) return { ok: true, data, bookingStatus: booking.status };
    return fail(data, 'This payment has already been resolved.');
  }

  const resolved = setPaymentStatus(payment, input.result.status, now, {
    providerRef: input.result.providerRef,
    failureReason: input.result.failureReason,
  });
  data = { ...data, payments: replace(data.payments, resolved) };

  if (resolved.status !== 'succeeded') {
    data = sweep(data, now, policy); // returns pending_payment → held, or expires it
    const after = data.bookings.find((b) => b.id === booking.id)!;
    return { ok: true, data, bookingStatus: after.status };
  }

  // Expiry beats a late payment: only a still-active hold is confirmed.
  if (booking.status !== 'pending_payment' || !blocksSlot(booking, now)) {
    data = sweep(data, now, policy); // releases the hold and expires the order
    const expiredOrder = data.orders.find((o) => o.id === order.id)!;
    const flagged =
      expiredOrder.status === 'expired' || expiredOrder.status === 'pending'
        ? setOrderStatus(expiredOrder, 'refund_pending', now)
        : expiredOrder;
    data = { ...data, orders: replace(data.orders, flagged) };
    return fail(data, 'Your hold expired before the payment finished. The payment was recorded and flagged for a refund review.');
  }

  const live = booking;
  const liveOrder = order;

  let balanceId: string | undefined;
  if (liveOrder.kind === 'package') {
    const granted = grantPackage(data, liveOrder, live, now);
    data = granted.data;
    balanceId = granted.balanceId;
  }

  const confirmed = setBookingStatus(live, 'confirmed', now, {
    holdExpiresAt: undefined,
    confirmedAt: now.toISOString(),
    packageBalanceId: balanceId ?? live.packageBalanceId,
    meeting: { ...(live.meeting ?? { provider: live.meetingProvider, url: null }), status: 'pending_creation', url: null },
  });

  return {
    ok: true,
    bookingStatus: 'confirmed',
    data: {
      ...data,
      bookings: replace(data.bookings, confirmed),
      orders: replace(data.orders, setOrderStatus(liveOrder, 'paid', now)),
    },
  };
}

// --- Package credit redemption ------------------------------------------------------

export function confirmWithCredit(
  bookingId: string,
  current: AppData,
  now: Date,
  policy: BookingPolicy = defaultPolicy,
): CheckoutResult {
  const data = sweep(current, now, policy);
  const booking = data.bookings.find((b) => b.id === bookingId);
  if (!booking) return fail(data, 'Checkout not found.');
  if (booking.status === 'confirmed') return fail(data, 'This lesson is already confirmed.');
  if (booking.status === 'expired') return fail(data, 'Your hold has expired. Please choose a time again.');
  if (booking.status !== 'held' || booking.paymentMode !== 'package_credit') {
    return fail(data, 'This booking cannot be confirmed with a credit.');
  }

  const balance = data.packageBalances.find((b) => b.id === booking.packageBalanceId);
  if (!balance || balance.studentId !== booking.studentId) return fail(data, 'Package credits not found.');
  if (balance.redemptions.some((r) => r.bookingId === booking.id && r.status === 'consumed')) {
    return fail(data, 'A credit has already been used for this lesson.');
  }
  if (!isBalanceRedeemable(balance, now)) return fail(data, 'This package has no remaining credits, or it has expired.');

  const nowIso = now.toISOString();
  const nextBalance: PackageCreditBalance = {
    ...balance,
    redemptions: [...balance.redemptions, { bookingId: booking.id, status: 'consumed', at: nowIso }],
  };
  const confirmed = setBookingStatus(booking, 'confirmed', now, {
    holdExpiresAt: undefined,
    confirmedAt: nowIso,
    meeting: { ...(booking.meeting ?? { provider: booking.meetingProvider, url: null }), status: 'pending_creation', url: null },
  });

  return {
    ok: true,
    data: {
      ...data,
      bookings: replace(data.bookings, confirmed),
      packageBalances: data.packageBalances.map((b) => (b.id === balance.id ? nextBalance : b)),
    },
  };
}

// --- Leaving checkout ---------------------------------------------------------------

/** Student backs out of checkout: release the slot right away. */
export function cancelCheckout(
  bookingId: string,
  current: AppData,
  now: Date,
  policy: BookingPolicy = defaultPolicy,
): CheckoutResult {
  const data = sweep(current, now, policy);
  const booking = data.bookings.find((b) => b.id === bookingId);
  if (!booking) return fail(data, 'Checkout not found.');
  if (booking.status === 'pending_payment') return fail(data, 'Please wait for the payment in progress to finish.');
  if (booking.status !== 'held') return fail(data, 'This checkout is no longer active.');

  const orders = data.orders.map((o) => (o.id === booking.orderId && o.status === 'pending' ? setOrderStatus(o, 'cancelled', now) : o));
  return {
    ok: true,
    data: {
      ...data,
      orders,
      bookings: replace(data.bookings, setBookingStatus(booking, 'cancelled', now, { releaseReason: 'checkout_cancelled' })),
    },
  };
}

// --- After confirmation: cancel & reschedule ----------------------------------------

export type CancellationOutcome = 'refund_review' | 'no_refund' | 'credit_restored' | 'credit_forfeited' | 'no_payment_recorded';

export interface CancellationPreview {
  eligible: boolean;
  outcome: CancellationOutcome;
  hoursNotice: number;
}

function hoursUntil(booking: Booking, now: Date): number {
  return (new Date(booking.startAtUtc).getTime() - now.getTime()) / MS_PER_HOUR;
}

/** What cancelling would do, shown to the student before they confirm. */
export function previewCancellation(booking: Booking, data: AppData, now: Date, policy: BookingPolicy = defaultPolicy): CancellationPreview {
  const hoursNotice = hoursUntil(booking, now);
  const eligible = hoursNotice >= policy.cancellationNoticeHours;
  let outcome: CancellationOutcome = 'no_payment_recorded';
  if (booking.packageBalanceId) {
    outcome = eligible ? 'credit_restored' : 'credit_forfeited';
  } else if (booking.orderId && data.orders.find((o) => o.id === booking.orderId)?.status === 'paid') {
    outcome = eligible ? 'refund_review' : 'no_refund';
  }
  return { eligible, outcome, hoursNotice };
}

export function cancelConfirmedBooking(
  bookingId: string,
  current: AppData,
  now: Date,
  policy: BookingPolicy = defaultPolicy,
): CheckoutResult<{ outcome: CancellationOutcome }> {
  const data = sweep(current, now, policy);
  const booking = data.bookings.find((b) => b.id === bookingId);
  if (!booking) return fail(data, 'Booking not found.');
  if (booking.status === 'cancelled') return fail(data, 'This booking is already cancelled.');
  if (booking.status !== 'confirmed') return fail(data, 'Only upcoming confirmed lessons can be cancelled.');

  const { outcome } = previewCancellation(booking, data, now, policy);
  const nowIso = now.toISOString();
  let { orders, packageBalances } = data;

  if (outcome === 'refund_review') {
    orders = orders.map((o) => (o.id === booking.orderId ? setOrderStatus(o, 'refund_pending', now) : o));
  }
  if (outcome === 'credit_restored' || outcome === 'credit_forfeited') {
    const status = outcome === 'credit_restored' ? 'restored' : 'forfeited';
    packageBalances = packageBalances.map((b) =>
      b.id === booking.packageBalanceId
        ? {
            ...b,
            redemptions: b.redemptions.map((r) =>
              r.bookingId === booking.id && r.status === 'consumed' ? { ...r, status, at: nowIso } : r,
            ),
          }
        : b,
    );
  }

  return {
    ok: true,
    outcome,
    data: {
      ...data,
      orders,
      packageBalances,
      bookings: replace(data.bookings, setBookingStatus(booking, 'cancelled', now, { cancelledAt: nowIso })),
    },
  };
}

export function canReschedule(booking: Booking, now: Date, policy: BookingPolicy = defaultPolicy): boolean {
  return booking.status === 'confirmed' && hoursUntil(booking, now) >= policy.rescheduleNoticeHours;
}

/**
 * Move a confirmed lesson to another open time with the same instructor and
 * the same lesson length, so no price difference can arise (a different-length
 * course would need a new booking). Delegates to the v1 engine for revalidation.
 */
export function rescheduleConfirmedBooking(
  input: { bookingId: string; newSlot: TimeSlot },
  current: AppData,
  now: Date,
  policy: BookingPolicy = defaultPolicy,
): CheckoutResult {
  const data = sweep(current, now, policy);
  const booking = data.bookings.find((b) => b.id === input.bookingId);
  if (!booking) return fail(data, 'Booking not found.');
  if (booking.status !== 'confirmed') return fail(data, 'Only confirmed bookings can be rescheduled.');
  if (!canReschedule(booking, now, policy)) {
    return fail(data, `Lessons can be rescheduled up to ${policy.rescheduleNoticeHours} hours before they start.`);
  }
  const currentLength = new Date(booking.endAtUtc).getTime() - new Date(booking.startAtUtc).getTime();
  const newLength = new Date(input.newSlot.endUtc).getTime() - new Date(input.newSlot.startUtc).getTime();
  if (currentLength !== newLength) return fail(data, 'The new time must be the same lesson length.');

  const instructor = data.instructors.find((i) => i.id === booking.instructorId);
  if (!instructor) return fail(data, 'Instructor not found.');

  const result = rescheduleBooking({
    booking,
    instructor,
    recurringRules: data.recurringAvailability,
    exceptions: data.availabilityExceptions,
    existingBookings: data.bookings,
    newSlot: input.newSlot,
    now,
  });
  if (!result.ok) return fail(data, result.reason);
  return { ok: true, data: { ...data, bookings: replace(data.bookings, result.booking) } };
}
