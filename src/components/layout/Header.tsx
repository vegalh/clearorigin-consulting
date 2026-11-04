import { NavLink } from 'react-router-dom';
import { useAppData } from '@/state/AppDataContext';
import { ButtonLink } from '@/components/ui/Button';

const studentNavLinks = [
  { to: '/instructors', label: 'Find an Instructor' },
  { to: '/bookings', label: 'My Bookings' },
];

const instructorNavLinks = [
  { to: '/instructor/dashboard', label: 'Dashboard' },
  { to: '/instructor/availability', label: 'Availability' },
];

function navLinkClass(isActive: boolean): string {
  return `text-sm font-medium transition-colors ${isActive ? 'text-co-orange-dark' : 'text-co-muted hover:text-co-ink'}`;
}

export function Header() {
  const { role, setRole, data, currentInstructorId, setCurrentInstructorId } = useAppData();
  const links = role === 'student' ? studentNavLinks : instructorNavLinks;

  return (
    <header className="border-b border-co-line bg-co-paper">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <NavLink to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-co-ink text-sm font-semibold text-co-bg">
            CO
          </span>
          <span className="font-serif text-base font-medium tracking-tight text-co-ink">ClearOrigin</span>
        </NavLink>

        <nav className="flex items-center gap-6">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => navLinkClass(isActive)}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex flex-wrap items-center justify-end gap-3">
          {role === 'instructor' && (
            <select
              aria-label="Acting as instructor"
              value={currentInstructorId}
              onChange={(e) => setCurrentInstructorId(e.target.value)}
              className="max-w-[9.5rem] rounded-full border border-co-line bg-co-paper px-3 py-2 text-xs text-co-ink sm:max-w-none"
            >
              {data.instructors.map((instructor) => (
                <option key={instructor.id} value={instructor.id}>
                  Acting as {instructor.name}
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center rounded-full border border-co-line p-1 text-xs">
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`rounded-full px-3 py-1.5 font-medium transition-colors ${
                role === 'student' ? 'bg-co-orange-dark text-white' : 'text-co-muted hover:text-co-ink'
              }`}
              aria-pressed={role === 'student'}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => setRole('instructor')}
              className={`rounded-full px-3 py-1.5 font-medium transition-colors ${
                role === 'instructor' ? 'bg-co-orange-dark text-white' : 'text-co-muted hover:text-co-ink'
              }`}
              aria-pressed={role === 'instructor'}
            >
              Instructor
            </button>
          </div>

          {role === 'student' && (
            <ButtonLink to="/instructors" variant="primary" size="sm" className="hidden sm:inline-flex">
              Book a Session
            </ButtonLink>
          )}
        </div>
      </div>
    </header>
  );
}
