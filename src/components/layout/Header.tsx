import { NavLink } from 'react-router-dom';
import { useAppData } from '@/state/AppDataContext';
import { useI18n } from '@/i18n/useI18n';
import { ButtonLink } from '@/components/ui/Button';
import { LanguageSwitch } from './LanguageSwitch';

function navLinkClass(isActive: boolean): string {
  return `whitespace-nowrap text-sm font-medium transition-colors ${isActive ? 'text-co-orange-dark' : 'text-co-muted hover:text-co-ink'}`;
}

export function Header() {
  const { role, data, currentStudentId, currentInstructorId } = useAppData();
  const { m, loc } = useI18n();

  const links =
    role === 'instructor'
      ? [
          { to: '/instructor/dashboard', label: m.nav.studio },
          { to: '/instructor/availability', label: m.nav.availability },
        ]
      : [
          { to: '/courses', label: m.nav.courses },
          { to: '/instructors', label: m.nav.instructors },
          { to: '/faq', label: m.nav.faq },
          { to: '/bookings', label: m.nav.learningSpace },
        ];

  const instructor = data.instructors.find((i) => i.id === currentInstructorId);
  const student = data.students.find((s) => s.id === currentStudentId);
  const accountName = instructor ? loc.instructorName(instructor) : student?.fullName;

  return (
    <header className="border-b border-co-line bg-co-paper">
      {/*
        Mobile: logo + language/account on the first row, nav on a second
        full-width row (scrolls inside the header if needed). lg+: one row.
      */}
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3 sm:px-6 sm:py-4">
        <NavLink to="/" aria-label={m.nav.homeLabel} className="order-1 flex shrink-0 items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-co-ink text-sm font-semibold text-co-bg">CO</span>
          <span className="font-serif text-base font-medium tracking-tight text-co-ink max-[359px]:hidden">ClearOrigin</span>
        </NavLink>

        <div className="order-3 flex w-full min-w-0 items-center border-t border-co-line pt-3 lg:order-2 lg:w-auto lg:flex-1 lg:border-0 lg:pt-0">
          <nav aria-label={m.nav.main} className="no-scrollbar flex min-w-0 max-w-full items-center gap-5 overflow-x-auto lg:gap-6">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} className={({ isActive }) => navLinkClass(isActive)}>
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="order-2 flex items-center gap-2 sm:gap-3 lg:order-3">
          <LanguageSwitch />
          {accountName ? (
            <NavLink
              to="/account"
              aria-label={m.nav.accountFor(accountName)}
              className={({ isActive }) =>
                `flex max-w-[10rem] items-center gap-2 rounded-full border px-2 py-1 text-xs font-medium transition-colors sm:max-w-[14rem] ${
                  isActive ? 'border-co-orange-dark text-co-orange-dark' : 'border-co-line text-co-ink hover:border-co-orange-dark'
                }`
              }
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-co-ink text-[10px] font-semibold text-co-bg">
                {accountName.slice(0, 1).toUpperCase()}
              </span>
              <span className="truncate max-sm:hidden">{accountName}</span>
              <span className="shrink-0 rounded-full bg-co-sage/25 px-1.5 py-0.5 text-[10px] text-co-sage-dark">
                {role === 'instructor' ? m.nav.instructorBadge : m.nav.studentBadge}
              </span>
            </NavLink>
          ) : (
            <ButtonLink to="/login" variant="outline" size="sm">
              {m.nav.signIn}
            </ButtonLink>
          )}
          {role !== 'instructor' && (
            <ButtonLink to="/book" variant="primary" size="sm" className="max-md:hidden">
              {m.nav.bookASession}
            </ButtonLink>
          )}
        </div>
      </div>
    </header>
  );
}
