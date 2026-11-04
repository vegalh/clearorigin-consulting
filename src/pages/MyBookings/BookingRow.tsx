import { useState } from 'react';
import type { Booking } from '@/types';
import { useAppData } from '@/state/AppDataContext';
import { useAvailableSlots } from '@/hooks/useAvailableSlots';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { SlotPicker } from '@/components/booking/SlotPicker';
import { formatDisplayDate, formatDisplayTimeRange } from '@/lib/dates/format';

export function BookingRow({ booking }: { booking: Booking }) {
  const { data, viewerTimezone, cancelBooking, rescheduleBooking } = useAppData();
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [newSlot, setNewSlot] = useState<{ startUtc: string; endUtc: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const instructor = data.instructors.find((i) => i.id === booking.instructorId);
  const sessionType = data.sessionTypes.find((st) => st.id === booking.sessionTypeId);
  const slots = useAvailableSlots(isRescheduling ? instructor : undefined, isRescheduling ? sessionType : undefined);

  if (!instructor || !sessionType) return null;

  const canModify = booking.status === 'confirmed' && new Date(booking.startAtUtc).getTime() > Date.now();

  const handleCancel = () => {
    if (!window.confirm('Cancel this session? This cannot be undone in the prototype.')) return;
    cancelBooking(booking.id);
  };

  const handleConfirmReschedule = () => {
    if (!newSlot) return;
    const outcome = rescheduleBooking(booking.id, newSlot);
    if (outcome.ok) {
      setIsRescheduling(false);
      setNewSlot(null);
      setError(null);
    } else {
      setError(outcome.reason);
    }
  };

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium text-co-ink">
            {sessionType.name} with {instructor.name}
          </p>
          <p className="mt-1 text-sm text-co-ink">{formatDisplayDate(booking.startAtUtc, viewerTimezone)}</p>
          <p className="text-sm text-co-muted">
            {formatDisplayTimeRange(booking.startAtUtc, booking.endAtUtc, viewerTimezone)}
          </p>
          {booking.studentNotes && <p className="mt-2 text-xs text-co-muted">Notes: {booking.studentNotes}</p>}
        </div>
        <StatusBadge status={booking.status} />
      </div>

      {canModify && (
        <div className="mt-4 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsRescheduling((prev) => !prev);
              setNewSlot(null);
              setError(null);
            }}
          >
            {isRescheduling ? 'Cancel reschedule' : 'Reschedule'}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            Cancel session
          </Button>
        </div>
      )}

      {isRescheduling && (
        <div className="mt-4 border-t border-co-line pt-4">
          <p className="text-xs font-medium text-co-muted">Choose a new time with {instructor.name}</p>
          <div className="mt-3">
            <SlotPicker slots={slots} timezone={viewerTimezone} selected={newSlot} onSelect={setNewSlot} />
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <Button variant="primary" size="sm" className="mt-3" disabled={!newSlot} onClick={handleConfirmReschedule}>
            Confirm new time
          </Button>
        </div>
      )}
    </Card>
  );
}
