---
phase: 156
phase_name: path-migration-common-endpoints
status: issues_found
depth: standard
files_reviewed: 23
findings:
  critical: 2
  warning: 5
  info: 4
  total: 11
---

# Code Review: Phase 156

## Summary

The reviewed files cover thermorossi API routes, stove hooks, service worker logic, and shared infrastructure. Two critical issues were found: duplicate `message` event listeners in the service worker (causing handler conflicts), and an unauthenticated `/health` endpoint that leaks internal provider topology. Five warnings cover missing input validation, stale type definitions, and unsafe patterns.

## Findings

### CR-001: Duplicate `message` event listeners in service worker (critical)
**File:** `app/sw.ts:656` and `app/sw.ts:771`
**Issue:** Two separate `self.addEventListener('message', ...)` blocks are registered. Both handle `switch(type)` cases. The first handles `CLEAR_BADGE`, `GET_CACHED_STATE`, and `PROCESS_QUEUE`. The second handles `REGISTER_PERIODIC_SYNC`, `UNREGISTER_PERIODIC_SYNC`, and `GET_PERIODIC_SYNC_STATUS`. All six message types will have both handlers invoked for every message — the first handler silently falls through on unknown types, but this is fragile and bug-prone. More critically, if any case is ever duplicated between them, the second listener will execute stale or conflicting state. The comment on line 833 (`// Keep other cases handled by the original handler`) indicates awareness but no actual fix.
**Fix:** Merge both `message` handler blocks into a single `addEventListener('message', ...)` with all cases under one `switch` statement.

---

### CR-002: Duplicate `push` event listener shadows the first (critical)
**File:** `app/sw.ts:646-650`
**Issue:** A second `self.addEventListener('push', ...)` is registered at line 647, after the primary push handler at line 110. The comment on line 646 (`// Update push handler to also increment badge`) stores a reference to `self.addEventListener` as `originalPushHandler` (line 646) but never calls it — this variable is dead code. Both push listeners will fire independently: the first shows the notification (line 142-144), the second calls `incrementBadge()` (line 649). While the dual registration works incidentally because both run, any future modification to the second handler that expects to replace the first will fail silently. Additionally, the `originalPushHandler` assignment is misleading dead code.
**Fix:** Remove `originalPushHandler` (dead code). Merge badge increment (`incrementBadge()`) into the original push handler at line 142, inside the `event.waitUntil(Promise.all([...]))` call.

---

### CR-003: `/health` endpoint leaks internal provider topology unauthenticated (warning)
**File:** `app/health/route.ts:41`
**Issue:** `GET /health` uses `withErrorHandler` (not `withAuthAndErrorHandler`) — the route is explicitly unauthenticated per the doc comment. However it exposes the full named list of 8 internal providers (`thermorossi`, `netatmo`, `hue`, `sonos`, `dirigera`, `tuya`, `raspi`, `fritzbox`) and their up/down status. An attacker can use this to identify which services are active, time outages, or enumerate providers. For a home automation panel this is lower risk but is still an unnecessary information disclosure.
**Fix:** Consider either (a) requiring authentication, (b) returning only `{ status: 'ok' | 'degraded' }` without provider details for unauthenticated callers, or (c) accepting the risk as a documented decision.

---

### CR-004: No input validation on numeric `value` in settings routes (warning)
**Files:** `app/api/v1/thermorossi/settings/fan-level/route.ts:16`, `app/api/v1/thermorossi/settings/power/route.ts:16`, `app/api/v1/thermorossi/settings/temperature/water/route.ts:16`
**Issue:** All three routes do `const value = body['value'] as number` — a type assertion only, not runtime validation. If the client sends `{ value: "3" }` (string) or `{ value: 999 }` (out of range) or `{ value: null }`, the route passes the raw value to the proxy function without any guard. The doc comment for `/temperature/water` says "range 40-80 validated by proxy (422 on out-of-range)" but this relies entirely on the downstream HA proxy for all three routes.
**Fix:** Add `if (typeof value !== 'number' || !Number.isFinite(value))` guard before calling the proxy, returning a 400 with a clear error message. Optionally add range checks matching the UI constraints (fan 1-6, power 1-5, temp 40-80).

---

### CR-005: `StoveStatusResponse` type is stale — does not match proxy response shape (warning)
**File:** `types/api/responses.ts:36-44`
**Issue:** `StoveStatusResponse` defines `status`, `power`, `temperature`, `maintenance` fields. The actual proxy response shape (seen in all test fixtures throughout the reviewed test files) is `stove_state`, `power_level`, `fan_level`, `data_freshness`, `last_poll_at`, `error_code`, `error_description`. The type definition is a legacy artefact that no longer matches what `/api/v1/thermorossi/status` returns, creating a misleading contract.
**Fix:** Update `StoveStatusResponse` to match the thermorossiProxy response shape, or delete it if it is unused (verify with grep).

---

### CR-006: `getActionSuccessMessage` in service worker uses stale endpoint path (warning)
**File:** `app/sw.ts:243-249`
**Issue:** `getActionSuccessMessage` switches on `'stove/shutdown'` (legacy WiNet path). The current shutdown route is `/api/v1/thermorossi/commands/shutdown`. The function is called with `endpoint` from `executeNotificationAction` which is also called with `'stove/shutdown'` (line 293). Both the notification click handler and success message function reference the old endpoint pattern — commands queued from notifications will `fetch('/api/stove/shutdown')` which no longer exists, silently failing with a 404.
**Fix:** Update the notification action handler (line 293) to use `'v1/thermorossi/commands/shutdown'` (which becomes `/api/v1/thermorossi/commands/shutdown` via the `fetch(\`/api/${endpoint}\`)` template) and update `getActionSuccessMessage` to match.

---

### CR-007: `checkStoveStatusBackground` checks wrong field names from proxy response (warning)
**File:** `app/sw.ts:729-730`
**Issue:** The background sync handler checks `data.error || data.errorCode` and `data.maintenance?.needsCleaning`. The proxy response shape uses `error_code` and `error_description` (snake_case, confirmed by all test fixtures). `data.error` and `data.errorCode` will always be `undefined`, so the stove error notification will never fire from periodic sync, even during genuine alarm states.
**Fix:** Change to `data.error_code` (non-zero check) and `data.stove_state === 'alarm'` for error detection. Maintenance needs a separate API call; the status endpoint does not include maintenance data.

---

### CR-008: `deviceCommands.tsx` reads `statusData?.Result` from power/fan endpoints (info)
**File:** `lib/commands/deviceCommands.tsx:129,143,155,169`
**Issue:** The command palette reads `statusData?.Result` to get current power/fan values before incrementing/decrementing. The proxy response for `/api/v1/thermorossi/power` and `/api/v1/thermorossi/fan-level` uses snake_case fields (consistent with the proxy). If `Result` is not the actual field name, the fallback `?? 3` will always be used, causing incorrect level adjustments.
**Fix:** Verify the actual response field names returned by `getPower()` and `getFan()` in `thermorossiProxy.ts` and update the property access accordingly.

---

### CR-009: `useEffect` dependency arrays in both StoveTab components will cause infinite re-render loops (info)
**Files:** `app/debug/api/components/tabs/StoveTab.tsx:88-89`, `app/debug/components/tabs/StoveTab.tsx:88-89`
**Issue:** Both StoveTab components declare `useEffect(() => { fetchAllGetEndpoints(); }, [fetchAllGetEndpoints])`. `fetchAllGetEndpoints` is defined as an inline function in the component body without `useCallback`, so it is a new reference on every render. This creates an infinite loop: render → effect runs → state update → re-render → new function reference → effect runs again. The ESLint exhaustive-deps rule would catch this.
**Fix:** Wrap `fetchAllGetEndpoints` and `fetchGetEndpoint` with `useCallback` (with appropriate stable deps), or remove `fetchAllGetEndpoints` from the dependency array and add an ESLint disable comment if intentional.

---

### CR-010: `SCHEDULER_ROUTES.check` embeds a secret in a query parameter (info)
**File:** `lib/routes.ts:58`
**Issue:** `SCHEDULER_ROUTES.check` is a function `(secret: string) => \`${API_BASE}/scheduler/check?secret=${secret}\``. Embedding secrets in URL query parameters causes them to appear in server access logs, browser history, and Referer headers. This is a known bad practice (OWASP A02).
**Fix:** Pass the secret as an `Authorization` header or in the POST body instead of a query parameter. Since this route already exists and may be called from cron jobs, evaluate whether migration is practical.

---

### CR-011: `ApiSuccessResponse<T>` generic parameter `T` is unused (info)
**File:** `types/api/responses.ts:8-13`
**Issue:** `ApiSuccessResponse<T>` declares a generic `T` parameter but uses `[key: string]: unknown` as the index signature instead of incorporating `T`. The generic is never applied, making it meaningless. Any consumer that writes `ApiSuccessResponse<MyType>` gets no type safety benefit.
**Fix:** Either remove the generic parameter (use `[key: string]: unknown` as is), or restructure to `{ success: true; data: T; message?: string }` to make `T` meaningful. The latter requires updating all callers.

---

*Reviewed: 2026-04-07 at standard depth*
