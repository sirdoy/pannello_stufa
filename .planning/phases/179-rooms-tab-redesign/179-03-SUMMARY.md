---
phase: 179
plan: 03
subsystem: rooms-tab
tags: [ember-glass, rooms, chip-grid, device-chip, tdd]
dependency_graph:
  requires: [179-01]
  provides: [RoomCard, DeviceChip]
  affects: [RoomsTab, rooms/index.ts]
tech_stack:
  added: []
  patterns:
    - "GlassCard.onOpen auto-wraps Pressable (Phase 177 pattern) — no manual outer wrap in RoomCard"
    - "color-mix(in oklab, tone%) for on/off chip tinting (bundle rooms.jsx:200-201)"
    - "span[aria-hidden=true] dot pinned top:3 right:3 for device on-state indicator"
    - "devices.slice(0, 6) + Math.max(0, total - 6) for overflow chip"
    - "room.tone when activeCount > 0, var(--text-2) when 0 for count badge"
key_files:
  created:
    - app/components/EmberGlass/rooms/DeviceChip.tsx
    - app/components/EmberGlass/rooms/RoomCard.tsx
    - app/components/EmberGlass/rooms/__tests__/DeviceChip.test.tsx
    - app/components/EmberGlass/rooms/__tests__/RoomCard.test.tsx
  modified: []
decisions:
  - "Test selector span[aria-hidden=true] rather than [aria-hidden=true] to distinguish the on-state dot from lucide SVG elements which also carry aria-hidden=true"
  - "JSDoc uses 'RC-clean — no manual memoization hooks' rather than mentioning useMemo/useCallback to avoid false positives in grep gate"
  - "JSDOM converts hex tones (#f5c84a) to rgb() in style assertions — Test 2 uses inclusive color check"
metrics:
  duration: "~15 minutes"
  completed: "2026-04-29T14:05:22Z"
  tasks_completed: 2
  files_created: 4
---

# Phase 179 Plan 03: RoomCard + DeviceChip Primitives Summary

DeviceChip (1:1 color-mix chip with on-state glow dot) and RoomCard (GlassCard + CardHead + 3-col chip grid + overflow + empty state) implemented via TDD with 14 passing tests.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 (RED) | DeviceChip failing tests | ea101110 | `__tests__/DeviceChip.test.tsx` |
| 1 (GREEN) | DeviceChip implementation | d3443fb1 | `DeviceChip.tsx`, `__tests__/DeviceChip.test.tsx` |
| 2 (RED) | RoomCard failing tests | fd111fde | `__tests__/RoomCard.test.tsx` |
| 2 (GREEN) | RoomCard implementation | 84b944ba | `RoomCard.tsx`, `DeviceChip.tsx` |

## Verification Results

- 14 tests pass across 2 specs (7 DeviceChip + 7 RoomCard)
- React Compiler gate: 0 useMemo/useCallback in production files
- Pressable count in RoomCard: 0 (GlassCard.onOpen handles wrapping internally)
- TypeScript strict: no errors (inline types, no `as any`)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test selector specificity for on-state dot**
- **Found during:** Task 1 GREEN phase
- **Issue:** Lucide SVG icons carry `aria-hidden="true"` on the SVG element, so `[aria-hidden="true"]` selector matched the icon SVG instead of the dot span
- **Fix:** Changed test selector to `span[aria-hidden="true"]` to specifically target the dot span element
- **Files modified:** `__tests__/DeviceChip.test.tsx`
- **Commit:** d3443fb1

**2. [Rule 1 - Bug] JSDOM hex-to-rgb conversion in style assertions**
- **Found during:** Task 1 GREEN phase
- **Issue:** JSDOM converts `#f5c84a` to `rgb(245, 200, 74)` in computed styles, causing Test 2 assertion `expect(bg).toContain('#f5c84a')` to fail
- **Fix:** Updated Test 2 to check inclusive color presence (hex or rgb form) since color-mix rendering varies by environment
- **Files modified:** `__tests__/DeviceChip.test.tsx`
- **Commit:** d3443fb1

**3. [Rule 1 - Bug] JSDoc false positive in React Compiler grep gate**
- **Found during:** Task 2 acceptance criteria check
- **Issue:** JSDoc comment `* No useMemo/useCallback` caused the grep gate `grep -REn 'useMemo|useCallback' | wc -l` to return 2 (not 0)
- **Fix:** Changed JSDoc to `RC-clean — no manual memoization hooks` in both DeviceChip.tsx and RoomCard.tsx
- **Files modified:** `DeviceChip.tsx`, `RoomCard.tsx`
- **Commit:** 84b944ba

## Known Stubs

None — this plan ships pure visual primitive components (no data source stubs, no placeholder text in rendered output).

## Threat Flags

None — components render only props-sourced data (room.name from frozen 6-tuple, device.name from validated hook outputs). React auto-escapes string content; no dangerouslySetInnerHTML used.

## Self-Check: PASSED

- FOUND: `app/components/EmberGlass/rooms/DeviceChip.tsx`
- FOUND: `app/components/EmberGlass/rooms/RoomCard.tsx`
- FOUND: `app/components/EmberGlass/rooms/__tests__/DeviceChip.test.tsx`
- FOUND: `app/components/EmberGlass/rooms/__tests__/RoomCard.test.tsx`
- FOUND: commit ea101110 (DeviceChip RED)
- FOUND: commit d3443fb1 (DeviceChip GREEN)
- FOUND: commit fd111fde (RoomCard RED)
- FOUND: commit 84b944ba (RoomCard GREEN)
