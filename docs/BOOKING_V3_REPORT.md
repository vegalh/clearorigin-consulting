# ClearOrigin — Booking Platform V3: Completion Report

This report records what shipped on `feature/booking-checkout-v3`. Read it
alongside [BOOKING_V3_PLAN.md](./BOOKING_V3_PLAN.md), which has the
architecture and state-model rationale. Nothing here has been pushed, merged,
or deployed.

> **Still a prototype.** Courses, prices, instructors, policies, payments and
> meeting links are fictional or simulated, live only in this browser's
> `localStorage`, and are labeled as such in the UI.

## 1. Features completed

| Area | What shipped |
| ---- | ------------ |
| **Home** | New hero ("Make Chinese part of your everyday conversations.") with *Book a Trial Lesson* / *Explore Courses*; Listen & Notice → Talk & Respond → Refine & Reuse; "Who we teach" with five learner groups; instructor previews; trial-lesson entry with price. Copy lives in `src/config/siteContent.ts` and is marked *Proposed*. |
| **Courses & Pricing** (`/courses`) | Trial, single lessons (30/45/60 min), and 5- and 10-lesson packages, each with duration, demo price per configured currency (USD + CNY, never converted), per-lesson price for packages, suitable learners, inclusions, validity and draft terms. |
| **Instructors** | Profiles with Chinese name, qualifications (education, certifications, credentials, years teaching, experience), teaching approach (philosophy, methods, learner groups), a responsive 16:9 intro-video container (never autoplays; labeled placeholder when no video is set), illustrated placeholder portraits (real photos only via `photoUrl`), and per-course quick booking. The directory adds a learner-group filter. All profiles are labeled as demo data. |
| **Booking flow** (`/book`) | Course → Schedule → Details → Payment → Confirmation, with a progress indicator (a compact "Step 3 of 5" bar on phones). Only compatible instructors are shown. Times appear in the viewer's timezone. Step state lives in the URL, so refresh and back always work. On phones, a sticky bar keeps "Continue" within reach. |
| **Learner details** | Required name, email, Chinese level (6 options) and primary goal, plus optional notes. A parent/guardian mode collects only the child's first name or nickname, takes contact details from the guardian, and requires a guardian confirmation. Currency choice appears only when more than one is configured. |
| **Temporary holds** | Submitting Details places a 10-minute hold (configurable in `src/config/bookingPolicy.ts`) with a countdown. The hold blocks the slot in the engine and is released on expiry or when the student cancels checkout. One active checkout per student; no overlapping reservations. |
| **Simulated payment** | Demo methods: Card, WeChat Pay and Alipay (WeChat Pay and Alipay only for CNY). A clearly labeled *demo outcome* control: success, failure, cancel, timeout. No card numbers, passwords, QR codes or credentials are collected. Failures keep the booking unconfirmed and allow retries while the hold lasts. A late success after expiry is recorded but not confirmed, and is flagged `refund_pending`. |
| **Package credits** | Buying a package books its first lesson; on payment, the balance is created and one credit consumed. "Book with a credit" skips payment. Credits are consumed only on confirmation, idempotently per booking. Cancelling with enough notice restores the credit; a late cancellation forfeits it. Expired balances can't be redeemed. |
| **Confirmation** | Booking reference, course, instructor, date/time + timezone, learner, meeting platform, meeting-link status ("Link not created (demo)"), payment status, method and amount, remaining credits, and an `.ics` download (now including course title and platform). |
| **My Learning Space** | Upcoming / Past / Cancelled tabs. Each row shows course, instructor, date, timezone, duration, a payment-status pill and a meeting-link pill. Also: a package-credit summary (total / used / remaining / expiry), a "Resume checkout" banner, reschedule with deadline and same-length check, and cancellation that previews the applicable draft policy before confirming and keeps the record. |
| **Teaching Studio** | Stats (today, upcoming, in checkout, needs attention). Each appointment shows the learner (and guardian), course, and separate **Booking** / **Payment** / **Meeting** pills — no payment method or provider details. Also: recent cancellations with refund status, a weekly availability summary, and a meeting-platform setting (Zoom / Google Meet) on the Availability page. |
| **FAQ** (`/faq`) | Lessons, Scheduling, Payments, and Cancellations & Refunds, as accessible `<details>` items. Draft answers carry a "Needs ClearOrigin confirmation" label. Content lives in `src/config/faq.ts`. |
| **Data & migration** | Schema v2 adds courses, orders, payments, package balances, meeting configurations, and V3 booking fields. v1 data migrates in place: every booking is kept (as `legacy`), and the original is backed up first. Unreadable data is backed up before reseeding. Tabs stay in sync via the `storage` event. |

## 2. Architecture summary

- **Engine preserved.** `src/lib/scheduling` is unchanged apart from one rule:
  active holds now block slots just like confirmed bookings (`blocking.ts`).
  Existing engine tests are untouched and still pass.
- **State machine.** `src/lib/checkout/stateMachine.ts` defines every legal
  booking, order and payment transition. All mutations go through
  `assertTransition`.
- **Checkout service.** `src/services/checkoutService.ts` holds pure functions
  (`data + input + now → data`): `startCheckout`, `beginPayment`,
  `applyPaymentResult`, `confirmWithCredit`, `cancelCheckout`,
  `cancelConfirmedBooking`, `rescheduleConfirmedBooking`, `sweep`, and
  `reconcileOrphanedPayments`.
- **Payments.** A `PaymentProvider` interface (`src/services/payments/`) with
  one implementation, `mockPaymentProvider`. Method/currency availability is
  configuration.
- **Status display.** `src/lib/checkout/status.ts` derives booking, payment and
  meeting labels separately; payment labels never expose method or provider
  references, so they're safe for instructors.
- **State.** `AppDataContext` commits through a ref, so async payment results
  never act on stale data. It also sweeps expired holds every 5 s,
  reconciles orphaned payments on boot, and follows other tabs.

## 3. Files changed

**New**
- Docs: `docs/BOOKING_V3_PLAN.md`, `docs/BOOKING_V3_REPORT.md`
- Config: `src/config/{bookingPolicy,faq,learnerOptions,siteContent}.ts`
- Data: `src/data/courses.ts`
- Checkout core: `src/lib/checkout/{stateMachine,money,credits,accessors,status,index}.ts`, `src/lib/scheduling/blocking.ts`
- Services: `src/services/checkoutService.ts`, `src/services/migrations.ts`, `src/services/payments/{types,methods,mockPaymentProvider}.ts`
- Components: `src/components/booking/{BookingProgress,bookingSteps,CourseCard,HoldCountdown}.tsx|ts`, `src/components/ui/Portrait.tsx`, `src/hooks/useNow.ts`
- Pages: `src/pages/Courses/`, `src/pages/Book/` (BookPage, CourseStep, ScheduleStep, DetailsStep, SelectedCourseSummary), `src/pages/Checkout/`, `src/pages/Faq/`, `src/pages/InstructorAvailability/MeetingSettings.tsx`
- Tests: `src/services/checkoutService.test.ts`, `src/services/migrations.test.ts`, `src/lib/checkout/stateMachine.test.ts`, `src/lib/validation/booking.test.ts`, `e2e/checkout.spec.ts`, `e2e/helpers.ts`

**Modified**
- `src/types/index.ts` (schema v2), `src/data/{instructors,sessionTypes,seed}.ts`
- `src/services/storageService.ts`, `src/state/AppDataContext.tsx`
- `src/lib/scheduling/{availability,validate,index}.ts` (hold-aware slot blocking)
- `src/lib/validation/booking.ts`, `src/lib/ics.ts`
- `src/App.tsx` (new routes; `/booking/confirm` redirects into `/book`), `src/components/layout/{Header,Footer}.tsx`, `src/components/ui/Badge.tsx`
- Pages: Home, Instructors, InstructorProfile, BookingSuccess, MyBookings (+ BookingRow), InstructorDashboard, InstructorAvailability
- E2E: `student-booking`, `my-bookings`, `instructor-availability`, `reset-and-responsive`

**Removed**
- `src/pages/BookingConfirmation/BookingConfirmationPage.tsx` (replaced by the Details + Payment steps; its route now redirects)

## 4. Tests executed and results

| Command | Result |
| ------- | ------ |
| `npm run typecheck` | ✅ passes |
| `npm run lint` | ✅ 0 errors, 1 warning (the existing `only-export-components` note on `AppDataContext.tsx`). The three v1 impure-render warnings were removed by moving "now" into `useNow`. |
| `npm run test` | ✅ **89 passed** (7 files). The original 27 still pass, and the engine tests are unmodified. |
| `npm run test:e2e` | ✅ **60 passed** (30 specs × desktop Chromium + Pixel 7) |
| `npm run build` | ✅ passes |

New unit coverage: course/instructor compatibility, duration mismatch,
configured prices without conversion, and hold creation, blocking, expiry,
release and configurable duration. Also: one checkout per student,
overlapping reservations, and payment success / failure / cancel / timeout
with retry. Also covered: unpaid-confirmation prevention, duplicate-charge
prevention, idempotent results (no double confirmation), and late payment
after expiry. Also covered: orphaned-payment reconciliation after reload,
package purchase, credit consumption (once only, never on expiry), credit
restoration / forfeit, and refund review vs. no refund. Finally: refund
status kept separate from cancellation, the reschedule deadline and
same-length rule, auto-completion, state-machine tables, catalog integrity,
guardian validation, v1 → v2 migration, and corrupt-data backup.

New E2E coverage: trial booking to confirmation, the profile-based flow,
details validation, and the learner filter. Also covered: failed payment then
retry, cancelling checkout, refresh during checkout, refresh during
processing, hold expiry (Playwright clock), and the guardian flow with the
instructor view. Also covered: CNY with WeChat Pay demo, package purchase then
credit redemption, a held slot hidden from others, the courses page, FAQ, and
the meeting-platform setting. Finally: no horizontal overflow on 10 routes at
320 / 375 / 390 / 430 / 768 / 1024 / 1440 px. Every spec also runs on the
Pixel 7 mobile project.

Existing E2E specs were updated only where the product changed by
requirement: new hero copy, course names, "Teaching Studio", and the
policy-preview cancellation replacing `window.confirm`. Their assertions were
kept or strengthened.

## 5. Known limitations

- **Browser-only holds.** Holds protect a slot only within one browser profile
  (tabs included). They do **not** stop another person on another device from
  booking the same time. They are not real inventory protection.
- **Simulated payments.** The client decides the payment outcome. There is no
  provider, webhook, or server verification, and refunds are only status
  labels.
- **No real meetings.** Meeting links are never created. Links stay in
  "Link not created (demo)", and `needs_attention` exists in the model but
  nothing triggers it.
- **Single demo student.** The Details form updates the one demo contact record
  (`student-alex`), so the name shown in My Learning Space follows the last
  booking. There is no auth.
- **Draft content.** Prices, course formats, learner groups, FAQ answers,
  hero copy and the cancellation/refund policy are proposals awaiting
  ClearOrigin approval.
- **Instructors are fictional**, with illustrated placeholder portraits and no
  intro videos.
- **Reschedule scope.** Rescheduling stays with the same instructor and lesson
  length, so price differences cannot arise. Changing course means a new
  booking.
- **Time-based sweeps** run only while a page is open, and on load.

## 6. Recommended production integration

1. **Backend of record.** Run the same transitions from
   `checkoutService.ts` server-side, for example on Postgres. Keep `bookings`,
   `orders`, `payments` and `credit_redemptions` tables with status columns
   guarded by the same transition table.
2. **Server-authoritative holds.** Store a hold row with `expires_at`, plus an
   exclusion constraint on (instructor, `tstzrange`) for rows that are active
   (`confirmed`, or `held` / `pending_payment` with `expires_at > now()`).
   Make `held → pending_payment → confirmed` atomic, and run a scheduled
   expiry job.
3. **Payments.** The server creates the payment session: Stripe Checkout for
   international cards, and WeChat Pay / Alipay only where ClearOrigin's
   merchant entity is eligible. Confirm only from a **verified webhook**, with
   the idempotency key `order_id:attempt`. Reconcile late webhooks the way the
   prototype does (flag the order `refund_pending`; never auto-confirm an
   expired hold). Record refunds explicitly.
4. **Meetings.** After confirmation, a job creates the Zoom or Google Meet
   meeting from the instructor's configured provider (credentials and OAuth
   tokens stay server-side), stores the URL, and sends notifications and an
   updated `.ics`. On failure, keep the paid booking, set `needs_attention`,
   and retry or alert an admin. Never re-charge.
5. **Identity.** Use real student and guardian accounts. Minors' data stays
   minimal (first name only), with guardian consent stored server-side.
6. **Content.** Move `src/config/*` and the catalog to a CMS or admin panel,
   and flip `status` to `confirmed` as ClearOrigin approves each item.

## 7. Local preview

```bash
npm install
npm run dev          # http://localhost:5173
```

Things to try:
- **Book a Trial Lesson** on Home → pick Maya → a time → details → choose a
  *Demo outcome* at checkout.
- **Courses & Pricing** → *Choose 5-Lesson Package*, then **My Learning Space**
  → *Book with a credit*.
- At checkout, try *Payment fails* and retry, *Cancel and release this time*,
  reloading the page, or waiting out the hold.
- Switch the header toggle to **Instructor** → **Teaching Studio** for
  booking/payment status, and **Availability** → *Meeting platform*.
- The footer's **Reset demo data** restores the seed at any time.

## 8. Update: separate accounts and a Chinese version

**Accounts (`/login`, `/account`)**
- Students and instructors sign in separately; the header's Student/Instructor
  toggle and "Acting as" picker are gone.
- Students sign in or register with an email. Instructors must use the email
  on their pre-provisioned instructor account (`…@instructors.example.com` in
  the demo). One-click demo accounts stand in until email verification exists.
  There is no password, and accounts are labeled "Not verified".
- Signing in returns you to the page you were trying to reach.
  `RequireRole` keeps `/bookings`, checkout and confirmation student-only, and
  `/instructor/*` instructor-only. The wrong role sees an explanation and
  "Sign out and switch account".
- Account settings: students edit name and email (kept unique); instructors
  see their ClearOrigin-managed details plus the meeting-platform setting.
  Both can change display language and timezone, and sign out.
- Guest checkout: a signed-out visitor who books is signed into the student
  account for the email they entered (found or created). Instructor accounts
  cannot book.
- Checkout and confirmation pages only open for the student who owns the
  booking.
- Schema v3 adds instructor sign-in emails. v2 data migrates in place,
  refreshing instructor profiles and keeping everything else, with a backup.
  The session is stored separately and synced across tabs.

**Chinese / English (`src/i18n/`)**
- An EN | 中文 switch in the header, plus a display-language setting. The
  choice is remembered per device; `?lang=zh` links work. It defaults to the
  browser language, and `<html lang>` is set to `zh-CN` or `en`.
- `en.ts` defines every UI string. `zh.ts` is typed against it, so a missing
  key fails the build. Course, instructor, FAQ, home-page, learner-option and
  payment-method copy are translated through overlays in `zhContent.ts`, while
  the persisted data stays English at the source.
- Dates and times use Chinese formats (`11月5日 星期四`, 24-hour times,
  `周四` in the day picker). Service error messages are translated by lookup.
  A unit test fails if any fixed service message lacks a translation.
- Not translated: the `.ics` calendar text, the demo data's own names, and
  timezone names (IANA identifiers).
- The Chinese is a prototype translation in Simplified Chinese. It needs
  review by a native speaker at ClearOrigin before launch.

**Tests:** 100 unit (+11: account service, v2→v3 migration, translation
completeness and service-message coverage) and 94 e2e (+17 across both
projects: sign-in redirects, registration, instructor email sign-in, role
separation, account settings, guest checkout, instructor can't book, a
Chinese language switch, a full Chinese booking, and translated content).
The overflow check now runs in both languages at all seven widths, signed out
and signed in as each role.

**Production next steps:** real authentication with email verification
(magic link or one-time code) and server-side sessions; instructor
provisioning and roles enforced by the API; translations moved into a CMS or
translation workflow, with a professional review of the Chinese copy.
