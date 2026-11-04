import type { Course, Instructor, TimeSlot } from '@/types';
import { useAppData } from '@/state/AppDataContext';
import { Card } from '@/components/ui/Card';
import { CoursePrice } from '@/components/booking/CourseCard';
import { formatDisplayDate, formatDisplayTimeRange } from '@/lib/dates/format';
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
  const balance = selection.mode === 'credit' ? data.packageBalances.find((b) => b.id === selection.balanceId) : undefined;

  return (
    <Card>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-co-sage-dark">Your booking</h2>
        {onChangeCourse && (
          <button type="button" onClick={onChangeCourse} className="text-xs font-medium text-co-orange-dark underline underline-offset-2">
            Change course
          </button>
        )}
      </div>
      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="text-xs text-co-muted">Course</dt>
          <dd className="font-medium text-co-ink">
            {course.title} · {course.durationMinutes} min{course.sessionCount ? ` × ${course.sessionCount}` : ''}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-co-muted">Instructor</dt>
          <dd className="text-co-ink">{instructor?.name ?? 'Not chosen yet'}</dd>
        </div>
        <div>
          <dt className="text-xs text-co-muted">{course.category === 'package' ? 'First lesson' : 'Time'}</dt>
          <dd className="text-co-ink">
            {slot ? (
              <>
                {formatDisplayDate(slot.startUtc, viewerTimezone)}
                <br />
                {formatDisplayTimeRange(slot.startUtc, slot.endUtc, viewerTimezone)}
                <span className="block text-xs text-co-muted">{viewerTimezone.replace('_', ' ')}</span>
              </>
            ) : (
              'Not chosen yet'
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-co-muted">Price</dt>
          <dd>
            {balance ? (
              <span className="text-co-ink">1 package credit · {remainingCredits(balance)} remaining</span>
            ) : (
              <CoursePrice course={course} />
            )}
          </dd>
        </div>
      </dl>
    </Card>
  );
}
