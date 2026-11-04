import { useMemo, useState } from 'react';
import { useAppData } from '@/state/AppDataContext';
import { BookingRow } from './BookingRow';

type Tab = 'upcoming' | 'past' | 'cancelled';

const tabs: { id: Tab; label: string }[] = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past' },
  { id: 'cancelled', label: 'Cancelled' },
];

export function MyBookingsPage() {
  const { data, currentStudentId } = useAppData();
  const [activeTab, setActiveTab] = useState<Tab>('upcoming');

  const myBookings = useMemo(
    () => data.bookings.filter((b) => b.studentId === currentStudentId),
    [data.bookings, currentStudentId],
  );

  const grouped = useMemo(() => {
    const now = Date.now();
    const upcoming = myBookings.filter((b) => b.status === 'confirmed' && new Date(b.startAtUtc).getTime() > now);
    const past = myBookings.filter(
      (b) => b.status === 'completed' || (b.status === 'confirmed' && new Date(b.startAtUtc).getTime() <= now),
    );
    const cancelled = myBookings.filter((b) => b.status === 'cancelled');
    return { upcoming, past, cancelled };
  }, [myBookings]);

  const activeBookings = grouped[activeTab].slice().sort((a, b) => {
    const diff = new Date(a.startAtUtc).getTime() - new Date(b.startAtUtc).getTime();
    return activeTab === 'upcoming' ? diff : -diff;
  });

  const currentStudent = data.students.find((s) => s.id === currentStudentId);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="font-serif text-2xl font-medium tracking-tight sm:text-3xl text-co-ink">My Learning Space</h1>
      <p className="mt-2 text-sm text-co-muted">
        Showing demo bookings for {currentStudent?.fullName ?? 'this browser'}.
      </p>

      <div className="mt-6 flex w-full gap-1 rounded-full border border-co-line p-1 text-xs sm:w-fit sm:gap-2 sm:text-sm">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 whitespace-nowrap rounded-full px-2 py-2 font-medium transition-colors sm:flex-none sm:px-4 ${
              activeTab === tab.id ? 'bg-co-orange-dark text-white' : 'text-co-muted hover:text-co-ink'
            }`}
          >
            {tab.label} ({grouped[tab.id].length})
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {activeBookings.length === 0 && (
          <p className="rounded-co-md border border-dashed border-co-line bg-co-paper p-6 text-sm text-co-muted">
            No {activeTab} sessions yet.
          </p>
        )}
        {activeBookings.map((booking) => (
          <BookingRow key={booking.id} booking={booking} />
        ))}
      </div>
    </div>
  );
}
