---
phase: 173
plan: 03
subsystem: api/devices
tags: [tests, jest, aggregator, multi-provider, partial-failure]
requires:
  - 173-01 (types/devices.ts: Device, ProviderType, DeviceAggregatorError)
  - 173-02 (app/api/v1/devices/route.ts aggregator implementation)
provides:
  - Jest unit-test coverage for GET /api/v1/devices
affects:
  - app/api/v1/devices/__tests__/route.test.ts (new)
  - app/api/v1/devices/route.ts (Rule 3 fix: parseQuery)
tech_stack:
  added: []
  patterns:
    - jest.mock per provider proxy module + auth0
    - jest.clearAllMocks in beforeEach
    - console.warn / console.error spies (silence noise)
    - seedAllProviders() helper for happy-path mock seeding
    - parseQuery(request) as canonical query-extractor for testable routes
key_files:
  created:
    - app/api/v1/devices/__tests__/route.test.ts
  modified:
    - app/api/v1/devices/route.ts
decisions:
  - Use parseQuery(request) instead of request.nextUrl.searchParams so
    plain Request objects work in tests (matches automations canonical pattern)
metrics:
  duration_minutes: 6
  completed_date: "2026-04-27"
  tasks: 1
  files_changed: 2
  loc_added: 376
  loc_removed: 2
  test_cases: 21
---

# Phase 173 Plan 03: Aggregator Test Suite Summary

Co-located Jest suite for `GET /api/v1/devices` with **21 passing test cases** (target was ≥12, ~20). All 8 provider proxy modules + Auth0 mocked. The suite asserts every contract the route implements: auth, per-provider mapper output shape, partial-failure asymmetry (multi-item providers add to `errors[]`, single-item providers emit a `status=0` item without an errors entry), filter perf-win, invalid filter short-circuit, limit/offset clamps, and Italian-locale sort.

## Test count by category

| Category | Cases |
|----------|-------|
| Auth (401) | 1 |
| Happy path (8-provider distinct discriminator) | 1 |
| Per-provider mapper shape (one per provider) | 8 |
| Partial failure — multi-item provider (fritzbox) | 1 |
| Partial failure — single-item providers (raspi, thermorossi) | 2 |
| Filter perf-win (`?provider_type=hue` → 7×not.toHaveBeenCalled) | 1 |
| Invalid filter (`?provider_type=foo` → empty + zero fan-out) | 1 |
| Limit clamp (0→1, 2000→1000, NaN→100) | 3 |
| Offset clamp (negative→0, beyond-total preserves total_count) | 2 |
| Sort order (provider_type ASC, name ASC Italian-locale) | 1 |
| **Total** | **21** |

## Coverage map

| Test case | Defends decision / pitfall |
|-----------|----------------------------|
| `returns 401 when not authenticated` | T-173-02 (auth wrapper) |
| `aggregates items from all 8 providers with empty errors[]` | D-04 (fan-out symmetry) |
| `maps Fritz!Box ...` | mapFritzbox field-source map |
| `maps Hue ...` | mapHue field-source map |
| `maps Sonos ... omits room (Pitfall 2)` | Pitfall 2 (no room field) |
| `maps Netatmo thermostat + valve + camera (3 items)` | Pitfall 1 + Pitfall 6 (homesdata + cameras) |
| `maps DIRIGERA sensor with type=contact_sensor` | type discriminator switch |
| `maps Tuya plug using custom_name fallback (Pitfall 3)` | Pitfall 3 (TuyaPlug has no name) |
| `emits single Raspi item ... status=1 when healthy` | Pitfall 4 (single-item) |
| `emits single Thermorossi item ... status=1 when healthy` | Pitfall 4 (single-item) |
| `returns 200 with errors[] entry when fritzbox rejects` | D-13 (partial failure 200 + errors[]) |
| `Raspi item with status=0 (NOT in errors[]) when getHealth rejects` | **Pitfall 4 (single-item asymmetry)** |
| `Thermorossi item with status=0 (NOT in errors[]) when getHealth rejects` | **Pitfall 4 (single-item asymmetry)** |
| `?provider_type=hue calls only Hue listing function` | **Pitfall 5 / D-20 (filter-driven slot filter)** |
| `?provider_type=foo returns 200 empty + zero fan-out` | D-20 (invalid filter short-circuit) |
| `clamps limit=0 to 1` / `=2000 to 1000` / `=NaN to 100` | D-18 (limit clamp 1..1000 NaN-safe) |
| `clamps negative offset to 0` / `beyond-total preserves total_count` | D-19 + D-16 |
| `sorts items by provider_type ASC then name ASC Italian-locale` | D-17 (sort) |

## Single-item provider asymmetry (Pitfall 4)

Two dedicated tests verify the asymmetric contract:

- **Raspi rejection test:** `mockRaspiGetHealth.mockRejectedValue(new Error('Raspi down'))` → asserts the response contains `{ id: 'raspi:host', status: 0 }` AND `data.errors.find(e => e.provider_type === 'raspi')` is `undefined`.
- **Thermorossi rejection test:** Same shape — `{ id: 'thermorossi:stove', status: 0 }` present, no `thermorossi` entry in `errors[]`.

This is the key contract that distinguishes Raspi/Thermorossi from the 6 multi-item providers: their failure is a "device-down" signal, not a "provider unavailable" signal.

## Filter perf-win assertion (Pitfall 5 / D-20)

The `?provider_type=hue` test asserts:

- `expect(mockGetLights).toHaveBeenCalled()` — Hue is invoked
- 7 `expect(mock<Other>).not.toHaveBeenCalled()` — every other provider listing fn is NOT invoked

This guards the route's slot filter:

```ts
const slots = providerFilter === null
  ? allSlots
  : allSlots.filter(s => s.type === providerFilter);
```

Regression of this filter (e.g. filtering only the response items but still calling all 8 providers) would cause the 7 `not.toHaveBeenCalled` assertions to fail.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Route used `request.nextUrl.searchParams` (NextRequest-only accessor) which breaks under plain `Request` test fixtures**

- **Found during:** Task 1 — first happy-path test failed with HTTP 500 because `request.nextUrl` is `undefined` on a `new Request(...)` object.
- **Issue:** Plan 02 wrote `const sp = request.nextUrl.searchParams;` which only works when Next.js wraps the request as `NextRequest`. The plan-mandated test scaffold (mirrored from `automations/route.test.ts`) uses `new Request('http://localhost:3000/api/v1/devices?...')` — a plain `Request`. The middleware passes the request through verbatim, so `nextUrl` is undefined and the handler throws.
- **Fix:** Replaced with `parseQuery(request)` (already exported from `@/lib/core`, used by `automations/route.ts:18` — the canonical pattern referenced in Plan 03's `<read_first>`). `parseQuery` does `new URL(request.url).searchParams` which works for both `NextRequest` and plain `Request`.
- **Files modified:** `app/api/v1/devices/route.ts` (1-line import addition + 1-line body change).
- **Behavior preserved:** Identical query-string parsing semantics in production; only the testability changed.
- **Commit:** `8eb814f6` (rolled into the test commit since the route fix is what makes the tests runnable).

## Verification

- `npm test -- app/api/v1/devices/__tests__/route.test.ts` → **21/21 pass** in ~2.2 s
- `npm run test:api -- app/api/v1/devices` → **8 suites, 89 tests, all pass** in ~8 s (no regressions in adjacent API tests)
- Acceptance grep checks (manually verified):
  - `jest.mock(` count: 9 (8 providers + auth0) ✓
  - `^  it(` count: 21 (≥12 required) ✓
  - `describe('GET /api/v1/devices'` count: 1 ✓
  - `import { GET } from '../route'` present ✓
  - `raspi:host` and `thermorossi:stove` strings present ✓
  - `expect(data.errors)` count: 6 (≥3 required) ✓
  - `provider_type=hue` and `provider_type=foo` filter tests present ✓
  - `limit=2000` and `offset=-10` clamp tests present ✓

## Commit

- `8eb814f6` — test(173-03): add Jest suite for cross-provider devices aggregator (also includes the Rule 3 `parseQuery` fix to `app/api/v1/devices/route.ts` so the suite is runnable)

## Self-Check: PASSED

- File exists: `app/api/v1/devices/__tests__/route.test.ts` ✓
- Commit exists: `8eb814f6` ✓
- All 21 tests pass under both `npm test -- <file>` and `npm run test:api -- app/api/v1/devices` ✓
- No regressions in 8-suite scoped run (89/89 pass) ✓
