import { Navigate, useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useAppData } from '@/state/AppDataContext';
import { Card } from '@/components/ui/Card';
import { Button, ButtonLink } from '@/components/ui/Button';
import { StatusBadge, StatusPill } from '@/components/ui/Badge';
import { BookingProgress } from '@/components/booking/BookingProgress';
import { formatDisplayDate, formatDisplayTimeRange } from '@/lib/dates/format';
import { buildBookingIcs, downloadIcsFile } from '@/lib/ics';
import { describeMeeting, describePayment, formatMoney, meetingOf, referenceFromId, remainingCredits } from '@/lib/checkout';
import { paymentMethodLabel } from '@/services/payments/methods';

export function BookingSuccessPage() {
  const { id } = useParams<{ id: string }>();
  const { data, viewerTimezone } = useAppData();

  const booking = data.bookings.find((b) => b.id === id);
  const instructor = booking ? data.instructors.find((i) => i.id === booking.instructorId) : undefined;
  const sessionType = booking ? data.sessionTypes.find((st) => st.id === booking.sessionTypeId) : undefined;

  if (!booking || !instructor || !sessionType) {
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
          {isConfirmed ? "You're all set." : 'Booking details'}
        </h1>
        <p className="mt-2 text-sm text-co-muted">
          {isConfirmed ? 'Your lesson is confirmed. A copy is saved in My Learning Space.' : 'This booking is no longer active.'}
        </p>
      </div>

      <Card className="mt-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs text-co-muted">Booking reference</p>
            <p className="font-mono text-lg font-semibold tracking-wide text-co-ink">{referenceFromId(booking.id)}</p>
          </div>
          <StatusBadge status={booking.status} />
        </div>

        <dl className="mt-5 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-co-muted">Course</dt>
            <dd className="font-medium text-co-ink">{course?.title ?? sessionType.name}</dd>
          </div>
          <div>
            <dt className="text-xs text-co-muted">Instructor</dt>
            <dd className="text-co-ink">{instructor.name}</dd>
          </div>
          <div>
            <dt className="text-xs text-co-muted">Date & time</dt>
            <dd className="text-co-ink">
              {formatDisplayDate(booking.startAtUtc, viewerTimezone)}
              <br />
              {formatDisplayTimeRange(booking.startAtUtc, booking.endAtUtc, viewerTimezone)}
              <span className="block text-xs text-co-muted">{viewerTimezone.replace('_', ' ')}</span>
            </dd>
          </div>
          {booking.learner && (
            <div>
              <dt className="text-xs text-co-muted">Learner</dt>
              <dd className="text-co-ink">
                {booking.learner.name}
                {booking.learner.bookedByGuardian && <span className="block text-xs text-co-muted">Booked by parent/guardian</span>}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-xs text-co-muted">Meeting platform</dt>
            <dd className="text-co-ink">{meeting.provider === 'zoom' ? 'Zoom' : 'Google Meet'}</dd>
          </div>
          <div>
            <dt className="text-xs text-co-muted">Meeting link</dt>
            <dd className="space-y-1">
              <StatusPill descriptor={describeMeeting(booking)} />
              <span className="block text-xs text-co-muted">
                Your meeting link will appear in My Learning Space once it's created. This prototype does not create real meetings.
              </span>
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-co-muted">Payment</dt>
            <dd className="mt-1 flex flex-wrap items-center gap-2">
              <StatusPill descriptor={describePayment(booking, data)} />
              {order && (
                <span className="text-xs text-co-muted">
                  {formatMoney(order.amount)} · {payment ? paymentMethodLabel(payment.method) : 'no payment'} · order {order.reference}
                </span>
              )}
            </dd>
            {balance && (
              <dd className="mt-2 text-xs text-co-muted">
                Package credits: {remainingCredits(balance)} of {balance.totalCredits} remaining
                {balance.expiresAt && <> · valid until {new Date(balance.expiresAt).toLocaleDateString()}</>}
              </dd>
            )}
          </div>
        </dl>
      </Card>

      <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
        {isConfirmed && (
          <Button variant="primary" onClick={handleDownloadIcs}>
            Add to calendar (.ics)
          </Button>
        )}
        <ButtonLink to="/bookings" variant="outline">
          View my bookings
        </ButtonLink>
        <ButtonLink to="/book" variant="ghost">
          Book another lesson
        </ButtonLink>
      </div>
    </div>
  );
}
