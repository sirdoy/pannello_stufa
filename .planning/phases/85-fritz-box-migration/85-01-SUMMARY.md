---
phase: 85-fritz-box-migration
plan: "01"
subsystem: fritzbox-client
tags: [migration, jwt-removal, ha-client, function-module]
dependency_graph:
  requires: [lib/haClient.ts, Phase 84]
  provides: [lib/fritzbox/fritzboxClient.ts function module]
  affects: [all Fritz!Box API routes (unchanged call patterns)]
tech_stack:
  added: []
  patterns: [haGet function module, X-API-Key auth via shared HA proxy]
key_files:
  created: []
  modified:
    - lib/fritzbox/fritzboxClient.ts
    - lib/fritzbox/index.ts
    - lib/fritzbox/__tests__/fritzboxClient.test.ts
    - app/settings/page.tsx
  deleted:
    - app/api/config/fritzbox/route.ts
    - app/api/config/fritzbox/__tests__/route.test.ts
decisions:
  - "Function module pattern for fritzboxClient matches netatmoProxy.ts and haClient.ts — consistent across all providers"
  - "Credential config route deleted entirely — X-API-Key env var (HA_API_KEY) replaces Firebase RTDB credential storage"
  - "Settings page 'Rete' tab removed — no Fritz!Box credentials to configure at runtime"
metrics:
  duration_minutes: 15
  tasks_completed: 3
  files_modified: 4
  files_deleted: 2
  completed_date: "2026-03-17"
---

# Phase 85 Plan 01: Fritz!Box Client JWT-to-haGet Migration Summary

Fritz!Box client migrated from class-based JWT authentication to function module using shared haGet transport (X-API-Key), eliminating the JWT login flow, Firebase RTDB credential resolution, and runtime credential management UI.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Rewrite fritzboxClient.ts as function module + update barrel | 60cfa48 | lib/fritzbox/fritzboxClient.ts, lib/fritzbox/index.ts |
| 2 | Rewrite fritzboxClient tests for haGet-based client | cbf421f | lib/fritzbox/__tests__/fritzboxClient.test.ts |
| 3 | Delete credential config route and remove settings page Fritz!Box section | 885662a | app/api/config/fritzbox/route.ts (deleted), app/api/config/fritzbox/__tests__/route.test.ts (deleted), app/settings/page.tsx |

## What Was Built

The `FritzBoxClient` class (~377 LOC including JWT login, credential resolution, token caching, and credential cache) was replaced with a lean function module (~140 LOC). The new implementation delegates all auth, timeout, and error handling to `haGet` from `lib/haClient.ts`. Response transformation logic (bps→Mbps, status→active, Unix timestamps→ms) is identical to the previous implementation.

The `fritzboxClient` object export is preserved so all existing API routes (`fritzboxClient.getDevices()`, etc.) require zero changes.

The credential config API route (`/api/config/fritzbox`) and its 16 tests were deleted — Fritz!Box auth is now entirely via the `HA_API_KEY` environment variable, consistent with Netatmo and all other providers.

The settings page "Rete" tab (FritzBoxContent component) was removed since there are no longer runtime credentials to manage.

## Test Results

- 8/8 fritzboxClient tests pass
- Tests mock `haGet` directly — no JWT, no fetch mocking, no env var setup required
- Old test count: 13 tests (some testing JWT caching behavior)
- New test count: 8 tests (transformation logic + error propagation)

## Decisions Made

1. **Function module pattern** — matches netatmoProxy.ts and haClient.ts; consistent across all providers in the codebase
2. **Full credential route deletion** — no migration path needed; HA_API_KEY env var is the only auth mechanism going forward
3. **Settings tab removal** — "Rete" tab removed entirely; Fritz!Box no longer has any user-configurable credentials

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- [x] lib/fritzbox/fritzboxClient.ts exists and contains `import { haGet }` and `export const fritzboxClient`
- [x] lib/fritzbox/fritzboxClient.ts does NOT contain class FritzBoxClient, getToken, resolveCredentials, cachedToken, HOMEASSISTANT_
- [x] lib/fritzbox/__tests__/fritzboxClient.test.ts contains mockHaGet, no MOCK_JWT, no global.fetch
- [x] app/api/config/fritzbox/route.ts does NOT exist
- [x] app/api/config/fritzbox/__tests__/route.test.ts does NOT exist
- [x] app/settings/page.tsx does NOT contain config/fritzbox or invalidateFritzBoxCredentialCache
- [x] All 8 fritzboxClient tests pass
- [x] Commits: 60cfa48, cbf421f, 885662a
