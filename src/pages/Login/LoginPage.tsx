import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { GraduationCap, Presentation } from 'lucide-react';
import type { DemoRole } from '@/types';
import { useAppData } from '@/state/AppDataContext';
import { useI18n } from '@/i18n/useI18n';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DemoLabel } from '@/components/ui/Badge';
import { inputClass } from '@/components/ui/fieldStyles';

/** Default landing page for each role after signing in. */
const homeFor: Record<DemoRole, string> = { student: '/bookings', instructor: '/instructor/dashboard' };

/** Demo accounts offered as one-click sign-in until email verification exists. */
const DEMO_STUDENTS = ['student-alex', 'student-jordan'];

export function LoginPage() {
  const { data, session, signInStudent, signInInstructor, signInAs } = useAppData();
  const { m, loc } = useI18n();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [role, setRole] = useState<DemoRole>(params.get('role') === 'instructor' ? 'instructor' : 'student');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Only follow in-app paths for the post-sign-in redirect.
  const rawNext = params.get('next');
  const next = rawNext && rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : null;
  const destination = (signedInRole: DemoRole) => next ?? homeFor[signedInRole];

  if (session) return <Navigate to={destination(session.role)} replace />;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const result = role === 'student' ? signInStudent({ email, fullName }) : signInInstructor(email);
    if (result.ok) navigate(destination(role), { replace: true });
    else setError(role === 'instructor' ? m.login.unknownInstructor : loc.reason(result.reason));
  };

  const demoAccounts =
    role === 'student'
      ? data.students.filter((s) => DEMO_STUDENTS.includes(s.id)).map((s) => ({ id: s.id, label: m.login.quickStudent(s.fullName) }))
      : data.instructors.map((i) => ({ id: i.id, label: m.login.quickInstructor(loc.instructorName(i)) }));

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="font-serif text-2xl font-medium tracking-tight text-co-ink sm:text-3xl">{m.login.title}</h1>
      <p className="mt-2 text-sm text-co-muted">{m.login.intro}</p>

      <div role="tablist" aria-label={m.login.title} className="mt-6 grid grid-cols-2 gap-2">
        {(
          [
            ['student', m.login.student, GraduationCap],
            ['instructor', m.login.instructor, Presentation],
          ] as const
        ).map(([value, label, Icon]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={role === value}
            onClick={() => {
              setRole(value);
              setError(null);
            }}
            className={`flex items-center justify-center gap-2 rounded-co-md border px-3 py-3 text-sm font-medium transition-colors ${
              role === value ? 'border-co-orange-dark bg-co-pale/40 text-co-orange-dark' : 'border-co-line bg-co-paper text-co-ink hover:border-co-orange-dark'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      <Card className="mt-4">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="login-email" className="text-xs font-medium text-co-muted">
              {m.login.emailLabel}
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${inputClass} mt-1 w-full`}
            />
            <p className="mt-1 text-xs text-co-muted">{role === 'student' ? m.login.studentHelp : m.login.instructorHelp}</p>
          </div>
          {role === 'student' && (
            <div>
              <label htmlFor="login-name" className="text-xs font-medium text-co-muted">
                {m.login.nameLabel}
              </label>
              <input
                id="login-name"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={`${inputClass} mt-1 w-full`}
              />
            </div>
          )}
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          <Button type="submit" variant="primary" className="w-full">
            {m.login.continue}
          </Button>
          <p className="text-xs text-co-muted">{m.login.noPassword}</p>
        </form>
      </Card>

      <section className="mt-6" aria-labelledby="demo-accounts">
        <div className="flex items-center gap-2">
          <h2 id="demo-accounts" className="text-xs font-semibold uppercase tracking-wide text-co-sage-dark">
            {m.login.quickTitle}
          </h2>
          <DemoLabel>{m.common.demo}</DemoLabel>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2">
          {demoAccounts.map((account) => (
            <Button
              key={account.id}
              variant="outline"
              onClick={() => {
                signInAs(role, account.id);
                navigate(destination(role), { replace: true });
              }}
            >
              {account.label}
            </Button>
          ))}
        </div>
      </section>
    </div>
  );
}
