---
phase: 181-glass-bottom-tab-bar
plan: 03
subsystem: ui
tags: [next.js, react, lucide-react, ember-glass, navigation, auth0]

# Dependency graph
requires:
  - phase: 175-ember-glass-redesign
    provides: Pressable + Sheet primitives (DS-07) — AltroRow consumes Pressable as polymorphic Link/anchor host
  - phase: 177-glass-card-primitives
    provides: GlassCard + CardHead primitives — 4 group cards in AltroPage
  - phase: 179-rooms-tab
    provides: RoomsTab page-chrome pattern (paddingTop:70 + 30px display title) — mirrored in AltroPage
  - phase: 180-automations-tab
    provides: app/automazioni/page.tsx route shape (sr-only h1 + section) — mirrored in app/altro/page.tsx
  - phase: 181-02-bottom-tab-bar
    provides: BottomTabBar links 4th tab to /altro — this plan provides the destination
provides:
  - "/altro client route mounting AltroPage"
  - AltroPage body with 4 GlassCard groups (Dispositivi data-driven, Sistema/Impostazioni/Account static)
  - AltroRow polymorphic glass-row primitive (Pressable as={Link or 'a'})
  - ICON_MAP mapping registry icon string keys to lucide components
  - 5 AltroPage Jest specs + 1 /altro route Jest spec
  - Barrel re-export of AltroRow + AltroRowProps from EmberGlass index
affects:
  - 181-04 chip wrapper (parallel; no direct dependency)
  - 181-05 layout swap (will mount BottomTabBar pointing at /altro)
  - 181-06 smoke spec (will navigate to /altro and assert section content)
  - "Future cleanup phase post-182 (legacy hamburger menu deletion)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "AltroRow: Pressable polymorphic Link/anchor with tabIndex={0} for focus-visible accent outline"
    - "AltroPage inline /api/devices/config fetch (legacy Navbar idiom inlined per RESEARCH OQ-1)"
    - "GlassCard groups override aspectRatio: 'auto' for vertical row stacks (Phase 177 default is 1:1)"

key-files:
  created:
    - app/altro/page.tsx
    - app/altro/__tests__/page.test.tsx
    - app/components/EmberGlass/altro/AltroPage.tsx
    - app/components/EmberGlass/altro/AltroRow.tsx
    - app/components/EmberGlass/altro/__tests__/AltroPage.test.tsx
  modified:
    - app/components/EmberGlass/index.ts

key-decisions:
  - "CardHead consumed via real Phase 177 API (Icon/label/tone) — plan/PATTERNS' fictional `title` prop swapped to `label` after verifying CardHead.tsx signature"
  - "Device row href uses items[0].route (the `Controllo` main route) because DeviceNav has no top-level `route` field"
  - "GlassCard group cards override aspectRatio:auto so square dashboard default does not crop the row stack"
  - "Esci row uses external={true} → renders <a href> (Auth0 server redirect) not <Link> (client push)"
  - "Async tests await findByRole as first assertion to flush useEffect setState before sync expectations (avoids act() warning)"

patterns-established:
  - "AltroRow: glass row primitive with Pressable as Link or 'a', leading icon (size 20, sw 1.8), label, flex spacer, trailing ChevronRight (size 18, var(--text-2))"
  - "AltroPage: 4 vertically stacked GlassCard groups (gap 24) using CardHead label + AltroRow children (gap 12)"
  - "Inline fetch idiom for /api/devices/config + getNavigationStructureWithPreferences-driven row list (no shared hook yet — Phase 182 may extract)"

requirements-completed: [NAV-02]

# Metrics
duration: 10m
completed: 2026-05-02
---

# Phase 181 Plan 03: AltroPage + AltroRow + /altro route Summary

**`/altro` client route hosting four GlassCard groups (data-driven Dispositivi from device registry + static Sistema/Impostazioni/Account, including the flame-red `<a href=/auth/logout>` Esci row) plus the `<AltroRow>` glass-row primitive — completes NAV-02's "4 sections route to real pages" claim.**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-05-02T21:09:31Z
- **Completed:** 2026-05-02T21:18:56Z
- **Tasks:** 3 (all autonomous, TDD on tasks 2 + 3)
- **Files created:** 5
- **Files modified:** 1

## Accomplishments
- AltroRow polymorphic glass row primitive (Pressable as Link or anchor) with leading lucide icon, flex spacer and trailing ChevronRight, plus barrel re-export.
- AltroPage with 4 glass groups: Dispositivi (data-driven via /api/devices/config + ICON_MAP), Sistema (Log/Registro/Changelog), Impostazioni (7 EXISTING settings routes only), Account (Esci → /auth/logout, #ff8a4a, external).
- /altro route page mirroring app/automazioni/page.tsx (sr-only h1 + section + AltroPage mount, auth via ClientProviders inheritance).
- 5 AltroPage unit specs + 1 route-level spec, all green.

## Task Commits

Each task was committed atomically (TDD on tasks 2 + 3):

1. **Task 181-03-01: AltroRow primitive + barrel export** — `bf452950` (feat)
2. **Task 181-03-02 RED: AltroPage spec (5 cases)** — `82c9f336` (test)
3. **Task 181-03-02 GREEN: AltroPage implementation** — `9b964e1e` (feat)
4. **Task 181-03-03 RED: /altro route spec** — `2bd6c48a` (test)
5. **Task 181-03-03 GREEN: /altro route page** — `07231dda` (feat)
6. **REFACTOR: await async settle in tests 2-4** — `6b7784bc` (refactor)

## Files Created/Modified
- `app/components/EmberGlass/altro/AltroRow.tsx` — glass row primitive with polymorphic Link/anchor host.
- `app/components/EmberGlass/altro/AltroPage.tsx` — 4-group orchestrator with inline device fetch + ICON_MAP.
- `app/components/EmberGlass/altro/__tests__/AltroPage.test.tsx` — 5 jsdom specs.
- `app/altro/page.tsx` — /altro route page mounting AltroPage.
- `app/altro/__tests__/page.test.tsx` — route-level spec (mocks AltroPage stub).
- `app/components/EmberGlass/index.ts` — appended AltroRow + AltroRowProps re-exports.

## Decisions Made
- **CardHead API mismatch.** PLAN's `<CardHead title="...">` is a fictional prop; the real Phase 177 CardHead requires `Icon`, `label`, `tone`. Used the real API with `label="Dispositivi"` etc. and assigned per-group lucide icons (Boxes / Settings / SlidersHorizontal / User) all toned to `var(--accent)`. This satisfies the spirit of acceptance criterion (4 group titles) while staying compatible with the existing primitive.
- **Device row href: `items[0].route`.** Plan referenced `d.route` but `DeviceNav` from `getNavigationStructureWithPreferences` has no top-level route — routes live in `items[]` (Controllo / Pianificazione / Manutenzione). Used the first item (the main Controllo route).
- **GlassCard aspectRatio override.** Phase 177 GlassCard defaults to `aspectRatio: '1 / 1'` (dashboard square). Group cards passed `style={{ aspectRatio: 'auto' }}` so the vertical row stack is not cropped.
- **Test 1 + Test 3 specificity.** `findAllByText('Dispositivi')` in Test 1 (text appears as both group title and Impostazioni device row label) and `^...$` regex in Test 3 (so `/log/i` does not match `Changelog`).
- **Test act() flushing.** Tests 2/3/4 use `await findByRole(...)` as the first assertion so the inline-fetch useEffect's setState is flushed before synchronous expectations.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] CardHead API mismatch**
- **Found during:** Task 181-03-02 implementation.
- **Issue:** Plan and PATTERNS doc both call `<CardHead title="Dispositivi" />` but `app/components/EmberGlass/CardHead.tsx:18-23` defines `CardHeadProps = { Icon, label, tone, right }` — there is no `title` prop. Confirmed by inspecting all 8 existing CardHead consumers (StoveCard, ClimateCard, LightsCard, SonosCard, RaspiCard, TuyaCard, WeatherCard, CameraCard) — every single one passes Icon/label/tone.
- **Fix:** Used the real API with per-group icons (Boxes/Settings/SlidersHorizontal/User) toned to `var(--accent)`, label set to the Italian group title.
- **Files modified:** `app/components/EmberGlass/altro/AltroPage.tsx`.
- **Verification:** All 5 group-rendering specs pass; tsc clean for `altro/`.
- **Acceptance grep impact:** The plan's `grep -E "title=\"(Dispositivi|Sistema|Impostazioni|Account)\""` would return 0; the spirit-equivalent `grep -E 'label="(Dispositivi|Sistema|Impostazioni|Account)"'` returns 6 (4 group titles + 2 device-row labels). Documented here.
- **Committed in:** `9b964e1e`.

**2. [Rule 3 - Blocking] DeviceNav has no top-level `route` field**
- **Found during:** Task 181-03-02 implementation.
- **Issue:** Plan code uses `d.route` for AltroRow href, but `getNavigationStructureWithPreferences` returns `DeviceNav { id, name, icon, color, items }` — no `route`. The route exists per-NavItem inside `items[]` (Controllo / Pianificazione / etc.).
- **Fix:** Map device → `items[0]?.route ?? ''` and skip rendering when empty.
- **Files modified:** `app/components/EmberGlass/altro/AltroPage.tsx`.
- **Verification:** Test 5 confirms Dispositivi rows hydrate with the mocked items[0].route values; tsc clean.
- **Committed in:** `9b964e1e`.

**3. [Rule 3 - Blocking] GlassCard 1:1 aspect ratio crops row stack**
- **Found during:** Task 181-03-02 implementation.
- **Issue:** Phase 177 `GlassCard` baseStyle pins `aspectRatio: '1 / 1'` for dashboard tiles. A 7-row Impostazioni stack inside a square card would clip.
- **Fix:** Pass `style={{ aspectRatio: 'auto' }}` to all 4 group cards (style is spread after baseStyle, per GlassCard.tsx:88,95).
- **Files modified:** `app/components/EmberGlass/altro/AltroPage.tsx`.
- **Verification:** All 5 specs pass; rendered DOM shows full row stack.
- **Committed in:** `9b964e1e`.

**4. [Rule 1 - Bug] React act() warning in tests 2/3/4**
- **Found during:** Task 181-03-02 GREEN run.
- **Issue:** Render → synchronous assertions completed before the inline-fetch useEffect's `setDevicePreferences` resolved, triggering "An update to AltroPage inside a test was not wrapped in act(...)" warnings (3x). Tests still passed but logs were noisy.
- **Fix:** Each affected test now awaits `findByRole(...)` as its first assertion so React's act() flushing covers the post-effect setState.
- **Files modified:** `app/components/EmberGlass/altro/__tests__/AltroPage.test.tsx`.
- **Verification:** 5/5 specs green, zero console.error output.
- **Committed in:** `6b7784bc`.

**5. [Rule 1 - Bug] /log/i regex matched "Changelog"**
- **Found during:** Task 181-03-02 first GREEN run.
- **Issue:** `getByRole('link', { name: /log/i })` matched both the Sistema "Log" row and the "Changelog" row → "found multiple elements" failure.
- **Fix:** Switched all four spec-3 link queries to exact-match regex (`^log$`, `^registro$`, `^changelog$`, `^esci$`).
- **Files modified:** `app/components/EmberGlass/altro/__tests__/AltroPage.test.tsx`.
- **Verification:** Test 3 passes deterministically.
- **Committed in:** `9b964e1e`.

**6. [Rule 1 - Bug] Test 1 "Dispositivi" matches twice**
- **Found during:** Task 181-03-02 first GREEN run.
- **Issue:** `getByText('Dispositivi')` matched both the group title and the Impostazioni "Dispositivi" row label → "multiple elements" failure.
- **Fix:** Switched to `findAllByText('Dispositivi')` and asserted `length >= 1`.
- **Files modified:** `app/components/EmberGlass/altro/__tests__/AltroPage.test.tsx`.
- **Verification:** Test 1 passes; the duplicate is intentional (Impostazioni group correctly lists `/settings/devices` as "Dispositivi" per UI-SPEC).
- **Committed in:** `9b964e1e`.

---

**Total deviations:** 6 auto-fixed (3 blocking integration mismatches, 3 test-correctness bugs).
**Impact on plan:** All auto-fixes were necessary to get from a fictional plan/spec to a working component on the real codebase. No new scope; no new dependencies. The acceptance criterion for `title="..."` is unsatisfiable with the existing CardHead — verifier should accept the `label="..."` equivalent since group headings render correctly and all 5 unit specs pass.

## Issues Encountered

- **`npm run test:pages` argument routing.** The script targets `__tests__/app` (legacy convention dir), so passing an inline test path under `app/altro/__tests__/` does not include it in the run; the legacy 28 still pass but the new spec is silent. Worked around by running `npm test -- <path>` and `npx jest <path>` per CLAUDE.md rule 8 (scoped subsets). The /altro spec passes 1/1 in both invocations. Not a blocker — the test:pages target is a legacy path filter, unrelated to test correctness.

## User Setup Required

None — no external service configuration touched.

## Self-Check: PASSED

Created files exist:
- FOUND: `app/altro/page.tsx`
- FOUND: `app/altro/__tests__/page.test.tsx`
- FOUND: `app/components/EmberGlass/altro/AltroPage.tsx`
- FOUND: `app/components/EmberGlass/altro/AltroRow.tsx`
- FOUND: `app/components/EmberGlass/altro/__tests__/AltroPage.test.tsx`

Modified files contain expected exports:
- FOUND: `AltroRow` re-export in `app/components/EmberGlass/index.ts`

Commits exist:
- FOUND: `bf452950` (Task 1 feat)
- FOUND: `82c9f336` (Task 2 RED)
- FOUND: `9b964e1e` (Task 2 GREEN)
- FOUND: `2bd6c48a` (Task 3 RED)
- FOUND: `07231dda` (Task 3 GREEN)
- FOUND: `6b7784bc` (REFACTOR)

Tests pass:
- FOUND: `app/components/EmberGlass/altro/__tests__/AltroPage.test.tsx` 5/5 green
- FOUND: `app/altro/__tests__/page.test.tsx` 1/1 green

## Next Phase Readiness

- /altro route is reachable from BottomTabBar's 4th tab (Plan 02 link target → resolved).
- Plan 04 (chip wrapper) and Plan 06 (smoke spec) can proceed in parallel; smoke spec can navigate to /altro and assert the 4 group titles.
- Plan 05 (layout swap) can mount BottomTabBar without breaking the /altro route.

## TDD Gate Compliance

Tasks 2 and 3 followed RED → GREEN → (REFACTOR) discipline:
- Task 2: `82c9f336` (test/RED) → `9b964e1e` (feat/GREEN) → `6b7784bc` (refactor)
- Task 3: `2bd6c48a` (test/RED) → `07231dda` (feat/GREEN)

Task 1 (`bf452950`) was a single feat commit — its `<verify>` clause was tsc-only (no test file in `<files>`); the AltroRow primitive is exercised end-to-end through Task 2's AltroPage specs, which assert leading icon, label, href, and color rendering on the row.

---
*Phase: 181-glass-bottom-tab-bar*
*Plan: 03*
*Completed: 2026-05-02*
