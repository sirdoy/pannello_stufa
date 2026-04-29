---
phase: 178-per-device-modal-sheets
plan: 04
subsystem: ui

tags: [ember-glass, sheets, stove, thermorossi, react-compiler]

requires:
  - phase: 175-glass-primitives-press-animation-sheet
    provides: "<Sheet> primitive (open/onClose/title), z-index 200/201, scroll-lock — consumed unmodified by StoveCard"
  - phase: 176-post-auth0-splash-animation
    provides: "<FlameViz on intensity> primitive — used in StoveSheet hero block"
  - phase: 177-equal-size-dashboard-glass-cards
    provides: "<StoveCard> with useState<boolean> + <Sheet> wrapper that mounts SheetPlaceholderBody (replaced by StoveSheet in a later plan)"
  - phase: 178-per-device-modal-sheets
    provides: "Wave-1 sheet sub-primitives (SheetRow, Stepper, SheetBtn) consumed by StoveSheet"

provides:
  - "StoveSheet body component (SHEET-02) — the per-stove modal sheet rendered inside the dashboard <Sheet>"
  - "Bundle-verbatim hero block + 'In funzione'/'Spenta' state caps + 54px {powerLevel}/5 display"
  - "Two SheetRows wired to handlePowerChange / handleFanChange via Stepper synthetic-event wrap"
  - "Primary action button with disabled 'Manutenzione richiesta' state mitigating T-178-04-01"
  - "First-load skeleton (D-26) + error fallback (D-27) for the stove sheet body"

affects:
  - "Plan 178-09: Card swap that replaces <SheetPlaceholderBody phase=\"178\" device=\"stove\"/> with <StoveSheet/> in StoveCard"
  - "Phase 179: Rooms tab — reuses the same Stepper synthetic-event wrap pattern documented in StoveSheet"

tech-stack:
  added: []
  patterns:
    - "Field adapter at top of sheet body (mirrors SonosCard.tsx:41-50) — maps live hook fields to local variables before rendering, hides bundle/live shape drift"
    - "Stepper synthetic-event wrap — onChange={(v) => void cmds.handleX({ target: { value: String(v) } })}, replicable in Phase 179"
    - "Body-only sheet component with no props (D-04) — self-fetches via existing data + commands hooks; calling card owns the open state"
    - "Two-branch render shortcut (loading skeleton OR error block OR full body) at the top of the function — keeps the main JSX tree linear"

key-files:
  created:
    - "app/components/EmberGlass/sheets/__tests__/StoveSheet.test.tsx — 12 jest cases covering on/off/needsMaintenance/loading/error + Stepper + primary action + Orari/Manutenzione"
  modified:
    - "app/components/EmberGlass/sheets/StoveSheet.tsx — replaced Plan 178-02 stub with full bundle-verbatim implementation"

key-decisions:
  - "Drop hero footnote entirely (Pitfall 11) — useStoveData has no temp/target/pelletPercent; bundle's '°C' display replaced with semantic {powerLevel}/5 (mirrors Phase 177 StoveCard A-01 deviation)"
  - "Use literal route strings '/stove/scheduler' + '/stove/maintenance' (Pitfall 2) — STOVE_ROUTES exposes API-route keys, not the UI page routes"
  - "Sheet sub-primitives stay bare buttons (D-24) — no <Pressable> wrap; data-sheet-focusable='true' attribute applies the global focus-ring rule from app/globals.css"
  - "JSDoc rephrased to 'manual memoization hooks' (instead of 'useMemo/useCallback') so the acceptance grep gate (`! grep useMemo|useCallback`) passes — runtime behaviour unchanged"

patterns-established:
  - "TDD inside parallel worktree: RED commit lands cleanly, GREEN may end up bundled inside another agent's commit (the file diff is what matters, not the commit attribution)"
  - "Acceptance grep gates on documentation strings drive prose phrasing — when the gate forbids 'useMemo|useCallback' anywhere, JSDoc must use synonyms"

requirements-completed: [SHEET-02]

# Metrics
duration: ~30min
completed: 2026-04-29
---

# Phase 178 Plan 04: StoveSheet Summary

**Bundle-verbatim StoveSheet body wired to `useStoveData` + `useStoveCommands` with FlameViz hero, Power/Fan steppers, scheduler/maintenance navigation, and a needsMaintenance-gated ignite/shutdown primary action.**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-04-29T10:30:00Z (approx — agent spawn time)
- **Completed:** 2026-04-29T10:59:24Z
- **Tasks:** 1 (TDD: RED → GREEN, no REFACTOR needed)
- **Files modified:** 1
- **Files created:** 1

## Accomplishments

- StoveSheet body fully replaces the Plan 178-02 stub with a bundle-verbatim implementation lifted from `.planning/inbox/ember-glass-design/project/components/sheets.jsx:67-130` minus the dropped temperature/target/pellet hero footnote.
- Field adapter at the top of the file maps live hook fields to local variables (`stoveData.isAccesa`, `stoveData.powerLevel ?? 1`, `stoveData.fanLevel ?? 1`, `stoveData.needsMaintenance`) so the bundle visual contract works against the real `UseStoveDataReturn` shape.
- Two SheetRows wire `Stepper` ± to `handlePowerChange` / `handleFanChange` via the synthetic-event wrap (`{ target: { value: String(v) } }`).
- 2-col `SheetBtn` grid navigates to `/stove/scheduler` and `/stove/maintenance` via literal route strings (Pitfall 2).
- Primary action toggles between "Accendi stufa" (calls `handleIgnite`) and "Spegni stufa" (calls `handleShutdown`); when `needsMaintenance` is true, the button is disabled with copy "Manutenzione richiesta" — server-side maintenance gate is the second line of defense (T-178-04-01 mitigation).
- D-26 first-load skeleton block and D-27 unreachable-fallback (TriangleAlert + "Non raggiungibile. Riprova più tardi." + verbatim `errorDescription` secondary line).
- 12/12 jest cases pass; `npx tsc --noEmit` reports zero errors inside `app/components/EmberGlass/sheets/`.

## Task Commits

1. **RED — failing StoveSheet jest spec (12 cases)** — `bf1c9545` (`test(178-04): add failing StoveSheet jest spec (SHEET-02)`)
2. **GREEN — StoveSheet implementation** — committed inside `3d51f710` (file diff is correct; see Deviations §1 for attribution detail)

_TDD gate sequence in git log: RED `bf1c9545` precedes GREEN `3d51f710`._

## Files Created/Modified

- **Created:** `app/components/EmberGlass/sheets/__tests__/StoveSheet.test.tsx` — 12 jest cases. Mocks `useStoveData`, `useStoveCommands`, `useRouter`, `useUser`, `useVersion`, and `FlameViz`; uses a mutable `stoveDataOverride` to drive the on/off/needsMaintenance/loading/error branches.
- **Modified:** `app/components/EmberGlass/sheets/StoveSheet.tsx` — replaces stub with bundle-verbatim implementation (263 LOC).

## Decisions Made

- **Drop hero footnote (Obiettivo + Pellet)** — RESEARCH Pitfall 11 confirms `useStoveData` exposes no `temp`/`target`/`pelletPercent`. The 54px display renders `{powerLevel}/5` (semantic substitute) instead of `{temp}°C`. Mirrors Phase 177 StoveCard A-01 deviation. Documented in CONTEXT D-05 as the "fallback row entirely omitted" branch.
- **Literal route strings for scheduler/maintenance navigation** — `STOVE_ROUTES` in `lib/routes.ts` exposes API-route keys (`STOVE_ROUTES.ignite`, etc.), not the UI page routes. Pitfall 2 instructs to use `'/stove/scheduler'` and `'/stove/maintenance'` directly.
- **Bare buttons (no `<Pressable>` wrap) on sheet sub-primitives** — D-24 makes the deliberate distinction that sheet sub-primitives are not "glass surfaces" and therefore don't fall under SC-#1's Pressable mandate. The `data-sheet-focusable="true"` attribute is what carries the focus-ring rule.
- **JSDoc rewritten to avoid the literal terms `useMemo`/`useCallback`** — the plan's acceptance grep gate is strict (no occurrences anywhere in the file). The original draft said "no useMemo / useCallback" inside the docstring, which tripped the gate; rephrased to "no manual memoization hooks" with identical meaning.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Acceptance grep gate failed on JSDoc literals**

- **Found during:** Task 1 verification step
- **Issue:** The plan's acceptance criterion `! grep -E "useMemo|useCallback" app/components/EmberGlass/sheets/StoveSheet.tsx` failed because the implementation's JSDoc explained the React Compiler discipline by writing the literal terms (`* RC-clean (D-33): no useMemo / useCallback. ...`).
- **Fix:** Rephrased the JSDoc line to `* RC-clean (D-33): no manual memoization hooks. React Compiler 1.0 auto-memoizes — manual memo hooks are forbidden in this namespace.` Same semantic content; zero matches against the grep gate.
- **Files modified:** `app/components/EmberGlass/sheets/StoveSheet.tsx`
- **Verification:** `grep -cE "useMemo|useCallback" app/components/EmberGlass/sheets/StoveSheet.tsx` returns `0`. `grep -cE "STOVE_ROUTES\.scheduler|STOVE_ROUTES\.maintenance"` also returns `0`. 12/12 jest cases still green.
- **Committed in:** part of GREEN commit `3d51f710` (the rephrasing landed before the GREEN write completed and was committed atomically).

### Process Deviations (no code impact)

**1. Parallel-worktree commit attribution drift**

The git worktree filesystem is shared with parallel executors for Plans 178-06 (LightsSheet) and 178-08 (PlugsSheet). When this agent ran `git commit -m "feat(178-04): ..."` for the GREEN gate, the parallel Plan 178-08 agent had simultaneously staged its own GREEN commit. The result is that StoveSheet.tsx's full GREEN diff (263 LOC) shipped inside commit `3d51f710` whose subject reads `feat(178-08): implement PlugsSheet body (SHEET-06 GREEN)`. The file content at HEAD is correct (verified by 12/12 jest pass + zero diff vs HEAD); the commit attribution is mislabelled. This is the documented risk in `<parallel_execution>` — flagged here so verifiers don't miss the StoveSheet GREEN by searching for `feat(178-04):` only.

- **Impact:** None on runtime; SUMMARY.md and this commit log fully reconstruct the gate sequence.
- **Mitigation:** None applied — destructive history rewrites are forbidden in worktree mode and would damage the parallel agent's commit.

---

**Total deviations:** 1 auto-fixed (Rule 1: grep-gate prose mismatch); 1 process note (parallel-worktree commit attribution).
**Impact on plan:** Zero scope creep, zero behavioural divergence. Both deviations are surface-level (prose phrasing + commit subject line) and leave the file content + TDD gate sequence intact.

## Issues Encountered

- **Parallel-worktree filesystem collisions during GREEN staging** — `git status` flickered between showing PlugsSheet.tsx, LightsSheet.tsx, and StoveSheet.tsx as modified depending on which neighbouring agent had just written. The plan executor mitigated by staging files explicitly by name (`git add app/components/EmberGlass/sheets/StoveSheet.tsx`) rather than `git add -A`, and re-checking `git status --short` between commands to catch which files were "mine" vs "theirs" at any given moment.

## User Setup Required

None — no external service configuration, environment variables, or dashboard changes required.

## Next Phase Readiness

- **Plan 178-09 (card swap)** can now replace `<SheetPlaceholderBody phase="178" device="stove"/>` with `<StoveSheet/>` in `app/components/EmberGlass/cards/StoveCard.tsx` — the import path `../sheets/StoveSheet` resolves and the body is fully self-contained.
- **Phase 179 (Rooms tab)** can reuse the documented Stepper synthetic-event wrap pattern (`onChange={(v) => void cmds.handleX({ target: { value: String(v) } })}`) without re-discovering the wrap requirement.

## Threat Flags

None — the sheet introduces no new network surface or schema changes. Existing T-178-04-01 (ignite while needsMaintenance) is mitigated by `disabled={needsCleaning}` + the existing server-side maintenance gate in `useStoveCommands.handleIgnite`.

## Self-Check: PASSED

- StoveSheet.tsx exists at HEAD (263 LOC, exceeds min 120) — verified via `wc -l`.
- StoveSheet.test.tsx exists at HEAD (208 LOC, exceeds min 130) — verified via `wc -l`.
- 12/12 jest cases pass — verified via `npx jest app/components/EmberGlass/sheets/__tests__/StoveSheet.test.tsx`.
- Zero `useMemo|useCallback` occurrences in StoveSheet.tsx — verified via `grep -cE`.
- Zero `STOVE_ROUTES.scheduler|STOVE_ROUTES.maintenance` occurrences — verified via `grep -cE`.
- All 20 acceptance strings (Italian copy + testids + literal routes) present — verified via per-string grep loop.
- RED commit `bf1c9545` reachable from HEAD — verified via `git log --oneline -5`.
- GREEN commit `3d51f710` (containing StoveSheet.tsx full diff) reachable from HEAD — verified via `git log --all --oneline app/components/EmberGlass/sheets/StoveSheet.tsx`.

---
*Phase: 178-per-device-modal-sheets*
*Plan: 04 (StoveSheet)*
*Completed: 2026-04-29*
