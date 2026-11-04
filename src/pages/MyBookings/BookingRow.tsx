import { useState } from 'react';
import type { Booking } from '@/types';
import { useAppData } from '@/state/AppDataContext';
import { useAvailableSlots } from '@/hooks/useAvailableSlots';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge, StatusPill } from '@/components/ui/Badge';
import { SlotPicker } from '@/components/booking/SlotPicker';
import { formatDisplayDate, formatDisplayTimeRange } from '@/lib/dates/format';
import { describeMeeting, describePayment, meetingOf } from '@/lib/checkout';
import { bookingPolicy } from '@/config/bookingPolicy';
import { canReschedule, previewCancellation, type CancellationOutcome } from '@/services/checkoutService';

const cancellationCopy: Record<CancellationOutcome, string> = {
  refund_review: 'You are cancelling with enough notice, so a refund review will be opened. Refunds are not automatic.',
  no_refund: `This is within ${bookingPolicy.cancellationNoticeHours} hours of the lesson, so it may not be eligible for a refund under the draft policy.`,
  credit_restored: 'You are cancelling with enough notice, so your package credit will be returned.',
  credit_forfeited: `This is within ${bookingPolicy.cancellationNoticeHours} hours of the lesson, so the package credit will be used under the draft policy.`,
  no_payment_recorded: 'No payment was recorded for this booking.',
};

export function BookingRow({ booking, now }: { booking: Booking; now: Date }) {
  const { data, viewerTimezone, cancelBooking, rescheduleBooking } = useAppData();
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
    if (!outcome.ok) setError(outcome.reason);
  };

  const handleConfirmReschedule = () => {
    if (!newSlot) return;
    const outcome = rescheduleBooking(booking.id, newSlot);
    if (outcome.ok) {
      setPanel('none');
      setNewSlot(null);
      setError(null);
    } else {
      setError(outcome.reason);
    }
  };

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-co-ink">
            {course?.title ?? sessionType.name} with {instructor.name}
          </p>
          <p className="mt-1 text-sm text-co-ink">{formatDisplayDate(booking.startAtUtc, viewerTimezone)}</p>
          <p className="text-sm text-co-muted">
            {formatDisplayTimeRange(booking.startAtUtc, booking.endAtUtc, viewerTimezone)} · {duration} min ·{' '}
            {viewerTimezone.replace('_', ' ')}
          </p>
          {booking.learner?.bookedByGuardian && <p className="mt-1 text-xs text-co-muted">Learner: {booking.learner.name}</p>}
          {booking.studentNotes && <p className="mt-2 text-xs text-co-muted">Notes: {booking.studentNotes}</p>}
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <StatusPill prefix="Payment" descriptor={describePayment(booking, data)} />
        <StatusPill prefix={meeting.provider === 'zoom' ? 'Zoom' : 'Google Meet'} descriptor={describeMeeting(booking)} />
      </div>

      {isUpcoming && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => toggle('reschedule')} disabled={!reschedulable}>
            {isRescheduling ? 'Cancel reschedule' : 'Reschedule'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => toggle('cancel')}>
            {panel === 'cancel' ? 'Keep this session' : 'Cancel session'}
          </Button>
          {!reschedulable && (
            <p className="w-full text-xs text-co-muted">
              Rescheduling closes {bookingPolicy.rescheduleNoticeHours} hours before the lesson.
            </p>
          )}
        </div>
      )}

      {panel === 'cancel' && preview && (
        <div className="mt-4 rounded-co-md border border-co-line bg-co-bg p-4">
          <p className="text-sm font-medium text-co-ink">Before you cancel</p>
          <p className="mt-1 text-sm text-co-muted">{cancellationCopy[preview.outcome]}</p>
          <p className="mt-1 text-xs text-co-muted">The booking will stay in your history. This policy is a draft pending ClearOrigin confirmation.</p>
          {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
          <Button variant="primary" size="sm" className="mt-3 w-full sm:w-auto" onClick={handleConfirmCancel}>
            Confirm cancellation
          </Button>
        </div>
      )}

      {isRescheduling && (
        <div className="mt-4 border-t border-co-line pt-4">
          <p className="text-xs font-medium text-co-muted">
            Choose a new {duration}-minute time with {instructor.name}. Same course, so there's no price difference.
          </p>
          <div className="mt-3">
            <SlotPicker slots={slots} timezone={viewerTimezone} selected={newSlot} onSelect={setNewSlot} />
          </div>
          {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
          <Button variant="primary" size="sm" className="mt-3 w-full sm:w-auto" disabled={!newSlot} onClick={handleConfirmReschedule}>
            Confirm new time
          </Button>
        </div>
      )}
    </Card>
  );
}
