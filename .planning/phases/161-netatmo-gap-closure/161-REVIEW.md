---
phase: 161-netatmo-gap-closure
reviewed: 2026-04-09T00:00:00Z
depth: standard
files_reviewed: 23
files_reviewed_list:
  - lib/netatmo/netatmoProxy.ts
  - types/netatmoProxy.ts
  - app/api/v1/netatmo/health/route.ts
  - app/api/v1/netatmo/homesdata/route.ts
  - app/api/v1/netatmo/homestatus/route.ts
  - app/api/v1/netatmo/getthermstate/route.ts
  - app/api/v1/netatmo/getroommeasure/route.ts
  - app/api/v1/netatmo/gethomedata/route.ts
  - app/api/v1/netatmo/setroomthermpoint/route.ts
  - app/api/v1/netatmo/setthermmode/route.ts
  - app/api/v1/netatmo/switchhomeschedule/route.ts
  - app/api/v1/netatmo/synchomeschedule/route.ts
  - app/api/v1/netatmo/createnewhomeschedule/route.ts
  - app/api/v1/netatmo/renamehome/route.ts
  - app/api/v1/netatmo/valves/route.ts
  - app/api/v1/netatmo/valves/calibrate/route.ts
  - app/api/v1/netatmo/valves/[moduleId]/calibrate/route.ts
  - app/api/v1/netatmo/camera/events/route.ts
  - app/api/v1/netatmo/camera/events/[eventId]/snapshot/route.ts
  - app/api/v1/netatmo/camera/status/route.ts
  - app/api/v1/netatmo/camera/[cameraId]/stream/route.ts
  - app/api/v1/netatmo/camera/[cameraId]/snapshot/route.ts
  - app/api/v1/netatmo/camera/[cameraId]/monitoring/route.ts
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: issues_found
---

# Phase 161: Code Review Report

**Reviewed:** 2026-04-09T00:00:00Z
**Depth:** standard
**Files Reviewed:** 23
**Status:** issues_found

## Summary

Reviewed the full Netatmo proxy client (`netatmoProxy.ts`), its type definitions, and all 21 API route handlers. The layer is architecturally clean: every route follows the `withAuthAndErrorHandler` + proxy wrapper pattern consistently, `export const dynamic = 'force-dynamic'` is present on all routes, and the binary snapshot endpoint is correctly isolated from `haGet` because it needs raw streaming.

Three warnings were found: one NaN value propagated silently to the upstream proxy, one case where the snapshot route ignores an upstream non-2xx status, and one type definition that is not exported but is referenced internally in a way that may cause confusion. Three informational items cover missing input validation, unused `as unknown as Record<string, unknown>` double-assertion patterns, and a minor doc/comment gap.

## Warnings

### WR-01: `hours` query param silently passes `NaN` to upstream proxy

**File:** `app/api/v1/netatmo/camera/events/route.ts:17`
**Issue:** `Number(hoursParam)` returns `NaN` when `hoursParam` is a non-numeric string (e.g. `?hours=abc`). The truthy check on line 16 only guards against `null`/empty-string, not against non-numeric strings. `NaN` is then passed to `getProxyCameraEvents`, which interpolates it into the query string as the literal string `"NaN"`, forwarding `?hours=NaN` to the HA proxy. The proxy will likely reject it or silently fall back, but the error will be opaque to the caller.

**Fix:**
```typescript
const hoursParam = searchParams.get('hours');
const hours = hoursParam !== null ? Number(hoursParam) : undefined;
if (hours !== undefined && (!Number.isFinite(hours) || hours < 1 || hours > 168)) {
  throw new ApiError(ERROR_CODES.VALIDATION_ERROR, 'hours must be an integer between 1 and 168', HTTP_STATUS.BAD_REQUEST);
}
```

---

### WR-02: Snapshot streaming ignores upstream HTTP error status

**File:** `app/api/v1/netatmo/camera/events/[eventId]/snapshot/route.ts:14-21`
**Issue:** `getProxyCameraEventSnapshot` returns the raw `Response` object without checking `response.ok`. If the HA proxy returns 404, 503, or any non-2xx status for the binary endpoint, the route handler unconditionally wraps it in a `new NextResponse(response.body, { status: 200, ... })`, responding to the client with a 200 carrying an error body as though it were a valid JPEG. This masks real failures and can cause client-side rendering errors.

**Fix:**
```typescript
const response = await getProxyCameraEventSnapshot(eventId);
if (!response.ok) {
  throw new ApiError(
    ERROR_CODES.EXTERNAL_API_ERROR,
    `Snapshot fetch failed: ${response.status}`,
    HTTP_STATUS.BAD_GATEWAY
  );
}
return new NextResponse(response.body, {
  status: 200,
  headers: {
    'Content-Type': 'image/jpeg',
    'Cache-Control': 'public, max-age=3600',
  },
});
```

Alternatively, `getProxyCameraEventSnapshot` itself could throw on non-ok, keeping callers simple.

---

### WR-03: `SetRoomThermpointRequest.temp` is required when `mode === 'manual'` but not enforced server-side

**File:** `app/api/v1/netatmo/setroomthermpoint/route.ts:19` / `types/netatmoProxy.ts:149`
**Issue:** The type comment says "Required when mode is 'manual'", but `temp` is typed as `temp?: number` (optional) with no runtime guard. If a client sends `{ home_id, room_id, mode: "manual" }` without `temp`, the proxy receives an invalid payload. The error will surface inside the HA proxy (as a 400 or 422), but the response reaching the client will be wrapped as a generic external API error rather than a clear 400 from this route.

**Fix:** Add a body validation guard before the proxy call:
```typescript
const body = await parseJson(request) as SetRoomThermpointRequest;
if (body.mode === 'manual' && body.temp === undefined) {
  throw new ApiError(ERROR_CODES.VALIDATION_ERROR, 'temp is required when mode is manual', HTTP_STATUS.BAD_REQUEST);
}
const data = await proxySetRoomThermpoint(body);
```

---

## Info

### IN-01: `NetatmoSetpoint` and `NetatmoThermProgram` are not exported

**File:** `types/netatmoProxy.ts:389-399`
**Issue:** `NetatmoSetpoint` and `NetatmoThermProgram` are declared as module-private interfaces (no `export` keyword) but are used inside the exported `NetatmoThermstateResponse`. This is technically valid TypeScript (the compiler inlines them at usage site), but callers who want to type-annotate setpoint or program variables locally cannot import these types. If any consumer code destructures `NetatmoThermstateResponse.body.setpoint`, they either duplicate the shape or use `typeof` inference.

**Fix:** Add `export` to both interfaces if they are or may be consumed independently:
```typescript
export interface NetatmoSetpoint { ... }
export interface NetatmoThermProgram { ... }
```

---

### IN-02: Pervasive `as unknown as Record<string, unknown>` double-assertion

**File:** Multiple route files (e.g. `health/route.ts:18`, `homesdata/route.ts:18`, `homestatus/route.ts:18`, and 15+ others)
**Issue:** Every route calls `success(data as unknown as Record<string, unknown>)`. This is a project-wide pattern driven by the `success()` signature requiring `Record<string, unknown>`. It is not wrong, but it bypasses type checking silently. If `success()` is updated to accept `unknown` or a generic `T`, all these casts can be removed, reducing noise and restoring type safety at the call site.

**Fix (non-urgent):** Consider widening the `success()` signature to accept `unknown` or `T extends object`:
```typescript
export function success<T>(data: T, ...): NextResponse { ... }
```
This is a `lib/core` change, not a Netatmo-specific one — flagged here as an informational pattern.

---

### IN-03: Camera events route missing file-level JSDoc comment

**File:** `app/api/v1/netatmo/camera/events/route.ts:1`
**Issue:** Unlike all other route files in this set, `camera/events/route.ts` has no leading JSDoc block describing the file purpose. The JSDoc appears inline above the handler instead. This is a minor consistency gap compared to the rest of the Netatmo route files.

**Fix:** Add a standard file-level comment block before the imports, consistent with adjacent routes:
```typescript
/**
 * API Route: Netatmo Camera Events
 *
 * GET /api/v1/netatmo/camera/events
 * ...
 */
```

---

_Reviewed: 2026-04-09T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
