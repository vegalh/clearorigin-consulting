import { Navigate, useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useAppData } from '@/state/AppDataContext';
import { Card } from '@/components/ui/Card';
import { Button, ButtonLink } from '@/components/ui/Button';
import { StatusBadge, StatusPill } from '@/components/ui/Badge';
import { BookingProgress } from '@/components/booking/BookingProgress';
import { useI18n } from '@/i18n/useI18n';
import { buildBookingIcs, downloadIcsFile } from '@/lib/ics';
import { describeMeeting, describePayment, formatMoney, meetingOf, referenceFromId, remainingCredits } from '@/lib/checkout';

export function BookingSuccessPage() {
  const { id } = useParams<{ id: string }>();
  const { data, viewerTimezone, currentStudentId } = useAppData();
  const { m, loc, fmt } = useI18n();

  const booking = data.bookings.find((b) => b.id === id);
  const instructor = booking ? data.instructors.find((i) => i.id === booking.instructorId) : undefined;
  const sessionType = booking ? data.sessionTypes.find((st) => st.id === booking.sessionTypeId) : undefined;

  if (!booking || !instructor || !sessionType || booking.studentId !== currentStudentId) {
    return <Navigate to="/bookings" replace />;
  }
  // Only confirmed (or since-completed) bookings have a confirmation; anything else goes back to checkout.
  if (booking.status === 'held' || booking.status === 'pending_payment') {
    return <Navigate to={`/book/checkout/${booking.id}`} replace />;
  }

  const course = data.courses.find((c) => c.id === booking.courseId);
  const order = booking.orderId ? data.orders.find((o) => o.id === booking.orderId) : undefined;
  const payment = order ? data.payments.filter((p) => p.orderId === order.id && p.status === 'succeeded').at(-1) : undefined;
  const balance = data.packageBalances.find((b) => b.id === booking.packageBalanceId);
  const meeting = meetingOf(booking);
  const isConfirmed = booking.status === 'confirmed' || booking.status === 'completed';

  const handleDownloadIcs = () => {
    const ics = buildBookingIcs(booking, instructor, sessionType, course?.title);
    downloadIcsFile(`clearorigin-${referenceFromId(booking.id)}.ics`, ics);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
      <BookingProgress current="Confirmation" />
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-co-sage/25 text-co-sage-dark">
          <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
        </span>
        <h1 className="mt-5 font-serif text-2xl font-medium tracking-tight text-co-ink sm:text-3xl">
          {isConfirmed ? m.success.allSet : m.success.details}
        </h1>
        <p className="mt-2 text-sm text-co-muted">
          {isConfirmed ? m.success.confirmedBody : m.success.inactiveBody}
        </p>
      </div>

      <Card className="mt-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs text-co-muted">{m.success.reference}</p>
            <p className="font-mono text-lg font-semibold tracking-wide text-co-ink">{referenceFromId(booking.id)}</p>
          </div>
          <StatusBadge status={booking.status} />
        </div>

        <dl className="mt-5 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-co-muted">{m.book.course}</dt>
            <dd className="font-medium text-co-ink">{loc.courseTitle(course, sessionType)}</dd>
          </div>
          <div>
            <dt className="text-xs text-co-muted">{m.checkout.instructor}</dt>
            <dd className="text-co-ink">{loc.instructorName(instructor)}</dd>
          </div>
          <div>
            <dt className="text-xs text-co-muted">{m.checkout.dateTime}</dt>
            <dd className="text-co-ink">
              {fmt.date(booking.startAtUtc, viewerTimezone)}
              <br />
              {fmt.timeRange(booking.startAtUtc, booking.endAtUtc, viewerTimezone)}
              <span className="block text-xs text-co-muted">{loc.timezone(viewerTimezone)}</span>
            </dd>
          </div>
          {booking.learner && (
            <div>
              <dt className="text-xs text-co-muted">{m.checkout.learner}</dt>
              <dd className="text-co-ink">
                {booking.learner.name}
                {booking.learner.bookedByGuardian && <span className="block text-xs text-co-muted">{m.success.bookedByGuardian}</span>}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-xs text-co-muted">{m.success.meetingPlatform}</dt>
            <dd className="text-co-ink">{meeting.provider === 'zoom' ? m.common.zoom : m.common.googleMeet}</dd>
          </div>
          <div>
            <dt className="text-xs text-co-muted">{m.checkout.meetingLink}</dt>
            <dd className="space-y-1">
              <StatusPill descriptor={describeMeeting(booking)} />
              <span className="block text-xs text-co-muted">
                {m.success.meetingNote}
              </span>
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-co-muted">{m.success.payment}</dt>
            <dd className="mt-1 flex flex-wrap items-center gap-2">
              <StatusPill descriptor={describePayment(booking, data)} />
              {order && (
                <span className="text-xs text-co-muted">
                  {formatMoney(order.amount)} · {payment ? loc.paymentMethod(payment.method).label : m.success.noPayment} · {m.success.order(order.reference)}
                </span>
              )}
            </dd>
            {balance && (
              <dd className="mt-2 text-xs text-co-muted">
                {m.success.credits(remainingCredits(balance), balance.totalCredits)}
                {balance.expiresAt && m.success.validUntil(fmt.shortDate(balance.expiresAt))}
              </dd>
            )}
          </div>
        </dl>
      </Card>

      <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
        {isConfirmed && (
          <Button variant="primary" onClick={handleDownloadIcs}>
            {m.success.addToCalendar}
          </Button>
        )}
        <ButtonLink to="/bookings" variant="outline">
          {m.success.viewBookings}
        </ButtonLink>
        <ButtonLink to="/book" variant="ghost">
          {m.success.bookAnother}
        </ButtonLink>
      </div>
    </div>
  );
}
