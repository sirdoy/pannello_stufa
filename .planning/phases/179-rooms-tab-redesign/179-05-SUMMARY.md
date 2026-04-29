---
phase: 179
plan: "05"
subsystem: rooms-tab
tags: [rooms, bodies, stove, plug, sensor, camera, tv, shade, device-bodies, tdd]
dependency_graph:
  requires: [179-01, 179-02]
  provides: [StoveBody, PlugBody, SensorBody, CameraBody, TvBody, ShadeBody]
  affects: [179-08-DeviceBody-dispatcher]
tech_stack:
  added: []
  patterns:
    - per-body self-fetch (D-39)
    - no-op interactive bodies (D-32/33/34)
    - read-only StatChip bodies (D-30/35)
    - kW/W boundary formatting (D-55)
    - TDD RED/GREEN cycle per task
key_files:
  created:
    - app/components/EmberGlass/rooms/bodies/StoveBody.tsx
    - app/components/EmberGlass/rooms/bodies/PlugBody.tsx
    - app/components/EmberGlass/rooms/bodies/SensorBody.tsx
    - app/components/EmberGlass/rooms/bodies/CameraBody.tsx
    - app/components/EmberGlass/rooms/bodies/TvBody.tsx
    - app/components/EmberGlass/rooms/bodies/ShadeBody.tsx
    - app/components/EmberGlass/rooms/__tests__/bodies/StoveBody.test.tsx
    - app/components/EmberGlass/rooms/__tests__/bodies/PlugBody.test.tsx
    - app/components/EmberGlass/rooms/__tests__/bodies/SensorBody.test.tsx
    - app/components/EmberGlass/rooms/__tests__/bodies/CameraBody.test.tsx
    - app/components/EmberGlass/rooms/__tests__/bodies/TvBody.test.tsx
    - app/components/EmberGlass/rooms/__tests__/bodies/ShadeBody.test.tsx
  modified: []
decisions:
  - Power clamped 1..5 in StoveBody before dispatching handlePowerChange (T-179-05-01)
  - StoveBody reads powerLevel/fanLevel from live useStoveData hook (not device.extra); device.extra carries these from aggregator as fallback in tests
  - useStoveData called with { checkVersion, userId: user?.sub } per Pitfall 9
  - handleIgnite gated on !needsCleaning (Phase 178 D-05)
  - TvBody/ShadeBody/CameraBody use const noop = () => undefined for no-op handlers
  - CameraBody uses data-testid="stanze-camera-preview" for E2E targeting
  - TvBody.test.tsx uses getAllByText for HDMI 2 (appears in both chip and button)
metrics:
  duration: "6 minutes"
  completed: "2026-04-29T14:18:37Z"
  tasks_completed: 2
  files_created: 12
  files_modified: 0
  tests_added: 53
---

# Phase 179 Plan 05: Device Bodies Wave 2 (6 Bodies) Summary

Wave 2 ships 6 of 10 type-specific bodies: **StoveBody (wired)**, **PlugBody** (read-only), **SensorBody** (read-only), **CameraBody** (no-op), **TvBody** (no-op), **ShadeBody** (no-op). Each body has its own Jest spec; 53 tests pass.

## Completed Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | StoveBody + PlugBody + SensorBody | f2a426e7 | 3 components + 3 specs |
| 2 | CameraBody + TvBody + ShadeBody | 033aa34c | 3 components + 3 specs |

## What Was Built

**StoveBody** (`kind === 'stove'`):
- Self-fetches via `useStoveData({ checkVersion, userId })` (Pitfall 9) + `useStoveCommands`
- 3 StatChips: Target (`${powerLevel}/5`), Fiamma, Ventola (live from hook, no temp field — Pitfall 1)
- ControlRow with Meno / Power / Più MiniButtons (D-52 frozen copy)
- Power level clamped 1..5 before dispatch (T-179-05-01 threat mitigation)
- Power button: `device.on → handleShutdown()`, else `!needsCleaning → handleIgnite()` (Phase 178 D-05 cleaning gate)

**PlugBody** (`kind === 'plug'`):
- 2 StatChips (Ora + Oggi) — read-only (D-30)
- `formatPower`: `>= 1000W → "X.YkW"`, else `"NW"` (no space); kWh: `"N.N kWh"` (with space) (D-55)

**SensorBody** (`kind === 'sensor'`):
- 2 StatChips (Valore + Trend) — read-only (D-35); humidity % + trend string (D-60)

**CameraBody** (`kind === 'camera'`):
- 16:9 preview box with `aspectRatio: '16 / 9'`
- LIVE caption with pulsing 6×6 dot + `LIVE · {fps}fps` (D-59)
- Footer: `Movimento {motion}` (D-59)
- 46×46 centered play button — no-op click (D-34)

**TvBody** (`kind === 'tv'`):
- 2 StatChips (Sorgente + Volume) (D-57)
- HDMI 1 / HDMI 2 / App buttons, `filled` when source matches — no-op click (D-32)

**ShadeBody** (`kind === 'shade'`):
- SliderRow: label "Posizione", unit "%" — read-only (no onChange) (D-58)
- Su / Stop / Giù buttons — no-op click (D-33)

## Deviations from Plan

### Minor Fix (Rule 1 — Test Spec)

**[Rule 1 - Test] TvBody.test.tsx getAllByText for HDMI 2**
- **Found during:** Task 2 GREEN phase
- **Issue:** "HDMI 2" appears in both the Sorgente StatChip and the HDMI 2 MiniButton label when `source === 'HDMI 2'`, causing `getByText` to throw duplicate match error.
- **Fix:** Changed test to `getAllByText('HDMI 2').length >= 1` — the duplication is correct behavior (chip shows the active source; button is filled to match).
- **Files modified:** `__tests__/bodies/TvBody.test.tsx`
- **Commit:** 033aa34c

## Verification

```
npm run test:components -- app/components/EmberGlass/rooms/__tests__/bodies/*.test.tsx
# → 53 passed, 7 test suites (6 new + 1 unrelated)
```

React Compiler gate:
```
grep -REn 'useMemo|useCallback' app/components/EmberGlass/rooms/bodies/ | wc -l
# → 0
```

## Threat Model Coverage

| Threat ID | Mitigation Status |
|-----------|------------------|
| T-179-05-01 (Tampering — power level clamping) | Mitigated: `Math.max(1, ...)` + `Math.min(5, ...)` before dispatch |
| T-179-05-02 (DoS — ignite gate) | Accepted: `!needsCleaning` guard present in StoveBody |
| T-179-05-03 (XSS — TvBody source rendering) | Accepted: React auto-escapes; EXTRA_DEVICES literals are static |

## Known Stubs

| Stub | File | Reason |
|------|------|--------|
| `noop` click handlers | TvBody, ShadeBody, CameraBody | No TV/shade/camera proxy exists (CONTEXT D-32/33/34); future phases ship proxies |
| Static LIVE caption fps | CameraBody | From `device.extra.fps` static EXTRA_DEVICES (D-07); future HLS wiring replaces |
| `needsCleaning` blocks ignite silently | StoveBody | User gets no feedback if blocked — Phase 178 UX was same; acceptable per D-34 |

These stubs do NOT prevent the plan's goal (body shapes are visually complete per bundle spec).

## Self-Check: PASSED

- [x] app/components/EmberGlass/rooms/bodies/StoveBody.tsx exists
- [x] app/components/EmberGlass/rooms/bodies/PlugBody.tsx exists
- [x] app/components/EmberGlass/rooms/bodies/SensorBody.tsx exists
- [x] app/components/EmberGlass/rooms/bodies/CameraBody.tsx exists
- [x] app/components/EmberGlass/rooms/bodies/TvBody.tsx exists
- [x] app/components/EmberGlass/rooms/bodies/ShadeBody.tsx exists
- [x] Task 1 commit f2a426e7 exists
- [x] Task 2 commit 033aa34c exists
- [x] 53 tests pass
- [x] 0 useMemo/useCallback in production code
