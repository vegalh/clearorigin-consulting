import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type {
  AppData,
  AvailabilityException,
  Booking,
  DemoRole,
  Instructor,
  MeetingProvider,
  RecurringAvailability,
  SessionType,
  Student,
  TimeSlot,
} from '@/types';
import { storageService } from '@/services/storageService';
import { createBooking, cancelExistingBooking, rescheduleExistingBooking } from '@/services/bookingService';
import type { BookingOutcome } from '@/services/types';
import { browserTimezone } from '@/lib/dates/format';

export interface AppDataContextValue {
  data: AppData;
  /** "Prototype Mode" role switcher — explicitly non-secure, demo-only (see plan doc §9). */
  role: DemoRole;
  setRole: (role: DemoRole) => void;
  /** The demo student whose bookings "My Bookings" shows. */
  currentStudentId: string;
  setCurrentStudentId: (studentId: string) => void;
  /** The instructor the "Instructor Mode" pages act as. */
  currentInstructorId: string;
  setCurrentInstructorId: (instructorId: string) => void;
  /** Timezone the student-facing views render times in (defaults to the browser's). */
  viewerTimezone: string;
  setViewerTimezone: (timezone: string) => void;

  bookSession: (args: {
    instructor: Instructor;
    sessionType: SessionType;
    slot: TimeSlot;
    studentId: string;
    meetingProvider: MeetingProvider;
    studentNotes?: string;
  }) => BookingOutcome;
  cancelBooking: (bookingId: string) => BookingOutcome;
  rescheduleBooking: (bookingId: string, newSlot: TimeSlot) => BookingOutcome;
  /** Create or update the demo student record (used by the booking form so instructor views show real-looking names). */
  upsertStudent: (student: Student) => void;
  replaceRecurringAvailability: (instructorId: string, rules: RecurringAvailability[]) => void;
  addAvailabilityException: (exception: AvailabilityException) => void;
  removeAvailabilityException: (exceptionId: string) => void;
  resetDemoData: () => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => storageService.load());
  const [role, setRole] = useState<DemoRole>('student');
  const [currentStudentId, setCurrentStudentId] = useState('student-alex');
  const [currentInstructorId, setCurrentInstructorId] = useState('maya-chen');
  const [viewerTimezone, setViewerTimezone] = useState<string>(() => browserTimezone());

  const persist = useCallback((next: AppData) => {
    storageService.save(next);
    setData(next);
  }, []);

  const bookSession = useCallback<AppDataContextValue['bookSession']>(
    (args) => {
      const outcome = createBooking(data, args);
      if (outcome.ok) {
        persist({ ...data, bookings: [...data.bookings, outcome.booking] });
      }
      return outcome;
    },
    [data, persist],
  );

  const cancelBooking = useCallback<AppDataContextValue['cancelBooking']>(
    (bookingId) => {
      const outcome = cancelExistingBooking(data, bookingId);
      if (outcome.ok) {
        persist({
          ...data,
          bookings: data.bookings.map((b: Booking) => (b.id === outcome.booking.id ? outcome.booking : b)),
        });
      }
      return outcome;
    },
    [data, persist],
  );

  const rescheduleBooking = useCallback<AppDataContextValue['rescheduleBooking']>(
    (bookingId, newSlot) => {
      const outcome = rescheduleExistingBooking(data, bookingId, newSlot);
      if (outcome.ok) {
        persist({
          ...data,
          bookings: data.bookings.map((b: Booking) => (b.id === outcome.booking.id ? outcome.booking : b)),
        });
      }
      return outcome;
    },
    [data, persist],
  );

  const upsertStudent = useCallback(
    (student: Student) => {
      const exists = data.students.some((s) => s.id === student.id);
      const students = exists
        ? data.students.map((s) => (s.id === student.id ? student : s))
        : [...data.students, student];
      persist({ ...data, students });
    },
    [data, persist],
  );

  const replaceRecurringAvailability = useCallback(
    (instructorId: string, rules: RecurringAvailability[]) => {
      const others = data.recurringAvailability.filter((r) => r.instructorId !== instructorId);
      persist({ ...data, recurringAvailability: [...others, ...rules] });
    },
    [data, persist],
  );

  const addAvailabilityException = useCallback(
    (exception: AvailabilityException) => {
      persist({ ...data, availabilityExceptions: [...data.availabilityExceptions, exception] });
    },
    [data, persist],
  );

  const removeAvailabilityException = useCallback(
    (exceptionId: string) => {
      persist({
        ...data,
        availabilityExceptions: data.availabilityExceptions.filter((e) => e.id !== exceptionId),
      });
    },
    [data, persist],
  );

  const resetDemoData = useCallback(() => {
    persist(storageService.reset());
  }, [persist]);

  const value = useMemo<AppDataContextValue>(
    () => ({
      data,
      role,
      setRole,
      currentStudentId,
      setCurrentStudentId,
      currentInstructorId,
      setCurrentInstructorId,
      viewerTimezone,
      setViewerTimezone,
      bookSession,
      cancelBooking,
      rescheduleBooking,
      upsertStudent,
      replaceRecurringAvailability,
      addAvailabilityException,
      removeAvailabilityException,
      resetDemoData,
    }),
    [
      data,
      role,
      currentStudentId,
      currentInstructorId,
      viewerTimezone,
      bookSession,
      cancelBooking,
      rescheduleBooking,
      upsertStudent,
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
