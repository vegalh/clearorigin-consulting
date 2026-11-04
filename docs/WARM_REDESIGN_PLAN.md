# ClearOrigin — Warm Learning Redesign Plan

## 1. Why this redesign

The v1 prototype (see [PROTOTYPE_PLAN.md](./PROTOTYPE_PLAN.md) and
[COMPLETION_REPORT.md](./COMPLETION_REPORT.md)) proved out the booking engine
and all core flows, but visually it reads as a generic SaaS dashboard: pill
buttons, hairline borders, a cool green/white palette, uppercase eyebrow
labels on every card header, and no distinct emotional point of view. This
redesign keeps every working piece of the prototype (routes, components,
scheduling engine, data flow, tests) and replaces the **visual and verbal
surface** with a warmer, more human concept.

This is a **visual/UX layer change only**. No booking rules, data structures,
engine internals, or persistence logic are touched.

## 2. Creative concept — "A Place for Conversation" (让对话自然发生)

ClearOrigin's product is a conversation between two people, not a transaction
on a marketplace. The redesign treats the product like a **quiet, well-lit
study room or independent bookshop/language-studio** rather than a corporate
booking dashboard: warm paper tones, soft terracotta/apricot accents, deep
cocoa text, generous whitespace, gently rounded cards, and restrained use of
color so the one saturated accent (tangerine) always marks something worth
noticing — a call to action, a selected time, a confirmed step.

Five principles guide every page-level decision below:

1. **Human before transaction** — lead with the person/conversation, not the
   calendar grid or the price.
2. **Warmth without clutter** — warm neutrals carry the page; color is used
   sparingly and with intent.
3. **Learning as a journey** — frame bookings/history as steps in an ongoing
   practice, not just a transaction log.
4. **Confidence through clarity** — scheduling/timezone/status information
   stays precise and unambiguous even as the visual tone softens.
5. **Contemporary cultural sensitivity** — no decorative Chinese characters,
   lanterns, or stereotypical motifs; Chinese text (where it appears) is
   treated as real typography (Noto Sans/Serif SC), not ornament.

## 3. Design tokens (`src/index.css`)

All tokens are renamed/re-valued **in place** (same CSS variable + Tailwind
utility names: `bg-co-*`, `text-co-*`, `border-co-*`) so every page keeps
using semantic classes — no component needed a one-off hex value. New tokens
were added only where the palette needed a role the old theme didn't have
(a secondary calm accent, and an AA-safe dark accent for small text/buttons).

| Token | Hex | Role |
|---|---|---|
| `--color-co-bg` | `#FFF8EF` Warm Cream | page background |
| `--color-co-paper` | `#FFFEFA` Paper White | card/surface background |
| `--color-co-ink` | `#44332B` Deep Cocoa | primary text |
| `--color-co-muted` | `#7D6A5A` | secondary text (4.9:1 on cream — AA) |
| `--color-co-orange` | `#E97845` Primary Tangerine | decorative accent, large surfaces, icon tints, hover tints — **not** small text on cream (2.75:1) |
| `--color-co-orange-dark` *(new)* | `#B94F23` Terracotta | primary buttons, links, selected-state text/borders, price — AA-safe both as text-on-cream (4.7:1) and white-on-bg (5.0:1) |
| `--color-co-pale` | `#FFD8B8` Soft Apricot | soft highlight backgrounds (selected option fill, badges) |
| `--color-co-sage` *(new)* | `#A5AD91` Sage Green | calm secondary tint (decorative only, not text) |
| `--color-co-sage-dark` *(new)* | `#5F6B52` | secondary/confirmed-state text and an avatar color (5.4:1 on cream) |
| `--color-co-clay` *(new)* | `#B5724A` | 4th instructor-avatar accent for visual variety |
| `--color-co-line` | `#EADFD0` | hairline borders (decorative only) |

Contrast was checked with the WCAG relative-luminance formula for every
text/background pairing actually used (see rationale column above); nothing
below 4.5:1 is used for normal text, and avatar-initial colors (large, bold)
clear the 3:1 large-text minimum.

Radii (`--radius-co-sm/md/lg`) and the general shape language (rounded
cards, pill buttons) are kept — they already matched the "soft, human" brief
— but shadows move from a cool dark tint to a warm cocoa tint, and card
borders soften from hairline gray to warm tan.

## 4. Typography

- **Fraunces** (expressive serif) — English headings (`font-serif` utility,
  new `--font-serif` token). Loaded via Google Fonts `<link>` in `index.html`
  with `display=swap` and a `Georgia, serif` fallback baked into the token.
- **DM Sans** — English body/UI copy, replacing Inter (`--font-sans`).
- **Noto Sans SC** — fallback appended to `--font-sans` for any Chinese UI
  text (labels, instructor language names) so CJK glyphs render with a
  humanist sans instead of the system default.
- **Noto Serif SC** — appended to `--font-serif` for Chinese editorial-style
  headings, matching the Fraunces fallback chain.

Fonts load from Google Fonts (no local font files needed for a prototype);
system-ui / Segoe UI / sans-serif remain the final fallback so the app never
blocks on font load.

## 5. Component strategy (Phase 2 targets)

- `Button`/`ButtonLink` — primary variant becomes solid Terracotta
  (`co-orange-dark`) with cream text and a warm hover darken; secondary
  becomes soft apricot; outline/ghost keep structure but use warm tones.
- `Card` — paper background, warm hairline border, soft warm shadow.
- `Badge`/`StatusBadge` — apricot/sage fills instead of pale green.
- `Header` — paper surface, warm border, tangerine/terracotta active states,
  CO mark restyled onto a cocoa or terracotta circle; copy/role-switcher
  logic unchanged.
- `Footer` — same disclosure copy (content must stay accurate), warm styling.
- `SlotPicker` — same day-group + grid structure and the `grid-cols-1`
  responsive fix (preserved, see §7), but reskinned with apricot/terracotta
  selected states instead of green.

## 6. Page-by-page plan (copy + layout highlights)

- **Home** — new hero headline "Every conversation takes you somewhere.",
  warmer sub-copy, a 3-part "Learning Philosophy" band (replacing the plain
  numbered "How it works" card) ahead of featured instructors, and a
  restyled "How booking works" 3-step section. CTAs: "Start a Conversation" /
  "Meet Our Instructors".
- **Instructors (`/instructors`)** — heading "Find your conversation
  partner.", warmer card styling, same language filter.
- **Instructor Profile (`/instructors/:id`)** — unchanged two-column
  structure (already matches the brief), reskinned card/calendar, same
  session-type → slot-picker → continue flow.
- **Booking Confirmation (`/booking/confirm`)** — headline "Your next
  conversation is almost here.", same form fields/validation.
- **Booking Success (`/booking/success/:id`)** — headline "You're all set.",
  same ICS download / next-step CTAs.
- **My Bookings → "My Learning Space" (`/bookings`)** — renamed heading and
  tab copy kept functionally identical (Upcoming/Past/Cancelled), warmer
  empty-state microcopy.
- **Instructor Dashboard → "Teaching Studio" (`/instructor/dashboard`)** —
  warmer heading/empty states, same stats/list.
- **Availability (`/instructor/availability`)** — improved visual hierarchy
  only; weekly grid and exceptions logic untouched.

## 7. Responsive & regression guardrails

- The mobile grid-overflow bug fixed earlier (bare `grid` without a base
  `grid-cols-1` before a responsive override) **must not return**. Every
  grid container touched during this redesign keeps (or gains) an explicit
  `grid-cols-1` base class.
- Re-verify at 375 / 390 / 430 / 768 / 1024 / 1440px after each page is
  redesigned, with particular attention to the instructor profile's
  calendar/slot picker and the My Bookings reschedule panel.

## 8. Test impact

Existing Vitest suite (27 tests) covers the scheduling engine/services only
and is not expected to need changes (no copy/selector dependencies). The 4
Playwright specs assert specific heading/button text that will change with
the new copy; selectors will be updated to match new text **only**, without
weakening any assertions (same elements, same roles, same user-visible
behavior):

- `My bookings` → `My Learning Space`
- `Find an instructor` (heading) → `Find your conversation partner.`
- Home hero heading regex → updated to match the new H1
- Empty-state copy (e.g. `No upcoming sessions yet.`) → updated to match new
  wording only where it actually changes, case-by-case during Phase 7/8.

All functional assertions (role switch, slot selection, booking creation,
reschedule, cancel, reset-demo-data, responsive/no-overflow, accessibility
landmarks) remain as-is in structure; only text literals move.
