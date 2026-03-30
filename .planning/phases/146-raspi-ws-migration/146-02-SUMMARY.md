---
phase: 146-raspi-ws-migration
plan: "02"
subsystem: raspi-card
tags: [raspi, last-updated, timestamp, ux]
dependency_graph:
  requires: [useRaspiData lastUpdatedAt (from plan 01), LastUpdated component]
  provides: [RaspiCard LastUpdated footer]
  affects: [dashboard RaspiCard display]
tech_stack:
  added: []
  patterns: [LastUpdated footer pattern (matches all other device cards)]
key_files:
  created: []
  modified:
    - app/components/devices/raspi/RaspiCard.tsx
    - app/components/devices/raspi/__tests__/RaspiCard.test.tsx
decisions:
  - "LastUpdated placed outside data conditional — renders when tsMs is set regardless of data state, handles null gracefully"
metrics:
  duration: "~5 minutes"
  completed_date: "2026-03-30"
  tasks_completed: 2
  files_modified: 2
requirements: [RASPI-03, UX-03]
---

# Phase 146 Plan 02: RaspiCard LastUpdated Footer Summary

**One-liner:** RaspiCard gets Italian-locale "Aggiornato X secondi fa" footer by wiring lastUpdatedAt from useRaspiData to the LastUpdated component.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Add LastUpdated footer to RaspiCard | ca49b189 | app/components/devices/raspi/RaspiCard.tsx |
| 2 | Update RaspiCard tests for LastUpdated rendering | c1562460 | app/components/devices/raspi/__tests__/RaspiCard.test.tsx |

## What Was Built

Updated `RaspiCard.tsx` with three changes:

1. **LastUpdated import added:** `import { LastUpdated } from '../../ui/LastUpdated'`
2. **lastUpdatedAt destructured** from `useRaspiData()` hook return value
3. **LastUpdated footer rendered** in a `SmartHomeCard.Controls` block outside the `{data && ...}` conditional — matches the pattern used in all other device cards (LastUpdated handles null tsMs by rendering nothing)

Updated `RaspiCard.test.tsx` with four changes:

1. **LastUpdated mock added:** renders `<div data-testid="last-updated">` when tsMs is set, null when not
2. **baseData extended:** added `lastUpdatedAt: 1711800000000` field
3. **New test:** "renders LastUpdated when lastUpdatedAt is set" — asserts `last-updated` testid present
4. **New test:** "does not render LastUpdated when lastUpdatedAt is null" — asserts `last-updated` testid absent

Test suite grew from 8 tests to 10 tests, all passing.

## Decisions Made

- LastUpdated placed outside the `{data && ...}` guard — consistent with the pattern in other cards (StoveCard, LightsCard, etc.) where the timestamp renders independently of whether data is loaded

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

- app/components/devices/raspi/RaspiCard.tsx: FOUND
- app/components/devices/raspi/__tests__/RaspiCard.test.tsx: FOUND
- Commit ca49b189: FOUND
- Commit c1562460: FOUND
- tsc --noEmit: PASS (zero errors)
- npm test RaspiCard: PASS (10 tests passing)
