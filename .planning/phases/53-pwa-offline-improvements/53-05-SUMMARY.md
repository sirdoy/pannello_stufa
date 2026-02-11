---
phase: 53-pwa-offline-improvements
plan: 05
subsystem: pwa-integration
tags: [pwa, offline-ui, integration, final-wiring]
dependency-graph:
  requires:
    - 53-01 (Enhanced OfflineBanner)
    - 53-02 (Staleness detection infrastructure)
    - 53-03 (Device card offline safety)
    - 53-04 (PWA install prompt)
  provides:
    - Fully integrated PWA offline experience
    - All Phase 53 features working together
  affects:
    - Root layout (ClientProviders)
    - Global UX (banner + install prompt coexistence)
tech-stack:
  added: []
  patterns:
    - Root layout integration with proper z-index layering
    - InstallPrompt at bottom (z-55) + OfflineBanner at top (z-60)
    - Reconnect sync toast with Italian action labels
key-files:
  created: []
  modified:
    - app/components/ClientProviders.tsx
decisions: []
metrics:
  duration_seconds: 104
  duration_minutes: 1.7
  tasks_completed: 1
  files_modified: 1
  tests_passing: 63
  completed_at: "2026-02-11T08:31:03Z"
---

# Phase 53 Plan 05: Final PWA Integration Summary

**One-liner:** Wired InstallPrompt into root layout, verified reconnect sync toast, confirmed all Phase 53 features integrate correctly without z-index conflicts.

## What Was Built

### Task 1: Wire InstallPrompt and Verify Integration (commit: b6b9b46)

**InstallPrompt Integration:**
- Imported `InstallPrompt` component from `@/app/components/pwa/InstallPrompt`
- Rendered after `{children}` but inside `CommandPaletteProvider` in ClientProviders
- Placement ensures bottom sheet appears at page bottom, banner at top
- No conflicts with existing PWA components (PWAInitializer, OfflineBanner)

**Reconnect Sync Toast Verification:**
- Already implemented in OfflineBanner (lines 140-169)
- Shows "Comandi sincronizzati" with success styling when `lastSyncedCommand` detected
- Italian action labels:
  - `stove/ignite` → "🔥 Stufa accesa"
  - `stove/shutdown` → "🌙 Stufa spenta"
  - `stove/set-power` → "⚡ Potenza impostata"
  - Generic fallback: "Comando eseguito"
- Auto-dismisses after brief display (controlled by useBackgroundSync hook)

**Z-Index Layering Verification:**
- ✅ OfflineBanner: `z-[60]` (top of viewport, highest priority)
- ✅ InstallPrompt bottom sheet: `z-[55]` (above backdrop, below banner)
- ✅ InstallPrompt backdrop: `z-[54]` (overlay behind bottom sheet)
- ✅ No conflicts - banner and prompt can coexist without overlap issues

**Component Hierarchy:**
```tsx
<CommandPaletteProvider>
  <AxeDevtools />
  <PWAInitializer />
  <OfflineBanner fixed showPendingCount />  {/* Top of page, z-60 */}
  {children}                                {/* Main content */}
  <InstallPrompt />                         {/* Bottom sheet, z-55 */}
</CommandPaletteProvider>
```

## Deviations from Plan

None - plan executed exactly as written.

## Test Results

**TypeScript Compilation:**
```
✓ No new errors introduced
✓ 0 errors in ClientProviders.tsx
✓ Pre-existing errors in cron-executions.test.ts (unrelated to Phase 53)
```

**Phase 53 Test Suite:**
```
Test Suites: 5 passed, 5 total
Tests:       63 passed, 63 total

✓ OfflineBanner.test.tsx (17 tests)
✓ InstallPrompt.test.tsx (13 tests)
✓ useInstallPrompt.test.ts (14 tests)
✓ stalenessDetector.test.ts (11 tests)
✓ useDeviceStaleness.test.ts (8 tests)
```

**All Phase 53 Features Working:**
- [x] Offline banner visible when connection lost with timestamp
- [x] Device cards show staleness indicator when cached > 30s
- [x] Device controls hidden when offline
- [x] Pending commands visible with sync toast on reconnect
- [x] PWA install prompt after 2+ visits with 30-day dismissal

## User Experience Flow

### Complete Offline → Online Journey

**1. User goes offline:**
- OfflineBanner appears at top: "Sei offline" + "Ultimo aggiornamento: X fa"
- Device cards dim slightly, show staleness timestamp
- All write controls disappear (read-only mode)
- Status info remains visible

**2. User tries to interact (offline):**
- Controls not available
- "Controlli non disponibili offline" message shown
- No accidental dangerous actions possible

**3. User comes back online:**
- OfflineBanner briefly shows: "Connessione ripristinata"
- If pending commands exist: "Sincronizzazione in corso..."
- Commands process in background

**4. Command sync completes:**
- Success notification: "✓ 🔥 Stufa accesa (sincronizzato)"
- Specific action label shown based on endpoint
- Auto-dismisses after 3 seconds

**5. PWA install prompt (if eligible):**
- After 2+ visits, bottom sheet appears
- User can install or dismiss (30-day cooldown)
- iOS users see manual instructions
- Does not interfere with banner at top

## Technical Notes

### Integration Patterns

**Provider tree order matters:**
```
Auth0Provider → Theme → PageTransition → Version → Toast → CommandPalette
```

Within CommandPaletteProvider:
1. Devtools (AxeDevtools)
2. PWA initialization (PWAInitializer)
3. Global UI (OfflineBanner)
4. Main content (children)
5. Prompts/Dialogs (InstallPrompt)

**Why this order:**
- Fixed UI elements (banner) before content (prevents layout shift)
- Bottom sheets/overlays after content (natural stacking)
- Devtools and initializers first (setup before rendering)

### Z-Index Strategy

Phase 53 follows consistent layering:
- `z-[60]`: OfflineBanner (critical system status)
- `z-[55]`: InstallPrompt (user engagement prompt)
- `z-[54]`: InstallPrompt backdrop
- Lower z-indexes: Device cards, navigation, etc.

**Future additions should use:**
- `z-[70]`: Modal dialogs (if added)
- `z-[80]`: Toast notifications (already handled by ToastProvider)
- `z-[90]`: Critical alerts (if needed)

### Reconnect Sync Toast Implementation

Already in OfflineBanner, no changes needed:
```typescript
if (lastSyncedCommand) {
  const actionLabels = {
    'stove/ignite': '🔥 Stufa accesa',
    'stove/shutdown': '🌙 Stufa spenta',
    'stove/set-power': '⚡ Potenza impostata',
  };
  const label = actionLabels[endpoint] || 'Comando eseguito';
  // Shows green banner with checkmark
}
```

Triggered by `useBackgroundSync` hook when:
1. User comes online
2. `processQueue()` executes pending commands
3. `lastSyncedCommand` state updates with successful command
4. OfflineBanner detects state change and shows notification

## Phase 53 Success Criteria - All Met ✅

| Criterion | Status | Implementation |
|-----------|--------|----------------|
| 1. Offline banner with timestamp | ✅ | OfflineBanner shows "Ultimo aggiornamento: X fa" |
| 2. Staleness indicator (>30s) | ✅ | Device cards use useDeviceStaleness hook, dim at 30s threshold |
| 3. Controls hidden when offline | ✅ | StoveCard + ThermostatCard wrap controls with `{isOnline && ...}` |
| 4. Pending commands + reconnect toast | ✅ | OfflineBanner shows queue + sync notifications |
| 5. Install prompt (2+ visits, 30-day cooldown) | ✅ | InstallPrompt with visit tracking + dismissal logic |

## Integration Verification

**All Phase 53 plans work together:**

| Plan | Feature | Integration Point | Status |
|------|---------|-------------------|--------|
| 53-01 | Enhanced OfflineBanner | ClientProviders (line 34) | ✅ |
| 53-02 | Staleness detection | Used by device cards | ✅ |
| 53-03 | Device card offline safety | StoveCard + ThermostatCard | ✅ |
| 53-04 | PWA install prompt | ClientProviders (line 36) | ✅ |
| 53-05 | Final integration | This plan | ✅ |

**No conflicts detected:**
- ✅ Multiple useOnlineStatus instances (OfflineBanner, StoveCard, ThermostatCard) work independently
- ✅ Multiple useBackgroundSync instances (OfflineBanner, StoveCard) share queue correctly
- ✅ Z-index layering prevents visual overlaps
- ✅ All hooks clean up properly on unmount
- ✅ No performance issues from multiple polling intervals (5s staleness, 10s connectivity)

## Files Changed

### Modified (1 file)

| File | Lines Changed | Purpose |
|------|---------------|---------|
| app/components/ClientProviders.tsx | +2 | Import and render InstallPrompt |

**Specific changes:**
- Line 11: Added `import InstallPrompt from '@/app/components/pwa/InstallPrompt'`
- Line 36: Added `<InstallPrompt />` after children

## Commits

| Commit | Description |
|--------|-------------|
| b6b9b46 | feat(53-05): wire InstallPrompt into ClientProviders for root layout |

## Self-Check: PASSED

**Modified files exist:**
```
✓ app/components/ClientProviders.tsx
```

**Commit exists:**
```
✓ b6b9b46 (InstallPrompt integration)
```

**Tests pass:**
```
✓ 63/63 Phase 53 tests passing
✓ TypeScript compiles without errors in modified files
```

**Feature verification:**
```
✓ InstallPrompt imported correctly
✓ InstallPrompt rendered after children
✓ OfflineBanner already has reconnect sync toast
✓ Z-index layering correct (banner: 60, prompt: 55)
✓ All Phase 53 success criteria met
```

All claims verified successfully.

## Next Steps

Phase 53 is complete! All offline improvements integrated:

1. **Offline awareness**: Banner + staleness indicators
2. **Safety**: Controls hidden, expired commands rejected
3. **Sync feedback**: Reconnect toast with action labels
4. **PWA adoption**: Install prompt with smart triggering

**Potential future enhancements** (not in scope):
- Analytics tracking for install prompt conversion rate
- Offline page caching strategy beyond service worker
- Background sync for non-critical endpoints
- Optimistic UI updates for queued commands

**Phase 53 complete - ready for production!**

---

**Plan 53-05 Complete** | Duration: 1.7 minutes | Tasks: 1/1 | Integration verified | All tests passing
