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
import { useI18n } from '@/i18n/useI18n';

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
  const { m, loc } = useI18n();

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

  const copy = loc.instructor(instructor);
  const { qualifications, approach } = copy;
  const firstName = loc.shortName(instructor);

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
            <p className="text-sm text-co-muted">{copy.title}</p>
            <p className="mt-4 text-sm leading-relaxed text-co-muted">{copy.bio}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {copy.specialties.map((specialty) => (
                <span key={specialty} className="rounded-full bg-co-sage/25 px-2.5 py-1 text-[11px] font-medium text-co-sage-dark">
                  {specialty}
                </span>
              ))}
            </div>
            <p className="mt-4 text-xs text-co-muted">
              {m.profile.speaks(copy.languages.join(', '))}
              <br />
              {m.profile.localTimezone(loc.timezone(instructor.timezone))}
            </p>
            <p className="mt-3 text-[11px] text-co-muted">{m.profile.fictional}</p>
          </Card>

          {qualifications && (
            <Card>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-co-sage-dark">{m.profile.qualifications}</h2>
              <div className="mt-4 space-y-4">
                <p className="text-sm text-co-ink">
                  <span className="font-serif text-2xl font-medium">{qualifications.yearsTeaching}</span> {m.profile.yearsTeaching}
                </p>
                <DetailList title={m.profile.education} items={qualifications.education} />
                <DetailList title={m.profile.certifications} items={qualifications.certifications} />
                <DetailList title={m.profile.credentials} items={qualifications.credentials} />
                <DetailList title={m.profile.experience} items={qualifications.experience} />
              </div>
            </Card>
          )}
        </div>

        <div className="min-w-0 space-y-4 sm:space-y-6">
          <Card>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-co-sage-dark">{m.profile.introVideo}</h2>
              <DemoLabel>{m.common.placeholder}</DemoLabel>
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
                  <p className="text-sm font-medium">{m.profile.videoPlaceholder}</p>
                  <p className="max-w-xs text-xs text-co-bg/60">{m.profile.videoPlaceholderBody(firstName)}</p>
                </div>
              )}
            </div>
          </Card>

          {approach && (
            <Card>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-co-sage-dark">{m.profile.approach}</h2>
              <p className="mt-4 font-serif text-lg leading-relaxed text-co-ink">“{approach.philosophy}”</p>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailList title={m.profile.methods} items={approach.methods} />
                <DetailList title={m.profile.worksWellWith} items={approach.learnerGroups.map((g) => loc.learnerGroup(g).title)} />
              </div>
            </Card>
          )}

          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-co-sage-dark">{m.profile.chooseCourse}</h2>
              <ButtonLink to={`/book?instructor=${instructor.id}`} variant="ghost" size="sm">
                {m.profile.allCoursesWith(firstName)}
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
                  <p className="font-medium text-co-ink">{loc.course(c).title}</p>
                  <p className="mt-1 text-xs text-co-muted">{m.common.minutes(c.durationMinutes)}</p>
                  <div className="mt-2">
                    <CoursePrice course={c} />
                  </div>
                </button>
              ))}
            </div>
            {packageCourses.length > 0 && (
              <p className="mt-4 text-xs text-co-muted">
                {m.profile.alsoTeaches(packageCourses.map((p) => loc.course(p).title).join(m.profile.and))}{' '}
                <Link to={`/book?instructor=${instructor.id}`} className="font-medium text-co-orange-dark underline underline-offset-2">
                  {m.profile.bookPackage}
                </Link>
              </p>
            )}
          </Card>

          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-co-sage-dark">{m.profile.pickTime}</h2>
              <label className="flex w-full min-w-0 items-center gap-2 text-xs text-co-muted sm:w-auto">
                <span className="shrink-0">{m.common.showingTimesIn}</span>
                <Select
                  size="sm"
                  value={viewerTimezone}
                  onChange={(e) => setViewerTimezone(e.target.value)}
                  wrapperClassName="flex-1 sm:w-56 sm:flex-none"
                >
                  {supportedTimezones().map((tz) => (
                    <option key={tz} value={tz}>
                      {loc.timezone(tz)}
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
            {m.profile.continueToDetails}
          </Button>
        </div>
      </div>
    </div>
  );
}
