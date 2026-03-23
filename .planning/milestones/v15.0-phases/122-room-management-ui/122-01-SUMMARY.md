---
phase: 122-room-management-ui
plan: "01"
subsystem: rooms-ui
tags: [rooms, ui, tdd, data-table, hooks]
dependency_graph:
  requires: [types/rooms.ts, /api/rooms, /api/rooms/health]
  provides: [app/rooms/page.tsx, useRooms hook, useRoomsHealth hook]
  affects: []
tech_stack:
  added: []
  patterns: [inline-hooks, orchestrator-pattern, badge-singular-plural]
key_files:
  created:
    - app/rooms/page.tsx
    - app/rooms/__tests__/page.test.tsx
  modified: []
decisions:
  - useRooms sorts rooms by Italian locale (localeCompare 'it') with no pagination per D-05/D-06
  - useRoomsHealth errors silently — health display is non-critical
  - Health stats use `health !== null` guard (not truthiness) for correctness
  - Pre-declared showCreate/roomToEdit/roomToDelete state enables clean Plan 02 extension
metrics:
  duration: "192s"
  completed_date: "2026-03-23"
  tasks_completed: 2
  files_created: 2
  files_modified: 0
---

# Phase 122 Plan 01: Rooms Page Read-Only Foundation Summary

**One-liner:** Rooms management page with useRooms + useRoomsHealth hooks, DataTable listing rooms with Italian device count badges, loading/error/empty states, and health stats.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Failing tests (RED) for ROOM-01 display behaviors | 6bb06b09 | app/rooms/__tests__/page.test.tsx |
| 2 | Implement Rooms page with hooks and DataTable (GREEN) | acaedef3 | app/rooms/page.tsx |

## What Was Built

### `app/rooms/page.tsx`
- `useRooms` inline hook: fetches `GET /api/rooms`, sorts by name (Italian locale), manages loading/error state
- `useRoomsHealth` inline hook: fetches `GET /api/rooms/health`, silently ignores errors
- DataTable with 5 columns: name, description (em-dash for null), device_count (Badge with "dispositivo"/"dispositivi" singular/plural), created_at (it-IT locale), actions (Modifica/Elimina buttons)
- Health stats row: Stanze / Dispositivi assegnati / Orfani with `health !== null` guard
- Loading → Skeleton; Error → Banner; Empty → "Nessuna stanza creata" + create button; List → DataTable
- Pre-declared state vars: `showCreate`, `roomToEdit`, `roomToDelete` for Plan 02 mutation extension

### `app/rooms/__tests__/page.test.tsx`
- 7 ROOM-01 test cases: room list, badge singular/plural, loading, error, empty, health stats, date formatting
- Mock setup mirrors Phase 121 pattern (DataTable, FormModal, Badge, Banner, Skeleton, etc.)
- Fetch routing mock: `/api/rooms` → mockRooms, `/api/rooms/health` → mockHealth

## Test Results

All 7 ROOM-01 tests pass (GREEN):
- Test 1: renders room list with 2 rooms
- Test 2: device_count Badge — "3 dispositivi", "0 dispositivi", "1 dispositivo"
- Test 3: loading Skeleton before fetch resolves
- Test 4: error Banner when fetch rejects
- Test 5: empty state "Nessuna stanza creata"
- Test 6: health stats (5/12/2) all visible
- Test 7: created_at formatted in it-IT locale

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

- `showCreate` state is declared but FormModal is not yet mounted — Plan 02 will wire the create/edit/delete mutation flows. The page renders correctly for the read-only goal of ROOM-01.

## Self-Check: PASSED

- [x] app/rooms/page.tsx exists (188 lines, > 80 min)
- [x] app/rooms/__tests__/page.test.tsx exists (310 lines, > 100 min)
- [x] Commit 6bb06b09 exists (RED test file)
- [x] Commit acaedef3 exists (GREEN implementation)
- [x] 0 TypeScript errors in rooms files
- [x] 7/7 ROOM-01 tests pass
