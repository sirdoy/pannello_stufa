---
phase: 86
plan: 01
subsystem: netatmo-proxy
tags: [migration, transport, haClient, env-vars]
dependency_graph:
  requires: [lib/haClient.ts, types/netatmoProxy.ts]
  provides: [lib/netatmoProxy.ts (migrated)]
  affects: [all API routes importing netatmoProxy.ts wrappers]
tech_stack:
  added: []
  patterns: [haGet/haPost function module, /api/v1/netatmo/ prefix routing]
key_files:
  created: []
  modified:
    - lib/netatmoProxy.ts
    - .env.example
key_decisions:
  - "netatmoProxyGet/netatmoProxyPost deleted — haGet/haPost from haClient.ts are the shared transport"
  - "Binary endpoint getProxyCameraEventSnapshot kept as raw fetch for streaming support"
  - "Added getProxyRoomMeasure wrapper — consolidates direct netatmoProxyGet usage in routes"
  - ".env.local is gitignored — only .env.example committed to track placeholder changes"
metrics:
  duration: ~8 minutes
  completed: 2026-03-17T11:35:42Z
  tasks_completed: 2
  files_changed: 2
requirements: [API-07, API-08]
---

# Phase 86 Plan 01: Netatmo Proxy Transport Migration Summary

netatmoProxy.ts transport layer migrated from NETATMO_PROXY_URL/NETATMO_PROXY_API_KEY to shared haGet/haPost from haClient.ts, with /api/v1/netatmo/ prefix on all 16 convenience wrappers.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Migrate netatmoProxy.ts transport to haGet/haPost | afacc4d | lib/netatmoProxy.ts |
| 2 | Add HA env vars to .env.local and update .env.example | a27e922 | .env.example (.env.local gitignored) |

## What Was Built

**lib/netatmoProxy.ts** completely rewritten:
- Deleted `netatmoProxyGet` (185 lines) and `netatmoProxyPost` (92 lines) transport functions
- All 15 existing JSON wrappers now call `haGet`/`haPost` with `/api/v1/netatmo/` prefix
- New `getProxyRoomMeasure(params)` wrapper added for `getroommeasure` endpoint
- Binary endpoint `getProxyCameraEventSnapshot` updated to use `HA_API_URL`/`HA_API_KEY`
- Net change: -181 lines (269 insertions, 450 deletions)

**Environment variables:**
- `.env.local`: NETATMO_PROXY_URL/NETATMO_PROXY_API_KEY replaced with HA_API_URL/HA_API_KEY
- `.env.example`: Placeholder section updated from Netatmo-specific to shared HA proxy

## Deviations from Plan

None — plan executed exactly as written.

## Decisions Made

1. **getProxyRoomMeasure added as new export**: Plan specified this was needed because one route currently imports `netatmoProxyGet` directly. The new wrapper consolidates this into the standard pattern.

2. **.env.local not committed**: `.env.local` is gitignored (correct for secrets). Only `.env.example` was committed. The actual HA_API_URL/HA_API_KEY values are in `.env.local` locally as required.

3. **Binary endpoint kept as raw fetch**: `getProxyCameraEventSnapshot` streams a JPEG binary response. `haGet`/`haPost` parse JSON, so the binary endpoint must remain as a raw `fetch` call. Updated to use `HA_API_URL`/`HA_API_KEY` env vars and `/api/v1/netatmo/` prefix.

## Verification

- `grep -c 'NETATMO_PROXY' lib/netatmoProxy.ts` → 0
- `grep -c 'haGet\|haPost' lib/netatmoProxy.ts` → 20
- `grep -c '/api/v1/netatmo/' lib/netatmoProxy.ts` → 34
- `grep 'HA_API_URL' .env.local` → `HA_API_URL=https://pdupun8zpr7exw43.myfritz.net`
- All 17 convenience wrappers exported from netatmoProxy.ts

## Self-Check: PASSED

Files verified:
- FOUND: lib/netatmoProxy.ts (contains haGet/haPost, no NETATMO_PROXY vars)
- FOUND: .env.example (contains HA_API_URL placeholder)
- FOUND: afacc4d (feat commit)
- FOUND: a27e922 (chore commit)
