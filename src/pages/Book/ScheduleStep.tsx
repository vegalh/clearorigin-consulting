import type { Course } from '@/types';
import { useAppData } from '@/state/AppDataContext';
import { useAvailableSlots } from '@/hooks/useAvailableSlots';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Portrait } from '@/components/ui/Portrait';
import { SlotPicker } from '@/components/booking/SlotPicker';
import { formatDisplayDate, formatDisplayTime, supportedTimezones } from '@/lib/dates/format';
import { SelectedCourseSummary } from './SelectedCourseSummary';
import type { BookingSelection } from './BookPage';

export function ScheduleStep({
  selection,
  course,
  onChange,
}: {
  selection: BookingSelection;
  course: Course;
  onChange: (patch: Record<string, string | null>) => void;
}) {
  const { data, viewerTimezone, setViewerTimezone } = useAppData();
  const instructors = data.instructors.filter((i) => (i.courseIds ?? []).includes(course.id));
  const instructor = instructors.find((i) => i.id === selection.instructorId);
  const sessionType = data.sessionTypes.find((s) => s.id === course.sessionTypeId);
  const slots = useAvailableSlots(instructor, sessionType);
  const selectedSlot = selection.start && selection.end ? { startUtc: selection.start, endUtc: selection.end } : null;

  return (
    <div className={`grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px] ${instructor && selectedSlot ? 'max-lg:pb-20' : ''}`}>
      <div className="min-w-0 space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-medium tracking-tight text-co-ink sm:text-3xl">Choose an instructor and time</h1>
          <p className="mt-2 text-sm text-co-muted">Showing instructors who teach the {course.title}.</p>
        </div>

        <fieldset>
          <legend className="text-xs font-semibold uppercase tracking-wide text-co-sage-dark">Instructor</legend>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {instructors.map((i) => {
              const active = i.id === instructor?.id;
              return (
                <label
                  key={i.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-co-md border p-4 transition-colors ${
                    active ? 'border-co-orange-dark bg-co-pale/40' : 'border-co-line bg-co-paper hover:border-co-orange-dark'
                  }`}
                >
                  <input
                    type="radio"
                    name="instructor"
                    value={i.id}
                    checked={active}
                    onChange={() => onChange({ instructor: i.id, start: null, end: null })}
                    className="sr-only"
                  />
                  <Portrait instructor={i} size="sm" />
                  <span className="min-w-0">
                    <span className="block font-medium text-co-ink">{i.name}</span>
                    <span className="block text-xs text-co-muted">{i.specialties.join(' · ')}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {instructor && (
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-co-sage-dark">Available times with {instructor.name.split(' ')[0]}</h2>
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
              <SlotPicker
                slots={slots}
                timezone={viewerTimezone}
                selected={selectedSlot}
                onSelect={(slot) => onChange({ start: slot.startUtc, end: slot.endUtc })}
              />
            </div>
          </Card>
        )}
      </div>

      <aside className="space-y-4 lg:sticky lg:top-6 lg:h-fit">
        <SelectedCourseSummary
          course={course}
          selection={selection}
          instructor={instructor}
          slot={selectedSlot}
          onChangeCourse={() => onChange({ step: 'course' })}
        />
        <Button variant="primary" className="w-full max-lg:hidden" disabled={!instructor || !selectedSlot} onClick={() => onChange({ step: 'details' })}>
          Continue to details
        </Button>
      </aside>

      {/* Phones: keep the next step within thumb reach once a time is picked, instead of below the full time grid. */}
      {instructor && selectedSlot && (
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-co-line bg-co-paper/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
            <p className="min-w-0 text-xs text-co-muted">
              <span className="block truncate font-medium text-co-ink">{formatDisplayDate(selectedSlot.startUtc, viewerTimezone)}</span>
              {formatDisplayTime(selectedSlot.startUtc, viewerTimezone)} with {instructor.name.split(' ')[0]}
            </p>
            <Button variant="primary" size="sm" className="shrink-0" onClick={() => onChange({ step: 'details' })}>
              Continue to details
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
