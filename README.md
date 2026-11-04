# ClearOrigin — Tutoring & Session Booking Platform (Prototype)

An interactive, locally-runnable prototype of a booking experience for
**[ClearOrigin Consulting](https://clearoriginconsulting.com)**, a real
Chinese-language conversation-practice business. It demonstrates what
students and instructors could do if ClearOrigin added self-serve session
booking to its site: browsing instructors, picking a real available time in
your own timezone, confirming a session, and managing/rescheduling/cancelling
bookings — plus an instructor-side dashboard and availability editor.

> **This is a prototype, not a production app.** All instructors, pricing,
> and bookings are fictional demo data generated on first load and stored
> only in your browser's `localStorage`. No accounts, no real emails, no real
> meeting links, and no real money are involved. See
> [docs/PROTOTYPE_PLAN.md](./docs/PROTOTYPE_PLAN.md) and
> [docs/COMPLETION_REPORT.md](./docs/COMPLETION_REPORT.md) for the full design
> rationale, booking-engine details, and a path to a real backend.

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

- **As a student**: start on the home page → *Find an Instructor* → open a
  profile → choose a session length → pick a time (shown in your chosen
  timezone) → confirm with your name/email → see the success page and
  download an `.ics` calendar file. Visit *My Bookings* to cancel or
  reschedule.
- **As an instructor**: use the **Student / Instructor** toggle in the header,
  pick who you're "acting as," then visit *Dashboard* (stats + upcoming
  sessions) and *Availability* (weekly recurring hours + one-off date
  exceptions). Changes save instantly and are immediately reflected on the
  student-facing profile page.
- **Reset demo data**: the footer's "Reset demo data" button restores the
  original fictional seed data at any time.

## Project structure

```
src/
  types/            Core TypeScript data model
  data/              Fictional demo instructors, session types, availability, seed generator
  lib/scheduling/    Timezone-aware booking engine (pure functions, fully unit-tested)
  lib/dates, lib/ics, lib/validation   Formatting, calendar export, form validation helpers
  services/          localStorage persistence + booking/availability service wrappers
  state/             AppDataContext — single source of truth + mutation actions
  components/        Shared UI primitives, layout, and booking UI
  pages/             The 8 routed pages
e2e/                 Playwright end-to-end specs
docs/                Planning and completion documentation
```

## Known limitations

This prototype runs entirely client-side. See
[docs/COMPLETION_REPORT.md](./docs/COMPLETION_REPORT.md#known-limitations)
for the full list (single-browser storage, simulated meeting links, no real
auth, etc.) and recommendations for integrating a real backend.
