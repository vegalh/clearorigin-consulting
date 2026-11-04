import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import type { SessionType, TimeSlot } from '@/types';
import { useAppData } from '@/state/AppDataContext';
import { useAvailableSlots } from '@/hooks/useAvailableSlots';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SlotPicker } from '@/components/booking/SlotPicker';
import { supportedTimezones } from '@/lib/dates/format';

export function InstructorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, viewerTimezone, setViewerTimezone } = useAppData();

  const instructor = data.instructors.find((i) => i.id === id);
  const availableSessionTypes = useMemo<SessionType[]>(
    () => data.sessionTypes.filter((st) => instructor?.sessionTypeIds.includes(st.id)),
    [data.sessionTypes, instructor],
  );

  const [sessionTypeId, setSessionTypeId] = useState<string | undefined>(availableSessionTypes[0]?.id);
  const sessionType = availableSessionTypes.find((st) => st.id === sessionTypeId) ?? availableSessionTypes[0];
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  const slots = useAvailableSlots(instructor, sessionType);

  if (!instructor) {
    return <Navigate to="/instructors" replace />;
  }

  const handleContinue = () => {
    if (!selectedSlot || !sessionType) return;
    const params = new URLSearchParams({
      instructorId: instructor.id,
      sessionTypeId: sessionType.id,
      startUtc: selectedSlot.startUtc,
      endUtc: selectedSlot.endUtc,
    });
    navigate(`/booking/confirm?${params.toString()}`);
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-14">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[320px_1fr]">
        <Card className="h-fit">
          <span
            className={`flex h-16 w-16 items-center justify-center rounded-full text-lg font-semibold text-white ${instructor.avatarColorClass}`}
          >
            {instructor.avatarInitials}
          </span>
          <h1 className="mt-4 font-serif text-xl font-medium tracking-tight text-co-ink">{instructor.name}</h1>
          <p className="text-sm text-co-muted">{instructor.title}</p>
          <p className="mt-4 text-sm leading-relaxed text-co-muted">{instructor.bio}</p>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {instructor.specialties.map((specialty) => (
              <span key={specialty} className="rounded-full bg-co-sage/25 px-2.5 py-1 text-[11px] font-medium text-co-sage-dark">
                {specialty}
              </span>
            ))}
          </div>

          <p className="mt-4 text-xs text-co-muted">
            Speaks: {instructor.languages.join(', ')}
            <br />
            Instructor's local timezone: {instructor.timezone.replace('_', ' ')}
          </p>
        </Card>

        <div className="min-w-0 space-y-6">
          <Card>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-co-sage-dark">1. Choose a session type</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {availableSessionTypes.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => {
                    setSessionTypeId(st.id);
                    setSelectedSlot(null);
                  }}
                  className={`rounded-co-md border p-4 text-left transition-colors ${
                    sessionType?.id === st.id ? 'border-co-orange-dark bg-co-pale/40' : 'border-co-line hover:border-co-orange-dark'
                  }`}
                >
                  <p className="font-medium text-co-ink">{st.name}</p>
                  <p className="mt-1 text-xs text-co-muted">{st.durationMinutes} minutes</p>
                  <p className="mt-2 text-xs leading-relaxed text-co-muted">{st.description}</p>
                  {typeof st.demoPriceUsd === 'number' && (
                    <p className="mt-2 text-xs font-medium text-co-orange-dark">
                      {st.demoPriceUsd === 0 ? 'Free' : `$${st.demoPriceUsd} (demo price)`}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-co-sage-dark">2. Pick a time</h2>
              <label className="flex items-center gap-2 text-xs text-co-muted">
                Showing times in
                <select
                  value={viewerTimezone}
                  onChange={(e) => setViewerTimezone(e.target.value)}
                  className="rounded-full border border-co-line bg-co-paper px-2 py-1 text-xs text-co-ink"
                >
                  {supportedTimezones().map((tz) => (
                    <option key={tz} value={tz}>
                      {tz.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-4">
              <SlotPicker slots={slots} timezone={viewerTimezone} selected={selectedSlot} onSelect={setSelectedSlot} />
            </div>
          </Card>

          <Button variant="primary" disabled={!selectedSlot} onClick={handleContinue} className="w-full sm:w-auto">
            Continue to confirm
          </Button>
        </div>
      </div>
    </div>
  );
}
