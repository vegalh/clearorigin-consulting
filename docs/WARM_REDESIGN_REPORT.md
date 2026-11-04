# ClearOrigin — Warm Learning Redesign: Completion Report

This report documents what shipped on the `feature/warm-learning-redesign`
branch. It should be read alongside [WARM_REDESIGN_PLAN.md](./WARM_REDESIGN_PLAN.md),
which is the authoritative reference for the creative concept, full color
token table (with WCAG contrast rationale), typography rationale, and the
original page-by-page plan. This document instead records **what was
actually built**, how it was verified, and what remains out of scope.

## 1. Scope confirmation

This was a **visual/UX layer change only**, per the master prompt's
engineering boundaries:

- No changes to the scheduling engine (`src/lib/scheduling/`), data models
  (`src/types.ts`), demo data shape, storage layer, or routing structure.
- No new dependencies, no backend, no build-tool changes beyond adding
  Google Fonts `<link>` tags to `index.html`.
- All booking logic, validation, conflict rules, and persistence behavior
  from the v1 prototype are unchanged and re-verified by the same (updated)
  test suites.
- Everything below lives only on `feature/warm-learning-redesign`; nothing
  was pushed, merged, or deployed.

## 2. Design direction delivered

**Concept: "A Place for Conversation" (让对话自然发生).** The app was
restyled from a cool green/white SaaS-dashboard look to a warm, editorial,
human-centered look: cream/paper surfaces, deep cocoa text, a restrained
terracotta accent reserved for calls-to-action/selections/prices, a calm sage
secondary accent for badges/confirmed states/eyebrow labels, and serif
(Fraunces) display headlines paired with DM Sans body copy. Full rationale,
the 5 guiding principles, and the complete token/contrast table are in
[WARM_REDESIGN_PLAN.md §2–4](./WARM_REDESIGN_PLAN.md).

## 3. What changed

### Design system
- `index.html` — new page title; Google Fonts for Fraunces, DM Sans, Noto
  Sans SC, Noto Serif SC.
- `src/index.css` — re-valued the existing `@theme` tokens (`co-bg`,
  `co-paper`, `co-ink`, `co-muted`, `co-orange`, `co-pale`, `co-line`) to the
  new palette and added four new ones (`co-orange-dark`, `co-sage`,
  `co-sage-dark`, `co-clay`); added `--font-serif`; updated the
  `:focus-visible` outline color.
- `src/components/ui/Button.tsx`, `Card.tsx`, `Badge.tsx` — reskinned with
  the warm palette (terracotta primary button, sage-tinted badges/confirmed
  status, warm cocoa-tinted card shadow).
- `src/components/layout/Header.tsx`, `Footer.tsx` — all `co-green`
  references replaced with `co-orange-dark`; logo mark restyled; wordmark set
  in `font-serif`.
- `src/data/instructors.ts` — avatar colors diversified across the new
  palette (sage-dark, clay, orange-dark, ink) instead of all sharing one
  green.

### Pages (all 8 routes)
- **Home** — fully rewritten: new hero ("Every conversation takes you
  somewhere.") with "Start a Conversation" / "Meet Our Instructors" CTAs, a
  new "A typical first session" hero card, a new "Our learning philosophy"
  3-part section, the instructor list reframed as "Featured instructors"
  (`#featured-instructors` anchor), and a new "How booking works" 3-step
  section.
- **Find an Instructor** — new heading ("Find your conversation partner."),
  sage specialty badges.
- **Instructor Profile** — serif name heading, sage specialty badges, warm
  eyebrow labels, terracotta selected/price styling; calendar/slot picker
  restyled with terracotta selected day/slot states and warmer empty-state
  copy.
- **Booking Confirmation** — new headline ("Your next conversation is almost
  here."), warm eyebrow/price/selected-provider styling.
- **Booking Success** — new headline ("You're all set."), sage success icon.
- **My Bookings** — new heading ("My Learning Space"), terracotta active tab.
- **Instructor Dashboard** — serif headings, warmer subcopy ("Your Teaching
  Studio, acting as {name}.").
- **Instructor Availability** (weekly schedule + exceptions editors) — serif
  H1, warmer intro copy, sage eyebrow/saved-state labels.

Full per-page before/after rationale is in
[WARM_REDESIGN_PLAN.md](./WARM_REDESIGN_PLAN.md).

## 4. Bugs found and fixed during this work

Two real, pre-existing layout/correctness issues surfaced while verifying
the redesign against the spec's "no functional or responsive regressions"
requirement. Both were tightly coupled to files already being redesigned, so
they were fixed as part of this branch rather than left as follow-ups:

1. **Duplicate React key warning** on `/instructor/availability`
   ("Encountered two children with the same key... maya-chen"). The weekly
   schedule editor and the exceptions editor were both keyed with the raw
   `instructor.id`, which collided because they're sibling elements. Fixed
   by namespacing the keys (`weekly-${id}` / `exceptions-${id}`) in
   [`InstructorAvailabilityPage.tsx`](/Users/vega/Documents/GitHub/clearorigin-consulting/src/pages/InstructorAvailability/InstructorAvailabilityPage.tsx).
2. **Desktop horizontal-overflow bug** (1024px–1440px) on the Instructor
   Profile page. The two-column `grid-cols-[320px_1fr]` layout let its right
   column grow past its `1fr` track to fit the slot picker's horizontally
   scrolling day-list content, instead of clipping it with the intended
   internal `overflow-x-auto` scroll — a classic CSS Grid intrinsic-sizing
   gotcha (grid items default to `min-width: auto`). Fixed with `min-w-0` on
   the column in
   [`InstructorProfilePage.tsx`](/Users/vega/Documents/GitHub/clearorigin-consulting/src/pages/InstructorProfile/InstructorProfilePage.tsx).
3. **Narrow-viewport header overflow (320–390px) in Instructor role.** With
   the role toggle switched to "Instructor," the header's right-hand control
   group (the "Acting as …" instructor selector + Student/Instructor toggle)
   didn't wrap or shrink, pushing the header wider than the viewport. Fixed
   by making that control group wrap (`flex-wrap`) and capping the select's
   width on narrow screens in
   [`Header.tsx`](/Users/vega/Documents/GitHub/clearorigin-consulting/src/components/layout/Header.tsx).

All three were re-verified with no overflow/warnings at 320, 360, 375, 390,
414, 430, 768, 1024, and 1440px, in both Student and Instructor roles.

## 5. Responsive verification

Every page was checked at 320/360/375/390/414/430/768/1024/1440px (both demo
roles where applicable) via the browser tool, confirming:
- No horizontal overflow anywhere (the original mobile grid-overflow bug from
  v1 was not reintroduced, and the two new overflow bugs above are fixed).
- Hero, philosophy grid, featured-instructors grid, and booking-steps list on
  the rewritten Home page all collapse to single columns correctly below
  their `sm:`/`lg:` breakpoints.
- The reschedule panel (My Bookings) and the session-type/slot picker
  (Instructor Profile) both reflow correctly at all widths.

## 6. Testing

| Layer | Tool | Result |
|---|---|---|
| Type safety | `tsc -b` | Clean, no errors |
| Lint | `oxlint` | Same 6 pre-existing informational warnings as the v1 baseline (impure `Date`/`Date.now()` calls during render, one `only-export-components` note) — no new warnings introduced |
| Unit / integration | Vitest | **27/27 passing**, unchanged from v1 (only cosmetic fixture values renamed, e.g. `bg-co-green` → `bg-co-sage-dark`) |
| End-to-end | Playwright | **20/20 passing** across `chromium` + `mobile-chromium` (Pixel 7) projects, after updating the literal copy assertions that legitimately changed (see below) |
| Production build | `vite build` | Succeeds — ~345 kB JS / ~22 kB CSS (gzip ≈ 106 kB / 5 kB) |

### e2e assertions updated (copy changes only — no assertions weakened)
- `e2e/student-booking.spec.ts`: home hero heading regex, hero CTA link text
  (now "Start a Conversation"), Instructors heading, Booking Confirmation
  heading, Booking Success heading, My Bookings heading.
- `e2e/my-bookings.spec.ts`: My Bookings heading.
- `e2e/reset-and-responsive.spec.ts` and `e2e/instructor-availability.spec.ts`
  needed no changes — their assertions (Availability, Reschedule/Cancel
  buttons, tab labels, "Welcome back" regex, empty states, Saved indicator)
  were left unchanged by the redesign and still pass.

## 7. Known limitations (carried over / unchanged from v1)

All limitations documented in
[COMPLETION_REPORT.md §5](./COMPLETION_REPORT.md#5-known-limitations) still
apply unchanged (single-browser storage, no real concurrency control,
simulated meeting links, no real authentication, the reschedule-to-identical-
time edge case, fictional demo data). This redesign introduced no new
functional limitations.

## 8. Local preview

```bash
git checkout feature/warm-learning-redesign
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

No deployment, push, or merge was performed as part of this work, per the
redesign spec's explicit instructions — everything above runs entirely on
`localhost`, and the branch has not been pushed to any remote.
