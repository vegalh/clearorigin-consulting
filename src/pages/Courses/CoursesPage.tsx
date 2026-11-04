import type { CourseCategory } from '@/types';
import { useAppData } from '@/state/AppDataContext';
import { ButtonLink } from '@/components/ui/Button';
import { DraftLabel } from '@/components/ui/Badge';
import { CourseCard } from '@/components/booking/CourseCard';

const sections: { category: CourseCategory; title: string; intro: string }[] = [
  {
    category: 'trial',
    title: 'Trial lesson',
    intro: 'Experience the teaching approach and meet an instructor before you commit to anything more.',
  },
  {
    category: 'single',
    title: 'Single lessons',
    intro: 'Book one lesson at a time, at whatever length suits the learner.',
  },
  {
    category: 'package',
    title: 'Lesson packages',
    intro: 'Several lessons at once for a steady rhythm. Your first lesson is booked at checkout; use the rest whenever you like.',
  },
];

export function CoursesPage() {
  const { data } = useAppData();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="max-w-2xl">
        <h1 className="font-serif text-2xl font-medium tracking-tight text-co-ink sm:text-3xl">Courses & Pricing</h1>
        <p className="mt-3 text-sm leading-relaxed text-co-muted">
          Every lesson is one-on-one and live online. Prices are shown in the currency they are configured in — we never convert
          between currencies.
        </p>
        <div className="mt-3">
          <DraftLabel>Demo prices and formats — pending ClearOrigin approval</DraftLabel>
        </div>
      </div>

      {sections.map((section) => {
        const courses = data.courses.filter((c) => c.category === section.category);
        if (courses.length === 0) return null;
        return (
          <section key={section.category} className="mt-10 sm:mt-14" aria-labelledby={`courses-${section.category}`}>
            <h2 id={`courses-${section.category}`} className="font-serif text-xl font-medium tracking-tight text-co-ink sm:text-2xl">
              {section.title}
            </h2>
            <p className="mt-1 text-sm text-co-muted">{section.intro}</p>
            <div className={`mt-5 grid grid-cols-1 gap-4 sm:gap-5 ${courses.length > 1 ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:max-w-xl'}`}>
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  footer={
                    <div className="space-y-3">
                      {course.terms && (
                        <details className="rounded-co-sm border border-co-line px-3 py-2 text-xs text-co-muted">
                          <summary className="cursor-pointer font-medium text-co-ink">Package terms (draft)</summary>
                          <ul className="mt-2 list-disc space-y-1 pl-4">
                            {course.terms.map((term) => (
                              <li key={term}>{term}</li>
                            ))}
                          </ul>
                        </details>
                      )}
                      <ButtonLink to={`/book?course=${course.id}`} variant="primary" size="sm" className="w-full">
                        {course.category === 'package' ? `Choose ${course.title}` : `Book ${course.title}`}
                      </ButtonLink>
                    </div>
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
