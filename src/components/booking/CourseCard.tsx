import type { ReactNode } from 'react';
import { Clock } from 'lucide-react';
import type { Course, CurrencyCode } from '@/types';
import { configuredCurrencies, coursePrice, formatMoney, perLessonPrice } from '@/lib/checkout';
import { learnerGroupLabels } from '@/config/learnerOptions';

const categoryLabels: Record<Course['category'], string> = {
  trial: 'Trial lesson',
  single: 'Single lesson',
  package: 'Lesson package',
};

/** Calm price line: primary currency large, other configured currencies listed (never converted). */
export function CoursePrice({ course, currency = 'USD' }: { course: Course; currency?: CurrencyCode }) {
  const primary = coursePrice(course, currency) ?? coursePrice(course, configuredCurrencies(course)[0])!;
  const others = configuredCurrencies(course).filter((c) => c !== primary.currency);
  const perLesson = perLessonPrice(course, primary.currency);
  return (
    <div>
      <p className="font-serif text-2xl font-medium text-co-ink">{formatMoney(primary)}</p>
      <p className="text-xs text-co-muted">
        Demo price
        {perLesson && <> · {formatMoney(perLesson)} per lesson</>}
        {others.map((c) => (
          <span key={c}> · also {formatMoney(coursePrice(course, c)!)}</span>
        ))}
      </p>
    </div>
  );
}

export function CourseCard({ course, footer, selected = false, compact = false }: { course: Course; footer?: ReactNode; selected?: boolean; compact?: boolean }) {
  return (
    <div
      className={`flex h-full flex-col gap-4 rounded-co-lg border bg-co-paper p-5 shadow-[0_2px_10px_rgba(68,51,43,0.06)] transition-colors sm:p-6 ${
        selected ? 'border-co-orange-dark bg-co-pale/30' : 'border-co-line'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-co-sage-dark">{categoryLabels[course.category]}</span>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-co-muted">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          {course.sessionCount ? `${course.sessionCount} × ${course.durationMinutes} min` : `${course.durationMinutes} min`}
        </span>
      </div>
      <div>
        <h3 className="font-serif text-xl font-medium tracking-tight text-co-ink">{course.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-co-muted">{course.description}</p>
      </div>
      <CoursePrice course={course} />
      {!compact && (
        <>
          <ul className="space-y-1 text-sm text-co-ink">
            {course.includes.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-co-sage" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <p className="text-xs text-co-muted">
            Suited to: {course.suitableFor.map((g) => learnerGroupLabels[g]).join(', ')}
          </p>
          {course.validityDays && <p className="text-xs text-co-muted">Valid for {course.validityDays} days after purchase.</p>}
        </>
      )}
      {footer && <div className="mt-auto pt-1">{footer}</div>}
    </div>
  );
}
