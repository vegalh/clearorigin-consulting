import { Navigate, useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useAppData } from '@/state/AppDataContext';
import { Card } from '@/components/ui/Card';
import { Button, ButtonLink } from '@/components/ui/Button';
import { formatDisplayDate, formatDisplayTimeRange } from '@/lib/dates/format';
import { buildBookingIcs, downloadIcsFile } from '@/lib/ics';

export function BookingSuccessPage() {
  const { id } = useParams<{ id: string }>();
  const { data, viewerTimezone } = useAppData();

  const booking = data.bookings.find((b) => b.id === id);
  const instructor = booking ? data.instructors.find((i) => i.id === booking.instructorId) : undefined;
  const sessionType = booking ? data.sessionTypes.find((st) => st.id === booking.sessionTypeId) : undefined;

  if (!booking || !instructor || !sessionType) {
    return <Navigate to="/bookings" replace />;
  }

  const handleDownloadIcs = () => {
    const ics = buildBookingIcs(booking, instructor, sessionType);
    downloadIcsFile(`clearorigin-${booking.id}.ics`, ics);
  };

  return (
    <div className="mx-auto max-w-xl px-6 py-16 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-co-pale text-co-green">
        <CheckCircle2 className="h-7 w-7" />
      </span>
      <h1 className="mt-5 text-3xl font-semibold tracking-tight text-co-ink">Your session is booked</h1>
      <p className="mt-2 text-sm text-co-muted">A confirmation has been saved to this browser's demo data.</p>

      <Card className="mt-8 text-left">
        <p className="font-medium text-co-ink">
          {sessionType.name} with {instructor.name}
        </p>
        <p className="mt-2 text-sm text-co-ink">{formatDisplayDate(booking.startAtUtc, viewerTimezone)}</p>
        <p className="text-sm text-co-ink">
          {formatDisplayTimeRange(booking.startAtUtc, booking.endAtUtc, viewerTimezone)}
        </p>
        <p className="mt-1 text-xs text-co-muted">Times shown in {viewerTimezone.replace('_', ' ')}</p>
        <p className="mt-3 text-xs text-co-muted">
          Meeting platform: {booking.meetingProvider === 'zoom' ? 'Zoom' : 'Google Meet'} &mdash; no real link is
          generated in this prototype.
        </p>
      </Card>

      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Button variant="primary" onClick={handleDownloadIcs}>
          Add to calendar (.ics)
        </Button>
        <ButtonLink to="/bookings" variant="outline">
          View my bookings
        </ButtonLink>
        <ButtonLink to="/instructors" variant="ghost">
          Book another session
        </ButtonLink>
      </div>
    </div>
  );
}
