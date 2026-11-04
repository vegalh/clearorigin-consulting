/**
 * Core data model for the ClearOrigin booking prototype.
 *
 * All persisted records are demo/local data (see storageService). Nothing
 * here represents verified ClearOrigin staff, services, or pricing — see
 * docs/PROTOTYPE_PLAN.md and docs/BOOKING_V3_PLAN.md for the research notes,
 * state model and disclaimers.
 */

/** Bump this whenever the persisted shape changes and add a migration in services/migrations.ts. */
export const SCHEMA_VERSION = 3;

/** 0 = Sunday ... 6 = Saturday, matching `Date#getDay()`. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};

export type SessionDurationMinutes = 15 | 30 | 45 | 60;

/** A schedulable lesson format — what the booking engine actually slots (an id + a duration). */
export interface SessionType {
  id: string;
  name: string;
  durationMinutes: SessionDurationMinutes;
  description: string;
  /** Demo pricing only — v1 field, kept so legacy bookings still render. */
  demoPriceUsd?: number;
  /** v1 formats kept only so existing bookings resolve; never offered for new bookings. */
  legacy?: boolean;
}

// --- Catalog -------------------------------------------------------------------

export type CurrencyCode = 'USD' | 'CNY';

/** Amounts are integer minor units (cents / fen) to avoid float rounding. */
export interface Money {
  amountMinor: number;
  currency: CurrencyCode;
}

export type CourseCategory = 'trial' | 'single' | 'package';

export type LearnerGroupId = 'young_learners' | 'teenagers' | 'adult_beginners' | 'heritage' | 'conversational';

/** Marks marketing/policy content that ClearOrigin has not yet approved. */
export type ContentStatus = 'proposed' | 'confirmed';

export interface Course {
  id: string;
  category: CourseCategory;
  title: string;
  description: string;
  /** Lesson length. For packages this is the length of each included lesson. */
  durationMinutes: SessionDurationMinutes;
  /** The schedulable session type this course books (for packages: the first/each lesson). */
  sessionTypeId: string;
  /** Configured prices per currency. Only configured currencies are offered — never converted. */
  prices: Partial<Record<CurrencyCode, number>>;
  suitableFor: LearnerGroupId[];
  includes: string[];
  /** Package-only fields. */
  sessionCount?: number;
  validityDays?: number;
  terms?: string[];
  /** Package-only: which single-lesson courses one credit can book. */
  redeemsCourseIds?: string[];
  status: ContentStatus;
}

// --- People --------------------------------------------------------------------

export interface InstructorQualifications {
  education: string[];
  certifications: string[];
  credentials: string[];
  yearsTeaching: number;
  experience: string[];
}

export interface InstructorApproach {
  philosophy: string;
  methods: string[];
  learnerGroups: LearnerGroupId[];
}

export interface Instructor {
  id: string;
  name: string;
  /** Sign-in email for the instructor account (accounts are created by ClearOrigin, not self-registered). */
  email?: string;
  /** Optional Chinese name shown alongside the romanized one. */
  chineseName?: string;
  title: string;
  /** Initials for the illustrated placeholder portrait (no stock photos are used). */
  avatarInitials: string;
  avatarColorClass: string;
  /** Real photograph URL — only set for verified instructors. */
  photoUrl?: string;
  /** Optional intro video (never autoplayed). Unset → a labeled placeholder is shown. */
  introVideoUrl?: string;
  languages: string[];
  specialties: string[];
  bio: string;
  /** V3 profile content — optional so v1-shaped records stay valid. */
  qualifications?: InstructorQualifications;
  approach?: InstructorApproach;
  /** IANA timezone the instructor's recurring schedule is defined in. */
  timezone: string;
  /** Courses this instructor teaches (Instructor → teaches → Course). */
  courseIds?: string[];
  /** v1 field: session types offered on the profile's quick-availability picker. */
  sessionTypeIds: string[];
  isDemo: true;
}

export interface RecurringAvailability {
  id: string;
  instructorId: string;
  dayOfWeek: Weekday;
  /** Local wall-clock time in the instructor's timezone, "HH:mm". */
  startTime: string;
  endTime: string;
}

export type AvailabilityExceptionType = 'blocked_day' | 'extra_hours' | 'blocked_range';

export interface AvailabilityException {
  id: string;
  instructorId: string;
  /** Calendar date in the instructor's timezone, "yyyy-MM-dd". */
  date: string;
  type: AvailabilityExceptionType;
  /** Required for 'extra_hours' and 'blocked_range'. */
  startTime?: string;
  endTime?: string;
  note?: string;
}

/** The account holder / contact (for a child, the parent or guardian). */
export interface Student {
  id: string;
  fullName: string;
  email: string;
}

export type ChineseLevel = 'complete_beginner' | 'beginner' | 'intermediate' | 'advanced' | 'heritage' | 'not_sure';

export type LearningGoal =
  | 'everyday_conversation'
  | 'pronunciation'
  | 'reading_writing'
  | 'school_support'
  | 'heritage_connection'
  | 'travel'
  | 'business'
  | 'exam_prep'
  | 'other';

/**
 * Who the lesson is for. When `bookedByGuardian` is true the contact details
 * live on the Student (the guardian); for the child we keep only a first name
 * or nickname — no age, email, or other personal data.
 */
export interface LearnerProfile {
  name: string;
  bookedByGuardian: boolean;
  level: ChineseLevel;
  goal: LearningGoal;
}

// --- Bookings, orders & payments --------------------------------------------------

/**
 * Booking lifecycle. `available` is a slot property computed by the engine and
 * is never stored. Allowed transitions live in lib/checkout/stateMachine.ts.
 */
export type BookingStatus = 'held' | 'pending_payment' | 'confirmed' | 'cancelled' | 'expired' | 'completed';
export type MeetingProvider = 'zoom' | 'google_meet';

export type MeetingLinkStatus = 'awaiting_confirmation' | 'pending_creation' | 'created' | 'needs_attention';

export interface BookingMeeting {
  provider: MeetingProvider;
  status: MeetingLinkStatus;
  /** Always null in the prototype — no real meeting is ever created. */
  url: string | null;
}

/** How a booking is covered: paid order, package credit, or recorded before V3 payments existed. */
export type PaymentMode = 'paid' | 'package_credit' | 'legacy';

export type ReleaseReason = 'hold_expired' | 'checkout_cancelled';

export interface Booking {
  id: string;
  instructorId: string;
  studentId: string;
  sessionTypeId: string;
  /** Product purchased/used. Undefined for v1 (legacy) bookings. */
  courseId?: string;
  /** ISO 8601 UTC instants — the only source of truth for booked time. */
  startAtUtc: string;
  endAtUtc: string;
  status: BookingStatus;
  /** v1 field, mirrored by `meeting.provider`. */
  meetingProvider: MeetingProvider;
  /** v1 field — always null. */
  meetingUrl: string | null;
  /** V3 meeting lifecycle; absent on v1 records (see lib/checkout/accessors). */
  meeting?: BookingMeeting;
  learner?: LearnerProfile;
  studentNotes?: string;
  /** Absent on v1 records, which are treated as 'legacy'. */
  paymentMode?: PaymentMode;
  orderId?: string;
  packageBalanceId?: string;
  /** Set while held / pending payment. */
  holdExpiresAt?: string;
  releaseReason?: ReleaseReason;
  /** First time the booking became confirmed — distinguishes real cancellations from abandoned checkouts. */
  confirmedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 'pending' | 'paid' | 'expired' | 'cancelled' | 'refund_pending' | 'refunded' | 'not_required';

export interface Order {
  id: string;
  /** Short human-facing reference, e.g. "CO-7F3K2Q". */
  reference: string;
  studentId: string;
  courseId: string;
  bookingId: string;
  kind: 'lesson' | 'package';
  amount: Money;
  status: OrderStatus;
  /** Number of payment attempts started; feeds idempotency keys. */
  attemptCount: number;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethodId = 'card_demo' | 'wechat_pay_demo' | 'alipay_demo';
export type PaymentStatus = 'processing' | 'succeeded' | 'failed' | 'cancelled' | 'timed_out';

export interface Payment {
  id: string;
  orderId: string;
  method: PaymentMethodId;
  amount: Money;
  status: PaymentStatus;
  /** `${orderId}:${attempt}` — a second attempt with the same key is rejected. */
  idempotencyKey: string;
  /** Fake provider reference ("demo_…"); never a real transaction id. */
  providerRef: string;
  simulated: true;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreditRedemptionStatus = 'consumed' | 'restored' | 'forfeited';

export interface CreditRedemption {
  bookingId: string;
  status: CreditRedemptionStatus;
  at: string;
}

export interface PackageCreditBalance {
  id: string;
  studentId: string;
  packageCourseId: string;
  orderId: string;
  totalCredits: number;
  redemptions: CreditRedemption[];
  purchasedAt: string;
  expiresAt?: string;
}

export interface MeetingConfiguration {
  instructorId: string;
  provider: MeetingProvider;
}

/** A single bookable start time, already resolved to UTC. */
export interface TimeSlot {
  startUtc: string;
  endUtc: string;
}

export interface AppData {
  schemaVersion: number;
  instructors: Instructor[];
  sessionTypes: SessionType[];
  courses: Course[];
  recurringAvailability: RecurringAvailability[];
  availabilityExceptions: AvailabilityException[];
  bookings: Booking[];
  students: Student[];
  orders: Order[];
  payments: Payment[];
  packageBalances: PackageCreditBalance[];
  meetingConfigurations: MeetingConfiguration[];
}

export type DemoRole = 'student' | 'instructor';

/**
 * Who is signed in. Prototype sign-in is email-only (no password, no
 * verification yet), so this is a convenience, not a security boundary.
 */
export interface Session {
  role: DemoRole;
  userId: string;
}
