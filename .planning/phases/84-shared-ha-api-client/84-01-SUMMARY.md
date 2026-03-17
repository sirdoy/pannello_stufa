---
phase: 84-shared-ha-api-client
plan: "01"
subsystem: lib/haClient
tags: [api-client, shared, x-api-key, fetch, error-handling, tdd]
dependency_graph:
  requires:
    - lib/core/apiErrors.ts
  provides:
    - lib/haClient.ts (haGet, haPost)
    - types/haClient.ts (RFC9457ProblemDetail, HaRequestOptions)
  affects:
    - Future provider clients: lib/fritzbox/, lib/netatmo/, lib/raspberryPi/
tech_stack:
  added: []
  patterns:
    - TDD (RED-GREEN): types + tests first, then implementation
    - Function module (no class) for proxy client
    - Private helper functions for shared error mapping
    - AbortController timeout on every request
    - RFC 9457 error parsing
key_files:
  created:
    - lib/haClient.ts
    - types/haClient.ts
    - __tests__/lib/haClient.test.ts
  modified: []
decisions:
  - "Function module pattern (not class) — matches v10.0 Netatmo decision, simpler than class-based Fritz!Box client"
  - "Extracted mapResponseError and mapCaughtError helpers — eliminates duplication present in netatmoProxy.ts"
  - "Only two env vars: HA_API_URL and HA_API_KEY — no provider-specific variants"
  - "RFC9457ProblemDetail moved to types/haClient.ts — single source of truth for all providers"
  - "RATE_LIMITED (429) added as explicit case — improvement over netatmoProxy.ts which lacked this mapping"
metrics:
  duration: "3m 18s"
  completed: "2026-03-17T10:29:10Z"
  tasks_completed: 2
  tasks_total: 2
  files_created: 3
  files_modified: 0
  tests_added: 18
  tests_passing: 18
requirements_met: [API-01, API-02, API-03]
---

# Phase 84 Plan 01: Shared HA API Client Summary

**One-liner:** Shared `haGet`/`haPost` function module with X-API-Key auth, AbortController timeouts, and RFC 9457 error mapping — common transport layer for all HA proxy provider clients.

## What Was Built

Created `lib/haClient.ts` as the shared transport layer for the HomeAssistant proxy. This eliminates the duplicated fetch+timeout+error-mapping logic that existed in `lib/netatmoProxy.ts` and `lib/fritzbox/fritzboxClient.ts`. All future provider clients (Fritz!Box, Netatmo, Raspberry Pi) will build on these two primitives.

### Files Created

| File | Purpose | Lines |
|------|---------|-------|
| `lib/haClient.ts` | Generic `haGet<T>` and `haPost<T>` functions | 205 |
| `types/haClient.ts` | Shared types: `RFC9457ProblemDetail`, `HaRequestOptions` | 31 |
| `__tests__/lib/haClient.test.ts` | 18 unit tests (TDD) | 257 |

### Key Design Decisions

1. **Function module over class** — matches the v10.0 Netatmo pattern decision. No state to manage, simpler to import.

2. **Shared private helpers** — `mapResponseError()` and `mapCaughtError()` are extracted once and called from both `haGet` and `haPost`. This is an improvement over `netatmoProxy.ts` which duplicated the same error-mapping block in both functions.

3. **RATE_LIMITED (429) handling** — added as an explicit mapping (`ERROR_CODES.RATE_LIMITED`). The existing `netatmoProxy.ts` lacked this, mapping 429 to `EXTERNAL_API_ERROR`. The shared client is more precise.

4. **Only `HA_API_URL` + `HA_API_KEY`** — no provider-specific env vars. The shared client is provider-agnostic; each provider client will use these two vars through `haGet`/`haPost`.

5. **RFC9457ProblemDetail moved to `types/haClient.ts`** — previously only in `types/netatmoProxy.ts`. Now a single source of truth that all providers import.

## Test Coverage

All 18 tests pass GREEN:

**haGet (12 tests):**
- X-API-Key header sent from env var
- URL built from HA_API_URL + endpoint
- Parsed JSON returned on 200
- ApiError EXTERNAL_API_ERROR when HA_API_URL missing
- ApiError EXTERNAL_API_ERROR when HA_API_KEY missing
- ApiError UNAUTHORIZED on 401
- ApiError SERVICE_UNAVAILABLE on 503
- ApiError RATE_LIMITED on 429
- ApiError EXTERNAL_API_ERROR on other non-ok
- RFC 9457 detail field extracted from error body
- ApiError TIMEOUT on AbortError
- ApiError EXTERNAL_API_ERROR on network error

**haPost (6 tests):**
- X-API-Key + Content-Type headers
- JSON.stringify(body) as request body + method POST
- Parsed JSON on 200
- ApiError UNAUTHORIZED on 401
- ApiError TIMEOUT on AbortError
- ApiError EXTERNAL_API_ERROR when HA_API_URL missing

## Verification Results

```
✓ npx jest __tests__/lib/haClient.test.ts — 18/18 tests pass
✓ grep -c 'export async function' lib/haClient.ts → 2 (haGet, haPost)
✓ HA_API_URL and HA_API_KEY referenced in lib/haClient.ts
✓ No NETATMO_PROXY_URL or HOMEASSISTANT_API_URL in lib/haClient.ts
✓ Zero new tsc errors introduced by plan files
```

## Deviations from Plan

None — plan executed exactly as written.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 (RED) | `edc88c1` | test(84-01): add failing tests for shared haGet and haPost |
| 2 (GREEN) | `8afade1` | feat(84-01): implement shared haGet and haPost with X-API-Key auth |

## Self-Check: PASSED

- [x] `lib/haClient.ts` exists: FOUND
- [x] `types/haClient.ts` exists: FOUND
- [x] `__tests__/lib/haClient.test.ts` exists: FOUND
- [x] Commit `edc88c1` exists: FOUND
- [x] Commit `8afade1` exists: FOUND
- [x] 18 tests pass: VERIFIED
