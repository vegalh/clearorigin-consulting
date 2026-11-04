import { ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAppData } from '@/state/AppDataContext';

const steps = [
  {
    title: 'Find your instructor',
    body: 'Browse instructors by language, specialty, and the session length that fits your schedule.',
  },
  {
    title: 'Pick a time that works',
    body: 'See real availability in your own timezone, generated from each instructor\u2019s weekly schedule.',
  },
  {
    title: 'Confirm and practice',
    body: 'Share a bit about your goals, confirm your session, and get a calendar file for the time you booked.',
  },
];

export function HomePage() {
  const { data } = useAppData();

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <section className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
        <div>
          <span className="inline-flex rounded-full bg-co-pale px-3 py-1 text-xs font-medium text-co-green">
            Interactive prototype
          </span>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-co-ink sm:text-5xl">
            Book real Chinese &amp; English conversation practice, on your schedule.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-co-muted">
            This prototype demonstrates what booking a live practice session with a ClearOrigin instructor could
            look like &mdash; from finding the right coach to confirming a time that works across timezones.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink to="/instructors" variant="primary">
              Find an instructor
            </ButtonLink>
            <ButtonLink to="/bookings" variant="outline">
              View my bookings
            </ButtonLink>
          </div>
        </div>

        <Card className="bg-co-pale/40">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-co-green">How it works</h2>
          <ol className="mt-4 space-y-5">
            {steps.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-co-green text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium text-co-ink">{step.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-co-muted">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </section>

      <section className="mt-20">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-semibold tracking-tight text-co-ink">Meet the instructors</h2>
          <ButtonLink to="/instructors" variant="ghost" size="sm">
            See all
          </ButtonLink>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {data.instructors.map((instructor) => (
            <Card key={instructor.id} className="flex flex-col gap-3">
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold text-white ${instructor.avatarColorClass}`}
              >
                {instructor.avatarInitials}
              </span>
              <div>
                <p className="font-medium text-co-ink">{instructor.name}</p>
                <p className="text-xs text-co-muted">{instructor.title}</p>
              </div>
              <ButtonLink to={`/instructors/${instructor.id}`} variant="outline" size="sm" className="mt-auto">
                View profile
              </ButtonLink>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-20 rounded-co-lg border border-co-line bg-co-paper p-8 text-sm leading-relaxed text-co-muted">
        <p>
          <strong className="text-co-ink">Prototype disclaimer:</strong> instructors, availability, and pricing
          shown throughout this prototype are fictional demo data created to demonstrate the booking experience.
          They do not represent real ClearOrigin Consulting staff, schedules, or rates. All data lives only in
          this browser (no account, no real emails, no real meeting links are created).
        </p>
      </section>
    </div>
  );
}
