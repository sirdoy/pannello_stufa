---
phase: 160-sonos-gap-closure
reviewed: 2026-04-09T00:00:00Z
depth: standard
files_reviewed: 22
files_reviewed_list:
  - app/api/v1/sonos/zones/[groupId]/playback/route.ts
  - app/api/v1/sonos/zones/[groupId]/playback/__tests__/route.test.ts
  - app/api/v1/sonos/zones/[groupId]/play/route.ts
  - app/api/v1/sonos/zones/[groupId]/play/__tests__/route.test.ts
  - app/api/v1/sonos/zones/[groupId]/pause/route.ts
  - app/api/v1/sonos/zones/[groupId]/pause/__tests__/route.test.ts
  - app/api/v1/sonos/zones/[groupId]/stop/route.ts
  - app/api/v1/sonos/zones/[groupId]/stop/__tests__/route.test.ts
  - app/api/v1/sonos/zones/[groupId]/next/route.ts
  - app/api/v1/sonos/zones/[groupId]/next/__tests__/route.test.ts
  - app/api/v1/sonos/zones/[groupId]/previous/route.ts
  - app/api/v1/sonos/zones/[groupId]/previous/__tests__/route.test.ts
  - app/api/v1/sonos/zones/[groupId]/volume/route.ts
  - app/api/v1/sonos/zones/[groupId]/volume/__tests__/route.test.ts
  - app/api/v1/sonos/zones/[groupId]/seek/route.ts
  - app/api/v1/sonos/zones/[groupId]/seek/__tests__/route.test.ts
  - app/api/v1/sonos/zones/[groupId]/queue/route.ts
  - app/api/v1/sonos/zones/[groupId]/queue/__tests__/route.test.ts
  - app/api/v1/sonos/zones/[groupId]/play-mode/route.ts
  - app/api/v1/sonos/zones/[groupId]/play-mode/__tests__/route.test.ts
  - app/api/v1/sonos/zones/[groupId]/sleep-timer/route.ts
  - app/api/v1/sonos/zones/[groupId]/sleep-timer/__tests__/route.test.ts
findings:
  critical: 0
  warning: 3
  info: 2
  total: 5
status: issues_found
---

# Phase 160: Code Review Report

**Reviewed:** 2026-04-09T00:00:00Z
**Depth:** standard
**Files Reviewed:** 22
**Status:** issues_found

## Summary

Reviewed 11 Sonos zone API routes (playback, play, pause, stop, next, previous, volume, seek, queue, play-mode, sleep-timer) together with their accompanying test files. The routes follow the established project pattern cleanly: `withAuthAndErrorHandler`, `getPathParam`, `success()`, and 202 Accepted for commands. Authentication tests are present in every suite.

Three warnings were found: the volume route performs no bounds validation before forwarding `body.volume` to the proxy (allowing values outside 0–100), the seek route performs no format validation before forwarding `body.position` (allowing malformed strings that could cause downstream errors), and the sleep-timer route performs no range validation before forwarding `body.duration` (allowing negative values or values beyond 86399). None of these are security vulnerabilities because the HA proxy is behind server-side auth, but they can produce confusing proxy errors and poor API ergonomics.

Two info items were found: the volume route is missing a JSDoc block comment (unlike every other route in the set), and no test case covers the proxy-error path (e.g., what is returned when the sonosProxy function rejects) for any route in the suite.

---

## Warnings

### WR-01: Volume route forwards unvalidated `body.volume` to proxy

**File:** `app/api/v1/sonos/zones/[groupId]/volume/route.ts:17`
**Issue:** `body.volume` is read directly from the parsed JSON body and passed to `setZoneVolume` without checking that it is a number in the range 0–100. A caller sending `{ "volume": -50 }` or `{ "volume": 200 }` would forward the invalid value to the HA proxy, whose error response would surface as a generic 500 instead of a descriptive 400.
**Fix:**
```typescript
export const PUT = withAuthAndErrorHandler(async (request, context) => {
  const groupId = await getPathParam(context, 'groupId');
  const body = await parseJson(request) as SetVolumeRequest;
  if (typeof body.volume !== 'number' || body.volume < 0 || body.volume > 100) {
    throw new ValidationError('volume must be a number between 0 and 100');
  }
  const data = await setZoneVolume(groupId, body.volume);
  return success(
    { ...data, suggested_poll_delay_s: 1 } as unknown as Record<string, unknown>,
    null,
    HTTP_STATUS.ACCEPTED
  );
}, 'Sonos/Zones/SetVolume');
```

### WR-02: Seek route forwards unvalidated `body.position` to proxy

**File:** `app/api/v1/sonos/zones/[groupId]/seek/route.ts:17`
**Issue:** `body.position` is passed directly to `seek` without checking that it is a non-empty string in `HH:MM:SS` format. A missing or malformed position value (e.g., `{}` body or `{ "position": "invalid" }`) would cause an unpredictable proxy error rather than a clear 400.
**Fix:**
```typescript
const HH_MM_SS = /^\d+:\d{2}:\d{2}$/;

export const PUT = withAuthAndErrorHandler(async (request, context) => {
  const groupId = await getPathParam(context, 'groupId');
  const body = await parseJson(request) as SetSeekRequest;
  if (typeof body.position !== 'string' || !HH_MM_SS.test(body.position)) {
    throw new ValidationError('position must be a string in HH:MM:SS format');
  }
  const data = await seek(groupId, body.position);
  return success(
    { ...data, suggested_poll_delay_s: 1 } as unknown as Record<string, unknown>,
    null,
    HTTP_STATUS.ACCEPTED
  );
}, 'Sonos/Zones/Seek');
```

### WR-03: Sleep-timer route forwards unvalidated `body.duration` to proxy

**File:** `app/api/v1/sonos/zones/[groupId]/sleep-timer/route.ts:26`
**Issue:** `body.duration` is passed to `setSleepTimer` without checking it is a non-negative integer within the documented 0–86399 range. A negative value or non-integer would be forwarded to the proxy without a meaningful API error.
**Fix:**
```typescript
export const PUT = withAuthAndErrorHandler(async (request, context) => {
  const groupId = await getPathParam(context, 'groupId');
  const body = await parseJson(request) as SetSleepTimerRequest;
  if (
    typeof body.duration !== 'number' ||
    !Number.isInteger(body.duration) ||
    body.duration < 0 ||
    body.duration > 86399
  ) {
    throw new ValidationError('duration must be an integer between 0 and 86399');
  }
  const data = await setSleepTimer(groupId, body);
  return success(
    { ...data, suggested_poll_delay_s: 1 } as unknown as Record<string, unknown>,
    null,
    HTTP_STATUS.ACCEPTED
  );
}, 'Sonos/Zones/SleepTimer/Set');
```

---

## Info

### IN-01: Volume route is missing its JSDoc block comment

**File:** `app/api/v1/sonos/zones/[groupId]/volume/route.ts:1`
**Issue:** Every other route file in this set opens with a JSDoc block comment describing the HTTP method, path, purpose, authentication requirement, and return shape. The volume route omits this header and starts directly with imports.
**Fix:** Add a JSDoc block consistent with the other routes:
```typescript
/**
 * API Route: Sonos Zone Volume
 *
 * PUT /api/v1/sonos/zones/{groupId}/volume
 *
 * Sets the volume (0-100) for all speakers in a zone.
 *
 * Protected: Requires Auth0 authentication
 * Returns: 202 Accepted with suggested_poll_delay_s
 */
```

### IN-02: No tests cover the proxy error path for any route

**File:** All `__tests__/route.test.ts` files
**Issue:** Each test file covers the 401 unauthenticated case and the happy-path 200/202 case, but none covers what happens when the sonosProxy function rejects (i.e., the proxy returns an error or throws). The `withAuthAndErrorHandler` wrapper is expected to handle these and return a structured error response; a test verifying that behavior would protect against regressions in the error handler contract.
**Fix:** Add a test case to at least one representative suite (e.g., playback) and replicate the pattern across the others:
```typescript
it('should return 500 when proxy throws', async () => {
  mockGetPlayback.mockRejectedValue(new Error('HA proxy unavailable'));

  const response = await GET(mockRequest as any, mockContext as any);

  expect(response.status).toBe(500);
});
```

---

_Reviewed: 2026-04-09T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
