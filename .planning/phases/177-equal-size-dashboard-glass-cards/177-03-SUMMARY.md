---
phase: 177
plan: 03
subsystem: ember-glass-dashboard-cards
tags: [ember-glass, dashboard-cards, stove, climate, dash-02, dash-03, dash-11, dash-12]
requires:
  - 177-01  # Wave 1 primitives (GlassCard, CardHead, StatusDot, SheetPlaceholderBody)
  - 175     # Pressable (DS-07), Sheet (SHEET-01)
  - 176     # FlameViz (Phase 176 D-03)
  - 174     # Token block (--accent, --glass-bg, --r-card, --pad-card, --text-1, --text-2, --font-display)
provides:
  - StoveCard summary tile (DASH-02) — first interactive dashboard card with FlameViz integration
  - ClimateCard summary tile (DASH-03) — second interactive card with D-16 topology room-name resolution
  - Test patterns for downstream card plans (177-04..06): mock hook + render + assert testid + tap → translateY transform
affects:
  - app/components/EmberGlass/cards/ (new directory continues to grow with subsequent plans)
tech-stack:
  added: []
  patterns:
    - 'Mock useXxxData hook + render + assert via stable data-testid (mirrors Phase 175 Sheet.test.tsx style)'
    - 'Tap → sheet assertion via [role="dialog"] transform check (translateY(110%) closed → translateY(0) open)'
    - 'Inlined D-16 resolveRoomName helper instead of useMemo (RC-clean)'
key-files:
  created:
    - app/components/EmberGlass/cards/StoveCard.tsx
    - app/components/EmberGlass/cards/ClimateCard.tsx
    - app/components/EmberGlass/cards/__tests__/StoveCard.test.tsx
    - app/components/EmberGlass/cards/__tests__/ClimateCard.test.tsx
  modified: []
decisions:
  - 'A-01 deviation accepted in StoveCard: 36px display renders power_level integer with NO °C unit (Thermorossi exposes no ambient temperature; rendering °C would be a semantic lie). Test (a) asserts NO °C substring in DOM near the value.'
  - 'D-16 canonical room-name resolution implemented as inlined pure function `resolveRoomName(z, topology)` (not useMemo, not useCallback per D-28). Fall-through: z.name → topology.rooms.find(r => r.id === z.room_id)?.name → z.room_id.'
  - 'D-25 staleness: `staleness` is StalenessInfo | null (object), NOT a string union. Used `staleness?.isStale ?? false` for the amber-dot toggle (correcting the plan example which suggested string comparison).'
  - 'Sheet open/close assertion: forceMount keeps the dialog mounted always, so tap → sheet checks transform style (translateY(110%) closed → translateY(0) open) plus presence of sheet-placeholder-body testid.'
metrics:
  duration_minutes: ~22
  completed: 2026-04-28
  tasks_completed: 2
  tests_added: 12
  tests_passing: 12
---

# Phase 177 Plan 03: Stove + Climate Glass Cards Summary

Shipped DASH-02 (StoveCard with FlameViz + Italian "Fiamma N · Ventola N" subtitle) and DASH-03 (ClimateCard with D-16 topology-aware room-name resolution and uppercase mode), the first two interactive dashboard tiles built on Wave 1 EmberGlass primitives + Phase 175 Sheet + Phase 176 FlameViz. Both cards mount their own Sheet with a SheetPlaceholderBody (Phase 178 swap) and obey D-28 React Compiler discipline (zero useMemo/useCallback).

## Tasks Completed

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | StoveCard with FlameViz + Sheet wiring (DASH-02) | `e1344da5` | `app/components/EmberGlass/cards/StoveCard.tsx` (+ test, 5 specs) |
| 2 | ClimateCard with zone list + Sheet wiring (DASH-03) | `c34c8edc` | `app/components/EmberGlass/cards/ClimateCard.tsx` (+ test, 7 specs) |

## Hook Signature Confirmations

**`useStoveData({ checkVersion, userId })`** — verified field names against `app/components/devices/stove/hooks/useStoveData.ts:43-93`:

| Field used | Type | Source line |
|------------|------|-------------|
| `isAccesa` | `boolean` | line 153 — `status === 'working' \|\| 'igniting' \|\| 'modulating'` |
| `powerLevel` | `number \| null` | line 115 |
| `fanLevel` | `number \| null` | line 114 |
| `staleness` | `StalenessInfo \| null` (`{ isStale, cachedAt, ageSeconds }`) | line 142-147 |

**Hook-call parity vs legacy `app/components/devices/stove/StoveCard.tsx`:**

```diff
  Legacy: const stoveData = useStoveData({ checkVersion, userId: user?.sub });
  New:    const stove     = useStoveData({ checkVersion, userId: user?.sub });
```

Identical signature — both call `useVersion()` to obtain `checkVersion` and `useUser()` from `@auth0/nextjs-auth0/client` to obtain `user.sub`.

**`useThermostatData()`** — verified field names against `app/components/devices/thermostat/hooks/useThermostatData.ts:70-80`:

| Field used | Type | Source line |
|------------|------|-------------|
| `status.rooms` | `RoomStatus[]` (`{ room_id, temperature?, setpoint?, mode?, heating?, ...open }`) | line 38-47 |
| `status.mode` | `string \| undefined` | line 61 |
| `topology.rooms` | `NetatmoRoom[]` (`{ id, name?, ... }`) | line 14-26 |

**D-16 acceptance:** Confirmed `topology` IS exposed alongside `status` (line 71). The hook flattens v1 /homesdata into NetatmoTopology shape (line 141-147), and v1 /homestatus rooms do not consistently carry `room_name`, so the topology lookup is the canonical source. `resolveRoomName` falls through gracefully.

## A-01 Acceptance — Stove Value Rendered as power_level Integer (No °C)

**Deviation:** Stove value rendered as power_level integer 1..5, no unit superscript.
- **Reason:** Thermorossi's HA proxy exposes only `power_level` (dimensionless 1..5). Rendering a `°C` superscript on a power level would be a semantic lie — bundle's `temp` was mock data.
- **Implementation:** `app/components/EmberGlass/cards/StoveCard.tsx:84` — `{stove.powerLevel ?? '—'}` with no superscript span.
- **Test (a) assertion:** `app/components/EmberGlass/cards/__tests__/StoveCard.test.tsx:54-56` —
  ```ts
  expect(tempEl.textContent).not.toContain('°C');
  expect(tempEl.textContent).not.toContain('°');
  ```
- **Acceptance grep:** `grep -v '^//' StoveCard.tsx | grep -v '^ \*' | grep -c '°C'` returns `0`.

## D-16 Acceptance — Topology Lookup Path Exercised

**Fixture B** (`app/components/EmberGlass/cards/__tests__/ClimateCard.test.tsx:62-82`):
```ts
status:   { rooms: [{ room_id: 'r1', temperature: 22.0, heating: true }], mode: 'manuale' }
topology: { rooms: [{ id: 'r1', name: 'Camera' }] }
```
Asserts: `getByText('Camera')` succeeds, `queryByText('r1')` returns null. The topology fallback path is exercised end-to-end.

**Fixture C** confirms the final fallback to `room_id` is non-fatal: with empty `topology.rooms` and no `name` on the room, `getByText('r1')` succeeds — no crash.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] Plan code used wrong staleness shape**
- **Found during:** Task 1 hook surface inspection.
- **Issue:** Plan example `<action>` block used `stove.staleness === 'stale' || stove.staleness === 'warning'` (string comparison). Actual `useStoveData` exposes `staleness: StalenessInfo | null` — a `{ isStale: boolean, cachedAt, ageSeconds }` object (verified at `useStoveData.ts:72`).
- **Fix:** Changed to `const isStale = stove.staleness?.isStale ?? false` in `StoveCard.tsx:48`.
- **Files modified:** `app/components/EmberGlass/cards/StoveCard.tsx`.
- **Commit:** `e1344da5`.
- **Plan compliance:** Behavior section says "when `staleness >= warning` is true (e.g., `staleness === 'stale'` per the hook)" — the "e.g." caveat preserves the plan's intent: amber dot when stale. The implementation honors that intent against the actual hook surface.

**2. [Rule 2 — Test fidelity] Sheet open/close assertion strategy**
- **Found during:** Task 1 first GREEN run.
- **Issue:** Initial test (c) used `queryByText(/Controlli in arrivo/i)).toBeNull()` to assert closed sheet. Sheet uses `forceMount` (Phase 175 D-13) so the placeholder body stays in the DOM with `translateY(110%)` even when closed. The text-presence assertion failed (text was always present).
- **Fix:** Switched to checking `[role="dialog"]` style transform — same pattern as Phase 175's own `Sheet.test.tsx:51-53`. Closed → translateY(110%); open → translateY(0). Plus presence of `data-testid="sheet-placeholder-body"`.
- **Files modified:** `app/components/EmberGlass/cards/__tests__/StoveCard.test.tsx`, `ClimateCard.test.tsx`.
- **Commit:** Folded into `e1344da5` and `c34c8edc`.

### Architectural Adjustments

None.

## Test Output

```
Test Suites: 3 passed, 3 total
Tests:       22 passed, 22 total
Snapshots:   0 total
Time:        5.075 s
```

(2 of 3 suites are the new card specs — 12 tests; the 3rd suite is the unrelated `CameraMonitoringToggle.test.tsx` matched by the broader testPathPatterns glob.)

**StoveCard suite (5 tests):**
- (a) renders 36px power_level readout with NO °C unit when on (A-01)
- (b) renders Spenta subtitle when off
- (c) clicking card opens sheet (translateY transform)
- (d) renders dash placeholder when powerLevel is null
- (e) StatusDot uses amber stale color when staleness.isStale is true (D-25)

**ClimateCard suite (7 tests):**
- Fixture A: renders zone names from RoomStatus.name + temps + footer + uppercase mode
- Fixture B (D-16): name absent on RoomStatus → resolved via topology.rooms lookup
- Fixture C (D-16 fallback): no name anywhere → falls back to room_id (non-fatal)
- Empty rooms: footer shows 0 di 0 attive
- Caps zones at 4 (slice(0, 4)) but counts all in footer
- Tap → sheet opens (translateY transform)
- Handles status=null gracefully

## Verification Status

- [x] Both card files exist (`app/components/EmberGlass/cards/{StoveCard,ClimateCard}.tsx`)
- [x] All jest tests green (12/12 passing under `npm run test:components`)
- [x] `npx tsc --noEmit` exits 0 for new files (pre-existing errors unchanged in unrelated files)
- [x] No useMemo/useCallback in new code (D-28 — `grep -cE 'useMemo|useCallback'` returns 0 on both)
- [x] No °C unit on StoveCard (A-01 — `grep -c '°C'` after stripping comments returns 0)
- [x] resolveRoomName helper inlined for ClimateCard (D-16 / W6 fix)
- [x] Hook-call signature parity vs legacy stove orchestrator confirmed

## Success Criteria

- [x] DASH-02 satisfied (StoveCard rendered with FlameViz + Italian Fiamma/Ventola subtitle, no °C unit per A-01)
- [x] DASH-03 satisfied (ClimateCard rendered with ≤4 zones + N/M attive footer + D-16 room-name resolution)
- [x] DASH-11 partial (tap → sheet opens with placeholder body for stove + climate; remaining 5 interactive cards land in 177-04..06)
- [x] DASH-12 unchanged (no React Compiler opt-outs introduced)

## Self-Check: PASSED

- FOUND: app/components/EmberGlass/cards/StoveCard.tsx
- FOUND: app/components/EmberGlass/cards/ClimateCard.tsx
- FOUND: app/components/EmberGlass/cards/__tests__/StoveCard.test.tsx
- FOUND: app/components/EmberGlass/cards/__tests__/ClimateCard.test.tsx
- FOUND commit: e1344da5 (Task 1 — StoveCard)
- FOUND commit: c34c8edc (Task 2 — ClimateCard)
