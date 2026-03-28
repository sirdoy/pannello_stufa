---
phase: 144-connection-ux
plan: "01"
subsystem: connection-ux
tags: [websocket, navbar, connection-status, relative-time, italian-ux]
requirements_completed: [UX-01, UX-02]
dependency_graph:
  requires: [WebSocketContext, useWebSocketManager, ConnectionStatus]
  provides: [useRelativeTime, formatRelativeTime, LastUpdated, NavbarConnectionStatus]
  affects: [Navbar.tsx]
tech_stack:
  added: []
  patterns: [setInterval-cleanup, ReadyState-mapping, TDD-red-green]
key_files:
  created:
    - lib/hooks/useRelativeTime.ts
    - lib/hooks/__tests__/useRelativeTime.test.ts
    - app/components/ui/LastUpdated.tsx
    - app/components/ui/__tests__/LastUpdated.test.tsx
    - app/components/layout/NavbarConnectionStatus.tsx
    - app/components/layout/__tests__/NavbarConnectionStatus.test.tsx
  modified:
    - app/components/Navbar.tsx
decisions:
  - "mapReadyState exported as named function for direct unit testing (not inline arrow)"
  - "WS_STATUS_LABELS record indexed by WsStatus union, not ReadyState, for cleaner template usage"
  - "LastUpdated test mocks useRelativeTime to isolate component from hook behavior"
  - "Worktree rebased onto main (75 commits) before execution — worktree was missing WebSocket infrastructure files"
metrics:
  duration: "33 minutes"
  completed_date: "2026-03-28"
  tasks_completed: 2
  files_created: 6
  files_modified: 1
---

# Phase 144 Plan 01: Connection UX Foundation Summary

**One-liner:** Navbar WebSocket status indicator with Italian labels (Connesso via WS / Riconnessione... / Polling attivo) + useRelativeTime hook and LastUpdated component foundation for card timestamps.

## What Was Built

### Task 1: useRelativeTime + LastUpdated (TDD)

**`lib/hooks/useRelativeTime.ts`** — Pure function + React hook:
- `formatRelativeTime(tsMs)`: converts ms timestamp to Italian string. <5s → "Adesso", <60s → "Xs fa", <60min → "Xm fa", else → "Xh fa"
- `useRelativeTime(tsMs)`: React hook wrapping formatRelativeTime with 10-second setInterval auto-refresh. Returns null for null input. Cleans up interval on unmount.

**`app/components/ui/LastUpdated.tsx`** — Presentational component:
- Accepts `tsMs: number | null` and optional `className`
- Returns null when tsMs is null (no data yet)
- Renders `<p className="text-xs ...">Aggiornato {relative}</p>` when data is available

**Tests:** 16 tests passing (5 formatRelativeTime + 6 useRelativeTime + 6 LastUpdated with mocked hook).

### Task 2: NavbarConnectionStatus + Navbar integration

**`app/components/layout/NavbarConnectionStatus.tsx`** — Connection indicator:
- `mapReadyState(rs: ReadyState): WsStatus` maps OPEN→online, CONNECTING→connecting, all others (CLOSED/CLOSING/UNINSTANTIATED)→offline
- `NavbarConnectionStatus` component reads `useWebSocketContext().readyState` and renders `<ConnectionStatus status={...} label={...} size="sm" />`
- Italian labels: `{ online: 'Connesso via WS', connecting: 'Riconnessione...', offline: 'Polling attivo' }`

**`app/components/Navbar.tsx`** — Wired:
- Import: `import { NavbarConnectionStatus } from './layout/NavbarConnectionStatus';`
- Render: `<NavbarConnectionStatus />` as first child of `{/* User & Menu Buttons */}` div, visible on all screen sizes before the hamburger button

**Tests:** 10 tests passing (5 mapReadyState unit + 5 NavbarConnectionStatus render tests).

## Total: 26 tests, 6 new files, 1 modified file

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Worktree missing WebSocket infrastructure files**
- **Found during:** Pre-execution setup
- **Issue:** The `worktree-agent-aa3bc8bb` branch was based on commit `febf0e69` (v16.0 era), missing 75 commits from main including `lib/hooks/useWebSocketManager.ts`, `app/context/WebSocketContext.ts`, and related WS infrastructure
- **Fix:** `git rebase main` to bring worktree branch up to date with all infrastructure from phases 139-143
- **Files modified:** None (git operation, no code changes)
- **Commit:** N/A (git operation)

**2. [Rule 1 - Bug] Timer afterEach warning in useRelativeTime tests**
- **Found during:** Task 1 verification
- **Issue:** `jest.runOnlyPendingTimers()` in `afterEach` fired state updates outside `act()`, generating React warnings
- **Fix:** Wrapped `jest.runOnlyPendingTimers()` in `act(() => {...})` in both describe blocks
- **Files modified:** `lib/hooks/__tests__/useRelativeTime.test.ts`
- **Commit:** Included in Task 1 commit `791d3758`

## Known Stubs

None. All components have their data sources properly wired:
- `NavbarConnectionStatus` reads live `readyState` from `useWebSocketContext()`
- `LastUpdated` uses `useRelativeTime` which computes from real timestamps
- `formatRelativeTime` uses `Date.now()` for all computations

## Success Criteria Verification

1. NavbarConnectionStatus maps OPEN→online, CONNECTING→connecting, CLOSED/CLOSING/UNINSTANTIATED→offline: **PASS** (5 mapReadyState tests)
2. Italian labels "Connesso via WS", "Riconnessione...", "Polling attivo": **PASS** (5 render tests)
3. formatRelativeTime Italian strings for all tiers: **PASS** (5 formatRelativeTime tests)
4. useRelativeTime updates every 10s and cleans up interval: **PASS** (6 hook tests)
5. LastUpdated renders null for null, "Aggiornato {relative}" for valid timestamps: **PASS** (6 component tests)
6. All 26 new tests pass: **PASS**

## Self-Check: PASSED

Files verified:
- FOUND: lib/hooks/useRelativeTime.ts
- FOUND: lib/hooks/__tests__/useRelativeTime.test.ts
- FOUND: app/components/ui/LastUpdated.tsx
- FOUND: app/components/ui/__tests__/LastUpdated.test.tsx
- FOUND: app/components/layout/NavbarConnectionStatus.tsx
- FOUND: app/components/layout/__tests__/NavbarConnectionStatus.test.tsx

Commits verified:
- FOUND: 791d3758 (Task 1)
- FOUND: 77f546bb (Task 2)
