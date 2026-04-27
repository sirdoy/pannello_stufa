---
phase: 165-milestone-hygiene
plan: "01"
subsystem: planning-artifacts
tags: [hygiene, tsc, commit-hashes, documentation, zod, validation]
dependency_graph:
  requires:
    - .planning/phases/157-auth-module/157-01-SUMMARY.md
    - .planning/phases/159-hue-gap-closure/159-01-SUMMARY.md
    - .planning/phases/160-sonos-gap-closure/160-01-SUMMARY.md
    - .planning/phases/161-netatmo-gap-closure/161-01-SUMMARY.md
    - .planning/phases/161-netatmo-gap-closure/161-02-SUMMARY.md
    - .planning/phases/156-path-migration-common-endpoints/156-VERIFICATION.md
    - .planning/REQUIREMENTS.md
    - app/api/v1/automations/route.ts
    - app/api/v1/thermorossi/settings/fan-level/route.ts
    - app/api/v1/thermorossi/settings/power/route.ts
    - app/api/v1/thermorossi/settings/temperature/water/route.ts
    - .planning/phases/163-dirigera-gap-closure/deferred-items.md
  provides:
    - Corrected commit hashes in 5 v19.0 SUMMARY files
    - Accurate /health auth spec in verification and requirements docs
    - Zero tsc errors (4 deferred errors resolved)
    - Deleted deferred-items.md
  affects:
    - v19.0 milestone hygiene gate
tech_stack:
  added:
    - zod schema (automationCreateSchema) inline in automations route
  patterns:
    - z.object().safeParse() for type-safe body parsing in API routes
    - jest.mock('@/lib/core/requestParser') for mocking parseJson in unit tests
    - badRequest() from @/lib/core replacing Response.json() for NextResponse compat
key_files:
  created: []
  modified:
    - .planning/phases/157-auth-module/157-01-SUMMARY.md
    - .planning/phases/159-hue-gap-closure/159-01-SUMMARY.md
    - .planning/phases/160-sonos-gap-closure/160-01-SUMMARY.md
    - .planning/phases/161-netatmo-gap-closure/161-01-SUMMARY.md
    - .planning/phases/161-netatmo-gap-closure/161-02-SUMMARY.md
    - .planning/phases/156-path-migration-common-endpoints/156-VERIFICATION.md
    - .planning/REQUIREMENTS.md
    - app/api/v1/automations/route.ts
    - app/api/v1/automations/__tests__/route.test.ts
    - app/api/v1/thermorossi/settings/fan-level/route.ts
    - app/api/v1/thermorossi/settings/power/route.ts
    - app/api/v1/thermorossi/settings/temperature/water/route.ts
    - .planning/phases/163-dirigera-gap-closure/163-01-SUMMARY.md
  deleted:
    - .planning/phases/163-dirigera-gap-closure/deferred-items.md
decisions:
  - "Use zod safeParse() instead of parse() + try/catch for cleaner error handling in automations POST"
  - "Mock @/lib/core/requestParser module in tests (not barrel @/lib/core) to intercept parseJson — barrel re-exports are not writable for jest.spyOn"
  - "Replace Response.json() with badRequest() in thermorossi settings routes — Response is plain Web API type, not NextResponse; withIdempotency handler requires NextResponse return type"
metrics:
  duration: "~35 minutes"
  completed_date: "2026-04-16"
  tasks_completed: 3
  files_created: 0
  files_modified: 13
  files_deleted: 1
requirements:
  - COMMON-01
  - COMMON-02
---

# Phase 165 Plan 01: Milestone Hygiene Summary

**One-liner:** Corrected 5 SUMMARY commit hashes, reconciled /health auth spec across verification/requirements docs, and fixed 4 deferred tsc errors (zod body validation + NextResponse-compatible badRequest).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | SUMMARY commit-hash sweep (5 files) | 335c4411 | 5 SUMMARY files corrected |
| 2 | /health spec reconciliation + REQUIREMENTS.md auth note | 7b378460 | 156-VERIFICATION.md + REQUIREMENTS.md |
| 3 | Fix 4 deferred tsc errors + delete deferred-items.md | cca2b2bd | 5 route files + test file + 163-01-SUMMARY.md + deferred-items.md deleted |

## What Was Built

### Task 1: SUMMARY commit-hash sweep

Five v19.0 SUMMARY files had stale commit hashes (from worktree execution where git SHAs differ). All replaced with hashes verified via `git show <hash> --stat`:

| File | Old Hash(es) | New Hash(es) |
|------|-------------|-------------|
| 157-01-SUMMARY.md | 0bc55b18, 1f5fff98 | 9838abb2, 688cfe17 |
| 159-01-SUMMARY.md | 84b03c1b | bbaa5a4f |
| 160-01-SUMMARY.md | 6a565666, c613758a | ec790563, aba3dc54 |
| 161-01-SUMMARY.md | 103a15e2 | b6327e01 |
| 161-02-SUMMARY.md | 2e38e63a, fd784b74 | c0618512, b8df17d6 |

Post-fix: hash verification script reports zero `MISSING` lines across all v19.0 SUMMARY files.

### Task 2: /health auth spec reconciliation

Two health routes exist with different auth behavior:
- `app/api/health/route.ts` — `withErrorHandler` (no auth), simple ping for OnlineStatusContext
- `app/health/route.ts` — `withAuthAndErrorHandler`, 8-provider aggregator (auth per CR-003 topology-leak guard)

The 156-VERIFICATION.md incorrectly described `app/health/route.ts` as using `withErrorHandler`. Fixed in 3 locations:
1. Observable Truth #3: added `(authenticated via withAuthAndErrorHandler ...)` parenthetical
2. Required Artifacts table: `withErrorHandler` → `withAuthAndErrorHandler`
3. Requirements Coverage COMMON-01: clarified aggregator auth distinction

REQUIREMENTS.md COMMON-01 updated with `auth: none (public probe)` note and canonical `/api/health` distinction.

No code changes to either health route file.

### Task 3: 4 deferred tsc errors resolved

**Fix 1 — app/api/v1/automations/route.ts (TS2345)**

Added `automationCreateSchema` (zod) inline:
```typescript
const automationCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  enabled: z.boolean().optional(),
});
```

POST handler uses `safeParse()` and returns `badRequest()` on validation failure. Body type now narrows from `Record<string, unknown>` to `AutomationCreate`-compatible before reaching `createAutomation()`.

Test file updated to mock `@/lib/core/requestParser` (not barrel) to inject parsed body — required because `parseJson` doesn't read body in jsdom test environment (plain `Request` body not readable). New 400 validation test added.

**Fixes 2/3/4 — thermorossi settings routes (TS2345)**

`withIdempotency` handler requires `Promise<NextResponse>` return type. `Response.json()` returns plain `Response`. Replaced in all 3 routes:

```typescript
// Before
return Response.json({ success: false, error: 'value must be a finite number' }, { status: 400 });

// After
return badRequest('value must be a finite number');
```

Added `badRequest` to imports from `@/lib/core` in each file.

**Cleanup:** `deferred-items.md` deleted; `163-01-SUMMARY.md` updated with Phase 165 addendum.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] parseJson returns {} in jsdom test environment**

- **Found during:** Task 3 test execution
- **Issue:** The plan specified a straightforward zod parse with try/catch. After adding validation, the two existing "returns 201" and "passes request body to proxy" tests both returned 400. Root cause: `parseJson` reads body via `request.text()` which doesn't work with `new Request(...)` in jsdom — returns empty object `{}` as default. With validation, `{}` correctly fails the schema (missing `name`).
- **Fix:** (a) Used `safeParse()` instead of `parse()` + try/catch for cleaner code. (b) Added `jest.mock('@/lib/core/requestParser', () => ({ ...jest.requireActual(...), parseJson: jest.fn() }))` in the test file so body content is injected via mock. Updated "passes request body to proxy" assertion from `expect.any(Object)` to `{ name: 'Test Rule' }` (more specific).
- **Files modified:** `app/api/v1/automations/__tests__/route.test.ts`
- **Commit:** cca2b2bd

**Note:** `@/lib/core` barrel re-exports are not writable for `jest.spyOn` — must mock the source submodule `@/lib/core/requestParser` directly.

## Known Stubs

None — all changes are documentation corrections and type-safety fixes.

## Threat Flags

None — `automationCreateSchema` closes T-165-01 (untrusted POST body now validated before proxy). No new network surface introduced.

## Self-Check: PASSED

Files verified:
- `335c4411` exists in git log: FOUND
- `7b378460` exists in git log: FOUND
- `cca2b2bd` exists in git log: FOUND
- `157-01-SUMMARY.md` contains `9838abb2` and `688cfe17`: VERIFIED
- `159-01-SUMMARY.md` contains `bbaa5a4f`: VERIFIED
- `160-01-SUMMARY.md` contains `ec790563` and `aba3dc54`: VERIFIED
- `161-01-SUMMARY.md` contains `b6327e01` (not `103a15e2`): VERIFIED
- `161-02-SUMMARY.md` contains `c0618512` and `b8df17d6`: VERIFIED
- Hash sweep: zero MISSING lines across v19.0 SUMMARY files
- `156-VERIFICATION.md` contains `withAuthAndErrorHandler` (3 occurrences): VERIFIED
- `REQUIREMENTS.md` COMMON-01 contains `auth: none (public probe)`: VERIFIED
- `deferred-items.md` does NOT exist: VERIFIED
- `163-01-SUMMARY.md` contains `Phase 165 addendum`: VERIFIED
- `app/api/v1/automations/route.ts` contains `automationCreateSchema` and `safeParse`: VERIFIED
- `app/api/v1/thermorossi/settings/fan-level/route.ts` contains `badRequest(` not `Response.json(`: VERIFIED
- `npx tsc --noEmit` exits 0: VERIFIED
- All 57 tests pass (automations + thermorossi/settings suites): VERIFIED
