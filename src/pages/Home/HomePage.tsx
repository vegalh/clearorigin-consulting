import { ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DraftLabel } from '@/components/ui/Badge';
import { Portrait } from '@/components/ui/Portrait';
import { CoursePrice } from '@/components/booking/CourseCard';
import { useAppData } from '@/state/AppDataContext';
import { heroContent, howToBegin, learnerGroups, teachingPhilosophy } from '@/config/siteContent';

export function HomePage() {
  const { data } = useAppData();
  const trial = data.courses.find((c) => c.category === 'trial');

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <section className="grid grid-cols-1 items-center gap-8 sm:gap-10 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full bg-co-sage/25 px-3 py-1 text-xs font-medium text-co-sage-dark">
              {heroContent.eyebrow}
            </span>
            {heroContent.status === 'proposed' && <DraftLabel>Proposed messaging</DraftLabel>}
          </div>
          <h1 className="mt-5 font-serif text-[2rem] font-medium leading-tight tracking-tight text-co-ink sm:text-5xl">
            {heroContent.headline}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-co-muted">{heroContent.body}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <ButtonLink to={heroContent.primaryCta.to} variant="primary">
              {heroContent.primaryCta.label}
            </ButtonLink>
            <ButtonLink to={heroContent.secondaryCta.to} variant="outline">
              {heroContent.secondaryCta.label}
            </ButtonLink>
          </div>
        </div>

        <Card className="bg-co-pale/30">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-co-sage-dark">How every lesson flows</h2>
          <ol className="mt-4 space-y-5">
            {teachingPhilosophy.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-co-orange-dark text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium text-co-ink">
                    {step.title} <span className="ml-1 text-sm font-normal text-co-muted">{step.chinese}</span>
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-co-muted">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </section>

      <section className="mt-14 sm:mt-20" aria-labelledby="who-we-teach">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="who-we-teach" className="font-serif text-2xl font-medium tracking-tight text-co-ink">
            Who we teach
          </h2>
          <DraftLabel>Proposed learner groups</DraftLabel>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {learnerGroups.map((group) => (
            <Card key={group.id} className="bg-co-paper">
              <p className="font-medium text-co-ink">{group.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-co-muted">{group.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="featured-instructors" className="mt-14 scroll-mt-8 sm:mt-20">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-serif text-2xl font-medium tracking-tight text-co-ink">Meet our instructors</h2>
          <ButtonLink to="/instructors" variant="ghost" size="sm">
            See all
          </ButtonLink>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {data.instructors.map((instructor) => (
            <Card key={instructor.id} className="flex flex-col gap-3">
              <Portrait instructor={instructor} size="md" />
              <div>
                <p className="font-medium text-co-ink">
                  {instructor.name} {instructor.chineseName && <span className="text-sm font-normal text-co-muted">{instructor.chineseName}</span>}
                </p>
                <p className="text-xs text-co-muted">{instructor.title}</p>
              </div>
              <p className="text-xs text-co-sage-dark">{instructor.specialties.join(' · ')}</p>
              <ButtonLink to={`/instructors/${instructor.id}`} variant="outline" size="sm" className="mt-auto">
                View profile
              </ButtonLink>
            </Card>
          ))}
        </div>
        <p className="mt-3 text-xs text-co-muted">Instructor profiles are fictional demo data.</p>
      </section>

      <section className="mt-14 grid grid-cols-1 gap-6 rounded-co-lg border border-co-line bg-co-paper p-6 sm:mt-20 sm:p-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="font-serif text-2xl font-medium tracking-tight text-co-ink">New here? Start with a trial lesson.</h2>
          <ol className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {howToBegin.map((step, index) => (
              <li key={step.title}>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-co-sage/25 text-sm font-semibold text-co-sage-dark">
                  {index + 1}
                </span>
                <p className="mt-3 font-medium text-co-ink">{step.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-co-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
        {trial && (
          <div className="flex flex-col justify-between gap-4 rounded-co-md bg-co-pale/30 p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-co-sage-dark">
                {trial.title} · {trial.durationMinutes} min
              </p>
              <div className="mt-2">
                <CoursePrice course={trial} />
              </div>
            </div>
            <ButtonLink to={`/book?course=${trial.id}`} variant="primary">
              Book a Trial Lesson
            </ButtonLink>
          </div>
        )}
      </section>

      <section className="mt-10 rounded-co-lg border border-co-line bg-co-paper p-6 text-sm leading-relaxed text-co-muted sm:mt-12 sm:p-8">
        <p>
          <strong className="text-co-ink">Prototype disclaimer:</strong> instructors, courses, pricing, availability and policies
          shown throughout this prototype are fictional or draft demo data created to demonstrate the booking experience. They do
          not represent real ClearOrigin Consulting staff, schedules, rates or terms. Payments and meeting links are simulated, and
          all data lives only in this browser.
        </p>
      </section>
    </div>
  );
}
