# ClearOrigin — Booking Platform V3 Plan

Branch: `feature/booking-checkout-v3` (cut from `main`, which already contains
the merged warm learning redesign). This plan is the Phase 1 architecture
review; [BOOKING_V3_REPORT.md](./BOOKING_V3_REPORT.md) records what shipped.

> Everything in V3 is still a **browser-only prototype**. Payments, holds,
> package credits and meeting links are simulated in `localStorage` and are
> labeled as such everywhere they appear.

## 1. Information architecture

| Section            | Route(s)                                       | Notes |
| ------------------ | ---------------------------------------------- | ----- |
| Home               | `/`                                            | New hero, Listen / Talk / Refine philosophy, proposed learner groups, instructor previews, trial entry. |
| Courses & Pricing  | `/courses`                                     | Trial, single lessons, packages. All prices are configurable demo values. |
| Instructors        | `/instructors`, `/instructors/:id`             | Profile adds qualifications, teaching approach, intro-video container, per-course booking. |
| Book a Session     | `/book` → `/book/checkout/:bookingId` → `/booking/success/:id` | Course-first wizard. `/booking/confirm` (v1) redirects into `/book`. |
| My Learning Space  | `/bookings`                                    | Upcoming / past / cancelled, payment + meeting status, package credits, resume checkout. |
| FAQ                | `/faq`                                         | Draft answers, flagged where ClearOrigin must confirm policy. |
| Teaching Studio    | `/instructor/dashboard`, `/instructor/availability` | Booking vs payment status, meeting platform settings, weekly availability. |

Student nav: Courses · Instructors · FAQ · My Learning Space, plus a "Book a
Session" CTA. On phones the nav row scrolls horizontally inside the header
instead of overflowing the page.

All marketing copy, learner groups, FAQ answers and the booking policy live
in `src/config/` so they can be edited without touching components, and each
item carries a `status: 'proposed' | 'confirmed'` flag that drives a visible
"Draft" label.

## 2. Catalog model

The existing scheduling engine schedules **session types** (an id + a
duration). V3 adds a product layer on top instead of rewriting the engine:

```
Instructor ──teaches──▶ Course ──schedules as──▶ SessionType (duration)
                          │
                          └─ prices: { USD?: minor units, CNY?: minor units }
```

- `Course.category`: `trial` | `single` | `package`.
- A `package` course has `sessionCount`, optional `validityDays`, `terms[]`,
  and `redeemsCourseIds` (which single-lesson courses a credit can book).
- Prices are stored per currency in **minor units**. A currency is only
  offered at checkout if a price is configured for it. **No exchange rates
  are ever computed.**
- The four v1 session types are kept (flagged `legacy`) so v1 bookings keep
  rendering; new lesson session types (`lesson-30/45/60`, `trial-30`) back the
  new courses.

## 3. Booking flow

```
Course → Schedule → Details → Payment → Confirmation
  /book?course=…   &instructor=…&start=…&end=…   /book/checkout/:id   /booking/success/:id
```

1. **Course** — trial / single / package cards. If the student owns package
   credits, "Use a package credit" cards appear separately from "Buy a package".
2. **Schedule** — only instructors whose `courseIds` include the course; the
   existing `SlotPicker` + timezone selector; slots exclude confirmed bookings
   *and* other active holds.
3. **Details** — "Myself" or "My child (I'm the parent/guardian)". Required:
   name, email, Chinese level, primary goal. For a minor we collect only the
   learner's first name / nickname; contact details belong to the guardian.
4. **Hold created** on "Continue to payment" → navigate to checkout.
5. **Payment** — order summary, hold countdown, draft policy, demo payment
   methods, a clearly labeled *demo outcome* picker (success / failure /
   cancel / timeout). Package-credit bookings show "Covered by 1 credit".
6. **Confirmation** — reference, course, instructor, time + timezone, meeting
   platform, meeting-link status, payment status, `.ics` download.

Step state lives in the URL (steps 1–3) or in the persisted held booking
(steps 4–5), so a refresh never loses or corrupts progress.

## 4. State model

Booking status and payment status are **separate fields on separate records**.

### Booking (`Booking.status`)

```
                ┌──────── expire (hold time passed) ────────▶ expired
  [slot] ─hold─▶ held ─begin payment─▶ pending_payment ─verified payment─▶ confirmed ─▶ completed
                 ▲  │                     │                                   │
                 │  └─ cancel checkout ─▶ cancelled                           └─ cancel ─▶ cancelled
                 └── payment failed / cancelled / timed out (retry while hold lasts)
  held ─redeem package credit─▶ confirmed   (no payment involved)
```

- `available` is a property of a *slot* (computed by the engine), never stored.
- `held` and `pending_payment` block the slot only while `holdExpiresAt > now`.
- `confirmed` is reachable only from `pending_payment` with a **succeeded
  payment for the booking's own order**, or from `held` via credit redemption.
- Transitions are enforced by one table in `src/lib/checkout/stateMachine.ts`.
  Anything not in the table is rejected.

### Order (`Order.status`) — what the student owes

`pending → paid | expired | cancelled`, `paid → refund_pending → refunded`,
plus `not_required` for package-credit bookings. Failed attempts do not fail
the order — they fail the **payment**, and the order stays `pending` while
the hold lasts.

### Payment (`Payment.status`) — one attempt

`processing → succeeded | failed | cancelled | timed_out`. Each attempt has an
idempotency key (`orderId:attemptNumber`). A new attempt is refused while one
is `processing` or after one `succeeded` (no duplicate simulated charges).

## 5. Temporary holds

- Duration: `bookingPolicy.holdMinutes` (default **10**).
- Created when the student submits Details. Released when it expires (a
  sweep runs on load, every few seconds while the app is open, and before
  every checkout action), or immediately when the student cancels checkout.
- Expiry beats a late payment: if a simulated payment succeeds after the
  hold expired, the booking stays `expired`, the payment is recorded as
  `succeeded`, and the order moves to `refund_pending` for manual review.
- A payment still `processing` when the page reloads is reconciled to
  `timed_out` (the mock has no webhook to resume), returning the booking to
  `held` if time remains.
- **Limitation:** `localStorage` holds protect against double booking only
  within one browser profile (tabs stay in sync via the `storage` event).
  They do **not** protect inventory across users or devices.

Production needs server-authoritative holds: a `holds` row with
`expires_at`, a unique/exclusion constraint on (instructor, time range) for
active rows, atomic `held → pending_payment → confirmed` updates, server-side
conflict validation, and webhook reconciliation for late payments.

## 6. Payments

```
PaymentProvider (interface)
  ├─ mockPaymentProvider   ← V3 (simulated outcomes, no credentials collected)
  ├─ stripe (future)       ← international cards via hosted Checkout
  └─ wechat / alipay (future, subject to merchant eligibility)
```

- Demo methods: **Card — Demo** (USD, CNY), **WeChat Pay — Demo** (CNY),
  **Alipay — Demo** (CNY). Availability per currency is configuration, not an
  assumption about ClearOrigin's merchant setup.
- No card numbers, passwords, QR codes or credentials are ever requested.
- Production: server-created payment sessions, provider-hosted checkout,
  verified webhooks as the *only* source of "paid", idempotent processing,
  order and refund records. A client-side success screen is never proof of
  payment.

## 7. Package credits

- `PackageCreditBalance { totalCredits, redemptions[] }`. Each redemption has
  a `bookingId` and status `consumed | restored | forfeited`.
- Remaining = total − consumed − forfeited. Idempotent by `bookingId`, so the
  same booking can never consume twice.
- Credits are consumed **only when a booking is confirmed**. Holds don't
  reserve credits; confirmation re-checks the balance.
- Buying a package also books its first lesson. When the payment succeeds,
  the balance is created and one credit is consumed for that lesson.
- Cancellation: if notice ≥ `cancellationNoticeHours`, the credit is
  `restored`; otherwise it is `forfeited`, per the configured (draft) policy.
- Expired balances (`expiresAt < now`) cannot be redeemed.

## 8. Meeting-link lifecycle

`Booking.meeting = { provider, status, url: null }`

| Status               | Meaning |
| -------------------- | ------- |
| `awaiting_confirmation` | Held / pending payment. "Your meeting link will be available after confirmation." |
| `pending_creation`   | Confirmed. In production a server job would create the meeting. **The prototype never creates one.** |
| `created`            | Reserved for production (a real URL from Zoom/Meet). |
| `needs_attention`    | Creation failed after payment. Order stays paid and the booking stays confirmed; flagged for retry/admin. |

The provider comes from the instructor's `MeetingConfiguration` (editable in
the Teaching Studio). No realistic-looking URL is ever generated.

## 9. Data migration

- `SCHEMA_VERSION` 1 → 2. `storageService.load()` runs `migrateToLatest`:
  - **v1 → v2:** keeps every booking, student, availability rule and exception.
    v1 bookings get `paymentMode: 'legacy'`, a `meeting` block derived from
    their `meetingProvider`, and no order (shown as "Recorded before
    payments"). Instructor content and the catalog are refreshed from code;
    legacy session types stay so old bookings still resolve.
  - **Unknown or corrupt data:** the raw value is copied to a
    `…:backup:<timestamp>` key before reseeding, so nothing is silently lost.
- Migrations are pure functions with unit tests.

## 10. Testing plan

Unit (Vitest, fixed `now`):
- State machine: every allowed transition plus representative illegal ones.
- Checkout service: hold creation, overlapping-hold rejection, expiry, release,
  payment success / failure / cancel / timeout, refusing to confirm unpaid or
  expired holds, double confirmation, duplicate charges, late payment after
  expiry, processing-payment reconciliation, credit redemption and
  restoration/forfeit, package purchase, cancellation → refund status, and
  the reschedule deadline.
- Catalog: course/instructor compatibility, prices and durations, and no
  currency conversion.
- Validation: self and guardian forms.
- Migration v1 → v2 and handling of corrupt data.
- Existing engine and seed tests stay unchanged.

E2E (Playwright, desktop + Pixel 7):
- Existing journeys updated to the new copy and flow.
- Trial booking → simulated payment success → confirmation → My Learning Space.
- Failed payment stays unconfirmed, then a retry succeeds.
- Cancelling checkout releases the slot.
- A refresh during checkout keeps the hold.
- Hold expiry, using Playwright's clock.
- Guardian booking.
- Package purchase followed by credit redemption.
- Instructor dashboard shows booking vs payment status.
- FAQ page.
- No horizontal overflow at 320 / 375 / 390 / 430 / 768 / 1024 / 1440.
