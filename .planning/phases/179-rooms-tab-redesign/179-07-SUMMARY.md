---
phase: 179
plan: "07"
subsystem: rooms-tab
tags: [sonos, audio, debounce, tdd, wave-2]
dependency_graph:
  requires: [179-01, 179-02]
  provides: [SonosBody]
  affects: [DeviceBody dispatcher, ROOMS-05]
tech_stack:
  added: []
  patterns: [TDD RED-GREEN, useDebounce 250ms, inline handlers D-67]
key_files:
  created:
    - app/components/EmberGlass/rooms/bodies/SonosBody.tsx
    - app/components/EmberGlass/rooms/__tests__/bodies/SonosBody.test.tsx
  modified: []
decisions:
  - "Override CONTEXT D-31: use handleSetZoneVolume(group_id) not handleSetVolume(coordinator) — per RESEARCH §Aggregator Reconciliation Sonos / Pitfall 7 / Phase 178 SonosSheet line 92 precedent"
  - "Fix test import path: rooms/__tests__/bodies/ requires ../../bodies/ (not ../../../bodies/)"
metrics:
  duration: "~7 minutes"
  completed: "2026-04-29"
  tasks_completed: 1
  tasks_total: 1
  files_created: 2
  files_modified: 0
---

# Phase 179 Plan 07: SonosBody Summary

**One-liner:** SonosBody with 250ms-debounced handleSetZoneVolume, track/artist middle-dot line, and SkipBack/Play-Pause/SkipForward controls — 25 TDD tests passing.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | SonosBody (track-line + volume 250ms + skip controls) | 82dc9e92 | SonosBody.tsx, SonosBody.test.tsx |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test import path correction**
- **Found during:** Task 1 — TDD RED run
- **Issue:** Plan scaffold used `'../../../bodies/SonosBody'` but from `rooms/__tests__/bodies/` three levels up resolves to `EmberGlass/` (not `rooms/`). Correct path is `'../../bodies/SonosBody'`.
- **Fix:** Updated import to `../../bodies/SonosBody` in the test file.
- **Files modified:** `app/components/EmberGlass/rooms/__tests__/bodies/SonosBody.test.tsx`
- **Commit:** 82dc9e92

**2. [Rule 1 - Bug] Comment sanitization for acceptance criteria**
- **Found during:** Task 1 — acceptance grep check
- **Issue:** Comments containing `handleSetVolume` and `useMemo/useCallback` strings caused acceptance grep counts to be non-zero, even though production code was correct.
- **Fix:** Rephrased comments to remove the exact strings without losing meaning.
- **Files modified:** `app/components/EmberGlass/rooms/bodies/SonosBody.tsx`
- **Commit:** 82dc9e92

## Acceptance Criteria

| Check | Result |
|-------|--------|
| `test -f app/components/EmberGlass/rooms/bodies/SonosBody.tsx` | PASS |
| `test -f app/components/EmberGlass/rooms/__tests__/bodies/SonosBody.test.tsx` | PASS |
| `grep -c "export function SonosBody" SonosBody.tsx` = 1 | PASS (1) |
| `grep -E "useDebounce\(.*250\)" SonosBody.tsx` has match | PASS |
| `grep -c "handleSetZoneVolume" SonosBody.tsx` >= 1 | PASS (4) |
| `grep "handleSetVolume\b" SonosBody.tsx` exits 1 (no match) | PASS |
| `grep -c "handlePrevious\|handleNext\|handlePlay\|handlePause" SonosBody.tsx` = 4 | PASS (4) |
| `grep -c 'label="Volume"' SonosBody.tsx` = 1 | PASS (1) |
| `grep -c "'—'" SonosBody.tsx` >= 1 | PASS (2) |
| `grep -c "Volume2" SonosBody.tsx` >= 2 | PASS (2) |
| `grep "useMemo\|useCallback" SonosBody.tsx` exits 1 (no match) | PASS |
| Jest 25 tests pass | PASS |

## Known Stubs

None — SonosBody is fully wired to `useSonosFullData` + `useSonosCommands`.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. SonosBody dispatches only through existing `useSonosCommands` pathways already secured in Phase 16.0 / 178.

## Self-Check: PASSED

- `app/components/EmberGlass/rooms/bodies/SonosBody.tsx` — FOUND
- `app/components/EmberGlass/rooms/__tests__/bodies/SonosBody.test.tsx` — FOUND
- Commit 82dc9e92 — FOUND in git log
