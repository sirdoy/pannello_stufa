---
phase: 181-glass-bottom-tab-bar
plan: 02
subsystem: ui
tags: [navigation, ember-glass, react, next-link, lucide, jest]

# Dependency graph
requires:
  - phase: 175-pressable-sheet
    provides: Pressable polymorphic primitive (as={Link} consumer)
  - phase: 174-ember-glass-tokens
    provides: var(--accent) token + color-mix(in oklab) idiom
provides:
  - "<BottomTabBar /> production component (4-tab glass pill)"
  - "data-bottom-tab=\"true\" selector hook (consumed by Plan 01 globals.css hide rule)"
  - "First in-repo usage of <Pressable as={Link} tabIndex={0}> polymorphic pattern"
  - "EmberGlass barrel re-export of BottomTabBar"
  - "6-spec Jest suite covering tab render, active-state mapping, prefix match, non-tab inactivity, href map, selector hook"
affects: [181-01, 181-03, 181-04, 181-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Polymorphic Pressable as={Link} with explicit tabIndex={0} for focus-visible bridge"
    - "Inline-style + var(--token) discipline (CONTEXT D-02): zero Tailwind visual classes"
    - "usePathname() exact-vs-prefix active-tab detection (mirrors Navbar.tsx idiom)"
    - "data-bottom-tab=\"true\" selector hook for cross-plan globals.css coordination"

key-files:
  created:
    - app/components/EmberGlass/BottomTabBar.tsx
    - app/components/EmberGlass/__tests__/BottomTabBar.test.tsx
  modified:
    - app/components/EmberGlass/index.ts

key-decisions:
  - "tabIndex={0} required on every <Pressable as={Link}> — Pressable.tsx FOCUSABLE_HOSTS only matches string tags so polymorphic Link consumers must opt into data-pressable-focusable manually (RESEARCH Pitfall 3)."
  - "zIndex: 150 chosen to stay strictly below Phase 175 Sheet's 200/201 layers; layered defense via globals.css body[data-sheet-open] hide rule (Plan 01) prevents any z-stacking artifact mid-animation."
  - "Active-state visual contract uses two-layer color-mix glow (60% rim + 50% halo) with 18% accent bg tint — verbatim from CONTEXT D-07."
  - "Non-tab routes (/stove, /lights, /log) intentionally render zero active tabs — covered explicitly by spec #4."

patterns-established:
  - "Polymorphic Pressable + Next.js Link: <Pressable as={Link} href tabIndex={0} aria-current=...>"
  - "data-bottom-tab=\"true\" selector hook for layout-level cross-coordination"
  - "Tab map readonly tuple with const assertion + isActive(pathname, route) helper for exact-vs-prefix matching"

requirements-completed: [NAV-01, NAV-02, NAV-04]

# Metrics
duration: 7min
completed: 2026-05-02
---

# Phase 181 Plan 02: BottomTabBar Summary

**Production glass bottom tab bar with 4 routes (Casa/Stanze/Automazioni/Altro), lucide icons, accent-glow active state, env(safe-area-inset-bottom) safe-area pinning, and 6/6 Jest specs.**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-05-02T20:57:00Z
- **Completed:** 2026-05-02T21:04:00Z
- **Tasks:** 2
- **Files modified:** 3 (1 component, 1 spec, 1 barrel)

## Accomplishments
- `<BottomTabBar />` ships as a zero-arg, `'use client'` named export with verbatim inline-style transcription from `app.jsx:340-379`.
- Active-tab logic implemented per CONTEXT D-05 (exact match for `/`, prefix match for the other three) with non-tab routes intentionally inactive (D-06).
- D-07 visual contract honored: `var(--accent)` color, 18% accent bg tint, two-layer color-mix glow ring (60% rim + 50% halo).
- D-08 / NAV-04 pin in place: `bottom: calc(8px + env(safe-area-inset-bottom))`, left/right 12, zIndex 150.
- First in-repo usage of `<Pressable as={Link} tabIndex={0}>` — RESEARCH Pitfall 3 honored end-to-end.
- 6-spec Jest suite passes 6/6 in ~0.9 s; covers tab render, /-active, prefix-active, non-tab inactivity, href map, selector hook.
- Zero `as any`, zero Tailwind visual classes, zero TypeScript errors involving the new files.

## Task Commits

Each task was committed atomically:

1. **Task 181-02-01: Create BottomTabBar.tsx + barrel export** — `c463a9c3` (feat)
2. **Task 181-02-02: Create BottomTabBar.test.tsx (6 specs)** — `aa31de98` (test)

## Files Created/Modified
- `app/components/EmberGlass/BottomTabBar.tsx` — Glass pill nav component (118 LOC); 4-tab grid with active-state branching, lucide icons, inline styles; consumes `usePathname()` and `<Pressable as={Link}>`.
- `app/components/EmberGlass/__tests__/BottomTabBar.test.tsx` — 6 Jest specs covering D-14 first bullet (4 tabs render, '/' Casa active, /stanze/sala prefix, non-tab inactive, href map, data-bottom-tab attribute).
- `app/components/EmberGlass/index.ts` — Appended `export { BottomTabBar } from './BottomTabBar';` under "Phase 181 — bottom tab bar" comment.

## Decisions Made
- Followed plan as specified — inline-style block, tab map, active-state branches, and Jest spec list all verbatim from the plan.
- No re-export of `AltroRow` from this barrel update (Plan 03 owns that line per plan instructions).
- No re-export of `SheetCounter` (CONTEXT D-10 keeps it internal).

## Deviations from Plan

None — plan executed exactly as written. All 17 grep gates green on first write; all 6 Jest specs green on first run; `tsc --noEmit` reports zero errors involving the new files.

## Issues Encountered

- **Worktree path confusion (operator-side, not a code defect):** Initial Write/Edit calls targeted the project-root absolute path (`/Users/federicomanfredi/Sites/localhost/pannello-stufa/...`) rather than the worktree-rooted path (`/Users/federicomanfredi/Sites/localhost/pannello-stufa/.claude/worktrees/agent-a108a578a39a268e3/...`). Caught immediately when grep gates failed inside the worktree. Resolution: removed the project-root file (`rm app/components/EmberGlass/BottomTabBar.tsx`) and reverted the project-root `index.ts` change (`git checkout --`); re-wrote both edits to the worktree path. Net effect on the project root: zero — `git status` clean both before and after the recovery. Net effect on the worktree branch: the intended files committed atomically (c463a9c3, aa31de98). No code regression, no leaked work.

## User Setup Required

None — no external services or environment variables touched.

## Next Phase Readiness

- `<BottomTabBar />` is mount-ready for Plan 05 (layout swap).
- Plan 01 globals.css `body[data-sheet-open="true"] [data-bottom-tab="true"]` hide rule has its selector hook in place.
- Plan 03 (AltroRow / /altro page) is unblocked — the barrel append point under the "Phase 181 — bottom tab bar" comment is the natural anchor for the AltroRow re-export.
- Plan 04 (any cross-bar coordination) sees no surface contention — this plan touches only the new component, its test, and the barrel.

## Self-Check: PASSED

Verified post-write:

- `app/components/EmberGlass/BottomTabBar.tsx` — FOUND
- `app/components/EmberGlass/__tests__/BottomTabBar.test.tsx` — FOUND
- `app/components/EmberGlass/index.ts` (Phase 181 export line) — FOUND
- Commit c463a9c3 — FOUND in `git log`
- Commit aa31de98 — FOUND in `git log`
- 17/17 acceptance grep gates — green
- 6/6 Jest specs — green (`npx jest app/components/EmberGlass/__tests__/BottomTabBar.test.tsx`)
- `tsc --noEmit` involving new files — zero errors

---
*Phase: 181-glass-bottom-tab-bar*
*Completed: 2026-05-02*
