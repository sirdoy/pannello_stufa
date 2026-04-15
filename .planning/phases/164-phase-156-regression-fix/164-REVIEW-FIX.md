---
phase: 164-phase-156-regression-fix
fixed_at: 2026-04-15T00:00:00Z
review_path: .planning/phases/164-phase-156-regression-fix/164-REVIEW.md
iteration: 1
findings_in_scope: 9
fixed: 9
skipped: 0
status: all_fixed
---

# Phase 164: Code Review Fix Report

**Fixed at:** 2026-04-15T00:00:00Z
**Source review:** .planning/phases/164-phase-156-regression-fix/164-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 9 (1 Critical + 8 Warning; Info skipped per scope rules)
- Fixed: 9
- Skipped: 0

## Fixed Issues

### CR-01: Second `push` listener silently disables notification rendering

**Files modified:** `app/sw.ts`
**Commit:** 75a624d7
**Applied fix:** Merged `incrementBadge()` into the primary `push` handler via `event.waitUntil(Promise.all([showNotification, incrementBadge]))`. Deleted the duplicate `push` listener at former lines 641-650 along with the misleading `originalPushHandler` dead assignment.

### WR-01: `useEffect` dependencies include non-memoised inline functions — infinite re-render risk

**Files modified:** `app/debug/components/tabs/StoveTab.tsx`, `app/debug/api/components/tabs/StoveTab.tsx`
**Commit:** 70de9eb7 (combined with WR-06)
**Applied fix:** Wrapped `fetchGetEndpoint` and `fetchAllGetEndpoints` in `useCallback` with empty / `[fetchGetEndpoint]` dep arrays respectively. Both debug StoveTab components updated identically. `useEffect` dependencies now reference stable identities, eliminating the infinite-render / auto-refresh-interval churn.

### WR-02: Duplicate `message` listener silently drops unhandled cases

**Files modified:** `app/sw.ts`
**Commit:** 24d2f48e
**Applied fix:** Merged both `message` listeners into a single handler. Wrapped the whole switch body in `event.waitUntil((async () => { ... })())` so the SW stays alive until every branch (including IndexedDB `GET_CACHED_STATE`) has posted its reply. Added explicit `onerror`/`onsuccess` wiring around `store.get(...)` and a resolved `Promise<void>`. Consolidated all six message types (`CLEAR_BADGE`, `GET_CACHED_STATE`, `PROCESS_QUEUE`, `REGISTER_PERIODIC_SYNC`, `UNREGISTER_PERIODIC_SYNC`, `GET_PERIODIC_SYNC_STATUS`) under one switch with an explicit default no-op comment. Removed the second listener block entirely.

### WR-03: `executeStoveAction` can return undefined on network error, breaking direct-fetch callers

**Files modified:** `lib/commands/deviceCommands.tsx`
**Commit:** 07bb3878
**Applied fix:** Wrapped all direct `fetch('/api/v1/thermorossi/power')`, `fetch('/api/v1/thermorossi/fan-level')`, and `fetch('/api/hue/rooms')` calls inside `onSelect` handlers (stove-power-up, stove-power-down, stove-fan-up, stove-fan-down, lights-all-on, lights-all-off) with `try/catch` and early-return on `!res.ok`. Also narrowed the previously-`any` Hue room-service filter to `{ rtype?: string; rid?: string }`. Network failures now log and return gracefully instead of crashing the command palette.

### WR-04: `executeNotificationAction` offline branch doesn't wire `store.add.onerror`

**Files modified:** `app/sw.ts`
**Commit:** aff71d03 (combined with WR-05)
**Applied fix:** Moved `store.add(command)` inside the promise executor so its `IDBRequest` can be captured. Wired `addReq.onerror = () => reject(addReq.error)` alongside the existing transaction handlers. An add-level quota failure now rejects the promise cleanly instead of silently showing a "queued" notification with no stored command.

### WR-05: `openAppUrl` iterates clients but returns on first origin match

**Files modified:** `app/sw.ts`
**Commit:** aff71d03 (combined with WR-04)
**Applied fix:** Replaced the for-loop first-match with a `visible = clientList.find(c => same-origin && visibilityState === 'visible')` lookup, falling back to the first same-origin client. The user's currently-visible tab is now preferred over an arbitrary background tab when opening an app URL from a notification.

### WR-06: `connectionStatus` typed as `any`

**Files modified:** `app/debug/components/tabs/StoveTab.tsx`, `app/debug/api/components/tabs/StoveTab.tsx`
**Commit:** 70de9eb7 (combined with WR-01)
**Applied fix:** Introduced `type ConnectionStatus = 'connected' | 'disconnected' | null` and replaced `useState<any>(null)` with `useState<ConnectionStatus>(null)`. Also widened `getResponses`/`postResponses` from `Record<string, any>` to `Record<string, unknown>` and the `callPostEndpoint` body parameter from `any` to `Record<string, unknown>` in both files.

### WR-07: `ApiSuccessResponse<T>` generic parameter was unused

**Files modified:** `types/api/responses.ts`
**Commit:** e7645bd7
**Applied fix:** Converted `ApiSuccessResponse<T>` from an interface with a `[key: string]: unknown` index signature to a type alias intersecting `{ success: true; message?: string }` with `T`. `T` is now constrained to `Record<string, unknown>` and genuinely contributes shape. Updated the two local consumers (`StoveStatusResponse`, `PaginatedResponse<T>`) from `interface … extends ApiSuccessResponse` to type aliases using `ApiSuccessResponse<{ ... }>`. No external callers broke (checked via `grep ApiSuccessResponse`).

### WR-08: Retry hook closes over stale `retry` in toast `onClick`

**Files modified:** `lib/hooks/useRetryableCommand.ts`
**Commit:** cf3a08bb
**Applied fix:** Imported `useCallback`. Wrapped `execute`, `retry`, and `clearError` in `useCallback` with appropriate dependency arrays (`[device, action, showSuccessOnRecovery, success, showError]` for execute; `[execute]` for retry). Introduced a `retryRef` and assign `retryRef.current = retry` after each render so the toast action's `onClick` always calls the latest `retry` instance, eliminating any stale-closure hazard between execute/retry across renders. This also breaks the execute↔retry reference cycle that would otherwise defeat memoisation.

---

_Fixed: 2026-04-15T00:00:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
