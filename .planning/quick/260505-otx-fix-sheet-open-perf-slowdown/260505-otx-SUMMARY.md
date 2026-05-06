---
phase: quick-260505-otx
plan: 01
subsystem: ember-glass
tags: [perf, sheet, ambient-bg, backdrop-filter, css]
requires: [eda20aba]
provides:
  - "Sheet open animation no longer transitions backdrop-filter (paint cost collapses)"
  - "AmbientBg keyframes pause while body[data-sheet-open=true]"
affects:
  - app/components/EmberGlass/Sheet.tsx
  - app/globals.css
tech-stack:
  added: []
  patterns:
    - "data-sheet-open attribute as compositor-pause hinge (cascade reuse)"
    - "opaque rgba background as backdrop-filter substitute (mirrors @supports fallback)"
key-files:
  created: []
  modified:
    - app/components/EmberGlass/Sheet.tsx
    - app/globals.css
decisions:
  - "Drop backdrop-filter from backdrop transition AND remove container backdrop-filter entirely; visual parity preserved by bumping container background from rgba(0.85) to rgba(0.92)"
  - "Pause AmbientBg via CSS animation-play-state on existing body[data-sheet-open=true] hinge (zero JS, zero new lifecycle)"
  - "Defer Fix B (de-duplicate device hooks across card+sheet) — reverses Phase 178 D-04 contract; A+C win deemed sufficient"
  - "Defer Fix D (rAF body-style writes) — marginal; revisit only if profiling shows residual jank"
metrics:
  tasks-completed: 2
  duration: ~6min
  completed: 2026-05-06
---

# Quick Task 260505-otx: Fix Sheet-Open Perf Slowdown — Summary

Surgical perf fix: eliminated the two stacked, animated `backdrop-filter` layers (Sheet backdrop + Sheet container) that the user perceived as a "vertiginous" slide-in slowdown, and paused the three full-viewport `AmbientBg` blob keyframes while any Sheet is open so the compositor isn't re-rasterizing a triple-blurred stack on every frame. Implements RESEARCH §Fix-A and §Fix-C; Fixes B and D explicitly deferred.

## Edits Made

### Task 1 — `app/components/EmberGlass/Sheet.tsx` (commit `ae36fd3d`)

Two coordinated changes inside the same component:

1. **Backdrop div (`zIndex: 200`)** — `transition` shrunk from
   `'background .3s, backdrop-filter .3s'` → `'background .3s'`.
   Static `backdropFilter`/`WebkitBackdropFilter` toggle (`open ? 'blur(8px)' : 'none'`)
   left untouched; only the per-frame transition was the cost driver per RESEARCH.

2. **Container div (`zIndex: 201`)** —
   - Deleted `backdropFilter: 'blur(40px) saturate(200%)'` and its WebKit twin.
   - Bumped `background: 'rgba(28, 25, 23, 0.85)'` → `'rgba(28, 25, 23, 0.92)'`
     (mirrors documented `@supports not (backdrop-filter)` fallback at globals.css:340-345).
   - Replaced the two `AUDIT-EXCEPTION (DS-02)` comments on the deleted lines with a
     single perf-rationale comment citing this quick task and the research doc.

Done-criteria evidence:
- `transition: 'background .3s'` present on backdrop, no `backdrop-filter` token in transition string.
- `grep -c 'blur(40px)'` → **0**
- `grep -c 'saturate(200%)'` → **0**
- `grep -c 'rgba(28, 25, 23, 0.92)'` → **1**
- `grep -c 'rgba(28, 25, 23, 0.85)'` → **0**

### Task 2 — `app/globals.css` (commit `919eb98b`)

Single additive CSS rule inserted between the existing `[data-ws-chip]` cascade
(line 399-403) and the reduced-motion guard (now line 414-417):

```css
body[data-sheet-open="true"] .ember-ambient-blob {
  animation-play-state: paused;
}
```

Piggy-backs on `body[data-sheet-open="true"]` which `SheetCounter`'s
`incrementSheetCount`/`decrementSheetCount` already toggle. Zero JS, zero new
lifecycle wiring, kills per-frame triple-blur re-raster while a Sheet is open.

Done-criteria evidence:
- `grep -c 'animation-play-state: paused'` → **1** (line 411)
- New rule sits before the reduced-motion guard which remains structurally unchanged
  (line 414-417 — same shape as before, just shifted down by 9 lines).
- The `[data-bottom-tab]` and `[data-ws-chip]` cascades are byte-for-byte unchanged.

> Sanity-check note on the plan's "+1 vs pre-edit" criterion: total textual
> `data-sheet-open` occurrences went from **3 → 5**, not 4. The extra mention is
> inside the new comment block ("Piggy-backs on body[data-sheet-open=\"true\"]…"),
> which the plan's regex couldn't disambiguate from a selector. Selector count
> increased by exactly 1 (line 410), which is what the criterion was actually
> guarding against — verified via `grep -n 'data-sheet-open' app/globals.css`.

## Verification

```bash
npm test -- app/components/EmberGlass/__tests__/Sheet.test.tsx \
            app/components/EmberGlass/__tests__/SheetCounter.test.ts \
            app/components/EmberGlass/__tests__/AmbientBg.test.tsx
```

**Result:** 3 suites, **28/28 tests passed** (Sheet 14, SheetCounter 7, AmbientBg 7).
The `window.scrollTo` jsdom not-implemented warnings printed to stderr are
pre-existing console noise from the unchanged scroll-restore code at
`Sheet.tsx:62` — they predate this plan and assert nothing.

CLAUDE.md compliance: scoped invocation (rule 8), no `npm test` bare, no
`npm install`, no `npm run build` (rule 4), no commits of `.planning/` docs
(rule 7 — orchestrator handles those).

## Manual Visual Smoke

Not executed in this run (no human in the loop during execution; runtime
`/debug/design-system-v2` evaluation belongs to the verification pass). The
plan's `<verification>` block scopes manual smoke to the orchestrator/user.

Expected behavior per RESEARCH §"Suggested verification steps":
- DevTools Performance recording during open/close should show "Composite Layers"
  + "Paint" bars collapse to <16 ms (down from 300–400 ms purple/green stretches).
- With ambient enabled (`<html data-ambient="on">` via accent-picker), the three
  blobs should be visibly stationary while a Sheet is open and resume motion on
  close.
- Visual parity: container reads as a dark glass surface; bumped 0.92 alpha
  matches the documented `@supports` fallback path.

## Deviations from Plan

### Auto-fixed issues
None. The plan executed exactly as written; both surgical edits applied cleanly,
all done-criteria verified via grep, all scoped tests pass.

### Auth gates
None.

### Scope-boundary observations
- Pre-existing `window.scrollTo` jsdom warnings in `Sheet.tsx:62` are NOT in
  scope (rule: only auto-fix issues caused by the current task's changes).
  Logged here for visibility only — not added to deferred-items.md as they
  predate this plan and don't affect green test status.

## Deferred (per plan §"Out of scope")

- **Fix B — Lift device hooks out of sheet bodies.** Reverses Phase 178 D-04
  ("sheet bodies take no props"). Would halve initial-open network fan-out
  (worst case Sonos: ~20 simultaneous fetches dedup'd). Needs a discuss-phase
  before reversal because D-04 was an architectural constraint, not a perf
  decision. Pick up only if A+C don't fully restore smoothness on throttled
  CPU.
- **Fix D — `requestAnimationFrame`-defer the body-style scroll-lock writes.**
  Marginal win on synchronous reflow at open time; revisit only if profiling
  shows residual jank after A+C ship.
- **Migrating legacy `app/components/ui/Sheet.tsx` and `BottomSheet.tsx`** —
  these still use `backdrop-blur-3xl` Tailwind utilities and would degrade
  similarly under the same conditions, but they're only used in the debug
  page + scheduler interval picker + manual override (not on the dashboard
  hot path), so the perf budget impact is bounded.

## Commits

- `ae36fd3d` — perf(quick-260505-otx): de-fang Sheet backdrop-filter
- `919eb98b` — perf(quick-260505-otx): pause AmbientBg keyframes while sheet is open

## Self-Check: PASSED

- `app/components/EmberGlass/Sheet.tsx` — FOUND, contains `transition: 'background .3s'` and `rgba(28, 25, 23, 0.92)`, no `blur(40px)` / `saturate(200%)`.
- `app/globals.css` — FOUND, contains the new `body[data-sheet-open="true"] .ember-ambient-blob { animation-play-state: paused; }` rule.
- Commit `ae36fd3d` — FOUND in `git log`.
- Commit `919eb98b` — FOUND in `git log`.
- 28/28 scoped tests pass.
