import { ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAppData } from '@/state/AppDataContext';

const sessionBeats = [
  { title: 'A warm hello', body: 'Start with a few minutes of easy small talk, in whichever language feels right.' },
  { title: 'Guided practice', body: 'Your instructor steers the conversation toward what you actually want to work on.' },
  { title: 'A gentle recap', body: 'Leave with a note or two on what to practice before your next session.' },
];

const philosophy = [
  {
    title: 'Conversation first',
    body: 'Fluency grows out of real exchanges, not drills. Every session is a conversation between two people, not a lesson delivered at you.',
  },
  {
    title: 'No judgment, just practice',
    body: 'Mistakes are part of speaking a language out loud. Instructors are here to listen closely and help you keep going, not to grade you.',
  },
  {
    title: 'Progress you can feel',
    body: 'Short, regular sessions build confidence faster than long, infrequent ones. Book the length and pace that actually fits your week.',
  },
];

const bookingSteps = [
  {
    title: 'Browse instructors',
    body: 'Filter by language and specialty to find someone whose style fits how you like to learn.',
  },
  {
    title: 'Pick a time that works',
    body: 'See real availability in your own timezone, generated from each instructor\u2019s weekly schedule.',
  },
  {
    title: 'Confirm your session',
    body: 'Share a bit about your goals, confirm, and get a calendar file for the time you booked.',
  },
];

export function HomePage() {
  const { data } = useAppData();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <section className="grid grid-cols-1 items-center gap-8 sm:gap-10 lg:grid-cols-2">
        <div>
          <span className="inline-flex rounded-full bg-co-sage/25 px-3 py-1 text-xs font-medium text-co-sage-dark">
            Interactive prototype
          </span>
          <h1 className="mt-5 font-serif text-[2rem] font-medium leading-tight tracking-tight text-co-ink sm:text-5xl">
            Every conversation takes you somewhere.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-co-muted">
            ClearOrigin pairs you with a real instructor for live Chinese and English conversation practice
            &mdash; the kind of unhurried, human exchange that actually builds fluency. This prototype shows what
            finding a time and booking that conversation could feel like.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <ButtonLink to="/instructors" variant="primary">
              Start a Conversation
            </ButtonLink>
            <a
              href="#featured-instructors"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-co-line px-6 py-3 text-sm font-medium text-co-ink transition-colors hover:border-co-orange-dark hover:text-co-orange-dark"
            >
              Meet Our Instructors
            </a>
          </div>
        </div>

        <Card className="bg-co-pale/30">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-co-sage-dark">A typical first session</h2>
          <ol className="mt-4 space-y-5">
            {sessionBeats.map((beat, index) => (
              <li key={beat.title} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-co-orange-dark text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium text-co-ink">{beat.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-co-muted">{beat.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </section>

      <section className="mt-14 sm:mt-20">
        <h2 className="font-serif text-2xl font-medium tracking-tight text-co-ink">Our learning philosophy</h2>
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {philosophy.map((item) => (
            <Card key={item.title} className="bg-co-paper">
              <p className="font-medium text-co-ink">{item.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-co-muted">{item.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="featured-instructors" className="mt-14 scroll-mt-8 sm:mt-20">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-serif text-2xl font-medium tracking-tight text-co-ink">Featured instructors</h2>
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

      <section className="mt-14 rounded-co-lg border border-co-line bg-co-paper p-6 sm:mt-20 sm:p-8">
        <h2 className="font-serif text-2xl font-medium tracking-tight text-co-ink">How booking works</h2>
        <ol className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {bookingSteps.map((step, index) => (
            <li key={step.title}>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-co-sage/25 text-sm font-semibold text-co-sage-dark">
                {index + 1}
              </span>
              <p className="mt-3 font-medium text-co-ink">{step.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-co-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10 rounded-co-lg border border-co-line bg-co-paper p-6 text-sm sm:mt-12 sm:p-8 leading-relaxed text-co-muted">
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
