import type { Course, Instructor, TimeSlot } from '@/types';
import { useAppData } from '@/state/AppDataContext';
import { Card } from '@/components/ui/Card';
import { CoursePrice } from '@/components/booking/CourseCard';
import { useI18n } from '@/i18n/useI18n';
import { remainingCredits } from '@/lib/checkout';
import type { BookingSelection } from './BookPage';

/** The running "your booking" summary shown beside the Schedule and Details steps. */
export function SelectedCourseSummary({
  course,
  selection,
  instructor,
  slot,
  onChangeCourse,
}: {
  course: Course;
  selection: BookingSelection;
  instructor?: Instructor;
  slot: TimeSlot | null;
  onChangeCourse?: () => void;
}) {
  const { data, viewerTimezone } = useAppData();
  const { m, loc, fmt } = useI18n();
  const balance = selection.mode === 'credit' ? data.packageBalances.find((b) => b.id === selection.balanceId) : undefined;

  return (
    <Card>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-co-sage-dark">{m.book.summary}</h2>
        {onChangeCourse && (
          <button type="button" onClick={onChangeCourse} className="text-xs font-medium text-co-orange-dark underline underline-offset-2">
            {m.book.changeCourse}
          </button>
        )}
      </div>
      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="text-xs text-co-muted">{m.book.course}</dt>
          <dd className="font-medium text-co-ink">
            {loc.course(course).title} ·{' '}
            {course.sessionCount ? m.common.lessonsTimesMinutes(course.sessionCount, course.durationMinutes) : m.common.min(course.durationMinutes)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-co-muted">{m.book.instructor}</dt>
          <dd className="text-co-ink">{instructor ? loc.instructorName(instructor) : m.common.notChosenYet}</dd>
        </div>
        <div>
          <dt className="text-xs text-co-muted">{course.category === 'package' ? m.book.firstLesson : m.book.time}</dt>
          <dd className="text-co-ink">
            {slot ? (
              <>
                {fmt.date(slot.startUtc, viewerTimezone)}
                <br />
                {fmt.timeRange(slot.startUtc, slot.endUtc, viewerTimezone)}
                <span className="block text-xs text-co-muted">{loc.timezone(viewerTimezone)}</span>
              </>
            ) : (
              m.common.notChosenYet
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-co-muted">{m.book.price}</dt>
          <dd>
            {balance ? (
              <span className="text-co-ink">{m.book.creditPrice(remainingCredits(balance))}</span>
            ) : (
              <CoursePrice course={course} />
            )}
          </dd>
        </div>
      </dl>
    </Card>
  );
}
