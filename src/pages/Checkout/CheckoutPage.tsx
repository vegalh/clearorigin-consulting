import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import type { PaymentMethodId } from '@/types';
import { useAppData } from '@/state/AppDataContext';
import { useNow } from '@/hooks/useNow';
import { Card } from '@/components/ui/Card';
import { Button, ButtonLink } from '@/components/ui/Button';
import { DemoLabel, DraftLabel } from '@/components/ui/Badge';
import { BookingProgress } from '@/components/booking/BookingProgress';
import { HoldCountdown } from '@/components/booking/HoldCountdown';
import { policySummary } from '@/config/bookingPolicy';
import { labelForGoal, labelForLevel } from '@/config/learnerOptions';
import { methodsForCurrency } from '@/services/payments/methods';
import type { SimulatedOutcome } from '@/services/payments/types';
import { blocksSlot } from '@/lib/scheduling';
import { formatMoney, remainingCredits } from '@/lib/checkout';
import { formatDisplayDate, formatDisplayTimeRange } from '@/lib/dates/format';

const outcomes: { value: SimulatedOutcome; label: string }[] = [
  { value: 'success', label: 'Payment succeeds' },
  { value: 'failure', label: 'Payment fails' },
  { value: 'cancel', label: 'I cancel the payment' },
  { value: 'timeout', label: 'Payment times out' },
];

export function CheckoutPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { data, viewerTimezone, payForBooking, confirmWithCredit, cancelCheckout } = useAppData();
  const now = useNow(1000);

  const booking = data.bookings.find((b) => b.id === bookingId);
  const order = booking?.orderId ? data.orders.find((o) => o.id === booking.orderId) : undefined;
  const methods = order ? methodsForCurrency(order.amount.currency) : [];
  const [method, setMethod] = useState<PaymentMethodId | null>(null);
  const [outcome, setOutcome] = useState<SimulatedOutcome>('success');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!booking) return <Navigate to="/book" replace />;
  if (booking.status === 'confirmed' || booking.status === 'completed') return <Navigate to={`/booking/success/${booking.id}`} replace />;

  const course = data.courses.find((c) => c.id === booking.courseId);
  const instructor = data.instructors.find((i) => i.id === booking.instructorId);
  const balance = data.packageBalances.find((b) => b.id === booking.packageBalanceId);
  const restartLink = `/book?${new URLSearchParams({ ...(course ? { course: course.id } : {}), instructor: booking.instructorId }).toString()}`;

  // Treat a hold as over the moment its time runs out, even before the background sweep rewrites it.
  const holdActive = (booking.status === 'held' || booking.status === 'pending_payment') && blocksSlot(booking, now);

  if (!holdActive) {
    const cancelled = booking.status === 'cancelled';
    return (
      <div className="mx-auto max-w-xl px-4 py-10 sm:px-6 sm:py-16">
        <BookingProgress current="Payment" />
        <Card>
          <h1 className="font-serif text-2xl font-medium tracking-tight text-co-ink">
            {cancelled ? 'You left checkout.' : 'Your hold has expired.'}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-co-muted">
            {cancelled
              ? 'The time has been released and nothing was charged.'
              : 'We released the time so others can book it. Nothing was confirmed, and no lesson credit was used.'}
            {order?.status === 'refund_pending' && ' A simulated payment arrived after the hold ended; it has been flagged for a refund review.'}
          </p>
          <ButtonLink to={restartLink} variant="primary" className="mt-6">
            Choose a time again
          </ButtonLink>
        </Card>
      </div>
    );
  }

  const attempts = order ? data.payments.filter((p) => p.orderId === order.id) : [];
  const lastAttempt = attempts.at(-1);
  const processing = booking.status === 'pending_payment' || busy;
  const selectedMethod = method ?? methods[0]?.id ?? null;

  const handlePay = async () => {
    if (!selectedMethod) return;
    setBusy(true);
    setMessage(null);
    const result = await payForBooking(booking.id, selectedMethod, outcome);
    setBusy(false);
    if (result.ok) navigate(`/booking/success/${booking.id}`);
    else setMessage(result.reason);
  };

  const handleCredit = () => {
    const result = confirmWithCredit(booking.id);
    if (result.ok) navigate(`/booking/success/${booking.id}`);
    else setMessage(result.reason);
  };

  const handleLeave = () => {
    const result = cancelCheckout(booking.id);
    if (!result.ok) setMessage(result.reason);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <BookingProgress current="Payment" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-5">
          <div>
            <h1 className="font-serif text-2xl font-medium tracking-tight text-co-ink sm:text-3xl">
              {booking.paymentMode === 'package_credit' ? 'Confirm with your package credit' : 'Review and pay'}
            </h1>
            <p className="mt-2 text-sm text-co-muted">Your lesson is confirmed only once this step succeeds.</p>
          </div>

          {/* Phones: the full order summary sits below the form, so lead with the essentials. */}
          <div className="rounded-co-md border border-co-line bg-co-paper px-4 py-3 text-sm lg:hidden">
            <p className="font-medium text-co-ink">
              {course?.title} · {instructor?.name}
            </p>
            <p className="text-co-muted">
              {formatDisplayDate(booking.startAtUtc, viewerTimezone)}, {formatDisplayTimeRange(booking.startAtUtc, booking.endAtUtc, viewerTimezone)}
            </p>
            <p className="mt-1 font-medium text-co-ink">{order ? formatMoney(order.amount) : '1 package credit'}</p>
          </div>

          {booking.holdExpiresAt && <HoldCountdown expiresAt={booking.holdExpiresAt} now={now} />}

          {booking.paymentMode === 'package_credit' && balance ? (
            <Card>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-co-sage-dark">Covered by your package</h2>
              <p className="mt-3 text-sm text-co-ink">
                This lesson uses 1 credit. You have {remainingCredits(balance)} of {balance.totalCredits} credits; {remainingCredits(balance) - 1}{' '}
                will remain after confirming. No payment is needed.
              </p>
              <Button variant="primary" className="mt-5 w-full sm:w-auto" onClick={handleCredit}>
                Confirm with 1 credit
              </Button>
            </Card>
          ) : (
            order && (
              <Card>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-co-sage-dark">Payment method</h2>
                  <DemoLabel>Simulated</DemoLabel>
                </div>
                <fieldset className="mt-3" disabled={processing}>
                  <legend className="sr-only">Payment method</legend>
                  <div className="grid grid-cols-1 gap-2">
                    {methods.map((m) => (
                      <label
                        key={m.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-co-md border p-4 transition-colors ${
                          selectedMethod === m.id ? 'border-co-orange-dark bg-co-pale/40' : 'border-co-line hover:border-co-orange-dark'
                        }`}
                      >
                        <input
                          type="radio"
                          name="method"
                          value={m.id}
                          checked={selectedMethod === m.id}
                          onChange={() => setMethod(m.id)}
                          className="mt-1 h-4 w-4 shrink-0"
                        />
                        <span>
                          <span className="block text-sm font-medium text-co-ink">{m.label}</span>
                          <span className="block text-xs text-co-muted">{m.description}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                  {order.amount.currency === 'USD' && (
                    <p className="mt-2 text-xs text-co-muted">WeChat Pay and Alipay demos are available when you pay in CNY.</p>
                  )}
                </fieldset>

                <fieldset className="mt-5 rounded-co-md border border-dashed border-co-line bg-co-bg p-4" disabled={processing}>
                  <legend className="px-1 text-xs font-medium text-co-muted">Demo outcome (prototype only)</legend>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {outcomes.map((o) => (
                      <label key={o.value} className="flex items-center gap-2 text-sm text-co-ink">
                        <input
                          type="radio"
                          name="outcome"
                          value={o.value}
                          checked={outcome === o.value}
                          onChange={() => setOutcome(o.value)}
                          className="h-4 w-4"
                        />
                        {o.label}
                      </label>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-co-muted">
                    No real payment provider is contacted and no card, account or QR details are ever requested.
                  </p>
                </fieldset>

                {(message || (lastAttempt && lastAttempt.status !== 'processing' && lastAttempt.failureReason)) && (
                  <p role="alert" className="mt-4 rounded-co-sm bg-co-pale/50 px-3 py-2 text-sm text-co-orange-dark">
                    {message ?? lastAttempt?.failureReason} Your lesson is not confirmed{holdActive ? ' — you can try again while your time is held.' : '.'}
                  </p>
                )}

                <Button variant="primary" className="mt-5 w-full" disabled={processing || !selectedMethod} onClick={handlePay}>
                  {processing ? 'Processing simulated payment…' : `Pay ${formatMoney(order.amount)} (simulated)`}
                </Button>
              </Card>
            )
          )}

          {message && booking.paymentMode === 'package_credit' && (
            <p role="alert" className="text-sm text-red-700">
              {message}
            </p>
          )}

          <Card className="bg-co-paper">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-co-sage-dark">Cancellation & rescheduling</h2>
              <DraftLabel>Draft policy</DraftLabel>
            </div>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-co-muted">
              {policySummary().map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </Card>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button variant="ghost" onClick={handleLeave} disabled={processing}>
              Cancel and release this time
            </Button>
            <Link to="/faq" className="text-xs font-medium text-co-muted underline underline-offset-2">
              Questions about payments?
            </Link>
          </div>
        </div>

        <aside className="lg:sticky lg:top-6 lg:h-fit">
          <Card>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-co-sage-dark">Order summary</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs text-co-muted">Course</dt>
                <dd className="font-medium text-co-ink">{course?.title}</dd>
              </div>
              <div>
                <dt className="text-xs text-co-muted">Instructor</dt>
                <dd className="text-co-ink">{instructor?.name}</dd>
              </div>
              <div>
                <dt className="text-xs text-co-muted">{course?.category === 'package' ? 'First lesson' : 'Date & time'}</dt>
                <dd className="text-co-ink">
                  {formatDisplayDate(booking.startAtUtc, viewerTimezone)}
                  <br />
                  {formatDisplayTimeRange(booking.startAtUtc, booking.endAtUtc, viewerTimezone)}
                  <span className="block text-xs text-co-muted">{viewerTimezone.replace('_', ' ')}</span>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-co-muted">Session length</dt>
                <dd className="text-co-ink">
                  {course?.durationMinutes} minutes{course?.sessionCount ? ` · ${course.sessionCount} lessons in package` : ''}
                </dd>
              </div>
              {booking.learner && (
                <div>
                  <dt className="text-xs text-co-muted">Learner</dt>
                  <dd className="text-co-ink">
                    {booking.learner.name}
                    {booking.learner.bookedByGuardian && <span className="text-co-muted"> (booked by parent/guardian)</span>}
                    <span className="block text-xs text-co-muted">
                      {labelForLevel(booking.learner.level)} · {labelForGoal(booking.learner.goal)}
                    </span>
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-co-muted">Meeting link</dt>
                <dd className="text-co-ink">Your meeting link will be available after confirmation.</dd>
              </div>
              <div className="border-t border-co-line pt-3">
                <dt className="text-xs text-co-muted">Order amount</dt>
                <dd className="font-serif text-2xl font-medium text-co-ink">
                  {order ? formatMoney(order.amount) : 'Package credit'}
                </dd>
                {order && <dd className="text-xs text-co-muted">Demo price · reference {order.reference}</dd>}
              </div>
            </dl>
            <p className="mt-4 flex items-start gap-2 text-xs text-co-muted">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-co-sage-dark" aria-hidden="true" />
              In production, payment would happen on the provider's secure hosted page and be verified by ClearOrigin's server before
              confirming.
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
