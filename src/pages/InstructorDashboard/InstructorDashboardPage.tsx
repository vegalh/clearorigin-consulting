import { useMemo } from 'react';
import type { Booking } from '@/types';
import { WEEKDAY_LABELS, type Weekday } from '@/types';
import { ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge, StatusPill } from '@/components/ui/Badge';
import { useAppData } from '@/state/AppDataContext';
import { useNow } from '@/hooks/useNow';
import { blocksSlot } from '@/lib/scheduling';
import { describeMeeting, describePayment, meetingOf } from '@/lib/checkout';
import { formatDisplayDate, formatDisplayTimeRange } from '@/lib/dates/format';
import { labelForGoal, labelForLevel } from '@/config/learnerOptions';

const weekdayOrder: Weekday[] = [1, 2, 3, 4, 5, 6, 0];

export function InstructorDashboardPage() {
  const { data, currentInstructorId, viewerTimezone } = useAppData();
  const now = useNow(30_000);
  const instructor = data.instructors.find((i) => i.id === currentInstructorId);

  const { appointments, todayCount, upcomingCount, checkoutCount, attentionCount, cancelled } = useMemo(() => {
    const t = now.getTime();
    const mine = data.bookings.filter((b) => b.instructorId === currentInstructorId);
    const isActiveCheckout = (b: Booking) => (b.status === 'held' || b.status === 'pending_payment') && blocksSlot(b, now);
    const appointmentsList = mine
      .filter((b) => (b.status === 'confirmed' && new Date(b.endAtUtc).getTime() > t) || isActiveCheckout(b))
      .sort((a, b) => new Date(a.startAtUtc).getTime() - new Date(b.startAtUtc).getTime());

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const confirmed = appointmentsList.filter((b) => b.status === 'confirmed');
    return {
      appointments: appointmentsList,
      upcomingCount: confirmed.length,
      checkoutCount: appointmentsList.length - confirmed.length,
      todayCount: confirmed.filter((b) => {
        const s = new Date(b.startAtUtc).getTime();
        return s >= startOfToday.getTime() && s <= endOfToday.getTime();
      }).length,
      attentionCount: mine.filter(
        (b) => meetingOf(b).status === 'needs_attention' || data.orders.find((o) => o.id === b.orderId)?.status === 'refund_pending',
      ).length,
      cancelled: mine
        .filter((b) => b.status === 'cancelled' && (b.confirmedAt || b.paymentMode === 'legacy' || !b.paymentMode))
        .sort((a, b) => new Date(b.startAtUtc).getTime() - new Date(a.startAtUtc).getTime())
        .slice(0, 5),
    };
  }, [data.bookings, data.orders, currentInstructorId, now]);

  if (!instructor) return null;

  const rules = data.recurringAvailability.filter((r) => r.instructorId === instructor.id);
  const meetingConfig = data.meetingConfigurations.find((m) => m.instructorId === instructor.id);

  const stats = [
    { label: 'Today', value: todayCount, note: `confirmed lesson${todayCount === 1 ? '' : 's'}` },
    { label: 'Upcoming', value: upcomingCount, note: 'confirmed lessons' },
    { label: 'In checkout', value: checkoutCount, note: 'held, awaiting payment' },
    { label: 'Needs attention', value: attentionCount, note: 'refund reviews or meeting links' },
  ];

  const renderAppointment = (booking: Booking) => {
    const course = data.courses.find((c) => c.id === booking.courseId);
    const sessionType = data.sessionTypes.find((st) => st.id === booking.sessionTypeId);
    const contact = data.students.find((s) => s.id === booking.studentId);
    const learnerName = booking.learner?.name ?? contact?.fullName ?? 'A student';
    const meeting = meetingOf(booking);
    return (
      <Card key={booking.id} className="grid grid-cols-1 gap-3 md:grid-cols-[1.3fr_1fr] md:items-center">
        <div className="min-w-0">
          <p className="font-medium text-co-ink">
            {learnerName}
            {booking.learner?.bookedByGuardian && contact && (
              <span className="font-normal text-co-muted"> · booked by {contact.fullName} (guardian)</span>
            )}
          </p>
          <p className="text-sm text-co-ink">{course?.title ?? sessionType?.name}</p>
          <p className="mt-1 text-sm text-co-muted">
            {formatDisplayDate(booking.startAtUtc, viewerTimezone)} · {formatDisplayTimeRange(booking.startAtUtc, booking.endAtUtc, viewerTimezone)}
          </p>
          {booking.learner && (
            <p className="mt-1 text-xs text-co-muted">
              {labelForLevel(booking.learner.level)} · goal: {labelForGoal(booking.learner.goal)}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 md:justify-end">
          <StatusBadge status={booking.status} prefix="Booking" />
          <StatusPill descriptor={describePayment(booking, data)} prefix="Payment" />
          <StatusPill descriptor={describeMeeting(booking)} prefix={meeting.provider === 'zoom' ? 'Zoom' : 'Meet'} />
        </div>
      </Card>
    );
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-co-sage-dark">Teaching Studio</p>
          <h1 className="mt-1 font-serif text-2xl font-medium tracking-tight text-co-ink sm:text-3xl">
            Welcome back, {instructor.name.split(' ')[0]}
          </h1>
          <p className="mt-2 text-sm text-co-muted">Acting as {instructor.name}. Times shown in {viewerTimezone.replace('_', ' ')}.</p>
        </div>
        <ButtonLink to="/instructor/availability" variant="outline" size="sm">
          Edit availability
        </ButtonLink>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <p className="text-xs font-medium uppercase tracking-wide text-co-muted">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold text-co-ink sm:text-3xl">{stat.value}</p>
            <p className="mt-1 text-xs text-co-muted">{stat.note}</p>
          </Card>
        ))}
      </div>

      <section className="mt-10" aria-labelledby="appointments">
        <h2 id="appointments" className="font-serif text-xl font-medium tracking-tight text-co-ink">
          Upcoming sessions
        </h2>
        <p className="mt-1 text-xs text-co-muted">Booking and payment status are tracked separately. Payment details stay private to ClearOrigin.</p>
        <div className="mt-4 space-y-3">
          {appointments.length === 0 && (
            <p className="rounded-co-md border border-dashed border-co-line bg-co-paper p-6 text-sm text-co-muted">No upcoming sessions booked yet.</p>
          )}
          {appointments.map(renderAppointment)}
        </div>
      </section>

      {cancelled.length > 0 && (
        <section className="mt-10" aria-labelledby="cancelled">
          <h2 id="cancelled" className="font-serif text-xl font-medium tracking-tight text-co-ink">
            Recent cancellations
          </h2>
          <div className="mt-4 space-y-3">{cancelled.map(renderAppointment)}</div>
        </section>
      )}

      <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-co-sage-dark">Weekly availability</h2>
            <ButtonLink to="/instructor/availability" variant="ghost" size="sm">
              Edit
            </ButtonLink>
          </div>
          <ul className="mt-3 space-y-1.5 text-sm">
            {weekdayOrder.map((day) => {
              const rule = rules.find((r) => r.dayOfWeek === day);
              return (
                <li key={day} className="flex justify-between gap-3">
                  <span className="text-co-ink">{WEEKDAY_LABELS[day]}</span>
                  <span className={rule ? 'text-co-ink' : 'text-co-muted'}>{rule ? `${rule.startTime} – ${rule.endTime}` : 'Unavailable'}</span>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-co-muted">In {instructor.timezone.replace('_', ' ')}.</p>
        </Card>
        <Card>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-co-sage-dark">Meeting platform</h2>
          <p className="mt-3 text-sm text-co-ink">{meetingConfig?.provider === 'google_meet' ? 'Google Meet' : 'Zoom'}</p>
          <p className="mt-1 text-xs text-co-muted">
            New bookings use this platform. In production a meeting would be created automatically after confirmation; this prototype never
            creates one.
          </p>
          <ButtonLink to="/instructor/availability#meeting-settings" variant="ghost" size="sm" className="mt-2 -ml-3">
            Change platform
          </ButtonLink>
        </Card>
      </div>
    </div>
  );
}
