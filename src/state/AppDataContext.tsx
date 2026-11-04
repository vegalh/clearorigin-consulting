import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type {
  AppData,
  AvailabilityException,
  Booking,
  DemoRole,
  Instructor,
  MeetingProvider,
  PaymentMethodId,
  RecurringAvailability,
  Session,
  SessionType,
  Student,
  TimeSlot,
} from '@/types';
import { findInstructorByEmail, signInOrRegisterStudent, updateStudentProfile } from '@/services/accountService';
import { STORAGE_KEY, storageService } from '@/services/storageService';
import { createBooking } from '@/services/bookingService';
import type { BookingOutcome } from '@/services/types';
import {
  applyPaymentResult,
  beginPayment,
  cancelCheckout,
  cancelConfirmedBooking,
  confirmWithCredit,
  reconcileOrphanedPayments,
  rescheduleConfirmedBooking,
  startCheckout,
  sweep,
  type CancellationOutcome,
  type CheckoutResult,
  type StartCheckoutInput,
} from '@/services/checkoutService';
import { createMockPaymentProvider } from '@/services/payments/mockPaymentProvider';
import type { SimulatedOutcome } from '@/services/payments/types';
import { browserTimezone } from '@/lib/dates/format';

/** Simulated provider round-trip. Long enough to show a "processing" state, short enough not to drag. */
const MOCK_PAYMENT_DELAY_MS = 900;
/** How often open pages release expired holds. */
const SWEEP_INTERVAL_MS = 5_000;

export type ActionResult<T extends object = object> = ({ ok: true } & T) | { ok: false; reason: string };

export interface AppDataContextValue {
  data: AppData;
  /** Signed-in account, or null. Email-only prototype sign-in — not a security boundary. */
  session: Session | null;
  role: DemoRole | null;
  /** The signed-in student (null when signed out or signed in as an instructor). */
  currentStudentId: string | null;
  /** The signed-in instructor (null otherwise). */
  currentInstructorId: string | null;
  signInStudent: (input: { email: string; fullName?: string }) => ActionResult;
  signInInstructor: (email: string) => ActionResult;
  /** One-click demo accounts, standing in until email verification exists. */
  signInAs: (role: DemoRole, userId: string) => void;
  signOut: () => void;
  updateProfile: (patch: { fullName: string; email: string }) => ActionResult;
  /** Timezone the student-facing views render times in (defaults to the browser's). */
  viewerTimezone: string;
  setViewerTimezone: (timezone: string) => void;

  /** v1 direct booking (no payment) — kept for compatibility; the V3 UI uses the checkout actions below. */
  bookSession: (args: {
    instructor: Instructor;
    sessionType: SessionType;
    slot: TimeSlot;
    studentId: string;
    meetingProvider: MeetingProvider;
    studentNotes?: string;
  }) => BookingOutcome;

  startCheckout: (input: Omit<StartCheckoutInput, 'contact'> & { contact: Omit<Student, 'id'> }) => ActionResult<{ bookingId: string }>;
  /** Runs a simulated payment end to end; resolves once the result has been applied. */
  payForBooking: (bookingId: string, method: PaymentMethodId, outcome: SimulatedOutcome) => Promise<ActionResult<{ booking: Booking }>>;
  confirmWithCredit: (bookingId: string) => ActionResult;
  cancelCheckout: (bookingId: string) => ActionResult;
  cancelBooking: (bookingId: string) => ActionResult<{ outcome: CancellationOutcome }>;
  rescheduleBooking: (bookingId: string, newSlot: TimeSlot) => ActionResult;
  setMeetingProvider: (instructorId: string, provider: MeetingProvider) => void;

  replaceRecurringAvailability: (instructorId: string, rules: RecurringAvailability[]) => void;
  addAvailabilityException: (exception: AvailabilityException) => void;
  removeAvailabilityException: (exceptionId: string) => void;
  resetDemoData: () => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export const SESSION_STORAGE_KEY = 'clearorigin-booking-prototype:session';

function loadSession(data: AppData): Session | null {
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Session;
    const exists =
      session.role === 'student'
        ? data.students.some((s) => s.id === session.userId)
        : data.instructors.some((i) => i.id === session.userId);
    return exists ? session : null;
  } catch {
    return null;
  }
}

function saveSession(session: Session | null) {
  try {
    if (session) window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    else window.localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // in-memory only
  }
}

function loadInitialData(): AppData {
  // In-flight mock payments die with the previous page, so reconcile them on boot.
  const now = new Date();
  const loaded = storageService.load();
  const reconciled = sweep(reconcileOrphanedPayments(loaded, now), now);
  if (reconciled !== loaded) storageService.save(reconciled);
  return reconciled;
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(loadInitialData);
  // Latest data for async work (payment callbacks) so it never acts on a stale render's snapshot.
  const dataRef = useRef(data);
  const [session, setSessionState] = useState<Session | null>(() => loadSession(data));
  const setSession = useCallback((next: Session | null) => {
    saveSession(next);
    setSessionState(next);
  }, []);
  const role = session?.role ?? null;
  const currentStudentId = session?.role === 'student' ? session.userId : null;
  const currentInstructorId = session?.role === 'instructor' ? session.userId : null;
  const [viewerTimezone, setViewerTimezone] = useState<string>(() => browserTimezone());

  const commit = useCallback((next: AppData) => {
    if (next === dataRef.current) return;
    dataRef.current = next;
    storageService.save(next);
    setData(next);
  }, []);

  /** Run a pure checkout operation against the latest data and persist whatever it returns. */
  const run = useCallback(
    <T extends object>(op: (current: AppData, now: Date) => CheckoutResult<T>): ActionResult<T> => {
      const result = op(dataRef.current, new Date());
      commit(result.data);
      if (!result.ok) return { ok: false, reason: result.reason };
      const { data: _data, ...rest } = result;
      return rest as { ok: true } & T;
    },
    [commit],
  );

  // Release expired holds while the app is open, and follow writes from other tabs.
  useEffect(() => {
    const timer = window.setInterval(() => commit(sweep(dataRef.current, new Date())), SWEEP_INTERVAL_MS);
    const onStorage = (event: StorageEvent) => {
      if (event.key === SESSION_STORAGE_KEY) {
        setSessionState(loadSession(dataRef.current));
        return;
      }
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      const next = storageService.load();
      dataRef.current = next;
      setData(next);
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('storage', onStorage);
    };
  }, [commit]);

  const bookSession = useCallback<AppDataContextValue['bookSession']>(
    (args) => {
      const current = dataRef.current;
      const outcome = createBooking(current, args);
      if (outcome.ok) commit({ ...current, bookings: [...current.bookings, outcome.booking] });
      return outcome;
    },
    [commit],
  );

  const signInStudent = useCallback<AppDataContextValue['signInStudent']>(
    (input) => {
      const result = signInOrRegisterStudent(dataRef.current, input);
      if (!result.ok) return result;
      commit(result.data);
      setSession({ role: 'student', userId: result.studentId });
      return { ok: true };
    },
    [commit, setSession],
  );

  const signInInstructor = useCallback<AppDataContextValue['signInInstructor']>(
    (email) => {
      const instructor = findInstructorByEmail(dataRef.current, email);
      if (!instructor) return { ok: false, reason: 'No instructor account uses that email.' };
      setSession({ role: 'instructor', userId: instructor.id });
      return { ok: true };
    },
    [setSession],
  );

  const signInAs = useCallback((nextRole: DemoRole, userId: string) => setSession({ role: nextRole, userId }), [setSession]);
  const signOut = useCallback(() => setSession(null), [setSession]);

  const updateProfile = useCallback<AppDataContextValue['updateProfile']>(
    (patch) => {
      if (!currentStudentId) return { ok: false, reason: 'Only student profiles can be edited here.' };
      const result = updateStudentProfile(dataRef.current, currentStudentId, patch);
      if (!result.ok) return result;
      commit(result.data);
      return { ok: true };
    },
    [commit, currentStudentId],
  );

  /**
   * Checkout always belongs to a student account: the signed-in student, or —
   * for a first-time visitor — the account found or created from the email
   * they entered (guest checkout signs them in).
   */
  const startCheckoutAction = useCallback<AppDataContextValue['startCheckout']>(
    (input) => {
      if (session?.role === 'instructor') return { ok: false, reason: 'Instructor accounts cannot book lessons.' };
      let studentId = currentStudentId;
      if (!studentId) {
        const account = signInOrRegisterStudent(dataRef.current, { email: input.contact.email, fullName: input.contact.fullName });
        if (!account.ok) return account;
        commit(account.data);
        studentId = account.studentId;
        setSession({ role: 'student', userId: studentId });
      }
      const id = studentId;
      return run((current, now) => startCheckout({ ...input, contact: { id, ...input.contact } }, current, now));
    },
    [run, commit, currentStudentId, session, setSession],
  );

  const payForBooking = useCallback<AppDataContextValue['payForBooking']>(
    async (bookingId, method, outcome) => {
      const started = beginPayment({ bookingId, method }, dataRef.current, new Date());
      commit(started.data);
      if (!started.ok) return { ok: false, reason: started.reason };

      const provider = createMockPaymentProvider({ outcome, delayMs: MOCK_PAYMENT_DELAY_MS });
      const result = await provider.createPayment(started.request);

      // In production this step is a verified webhook on the server, never the browser.
      const applied = applyPaymentResult({ paymentId: started.paymentId, result }, dataRef.current, new Date());
      commit(applied.data);
      if (!applied.ok) return { ok: false, reason: applied.reason };
      const booking = applied.data.bookings.find((b) => b.id === bookingId)!;
      if (booking.status !== 'confirmed') return { ok: false, reason: result.failureReason ?? 'The payment did not complete.' };
      return { ok: true, booking };
    },
    [commit],
  );

  const confirmWithCreditAction = useCallback((bookingId: string) => run((c, now) => confirmWithCredit(bookingId, c, now)), [run]);
  const cancelCheckoutAction = useCallback((bookingId: string) => run((c, now) => cancelCheckout(bookingId, c, now)), [run]);
  const cancelBooking = useCallback((bookingId: string) => run((c, now) => cancelConfirmedBooking(bookingId, c, now)), [run]);
  const rescheduleBooking = useCallback(
    (bookingId: string, newSlot: TimeSlot) => run((c, now) => rescheduleConfirmedBooking({ bookingId, newSlot }, c, now)),
    [run],
  );

  const setMeetingProvider = useCallback(
    (instructorId: string, provider: MeetingProvider) => {
      const current = dataRef.current;
      const others = current.meetingConfigurations.filter((m) => m.instructorId !== instructorId);
      commit({ ...current, meetingConfigurations: [...others, { instructorId, provider }] });
    },
    [commit],
  );

  const replaceRecurringAvailability = useCallback(
    (instructorId: string, rules: RecurringAvailability[]) => {
      const current = dataRef.current;
      const others = current.recurringAvailability.filter((r) => r.instructorId !== instructorId);
      commit({ ...current, recurringAvailability: [...others, ...rules] });
    },
    [commit],
  );

  const addAvailabilityException = useCallback(
    (exception: AvailabilityException) => {
      const current = dataRef.current;
      commit({ ...current, availabilityExceptions: [...current.availabilityExceptions, exception] });
    },
    [commit],
  );

  const removeAvailabilityException = useCallback(
    (exceptionId: string) => {
      const current = dataRef.current;
      commit({ ...current, availabilityExceptions: current.availabilityExceptions.filter((e) => e.id !== exceptionId) });
    },
    [commit],
  );

  const resetDemoData = useCallback(() => {
    commit(storageService.reset());
    setSession(null);
  }, [commit, setSession]);

  const value = useMemo<AppDataContextValue>(
    () => ({
      data,
      session,
      role,
      currentStudentId,
      currentInstructorId,
      signInStudent,
      signInInstructor,
      signInAs,
      signOut,
      updateProfile,
      viewerTimezone,
      setViewerTimezone,
      bookSession,
      startCheckout: startCheckoutAction,
      payForBooking,
      confirmWithCredit: confirmWithCreditAction,
      cancelCheckout: cancelCheckoutAction,
      cancelBooking,
      rescheduleBooking,
      setMeetingProvider,
      replaceRecurringAvailability,
      addAvailabilityException,
      removeAvailabilityException,
      resetDemoData,
    }),
    [
      data,
      session,
      role,
      currentStudentId,
      currentInstructorId,
      signInStudent,
      signInInstructor,
      signInAs,
      signOut,
      updateProfile,
      viewerTimezone,
      bookSession,
      startCheckoutAction,
      payForBooking,
      confirmWithCreditAction,
      cancelCheckoutAction,
      cancelBooking,
      rescheduleBooking,
      setMeetingProvider,
      replaceRecurringAvailability,
      addAvailabilityException,
      removeAvailabilityException,
      resetDemoData,
    ],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return ctx;
}
