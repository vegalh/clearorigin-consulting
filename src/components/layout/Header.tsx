import { NavLink } from 'react-router-dom';
import { useAppData } from '@/state/AppDataContext';
import { ButtonLink } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';

const studentNavLinks = [
  { to: '/courses', label: 'Courses & Pricing' },
  { to: '/instructors', label: 'Instructors' },
  { to: '/faq', label: 'FAQ' },
  { to: '/bookings', label: 'My Learning Space' },
];

const instructorNavLinks = [
  { to: '/instructor/dashboard', label: 'Teaching Studio' },
  { to: '/instructor/availability', label: 'Availability' },
];

function navLinkClass(isActive: boolean): string {
  return `whitespace-nowrap text-sm font-medium transition-colors ${isActive ? 'text-co-orange-dark' : 'text-co-muted hover:text-co-ink'}`;
}

export function Header() {
  const { role, setRole, data, currentInstructorId, setCurrentInstructorId } = useAppData();
  const links = role === 'student' ? studentNavLinks : instructorNavLinks;

  return (
    <header className="border-b border-co-line bg-co-paper">
      {/*
        Mobile: logo + role toggle on the first row, nav (+ instructor picker) on a
        second full-width row. md+: a single row with nav beside the logo.
      */}
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3 sm:px-6 sm:py-4">
        <NavLink to="/" aria-label="ClearOrigin home" className="order-1 flex shrink-0 items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-co-ink text-sm font-semibold text-co-bg">
            CO
          </span>
          <span className="font-serif text-base font-medium tracking-tight text-co-ink max-[359px]:hidden">ClearOrigin</span>
        </NavLink>

        <div className="order-3 flex w-full min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-co-line pt-3 lg:order-2 lg:w-auto lg:flex-1 lg:border-0 lg:pt-0">
          <nav aria-label="Main" className="no-scrollbar flex min-w-0 max-w-full items-center gap-5 overflow-x-auto lg:gap-6">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} className={({ isActive }) => navLinkClass(isActive)}>
                {link.label}
              </NavLink>
            ))}
          </nav>

          {role === 'instructor' && (
            <Select
              aria-label="Acting as instructor"
              size="sm"
              value={currentInstructorId}
              onChange={(e) => setCurrentInstructorId(e.target.value)}
              wrapperClassName="w-full sm:w-auto"
            >
              {data.instructors.map((instructor) => (
                <option key={instructor.id} value={instructor.id}>
                  Acting as {instructor.name}
                </option>
              ))}
            </Select>
          )}
        </div>

        <div className="order-2 flex items-center gap-3 lg:order-3">
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
            <ButtonLink to="/book" variant="primary" size="sm" className="max-sm:hidden">
              Book a Session
            </ButtonLink>
          )}
        </div>
      </div>
    </header>
  );
}
