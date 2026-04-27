---
phase: 156-path-migration-common-endpoints
verified: 2026-04-07T09:27:26Z
status: passed
score: 9/9 must-haves verified
re_verification: false
---

# Phase 156: Path Migration & Common Endpoints Verification Report

**Phase Goal:** All thermorossi routes use the canonical /api/v1/thermorossi/* path and cross-provider aggregate endpoints exist
**Verified:** 2026-04-07T09:27:26Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | GET /api/v1/thermorossi/status returns stove telemetry (200) | VERIFIED | `app/api/v1/thermorossi/status/route.ts` exports GET, imports `getStatus` from thermorossiProxy, returns `success(data)` |
| 2 | POST /api/v1/thermorossi/commands/ignit returns 202 Accepted | VERIFIED | `app/api/v1/thermorossi/commands/ignit/route.ts` exports POST via `withIdempotency`, calls `sendIgnit()`, returns `success(data, null, HTTP_STATUS.ACCEPTED)` |
| 3 | GET /health returns providers object with 8 provider keys | VERIFIED | `app/health/route.ts` uses `Promise.allSettled` over all 8 providers; builds `providers` object with keys: thermorossi, netatmo, hue, sonos, dirigera, tuya, raspi, fritzbox (authenticated via withAuthAndErrorHandler; see note in REQUIREMENTS.md COMMON-01 -- OnlineStatusContext uses unauthenticated /api/health not /health) |
| 4 | GET /api/v1/devices returns items array with provider_type field | VERIFIED | `app/api/v1/devices/route.ts` calls `fritzboxClient.getDevices()`, maps to items with `provider_type: 'fritzbox'`, returns paginated envelope |
| 5 | Old /api/stove/* directories no longer exist on disk | VERIFIED | `test -d app/api/stove` returns false; directory confirmed deleted |
| 6 | No frontend file references /api/stove/ (excluding lib/version.ts changelog) | VERIFIED | Full codebase grep returns 0 matches across all .ts/.tsx files (excluding node_modules, .next, lib/version.ts) |
| 7 | Service worker caches and fetches from /api/v1/thermorossi/status | VERIFIED | `grep -c '/api/v1/thermorossi/status' app/sw.ts` = 2; `grep -c '/api/stove/' app/sw.ts` = 0 |
| 8 | Debug panels show canonical /api/v1/thermorossi/* URLs | VERIFIED | Both `app/debug/api/components/tabs/StoveTab.tsx` and `app/debug/components/tabs/StoveTab.tsx` contain 45 references each to `/api/v1/thermorossi/`, zero to `/api/stove/` |
| 9 | All stove-related tests pass with new URL paths | VERIFIED | All 4 test files have zero `/api/stove/` references; canonical paths confirmed; commits 0587a1e0 and 2498a8f8 verified in git log |

**Score:** 9/9 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/api/v1/thermorossi/status/route.ts` | Stove status GET endpoint | VERIFIED | Exists, exports GET, imports `getStatus`, has `force-dynamic` |
| `app/api/v1/thermorossi/health/route.ts` | Stove health GET endpoint | VERIFIED | Exists, exports GET, has `force-dynamic` |
| `app/api/v1/thermorossi/power/route.ts` | Stove power GET endpoint | VERIFIED | Exists, exports GET, has `force-dynamic` |
| `app/api/v1/thermorossi/fan-level/route.ts` | Stove fan-level GET endpoint | VERIFIED | Exists, exports GET, has `force-dynamic` |
| `app/api/v1/thermorossi/history/route.ts` | Stove history GET endpoint | VERIFIED | Exists, exports GET, has `force-dynamic` |
| `app/api/v1/thermorossi/commands/ignit/route.ts` | Stove ignit POST endpoint | VERIFIED | Exists (no trailing `e`), exports POST, imports `sendIgnit`, returns 202 |
| `app/api/v1/thermorossi/commands/shutdown/route.ts` | Stove shutdown POST endpoint | VERIFIED | Exists, exports POST, has `force-dynamic` |
| `app/api/v1/thermorossi/settings/power/route.ts` | Stove set-power POST endpoint | VERIFIED | Exists, exports POST, has `force-dynamic` |
| `app/api/v1/thermorossi/settings/fan-level/route.ts` | Stove set-fan POST endpoint | VERIFIED | Exists, exports POST, has `force-dynamic` |
| `app/api/v1/thermorossi/settings/temperature/water/route.ts` | Stove set-water-temp POST endpoint | VERIFIED | Exists, exports POST, has `force-dynamic` |
| `app/health/route.ts` | Aggregated health endpoint (authenticated) | VERIFIED | Exists, uses `withAuthAndErrorHandler`, `Promise.allSettled` over 8 providers, returns ok/degraded/down |
| `app/api/v1/devices/route.ts` | Aggregated devices endpoint (authenticated) | VERIFIED | Exists, uses `withAuthAndErrorHandler`, maps fritzbox devices with `provider_type` field |
| `lib/commands/deviceCommands.tsx` | Command palette stove actions with correct API paths | VERIFIED | 10 occurrences of `/api/v1/thermorossi/`, zero of `/api/stove/`; uses `{ value: }` body key (not `{ level: }`) |
| `app/sw.ts` | Service worker with updated stove status path | VERIFIED | Exactly 2 occurrences of `/api/v1/thermorossi/status`, zero of `/api/stove/` |
| `lib/routes.ts` | STOVE_ROUTES constants pointing to canonical paths | VERIFIED | All 7 STOVE_ROUTES values use `${API_BASE}/v1/thermorossi/*` paths |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `app/api/v1/thermorossi/status/route.ts` | `lib/stove/thermorossiProxy.ts` | `import { getStatus }` | WIRED | Line 2: `import { getStatus } from '@/lib/stove/thermorossiProxy'`; called on line 12 |
| `app/api/v1/thermorossi/commands/ignit/route.ts` | `lib/stove/thermorossiProxy.ts` | `import { sendIgnit }` | WIRED | Line 2: imports `sendIgnit`; called on line 17 |
| `app/health/route.ts` | all 8 provider proxy modules | `Promise.allSettled` fan-out | WIRED | Lines 26-33 import all 8 health functions; lines 51-60 spread into `Promise.allSettled([...])` |
| `app/api/v1/devices/route.ts` | `lib/fritzbox/fritzboxClient.ts` | `fritzboxClient.getDevices()` | WIRED | Line 21 imports `fritzboxClient`; line 30 calls `.getDevices()`; result mapped to items |
| `lib/commands/deviceCommands.tsx` | `/api/v1/thermorossi/*` | `fetch()` calls | WIRED | 10 canonical URL references; `executeStoveAction` accepts full path + method |
| `app/sw.ts` | `/api/v1/thermorossi/status` | pathname match and fetch | WIRED | 2 occurrences confirmed: pathname check and fetch call |
| `app/components/devices/stove/hooks/useStoveData.ts` | `lib/routes.ts` STOVE_ROUTES | `import { STOVE_ROUTES }` | WIRED | Line 18 imports STOVE_ROUTES; line 243 uses `STOVE_ROUTES.status` in fetch |
| `app/components/devices/stove/hooks/useStoveCommands.ts` | `lib/routes.ts` STOVE_ROUTES | `import { STOVE_ROUTES }` | WIRED | Line 23 imports; STOVE_ROUTES.ignite/.shutdown/.setFan/.setPower used in execute calls |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `app/api/v1/thermorossi/status/route.ts` | `data` | `getStatus()` from thermorossiProxy | Yes — HA proxy call, not hardcoded | FLOWING |
| `app/health/route.ts` | `providers` object | `Promise.allSettled` over 8 real proxy health functions | Yes — real network calls, fulfilled/rejected status drives ok/down | FLOWING |
| `app/api/v1/devices/route.ts` | `items` array | `fritzboxClient.getDevices()` | Yes — real Fritz!Box client call, not static | FLOWING |

---

### Behavioral Spot-Checks

Step 7b: SKIPPED — no runnable server available without `npm run dev`; all checks require live HTTP. Wiring verified statically at all 4 levels.

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| PATH-01 | 156-01 | Tutte le route thermorossi migrate da /api/stove/* a /api/v1/thermorossi/* | SATISFIED | 10 route files exist at canonical paths; `app/api/stove/` deleted; all 10 import from thermorossiProxy |
| PATH-02 | 156-02 | Frontend (hooks, componenti, debug panels) aggiornato ai nuovi path thermorossi | SATISFIED | Zero `/api/stove/` refs in any .ts/.tsx (excl. version.ts); STOVE_ROUTES updated; sw.ts updated; debug panels updated |
| COMMON-01 | 156-01 | GET /health ritorna stato aggregato di tutti i provider | SATISFIED | `app/health/route.ts` implements 8-provider fan-out returning `{ status, providers }` (aggregator authenticated per CR-003 for topology-leak prevention; canonical unauthenticated probe is /api/health -- see REQUIREMENTS.md note) |
| COMMON-02 | 156-01 | GET /api/v1/devices ritorna lista aggregata dispositivi cross-provider | SATISFIED | `app/api/v1/devices/route.ts` implements authenticated fritzbox device list with `provider_type` discriminator |

No orphaned requirements — all 4 requirements declared in REQUIREMENTS.md for Phase 156 are covered by plan declarations and verified in the codebase.

---

### Anti-Patterns Found

No anti-patterns found. Scanned:
- All 10 thermorossi route files: no TODO/FIXME, no placeholder returns, no empty handlers
- `app/health/route.ts`: real Promise.allSettled, no static returns
- `app/api/v1/devices/route.ts`: real fritzboxClient.getDevices(), no empty array returns
- `lib/commands/deviceCommands.tsx`: correct body keys `{ value: }` (not `{ level: }`), no stub methods

---

### Human Verification Required

None — all truths are statically verifiable and confirmed.

---

### Gaps Summary

No gaps. All 9 observable truths pass, all 15 artifacts are present and substantive, all key links are wired, and all 4 requirements are satisfied. The one deviation from Plan 02 (auto-fix of `lib/routes.ts` STOVE_ROUTES constants) was correctly applied — without this fix, hooks would still reference old paths at runtime, so the fix was necessary and correct.

---

_Verified: 2026-04-07T09:27:26Z_
_Verifier: Claude (gsd-verifier)_
