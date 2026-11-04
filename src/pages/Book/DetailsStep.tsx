import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ChineseLevel, Course, CurrencyCode, LearningGoal } from '@/types';
import { useAppData } from '@/state/AppDataContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { inputClass } from '@/components/ui/fieldStyles';
import { chineseLevelOptions, learningGoalOptions } from '@/config/learnerOptions';
import { bookingPolicy } from '@/config/bookingPolicy';
import { configuredCurrencies, coursePrice, formatMoney } from '@/lib/checkout';
import { hasValidationErrors, validateLearnerDetails } from '@/lib/validation/booking';
import { SelectedCourseSummary } from './SelectedCourseSummary';
import type { BookingSelection } from './BookPage';

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1 text-xs text-red-700">
      {message}
    </p>
  );
}

export function DetailsStep({ selection, course, onBack }: { selection: BookingSelection; course: Course; onBack: () => void }) {
  const navigate = useNavigate();
  const { data, currentStudentId, startCheckout } = useAppData();
  const existing = data.students.find((s) => s.id === currentStudentId);
  const instructor = data.instructors.find((i) => i.id === selection.instructorId);
  const slot = { startUtc: selection.start!, endUtc: selection.end! };

  const [bookingFor, setBookingFor] = useState<'self' | 'child'>('self');
  const [learnerName, setLearnerName] = useState('');
  const [contactName, setContactName] = useState(existing?.fullName ?? '');
  const [email, setEmail] = useState(existing?.email ?? '');
  const [level, setLevel] = useState<ChineseLevel | ''>('');
  const [goal, setGoal] = useState<LearningGoal | ''>('');
  const [notes, setNotes] = useState('');
  const [guardianConsent, setGuardianConsent] = useState(false);
  const currencies = configuredCurrencies(course);
  const [currency, setCurrency] = useState<CurrencyCode>(currencies[0]);
  const [touched, setTouched] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const errors = useMemo(
    () => validateLearnerDetails({ bookingFor, learnerName, contactName, email, level, goal, guardianConsent }),
    [bookingFor, learnerName, contactName, email, level, goal, guardianConsent],
  );
  const shown = touched ? errors : {};
  const isCredit = selection.mode === 'credit';

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (hasValidationErrors(errors) || !level || !goal || !instructor) return;

    const result = startCheckout({
      courseId: course.id,
      instructorId: instructor.id,
      slot,
      contact: { fullName: contactName.trim(), email: email.trim() },
      learner: {
        name: bookingFor === 'child' ? learnerName.trim() : contactName.trim(),
        bookedByGuardian: bookingFor === 'child',
        level,
        goal,
      },
      notes,
      mode: isCredit ? 'package_credit' : 'paid',
      balanceId: selection.balanceId,
      currency,
    });
    if (result.ok) navigate(`/book/checkout/${result.bookingId}`);
    else setSubmitError(result.reason);
  };

  const describedBy = (field: keyof typeof errors) => (shown[field] ? `${field}-error` : undefined);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0">
        <h1 className="font-serif text-2xl font-medium tracking-tight text-co-ink sm:text-3xl">Tell us about the learner</h1>
        <p className="mt-2 text-sm text-co-muted">A few details help your instructor prepare. It only takes a minute.</p>

        <Card className="mt-6">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <fieldset>
              <legend className="text-xs font-medium text-co-muted">Who is this lesson for?</legend>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {(
                  [
                    ['self', 'Myself'],
                    ['child', "My child (I'm the parent or guardian)"],
                  ] as const
                ).map(([value, label]) => (
                  <label
                    key={value}
                    className={`cursor-pointer rounded-co-sm border px-3 py-2.5 text-sm transition-colors ${
                      bookingFor === value ? 'border-co-orange-dark bg-co-pale/40 text-co-orange-dark' : 'border-co-line text-co-ink'
                    }`}
                  >
                    <input
                      type="radio"
                      name="bookingFor"
                      value={value}
                      checked={bookingFor === value}
                      onChange={() => setBookingFor(value)}
                      className="sr-only"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>

            {bookingFor === 'child' && (
              <div>
                <label htmlFor="learnerName" className="text-xs font-medium text-co-muted">
                  Learner's first name or nickname
                </label>
                <input
                  id="learnerName"
                  value={learnerName}
                  onChange={(e) => setLearnerName(e.target.value)}
                  aria-invalid={!!shown.learnerName}
                  aria-describedby={describedBy('learnerName')}
                  className={`${inputClass} mt-1 w-full`}
                />
                <p className="mt-1 text-xs text-co-muted">We only need what the instructor will call them — no other details about your child.</p>
                <FieldError id="learnerName-error" message={shown.learnerName} />
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="contactName" className="text-xs font-medium text-co-muted">
                  {bookingFor === 'child' ? 'Parent or guardian name' : 'Full name'}
                </label>
                <input
                  id="contactName"
                  autoComplete="name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  aria-invalid={!!shown.contactName}
                  aria-describedby={describedBy('contactName')}
                  className={`${inputClass} mt-1 w-full`}
                />
                <FieldError id="contactName-error" message={shown.contactName} />
              </div>
              <div>
                <label htmlFor="email" className="text-xs font-medium text-co-muted">
                  {bookingFor === 'child' ? 'Parent or guardian email' : 'Email'}
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!shown.email}
                  aria-describedby={describedBy('email')}
                  className={`${inputClass} mt-1 w-full`}
                />
                <FieldError id="email-error" message={shown.email} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="level" className="text-xs font-medium text-co-muted">
                  Current Chinese level
                </label>
                <Select
                  id="level"
                  variant="field"
                  value={level}
                  onChange={(e) => setLevel(e.target.value as ChineseLevel)}
                  aria-invalid={!!shown.level}
                  aria-describedby={describedBy('level')}
                  wrapperClassName="mt-1 w-full"
                >
                  <option value="" disabled>
                    Choose a level
                  </option>
                  {chineseLevelOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
                <FieldError id="level-error" message={shown.level} />
              </div>
              <div>
                <label htmlFor="goal" className="text-xs font-medium text-co-muted">
                  Primary learning goal
                </label>
                <Select
                  id="goal"
                  variant="field"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value as LearningGoal)}
                  aria-invalid={!!shown.goal}
                  aria-describedby={describedBy('goal')}
                  wrapperClassName="mt-1 w-full"
                >
                  <option value="" disabled>
                    Choose a goal
                  </option>
                  {learningGoalOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
                <FieldError id="goal-error" message={shown.goal} />
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="text-xs font-medium text-co-muted">
                Notes for the instructor (optional)
              </label>
              <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={`${inputClass} mt-1 w-full`} />
            </div>

            {!isCredit && currencies.length > 1 && (
              <fieldset>
                <legend className="text-xs font-medium text-co-muted">Pay in</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {currencies.map((c) => (
                    <label
                      key={c}
                      className={`cursor-pointer rounded-full border px-4 py-2 text-sm transition-colors ${
                        currency === c ? 'border-co-orange-dark bg-co-pale/40 text-co-orange-dark' : 'border-co-line text-co-ink'
                      }`}
                    >
                      <input type="radio" name="currency" value={c} checked={currency === c} onChange={() => setCurrency(c)} className="sr-only" />
                      {formatMoney(coursePrice(course, c)!)}
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-xs text-co-muted">
                  Each currency has its own configured demo price; nothing is converted. WeChat Pay and Alipay demos are offered for CNY.
                </p>
              </fieldset>
            )}

            {bookingFor === 'child' && (
              <div>
                <label className="flex items-start gap-2 text-sm text-co-ink">
                  <input
                    type="checkbox"
                    checked={guardianConsent}
                    onChange={(e) => setGuardianConsent(e.target.checked)}
                    aria-describedby={describedBy('guardianConsent')}
                    className="mt-0.5 h-4 w-4"
                  />
                  I am this learner's parent or legal guardian, and I'm booking on their behalf.
                </label>
                <FieldError id="guardianConsent-error" message={shown.guardianConsent} />
              </div>
            )}

            <p className="rounded-co-sm bg-co-bg px-3 py-2 text-xs text-co-muted">
              Next, we'll hold this time for {bookingPolicy.holdMinutes} minutes while you {isCredit ? 'confirm with your credit' : 'complete a simulated payment'}.
            </p>

            {submitError && (
              <p role="alert" className="text-sm text-red-700">
                {submitError}
              </p>
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <Button type="button" variant="ghost" onClick={onBack}>
                Back to times
              </Button>
              <Button type="submit" variant="primary">
                {isCredit ? 'Continue to confirm' : 'Continue to payment'}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      <aside className="lg:sticky lg:top-6 lg:h-fit">
        <SelectedCourseSummary course={course} selection={selection} instructor={instructor} slot={slot} />
      </aside>
    </div>
  );
}
