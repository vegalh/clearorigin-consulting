import { useMemo, useState, type FormEvent } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import type { MeetingProvider } from '@/types';
import { useAppData } from '@/state/AppDataContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { inputClass } from '@/components/ui/fieldStyles';
import { formatDisplayDate, formatDisplayTimeRange } from '@/lib/dates/format';
import { validateStudentInfo, hasValidationErrors } from '@/lib/validation/booking';

const meetingProviders: { id: MeetingProvider; label: string }[] = [
  { id: 'zoom', label: 'Zoom' },
  { id: 'google_meet', label: 'Google Meet' },
];

export function BookingConfirmationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { data, currentStudentId, viewerTimezone, bookSession, upsertStudent } = useAppData();

  const instructorId = searchParams.get('instructorId');
  const sessionTypeId = searchParams.get('sessionTypeId');
  const startUtc = searchParams.get('startUtc');
  const endUtc = searchParams.get('endUtc');

  const instructor = data.instructors.find((i) => i.id === instructorId);
  const sessionType = data.sessionTypes.find((st) => st.id === sessionTypeId);
  const existingStudent = data.students.find((s) => s.id === currentStudentId);

  const [fullName, setFullName] = useState(existingStudent?.fullName ?? '');
  const [email, setEmail] = useState(existingStudent?.email ?? '');
  const [learningGoal, setLearningGoal] = useState('');
  const [meetingProvider, setMeetingProvider] = useState<MeetingProvider>('zoom');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const errors = useMemo(() => validateStudentInfo({ fullName, email, learningGoal }), [fullName, email, learningGoal]);

  if (!instructor || !sessionType || !startUtc || !endUtc) {
    return <Navigate to="/instructors" replace />;
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (hasValidationErrors(errors)) return;

    upsertStudent({ id: currentStudentId, fullName: fullName.trim(), email: email.trim() });

    const outcome = bookSession({
      instructor,
      sessionType,
      slot: { startUtc, endUtc },
      studentId: currentStudentId,
      meetingProvider,
      studentNotes: learningGoal.trim() || undefined,
    });

    if (outcome.ok) {
      navigate(`/booking/success/${outcome.booking.id}`);
    } else {
      setSubmitError(outcome.reason);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="font-serif text-2xl font-medium tracking-tight sm:text-3xl text-co-ink">
        Your next conversation is almost here.
      </h1>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:mt-8 sm:gap-6 md:grid-cols-[1fr_1.3fr]">
        <Card className="h-fit">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-co-sage-dark">Session summary</h2>
          <div className="mt-4 space-y-3 text-sm">
            <p className="font-medium text-co-ink">{instructor.name}</p>
            <p className="text-co-muted">{sessionType.name} &middot; {sessionType.durationMinutes} min</p>
            <p className="text-co-ink">{formatDisplayDate(startUtc, viewerTimezone)}</p>
            <p className="text-co-ink">{formatDisplayTimeRange(startUtc, endUtc, viewerTimezone)}</p>
            <p className="text-xs text-co-muted">Times shown in {viewerTimezone.replace('_', ' ')}</p>
            {typeof sessionType.demoPriceUsd === 'number' && (
              <p className="text-xs font-medium text-co-orange-dark">
                {sessionType.demoPriceUsd === 0 ? 'Free' : `$${sessionType.demoPriceUsd} (demo price)`}
              </p>
            )}
          </div>
        </Card>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="fullName" className="text-xs font-medium text-co-muted">
                Full name
              </label>
              <input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={`${inputClass} mt-1 w-full`}
              />
              {touched && errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>}
            </div>

            <div>
              <label htmlFor="email" className="text-xs font-medium text-co-muted">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`${inputClass} mt-1 w-full`}
              />
              {touched && errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="learningGoal" className="text-xs font-medium text-co-muted">
                What would you like to focus on? (optional)
              </label>
              <textarea
                id="learningGoal"
                value={learningGoal}
                onChange={(e) => setLearningGoal(e.target.value)}
                rows={3}
                className={`${inputClass} mt-1 w-full`}
              />
            </div>

            <fieldset>
              <legend className="text-xs font-medium text-co-muted">Meeting platform (simulated)</legend>
              <div className="mt-2 flex gap-3">
                {meetingProviders.map((option) => (
                  <label
                    key={option.id}
                    className={`flex-1 cursor-pointer rounded-co-sm border px-3 py-2 text-center text-sm transition-colors ${
                      meetingProvider === option.id ? 'border-co-orange-dark bg-co-pale/40 text-co-orange-dark' : 'border-co-line text-co-ink'
                    }`}
                  >
                    <input
                      type="radio"
                      name="meetingProvider"
                      value={option.id}
                      checked={meetingProvider === option.id}
                      onChange={() => setMeetingProvider(option.id)}
                      className="sr-only"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-co-muted">
                No real meeting link is created in this prototype &mdash; this only records your preference.
              </p>
            </fieldset>

            {submitError && <p className="text-sm text-red-600">{submitError}</p>}

            <Button type="submit" variant="primary" className="w-full">
              Confirm booking
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
