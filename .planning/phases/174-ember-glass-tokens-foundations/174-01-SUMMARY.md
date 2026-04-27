---
phase: 174-ember-glass-tokens-foundations
plan: 01
subsystem: ui
tags: [design-tokens, css-variables, next-font, backdrop-filter, ember-glass, oklch, glassmorphism]

# Dependency graph
requires: []
provides:
  - 11 Ember Glass CSS custom properties on :root (--glass-bg, --glass-blur, --glass-border, --glass-shadow, --accent, --text-1, --text-2, --r-card, --pad-card, --font-display, --font-body)
  - .glass-surface utility class consuming the four glass tokens with backdrop-filter + -webkit prefix
  - @supports not fallback for browsers without backdrop-filter
  - Three ambient keyframes (ambientA 14s, ambientB 18s, ambientC 22s) + prefers-reduced-motion guard
  - next/font outputs renamed to --font-display-outfit and --font-body-inter (no recursive var resolution)
affects: [174-02, 174-03, 175, 176, 177, 178, 179, 180, 181, 182]

# Tech tracking
tech-stack:
  added: [Inter (next/font/google)]
  patterns:
    - "next/font variable rename pattern: --font-X-{family} private, --font-X public alias declared in :root"
    - "Ember Glass token block placed AFTER @theme so cascade overrides legacy --font-display/-body literal-string declarations"
    - "@supports not ((prop) or (-webkit-prop)) feature query covers both unprefixed and -webkit prefix in one block"
    - ".ember-ambient-blob class colocated with keyframes via prefers-reduced-motion media query in globals.css"

key-files:
  created: []
  modified:
    - app/fonts.ts
    - app/globals.css

key-decisions:
  - "D-09: Body font swapped Space_Grotesk → Inter"
  - "D-10: next/font variable names renamed to --font-display-outfit + --font-body-inter to avoid recursion (Pitfall 6)"
  - "D-01: New :root token block placed AFTER @theme block (cascade order is the override mechanism; @theme stays untouched per D-03)"
  - "D-02: Glass surface tokens lifted verbatim from .planning/inbox/ember-glass-design/project/components/app.jsx:101-111"
  - "D-16: .glass-surface utility consumes only the four glass tokens (no hardcoded hex/blur values)"
  - "D-17: Fallback rgba(28, 25, 23, 0.92) is the only hardcoded color in the @supports not block (audit exception)"
  - "Canonical ambient keyframe transforms (40px/30px scale 1.15) per UI-SPEC, supersedes earlier RESEARCH A1 60px assumption"

patterns-established:
  - "Token cascade via @theme + post-@theme :root: legacy @theme declarations stay; new tokens override via source order"
  - "next/font alias indirection: private --font-X-{family} from next/font, public --font-X from :root cascade"
  - "@supports not + -webkit covers WebKit browsers that prefix backdrop-filter without supporting unprefixed"

requirements-completed: [DS-01, DS-04, DS-06]

# Metrics
duration: 3min
completed: 2026-04-27
---

# Phase 174 Plan 01: Token Foundations Summary

**Ember Glass token foundation: 11 CSS custom properties on :root, .glass-surface utility with backdrop-filter + -webkit fallback, three ambient keyframes, and next/font variable renaming (Outfit + Inter) to prevent recursive var resolution.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-27T09:42:22Z (plan execution start)
- **Completed:** 2026-04-27T09:45:09Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Body font swapped Space_Grotesk → Inter; both next/font variables renamed to private suffixes (--font-display-outfit, --font-body-inter) so the public --font-display / --font-body tokens can alias them via :root without recursive resolution.
- Appended canonical Ember Glass token block to app/globals.css immediately after the @theme block (line 301+), declaring 11 tokens — glass surface (4), accent (1), text (2), geometry (2), typography (2 aliasing next/font outputs).
- .glass-surface utility class added in @layer components consuming all four glass tokens via var() with backdrop-filter blur+saturate and -webkit prefix.
- @supports not feature query covers both unprefixed and -webkit-backdrop-filter, falling back to opaque rgba(28, 25, 23, 0.92).
- Three ambient keyframes (ambientA, ambientB, ambientC) declared with canonical transforms from the design bundle (translate(40px, 30px) scale(1.15) NOT 60px).
- prefers-reduced-motion guard for .ember-ambient-blob colocates the motion contract with the keyframes.

## Task Commits

Each task was committed atomically:

1. **Task 1: Swap body font Space_Grotesk → Inter and rename next/font CSS variables** — `f7223189` (feat)
2. **Task 2: Append Ember Glass :root tokens, .glass-surface utility, @supports fallback, and ambient keyframes to globals.css** — `58e81616` (feat)

## Files Created/Modified

### Modified

- `app/fonts.ts` — Replaced `Space_Grotesk` import with `Inter`, renamed `outfit.variable` from `--font-display` → `--font-display-outfit`, added `inter` export with `--font-body-inter`. Removed `spaceGrotesk` export (Plan 02 updates `app/layout.tsx` to use `inter`).
- `app/globals.css` — Appended 63 lines (lines 301-363 in the file post-edit) immediately after the `@theme` closing brace at line 300. New content: header comment, `:root` block with 11 Ember Glass tokens, `@layer components { .glass-surface { ... } }`, `@supports not (...)` fallback, three `@keyframes` declarations, and `@media (prefers-reduced-motion: reduce)` guard. The existing `@theme` block (including the legacy literal-string `--font-display: 'Outfit'` and `--font-body: 'Space Grotesk'` declarations at lines 209-210) was left UNTOUCHED per D-03 additive policy. No existing `@layer components` utilities (`glass-dark`, `glass-vibrancy`, `glass-shine`) were modified.

### Token Block (verbatim)

```css
:root {
  --glass-bg: rgba(255, 255, 255, 0.04);
  --glass-blur: 24px;
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.18), inset 0 0 0 0.5px rgba(255, 255, 255, 0.03);
  --accent: oklch(0.68 0.17 45);
  --text-1: #f5f5f4;
  --text-2: rgba(245, 245, 244, 0.55);
  --r-card: 24px;
  --pad-card: 16px;
  --font-display: var(--font-display-outfit), system-ui, sans-serif;
  --font-body:    var(--font-body-inter),    system-ui, sans-serif;
}
```

## Decisions Made

None beyond locked decisions D-01..D-19 in 174-CONTEXT.md. Plan executed exactly as written.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Cross-Plan Notes (Wave 1 Concurrency)

- Plan 174-02 ran in parallel and created `app/components/EmberGlass/__tests__/AmbientBg.test.tsx` (commit `0bb9f461`). That file is owned by Plan 02 and is unrelated to this plan's diff; it appears in `git log` between this plan's two commits because the two executors interleaved on the shared branch. Confirmed: this plan only touched `app/fonts.ts` and `app/globals.css`.
- `app/layout.tsx` still imports `spaceGrotesk` and references the old `--font-display` literal (it has the legacy `font-display.variable` class binding from `app/fonts.ts`). Plan 02 owns that file and is responsible for switching to the renamed `inter` export.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 174-02 (Ambient BG + pre-paint script) and Plan 174-03 (Design System v2 page) can now consume the new tokens.
- Cascade order verified: new `:root` block at line 301+ appears AFTER `@theme` closing brace at line 300, so `--font-display: var(--font-display-outfit), ...` wins over legacy `--font-display: 'Outfit', system-ui, sans-serif` at line 209.
- Verification gate for DS-04 (zero requests to fonts.googleapis.com / fonts.gstatic.com) deferred to Plan 174-03 Playwright smoke test as planned.

## Self-Check: PASSED

- `app/fonts.ts` exists with new content (verified via Read after Write)
- `app/globals.css` contains "EMBER GLASS TOKENS" header (1 match), 13 token declarations (>= 11 required), 2 `.glass-surface` occurrences, `@supports not ((backdrop-filter` block, three `@keyframes ambientA/B/C`, and canonical `translate(40px, 30px) scale(1.15)`
- Commits f7223189 and 58e81616 confirmed via `git log`
- No file deletions in either commit (`git diff --diff-filter=D` returned empty)
- `npm run test:changed` passed (7/7 tests in AmbientBg.test.tsx — created by Plan 02 — passed; no regressions on app/fonts.ts importers)

---
*Phase: 174-ember-glass-tokens-foundations*
*Completed: 2026-04-27*
