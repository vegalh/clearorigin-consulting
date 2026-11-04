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
import { bookingPolicy } from '@/config/bookingPolicy';
import { useI18n } from '@/i18n/useI18n';
import { methodsForCurrency } from '@/services/payments/methods';
import type { SimulatedOutcome } from '@/services/payments/types';
import { blocksSlot } from '@/lib/scheduling';
import { formatMoney, remainingCredits } from '@/lib/checkout';

const outcomes: SimulatedOutcome[] = ['success', 'failure', 'cancel', 'timeout'];

export function CheckoutPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { data, viewerTimezone, currentStudentId, payForBooking, confirmWithCredit, cancelCheckout } = useAppData();
  const { m, loc, fmt } = useI18n();
  const now = useNow(1000);

  const booking = data.bookings.find((b) => b.id === bookingId);
  const order = booking?.orderId ? data.orders.find((o) => o.id === booking.orderId) : undefined;
  const methods = order ? methodsForCurrency(order.amount.currency) : [];
  const [method, setMethod] = useState<PaymentMethodId | null>(null);
  const [outcome, setOutcome] = useState<SimulatedOutcome>('success');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!booking) return <Navigate to="/book" replace />;
  if (booking.studentId !== currentStudentId) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10 sm:px-6 sm:py-16">
        <Card>
          <h1 className="font-serif text-2xl font-medium tracking-tight text-co-ink">{m.checkout.payTitle}</h1>
          <p className="mt-3 text-sm text-co-muted">{m.checkout.signInToContinue}</p>
        </Card>
      </div>
    );
  }
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
            {cancelled ? m.checkout.leftTitle : m.checkout.expiredTitle}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-co-muted">
            {cancelled ? m.checkout.leftBody : m.checkout.expiredBody}
            {order?.status === 'refund_pending' && m.checkout.lateRefund}
          </p>
          <ButtonLink to={restartLink} variant="primary" className="mt-6">
            {m.checkout.chooseAgain}
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
    else setMessage(loc.reason(result.reason));
  };

  const handleCredit = () => {
    const result = confirmWithCredit(booking.id);
    if (result.ok) navigate(`/booking/success/${booking.id}`);
    else setMessage(loc.reason(result.reason));
  };

  const handleLeave = () => {
    const result = cancelCheckout(booking.id);
    if (!result.ok) setMessage(loc.reason(result.reason));
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <BookingProgress current="Payment" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-5">
          <div>
            <h1 className="font-serif text-2xl font-medium tracking-tight text-co-ink sm:text-3xl">
              {booking.paymentMode === 'package_credit' ? m.checkout.creditTitle : m.checkout.payTitle}
            </h1>
            <p className="mt-2 text-sm text-co-muted">{m.checkout.confirmedOnlyWhen}</p>
          </div>

          {/* Phones: the full order summary sits below the form, so lead with the essentials. */}
          <div className="rounded-co-md border border-co-line bg-co-paper px-4 py-3 text-sm lg:hidden">
            <p className="font-medium text-co-ink">
              {course && loc.course(course).title} · {instructor && loc.instructorName(instructor)}
            </p>
            <p className="text-co-muted">
              {fmt.date(booking.startAtUtc, viewerTimezone)}, {fmt.timeRange(booking.startAtUtc, booking.endAtUtc, viewerTimezone)}
            </p>
            <p className="mt-1 font-medium text-co-ink">{order ? formatMoney(order.amount) : m.checkout.oneCredit}</p>
          </div>

          {booking.holdExpiresAt && <HoldCountdown expiresAt={booking.holdExpiresAt} now={now} />}

          {booking.paymentMode === 'package_credit' && balance ? (
            <Card>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-co-sage-dark">{m.checkout.coveredByPackage}</h2>
              <p className="mt-3 text-sm text-co-ink">
                {m.checkout.creditBody(remainingCredits(balance), balance.totalCredits, remainingCredits(balance) - 1)}
              </p>
              <Button variant="primary" className="mt-5 w-full sm:w-auto" onClick={handleCredit}>
                {m.checkout.confirmWithCredit}
              </Button>
            </Card>
          ) : (
            order && (
              <Card>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-co-sage-dark">{m.checkout.paymentMethod}</h2>
                  <DemoLabel>{m.common.simulated}</DemoLabel>
                </div>
                <fieldset className="mt-3" disabled={processing}>
                  <legend className="sr-only">{m.checkout.paymentMethod}</legend>
                  <div className="grid grid-cols-1 gap-2">
                    {methods.map((method) => (
                      <label
                        key={method.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-co-md border p-4 transition-colors ${
                          selectedMethod === method.id ? 'border-co-orange-dark bg-co-pale/40' : 'border-co-line hover:border-co-orange-dark'
                        }`}
                      >
                        <input
                          type="radio"
                          name="method"
                          value={method.id}
                          checked={selectedMethod === method.id}
                          onChange={() => setMethod(method.id)}
                          className="mt-1 h-4 w-4 shrink-0"
                        />
                        <span>
                          <span className="block text-sm font-medium text-co-ink">{loc.paymentMethod(method.id).label}</span>
                          <span className="block text-xs text-co-muted">{loc.paymentMethod(method.id).description}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                  {order.amount.currency === 'USD' && (
                    <p className="mt-2 text-xs text-co-muted">{m.checkout.cnyMethodsNote}</p>
                  )}
                </fieldset>

                <fieldset className="mt-5 rounded-co-md border border-dashed border-co-line bg-co-bg p-4" disabled={processing}>
                  <legend className="px-1 text-xs font-medium text-co-muted">{m.checkout.demoOutcome}</legend>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {outcomes.map((o) => (
                      <label key={o} className="flex items-center gap-2 text-sm text-co-ink">
                        <input
                          type="radio"
                          name="outcome"
                          value={o}
                          checked={outcome === o}
                          onChange={() => setOutcome(o)}
                          className="h-4 w-4"
                        />
                        {m.checkout.outcomes[o]}
                      </label>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-co-muted">
                    {m.checkout.noCredentials}
                  </p>
                </fieldset>

                {(message || (lastAttempt && lastAttempt.status !== 'processing' && lastAttempt.failureReason)) && (
                  <p role="alert" className="mt-4 rounded-co-sm bg-co-pale/50 px-3 py-2 text-sm text-co-orange-dark">
                    {message ?? loc.reason(lastAttempt?.failureReason ?? '')}
                    {holdActive ? m.checkout.notConfirmedRetry : m.checkout.notConfirmed}
                  </p>
                )}

                <Button variant="primary" className="mt-5 w-full" disabled={processing || !selectedMethod} onClick={handlePay}>
                  {processing ? m.checkout.processing : m.checkout.pay(formatMoney(order.amount))}
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
              <h2 className="text-xs font-semibold uppercase tracking-wide text-co-sage-dark">{m.checkout.policyTitle}</h2>
              <DraftLabel>{m.common.draftPolicy}</DraftLabel>
            </div>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-co-muted">
              {m.policy.summary(bookingPolicy.holdMinutes, bookingPolicy.rescheduleNoticeHours, bookingPolicy.cancellationNoticeHours).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </Card>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button variant="ghost" onClick={handleLeave} disabled={processing}>
              {m.checkout.release}
            </Button>
            <Link to="/faq" className="text-xs font-medium text-co-muted underline underline-offset-2">
              {m.checkout.paymentQuestions}
            </Link>
          </div>
        </div>

        <aside className="lg:sticky lg:top-6 lg:h-fit">
          <Card>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-co-sage-dark">{m.checkout.orderSummary}</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs text-co-muted">{m.book.course}</dt>
                <dd className="font-medium text-co-ink">{course && loc.course(course).title}</dd>
              </div>
              <div>
                <dt className="text-xs text-co-muted">{m.checkout.instructor}</dt>
                <dd className="text-co-ink">{instructor && loc.instructorName(instructor)}</dd>
              </div>
              <div>
                <dt className="text-xs text-co-muted">{course?.category === 'package' ? m.book.firstLesson : m.checkout.dateTime}</dt>
                <dd className="text-co-ink">
                  {fmt.date(booking.startAtUtc, viewerTimezone)}
                  <br />
                  {fmt.timeRange(booking.startAtUtc, booking.endAtUtc, viewerTimezone)}
                  <span className="block text-xs text-co-muted">{loc.timezone(viewerTimezone)}</span>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-co-muted">{m.checkout.sessionLength}</dt>
                <dd className="text-co-ink">
                  {course && m.common.minutes(course.durationMinutes)}
                  {course?.sessionCount ? m.checkout.lessonsInPackage(course.sessionCount) : ''}
                </dd>
              </div>
              {booking.learner && (
                <div>
                  <dt className="text-xs text-co-muted">{m.checkout.learner}</dt>
                  <dd className="text-co-ink">
                    {booking.learner.name}
                    {booking.learner.bookedByGuardian && <span className="text-co-muted"> {m.checkout.bookedByGuardian}</span>}
                    <span className="block text-xs text-co-muted">
                      {loc.level(booking.learner.level)} · {loc.goal(booking.learner.goal)}
                    </span>
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-co-muted">{m.checkout.meetingLink}</dt>
                <dd className="text-co-ink">{m.checkout.meetingAfter}</dd>
              </div>
              <div className="border-t border-co-line pt-3">
                <dt className="text-xs text-co-muted">{m.checkout.orderAmount}</dt>
                <dd className="font-serif text-2xl font-medium text-co-ink">
                  {order ? formatMoney(order.amount) : m.checkout.packageCredit}
                </dd>
                {order && <dd className="text-xs text-co-muted">{m.checkout.reference(order.reference)}</dd>}
              </div>
            </dl>
            <p className="mt-4 flex items-start gap-2 text-xs text-co-muted">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-co-sage-dark" aria-hidden="true" />
              {m.checkout.productionNote}
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
