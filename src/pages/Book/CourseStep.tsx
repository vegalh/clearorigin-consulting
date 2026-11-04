import type { CourseCategory } from '@/types';
import { useAppData } from '@/state/AppDataContext';
import { useNow } from '@/hooks/useNow';
import { Button } from '@/components/ui/Button';
import { DraftLabel } from '@/components/ui/Badge';
import { CourseCard } from '@/components/booking/CourseCard';
import { isBalanceRedeemable, remainingCredits } from '@/lib/checkout';
import type { BookingSelection } from './BookPage';

const groups: { category: CourseCategory; title: string }[] = [
  { category: 'trial', title: 'Trial lesson' },
  { category: 'single', title: 'Single lessons' },
  { category: 'package', title: 'Buy a lesson package' },
];

export function CourseStep({
  selection,
  onSelect,
}: {
  selection: BookingSelection;
  onSelect: (patch: Record<string, string | null>) => void;
}) {
  const { data, currentStudentId } = useAppData();
  const now = useNow(60_000);
  const instructor = data.instructors.find((i) => i.id === selection.instructorId);
  const taughtBy = (courseId: string) => !instructor || (instructor.courseIds ?? []).includes(courseId);

  const balances = data.packageBalances.filter((b) => b.studentId === currentStudentId && isBalanceRedeemable(b, now));

  const choose = (courseId: string, credit?: { balanceId: string }) =>
    onSelect({
      course: courseId,
      mode: credit ? 'credit' : null,
      balance: credit?.balanceId ?? null,
      // Keep a preselected instructor only if they teach the chosen course.
      instructor: instructor && taughtBy(courseId) ? instructor.id : null,
      start: null,
      end: null,
      step: null,
    });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-medium tracking-tight text-co-ink sm:text-3xl">Choose a course</h1>
          <p className="mt-2 text-sm text-co-muted">
            {instructor ? `Showing courses ${instructor.name} teaches.` : 'Every lesson is one-on-one and live online.'}
          </p>
        </div>
        <DraftLabel>Demo prices</DraftLabel>
      </div>
      {instructor && (
        <button type="button" onClick={() => onSelect({ instructor: null })} className="mt-2 text-xs font-medium text-co-orange-dark underline underline-offset-2">
          Show courses from all instructors
        </button>
      )}

      {balances.length > 0 && (
        <section className="mt-8" aria-labelledby="use-credit">
          <h2 id="use-credit" className="text-xs font-semibold uppercase tracking-wide text-co-sage-dark">
            Use a package credit
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
            {balances.flatMap((balance) => {
              const pkg = data.courses.find((c) => c.id === balance.packageCourseId);
              return (pkg?.redeemsCourseIds ?? [])
                .map((id) => data.courses.find((c) => c.id === id))
                .filter((c) => c && taughtBy(c.id))
                .map((lesson) => (
                  <div key={`${balance.id}-${lesson!.id}`} className="flex flex-col gap-3 rounded-co-lg border border-co-sage/60 bg-co-sage/10 p-5">
                    <p className="font-medium text-co-ink">
                      {lesson!.title} with a credit from your {pkg!.title}
                    </p>
                    <p className="text-sm text-co-muted">
                      {remainingCredits(balance)} of {balance.totalCredits} credits remaining
                      {balance.expiresAt && <> · valid until {new Date(balance.expiresAt).toLocaleDateString()}</>}. No payment needed.
                    </p>
                    <Button variant="secondary" size="sm" className="self-start" onClick={() => choose(lesson!.id, { balanceId: balance.id })}>
                      Book with a credit
                    </Button>
                  </div>
                ));
            })}
          </div>
        </section>
      )}

      {groups.map((group) => {
        const courses = data.courses.filter((c) => c.category === group.category && taughtBy(c.id));
        if (courses.length === 0) return null;
        return (
          <section key={group.category} className="mt-8" aria-labelledby={`step-${group.category}`}>
            <h2 id={`step-${group.category}`} className="text-xs font-semibold uppercase tracking-wide text-co-sage-dark">
              {group.title}
            </h2>
            <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  compact
                  selected={selection.course?.id === course.id && selection.mode === 'paid'}
                  footer={
                    <Button variant="primary" size="sm" className="w-full" onClick={() => choose(course.id)}>
                      Choose {course.title}
                    </Button>
                  }
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
