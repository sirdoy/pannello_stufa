---
phase: 53-pwa-offline-improvements
plan: 01
subsystem: pwa-ui
tags: [offline-ui, ember-noir, command-queue, pwa]
dependency-graph:
  requires: []
  provides:
    - Enhanced OfflineBanner with Ember Noir styling
    - Command queue UI with cancel capability
    - Last update timestamp display
  affects:
    - app/components/ClientProviders.tsx (uses OfflineBanner)
    - PWA offline user experience
tech-stack:
  added: []
  patterns:
    - Dark/muted Ember Noir styling (slate-800/95, not alarming)
    - Expandable command queue with smooth transitions
    - Body padding-top for sticky banner layout
    - formatDistanceToNow for Italian timestamp formatting
key-files:
  created:
    - app/components/ui/__tests__/OfflineBanner.test.tsx
  modified:
    - app/components/ui/OfflineBanner.tsx
decisions: []
metrics:
  duration: 4 minutes
  tasks: 2
  files: 2
  tests: 17
  completed: 2026-02-11
---

# Phase 53 Plan 01: Enhanced Offline Banner Summary

**One-liner:** Redesigned OfflineBanner with dark/muted Ember Noir styling, last update timestamp, and expandable command queue with per-command cancel buttons for better offline awareness.

## What Was Built

Enhanced the existing OfflineBanner component to match Phase 53 user decisions:

### Task 1: Redesign OfflineBanner Component (commit: 1db1e75)

**Sticky top banner with Ember Noir styling:**
- Fixed positioning at top of viewport (z-index: 60)
- Dark/muted slate-800/95 background with subtle border (informational, NOT alarming)
- Backdrop blur for modern glass effect
- Body padding-top to push content down when banner visible
- Light mode support with slate-100/95 background

**Last update timestamp:**
- Uses `lastOnlineAt` from `useOnlineStatus` hook
- Formatted with `formatDistanceToNow` from date-fns with Italian locale
- Shows "Ultimo aggiornamento: 5 minuti fa" style message

**Expandable command queue:**
- Header shows "Comandi in coda (N)" with click-to-expand
- Each command displays: icon, label, timestamp, and cancel button
- Commands styled with bg-white/5 (dark) / bg-slate-200/50 (light)
- Max height 200px with overflow scrolling
- Smooth expand/collapse animations

**Per-command cancel button:**
- Outline variant Button component
- Calls `cancelCommand(id)` from `useBackgroundSync` hook
- X icon from lucide-react with "Annulla" text
- Accessible aria-label for each command

**Reconnection and sync notifications:**
- Success-styled green banner for "Connessione ripristinata"
- Shows sync in progress message when pending commands exist
- Brief display for synced command confirmations with action labels

### Task 2: Unit Tests (commit: 5555662)

**17 comprehensive test cases:**
1. Banner visibility when online/offline
2. Last online timestamp display with date-fns formatting
3. Command queue section rendering
4. Queue expansion on click
5. Label, time, and cancel button for each command
6. CancelCommand callback with correct ID
7. Reconnect banner with "Connessione ripristinata"
8. Sync message for pending commands
9. Action labels for stove ignite/shutdown/set-power
10. Generic label for unknown commands
11. Fixed positioning prop application

**Mock patterns:**
- `jest.mock()` for useOnlineStatus and useBackgroundSync hooks
- date-fns formatDistanceToNow mocked for consistent testing
- Testing Library render/screen/fireEvent for interactions

## Deviations from Plan

None - plan executed exactly as written.

## Test Results

**OfflineBanner.test.tsx:** All 17 tests passing
- Banner visibility: 2 tests ✓
- Last online timestamp: 2 tests ✓
- Command queue: 4 tests ✓
- Cancel interaction: 1 test ✓
- Reconnect banner: 2 tests ✓
- Synced notifications: 4 tests ✓
- Fixed positioning: 2 tests ✓

**TypeScript:** No compilation errors for OfflineBanner files

## Verification

✅ OfflineBanner shows sticky top banner with Ember Noir styling when offline
✅ Last successful update timestamp displayed with Italian locale
✅ Pending commands listed with cancel capability
✅ Reconnect notification works
✅ All tests pass
✅ TypeScript compiles without OfflineBanner errors
✅ OfflineBanner still exported from app/components/ui/index.ts
✅ ClientProviders.tsx still imports and renders OfflineBanner correctly

## Self-Check: PASSED

**Created files exist:**
- ✓ app/components/ui/__tests__/OfflineBanner.test.tsx

**Modified files exist:**
- ✓ app/components/ui/OfflineBanner.tsx

**Commits exist:**
- ✓ 1db1e75 (feat: redesign OfflineBanner)
- ✓ 5555662 (test: add comprehensive unit tests)

All claimed artifacts verified successfully.

## Technical Notes

### Ember Noir Styling Pattern
- **Dark mode:** `bg-slate-800/95 border-slate-700/50 text-slate-200/400`
- **Light mode:** `bg-slate-100/95 border-slate-200 text-slate-700/600`
- **Philosophy:** Informational, not alarming (no amber/red colors)
- **Contrast:** WifiOff icon from lucide-react instead of emoji

### Layout Pattern
- Fixed banner dynamically calculates height via CSS custom properties
- Body padding-top applied/removed via useEffect
- Smooth transitions for expand/collapse (max-h with overflow)
- Estimated height: base 60px + (commands × 56px) + 40px padding, capped at 300px

### Integration Points
- `useOnlineStatus`: isOnline, wasOffline, lastOnlineAt
- `useBackgroundSync`: pendingCommands (as FormattedCommand[]), cancelCommand
- `formatCommandForDisplay`: returns label, icon, formattedTime from backgroundSync.ts
- ClientProviders renders: `<OfflineBanner fixed showPendingCount />`

### Italian Localization
- "Sei offline" (offline title)
- "Ultimo aggiornamento: X fa" (last update)
- "Comandi in coda (N)" (commands in queue)
- "Annulla" (cancel button)
- "Connessione ripristinata" (connection restored)
- date-fns locale: `it` from 'date-fns/locale'

## Future Considerations

None - implementation complete as specified. Future enhancements tracked in Phase 53 subsequent plans.
