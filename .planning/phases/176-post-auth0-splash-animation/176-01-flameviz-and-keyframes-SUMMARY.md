---
phase: 176-post-auth0-splash-animation
plan: 01
subsystem: ui
tags: [react, ember-glass, css-keyframes, animation, splash, presentational-primitive]

# Dependency graph
requires:
  - phase: 174-ember-glass-tokens-foundations
    provides: "Phase 174 tokens (--accent, --text-2, --font-display) and the EmberGlass/ namespace + AmbientBg primitive convention (inline-style + AUDIT-EXCEPTION tagging + 'use client' boundary)."
  - phase: 175-glass-primitives-press-animation-sheet
    provides: "Phase 175 EmberGlass barrel scaffolding (Pressable + Sheet exports) that this plan extends without disturbing."
provides:
  - "FlameViz pure presentational primitive (app/components/EmberGlass/FlameViz.tsx) — verbatim port of bundle cards.jsx:109-129 with data-flame-viz='true' wrapper attribute."
  - "FlameViz Jest unit suite (4 tests) covering on/off animation + box-shadow, intensity scaling, data-attribute presence."
  - "Two new CSS keyframes in app/globals.css: @keyframes pulse (splash badge dot heartbeat) and @keyframes flamePulse (FlameViz inner-flame breathing)."
  - "Phase-176-specific reduced-motion @media guard suppressing both animations on splash badge dot and FlameViz wrappers."
  - "EmberGlass barrel re-exports FlameViz + FlameVizProps."
affects:
  - 176-02-splash-presentational  # Plan 02 imports <FlameViz on intensity={0.95}/> inside Splash.tsx
  - 176-03-splash-gate-and-wiring  # Plan 03 consumes the barrel re-export indirectly via <Splash>
  - 177  # Phase 177 StoveCard reuses FlameViz for DASH-02 (CONTEXT.md D-03 lockdown — no other v20.0 phase may redefine FlameViz)

# Tech tracking
tech-stack:
  added: []  # No new dependencies — pure CSS + React component
  patterns:
    - "AUDIT-EXCEPTION-as-trailing-inline-comment: hex literals carry '// AUDIT-EXCEPTION (DS-02): <reason> — bundle <file>:<line>' on the SAME line as the literal so the DS-02 grep gate (grep hex | grep -v AUDIT-EXCEPTION) returns 0."
    - "Bundle-verbatim port with data-* hook for global CSS overrides: data-flame-viz='true' on the wrapper enables [data-flame-viz='true'] > div { animation: none } reduced-motion override without per-consumer wiring."
    - "Top-level @keyframes append (NOT inside @layer utilities) — mirrors the Phase 174 ambientA/B/C convention at globals.css:347-358."

key-files:
  created:
    - app/components/EmberGlass/FlameViz.tsx
    - app/components/EmberGlass/__tests__/FlameViz.test.tsx
  modified:
    - app/globals.css
    - app/components/EmberGlass/index.ts

key-decisions:
  - "Inline trailing comment for AUDIT-EXCEPTION (not preceding-line) — required so the verification grep that excludes AUDIT-EXCEPTION matches lines, not comment-paragraphs."
  - "Append keyframes at top-level after the trailing @layer utilities block (line 1571), matching the Phase 174 ambient keyframes convention. NOT inside any @layer (so they remain valid Tailwind v4 globals)."
  - "Reduced-motion override targets data-flame-viz='true' wrapper > div (NOT inner divs by class), so Phase 177 StoveCard inherits the override automatically without per-consumer wiring."
  - "FlameViz does NOT consume forwardRef (UI-SPEC: 'no need for ref; orchestrator drives via props'). Locked."
  - "FlameViz does NOT accept a reducedMotion prop (UI-SPEC: 'parent <Splash> is responsible'). Reduced-motion suppression is global-CSS-driven via the data-flame-viz attribute."

patterns-established:
  - "EmberGlass primitive add: new-file + colocated __tests__/<Name>.test.tsx + barrel append (2 lines: named export + type export). Plans 176-02 and 176-03 will follow this exact 3-edit shape for Splash and SplashGate."
  - "AUDIT-EXCEPTION trailing-comment placement: the DS-02 grep gate excludes lines containing 'AUDIT-EXCEPTION', so the tag MUST live on the same line as the hex literal. Future EmberGlass primitives with bundle-verbatim hex literals must follow this placement to pass the gate."
  - "CSS keyframe append + companion @media guard pair: when a primitive references a keyframe, ship the keyframe + reduced-motion override together (mirrors Phase 174 ambient block at globals.css:346-363)."

requirements-completed:
  - SPLASH-02

# Metrics
duration: ~12min
completed: 2026-04-27
---

# Phase 176 Plan 01: FlameViz and Keyframes Summary

**FlameViz presentational primitive + two missing CSS keyframes (`pulse`, `flamePulse`) added so Plans 02/03 can import the bundle's splash animation surface verbatim.**

## Performance

- **Duration:** ~12 min
- **Completed:** 2026-04-27T15:06:55Z
- **Tasks:** 3 / 3
- **Files modified:** 4 (2 created, 2 edited)

## Accomplishments
- Verbatim port of bundle `cards.jsx:109-129` into `app/components/EmberGlass/FlameViz.tsx` with full Phase 174 token reuse (`var(--accent)` + `color-mix` for the inner gradient and outer glow) and 3 AUDIT-EXCEPTION-tagged hex literals (`#6a1a00`, `#fff5c0`, `#ffd27a`).
- 4-test Jest unit suite (`__tests__/FlameViz.test.tsx`) — all 4 tests green: on={true} animation+glow, on={false} no animation/no shadow, intensity scaling (0.6 → 51.2px, 0.95 → 62.4px), data-flame-viz attribute presence.
- Two new CSS keyframes appended to `app/globals.css` at top level (NOT inside any `@layer`): `pulse` (splash badge dot heartbeat) and `flamePulse` (FlameViz inner-flame breathing) — both referenced verbatim by the bundle and previously missing (verified 2026-04-27 via grep).
- Companion Phase 176 `@media (prefers-reduced-motion: reduce)` guard added that suppresses both animations on `[data-testid="splash-badge"] > div:first-child` (consumed by Plan 02) and `[data-flame-viz="true"] > div` (consumed by FlameViz now and Phase 177's StoveCard later).
- EmberGlass barrel (`app/components/EmberGlass/index.ts`) extended from 5 → 7 lines: `FlameViz` + `FlameVizProps` exports added without disturbing existing `Pressable`/`Sheet`/`AmbientBg` exports. `Splash` and `SplashGate` exports correctly deferred to Plans 02/03.

## Task Commits

Each task was committed atomically with `--no-verify` (parallel-executor worktree convention):

1. **Task 1: FlameViz primitive (verbatim bundle port) + Jest unit tests** — `2fdb2d3f` (feat)
2. **Task 2: Append @keyframes pulse + @keyframes flamePulse + reduced-motion guard to globals.css** — `42f1dcd7` (feat)
3. **Task 3: Add FlameViz exports to EmberGlass barrel index.ts** — `291b5108` (feat)

## Files Created/Modified
- `app/components/EmberGlass/FlameViz.tsx` (created, 79 LOC) — Pure presentational primitive ported verbatim from bundle `cards.jsx:109-129`. Two stacked `<div>`s inside a 64×80 wrapper; outer flame uses 3-stop oklab `var(--accent)` gradient with optional accent-tinted glow `box-shadow`; inner flame tip uses bundle-verbatim yellow gradient. `data-flame-viz="true"` on wrapper for global reduced-motion targeting. No `forwardRef`, no `reducedMotion` prop (consumer-controlled via parent `<Splash>` and global CSS).
- `app/components/EmberGlass/__tests__/FlameViz.test.tsx` (created, 30 LOC) — 4 Jest unit tests mirroring `AmbientBg.test.tsx` render-and-assert convention.
- `app/globals.css` (modified, +23 LOC at end) — Two new top-level `@keyframes` blocks plus a companion `@media (prefers-reduced-motion: reduce)` block. Existing `pulse-ember`, `glow-pulse`, `ambient[ABC]`, `.ember-ambient-blob` rules untouched.
- `app/components/EmberGlass/index.ts` (modified, +2 LOC at end) — Barrel re-exports FlameViz + FlameVizProps. Final file is 7 lines.

## Decisions Made
- **Inline trailing AUDIT-EXCEPTION comment placement** — initial draft had the AUDIT-EXCEPTION on the line BEFORE the hex literal; the verification gate `grep '#hex' | grep -v AUDIT-EXCEPTION` would have returned 2 (not 0). Moved the comment to the same line as the literal so the gate passes cleanly. This placement is now documented as the project convention for EmberGlass primitives with bundle-verbatim hex literals.
- **Top-level keyframe append** — kept the new keyframes outside the trailing `@layer utilities` block so they match the Phase 174 ambient keyframes convention (lines 347-358) and remain valid global Tailwind v4 keyframes.
- **No `forwardRef` / no `reducedMotion` prop on FlameViz** — locked per UI-SPEC; keeps the primitive zero-cost and consumer-controlled. Reduced-motion suppression is global-CSS-driven via `data-flame-viz` attribute.

## Deviations from Plan

None — plan executed exactly as written, with one minor in-task adjustment:

### Auto-fixed Issues

**1. [Rule 1 - Bug] AUDIT-EXCEPTION comment placement**
- **Found during:** Task 1 (FlameViz primitive) self-verification
- **Issue:** First draft placed `// AUDIT-EXCEPTION (DS-02): ... bundle cards.jsx:117` on the line PRECEDING the hex literal (`#6a1a00`). The plan's `<verification>` block specifies `grep '#hex' app/components/EmberGlass/FlameViz.tsx | grep -v AUDIT-EXCEPTION | wc -l` MUST return 0 — with the comment on the previous line, that grep would have returned 2 (one for each gradient line containing a hex without the AUDIT-EXCEPTION substring on the same line).
- **Fix:** Moved both AUDIT-EXCEPTION comments inline as trailing comments on the same line as the hex literal. Tests still pass (4/4); gate now returns 0.
- **Files modified:** `app/components/EmberGlass/FlameViz.tsx`
- **Verification:** `grep -E '#[0-9a-fA-F]{3,8}\b' app/components/EmberGlass/FlameViz.tsx | grep -v AUDIT-EXCEPTION | wc -l` returns `0`.
- **Committed in:** `2fdb2d3f` (Task 1 commit — fix applied before commit, so the only commit-visible state is the corrected version).

---

**Total deviations:** 1 auto-fixed (1 bug — pre-commit verification failure averted).
**Impact on plan:** No scope creep. The fix was a placement adjustment within the same content the plan specified.

## Issues Encountered

- **Worktree base reset on agent startup.** The `<worktree_branch_check>` step detected `ACTUAL_BASE` was `ec305afe75ed5174b26cf7450c6a82cdae985e7d` (a stale parallel-wave branch) instead of the expected `b6e7a8739b3d7cc8fb4af075a5ce79873c03a526`. Hard-reset performed before any task work began — the only work that landed in commits is the work this plan specifies. No data loss.
- **Bash subshell flakiness** during one of the Task 2 verification grep runs returned silent output for a multi-`&&` chained command. Repeating the same checks in fresh `bash -c '...'` subshells produced clean exit codes (`0` for all). All Task 2 acceptance criteria verified individually and via the plan's `<verify><automated>` block.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **Plan 02 (`176-02-splash-presentational`)** can now `import { FlameViz } from '@/app/components/EmberGlass'` to mount the flame inside `<Splash>` (`<FlameViz on intensity={0.95} />` per UI-SPEC). The `pulse` keyframe is also ready for the splash badge status dot.
- **Plan 03 (`176-03-splash-gate-and-wiring`)** can now wire `<SplashGate>` over `{children}` in `ClientProviders.tsx`; the `<FlameViz>` consumed by the splash will breathe correctly via `flamePulse`.
- **Phase 177 StoveCard (DASH-02)** has its FlameViz import path locked. CONTEXT.md D-03 prohibition ("No other v20.0 phase is allowed to redefine FlameViz") is now enforceable — the primitive ships once here.
- **No blockers.** All 4 verification checks from the plan pass cleanly:
  1. `npm run test:components -- FlameViz.test.tsx` → 4/4 green
  2. `grep -c '^@keyframes flamePulse' app/globals.css` → `1`
  3. `grep -c '^@keyframes pulse ' app/globals.css` → `1`
  4. `grep -c FlameViz app/components/EmberGlass/index.ts` → `2`
  5. AUDIT-EXCEPTION DS-02 gate (`grep -E '#[0-9a-fA-F]{3,8}' FlameViz.tsx | grep -v AUDIT-EXCEPTION | wc -l`) → `0`

## Self-Check: PASSED

Verified post-write:
- FOUND: `app/components/EmberGlass/FlameViz.tsx`
- FOUND: `app/components/EmberGlass/__tests__/FlameViz.test.tsx`
- FOUND: keyframes `pulse` and `flamePulse` in `app/globals.css`
- FOUND: barrel exports `FlameViz` + `FlameVizProps` in `app/components/EmberGlass/index.ts`
- FOUND: commits `2fdb2d3f`, `42f1dcd7`, `291b5108` in `git log`
- VERIFIED: `npm run test:components -- FlameViz.test.tsx` exits 0 (4/4 tests pass)
- VERIFIED: AUDIT-EXCEPTION DS-02 grep gate returns `0` untagged hex literals

---
*Phase: 176-post-auth0-splash-animation*
*Plan: 01-flameviz-and-keyframes*
*Completed: 2026-04-27*
