---
phase: 182-design-system-reference-page-v2
plan: 08
subsystem: debug/design-system-v2
tags: [sheet-gallery, device-sheets, jest-mocks, launcher-pills, design-system]
dependency_graph:
  requires:
    - 182-01-PLAN (page decomposition + section orchestrator)
    - 182-07-PLAN (Section09SheetPrimitives in place before Section10)
    - Phase 178 (StoveSheet, ClimateSheet, LightsSheet, SonosSheet, PlugsSheet bodies)
    - Phase 175 (Sheet primitive with open/onClose/title API)
  provides:
    - Section10SheetGallery.tsx (5 launcher pills + 5 sheet wrappers, D-14 single-open)
    - sheetFixtures.ts (DEVICE_KEYS + DEVICE_LABELS reference constants)
    - page.tsx wired with all 10 sections
    - page.test.tsx extended with 13 jest.mock() calls + Phase 182 describe block
  affects:
    - app/debug/design-system-v2/page.tsx (Section10SheetGallery added)
    - app/debug/design-system-v2/__tests__/page.test.tsx (mocks + describe block)
tech_stack:
  added: []
  patterns:
    - Single shared useState<DeviceKey | null> for single-open sheet semantics (D-14)
    - Zero-prop *Sheet bodies wrapped in Sheet primitive (forceMount-safe)
    - jest.mock() with full TypeScript-satisfying return shapes for device hooks
key_files:
  created:
    - app/debug/design-system-v2/sections/sheetFixtures.ts
    - app/debug/design-system-v2/sections/Section10SheetGallery.tsx
  modified:
    - app/debug/design-system-v2/page.tsx
    - app/debug/design-system-v2/__tests__/page.test.tsx
decisions:
  - "Imported *Sheet bodies from @/app/components/EmberGlass barrel (via sheets/index.ts re-exports) rather than direct paths"
  - "jest.mock() return shapes include ALL fields from each hook's TypeScript return type to prevent runtime type errors"
  - "13th mock is useTuyaCommands returning { togglePlug, setTimer, cancelTimer } matching the actual hook"
metrics:
  duration: "~15 minutes"
  completed: "2026-05-03"
  tasks_completed: 4
  tasks_total: 4
  files_created: 2
  files_modified: 2
---

# Phase 182 Plan 08: Section10SheetGallery + sheetFixtures Summary

**One-liner:** Sheet gallery section with 5 launcher pills that open real *Sheet device bodies (StoveSheet/ClimateSheet/LightsSheet/SonosSheet/PlugsSheet) via single shared useState, backed by 13 jest.mock() calls that satisfy each hook's TypeScript signature.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create sheetFixtures.ts | ef0ba678 | app/debug/design-system-v2/sections/sheetFixtures.ts |
| 2 | Create Section10SheetGallery.tsx | e25bdd9a | app/debug/design-system-v2/sections/Section10SheetGallery.tsx |
| 3 | Wire Section10SheetGallery into page.tsx | e4b8908d | app/debug/design-system-v2/page.tsx |
| 4 | Extend page.test.tsx with hook mocks | fc8f8e7d | app/debug/design-system-v2/__tests__/page.test.tsx |

## What Was Built

### sheetFixtures.ts
Documentation/reference constants module per D-13. Exports:
- `DEVICE_KEYS` — `['stove', 'climate', 'lights', 'sonos', 'plugs'] as const` tuple
- `DeviceKey` — type alias for the union
- `DEVICE_LABELS` — Italian display labels for launcher pills (Stufa/Clima/Luci/Sonos/Prese)

No fixture data shapes are needed because the *Sheet bodies take zero props and self-fetch via hooks.

### Section10SheetGallery.tsx
Final section (10 / DEMO). Key design decisions:
- `id="sec-10-heading"` on the `<h2>` for Playwright/Jest assertion
- 5 `<Pressable as="button">` launcher pills with `data-testid="launcher-{key}"` for Plan 09 Playwright
- Active pill border uses `1px solid var(--accent)` to participate in the live-recolor invariant (DSREF-03)
- Single `useState<DeviceKey | null>` — opening one sheet closes others automatically (D-14)
- Imported from `@/app/components/EmberGlass` barrel which re-exports via `sheets/index.ts`

### page.tsx
Added import + `<Section10SheetGallery />` as the 10th and final section. Orchestrator now renders all 10 sections in order (01-10).

### page.test.tsx Extension
Added 13 `jest.mock()` calls before imports (hoisted by Babel):

| Hook | Module Path | Purpose |
|------|-------------|---------|
| useRouter | next/navigation | StoveSheet + LightsSheet router.push calls |
| useUser | @auth0/nextjs-auth0/client | StoveSheet user.sub |
| useVersion | @/app/context/VersionContext | StoveSheet checkVersion |
| useStoveData | stove/hooks/useStoveData | Full stove state with all fields |
| useStoveCommands | stove/hooks/useStoveCommands | handleIgnite/Shutdown/Power/Fan |
| useThermostatData | thermostat/hooks/useThermostatData | topology/status/loading/error/refetch |
| useThermostatCommands | thermostat/hooks/useThermostatCommands | setRoomSetpoint/setHomeMode/setRoomMode |
| useLightsData | lights/hooks/useLightsData | Full 30-field shape including setters |
| useLightsCommands | lights/hooks/useLightsCommands | handleRoomToggle/handleAllLightsToggle/etc |
| useSonosFullData | sonos/hooks/useSonosFullData | data/loading/error/fetchData |
| useSonosCommands | sonos/hooks/useSonosCommands | All 13 command functions |
| useTuyaData | tuya/hooks/useTuyaData | plugs/loading/error |
| useTuyaCommands | tuya/hooks/useTuyaCommands | togglePlug/setTimer/cancelTimer |

Added 4th describe block "Phase 182 — section decomposition (D-21)":
- Asserts all 10 section headings present (by aria role or element ID)
- Asserts 5 launcher pills present by data-testid

**Result: 15 tests pass (3 original + 2 new = 15 total green).**

## Deviations from Plan

None — plan executed exactly as written.

The plan's suggested mock shapes were marked "best-effort placeholders" for some hooks. For completeness and TypeScript safety, I used the ACTUAL return shapes from the hook source files:
- `useLightsData` return has 30+ fields — provided all of them
- `useSonosCommands` return has 13 functions — provided all of them
- `useTuyaCommands` returns `{ togglePlug, setTimer, cancelTimer }` (not just `togglePlug`)
- `useThermostatData` returns `{ connected, topology, status, loading, error, stale, staleness, lastUpdatedAt, refetch }` (not `{ roomTemp, targetTemp, mode, ... }`)

These are correctness improvements over the plan's placeholders, not deviations.

## Known Stubs

None. The *Sheet bodies self-fetch from real hooks — the Jest mocks return loading/empty states which correctly trigger the loading skeleton branches in each sheet, keeping them stable in jsdom.

## Threat Flags

None — no new API endpoints, auth paths, or schema changes. The threat model T-182-08-01 (info disclosure via /debug/**) is already accepted and mitigated by Auth0 gating (Phase 174 carry-forward).

## Self-Check: PASSED

All created files confirmed present on disk. All 4 task commits found in git log:
- ef0ba678: sheetFixtures.ts
- e25bdd9a: Section10SheetGallery.tsx
- e4b8908d: page.tsx wired
- fc8f8e7d: page.test.tsx extended

Jest: 15/15 tests passing.
