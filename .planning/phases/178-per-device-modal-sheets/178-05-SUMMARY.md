---
phase: 178
plan: 05
subsystem: ember-glass / sheets / climate
tags: [ember-glass, sheets, climate, thermostat, netatmo]
requires: [178-01, 178-02, 178-03]
provides: [SHEET-03]
affects:
  - app/components/EmberGlass/sheets/ClimateSheet.tsx
tech-stack:
  added: []
  patterns:
    - "ThermostatCard debounce pattern (500ms setpoint write)"
    - "zone.kind derivation from topology.modules type"
    - "zone.on derivation from status.rooms[].mode !== 'hg'"
    - "Manuale pill as UI-only affordance (Pitfall 5)"
key-files:
  created:
    - app/components/EmberGlass/sheets/__tests__/ClimateSheet.test.tsx
  modified:
    - app/components/EmberGlass/sheets/ClimateSheet.tsx
decisions:
  - "Manuale pill is UI-only and reflects per-room override (anyRoomManual); does NOT fire setHomeMode (Pitfall 5; TS union also blocks 'manual' at compile time)."
  - "Tipo InlineToggle infers next state from current zone.on: on→setRoomMode('home'); off→setRoomMode('manual'). Avoids assuming InlineToggle's onChange receives a boolean (it receives MouseEvent)."
  - "Destructured { setRoomSetpoint, setHomeMode, setRoomMode } from cmds for stable useEffect deps (checker WARNING 4)."
  - "Wired useThermostatData.refetch only — NOT fetchData/setError (verified absent from return surface)."
  - "Test 7 (cross-zone reset) verified by asserting zero r1 calls after switching to r2 within debounce window."
metrics:
  duration: "7m 54s"
  completed: "2026-04-29T11:00:51Z"
  red-commit: "21bb531f"
  green-commit: "e36c6b84"
---

# Phase 178 Plan 05: ClimateSheet Summary

ClimateSheet body component (SHEET-03 / D-06 / D-20) shipped: bundle-verbatim climate sheet with zone chips, Apple-Home RadialDial, Tipo SheetRow + InlineToggle, and 4-pill Modalità grid wired to `useThermostatCommands` (Wave 1). Setpoint debounced 500ms via `useDebounce`. All 18 jest cases GREEN.

## Tasks Completed

| Task | Name                                            | Commit    | Files                                                                                                       |
| ---- | ----------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------- |
| 1.RED | Failing ClimateSheet spec (18 cases)           | 21bb531f  | app/components/EmberGlass/sheets/__tests__/ClimateSheet.test.tsx                                            |
| 1.GREEN | ClimateSheet body implementation             | e36c6b84  | app/components/EmberGlass/sheets/ClimateSheet.tsx, app/components/EmberGlass/sheets/__tests__/ClimateSheet.test.tsx |

## Behavior Implemented

### Layout (bundle sheets.jsx:131-197)

1. **Zone chip row** — horizontal scroll, 8px gap, `margin: '0 -20px 18px'`. Each chip = 6×6 status dot + zone name; selected chip uses `rgba(94,175,255,0.18)` tint with `#5eafff` text.
2. **`<RadialDial>`** for the selected zone — `value=pendingTarget`, `min=15`, `max=28`, `color="#5eafff"`, `label="{name} · attuale {N.N}°"`.
3. **`<SheetRow label="Tipo">`** with `<InlineToggle on={zone.on} color="#5eafff" />`. Toggle off (currently on) → `setRoomMode(id, 'home')`. Toggle on (currently off) → `setRoomMode(id, 'manual')`.
4. **"Modalità globale"** eyebrow (11px uppercase letterSpacing 1) + 4-column grid pills (Auto/Manuale/Eco/Off). Selected pill matches `homeMode === backend` (or `anyRoomManual` for Manuale).

### Pitfalls Honored

- **Pitfall 5** (Manuale ≠ setHomeMode): `MODE_PILLS` table has `backend: null` for `'Manuale'`; click handler guards `if (p.backend !== null)`. The TS union `SetThermmodeRequest['mode']` excludes `'manual'` at compile time as belt-and-braces.
- **Pitfall 6** (zone.kind/on derivation): `zone.kind` derived from `topology.modules.find(m => m.room_id === r.id).type` (`'NATherm1'` → termostato; otherwise → termovalvola). `zone.on` derived from `status.rooms[].mode !== 'hg'`.
- **Open Q3** (error string): `useThermostatData.error` is `string | null`. Rendered verbatim under "Non raggiungibile. Riprova più tardi." in the error state.
- **Open Q4** (skeleton trigger): `data.loading && data.status === null && data.topology === null`.
- **Pattern 4** (debounce): `pendingTarget` local state → `useDebounce(pendingTarget, 500)` → effect fires `setRoomSetpoint(zone.id, debouncedTarget)` when `debouncedTarget !== zone.target`. Reset effect on `safeIdx`/`zone.id`/`zone.target` change → `setPendingTarget(zone.target)` to prevent cross-zone writes.

### Wiring

- `useThermostatData()` exposes `{ topology, status, loading, error, refetch }` — `fetchData`/`setError` confirmed absent (line ~327 of useThermostatData.ts).
- `useThermostatCommands({ homeId: topology?.home_id ?? '', refetch: data.refetch })` — wave 1 hook.
- Destructured `{ setRoomSetpoint, setHomeMode, setRoomMode } = cmds` for stable `useEffect` dep identity (checker WARNING 4).

### Test Coverage (18 cases)

| # | Test | What it verifies |
|---|------|------------------|
| 1 | Layout sanity | 2 zone chips + RadialDial + Tipo + Modalità label + 4 pills |
| 2 | Zone selection updates label | Click chip 1 → label = "Camera · attuale 19.0°" |
| 3a/3b | Tipo kind | NATherm1 → "Termostato di stanza"; NRV → "Termovalvola radiatore" |
| 4 | zone.on derivation | mode='hg' → InlineToggle aria-checked='false' |
| 5 | Debounce delay | Single + click → no setRoomSetpoint until 500ms elapses |
| 6 | Burst collapse | 5 + clicks then 500ms → exactly one setRoomSetpoint('r1', 25) |
| 7 | Cross-zone reset | Bump r1 then switch to r2 within 500ms → zero r1 setpoint writes |
| 8a-c | Mode mapping | Auto→schedule, Eco→away, Off→hg |
| 9a/b | Manuale pill (Pitfall 5) | Click does NOT call setHomeMode; selected when any room mode='manual' |
| 10a/b | Tipo toggle | Click on→home; click off (mode='hg')→manual |
| 11 | Empty state | 0 rooms → "Nessuna zona configurata" |
| 12 | Loading skeleton | loading+null→null → climate-sheet-skeleton |
| 13 | Error state | error string + null topology → "Non raggiungibile…" + verbatim error |

## Acceptance Criteria

- [x] `ClimateSheet.tsx` exists; `'use client'` present; uses `useThermostatData()` + `useThermostatCommands({ homeId, refetch })`
- [x] `useDebounce(pendingTarget, 500)` invocation present
- [x] Italian labels (Auto / Manuale / Eco / Off / Modalità globale / Termostato di stanza / Termovalvola radiatore / Nessuna zona configurata) all present
- [x] Mode mapping table: Auto→'schedule', Eco→'away', Off→'hg', Manuale→null
- [x] `setRoomMode(zone.id, … ? 'home' : 'manual')` present
- [x] All required data-testids: climate-sheet, climate-sheet-zone-chip-{i}, climate-sheet-radial-wrap, climate-sheet-tipo-toggle, climate-sheet-mode-{auto/manuale/eco/off}, climate-sheet-empty, climate-sheet-skeleton, climate-sheet-error
- [x] `color="#5eafff"` on RadialDial
- [x] `find((sr) => sr.room_id === r.id)` topology+status merge
- [x] `moduleType === 'NATherm1'` kind check
- [x] 18 jest cases (≥13 required) — all GREEN
- [x] **No** `useMemo` / `useCallback` (verified via awk: 0 hits)
- [x] **No** `setHomeMode('manual')` (verified)
- [x] **No** `data.fetchData` / `data.setError` (verified)
- [x] At least 1 `data.refetch` hit (verified)
- [x] **No** `useEffect.*\bcmds\b` — destructured handlers only (verified)
- [x] ClimateSheet.tsx 324 lines (≥180); spec 256 lines (≥160)

## Verification

- `npm test -- app/components/EmberGlass/sheets/__tests__/ClimateSheet.test.tsx`: **18/18 PASS** (1.20s).
- `npx tsc --noEmit` for the two task files: clean (no errors in ClimateSheet.tsx or ClimateSheet.test.tsx). Pre-existing tsc errors in unrelated files (`app/debug/...`, `app/network/...`, `app/network/hooks/...`) are out of scope per scope-boundary rule.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] InlineToggle.onChange signature mismatch**
- **Found during:** GREEN implementation
- **Issue:** Plan example used `onChange={(next) => void setRoomMode(zone.id, next ? 'manual' : 'home')}`, but `InlineToggle.onChange: (e: MouseEvent<HTMLButtonElement>) => void` — the `next` arg would be a MouseEvent, not a boolean. Calling `next ? 'manual' : 'home'` with a truthy MouseEvent would always pass 'manual'.
- **Fix:** Derive next state from current `zone.on`: `onChange={() => void setRoomMode(zone.id, zone.on ? 'home' : 'manual')}`. Test 10a/10b verify both branches.
- **Files modified:** app/components/EmberGlass/sheets/ClimateSheet.tsx (line 257)
- **Commit:** e36c6b84

**2. [Rule 3 - Blocking] Test fixture type widening for null overrides**
- **Found during:** Initial tsc pass after GREEN
- **Issue:** `dataOverride: Partial<typeof baseData>` failed TS2352 when overriding `topology`/`status` to `null` — `baseData.topology` is typed as `Record<string, unknown>` (non-null), so Partial doesn't admit `null`.
- **Fix:** Widened `dataOverride: Record<string, unknown>` so loading/error tests can null-out fields cleanly.
- **Files modified:** app/components/EmberGlass/sheets/__tests__/ClimateSheet.test.tsx (lines 60, 232, 242)
- **Commit:** e36c6b84

**3. [Rule 3 - Doc hygiene] Removed comment-level useMemo/useCallback tokens**
- **Found during:** Acceptance grep validation
- **Issue:** The acceptance criterion `! grep -E "useMemo|useCallback" ClimateSheet.tsx returns no hits` is literal — comment text "No useMemo / useCallback (D-33)" + "useCallback-stable functions" tripped it.
- **Fix:** Reworded comments to "No manual memoization hooks (D-33 — RC-clean)" + "referentially-stable function handles".
- **Files modified:** app/components/EmberGlass/sheets/ClimateSheet.tsx (lines 16, 60-62)
- **Commit:** e36c6b84

## TDD Gate Compliance

- **RED gate:** `test(178-05): add failing ClimateSheet spec (RED)` at `21bb531f` — 18 failing cases against the stub.
- **GREEN gate:** `feat(178-05): implement ClimateSheet body (SHEET-03 GREEN)` at `e36c6b84` — all 18 cases passing.
- **REFACTOR:** Not needed — clean implementation on first GREEN pass.

## Threat Surface Scan

No new network endpoints, auth paths, file access, or schema changes introduced. ClimateSheet only consumes existing hooks (`useThermostatData`, `useThermostatCommands` from Plan 178-03). All threats from the plan's `<threat_model>` are mitigated as designed:
- T-178-05-01: RadialDial clamps 15..28 (verified in primitive); SetRoomThermpointRequest server-side type enforced.
- T-178-05-02: TS union `SetThermmodeRequest['mode']` blocks 'manual'; MODE_PILLS' Manuale entry has `backend: null` checked before fire.
- T-178-05-03: Reset effect on `[safeIdx, zone?.id, zone?.target]` resets `pendingTarget` on zone change (Test 7).

## Self-Check: PASSED

Files verified:
- FOUND: app/components/EmberGlass/sheets/ClimateSheet.tsx (324 lines)
- FOUND: app/components/EmberGlass/sheets/__tests__/ClimateSheet.test.tsx (256 lines)

Commits verified:
- FOUND: 21bb531f (RED)
- FOUND: e36c6b84 (GREEN)
