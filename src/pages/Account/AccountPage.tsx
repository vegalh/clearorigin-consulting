import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAppData } from '@/state/AppDataContext';
import { useI18n } from '@/i18n/useI18n';
import { LANGS, type Lang } from '@/i18n/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { inputClass } from '@/components/ui/fieldStyles';
import { supportedTimezones } from '@/lib/dates/format';
import { MeetingSettings } from '@/pages/InstructorAvailability/MeetingSettings';

export function AccountPage() {
  const { data, session, role, currentStudentId, currentInstructorId, updateProfile, signOut, viewerTimezone, setViewerTimezone, setMeetingProvider } =
    useAppData();
  const { m, loc, lang, setLang } = useI18n();
  const navigate = useNavigate();

  const student = data.students.find((s) => s.id === currentStudentId);
  const instructor = data.instructors.find((i) => i.id === currentInstructorId);
  const [fullName, setFullName] = useState(student?.fullName ?? '');
  const [email, setEmail] = useState(student?.email ?? '');
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  if (!session) return <Navigate to="/login?next=%2Faccount" replace />;

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    const result = updateProfile({ fullName, email });
    setMessage(result.ok ? { ok: true, text: m.account.saved } : { ok: false, text: loc.reason(result.reason) });
  };

  const handleSignOut = () => {
    signOut();
    navigate('/', { replace: true });
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="font-serif text-2xl font-medium tracking-tight text-co-ink sm:text-3xl">{m.account.title}</h1>

      <div className="mt-8 space-y-6">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-co-sage-dark">{m.account.profile}</h2>
            <span className="rounded-full bg-co-sage/25 px-3 py-1 text-xs font-medium text-co-sage-dark">
              {m.account.role}: {role === 'instructor' ? m.nav.instructorBadge : m.nav.studentBadge}
            </span>
          </div>

          {student && (
            <form onSubmit={handleSave} className="mt-4 space-y-4" noValidate>
              <div>
                <label htmlFor="account-name" className="text-xs font-medium text-co-muted">
                  {m.account.fullName}
                </label>
                <input id="account-name" value={fullName} onChange={(e) => setFullName(e.target.value)} className={`${inputClass} mt-1 w-full`} />
              </div>
              <div>
                <label htmlFor="account-email" className="text-xs font-medium text-co-muted">
                  {m.account.email}
                </label>
                <input
                  id="account-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`${inputClass} mt-1 w-full`}
                />
                <p className="mt-1 text-xs text-co-muted">{m.account.emailStatus}</p>
              </div>
              {message && (
                <p role="status" className={`text-sm ${message.ok ? 'text-co-sage-dark' : 'text-red-700'}`}>
                  {message.text}
                </p>
              )}
              <Button type="submit" variant="primary" size="sm">
                {m.account.save}
              </Button>
            </form>
          )}

          {instructor && (
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs text-co-muted">{m.account.fullName}</dt>
                <dd className="text-co-ink">
                  {instructor.name} {instructor.chineseName && <span className="text-co-muted">{instructor.chineseName}</span>}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-co-muted">{m.account.email}</dt>
                <dd className="text-co-ink">{instructor.email}</dd>
                <dd className="mt-1 text-xs text-co-muted">{m.account.emailStatus}</dd>
              </div>
              <p className="text-xs text-co-muted">{m.account.managedByClearOrigin}</p>
            </dl>
          )}
        </Card>

        <Card>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-co-sage-dark">{m.account.preferences}</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="account-language" className="text-xs font-medium text-co-muted">
                {m.account.language}
              </label>
              <Select
                id="account-language"
                variant="field"
                value={lang}
                onChange={(e) => setLang(e.target.value as Lang)}
                wrapperClassName="mt-1 w-full"
              >
                {LANGS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.id === 'en' ? 'English' : '简体中文'}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label htmlFor="account-timezone" className="text-xs font-medium text-co-muted">
                {m.account.timezone}
              </label>
              <Select
                id="account-timezone"
                variant="field"
                value={viewerTimezone}
                onChange={(e) => setViewerTimezone(e.target.value)}
                wrapperClassName="mt-1 w-full"
              >
                {supportedTimezones().map((tz) => (
                  <option key={tz} value={tz}>
                    {loc.timezone(tz)}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </Card>

        {instructor && (
          <>
            <p className="text-sm text-co-muted">{m.account.scheduleTimezone(loc.timezone(instructor.timezone))}</p>
            <MeetingSettings
              provider={data.meetingConfigurations.find((c) => c.instructorId === instructor.id)?.provider ?? 'zoom'}
              onChange={(provider) => setMeetingProvider(instructor.id, provider)}
            />
          </>
        )}

        <Button variant="outline" onClick={handleSignOut}>
          {m.account.signOut}
        </Button>
      </div>
    </div>
  );
}
