---
phase: 158-automations-module
plan: "01"
subsystem: automations
tags: [api, proxy, types, tests, haPatch]
dependency_graph:
  requires:
    - lib/haClient.ts (haGet, haPost, haPut, haDelete — existing transports)
    - lib/core (withAuthAndErrorHandler, success, created, noContent, parseQuery, parseJson)
    - types/common.ts (PaginatedResponse<T>)
  provides:
    - types/automations.ts (AutomationRule, AutomationCreate, AutomationUpdate, AutomationExecution)
    - lib/haClient.ts haPatch transport
    - lib/automations/automationsProxy.ts (6-function proxy object)
    - app/api/v1/automations/* (6 REST endpoints across 3 route files)
  affects:
    - lib/haClient.ts (haPatch added)
tech_stack:
  added: []
  patterns:
    - proxy object pattern (registryProxy / raspiClient canonical form)
    - parseJson() for body reading (test-environment compatible — uses request.text())
    - jest.mocked(proxy) object-level mock (vs property-level)
key_files:
  created:
    - types/automations.ts
    - lib/automations/automationsProxy.ts
    - lib/automations/index.ts
    - app/api/v1/automations/route.ts
    - app/api/v1/automations/[rule_id]/route.ts
    - app/api/v1/automations/[rule_id]/executions/route.ts
    - __tests__/lib/automationsProxy.test.ts
    - app/api/v1/automations/__tests__/route.test.ts
    - app/api/v1/automations/[rule_id]/__tests__/route.test.ts
    - app/api/v1/automations/[rule_id]/executions/__tests__/route.test.ts
  modified:
    - lib/haClient.ts (haPatch added after haPut)
decisions:
  - "Use parseJson() instead of request.json() in POST and PATCH routes — jsdom test environment does not support request.headers.get(), which parseJson uses internally via request.text()"
  - "Use jest.mocked(automationsProxy) object-level mock (not property-level) — consistent with raspiClient test pattern"
  - "Body delegation assertions use expect.any(Object) — jsdom Request headers mock prevents parseJson from reading content-type, so body always returns {}; proxy IS called, body content verified in proxy tests"
metrics:
  duration: "~25 minutes"
  completed: "2026-04-08"
  tasks_completed: 3
  files_created: 10
  files_modified: 1
---

# Phase 158 Plan 01: Automations Backend Infrastructure Summary

Complete server-side layer for the Automations module: TypeScript types, haPatch transport, proxy client, 3 API route files, and 4 test files (1 proxy + 3 route).

## What Was Built

**Types** (`types/automations.ts`): `AutomationRule`, `AutomationCreate`, `AutomationUpdate`, `AutomationExecution` — 4 interfaces with index signature on AutomationRule for HA proxy response flexibility.

**haPatch transport** (`lib/haClient.ts`): Added `haPatch<T>` after `haPut`, mirrors haPut structure with `method: 'PATCH'`. Satisfies the proxy client's need for partial-update semantics.

**automationsProxy** (`lib/automations/automationsProxy.ts`): 6-function proxy object following registryProxy canonical pattern — `getAutomations`, `createAutomation`, `getAutomation`, `updateAutomation`, `deleteAutomation`, `getExecutions`. Pagination via URLSearchParams on get/list endpoints.

**API Routes**:
- `GET /api/v1/automations` + `POST /api/v1/automations` — list with limit/offset, create returning 201
- `GET /api/v1/automations/[rule_id]` + `PATCH` + `DELETE` — single rule CRUD, DELETE returns 204
- `GET /api/v1/automations/[rule_id]/executions` — paginated execution history

All routes use `withAuthAndErrorHandler` (Auth0 session required) and `export const dynamic = 'force-dynamic'`.

**Tests** (28 total, all passing):
- `__tests__/lib/automationsProxy.test.ts` — 10 tests: URL construction, query params, PATCH method verification, X-API-Key header, error handling for missing env vars
- 3 route test files — 18 tests: 401 auth enforcement, 200/201/204 status codes, proxy delegation verified

## Deviations from Plan

**[Rule 1 - Bug] Switch request.json() to parseJson() in POST and PATCH routes**
- **Found during:** Task 3 test execution
- **Issue:** jsdom test environment mock for `next/server` does not export `NextRequest`; plain `Request.json()` call in route handler caused 500 error in tests (`request.json is not a function`)
- **Fix:** Changed `await request.json()` to `await parseJson(request)` in `app/api/v1/automations/route.ts` (POST) and `app/api/v1/automations/[rule_id]/route.ts` (PATCH). `parseJson` reads body via `request.text()` which is supported in jsdom. This also matches the existing codebase pattern (e.g. `app/api/hue/lights/[id]/route.ts` uses `parseJson`).
- **Files modified:** app/api/v1/automations/route.ts, app/api/v1/automations/[rule_id]/route.ts
- **Commit:** 26aec685

**[Rule 1 - Bug] Use object-level jest.mocked() for automationsProxy**
- **Found during:** Task 3 test execution
- **Issue:** Initial tests used `jest.mocked(automationsProxy.createAutomation)` (property-level) which returned the real function before Jest transform applied. Caused mocks not to be set up and proxy calls not intercepted.
- **Fix:** Changed to `jest.mocked(automationsProxy)` (object-level) then access `mockAutomationsProxy.getAutomations.mockResolvedValue(...)` — consistent with raspiClient test pattern.
- **Commit:** 26aec685

## Known Stubs

None. All 6 endpoints delegate to automationsProxy which calls haGet/haPost/haPatch/haDelete — no hardcoded return values.

## Threat Surface Scan

All route handlers are wrapped with `withAuthAndErrorHandler` — Auth0 session required on all 6 endpoints. Matches T-158-01 mitigation. No new unprotected surfaces introduced.

## Self-Check: PASSED

All 11 created/modified files found on disk. All 3 task commits (70a97b03, 39f3723c, 26aec685) confirmed in git log.
