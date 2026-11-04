import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Course } from '@/types';
import { useAppData } from '@/state/AppDataContext';
import { BookingProgress } from '@/components/booking/BookingProgress';
import type { BookingStep } from '@/components/booking/bookingSteps';
import { CourseStep } from './CourseStep';
import { ScheduleStep } from './ScheduleStep';
import { DetailsStep } from './DetailsStep';

/**
 * The course-first booking wizard: Course → Schedule → Details. Every choice
 * lives in the URL (`?course&mode&balance&instructor&start&end&step`), so a
 * refresh or the back button never loses progress. Submitting Details places a
 * hold and hands off to /book/checkout/:bookingId for Payment.
 */
export interface BookingSelection {
  course?: Course;
  /** `credit` = book with an existing package credit instead of paying. */
  mode: 'paid' | 'credit';
  balanceId?: string;
  instructorId?: string;
  start?: string;
  end?: string;
}

export function BookPage() {
  const { data } = useAppData();
  const [params, setParams] = useSearchParams();

  const selection = useMemo<BookingSelection>(
    () => ({
      course: data.courses.find((c) => c.id === params.get('course')),
      mode: params.get('mode') === 'credit' ? 'credit' : 'paid',
      balanceId: params.get('balance') ?? undefined,
      instructorId: params.get('instructor') ?? undefined,
      start: params.get('start') ?? undefined,
      end: params.get('end') ?? undefined,
    }),
    [data.courses, params],
  );

  const requested = params.get('step');
  let step: BookingStep = 'Course';
  if (selection.course) step = 'Schedule';
  if (selection.course && selection.instructorId && selection.start && selection.end && requested === 'details') step = 'Details';
  if (requested === 'course') step = 'Course';

  /** Merge changes into the URL; `null` removes a key. */
  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (value === null) next.delete(key);
      else next.set(key, value);
    }
    setParams(next);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <BookingProgress current={step} />
      {step === 'Course' && <CourseStep selection={selection} onSelect={update} />}
      {step === 'Schedule' && selection.course && <ScheduleStep selection={selection} course={selection.course} onChange={update} />}
      {step === 'Details' && selection.course && <DetailsStep selection={selection} course={selection.course} onBack={() => update({ step: null })} />}
    </div>
  );
}
