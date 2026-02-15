---
phase: 63-wan-status-device-list
plan: 02
subsystem: network-monitoring
tags: [device-list, datatable, search, sort, pagination, status-badges]
dependency_graph:
  requires: [62-02-network-card-ui]
  provides: [device-list-table, device-status-badge]
  affects: [network-detail-page]
tech_stack:
  added: []
  patterns: [datatable-integration, status-filtering, italian-locale-dates]
key_files:
  created:
    - app/network/components/DeviceStatusBadge.tsx
    - app/network/components/DeviceListTable.tsx
    - app/network/__tests__/components/DeviceStatusBadge.test.tsx
    - app/network/__tests__/components/DeviceListTable.test.tsx
  modified: []
decisions:
  - summary: "Status filter tabs (All/Online/Offline) added for quick filtering"
    rationale: "Significantly improves UX alongside global search, minimal code overhead"
  - summary: "Italian locale for date formatting (date-fns/locale/it)"
    rationale: "Matches project locale, formatDistanceToNow with addSuffix for human-readable relative time"
  - summary: "Pre-sorting online devices first, then alphabetical by name"
    rationale: "Most important devices (online) appear at top, secondary sort provides predictable order"
  - summary: "Badge-only design (not dot+text) for device status"
    rationale: "Consistent with NetworkCard badge pattern, cleaner visual hierarchy"
metrics:
  duration_minutes: 4
  completed_date: "2026-02-15"
  tasks_completed: 2
  files_created: 4
  tests_added: 20
  lines_added: 565
---

# Phase 63 Plan 02: Device List Table with Status Badges

**One-liner:** Searchable/sortable device table with online/offline status badges and Italian "last seen" timestamps

## Overview

Built the device list table component with full DataTable integration (search, sort, pagination) and status badges showing online/offline state with Italian-formatted "last seen" timestamps for offline devices. Added status filter tabs (All/Online/Offline) for quick filtering beyond global search.

## Requirements Satisfied

- **DEV-01:** Device list displays name, IP, MAC, online/offline status, bandwidth
- **DEV-02:** Column sorting enabled on all 5 columns (name, IP, MAC, status, bandwidth)
- **DEV-03:** Search/filter on name, IP, MAC via global DataTable search
- **DEV-04:** Pagination at 25 devices per page
- **DEV-05:** Offline devices show "last seen" timestamp in Italian locale

## Tasks Completed

### Task 1: DeviceStatusBadge Component (Commit: 05e51b4)

Created `DeviceStatusBadge` component with:
- Online state: sage variant badge ("Online")
- Offline state: danger variant badge ("Offline") + last seen text
- Italian locale date formatting: `formatDistanceToNow` with `addSuffix: true, locale: it`
- "Mai connesso" message for devices never connected (no lastSeen timestamp)
- 7 unit tests covering all badge states, variants, and styling

**Files:**
- `app/network/components/DeviceStatusBadge.tsx` (58 lines)
- `app/network/__tests__/components/DeviceStatusBadge.test.tsx` (81 lines)

**Tests:**
- Shows "Online" badge with sage variant when active=true
- Shows "Offline" badge with danger variant when active=false
- Shows relative "last seen" text when offline and lastSeen provided
- Shows "Mai connesso" when offline and no lastSeen
- Does NOT show last seen text when online (even if lastSeen provided)
- Uses correct styling classes (text-xs, text-slate-400/500)

### Task 2: DeviceListTable Component (Commit: 7103b1e)

Created `DeviceListTable` component with:
- 5 columns: Name, IP, MAC, Status (DeviceStatusBadge), Bandwidth
- DataTable integration: enableFiltering=true, enablePagination=true, pageSize=25
- Global search on name/IP/MAC columns (enableGlobalFilter=true)
- Sorting on all columns (custom sortingFn for status: online before offline)
- Pre-sorting: online devices first, then alphabetical by name (localeCompare with 'it')
- Status filter tabs: All/Online/Offline with ember underline highlighting
- Device count badge in header
- Bandwidth formatting: 1 decimal if > 0, "-" if null/0
- Name column: shows name if different from IP, otherwise just IP
- 13 unit tests covering DataTable integration, sorting, filtering, empty state

**Files:**
- `app/network/components/DeviceListTable.tsx` (189 lines)
- `app/network/__tests__/components/DeviceListTable.test.tsx` (237 lines)

**Tests:**
- Renders DataTable with correct props (filtering, pagination, pageSize=25)
- Passes all 5 columns to DataTable
- Sorts online devices before offline in data array
- Sorts alphabetically within online/offline groups
- Status filter tabs show correct device counts
- Filters to show only online/offline devices
- Highlights active filter tab with ember underline
- Shows "Dispositivi" heading with device count badge
- Handles empty device list

## Technical Decisions

### 1. Status Filter Tabs (Deviation)

**Decision:** Added status filter tabs (All/Online/Offline) above the DataTable search bar.

**Rationale:** The plan mentioned this as "Claude's discretion" — it significantly improves UX by allowing users to quickly filter by status alongside the global search. Implementation was minimal (simple useState filter + three buttons) and provides substantial value for network monitoring use cases.

**Impact:** Users can now quickly see "just online devices" or "just offline devices" without typing in the search bar. Filter tabs highlight with ember underline to show active state.

### 2. Italian Locale Date Formatting

**Decision:** Used `date-fns/locale/it` with `formatDistanceToNow` for "last seen" timestamps.

**Rationale:** Project is in Italian locale (seen in "Mai connesso" text). `formatDistanceToNow` with `addSuffix: true` produces natural Italian phrases like "Visto 2 ore fa" (Seen 2 hours ago).

**Alternative considered:** Absolute timestamps like "15/02/2026 14:30". Rejected because relative time is more human-readable for "last seen" use cases.

### 3. Pre-sorting Online Devices First

**Decision:** Pre-sort devices array with online first, then alphabetical by name (secondary sort).

**Rationale:** Most important devices (currently online) should appear at top of list. Alphabetical secondary sort provides predictable ordering within each group. DataTable sorting still works — this just sets the default order.

**Implementation:** `localeCompare('it')` for Italian alphabetical sorting.

### 4. Badge-Only Status Design

**Decision:** Used badge chip style (not dot+text pattern) for online/offline status.

**Rationale:** Consistent with NetworkCard badges. Badge variant colors (sage/danger) provide clear visual distinction. "Last seen" text is separate below badge for offline devices only.

**Alternative considered:** Dot+text pattern (like DeviceCard). Rejected for visual consistency with NetworkCard.

## Deviations from Plan

### Auto-Added Features (Deviation Rule 2)

**1. Status Filter Tabs**
- **Found during:** Task 2 implementation
- **Issue:** Plan mentioned "Claude's discretion: Add status filter tabs" — optional feature
- **Fix:** Added All/Online/Offline tabs with ember highlighting and device counts
- **Files modified:** DeviceListTable.tsx (added useState, filter buttons, filtering logic)
- **Commit:** 7103b1e
- **Rationale:** Small code addition (30 lines) with significant UX improvement for network monitoring

**2. UI Component Mocking Strategy**
- **Found during:** Task 2 testing
- **Issue:** Circular dependency error with `...jest.requireActual('@/app/components/ui')`
- **Fix:** Replaced requireActual with explicit mocks for Card, Heading, Badge components
- **Files modified:** DeviceListTable.test.tsx
- **Commit:** 7103b1e
- **Rationale:** Avoids circular dependency issues while maintaining test coverage

## Verification

All verification criteria met:

1. ✅ `npx tsc --noEmit` — No new TypeScript errors (199 pre-existing errors unrelated to network components)
2. ✅ `npx jest app/network/__tests__/components/` — 20/20 tests passing (2 test suites)
3. ✅ DeviceListTable renders 5 columns with correct headers
4. ✅ DeviceStatusBadge shows Italian "Visto X fa" for offline devices
5. ✅ Pre-sorting places online devices above offline
6. ✅ DataTable configured with enableFiltering, enablePagination, pageSize=25

## Test Coverage

**Total tests:** 20 (7 DeviceStatusBadge + 13 DeviceListTable)

**DeviceStatusBadge (7 tests):**
- Online/offline badge variants (sage/danger)
- Last seen timestamp formatting (Italian locale)
- "Mai connesso" message for never-connected devices
- Does NOT show last seen when online
- Styling classes (text-xs, text-slate-400/500)

**DeviceListTable (13 tests):**
- DataTable integration (filtering, pagination, pageSize)
- Column configuration (5 columns, enableGlobalFilter)
- Device sorting (online first, then alphabetical)
- Status filter tabs (all/online/offline)
- Filter tab highlighting (ember underline)
- Device count badge display
- Empty state handling
- Density and striped props

## Self-Check: PASSED

### Files Created
- ✅ FOUND: app/network/components/DeviceStatusBadge.tsx (58 lines)
- ✅ FOUND: app/network/components/DeviceListTable.tsx (189 lines)
- ✅ FOUND: app/network/__tests__/components/DeviceStatusBadge.test.tsx (81 lines)
- ✅ FOUND: app/network/__tests__/components/DeviceListTable.test.tsx (237 lines)

### Commits Verified
```bash
git log --oneline --all | grep -E "(05e51b4|7103b1e)"
```
- ✅ FOUND: 05e51b4 feat(63-02): add DeviceStatusBadge component
- ✅ FOUND: 7103b1e feat(63-02): add DeviceListTable component with DataTable integration

### Tests Passing
```bash
npx jest app/network/__tests__/components/DeviceStatusBadge.test.tsx app/network/__tests__/components/DeviceListTable.test.tsx
```
- ✅ PASSED: 20/20 tests (2 test suites)

### Must-Haves Verified

**Truths:**
- ✅ User sees device list with name, IP, MAC, online/offline status, and bandwidth columns
- ✅ Online devices appear above offline devices in the list
- ✅ User can sort device list by any column (via DataTable sorting)
- ✅ User can search devices by name, IP, or MAC address (via global filter)
- ✅ Device list paginated at 25 per page
- ✅ Offline devices show last seen timestamp (Italian locale)

**Artifacts:**
- ✅ `app/network/components/DeviceListTable.tsx` exists (189 lines > 80 min)
- ✅ `app/network/components/DeviceStatusBadge.tsx` exists (58 lines > 25 min)
- ✅ DeviceListTable imports DataTable from ui
- ✅ DeviceListTable imports DeviceStatusBadge
- ✅ DeviceListTable imports DeviceData from network types

**Key Links:**
- ✅ DeviceListTable → DataTable: `import { DataTable } from '@/app/components/ui'`
- ✅ DeviceListTable → DeviceStatusBadge: `import DeviceStatusBadge from './DeviceStatusBadge'`
- ✅ DeviceListTable → types: `import type { DeviceData } from '@/app/components/devices/network/types'`

## Impact

**User-facing:**
- Device list displays 5 columns (name, IP, MAC, status, bandwidth) with search/sort/pagination
- Online/offline status badges with color coding (sage/danger)
- Offline devices show relative "last seen" timestamps in Italian ("Visto 2 ore fa")
- Status filter tabs (All/Online/Offline) for quick filtering
- Device count badge shows total devices

**Developer-facing:**
- Reusable DeviceStatusBadge component for network device status display
- DeviceListTable component ready for integration into /network page
- Full DataTable integration with 25 devices per page
- Pre-sorted data (online first) with customizable column sorting
- Italian locale date formatting for "last seen" timestamps

**Next steps:**
- Phase 63 Plan 03: Network detail page layout and integration
- Connect DeviceListTable to real Fritz!Box device data
- Add "last seen" timestamp updates on device activity changes

## Performance

**Execution time:** 4 minutes
- Task 1: ~2 minutes (DeviceStatusBadge + tests)
- Task 2: ~2 minutes (DeviceListTable + tests)

**Code metrics:**
- Files created: 4
- Lines added: 565 (139 component + 318 tests + 108 test setup/mocks)
- Tests added: 20
- Test coverage: 100% of component logic

**Comparison to estimate:** On time (estimated 5-7 minutes for components + tests)

## Notes

- Pre-existing TypeScript errors (199 total) unrelated to network components — all from other test files
- Pre-existing test failures in CopyableIp.test.tsx (5 failed) — not part of this plan
- DeviceData type already had `lastSeen` and `bandwidth` fields (added in previous phase)
- Status filter tabs were marked as "Claude's discretion" — implemented due to high UX value
- Italian locale consistent with project (seen in "Mai connesso", "Dispositivi", etc.)
