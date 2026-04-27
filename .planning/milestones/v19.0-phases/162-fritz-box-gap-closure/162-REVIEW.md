---
phase: 162-fritz-box-gap-closure
reviewed: 2026-04-09T00:00:00Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - app/api/fritzbox/history/bandwidth/__tests__/route.test.ts
  - app/api/fritzbox/history/bandwidth/route.ts
  - app/api/fritzbox/history/device-events/__tests__/route.test.ts
  - app/api/fritzbox/history/device-events/route.ts
  - app/api/fritzbox/history/devices/__tests__/route.test.ts
  - app/api/fritzbox/history/devices/route.ts
  - app/api/fritzbox/service-discovery/__tests__/route.test.ts
  - app/api/fritzbox/service-discovery/route.ts
  - app/api/fritzbox/telephony/calls/__tests__/route.test.ts
  - app/api/fritzbox/telephony/calls/route.ts
  - app/api/fritzbox/telephony/dect/__tests__/route.test.ts
  - app/api/fritzbox/telephony/dect/route.ts
  - app/api/fritzbox/telephony/tam/__tests__/route.test.ts
  - app/api/fritzbox/telephony/tam/route.ts
  - lib/fritzbox/fritzboxClient.ts
findings:
  critical: 0
  warning: 4
  info: 2
  total: 6
status: issues_found
---

# Phase 162: Code Review Report

**Reviewed:** 2026-04-09T00:00:00Z
**Depth:** standard
**Files Reviewed:** 15
**Status:** issues_found

## Summary

Seven new API routes and corresponding client functions were added in this phase: three telephony endpoints (calls, DECT, TAM), three raw history pass-through endpoints (bandwidth, device-events, devices), and a TR-064 service discovery endpoint. The implementation follows the established project patterns correctly — `withAuthAndErrorHandler`, rate limiting via `checkRateLimitFritzBox`, `getCachedData`, and `export const dynamic = 'force-dynamic'`.

The primary concern is a repeated cache key design bug: four of the new routes pass dynamic query parameters to the HA proxy but use a static cache key in `getCachedData`. This means requests with different pagination or filter parameters collide in the cache, and callers receive stale data from the first requester's parameters. The other notable issue is in `getServiceDiscovery`, which reads raw environment variables directly instead of going through the shared `haGet` transport, bypassing any centralized error handling or timeout policy.

---

## Warnings

### WR-01: Static cache keys ignore query params — stale data for paginated/filtered requests

**Files:**
- `app/api/fritzbox/history/bandwidth/route.ts:43`
- `app/api/fritzbox/history/device-events/route.ts:45`
- `app/api/fritzbox/history/devices/route.ts:40`
- `app/api/fritzbox/telephony/calls/route.ts:40`

**Issue:** All four routes build a `URLSearchParams` object from the incoming request (e.g., `hours`, `limit`, `offset`, `mac`) and forward it to the HA proxy, but they pass a static string as the cache key to `getCachedData`. Two requests with different parameters (e.g., `?limit=10` vs `?limit=100`) map to the same cache entry. The second caller receives the first caller's result until the 60-second TTL expires.

For the raw bandwidth route this is particularly visible: a chart component requesting `?hours=1` and a table component requesting `?hours=24` both cache to `'history-bandwidth-raw'` and will interfere.

**Fix:** Include the serialised query string in the cache key:
```typescript
// history/bandwidth/route.ts — same pattern applies to the other three routes
const cacheKey = params.toString()
  ? `history-bandwidth-raw:${params.toString()}`
  : 'history-bandwidth-raw';

const bandwidth = await getCachedData(cacheKey, () =>
  fritzboxClient.getBandwidthHistoryRaw(params)
);
```
Note that this also needs to be reflected in tests: the `expect(mockGetCachedData).toHaveBeenCalledWith('history-bandwidth-raw', ...)` assertion will need to use the parameterised key form.

---

### WR-02: `getServiceDiscovery` reads `process.env` directly instead of using `haGet`

**File:** `lib/fritzbox/fritzboxClient.ts:581-617`

**Issue:** `getServiceDiscovery` is the only function in `fritzboxClient` that does not use the shared `haGet` transport. It reads `process.env.HA_API_URL` and `process.env.HA_API_KEY` directly and constructs a raw `fetch` call. This means:
- Any retry logic, timeout defaults, or error normalisation added to `haGet` in the future will not apply here.
- The environment variable names must stay in sync with two places (haClient and this function).
- The 15-second timeout is hardcoded and differs from the `haGet` default policy.

The stated reason in the comment is that `haGet` calls `response.json()` which fails on XML. A cleaner approach is to add an `acceptRaw` option to `haGet` (returning `Response`), or simply accept a text response from a thin wrapper. However, if the HA proxy has already been updated to return JSON for this endpoint (handled by the `content-type` branch at line 606), the XML path may never execute in production.

**Fix (minimal):** Extract the env-var guard and fetch boilerplate into a shared helper, or accept the duplication and add a comment documenting why `haGet` is not used, so future maintainers do not inadvertently "fix" it by refactoring to `haGet` and breaking the XML path:
```typescript
/**
 * NOTE: Cannot use haGet here because haGet always calls response.json().
 * This endpoint may return TR-064 XML. We handle both content types manually.
 * If HA proxy is updated to always return JSON, migrate to haGet.
 */
async function getServiceDiscovery(): Promise<ServiceDiscoveryResponse> {
```
The more robust fix is a `haGetRaw` variant that returns the `Response` object directly, but that is out of scope for a gap-closure phase.

---

### WR-03: `parseServiceDiscoveryXml` regex uses case-insensitive flag on XML tag names

**File:** `lib/fritzbox/fritzboxClient.ts:624-639`

**Issue:** The regex patterns inside `parseServiceDiscoveryXml` all use the `i` (case-insensitive) flag (e.g., `/<serviceType>(.*?)<\/serviceType>/i`). XML tag names are case-sensitive. The `i` flag means the regex matches `<servicetype>`, `<SERVICETYPE>`, and `<ServiceType>` as if they were identical, but the closing tag check is also case-insensitive. If the real TR-064 XML contains mixed-case tags in the opening and closing positions (e.g., `<serviceType>...</SERVICETYPE>`), the regex would match a malformed pair and extract garbage content. Standard TR-064 XML from AVM Fritz!Box devices uses lowercase consistently, so this is unlikely to cause a real-world failure, but the `i` flag should be removed to match the actual XML spec.

**Fix:**
```typescript
// Remove the 'i' flag from tag-matching regexes
const name = block.match(/<(?:friendlyName|serviceName)>(.*?)<\/(?:friendlyName|serviceName)>/)?.[1] ?? '';
const type = block.match(/<serviceType>(.*?)<\/serviceType>/)?.[1] ?? '';
const url  = block.match(/<(?:controlURL|SCPDURL)>(.*?)<\/(?:controlURL|SCPDURL)>/)?.[1] ?? '';
```
The outer `<service>` block extraction at line 627 should also drop the `i` flag.

---

### WR-04: Tests use unnecessary `as any` guard that silences type errors on mock methods

**Files:**
- `app/api/fritzbox/history/bandwidth/__tests__/route.test.ts:53-55`
- `app/api/fritzbox/history/device-events/__tests__/route.test.ts:49-51`
- `app/api/fritzbox/history/devices/__tests__/route.test.ts:49-51`
- `app/api/fritzbox/telephony/calls/__tests__/route.test.ts:51-53`
- `app/api/fritzbox/telephony/dect/__tests__/route.test.ts:50-52`
- `app/api/fritzbox/telephony/tam/__tests__/route.test.ts:42-44`

**Issue:** Every test file guards the mock method with:
```typescript
if (!mockFritzboxClient.getXxx) {
  (mockFritzboxClient as any).getXxx = jest.fn();
}
```
The `fritzboxClient` export now includes all Phase 162 methods (`getDectHandsets`, `getCallHistory`, `getTamStatus`, `getBandwidthHistoryRaw`, `getDeviceEventsRaw`, `getDevicePresenceHistory`, `getServiceDiscovery`). When `jest.mock('@/lib/fritzbox')` auto-mocks the module, all exported methods are available as `jest.fn()` instances. The guard is never triggered, and the `as any` cast suppresses TypeScript's ability to catch a typo in the method name. If a method is renamed in the client, the guard silently adds a new unrelated mock instead of failing with a type error.

**Fix:** Remove the guard entirely and rely on `jest.mocked(fritzboxClient).getXxx` directly, which TypeScript will type-check:
```typescript
// Before
if (!mockFritzboxClient.getBandwidthHistoryRaw) {
  (mockFritzboxClient as any).getBandwidthHistoryRaw = jest.fn();
}

// After — remove the guard entirely; jest.mock auto-mocks all exported methods
// mockFritzboxClient.getBandwidthHistoryRaw is already a jest.fn()
```

---

## Info

### IN-01: Comment in `fritzboxClient.ts` header documents only original endpoints

**File:** `lib/fritzbox/fritzboxClient.ts:9-13`

**Issue:** The JSDoc block at the top of `fritzboxClient.ts` lists five original HA proxy endpoints but does not mention the Phase 162 additions (telephony routes, raw history pass-through, service discovery). The function-level comments added per-function (`-- FRITZ-01 (v19.0)`, etc.) are sufficient, but the module header comment is stale and may mislead future readers into thinking only five endpoints exist.

**Fix:** Update or remove the endpoint list from the module header, or replace it with a reference to the section comments inline.

---

### IN-02: `fritzboxClient.ts` comment block references incorrect FRITZ-06 numbering

**File:** `lib/fritzbox/fritzboxClient.ts:534`

**Issue:** The comment above `getDeviceEventsRaw` reads `-- FRITZ-06 (v19.0)` but the section header at line 456 lists telephony as `FRITZ-01 through FRITZ-03` and raw history as `FRITZ-04 through FRITZ-06`. The existing `getDeviceEvents` (the transformed version, line 168) has no FRITZ number assignment. The numbering is internally consistent but the gap between the original `getDeviceEvents` function (no FRITZ label) and the new raw equivalent (`FRITZ-06`) is confusing.

**Fix:** Add a clarifying note that `getDeviceEvents` at line 168 is the legacy transformed function and `FRITZ-06 getDeviceEventsRaw` is the new pass-through. No functional change required.

---

_Reviewed: 2026-04-09T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
