---
phase: quick-17
plan: 01
subsystem: ui-components
tags: [refactor, ui-cleanup, homepage]
dependency_graph:
  requires: []
  provides:
    - Deduplicated device card controls
  affects:
    - StoveCard Quick Actions layout
    - ThermostatCard Quick Actions layout
    - LightsCard Quick Actions layout
    - CameraCard Quick Actions layout
tech_stack:
  added: []
  patterns:
    - Single control point per function (no duplicates)
    - Quick Actions retain unique shortcuts only
key_files:
  created: []
  modified:
    - app/components/devices/stove/StoveCard.tsx
    - app/components/devices/thermostat/ThermostatCard.tsx
    - app/components/devices/lights/LightsCard.tsx
    - app/components/devices/camera/CameraCard.tsx
decisions: []
metrics:
  duration: "4 min 51 sec"
  completed: "2026-02-10"
---

# Quick Task 17: Remove Duplicate Controls from Homepage Device Cards

**One-liner:** Removed duplicate power/temperature/brightness/mode controls from Quick Actions bars, keeping only unique shortcuts and full controls in main panels.

## Summary

Cleaned up homepage device cards by removing duplicate controls from Quick Actions bars. Each device card previously had compact controls in the Quick Actions bar AND full controls in the main panel below. Removed the compact duplicates to reduce UI clutter and simplify component code.

### Changes Made

**StoveCard.tsx:**
- Removed power level +/- compact controls from Quick Actions bar
- Kept unique controls: Power toggle button, Fan shortcut (scroll to section)
- Full power level controls remain in Adjustments section

**ThermostatCard.tsx:**
- Removed temperature +/- compact controls from Quick Actions bar
- Kept unique control: Mode Quick Cycle button
- Full temperature controls remain in "Quick temperature controls" panel

**LightsCard.tsx:**
- Removed brightness slider from Quick Actions bar
- Removed unused `Sun` icon import
- Kept unique control: Room Power toggle
- Full brightness controls remain in main panel

**CameraCard.tsx:**
- Removed live/snapshot icon toggle from Quick Actions bar
- Removed unused `Video` and `Image` icon imports
- Kept unique control: Snapshot capture button
- Text-based Snapshot/Live toggle buttons remain below Quick Actions

## Implementation Details

### Task 1: StoveCard and ThermostatCard
- Removed lines 1176-1201 from StoveCard (power level +/- compact controls)
- Removed lines 688-712 from ThermostatCard (temperature +/- compact controls)
- Handlers and state unchanged (full controls in main panel use same functions)
- Layout remains clean with centered buttons

### Task 2: LightsCard and CameraCard
- Removed lines 968-994 from LightsCard (brightness slider compact control)
- Removed lines 293-301 from CameraCard (live/snapshot icon toggle)
- Cleaned up unused icon imports (Sun, Video, Image)
- `localBrightness` state preserved (used by main panel slider)

## Verification

**TypeScript:** `npx tsc --noEmit` passes (pre-existing errors in cron-executions.test.ts unrelated to changes)

**Tests:** 3087/3088 tests pass (1 pre-existing failure in FormModal.test.tsx unrelated to changes)

**Visual Check:**
- Each Quick Actions bar contains only unique controls (no duplicates)
- StoveCard: Power toggle + Fan shortcut (when WORK mode)
- ThermostatCard: Mode Quick Cycle button only
- LightsCard: Room Power toggle only
- CameraCard: Snapshot capture button only

## Deviations from Plan

None - plan executed exactly as written.

## Results

**Before:**
- 4 device cards with duplicate controls in Quick Actions bars
- Confusing UX (two ways to adjust same setting)
- Larger component code

**After:**
- 4 device cards with deduplicated controls
- Single control point per function
- Quick Actions retain only unique shortcuts (navigation, mode toggle)
- Cleaner UI, reduced component code
- 94 lines removed across 4 files

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | [68c5c35](https://github.com/repo/commit/68c5c35) | Remove duplicate controls from StoveCard and ThermostatCard |
| 2 | [9c96af6](https://github.com/repo/commit/9c96af6) | Remove duplicate controls from LightsCard and CameraCard |

## Self-Check: PASSED

**Files verified:**
```bash
FOUND: app/components/devices/stove/StoveCard.tsx
FOUND: app/components/devices/thermostat/ThermostatCard.tsx
FOUND: app/components/devices/lights/LightsCard.tsx
FOUND: app/components/devices/camera/CameraCard.tsx
```

**Commits verified:**
```bash
FOUND: 68c5c35
FOUND: 9c96af6
```

**Control deduplication verified:**
```bash
grep "Diminuisci Potenza" StoveCard.tsx → Only in Adjustments section (not Quick Actions)
grep "Diminuisci Temperatura" ThermostatCard.tsx → Only in main panel (not Quick Actions)
Slider count in LightsCard.tsx → 1 instance (main panel only)
Quick Actions bars → Single unique control per card
```

All claims verified. Quick task executed successfully.
