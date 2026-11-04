import { useMemo } from 'react';
import { ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { useAppData } from '@/state/AppDataContext';
import { formatDisplayDate, formatDisplayTimeRange } from '@/lib/dates/format';

export function InstructorDashboardPage() {
  const { data, currentInstructorId, viewerTimezone } = useAppData();

  const instructor = data.instructors.find((i) => i.id === currentInstructorId);

  const { upcoming, completedCount, cancelledCount, todayCount } = useMemo(() => {
    const now = Date.now();
    const mine = data.bookings.filter((b) => b.instructorId === currentInstructorId);
    const confirmedUpcoming = mine
      .filter((b) => b.status === 'confirmed' && new Date(b.startAtUtc).getTime() > now)
      .sort((a, b) => new Date(a.startAtUtc).getTime() - new Date(b.startAtUtc).getTime());

    const startOfTodayLocal = new Date();
    startOfTodayLocal.setHours(0, 0, 0, 0);
    const endOfTodayLocal = new Date();
    endOfTodayLocal.setHours(23, 59, 59, 999);

    return {
      upcoming: confirmedUpcoming,
      completedCount: mine.filter((b) => b.status === 'completed').length,
      cancelledCount: mine.filter((b) => b.status === 'cancelled').length,
      todayCount: confirmedUpcoming.filter((b) => {
        const t = new Date(b.startAtUtc).getTime();
        return t >= startOfTodayLocal.getTime() && t <= endOfTodayLocal.getTime();
      }).length,
    };
  }, [data.bookings, currentInstructorId]);

  if (!instructor) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-medium tracking-tight sm:text-3xl text-co-ink">
            Welcome back, {instructor.name.split(' ')[0]}
          </h1>
          <p className="mt-2 text-sm text-co-muted">Your Teaching Studio, acting as {instructor.name}.</p>
        </div>
        <ButtonLink to="/instructor/availability" variant="outline" size="sm">
          Edit availability
        </ButtonLink>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:mt-8 sm:grid-cols-3 sm:gap-4">
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-co-muted">Today</p>
          <p className="mt-2 text-2xl font-semibold text-co-ink sm:text-3xl">{todayCount}</p>
          <p className="mt-1 text-xs text-co-muted">confirmed session{todayCount === 1 ? '' : 's'}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-co-muted">Completed</p>
          <p className="mt-2 text-2xl font-semibold text-co-ink sm:text-3xl">{completedCount}</p>
          <p className="mt-1 text-xs text-co-muted">total sessions held</p>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-co-muted">Cancelled</p>
          <p className="mt-2 text-2xl font-semibold text-co-ink sm:text-3xl">{cancelledCount}</p>
          <p className="mt-1 text-xs text-co-muted">total cancellations</p>
        </Card>
      </div>

      <div className="mt-10">
        <h2 className="font-serif text-xl font-medium tracking-tight text-co-ink">Upcoming sessions</h2>
        <div className="mt-4 space-y-3">
          {upcoming.length === 0 && (
            <p className="rounded-co-md border border-dashed border-co-line bg-co-paper p-6 text-sm text-co-muted">
              No upcoming sessions booked yet.
            </p>
          )}
          {upcoming.map((booking) => {
            const sessionType = data.sessionTypes.find((st) => st.id === booking.sessionTypeId);
            const student = data.students.find((s) => s.id === booking.studentId);
            return (
              <Card key={booking.id} className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-co-ink">
                    {sessionType?.name} with {student?.fullName ?? 'a student'}
                  </p>
                  <p className="mt-1 text-sm text-co-muted">{formatDisplayDate(booking.startAtUtc, viewerTimezone)}</p>
                  <p className="text-sm text-co-muted">
                    {formatDisplayTimeRange(booking.startAtUtc, booking.endAtUtc, viewerTimezone)}
                  </p>
                </div>
                <StatusBadge status={booking.status} />
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
