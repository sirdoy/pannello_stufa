---
phase: 165-milestone-hygiene
reviewed: 2026-04-16T00:00:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - app/api/v1/automations/route.ts
  - app/api/v1/automations/__tests__/route.test.ts
  - app/api/v1/thermorossi/settings/fan-level/route.ts
  - app/api/v1/thermorossi/settings/power/route.ts
  - app/api/v1/thermorossi/settings/temperature/water/route.ts
findings:
  critical: 0
  warning: 2
  info: 3
  total: 5
status: issues_found
---

# Phase 165: Code Review Report

**Reviewed:** 2026-04-16T00:00:00Z
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

Reviewed the automations API route, its test suite, and three Thermorossi settings routes (fan-level, power, water temperature). The three Thermorossi routes are correct and follow established project patterns. The automations route has two input-validation gaps: query param sanitization is incomplete (non-numeric and empty strings produce `NaN`/`0` silently), and range bounds on numeric `value` fields are delegated entirely to the proxy without documentation. The test suite is well-structured but leaves the malformed query param edge case uncovered.

No security vulnerabilities, authentication bypasses, or critical logic errors were found.

## Warnings

### WR-01: Malformed `limit`/`offset` query params silently produce `NaN` or `0`

**File:** `app/api/v1/automations/route.ts:19-20`
**Issue:** `Number(params.get('limit') ?? '20')` correctly defaults when the param is absent, but passes the value to the proxy without validating it is a safe positive integer. `?limit=abc` produces `NaN`; `?limit=` (empty string) produces `0`. Both values are forwarded to `automationsProxy.getAutomations()` unchanged. The proxy may accept or reject them unpredictably, and the API returns no client-facing error for clearly invalid input.
**Fix:**
```typescript
const rawLimit = params.get('limit');
const rawOffset = params.get('offset');
const limit = rawLimit !== null ? parseInt(rawLimit, 10) : 20;
const offset = rawOffset !== null ? parseInt(rawOffset, 10) : 0;

if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
  return badRequest('limit must be an integer between 1 and 100');
}
if (!Number.isInteger(offset) || offset < 0) {
  return badRequest('offset must be a non-negative integer');
}
```

### WR-02: Test suite has no coverage for invalid `limit`/`offset` query params

**File:** `app/api/v1/automations/__tests__/route.test.ts:74-81`
**Issue:** The `passes limit and offset query params to proxy` test only exercises the happy path (`limit=10&offset=5`). There is no test asserting that `?limit=abc`, `?limit=-1`, or `?limit=0` are rejected with a 400. If WR-01 is fixed, corresponding tests will be needed to prevent regressions.
**Fix:** Add a test block covering invalid param values:
```typescript
it('returns 400 when limit is not a valid integer', async () => {
  const request = new Request('http://localhost:3000/api/v1/automations?limit=abc');
  const response = await GET(request as any, {} as any);
  expect(response.status).toBe(400);
});

it('returns 400 when limit is zero', async () => {
  const request = new Request('http://localhost:3000/api/v1/automations?limit=0');
  const response = await GET(request as any, {} as any);
  expect(response.status).toBe(400);
});
```

## Info

### IN-01: Fan-level and power routes omit range documentation present in water temp route

**File:** `app/api/v1/thermorossi/settings/fan-level/route.ts:8`, `app/api/v1/thermorossi/settings/power/route.ts:8`
**Issue:** The water temperature route JSDoc explicitly notes the valid range (`40-80`) and that the proxy returns 422 on out-of-range values. The fan-level and power routes only state "range validated by proxy" in the comment body but omit the concrete valid ranges. This creates an incomplete API contract for consumers.
**Fix:** Add the valid range to JSDoc for both routes. Example for fan-level:
```typescript
 * Body: { value: number } — range 1-5 validated by proxy (422 on out-of-range)
```

### IN-02: Double type assertion used to satisfy `success()` call signature

**File:** `app/api/v1/automations/route.ts:22`, `app/api/v1/automations/route.ts:36`
**Issue:** Both `success(data as unknown as Record<string, unknown>)` and `created(data as unknown as Record<string, unknown>)` use the double assertion idiom to escape the type system. This is a known project pattern (see MEMORY.md v10.0) and is not a bug, but the proxy already returns typed `PaginatedResponse<AutomationRule>` and `AutomationRule`. If `success()`/`created()` were made generic, this assertion would be unnecessary.
**Fix:** Not urgent. If `success()` is ever refactored to accept a generic, these callsites can be simplified:
```typescript
return success<PaginatedResponse<AutomationRule>>(data);
```

### IN-03: Three Thermorossi settings routes are structural duplicates

**File:** `app/api/v1/thermorossi/settings/fan-level/route.ts`, `app/api/v1/thermorossi/settings/power/route.ts`, `app/api/v1/thermorossi/settings/temperature/water/route.ts`
**Issue:** All three routes share identical validation logic (`typeof value !== 'number' || !Number.isFinite(value)`) and response shape. This is fine at the current scale, but if the validation logic changes (e.g., adding integer-only check or min/max bounds), all three files must be updated independently.
**Fix:** Consider a shared `parseNumericValue()` helper in `lib/stove/` that centralises the parse-and-validate step:
```typescript
// lib/stove/parseNumericValue.ts
export function parseNumericValue(body: Record<string, unknown>): number | Response {
  const value = body['value'];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return badRequest('value must be a finite number');
  }
  return value;
}
```
This is a low-priority refactor — the duplication is explicit and intentional at this scale.

---

_Reviewed: 2026-04-16T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
