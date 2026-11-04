import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { DemoRole } from '@/types';
import { useAppData } from '@/state/AppDataContext';
import { useI18n } from '@/i18n/useI18n';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

/**
 * Keeps student and instructor areas apart. Signed out → sign-in page (and
 * back here afterwards); signed in with the other role → an explanation and a
 * way to switch accounts. Prototype gating only, not a security boundary.
 */
export function RequireRole({ role, children }: { role: DemoRole; children: ReactNode }) {
  const { session, signOut, data } = useAppData();
  const { m, loc } = useI18n();
  const location = useLocation();

  if (!session) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?role=${role}&next=${next}`} replace />;
  }

  if (session.role !== role) {
    const instructor = data.instructors.find((i) => i.id === session.userId);
    const student = data.students.find((s) => s.id === session.userId);
    const name = instructor ? loc.instructorName(instructor) : (student?.fullName ?? '');
    return (
      <div className="mx-auto max-w-xl px-4 py-10 sm:px-6 sm:py-16">
        <Card>
          <h1 className="font-serif text-2xl font-medium tracking-tight text-co-ink">{m.login.wrongRole[role]}</h1>
          <p className="mt-3 text-sm text-co-muted">
            {m.login.signedInAs(session.role === 'instructor' ? m.nav.instructorBadge : m.nav.studentBadge, name)}
          </p>
          <Button variant="primary" className="mt-6" onClick={signOut}>
            {m.login.signOutAndSwitch}
          </Button>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
