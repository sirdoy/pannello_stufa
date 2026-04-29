---
phase: 178-per-device-modal-sheets
plan: 07
subsystem: ui
tags: [ember-glass, sheets, sonos, react, debounce, allSettled]

# Dependency graph
requires:
  - phase: 175-glass-primitives-press-animation-sheet
    provides: "Sheet primitive (Radix Dialog facade) — consumed unmodified"
  - phase: 177-equal-size-dashboard-glass-cards
    provides: "PlayingBars primitive + SonosCard sheet wiring (open state, Sheet wrapper)"
  - phase: 178-per-device-modal-sheets/01
    provides: "sheets/index.ts barrel + sub-primitives (not consumed by SonosSheet but lives in same namespace)"
  - phase: 178-per-device-modal-sheets/02
    provides: "globals.css [data-sheet-focusable] focus-visible rule"
  - phase: 16.0
    provides: "useSonosFullData + useSonosCommands (handleSetZoneVolume group-level write)"
  - phase: v17.0
    provides: "useSonosFullData WS-aware adaptive polling baseline"
provides:
  - "SHEET-05 SonosSheet body — group list + volume strip + master action with Promise.allSettled"
  - "Field-adapter pattern application: flat zone.coordinator_uid (Pitfall 7) joined with playback record by group_id and volumes record by coordinator_uid"
  - "Local setCommandError state to satisfy useSonosCommands setError prop when the data hook does not expose a setter"
affects: [178-08, 179-rooms-tab]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Body-only sheet body component (no props, self-fetches via device hook)"
    - "Group-level Sonos volume write via handleSetZoneVolume(groupId, vol)"
    - "Master action batch via Promise.allSettled to tolerate partial failures"
    - "Destructured callback in useEffect deps (instead of whole cmds object) for referential stability"
    - "Local-state error sink for command hooks when data hook exposes no setError"

key-files:
  created:
    - app/components/EmberGlass/sheets/__tests__/SonosSheet.test.tsx
  modified:
    - app/components/EmberGlass/sheets/SonosSheet.tsx

key-decisions:
  - "Use cmds.handleSetZoneVolume (group-level) per Plan/RESEARCH §A7 rather than per-speaker handleSetVolume — matches bundle's single-slider-per-group UX and lets the proxy handle coordinator selection."
  - "Drive useSonosCommands.setError into a local useState sink (setCommandError); ignored value (`const [, setCommandError]`) mirrors the no-op intent. Documented in JSDoc to prevent future drift."
  - "Reset pendingVolume on selectedIdx / selected.id / selected.volume change, then guard the write effect with `debouncedVolume === selected.volume` to avoid no-op writes during the first paint or after a cross-zone selection change."
  - "Master action computes anyPlaying once and iterates groups with Promise.allSettled — partial failures bubble through useSonosCommands' setError into the local sink (Navbar surfaces global health)."
  - "Error message rendered as raw string (not error.message); useSonosFullData.error is already a string per its return type, so no instanceof Error guard needed."

patterns-established:
  - "Sheet-body field adapter: destructure live hook data + map to bundle prop names (`g.name`, `g.playing`, `g.track`, …) at the top of the component, with a typed local interface (SonosGroup)."
  - "Destructure stable handlers (`const { handleSetZoneVolume, handlePlay, handlePause } = cmds`) before the first useEffect that depends on them — this satisfies the planner's checker WARNING 4 (no `cmds` bare identifier in dependency arrays)."

requirements-completed: [SHEET-05]

# Metrics
duration: ~30min
completed: 2026-04-29
---

# Phase 178 Plan 07: SonosSheet Summary

**Replaces the placeholder SonosSheet stub with the real sheet body — group list + volume slider + master action — wired to `useSonosFullData` + `useSonosCommands` per CONTEXT D-08.**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-04-29T10:30Z (approx)
- **Completed:** 2026-04-29T11:00Z
- **Tasks:** 1 (TDD: RED → GREEN)
- **Files modified:** 1 (SonosSheet.tsx) + 1 created (SonosSheet.test.tsx)

## Accomplishments

- Real `<SonosSheet>` body shipped with bundle-verbatim visual contract (`sheets.jsx:308-398`).
- 12 jest test cases covering: render, group selection, play/pause stopPropagation, debounced volume (250 ms), debounce coalesce, master action (Pausa ovunque ↔ Riproduci ovunque), Promise.allSettled tolerance, loading skeleton, empty state.
- Field adapter applied for Sonos-specific shape (flat `zone.coordinator_uid`, joined `playback` and `volumes` records by group_id / coordinator_uid).

## Task Commits

1. **Task 1 (RED): failing SonosSheet jest spec** — `b8735352` (test)
2. **Task 1 (GREEN): SonosSheet body implementation** — `27d57c26` (feat)

_TDD plan: RED commit lands the spec against the stub (12 failures), GREEN commit replaces the stub with the real body and turns all 12 tests green._

## Files Created/Modified

- `app/components/EmberGlass/sheets/SonosSheet.tsx` (modified, stub → 322 LOC) — Replaces the Plan 178-07 stub. Implements the full body-only sheet content per UI-SPEC §SonosSheet, RESEARCH §A7 (handleSetZoneVolume), and Pitfall 7 (flat coordinator_uid). Includes loading skeleton (D-26) and error state (D-27).
- `app/components/EmberGlass/sheets/__tests__/SonosSheet.test.tsx` (created, 199 LOC) — Jest spec mocking both `useSonosFullData` and `useSonosCommands`; uses `dataOverride` pattern (declared in module scope, reset in `beforeEach`) to vary the data without re-mocking the module.

## Decisions Made

- **Group-level volume writes** — chose `cmds.handleSetZoneVolume(groupId, vol)` over per-speaker `handleSetVolume(uid, vol)` so the user perceives a single slider that controls "the group" (matches bundle UX). Pitfall A7.
- **Local setCommandError sink** — `useSonosFullData` does not return a `setError` setter (only the `error` value), but `useSonosCommands` requires `setError` in its params. Created a local `useState` sink with the value discarded (`const [, setCommandError]`) — mirrors `app/sonos/page.tsx`. Documented in the JSDoc.
- **Effect deps** — destructure `handleSetZoneVolume`, `handlePlay`, `handlePause` from `cmds` once at the top of the component so each `useEffect` references the stable callback identity (checker WARNING 4). The planner forbids `cmds` as a bare identifier inside `useEffect` deps.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] Plan draft `setError: sonosData.setError` would have been undefined at runtime**

- **Found during:** Task 1 implementation (reading the actual `useSonosFullData` return type).
- **Issue:** The plan's reference implementation passed `setError: sonosData.setError` to `useSonosCommands`, but the hook does not expose a `setError` setter — only the `error` state value. Calling commands would have crashed with "TypeError: setError is not a function" the moment any command failed.
- **Fix:** Created a local `useState<string | null>` sink (`setCommandError`) and passed that as the `setError` prop. Mirrors the pattern already used at `app/sonos/page.tsx:29-30`.
- **Files modified:** `app/components/EmberGlass/sheets/SonosSheet.tsx` (sheet body)
- **Verification:** All 12 jest tests pass; the master-action allSettled test would have surfaced the missing setter (rejected handler invokes `params.setError(err.message)`).
- **Committed in:** `27d57c26` (part of GREEN commit).

**2. [Rule 1 — Bug] Plan draft typed `(zone: any)` in the field adapter**

- **Found during:** Task 1 implementation.
- **Issue:** Adding `as any` would silently broaden the field-adapter return values. `useSonosFullData` returns a typed `SonosFullData` interface so the adapter can use the inferred parameter type directly.
- **Fix:** Removed the `: any` annotation; TypeScript infers `SonosZoneResponse` from the call site. No behavior change, only stricter typing.
- **Files modified:** `app/components/EmberGlass/sheets/SonosSheet.tsx`
- **Verification:** `npx tsc --noEmit` reports zero errors for SonosSheet.tsx.
- **Committed in:** `27d57c26`.

**3. [Rule 3 — Cosmetic blocker] Plan acceptance regex `useMemo|useCallback` and `coordinator\.uid` matched JSDoc comment text**

- **Found during:** Acceptance-criteria grep verification.
- **Issue:** The JSDoc described "No `useMemo` / `useCallback` …" and gave a pitfall example referring to `zone.coordinator.uid`. Both phrases match the planner's "must NOT contain" regex even though they are documentation, not source code.
- **Fix:** Reworded the JSDoc to avoid the literal tokens: "No manual memoization hooks …" and "NOT a hypothetical nested zone.coordinator object" — keeps the meaning, satisfies the regex.
- **Files modified:** `app/components/EmberGlass/sheets/SonosSheet.tsx`
- **Verification:** `grep -E "useMemo|useCallback"` and `grep -E "coordinator\.uid"` both return no matches.
- **Committed in:** `27d57c26`.

**4. [Rule 1 — Bug] Test fixture used `'PAUSED'` for transport_state where the proxy returns `'PAUSED_PLAYBACK'`**

- **Found during:** Test fixture authoring.
- **Issue:** SonosCard's existing tests use `'PAUSED_PLAYBACK'` (the actual UPnP transport state value), so the SonosSheet spec was aligned to the same value. The implementation only checks for the `'PLAYING'` literal, so any other value renders the idle UI — both 'PAUSED' and 'PAUSED_PLAYBACK' work, but the proxy emits 'PAUSED_PLAYBACK'.
- **Fix:** Updated test fixtures to use `'PAUSED_PLAYBACK'`.
- **Files modified:** `app/components/EmberGlass/sheets/__tests__/SonosSheet.test.tsx`
- **Verification:** Tests pass.
- **Committed in:** `b8735352` (RED commit; the fixture lived in the test from the start).

## Verification

### Automated

```bash
npm run test:components -- app/components/EmberGlass/sheets/__tests__/SonosSheet.test.tsx
# PASS — 12/12 tests pass

npx tsc --noEmit
# Zero errors in app/components/EmberGlass/sheets/SonosSheet.tsx
# (pre-existing tsc errors in unrelated debug/network test files — out of scope)
```

### Acceptance criteria audit

- [x] `'use client'` directive at top of file.
- [x] `useSonosFullData()` AND `useSonosCommands({ fetchData, setError })` invoked.
- [x] `useDebounce(pendingVolume, 250)` — exact 250 ms debounce.
- [x] `cmds.handleSetZoneVolume(selected.id, debouncedVolume)` — group-level write.
- [x] `Promise.allSettled(groups.map(g => ...))` — master action batch.
- [x] Italian copy strings present: `Pausa ovunque`, `Riproduci ovunque`, `Non in riproduzione`, `Volume ·`.
- [x] `accentColor: '#b080ff'` literal on the volume slider.
- [x] `e.stopPropagation()` inside the play/pause `onClick`.
- [x] data-testids: `sonos-sheet`, `sonos-sheet-group-{i}`, `sonos-sheet-group-{i}-play-pause`, `sonos-sheet-volume-slider`, `sonos-sheet-volume-readout`, `sonos-sheet-master-action`, `sonos-sheet-skeleton`, `sonos-sheet-error`.
- [x] Field adapter uses `zone.coordinator_uid` (NOT `zone.coordinator.uid`).
- [x] Spec ships with 12 `it(` cases (≥10 required).
- [x] `! grep -E "useMemo|useCallback" SonosSheet.tsx` — no hits.
- [x] `! grep -E "coordinator\.uid" SonosSheet.tsx` — no hits.
- [x] `! grep -E "useEffect.*\b(cmds)\b" SonosSheet.tsx` — no hits.

## Threat Model Compliance

| Threat ID    | Mitigation status |
| ------------ | ----------------- |
| T-178-07-01 (volume out-of-range) | mitigated — `<input type="range" min={0} max={100}>`. Browser clamps + server-side route validates. |
| T-178-07-02 (master partial failure) | accepted as planned — `Promise.allSettled` tolerates per-group rejections. NavbarConnectionStatus surfaces global health (out of scope here). |
| T-178-07-03 (cross-group volume race) | mitigated — useEffect resets `pendingVolume` on `safeIdx` / `selected.id` / `selected.volume` change; covered by test "selecting group 1 updates volume eyebrow + readout". |

## Self-Check: PASSED

- FOUND: app/components/EmberGlass/sheets/SonosSheet.tsx (322 LOC)
- FOUND: app/components/EmberGlass/sheets/__tests__/SonosSheet.test.tsx (199 LOC, 12 it() cases)
- FOUND commit b8735352 (test, RED)
- FOUND commit 27d57c26 (feat, GREEN)
- TDD gate sequence verified: test → feat (no refactor commit needed; first GREEN was clean).
