import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { PlayCircle } from 'lucide-react';
import type { TimeSlot } from '@/types';
import { useAppData } from '@/state/AppDataContext';
import { useAvailableSlots } from '@/hooks/useAvailableSlots';
import { Card } from '@/components/ui/Card';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { DemoLabel } from '@/components/ui/Badge';
import { Portrait } from '@/components/ui/Portrait';
import { CoursePrice } from '@/components/booking/CourseCard';
import { SlotPicker } from '@/components/booking/SlotPicker';
import { supportedTimezones } from '@/lib/dates/format';
import { learnerGroupLabels } from '@/config/learnerOptions';

function DetailList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className="text-xs font-medium text-co-muted">{title}</h3>
      <ul className="mt-1 space-y-1 text-sm text-co-ink">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function InstructorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, viewerTimezone, setViewerTimezone } = useAppData();

  const instructor = data.instructors.find((i) => i.id === id);
  // The quick-availability picker offers the instructor's bookable trial/single courses (packages go through the full flow).
  const lessonCourses = useMemo(
    () => data.courses.filter((c) => c.category !== 'package' && instructor?.courseIds?.includes(c.id)),
    [data.courses, instructor],
  );
  const packageCourses = data.courses.filter((c) => c.category === 'package' && instructor?.courseIds?.includes(c.id));

  const [courseId, setCourseId] = useState<string | undefined>(lessonCourses[0]?.id);
  const course = lessonCourses.find((c) => c.id === courseId) ?? lessonCourses[0];
  const sessionType = data.sessionTypes.find((s) => s.id === course?.sessionTypeId);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const slots = useAvailableSlots(instructor, sessionType);

  if (!instructor) {
    return <Navigate to="/instructors" replace />;
  }

  const handleContinue = () => {
    if (!selectedSlot || !course) return;
    const params = new URLSearchParams({
      course: course.id,
      instructor: instructor.id,
      start: selectedSlot.startUtc,
      end: selectedSlot.endUtc,
      step: 'details',
    });
    navigate(`/book?${params.toString()}`);
  };

  const { qualifications, approach } = instructor;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
        <div className="space-y-4 sm:space-y-6">
          <Card className="h-fit">
            <div className="mx-auto max-w-[260px] lg:max-w-none">
              <Portrait instructor={instructor} size="lg" showLabel />
            </div>
            <h1 className="mt-5 font-serif text-2xl font-medium tracking-tight text-co-ink">
              {instructor.name} {instructor.chineseName && <span className="text-lg font-normal text-co-muted">{instructor.chineseName}</span>}
            </h1>
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
            <p className="mt-3 text-[11px] text-co-muted">Fictional demo profile — not a real ClearOrigin instructor.</p>
          </Card>

          {qualifications && (
            <Card>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-co-sage-dark">Qualifications</h2>
              <div className="mt-4 space-y-4">
                <p className="text-sm text-co-ink">
                  <span className="font-serif text-2xl font-medium">{qualifications.yearsTeaching}</span> years teaching Chinese
                </p>
                <DetailList title="Education" items={qualifications.education} />
                <DetailList title="Certifications" items={qualifications.certifications} />
                <DetailList title="Teaching credentials" items={qualifications.credentials} />
                <DetailList title="Experience" items={qualifications.experience} />
              </div>
            </Card>
          )}
        </div>

        <div className="min-w-0 space-y-4 sm:space-y-6">
          <Card>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-co-sage-dark">Introduction video</h2>
              <DemoLabel>Placeholder</DemoLabel>
            </div>
            <div className="mt-4 aspect-video w-full overflow-hidden rounded-co-md bg-co-ink/90">
              {instructor.introVideoUrl ? (
                // Never autoplays; the viewer starts it, with controls and captions available.
                <video src={instructor.introVideoUrl} controls preload="metadata" className="h-full w-full object-cover">
                  <track kind="captions" />
                </video>
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-center text-co-bg/80">
                  <PlayCircle className="h-10 w-10" aria-hidden="true" />
                  <p className="text-sm font-medium">Intro video placeholder</p>
                  <p className="max-w-xs text-xs text-co-bg/60">A short introduction from {instructor.name.split(' ')[0]} would play here once provided.</p>
                </div>
              )}
            </div>
          </Card>

          {approach && (
            <Card>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-co-sage-dark">Teaching approach</h2>
              <p className="mt-4 font-serif text-lg leading-relaxed text-co-ink">“{approach.philosophy}”</p>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailList title="Preferred methods" items={approach.methods} />
                <DetailList title="Works especially well with" items={approach.learnerGroups.map((g) => learnerGroupLabels[g])} />
              </div>
            </Card>
          )}

          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-co-sage-dark">1. Choose a course</h2>
              <ButtonLink to={`/book?instructor=${instructor.id}`} variant="ghost" size="sm">
                All courses with {instructor.name.split(' ')[0]}
              </ButtonLink>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {lessonCourses.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setCourseId(c.id);
                    setSelectedSlot(null);
                  }}
                  aria-pressed={course?.id === c.id}
                  className={`rounded-co-md border p-4 text-left transition-colors ${
                    course?.id === c.id ? 'border-co-orange-dark bg-co-pale/40' : 'border-co-line hover:border-co-orange-dark'
                  }`}
                >
                  <p className="font-medium text-co-ink">{c.title}</p>
                  <p className="mt-1 text-xs text-co-muted">{c.durationMinutes} minutes</p>
                  <div className="mt-2">
                    <CoursePrice course={c} />
                  </div>
                </button>
              ))}
            </div>
            {packageCourses.length > 0 && (
              <p className="mt-4 text-xs text-co-muted">
                Also teaches {packageCourses.map((p) => p.title).join(' and ')}.{' '}
                <Link to={`/book?instructor=${instructor.id}`} className="font-medium text-co-orange-dark underline underline-offset-2">
                  Book a package
                </Link>
              </p>
            )}
          </Card>

          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-co-sage-dark">2. Pick a time</h2>
              <label className="flex w-full min-w-0 items-center gap-2 text-xs text-co-muted sm:w-auto">
                <span className="shrink-0">Showing times in</span>
                <Select
                  size="sm"
                  value={viewerTimezone}
                  onChange={(e) => setViewerTimezone(e.target.value)}
                  wrapperClassName="flex-1 sm:w-56 sm:flex-none"
                >
                  {supportedTimezones().map((tz) => (
                    <option key={tz} value={tz}>
                      {tz.replace('_', ' ')}
                    </option>
                  ))}
                </Select>
              </label>
            </div>

            <div className="mt-4">
              <SlotPicker slots={slots} timezone={viewerTimezone} selected={selectedSlot} onSelect={setSelectedSlot} />
            </div>
          </Card>

          <Button variant="primary" disabled={!selectedSlot} onClick={handleContinue} className="w-full sm:w-auto">
            Continue to details
          </Button>
        </div>
      </div>
    </div>
  );
}
