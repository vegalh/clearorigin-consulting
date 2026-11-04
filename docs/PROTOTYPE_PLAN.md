# ClearOrigin Booking Platform — Prototype Plan (v1.0)

## 1. Product Goals

- Give ClearOrigin students a fast, friendly way to find an instructor, see real
  availability, and confirm a session in about a minute — no account required.
- Give ClearOrigin instructors a simple way to manage their recurring
  availability, see upcoming sessions, and trust that booked times stay booked.
- Produce a local, fully interactive prototype that looks and feels like a
  natural extension of the existing ClearOrigin Consulting marketing site,
  using realistic (but clearly fictional) demo data.
- Build the scheduling logic as a self-contained engine so a future real
  backend (Supabase, Cal.com, Calendly, custom API) can replace the storage
  layer without rewriting the UI.

This is a **Version 1 prototype**. It simulates booking, availability, and
meeting links. It does not create real meetings, move real money, or
authenticate real users.

## 2. Research Notes — clearoriginconsulting.com

The live marketing site (fetched during planning) is a single-page site for
**ClearOrigin Consulting Inc.**, positioned around **Chinese speaking
practice** ("Confident, natural spoken Chinese through guided conversation and
meaningful media"). Observed identity, reused in this prototype:

- **Colors**: warm off-white background `#f7f5ef`, warm paper `#fffdf8`, dark
  charcoal-green ink `#1c2521`, muted sage-gray text `#65706b`, deep green
  accent `#315c4d`, pale green surface `#dcebe3`, hairline border `#dfe2da`,
  warm orange accent `#c87a45`.
- **Logotype**: a rounded square mark with the initials "CO" in white on the
  green accent, next to the wordmark "ClearOrigin Consulting".
- **Typography**: `Inter` / system sans-serif, very tight letter-spacing on
  large display headings (`-0.05em` to `-0.06em`), uppercase "eyebrow" labels
  with wide letter-spacing and a small orange dot marker.
- **Shape language**: large radii (22–28px) on cards/panels, fully pill-shaped
  buttons (`border-radius: 999px`), soft shadows, hairline 1px borders instead
  of heavy shadows/gradients.
- **Tone**: calm, editorial, education-first copy; no testimonials, no
  invented credentials or stats.

The prototype reuses this palette, logotype style, radius scale, and
restrained editorial tone. It does **not** reuse the Chinese-practice subject
matter as fact — instructor identities, specialties, and pricing in this
prototype are explicitly fictional demo content, since no instructor roster,
services, or pricing were published on the live site to verify against.

**Limitation documented per instructions**: the live site is a single static
marketing page with no booking system, instructor roster, or pricing today.
Any "specialties"/"session types"/"pricing" shown in the prototype are
labeled as demo/fictional content in the UI.

## 3. User Journeys

### Student — first-time booking
1. Land on Home → "Find an Instructor".
2. Browse/filter instructors on `/instructors`.
3. Open a profile, pick a session type, pick a day + time slot.
4. Review the sticky booking summary → "Continue to Booking".
5. Enter name/email/goal, pick Zoom or Google Meet (simulated), confirm.
6. See success screen, download `.ics`, go to "My Bookings".

### Student — manage bookings
1. Open `/bookings`.
2. View Upcoming / Past / Cancelled tabs.
3. Cancel (with confirmation) or reschedule (pick a new slot with the same
   instructor; old slot stays held until the new one is validated).

### Instructor — manage availability & roster
1. Use the "Prototype Mode" role switcher to become an instructor.
2. View `/instructor/dashboard` for today/upcoming sessions and quick stats.
3. Go to `/instructor/availability` to edit the weekly recurring schedule and
   add date exceptions (block a date, add one-off hours, block a time range).
4. Changes immediately affect what students see on the profile calendar.

## 4. Page / Route Architecture

| Route | Page | Primary purpose |
|---|---|---|
| `/` | Home | Orientation + fast path to booking |
| `/instructors` | Find an Instructor | Browse/filter instructors |
| `/instructors/:id` | Instructor Profile | Session type + calendar + slot selection |
| `/booking/confirm` | Booking Confirmation | Student info + meeting platform + confirm |
| `/booking/success/:id` | Booking Success | Confirmation + `.ics` download |
| `/bookings` | My Bookings | Upcoming/Past/Cancelled, cancel/reschedule |
| `/instructor/dashboard` | Instructor Dashboard | Overview + upcoming bookings |
| `/instructor/availability` | Instructor Availability | Weekly schedule + exceptions |

Shared chrome: header (logo, nav, role switcher, "Book a Session" CTA) and
footer (link back to clearoriginconsulting.com, prototype disclaimer).

## 5. Booking Data Model (summary)

See [src/types/index.ts](../src/types/index.ts) for full types. Core entities:

- **Instructor** — profile, languages, specialties, bio, IANA `timezone`.
- **SessionType** — id, name, `durationMinutes`, optional demo price, config
  shared by all instructors from one data source.
- **RecurringAvailability** — per-instructor weekday rule (`dayOfWeek`,
  `startTime`, `endTime`) interpreted in the instructor's timezone.
- **AvailabilityException** — per-instructor date override: fully blocked,
  extra one-off hours, or a blocked time range on a specific date.
- **Booking** — `id`, `instructorId`, `studentId` (local demo student),
  `sessionTypeId`, `startAtUtc`, `endAtUtc` (ISO UTC strings), `status`
  (`confirmed | cancelled | completed`), `meetingProvider`, `meetingUrl`
  (always `null` in v1 — no fake links), `studentNotes`, `createdAt`,
  `updatedAt`.

All persisted data is wrapped with a `schemaVersion` so `storageService` can
migrate or reset safely.

## 6. Booking Engine Rules

Implemented in `src/lib/scheduling/`, fully unit tested, UI-agnostic:

1. Confirmed booking instants are stored in UTC ISO format.
2. Each instructor's recurring rules are interpreted in an explicit IANA
   timezone (`date-fns-tz`), independent of the viewer's timezone.
3. Future slots are generated from recurring rules + exceptions, in the
   instructor's timezone, then converted for display in the student's chosen
   timezone.
4. Past times are excluded.
5. Overlapping bookings are rejected (conflict detection against existing
   confirmed bookings).
6. Blocked dates / blocked time ranges (exceptions) remove slots.
7. A session must fit entirely inside an available window.
8. Supported durations: 15 / 30 / 45 / 60 minutes.
9. Slot starts are generated on a consistent 15-minute grid.
10. DST transitions are handled by doing all arithmetic in UTC after
    resolving local wall-clock times via `date-fns-tz`.
11. Availability is revalidated at confirmation and at reschedule time (not
    just when the slot grid was first rendered).
12. Cancelling releases the slot (it is simply excluded from the "booked"
    set used for conflict checks) while the historical record is kept with
    `status: 'cancelled'`.
13. Rescheduling validates the *new* slot before mutating the existing
    booking; the original booking is only changed after the new time passes
    all checks.

**Known concurrency limitation (documented in-app and here):** all state is
in `localStorage` on a single browser/device. This prototype has no real
multi-user locking — it cannot prevent two different browsers/devices from
double-booking the same instructor slot at the same instant. A production
build needs a real backend with transactional booking writes (see §8).

## 7. Design System Direction

- Tailwind theme extended with ClearOrigin tokens: `co-bg`, `co-paper`,
  `co-ink`, `co-muted`, `co-green` (primary), `co-pale`, `co-line`,
  `co-orange` (accent), plus the existing pill/rounded-card radius scale.
- `Inter` as the base font (loaded via system font stack fallback, matching
  the live site, no external font request required for the offline
  prototype).
- Buttons: pill-shaped, green primary / outline secondary, matching the live
  site's `.button` / `.button.alt` styling.
- Cards: 20–28px radius, hairline borders, soft shadow — no gradients, no
  heavy decorative animation; transitions kept short (150–200ms).

## 8. Future Integration Points (not implemented in v1)

Abstracted behind `src/services/*Service.ts` interfaces so the mock
`localStorage`-backed implementation can be swapped later:

- **Cal.com** — candidate for real booking creation, calendar availability
  sync, and automatic Zoom/Google Meet link generation. Likely best fit if
  ClearOrigin wants a fast path to real video-link automation without
  building its own calendar sync.
- **Calendly** — viable alternative scheduling provider if a simpler,
  more opinionated embed is preferred over Cal.com's API surface.
- **Supabase** — candidate for auth, instructor/student profile storage,
  the real booking database, and row-level security, replacing
  `storageService`'s localStorage implementation with Supabase queries
  behind the same service interface.

Recommendation is finalized in the completion report after the prototype is
built and tested.

## 9. Known Limitations (tracked, not hidden)

- Single-device/browser persistence only (`localStorage`); no real
  concurrency control across devices.
- Meeting links are always simulated/absent (`meetingUrl: null`); the UI
  explicitly says a real link isn't generated.
- Instructor identities, bios, specialties, and demo pricing are fictional
  placeholders, clearly labeled, since the live site currently publishes no
  instructor roster or pricing to source from.
- No real authentication; the "Prototype Mode" role switcher is explicitly
  labeled as non-secure/demo-only.
