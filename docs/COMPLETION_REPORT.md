# ClearOrigin Booking Prototype — Completion Report

## 1. Implementation summary

A fully interactive, locally-runnable prototype of a tutoring/session
booking platform for ClearOrigin Consulting was built per
[PROTOTYPE_PLAN.md](./PROTOTYPE_PLAN.md). It is a single-page React app
(no backend) covering the complete student and instructor booking lifecycle:

- Browse instructors, filter by language, view a profile with specialties,
  bio, and session types.
- Generate real, timezone-aware available time slots from each instructor's
  weekly recurring hours, one-off date exceptions, and existing bookings.
- Confirm a session with student contact info and a simulated meeting
  platform choice; receive a success page with a downloadable `.ics` file.
- View, cancel, and reschedule bookings from a "My Bookings" page, split into
  Upcoming / Past / Cancelled tabs.
- Switch to an "Instructor" role (with an "acting as" selector across 4 demo
  instructors) to see a dashboard of stats/upcoming sessions and edit weekly
  availability + exceptions, with changes reflected immediately on the
  student-facing profile.
- Reset all demo data back to its original seeded state at any time.

All data model, booking-engine, and app logic is written in TypeScript and
unit-tested; all 8 pages were additionally verified via Playwright
browser tests across desktop and mobile viewports.

## 2. Screens

| # | Route | Page |
|---|-------|------|
| 1 | `/` | Home |
| 2 | `/instructors` | Find an Instructor |
| 3 | `/instructors/:id` | Instructor Profile (session type + slot picker) |
| 4 | `/booking/confirm` | Booking Confirmation (student info form) |
| 5 | `/booking/success/:id` | Booking Success (+ `.ics` download) |
| 6 | `/bookings` | My Bookings (cancel / reschedule) |
| 7 | `/instructor/dashboard` | Instructor Dashboard |
| 8 | `/instructor/availability` | Instructor Availability editor |

Visual identity (colors, type, pill buttons, card radii) was reverse-engineered
from the live [clearoriginconsulting.com](https://clearoriginconsulting.com)
marketing site so the prototype reads as a natural extension of it.

## 3. Booking logic

The scheduling engine (`src/lib/scheduling/`) is a set of pure, dependency-free
TypeScript functions, deliberately decoupled from React/UI and from storage,
so it can be reused against a real backend later:

- **`availability.ts`** — `generateAvailableSlots` resolves an instructor's
  effective local-time windows for each day in the booking horizon from their
  weekly `RecurringAvailability` rules, applies `AvailabilityException`
  overrides (fully blocked days, or custom one-off windows), converts those
  wall-clock windows to UTC instants with full DST-correctness
  (`date-fns-tz`'s `fromZonedTime`/`toZonedTime`), slices them into
  session-length increments, and removes any slot that overlaps an existing
  confirmed booking.
- **`validate.ts`** — `validateSlot` re-derives the same availability
  independently at confirm/reschedule time (never trusts a slot the client
  "remembers") to defend against stale UI state or clock drift between slot
  generation and submission.
- **`booking.ts`** — `confirmBooking`, `cancelBooking`, `rescheduleBooking`
  wrap `validateSlot` with the actual booking-list mutation, returning a
  discriminated `{ ok: true, booking }` / `{ ok: false, reason }` result so
  callers never need to catch exceptions for expected business-rule failures
  (double-booking, past-dated slot, instructor/session mismatch, etc).
- **Critical correctness fix found during testing**: the engine now filters
  `recurringRules` / `exceptions` to the target instructor's `id` *inside*
  `generateAvailableSlots` and `validateSlot` themselves, rather than trusting
  callers to pre-filter. The app's real call pattern (passing the full,
  multi-instructor `AppData` arrays through `src/services/`) would otherwise
  silently leak one instructor's schedule rules into another's slot
  generation. A regression test locks this in.
- Multi-timezone correctness was manually verified end-to-end in the browser
  (e.g. Liang Wu's Tuesday 19:00–22:00 Shanghai-time window correctly renders
  as 06:00–09:00 the same calendar day when viewed in America/New_York).

State flows one-way: pages call `src/services/bookingService.ts` /
`availabilityService.ts`, which call the pure engine and then update
`AppDataContext`, which persists the whole `AppData` object to `localStorage`
(`src/services/storageService.ts`) with a schema-version guard that resets to
fresh seed data if the stored shape is out of date.

## 4. Testing

| Layer | Tool | Result |
|---|---|---|
| Type safety | `tsc -b` (`npm run typecheck`) | Clean, no errors |
| Lint | `oxlint` (`npm run lint`) | No errors; 6 informational warnings (see §5) |
| Unit / integration | Vitest + Testing Library (`npm run test`) | **27/27 passing** — covers slot generation, exceptions, DST edges, instructor-isolation regression, booking confirm/cancel/reschedule conflict rules, and deterministic seed-data invariants |
| End-to-end | Playwright (`npm run test:e2e`) | **20/20 passing** across `chromium` + a mobile (`Pixel 7`) viewport project — covers the full student booking flow, language filtering, My Bookings tab/cancel/reschedule flows, instructor role-switch + availability editing + live propagation to the student view, the instructor dashboard, demo-data reset, and responsive/landmark accessibility checks |
| Production build | `vite build` (`npm run build`) | Succeeds — ~343 kB JS / ~20 kB CSS (gzip ≈ 105 kB / 4.7 kB) |

A real responsive-layout bug was caught by the Playwright mobile project
during this work: several `grid` containers lacked an explicit base
`grid-cols-1`, so on narrow viewports the SlotPicker's horizontally-scrolling
day list expanded the whole page instead of scrolling internally. Fixed by
adding explicit `grid-cols-1` (letting Tailwind's `minmax(0, 1fr)` track
sizing apply) before each responsive breakpoint override, across the Home,
Instructors, Instructor Profile, Instructor Dashboard, and Booking
Confirmation pages.

## 5. Known limitations

- **Single-browser storage**: all data lives in that browser's
  `localStorage`. Clearing site data or switching browsers/devices loses or
  forks the demo state (by design, documented in the footer and in
  `storageService.ts`).
- **No real concurrency control**: two browser tabs/sessions booking the same
  instructor at the same instant could each "succeed" locally; there's no
  server-side transactional lock.
- **Simulated meeting links**: choosing Zoom/Google Meet only records a
  preference string; no real meeting is created.
- **No authentication**: "logged in as" a single fixed demo student
  (`student-alex`); the "acting as instructor" selector is a simple dropdown,
  not a real login.
- **Minor reschedule UX nuance**: because available slots exclude all of an
  instructor's existing confirmed bookings (including the one being
  rescheduled), a user cannot reselect the *exact* original time slot while
  rescheduling — a minor, acceptable gap since rescheduling to an identical
  time is a degenerate case.
- **Remaining lint warnings (non-blocking)**: `oxlint` flags `Date.now()`/
  `new Date()` calls during render in three dashboard/list pages (functionally
  correct — they compute "is this upcoming/past" on each render — but
  technically impure) and one `only-export-components` note on
  `AppDataContext.tsx` (it exports both the provider and the `useAppData`
  hook, a common and intentional React pattern). Both are accepted as
  reasonable for a prototype rather than refactored further.
- **Fictional data**: all 4 instructors, their bios/specialties, availability,
  and demo pricing are invented for this prototype and do not represent real
  ClearOrigin staff, schedules, or rates.

## 6. Future integration recommendations

To move this from prototype to production:

1. Replace `src/services/storageService.ts` with a real backend (e.g.
   Supabase/Postgres, or a booking platform API like Cal.com/Calendly) behind
   the same `bookingService`/`availabilityService` function signatures — the
   UI layer and the pure `src/lib/scheduling` engine would not need to change.
2. Add real authentication (student accounts, instructor accounts) and
   replace the role-switch/"acting as" header controls with real session
   state.
3. Move slot-generation and conflict validation to the server so two
   concurrent clients can't both "win" a booking; keep the existing pure
   engine functions as the source of truth for that server-side logic.
4. Integrate a real meeting-link provider (Zoom/Google Meet OAuth API) behind
   the existing `MeetingProvider`/`mockMeetingLinkProvider` abstraction in
   `src/services/types.ts`.
5. Add transactional email/calendar invites in place of the client-side
   `.ics` download.

## 7. Local preview

```bash
npm install
npm run dev        # interactive dev server
# or
npm run build && npm run preview   # production build + static preview
```

Run the automated checks with:

```bash
npm run typecheck
npm run lint
npm run test
npm run test:e2e
```

No deployment or git push was performed as part of this work, per the
original project instructions — everything above runs entirely on
`localhost`.
