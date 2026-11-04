import type { CourseCategory } from '@/types';
import { useAppData } from '@/state/AppDataContext';
import { useI18n } from '@/i18n/useI18n';
import { ButtonLink } from '@/components/ui/Button';
import { DraftLabel } from '@/components/ui/Badge';
import { CourseCard } from '@/components/booking/CourseCard';

const categories: CourseCategory[] = ['trial', 'single', 'package'];

export function CoursesPage() {
  const { data } = useAppData();
  const { m, loc } = useI18n();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="max-w-2xl">
        <h1 className="font-serif text-2xl font-medium tracking-tight text-co-ink sm:text-3xl">{m.courses.title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-co-muted">{m.courses.intro}</p>
        <div className="mt-3">
          <DraftLabel>{m.courses.draftLabel}</DraftLabel>
        </div>
      </div>

      {categories.map((category) => {
        const section = m.courses.sections[category];
        const courses = data.courses.filter((c) => c.category === category);
        if (courses.length === 0) return null;
        return (
          <section key={category} className="mt-10 sm:mt-14" aria-labelledby={`courses-${category}`}>
            <h2 id={`courses-${category}`} className="font-serif text-xl font-medium tracking-tight text-co-ink sm:text-2xl">
              {section.title}
            </h2>
            <p className="mt-1 text-sm text-co-muted">{section.intro}</p>
            <div className={`mt-5 grid grid-cols-1 gap-4 sm:gap-5 ${courses.length > 1 ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:max-w-xl'}`}>
              {courses.map((course) => {
                const copy = loc.course(course);
                return (
                  <CourseCard
                    key={course.id}
                    course={course}
                    footer={
                      <div className="space-y-3">
                        {copy.terms && (
                          <details className="rounded-co-sm border border-co-line px-3 py-2 text-xs text-co-muted">
                            <summary className="cursor-pointer font-medium text-co-ink">{m.courses.packageTerms}</summary>
                            <ul className="mt-2 list-disc space-y-1 pl-4">
                              {copy.terms.map((term) => (
                                <li key={term}>{term}</li>
                              ))}
                            </ul>
                          </details>
                        )}
                        <ButtonLink to={`/book?course=${course.id}`} variant="primary" size="sm" className="w-full">
                          {course.category === 'package' ? m.courses.choose(copy.title) : m.courses.book(copy.title)}
                        </ButtonLink>
                      </div>
                    }
                  />
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
