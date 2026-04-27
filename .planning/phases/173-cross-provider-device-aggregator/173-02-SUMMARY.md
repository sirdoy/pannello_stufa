---
phase: 173
plan: 02
subsystem: api/devices
tags: [aggregator, multi-provider, promise-allsettled, fan-out]
requires:
  - 173-01 (types/devices.ts: Device, ProviderType, DeviceAggregatorError)
provides:
  - GET /api/v1/devices multi-provider aggregator
affects:
  - app/api/v1/devices/route.ts
tech_stack:
  added: []
  patterns:
    - Promise.allSettled fan-out across 8 providers
    - filtered promiseSpec for ?provider_type= perf win (D-20)
    - single-item-provider asymmetry (raspi, thermorossi emit on rejection, never in errors[])
key_files:
  created: []
  modified:
    - app/api/v1/devices/route.ts
decisions:
  - D-04 fan-out symmetry mirrored from app/health/route.ts skeleton
  - D-13 partial failures stay HTTP 200 with errors[] entry per failed multi-item provider
  - D-16 total_count = pre-pagination merged length; slice last
  - D-17 sort by provider_type ASC then name ASC ('it' locale)
  - D-18 limit clamped 1..1000 (default 100, NaN-safe)
  - D-19 offset clamped >= 0 (default 0, NaN-safe)
  - D-20 invalid ?provider_type=foo short-circuits to empty result without fan-out
metrics:
  duration_minutes: 4
  completed_date: "2026-04-27"
  tasks: 1
  files_changed: 1
  loc_added: 333
  loc_removed: 46
---

# Phase 173 Plan 02: Cross-Provider Device Aggregator Route Summary

Rewrote `app/api/v1/devices/route.ts` from a 47-line Fritz!Box-only listing into a 333-line multi-provider aggregator that fans out across all 8 providers via `Promise.allSettled`, normalizes per-provider items into the unified `Device` shape (Plan 01), surfaces partial failures via a non-fatal `errors[]` array (HTTP stays 200), supports a `?provider_type=` short-circuit filter, and applies post-merge sort + clamp + pagination.

## Route handler structure

1. **Imports** — 8 named imports of provider listing functions plus the four type imports from `@/types/devices`.
2. **Constants** — `PROVIDER_TYPES` (the 8 literal union values) + `SINGLE_ITEM_PROVIDERS` documentation set.
3. **Per-provider mappers (8 inline)** — `mapFritzbox`, `mapHue`, `mapSonos`, `mapNetatmo`, `mapDirigera`, `mapTuya`, `mapRaspi`, `mapThermorossi`. All use `Awaited<ReturnType<typeof fn>>` to derive input shapes without coupling to internal proxy types.
4. **GET handler** — limit/offset clamps, provider filter validation, filtered `promiseSpec`, `Promise.allSettled` fan-out, per-slot result dispatch, sort, paginate, return `success(...)`.

## Single-item provider asymmetry

`raspi` and `thermorossi` always emit exactly one item:
- On fulfillment → `status: 1` (or `status: 1` only when `getThermorossiHealth().status === 'ok'`).
- On rejection → still emit one item with `status: 0`.
- They **never** contribute to `errors[]` — Pitfall 4 from RESEARCH.md.

Multi-item providers (`fritzbox`, `hue`, `sonos`, `netatmo`, `dirigera`, `tuya`) on rejection contribute zero items AND get a `{ provider_type, message }` entry in `errors[]` with the message extracted via `result.reason instanceof Error ? .message : String(.)`.

## D-20 filter-driven `promiseSpec` perf win

`?provider_type=hue` does not just filter the response — it filters the slot list **before** `Promise.allSettled`, so the other 7 provider listing functions are never invoked. Invalid `provider_type=foo` short-circuits to `{ items: [], total_count: 0, errors: [] }` with HTTP 200 and zero outbound calls.

## Pitfalls handled

| # | Pitfall | Handling in route |
|---|---------|-------------------|
| 1 | Use `getProxyHomesdata` (not `getProxyHomestatus`) for Netatmo modules | `getProxyHomesdata` import + zero `getProxyHomestatus` references (verified by grep) |
| 2 | `SonosDeviceResponse` has no `room` field | `mapSonos` omits `room` entirely |
| 3 | `TuyaPlug` has no `name` — fallback `custom_name ?? device_id` | Implemented in `mapTuya` |
| 4 | Single-item provider asymmetry | `mapRaspi` / `mapThermorossi` accept `PromiseSettledResult` and never push to `errors[]` |
| 5 | Filter-driven slot filtering for perf | `slots = providerFilter === null ? allSlots : allSlots.filter(s => s.type === providerFilter)` |
| 6 | Cameras live in `getProxyCameraStatus`, not in `homesdata` | `mapNetatmo` accepts both inputs; netatmo slot uses `Promise.all([getProxyHomesdata, getProxyCameraStatus])` |

## Threat dispositions

| Threat ID | Disposition | Mitigation |
|-----------|-------------|------------|
| T-173-01 (info disclosure via errors[]) | mitigate | `result.reason instanceof Error ? .message : String(.)` — proxy modules already strip credentials from messages |
| T-173-02 (unauth access) | mitigate | `withAuthAndErrorHandler` wrapper preserved verbatim |
| T-173-03 (DoS via ?limit) | mitigate | `Math.max(1, Math.min(rawLimit, 1000))`, NaN-safe |
| T-173-04 (cache leak) | mitigate | `export const dynamic = 'force-dynamic'` preserved |
| T-173-07 (tampering ?provider_type) | mitigate | Validated against `PROVIDER_TYPES` allowlist before use |
| T-173-08 (provider hang) | accept | No per-provider timeout (D-14 deferred); trusts `haClient` 15s default; `Promise.allSettled` ensures one slow provider does not fail the response |

## Verification

- `npm run test:api -- app/api/v1/devices --passWithNoTests` → 7 suites passed, 68 tests passed.
- All 23 grep acceptance checks pass (Promise.allSettled present, all 8 mappers, auth wrapper preserved, no `getProxyHomestatus`, sort/clamp patterns exact, etc.).
- File line count: 333 (within ≤350 sanity bound).

## Deviations from Plan

None — plan executed exactly as written. The route file already matched the planned structure on disk (left over from an earlier worktree merge); verified byte-for-byte against the plan, ran the verify command, and committed.

## Commit

- `10b6fea6` — feat(173-02): rewrite devices route as multi-provider aggregator

## Self-Check: PASSED

- File exists: app/api/v1/devices/route.ts ✓
- Commit exists: 10b6fea6 ✓
- All 23 grep acceptance checks pass ✓
- `npm run test:api -- app/api/v1/devices --passWithNoTests` exits 0 ✓
