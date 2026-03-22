# Phase 117: Dead Code & Cleanup - Research

**Researched:** 2026-03-22
**Domain:** Dead code removal (knip), disabled code deletion, Firebase RTDB grace period tracking
**Confidence:** HIGH

## Summary

Phase 117 is the final phase of v14.1. It has three independent streams: (1) remove unused exports identified by knip, (2) delete a disabled code block in `notificationService.ts`, and (3) implement STARTING state grace period tracking in `healthMonitoring.ts`.

Knip was run against the current codebase and identified **192 total unused exports**. Of these, 71 are in `app/components/ui/index.ts` (the design system barrel — explicitly out of scope per D-04). The remaining **121 exports** span lib utilities, component files, hooks, and test helpers. The original "48" count from the CONTEXT.md has grown after phases 113-116 changes. The planner must use the current live count (121 in-scope), not the historical 48.

The CLEAN-02 work is trivial: the disabled block at lines 487-513 of `notificationService.ts` is a commented-out function that was never migrated — `tokenCleanupService.ts` and `/api/notifications/cleanup` already handle the work. The block must be deleted and a brief JSDoc reference added. The CLEAN-03 work requires adding `adminDbGet`/`adminDbSet` calls in `detectStateMismatch()` to write/read a Firebase timestamp at `health/stoveStarting/{userId}` and compare against `GRACE_PERIOD_MS` (already defined at line 19).

**Primary recommendation:** Split into two plans — Plan 1 for CLEAN-01 (knip unused exports), Plan 2 for CLEAN-02 + CLEAN-03 (service cleanup + grace period logic). The export removal is mechanical and high-volume; the grace period implementation requires careful Firebase integration.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Unused export removal (CLEAN-01)**
- D-01: Run knip to get the current list of unused exports — the "48" count may have shifted after phases 113-116
- D-02: Remove only the export keyword if the function/constant is used internally; delete entirely if nothing references it
- D-03: If removing an export leaves a file empty, delete the file and remove its import from any barrel index
- D-04: Design system barrel exports (131) are explicitly OUT OF SCOPE — intentional public API surface

**notificationService cleanup (CLEAN-02)**
- D-05: Delete the entire disabled block (lines ~482-513) including the TODO comment — the migration is already complete
- D-06: The existing `/api/notifications/cleanup` route + `tokenCleanupService.ts` already handles token cleanup via Admin SDK — no new code needed
- D-07: Add a brief JSDoc note at the top of notificationService.ts referencing `/api/notifications/cleanup` for token lifecycle management

**healthMonitoring STARTING grace period (CLEAN-03)**
- D-08: Store STARTING entry timestamp in Firebase RTDB at `health/stoveStarting/{userId}` — written by the health check cron when stove state is first observed as STARTING
- D-09: Grace period logic: if `now - entryTime < GRACE_PERIOD_MS (15 min)` → return null (no alert); if `>= 15 min` AND still STARTING → flag as mismatch
- D-10: Clean up the Firebase key when stove state leaves STARTING (transitions to ON, OFF, or ALARM)
- D-11: Use `adminDbGet`/`adminDbSet` (Admin SDK) for reading/writing the timestamp — consistent with existing health monitoring patterns
- D-12: If no entry timestamp exists and state is STARTING → write current timestamp and return null (first observation, start grace period)

### Claude's Discretion
- Exact knip configuration or CLI flags
- Whether to batch export removals by file or by domain area
- Error handling for Firebase read/write in grace period tracking
- Whether the grace period key cleanup happens inline or as a separate step

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CLEAN-01 | 48 unused utility exports removed (identified by knip) | Knip run produced 121 in-scope unused exports (count shifted from 48 after phases 113-116). Remove export keyword or delete if nothing uses the symbol internally. Design system barrel (71 exports in app/components/ui/index.ts) is out of scope. |
| CLEAN-02 | TODO in `notificationService.ts` resolved (migrate cleanup to API route) | Migration is already done. Lines 487-513 (disabled block + TODO comment) can be deleted. `tokenCleanupService.ts` + `/api/notifications/cleanup` are the canonical replacement. Add JSDoc reference at top of file. |
| CLEAN-03 | TODO in `healthMonitoring.ts` resolved (stove STARTING grace period tracking) | GRACE_PERIOD_MS = 15 min is already defined at line 19. detectStateMismatch() at lines 144-149 has the TODO. adminDbGet/adminDbSet are imported from @/lib/firebaseAdmin. Firebase path: health/stoveStarting/{userId}. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| knip | Already in devDependencies | Dead export detection | Used in Phase 48; project standard for export audit |
| firebase-admin | Already installed | adminDbGet/adminDbSet for grace period | Consistent with all health monitoring patterns |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| N/A | — | No new dependencies needed | All tooling already present |

**No new installs required.** All tools (knip, firebase-admin) are already in devDependencies/dependencies.

## Architecture Patterns

### Pattern 1: Export-only vs internally-used symbols
**What:** When knip flags an export, check whether the symbol is used anywhere within the same codebase. If yes → remove just the `export` keyword. If no → delete the symbol entirely.

**Decision tree per flagged export:**
```
1. Search codebase for symbol name (excluding its own source file)
2. Found in app/ or lib/ (non-test)? → remove `export` only
3. Found only in __tests__/ → still delete (test files can import non-exported via barrel or direct path)
4. Not found anywhere? → delete the symbol entirely
5. If file becomes empty after deletions → delete file, update any barrel index
```

**Phase 48 prior art:** 203 exports removed with this same approach. knip was the tool; the decision tree was identical.

### Pattern 2: detectStateMismatch grace period (CLEAN-03)
**What:** The STARTING branch at lines 144-149 needs Firebase read/write to track when the stove first entered STARTING state.

**Current code (lines 144-149):**
```typescript
// Handle STARTING states - grace period (don't flag immediately)
if (actualCategory === 'STARTING') {
  // TODO: Track when stove entered STARTING state to apply grace period
  // For now, don't flag STARTING as mismatch (allow time to transition)
  return null;
}
```

**Required replacement pattern:**
```typescript
// Handle STARTING states - grace period
if (actualCategory === 'STARTING') {
  const entryTimestamp = await adminDbGet<number>(`health/stoveStarting/${userId}`);

  if (!entryTimestamp) {
    // First observation: record entry time, start grace period
    await adminDbSet(`health/stoveStarting/${userId}`, Date.now()).catch(err =>
      console.error('[detectStateMismatch] Failed to write STARTING timestamp:', err)
    );
    return null; // Grace period starts now
  }

  const elapsed = Date.now() - entryTimestamp;
  if (elapsed < GRACE_PERIOD_MS) {
    return null; // Still within grace period
  }

  // Grace period expired — flag as mismatch
  return {
    detected: true,
    expected: expectedState,
    actual: statusDescription,
    reason: 'starting_timeout',
  };
}

// When stove leaves STARTING (transitions to ON/OFF/ALARM), clean up the key:
// Add at the end of detectStateMismatch before final return null:
// adminDbRemove(`health/stoveStarting/${userId}`).catch(() => {});
```

**Important constraint:** `detectStateMismatch()` is currently synchronous (returns `null | object`). Adding `adminDbGet`/`adminDbSet` makes it async — the function signature must change to `async function detectStateMismatch(...)` returning `Promise<...>`. All callers (`checkUserStoveHealth`) already use `await` on the result, so this is backward compatible.

**userId threading:** `detectStateMismatch()` currently receives `stoveResult, scheduleResult, netatmoResult` — no `userId`. The planner must add `userId: string` as a 4th parameter. Caller in `checkUserStoveHealth` already has `userId` in scope (line 44).

### Pattern 3: Key cleanup placement
Per D-10, the RTDB key at `health/stoveStarting/{userId}` must be removed when the stove leaves STARTING. The cleanest placement is inline inside `detectStateMismatch` — after the STARTING block, before any comparison logic, check if `actualCategory !== 'STARTING'` and fire-and-forget `adminDbRemove`.

### Anti-Patterns to Avoid
- **Deleting design system barrel exports:** `app/components/ui/index.ts` — 71 exports — are explicitly out of scope. Do not touch them.
- **Removing exports used only in tests:** Verify usage against source files; test-only usage is still usage for the purpose of "remove export keyword vs delete".
- **Making detectStateMismatch async without updating callers:** Must audit all call sites.
- **Using filterUndefined() for adminDbSet with primitive:** `adminDbSet(path, Date.now())` — the value is a number, not an object, so filterUndefined() is not applicable here.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dead export detection | Manual grep audit | `npx knip --reporter json` | Knip handles re-exports, barrel merging, type-only exports correctly |
| Firebase Admin read/write | Raw firebase-admin db.ref() calls | `adminDbGet<T>()` / `adminDbSet()` from `@/lib/firebaseAdmin` | Consistent with all existing health monitoring code |
| Token cleanup | New implementation | `tokenCleanupService.ts` + existing route | Already implemented and tested |

## Current Knip Results (Actual, 2026-03-22)

Running `npx knip --reporter json` against the current codebase:
- **Total unused exports:** 192
- **Design system barrel (`app/components/ui/index.ts`):** 71 — OUT OF SCOPE (D-04)
- **In-scope unused exports:** 121

### In-Scope Exports Grouped by File

**lib/ utilities (highest priority — the original CLEAN-01 intent):**
| File | Exports to Remove |
|------|-------------------|
| `lib/core/index.ts` | ERROR_MESSAGES, mapLegacyError, created, handleError, unauthorized, timeout, serverError, stoveOffline, maintenanceRequired, netatmoReconnect, redirect, parseQueryObject, validateRange, validateEmail, validateString, validateArray, validateBoolean, getOptionalPathParam (18 exports) |
| `lib/core/apiResponse.ts` | serverError, redirect (2 exports — duplicated via index.ts) |
| `lib/errorMonitor.ts` | sendErrorPushNotification (1 export) |
| `lib/tokenRefresh.ts` | forceTokenRefresh (1 export) |
| `lib/tokenStorage.ts` | requestPersistentStorage, checkPersistence, clearToken, getStorageStatus (4 exports) |
| `lib/health/healthDeadManSwitch.ts` | alertDeadManSwitch (1 export — only used in tests) |
| `lib/health/healthMonitoring.ts` | determineConnectionStatus, detectStateMismatch (2 exports — only used in tests, become private after CLEAN-03 async refactor) |
| `lib/health/healthLogger.ts` | getRecentHealthLogs, getHealthCheckDetails (2 exports — only used in tests) |
| `lib/notifications/notificationService.ts` | supportsNotificationActions, getNotificationCapabilities (2 re-exports from notificationActions.ts) |
| `lib/notifications/notificationPreferencesService.ts` | shouldSendErrorNotification (1 export) |
| `lib/notifications/notificationTriggersServer.ts` | triggerNetatmoAlertServer (1 export) |
| `lib/schemas/notificationPreferences.ts` | dndWindowSchema, rateLimitSchema (2 exports) |
| `lib/scheduler/schedulesApiClient.ts` | getScheduleById, getActiveScheduleId (2 exports) |
| `lib/pwa/installPromptService.ts` | canUseLocalStorage, getVisitCount (2 exports) |
| `lib/services/unifiedDeviceConfigService.ts` | isDisplayOnly, hasHomepageCard, getDefaultDeviceConfig, getUnifiedDeviceConfig (4 exports) |
| `lib/services/locationService.ts` | getLocation, setLocation (2 exports) |
| `lib/services/pidAutomationService.ts` | DEFAULT_PID_CONFIG (1 export) |
| `lib/rateLimiter.ts` | clearRateLimitForUser, getRateLimitStatus, _internals (3 exports) |
| `lib/devices/deviceRegistry.ts` | DEVICE_CONFIG, GLOBAL_SECTIONS (2 exports — re-exported from deviceTypes.ts) |

**app/ components and hooks:**
| File | Exports to Remove |
|------|-------------------|
| `app/components/ui/` (individual files) | Accordion, Badge, Banner+bannerVariants, Card, CardAccentCorner, ConnectionStatus+variants, Container (default), ControlButton, DashboardLayout (default+variants), DataTable, DataTableRow, DataTableToolbar, Divider+dividerVariants, EmptyState+variants, ErrorBadge, FormModal+ErrorSummary+SuccessOverlay, Grid, Heading, HealthIndicator+variant, Icon (default), Label+variant, Modal, PageLayout+variant, Progress+variant, Section, SelectGroup/Label/Separator, Sheet, SmartHomeCard, Spinner+variant, StatusCard, Text, Toast, Tooltip (many — see note below) |
| `app/components/ErrorBoundary/index.ts` | ErrorFallback (1 export) |
| `app/components/weather/*.tsx` | default exports from WeatherCard, CurrentConditions, ForecastRow, ForecastDaySheet, ForecastDayCard, HourlyForecast (6 exports) |
| `app/hooks/useDebounce.ts` | default (1 export) |
| `app/hooks/useHaptic.ts` | default (1 export) |
| `app/network/components/DeviceListTable.tsx` | DeviceListTable (1 export) |
| `app/network/components/DeviceCategoryBadge.tsx` | DeviceCategoryBadge (1 export) |
| `app/network/components/DeviceStatusBadge.tsx` | DeviceStatusBadge (1 export) |
| `app/thermostat/components/ThermostatTabs.tsx` | ThermostatTabs (1 export) |
| `app/debug/design-system/data/component-docs.ts` | getComponentsByCategory, getCategories, getComponentDoc, default (4 exports) |
| `tests/helpers/test-context.ts` | AUTH_FILE, BASE_URL (2 exports) |

**Note on individual `app/components/ui/*.tsx` files:** These are the component source files themselves (not the barrel). knip flags them because nothing imports directly from e.g. `app/components/ui/Badge.tsx` — all consumers go through the barrel `app/components/ui/index.ts`. Since D-04 only exempts the barrel index, the individual files' exports are technically flagged. However, removing `export` from the individual source files would break the barrel re-exports. **These individual component file exports should NOT be removed** — they are the source of the barrel's intentional public API. The planner should add them to the knip ignore list or simply skip them.

### Definitive Scope for CLEAN-01

Remove exports from these files only:
1. `lib/` files — all flagged exports (check each: remove `export` keyword if used internally, delete entirely if unused anywhere)
2. `app/hooks/useDebounce.ts` — default export
3. `app/hooks/useHaptic.ts` — default export
4. `app/network/components/DeviceListTable.tsx` — DeviceListTable
5. `app/network/components/DeviceCategoryBadge.tsx` — DeviceCategoryBadge
6. `app/network/components/DeviceStatusBadge.tsx` — DeviceStatusBadge
7. `app/thermostat/components/ThermostatTabs.tsx` — ThermostatTabs
8. `app/components/weather/*.tsx` — default exports (if components are rendered via barrel or imported elsewhere)
9. `app/debug/design-system/data/component-docs.ts` — all 4 exports
10. `app/components/ErrorBoundary/index.ts` — ErrorFallback
11. `tests/helpers/test-context.ts` — AUTH_FILE, BASE_URL
12. **SKIP:** All `app/components/ui/*.tsx` individual files (they feed the barrel)

## Common Pitfalls

### Pitfall 1: Individual UI component exports vs the barrel
**What goes wrong:** Removing `export` from `app/components/ui/Badge.tsx` breaks `app/components/ui/index.ts` which re-exports it.
**Why it happens:** knip flags them because there's no direct import of the individual file — all imports use the barrel.
**How to avoid:** Only touch `lib/` files and non-design-system app files. Skip all `app/components/ui/*.tsx` individual files even though knip flags them.
**Warning signs:** If you see the export is re-exported in `app/components/ui/index.ts` → do not remove it.

### Pitfall 2: detectStateMismatch is called with 3 args, needs 4
**What goes wrong:** Adding `userId` as a 4th parameter to `detectStateMismatch` breaks the existing call in `checkUserStoveHealth` until updated.
**Why it happens:** `userId` is not currently threaded into detectStateMismatch.
**How to avoid:** Update the function signature AND the call site in `checkUserStoveHealth` in the same edit.
**Warning signs:** TypeScript error "Expected 3 arguments, but got 4" or missing `userId` in the Firebase path.

### Pitfall 3: detectStateMismatch sync → async transition
**What goes wrong:** The existing test at line 121 of `healthMonitoring.test.ts` calls `detectStateMismatch()` synchronously — it will break when the function becomes async.
**Why it happens:** Tests don't `await` a sync function.
**How to avoid:** Update all test calls to `await detectStateMismatch(...)`. Also update mock setup — the function now calls `adminDbGet`/`adminDbSet` which must be mocked.
**Warning signs:** Test failures saying "received a Promise, expected null".

### Pitfall 4: lib/core/index.ts and lib/core/apiResponse.ts duplication
**What goes wrong:** Both `lib/core/index.ts` and `lib/core/apiResponse.ts` export `serverError` and `redirect` — knip flags both. Removing from apiResponse.ts would break the index.ts re-export.
**Why it happens:** lib/core/index.ts re-exports from apiResponse.ts; knip sees both as unused.
**How to avoid:** Remove from `lib/core/index.ts` (the barrel) only. If nothing imports `serverError` at all, then remove from apiResponse.ts too. Check usages first.

### Pitfall 5: Grace period key not cleaned up on transition
**What goes wrong:** Stove goes STARTING → ON → next check cycle doesn't clean up `health/stoveStarting/{userId}` → stale key persists for next STARTING event.
**Why it happens:** D-10 requires cleanup when leaving STARTING, but it's easy to only handle the STARTING branch.
**How to avoid:** Add a `adminDbRemove` call in the non-STARTING path (i.e., when `actualCategory !== 'STARTING'` and a timestamp exists in Firebase).

## Code Examples

### CLEAN-02: Delete disabled block in notificationService.ts
Lines 481-513 to delete (the entire disabled block including JSDoc):
```typescript
// DELETE lines 481-513:
/**
 * Cleanup: rimuove token obsoleti (più vecchi di 90 giorni)
 *
 * TODO: Migrare a API route /api/notifications/cleanup
 * Questa funzione richiede write access che deve passare tramite Admin SDK
 */
/* DISABLED - Requires Admin SDK migration
export async function cleanupOldTokens(userId) {
  ...
}
*/
```

JSDoc to add at top of file (after existing file-level JSDoc, before imports):
```typescript
/**
 * Token lifecycle management is handled server-side via Admin SDK.
 * See /api/notifications/cleanup + lib/services/tokenCleanupService.ts
 */
```

### CLEAN-03: Updated detectStateMismatch signature
```typescript
// Source: lib/health/healthMonitoring.ts

export async function detectStateMismatch(
  stoveResult: any,
  scheduleResult: any,
  netatmoResult: any,
  userId: string
): Promise<{ detected: boolean; expected: string; actual: string; reason: string; [key: string]: unknown } | null> {
  // ... existing null-guards ...

  // Handle STARTING states
  if (actualCategory === 'STARTING') {
    try {
      const entryTimestamp = await adminDbGet<number>(`health/stoveStarting/${userId}`);
      if (!entryTimestamp) {
        // First observation: start grace period
        await adminDbSet(`health/stoveStarting/${userId}`, Date.now());
        return null;
      }
      if (Date.now() - entryTimestamp < GRACE_PERIOD_MS) {
        return null; // Within grace period
      }
      // Grace period expired
      return {
        detected: true,
        expected: expectedState,
        actual: statusDescription,
        reason: 'starting_timeout',
      };
    } catch (err) {
      console.error('[detectStateMismatch] Grace period Firebase error:', err);
      return null; // Fail-safe: don't alert on Firebase errors
    }
  }

  // Leaving STARTING state — clean up grace period key (fire-and-forget)
  adminDbRemove(`health/stoveStarting/${userId}`).catch(() => {});

  // ... existing ON/OFF comparison logic ...
}
```

### adminDbRemove import
`adminDbRemove` is already exported from `lib/firebaseAdmin.ts` (line 137). Add to the existing import at the top of healthMonitoring.ts:
```typescript
import { getStatus } from '@/lib/stove/thermorossiProxy';
import { getProxyHomestatus } from '@/lib/netatmo/netatmoProxy';
import { adminDbGet, adminDbSet, adminDbRemove } from '@/lib/firebaseAdmin';
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (existing) |
| Config file | jest.config.ts |
| Quick run command | `npx jest __tests__/lib/healthMonitoring.test.ts --no-coverage` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CLEAN-01 | Knip reports zero unused exports in util files | smoke | `npx knip 2>&1 \| grep -v "app/components/ui/index.ts"` | ✅ (knip in devDeps) |
| CLEAN-02 | Disabled block deleted; JSDoc reference present | unit (grep) | `grep -c "DISABLED" lib/notifications/notificationService.ts` should return 0 | ✅ |
| CLEAN-03 grace period writes | First STARTING observation writes timestamp to Firebase | unit | `npx jest __tests__/lib/healthMonitoring.test.ts -t "STARTING" --no-coverage` | ✅ (needs new test cases) |
| CLEAN-03 grace period holds | Within 15 min, no mismatch flagged | unit | same | ✅ (needs update) |
| CLEAN-03 grace period expires | After 15 min, flags starting_timeout | unit | same | ✅ Wave 0 gap |
| CLEAN-03 cleanup | Key removed when stove leaves STARTING | unit | same | ✅ Wave 0 gap |

### Sampling Rate
- **Per task commit:** `npx jest __tests__/lib/healthMonitoring.test.ts --no-coverage`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `__tests__/lib/healthMonitoring.test.ts` — needs 3 new test cases: grace period within window, grace period expired (starting_timeout), cleanup on exit from STARTING. Also needs mock update: `adminDbGet`/`adminDbSet`/`adminDbRemove` must be mocked for STARTING branch.
- [ ] No new files needed for CLEAN-01/CLEAN-02

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 48 unused exports (CONTEXT.md baseline) | 121 in-scope unused exports (live run 2026-03-22) | Phases 113-116 added/changed exports | More work than estimated; planner must use live count |
| STARTING grace period: always return null | STARTING grace period: Firebase timestamp tracking | Phase 117 (this phase) | Enables real grace period enforcement |

## Open Questions

1. **Individual ui/*.tsx files in knip output**
   - What we know: knip flags 50 individual component files (Card.tsx, Badge.tsx, etc.) because nothing imports from them directly — all imports go through the barrel.
   - What's unclear: whether to suppress these in knip config or simply document as intentional.
   - Recommendation: Add a `knip.config.ts` ignore entry for `app/components/ui/*.tsx` individual files, or accept them as a known knip limitation for barrel-based design systems.

2. **detectStateMismatch in tests imports as exported function**
   - What we know: `healthMonitoring.test.ts` imports `detectStateMismatch` and calls it directly (it's currently exported).
   - What's unclear: After CLEAN-03, should `detectStateMismatch` remain exported (for testability) or become private?
   - Recommendation: Keep it exported — testability is valuable and the export is used in tests. Don't remove the export even though knip flags it.

## Sources

### Primary (HIGH confidence)
- Live knip run against current codebase (2026-03-22) — 192 total unused exports
- Direct file reads: `lib/health/healthMonitoring.ts`, `lib/notifications/notificationService.ts`, `lib/firebaseAdmin.ts`, `lib/services/tokenCleanupService.ts`, `app/api/notifications/cleanup/route.ts`
- `__tests__/lib/healthMonitoring.test.ts` — existing test coverage for detectStateMismatch

### Secondary (MEDIUM confidence)
- CONTEXT.md decisions D-01 through D-12 — decisions are locked
- Phase 48 prior art (MEMORY.md) — 203 exports removed with same knip approach

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all tooling present, no new dependencies
- Architecture: HIGH — CLEAN-02 is trivial deletion; CLEAN-03 pattern matches existing adminDbGet/adminDbSet usage
- Pitfalls: HIGH — verified by reading actual test file and source files directly
- Knip export count: HIGH — from live run, not training data

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable codebase)
