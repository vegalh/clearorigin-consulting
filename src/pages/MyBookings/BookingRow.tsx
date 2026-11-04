import { useState } from 'react';
import type { Booking } from '@/types';
import { useAppData } from '@/state/AppDataContext';
import { useAvailableSlots } from '@/hooks/useAvailableSlots';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge, StatusPill } from '@/components/ui/Badge';
import { SlotPicker } from '@/components/booking/SlotPicker';
import { useI18n } from '@/i18n/useI18n';
import { describeMeeting, describePayment, meetingOf } from '@/lib/checkout';
import { bookingPolicy } from '@/config/bookingPolicy';
import { canReschedule, previewCancellation, type CancellationOutcome } from '@/services/checkoutService';
import type { Messages } from '@/i18n/en';

function cancellationCopy(m: Messages, outcome: CancellationOutcome): string {
  const copy = m.learning.cancellation;
  const hours = bookingPolicy.cancellationNoticeHours;
  switch (outcome) {
    case 'no_refund':
      return copy.no_refund(hours);
    case 'credit_forfeited':
      return copy.credit_forfeited(hours);
    default:
      return copy[outcome];
  }
}

export function BookingRow({ booking, now }: { booking: Booking; now: Date }) {
  const { data, viewerTimezone, cancelBooking, rescheduleBooking } = useAppData();
  const { m, loc, fmt } = useI18n();
  const [panel, setPanel] = useState<'none' | 'reschedule' | 'cancel'>('none');
  const [newSlot, setNewSlot] = useState<{ startUtc: string; endUtc: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const instructor = data.instructors.find((i) => i.id === booking.instructorId);
  const sessionType = data.sessionTypes.find((st) => st.id === booking.sessionTypeId);
  const course = data.courses.find((c) => c.id === booking.courseId);
  const isRescheduling = panel === 'reschedule';
  const slots = useAvailableSlots(isRescheduling ? instructor : undefined, isRescheduling ? sessionType : undefined);

  if (!instructor || !sessionType) return null;

  const isUpcoming = booking.status === 'confirmed' && new Date(booking.startAtUtc).getTime() > now.getTime();
  const reschedulable = isUpcoming && canReschedule(booking, now);
  const preview = isUpcoming ? previewCancellation(booking, data, now) : null;
  const duration = Math.round((new Date(booking.endAtUtc).getTime() - new Date(booking.startAtUtc).getTime()) / 60_000);
  const meeting = meetingOf(booking);

  const toggle = (next: 'reschedule' | 'cancel') => {
    setPanel((prev) => (prev === next ? 'none' : next));
    setNewSlot(null);
    setError(null);
  };

  const handleConfirmCancel = () => {
    const outcome = cancelBooking(booking.id);
    if (!outcome.ok) setError(loc.reason(outcome.reason));
  };

  const handleConfirmReschedule = () => {
    if (!newSlot) return;
    const outcome = rescheduleBooking(booking.id, newSlot);
    if (outcome.ok) {
      setPanel('none');
      setNewSlot(null);
      setError(null);
    } else {
      setError(loc.reason(outcome.reason));
    }
  };

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-co-ink">
            {m.learning.withInstructor(loc.courseTitle(course, sessionType), loc.instructorName(instructor))}
          </p>
          <p className="mt-1 text-sm text-co-ink">{fmt.date(booking.startAtUtc, viewerTimezone)}</p>
          <p className="text-sm text-co-muted">
            {fmt.timeRange(booking.startAtUtc, booking.endAtUtc, viewerTimezone)} · {m.common.min(duration)} · {loc.timezone(viewerTimezone)}
          </p>
          {booking.learner?.bookedByGuardian && <p className="mt-1 text-xs text-co-muted">{m.learning.learner(booking.learner.name)}</p>}
          {booking.studentNotes && <p className="mt-2 text-xs text-co-muted">{m.learning.notes(booking.studentNotes)}</p>}
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <StatusPill prefix={m.learning.paymentPrefix} descriptor={describePayment(booking, data)} />
        <StatusPill prefix={meeting.provider === 'zoom' ? m.common.zoom : m.common.googleMeet} descriptor={describeMeeting(booking)} />
      </div>

      {isUpcoming && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => toggle('reschedule')} disabled={!reschedulable}>
            {isRescheduling ? m.learning.cancelReschedule : m.learning.reschedule}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => toggle('cancel')}>
            {panel === 'cancel' ? m.learning.keepSession : m.learning.cancelSession}
          </Button>
          {!reschedulable && (
            <p className="w-full text-xs text-co-muted">
              {m.learning.rescheduleClosed(bookingPolicy.rescheduleNoticeHours)}
            </p>
          )}
        </div>
      )}

      {panel === 'cancel' && preview && (
        <div className="mt-4 rounded-co-md border border-co-line bg-co-bg p-4">
          <p className="text-sm font-medium text-co-ink">{m.learning.beforeCancel}</p>
          <p className="mt-1 text-sm text-co-muted">{cancellationCopy(m, preview.outcome)}</p>
          <p className="mt-1 text-xs text-co-muted">{m.learning.recordKept}</p>
          {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
          <Button variant="primary" size="sm" className="mt-3 w-full sm:w-auto" onClick={handleConfirmCancel}>
            {m.learning.confirmCancel}
          </Button>
        </div>
      )}

      {isRescheduling && (
        <div className="mt-4 border-t border-co-line pt-4">
          <p className="text-xs font-medium text-co-muted">
            {m.learning.chooseNewTime(duration, loc.instructorName(instructor))}
          </p>
          <div className="mt-3">
            <SlotPicker slots={slots} timezone={viewerTimezone} selected={newSlot} onSelect={setNewSlot} />
          </div>
          {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
          <Button variant="primary" size="sm" className="mt-3 w-full sm:w-auto" disabled={!newSlot} onClick={handleConfirmReschedule}>
            {m.learning.confirmNewTime}
          </Button>
        </div>
      )}
    </Card>
  );
}
