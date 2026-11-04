import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppData } from '@/state/AppDataContext';
import { useNow } from '@/hooks/useNow';
import { Card } from '@/components/ui/Card';
import { ButtonLink } from '@/components/ui/Button';
import { blocksSlot } from '@/lib/scheduling';
import { isBalanceExpired, remainingCredits, usedCredits } from '@/lib/checkout';
import { useI18n } from '@/i18n/useI18n';
import { BookingRow } from './BookingRow';

type Tab = 'upcoming' | 'past' | 'cancelled';

const tabs: Tab[] = ['upcoming', 'past', 'cancelled'];

export function MyBookingsPage() {
  const { data, currentStudentId } = useAppData();
  const { m, loc, fmt } = useI18n();
  const [activeTab, setActiveTab] = useState<Tab>('upcoming');
  const now = useNow(30_000);

  const myBookings = useMemo(
    () => data.bookings.filter((b) => b.studentId === currentStudentId),
    [data.bookings, currentStudentId],
  );

  const grouped = useMemo(() => {
    const t = now.getTime();
    const upcoming = myBookings.filter((b) => b.status === 'confirmed' && new Date(b.startAtUtc).getTime() > t);
    const past = myBookings.filter(
      (b) => b.status === 'completed' || (b.status === 'confirmed' && new Date(b.startAtUtc).getTime() <= t),
    );
    // Abandoned or expired checkouts were never confirmed, so they are not "cancelled lessons".
    const cancelled = myBookings.filter((b) => b.status === 'cancelled' && (b.confirmedAt || b.paymentMode === 'legacy' || !b.paymentMode));
    return { upcoming, past, cancelled };
  }, [myBookings, now]);

  const inProgress = myBookings.filter((b) => (b.status === 'held' || b.status === 'pending_payment') && blocksSlot(b, now));
  const balances = data.packageBalances.filter((b) => b.studentId === currentStudentId);

  const activeBookings = grouped[activeTab].slice().sort((a, b) => {
    const diff = new Date(a.startAtUtc).getTime() - new Date(b.startAtUtc).getTime();
    return activeTab === 'upcoming' ? diff : -diff;
  });

  const currentStudent = data.students.find((s) => s.id === currentStudentId);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="font-serif text-2xl font-medium tracking-tight text-co-ink sm:text-3xl">{m.learning.title}</h1>
      <p className="mt-2 text-sm text-co-muted">{m.learning.showingFor(currentStudent?.fullName ?? '')}</p>

      {inProgress.map((b) => {
        const course = data.courses.find((c) => c.id === b.courseId);
        return (
          <div key={b.id} className="mt-6 flex flex-col gap-3 rounded-co-md border border-co-orange-dark/40 bg-co-pale/40 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-co-ink">
              {m.learning.inProgress(course ? loc.course(course).title : m.learning.lesson)}
            </p>
            <ButtonLink to={`/book/checkout/${b.id}`} variant="primary" size="sm" className="shrink-0">
              {m.learning.resume}
            </ButtonLink>
          </div>
        );
      })}

      {balances.length > 0 && (
        <section className="mt-6 space-y-3" aria-labelledby="package-credits">
          <h2 id="package-credits" className="text-xs font-semibold uppercase tracking-wide text-co-sage-dark">
            {m.learning.packageCredits}
          </h2>
          {balances.map((balance) => {
            const pkg = data.courses.find((c) => c.id === balance.packageCourseId);
            const remaining = remainingCredits(balance);
            const expired = isBalanceExpired(balance, now);
            return (
              <Card key={balance.id} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-co-ink">{pkg ? loc.course(pkg).title : m.learning.lessonPackage}</p>
                  <dl className="mt-2 grid grid-cols-3 gap-4 text-center sm:text-left">
                    <div>
                      <dt className="text-xs text-co-muted">{m.learning.total}</dt>
                      <dd className="text-lg font-semibold text-co-ink">{balance.totalCredits}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-co-muted">{m.learning.used}</dt>
                      <dd className="text-lg font-semibold text-co-ink">{usedCredits(balance)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-co-muted">{m.learning.remaining}</dt>
                      <dd className="text-lg font-semibold text-co-orange-dark">{remaining}</dd>
                    </div>
                  </dl>
                  {balance.expiresAt && (
                    <p className="mt-2 text-xs text-co-muted">
                      {expired ? m.learning.expiredOn(fmt.shortDate(balance.expiresAt)) : m.learning.validUntil(fmt.shortDate(balance.expiresAt))}
                    </p>
                  )}
                </div>
                {remaining > 0 && !expired && pkg?.redeemsCourseIds?.[0] && (
                  <ButtonLink
                    to={`/book?course=${pkg.redeemsCourseIds[0]}&mode=credit&balance=${balance.id}`}
                    variant="secondary"
                    size="sm"
                    className="shrink-0"
                  >
                    {m.learning.bookWithCredit}
                  </ButtonLink>
                )}
              </Card>
            );
          })}
        </section>
      )}

      <div className="mt-6 flex w-full gap-1 rounded-full border border-co-line p-1 text-xs sm:w-fit sm:gap-2 sm:text-sm">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            aria-pressed={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 whitespace-nowrap rounded-full px-2 py-2 font-medium transition-colors sm:flex-none sm:px-4 ${
              activeTab === tab ? 'bg-co-orange-dark text-white' : 'text-co-muted hover:text-co-ink'
            }`}
          >
            {m.learning.tabs[tab]} ({grouped[tab].length})
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {activeBookings.length === 0 && (
          <p className="rounded-co-md border border-dashed border-co-line bg-co-paper p-6 text-sm text-co-muted">
            {m.learning.empty[activeTab]}{' '}
            {activeTab === 'upcoming' && (
              <Link to="/book" className="font-medium text-co-orange-dark underline underline-offset-2">
                {m.learning.bookALesson}
              </Link>
            )}
          </p>
        )}
        {activeBookings.map((booking) => (
          <BookingRow key={booking.id} booking={booking} now={now} />
        ))}
      </div>
    </div>
  );
}
