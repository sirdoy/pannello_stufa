---
phase: quick-18
plan: 01
type: summary
subsystem: ui-homepage
tags: [ui, refactor, simplification]
dependency_graph:
  requires: []
  provides: [simplified-device-cards]
  affects: [device-cards-ui]
tech_stack:
  added: []
  patterns: [icon-cleanup, ui-simplification]
key_files:
  created: []
  modified:
    - app/components/devices/stove/StoveCard.tsx
    - app/components/devices/thermostat/ThermostatCard.tsx
    - app/components/devices/lights/LightsCard.tsx
    - app/components/devices/camera/CameraCard.tsx
decisions:
  - Removed redundant Quick Actions icon bars that duplicated primary control functionality
  - Cleaned up unused Lucide icon imports (Power, Fan, Home, Snowflake, Camera)
  - Preserved all primary action sections and essential controls
metrics:
  duration: 3m 7s
  tasks_completed: 2
  files_modified: 4
  completed_date: 2026-02-10
---

# Quick Task 18: Remove Quick Actions from Device Cards Summary

**One-liner:** Removed redundant Quick Actions icon-button bars from all four homepage device cards (StoveCard, ThermostatCard, LightsCard, CameraCard), cleaning up duplicate controls and unused icon imports.

## What Was Done

### Task 1: StoveCard and ThermostatCard
**Commit:** `aea20c2`

**StoveCard Changes:**
- Removed Power and Fan icon imports from lucide-react
- Deleted entire Quick Actions bar (lines 1162-1191) containing:
  - Power toggle button (duplicated ACCENDI/SPEGNI primary buttons)
  - Fan control button (duplicated fan controls in Regolazioni section)
- PRIMARY ACTIONS section (ACCENDI/SPEGNI text buttons) remains fully intact

**ThermostatCard Changes:**
- Removed Power, Home, and Snowflake icon imports from lucide-react
- Kept Calendar icon (still used in context menu at line 462)
- Deleted entire Quick Actions bar (lines 685-711) containing:
  - Mode Quick Cycle button (duplicated mode control grid below)
- Temperature controls and mode grid remain fully intact

**Files modified:**
- `app/components/devices/stove/StoveCard.tsx` (61 lines removed)
- `app/components/devices/thermostat/ThermostatCard.tsx` (28 lines removed)

### Task 2: LightsCard and CameraCard
**Commit:** `102a823`

**LightsCard Changes:**
- Removed Power icon import from lucide-react
- Deleted entire Quick Actions bar (lines 957-969) containing:
  - Power toggle button (duplicated main On/Off buttons below)
- "Quick All-House Control" section (lines 880-945) preserved
- Main On/Off buttons (lines 1065-1123) remain fully intact

**CameraCard Changes:**
- Removed Camera icon import from lucide-react
- Deleted entire Quick Actions bar (lines 283-293) containing:
  - Snapshot capture button (duplicated refresh overlay functionality)
- Refresh overlay button (lines 392-402) remains fully intact
- Video/snapshot text toggle preserved

**Files modified:**
- `app/components/devices/lights/LightsCard.tsx` (15 lines removed)
- `app/components/devices/camera/CameraCard.tsx` (13 lines removed)

## Deviations from Plan

None - plan executed exactly as written.

## Technical Details

**Import Cleanup:**
- StoveCard: Removed `Power`, `Fan` (not used elsewhere)
- ThermostatCard: Removed `Power`, `Home`, `Snowflake` (kept `Calendar` for context menu)
- LightsCard: Removed `Power` (not used elsewhere)
- CameraCard: Removed `Camera` (not used elsewhere, only appears in strings/comments)

**UI Preserved:**
- StoveCard: PRIMARY ACTIONS section with ACCENDI/SPEGNI buttons, fan/power controls in Regolazioni
- ThermostatCard: Temperature controls, mode control grid (4 emoji buttons)
- LightsCard: All-House Control section, main room On/Off buttons
- CameraCard: Refresh overlay, video/snapshot toggle

## Verification

✅ TypeScript compilation: Clean (pre-existing test errors unrelated)
✅ Quick Actions sections: All removed from 4 cards
✅ Unused icon imports: All cleaned up
✅ Primary controls: All intact and unmodified
✅ Git history: 2 atomic commits with clear messages

## Self-Check

### Created Files
None (modification-only task)

### Modified Files
- ✅ FOUND: app/components/devices/stove/StoveCard.tsx
- ✅ FOUND: app/components/devices/thermostat/ThermostatCard.tsx
- ✅ FOUND: app/components/devices/lights/LightsCard.tsx
- ✅ FOUND: app/components/devices/camera/CameraCard.tsx

### Commits
- ✅ FOUND: aea20c2 (Task 1: StoveCard + ThermostatCard)
- ✅ FOUND: 102a823 (Task 2: LightsCard + CameraCard)

## Self-Check: PASSED

All files modified, all commits present, all Quick Actions removed, no unused imports remain.
