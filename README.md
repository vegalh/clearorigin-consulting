# ClearOrigin — Tutoring & Session Booking Platform (Prototype)

An interactive, locally-runnable prototype of a booking experience for
**[ClearOrigin Consulting](https://clearoriginconsulting.com)**, a real
Chinese-language conversation-practice business. It demonstrates what
students, parents and instructors could do with self-serve booking: exploring
courses and demo pricing, browsing instructor qualifications, a course-first
booking flow (Course → Schedule → Details → Payment → Confirmation) with
temporary holds and a **simulated** checkout, package credits, managing /
rescheduling / cancelling lessons, an FAQ, and an instructor Teaching Studio
with separate booking and payment status.

> **This is a prototype, not a production app.** All instructors, courses,
> pricing, policies and bookings are fictional or draft demo data stored only
> in your browser's `localStorage`. Payments are simulated (no payment details
> are ever requested), no real meeting links are created, and holds only
> protect a time slot within this browser. See
> [docs/BOOKING_V3_PLAN.md](./docs/BOOKING_V3_PLAN.md) and
> [docs/BOOKING_V3_REPORT.md](./docs/BOOKING_V3_REPORT.md) for the V3
> architecture, state model and limitations, and
> [docs/PROTOTYPE_PLAN.md](./docs/PROTOTYPE_PLAN.md) /
> [docs/COMPLETION_REPORT.md](./docs/COMPLETION_REPORT.md) for the original
> booking-engine design.

## Tech stack

React 19 + TypeScript + Vite · Tailwind CSS v4 · React Router · date-fns /
date-fns-tz · localStorage persistence · Vitest + React Testing Library ·
Playwright.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL (typically `http://localhost:5173`).

## Available scripts

| Command              | Description                                              |
| --------------------- | --------------------------------------------------------- |
| `npm run dev`         | Start the Vite dev server with hot reload.                |
| `npm run build`       | Type-check (`tsc -b`) and produce a production build in `dist/`. |
| `npm run preview`     | Serve the production build locally.                       |
| `npm run typecheck`   | Run the TypeScript compiler in project-reference mode.    |
| `npm run lint`        | Run `oxlint` over the codebase.                            |
| `npm run test`        | Run the Vitest unit/integration suite once.                |
| `npm run test:watch`  | Run Vitest in watch mode.                                  |
| `npm run test:e2e`    | Run the Playwright end-to-end suite (builds a preview server automatically). |

## Trying it out

- **As a student or parent**: *Book a Trial Lesson* on the home page (or pick
  anything on *Courses & Pricing*) → choose an instructor and a time (in your
  timezone) → add learner details (yourself, or your child as a guardian) →
  your time is held for 10 minutes while you check out → pick a demo payment
  method and a *demo outcome* (success / failure / cancel / timeout) → see the
  confirmation and download an `.ics` file. *My Learning Space* shows payment
  and meeting-link status, package credits, and lets you reschedule or cancel
  (with the draft policy shown first).
- **Sign in**: students and instructors have separate accounts on the *Sign in*
  page (email only, no password yet; email verification comes later). Use the
  one-click demo accounts, or any email to register as a student.
- **Language**: switch between English and 简体中文 with the **EN | 中文**
  control in the header (or *Account settings*); links like `/?lang=zh` work too.
- **As an instructor**: sign in with a demo instructor account, then visit *Teaching Studio* (booking, payment
  and meeting status per appointment) and *Availability* (weekly hours,
  date exceptions, preferred meeting platform). Changes apply immediately to
  what students see.
- **Reset demo data**: the footer's "Reset demo data" button restores the
  original fictional seed data at any time.

## Project structure

```
src/
  types/            Core TypeScript data model (schema v2)
  config/            Editable copy, FAQ, learner options, and the draft booking policy
  data/              Fictional demo instructors, courses, session types, availability, seed generator
  lib/scheduling/    Timezone-aware booking engine (pure functions, fully unit-tested)
  lib/checkout/      Booking/order/payment state machine, money, credits, status labels
  lib/dates, lib/ics, lib/validation   Formatting, calendar export, form validation helpers
  services/          Checkout lifecycle, mock payment provider, migrations, localStorage persistence
  state/             AppDataContext — data, session (sign-in) and mutation actions
  i18n/              English + Simplified Chinese strings, content overlays, useI18n hook
  components/        Shared UI primitives, layout, and booking UI
  pages/             Routed pages (home, courses, instructors, booking wizard, checkout, FAQ, dashboards)
e2e/                 Playwright end-to-end specs
docs/                Planning and completion documentation
```

## Known limitations

This prototype runs entirely client-side. See
[docs/BOOKING_V3_REPORT.md](./docs/BOOKING_V3_REPORT.md#5-known-limitations)
for the full list (browser-only holds, simulated payments and meeting links,
no real auth, draft content) and the recommended production integration.
