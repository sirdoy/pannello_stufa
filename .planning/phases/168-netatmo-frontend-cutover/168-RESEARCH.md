# Phase 168: Netatmo Frontend Cutover - Research

**Researched:** 2026-04-20
**Domain:** Next.js frontend URL cutover (legacy `/api/netatmo/*` → canonical `/api/v1/netatmo/**`)
**Confidence:** HIGH (codebase-verified) — but the CONTEXT.md scope is materially INCOMPLETE (see "CONTEXT Scope Corrections")

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Phase 161 already shipped every v1 route the frontend needs — 21 v1 route handlers under `app/api/v1/netatmo/`. No v1 wrapper creation work in this phase. [VERIFIED: `find app/api/v1/netatmo -name route.ts` returns 21 files]
- **D-02:** `/api/netatmo/*` flat endpoints map 1:1 via prefix swap (health, homesdata, homestatus, valves, setroomthermpoint, setthermmode, switchhomeschedule, synchomeschedule, createnewhomeschedule, getroommeasure, camera/status, camera/events, camera/events/[eventId]/snapshot).
- **D-03:** Path-shape changes for camera (legacy flat → v1 `[cameraId]`):
  - `/api/netatmo/camera/snapshot?cameraId=X` → `/api/v1/netatmo/camera/{cameraId}/snapshot`
  - `/api/netatmo/camera/stream?cameraId=X` → `/api/v1/netatmo/camera/{cameraId}/stream`
  - `/api/netatmo/camera/monitoring` (body had `camera_id`) → `/api/v1/netatmo/camera/{cameraId}/monitoring` (body drops it)
- **D-04:** Superseded/alias mappings:
  - `/api/netatmo/calibrate` → `/api/v1/netatmo/valves/calibrate` (semantic equivalent)
  - `/api/netatmo/schedules` → DROP (schedules embedded in `homesdata.body.homes[0].schedules`)
- **D-05:** `app/registry/devices/page.tsx` — swap `fetch('/api/netatmo/homesdata')` → `/api/v1/netatmo/homesdata`. Single call site.
- **D-06:** `app/components/devices/camera/CameraCard.tsx` JSDoc line 270 — update comment only (CONTEXT assertion). **NOTE: RESEARCH FINDS THIS INCOMPLETE — the same file has 5 runtime consumers of `CAMERA_ROUTES.*`.**
- **D-07:** `app/sw.ts` line 622 — remove dead `/api/netatmo/status` branch entirely.
- **D-08:** `app/thermostat/page.test.tsx` — replace 4 hyphenated mock URLs to match real v1 endpoints.
- **D-09:** Both debug NetatmoTab files migrate to v1 in this phase (42 refs each).
- **D-10:** Drop `schedules`, `camera/snapshot`, `camera/stream`, `camera/monitoring` tiles from debug panels; keep `camera/status` and `camera/events`; rewrite `calibrate` tile to `valves/calibrate`.
- **D-11:** `app/thermostat/page.test.tsx` is the only production test file that references legacy URLs. **NOTE: RESEARCH FINDS THIS INCOMPLETE — `__tests__/components/devices/thermostat/ThermostatCard.schedule.test.tsx` lines 211-217 also reference `/api/netatmo/` strings.**
- **D-12:** Delete entire `app/api/netatmo/` directory tree after frontend cutover verified. ≈18 route.ts files.
- **D-13:** No Firebase command logging work (Netatmo v1 routes already follow Phase 161 pattern).
- **D-14:** V1 routes wrap `lib/netatmo/netatmoProxy.ts` — response shapes identical to frontend expectations (CONTEXT assertion). **NOTE: RESEARCH FINDS THIS FALSE — `homesdata`, `homestatus`, and write-route response shapes DIVERGE between legacy and v1.**
- **D-15:** Three-plan wave structure (debug panels → production consumers → delete + grep + smoke).
- **D-16:** Single-wave alternative rejected.

### Claude's Discretion
- Whether to collapse the two debug NetatmoTab files into one shared component during cutover. Recommended: leave separate; collapse in a future dedupe phase.
- Exact wording of `app/sw.ts` cleanup comment.
- Whether to add Playwright `@smoke` tag grep target (out of scope).
- Order of sub-steps within each plan.

### Deferred Ideas (OUT OF SCOPE)
- Dedupe `app/debug/api/components/tabs/NetatmoTab.tsx` and `app/debug/components/tabs/NetatmoTab.tsx`.
- Add `cameraId` selector to debug panel to restore `/api/v1/netatmo/camera/[cameraId]/{snapshot,stream,monitoring}` coverage.
- Add Playwright `@smoke` tag system.
- Recreate a v1 `schedules` endpoint.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| NETA-01 | `GET /api/v1/netatmo/getthermstate` ritorna stato termostato | v1 route exists at `app/api/v1/netatmo/getthermstate/route.ts`. **No current frontend consumer** — backend route is orphan; closing this requirement means verifying the route is reachable via cutover side-effects (grep sweep). [VERIFIED: grep of `getthermstate` returns only route file + docs] |
| NETA-02 | `POST /api/v1/netatmo/valves/calibrate` calibra tutte le valvole | v1 route exists. Frontend consumers: `ThermostatCard.tsx:246` (via `NETATMO_ROUTES.calibrate` → `/api/netatmo/calibrate`) + debug `calibrate` tile. Cutover rewrites both to `/api/v1/netatmo/valves/calibrate`. |
| NETA-03 | `POST /api/v1/netatmo/valves/{module_id}/calibrate` calibra singola valvola | v1 route exists at `app/api/v1/netatmo/valves/[moduleId]/calibrate/route.ts`. **No current frontend consumer.** Orphan — requirement satisfied by route existence + grep sweep. |
| NETA-04 | `GET /api/v1/netatmo/camera/events/{event_id}/snapshot` | v1 route exists (binary JPEG passthrough). Frontend consumer: `EventPreviewModal.tsx:27` via `CAMERA_ROUTES.eventSnapshot(event.event_id)`. Cutover updates `CAMERA_ROUTES.eventSnapshot`. |
| NETA-05 | `GET /api/v1/netatmo/camera/{camera_id}/stream` | v1 route exists. Consumers: `CameraCard.tsx:62` + `CameraDashboard.tsx:109` via `CAMERA_ROUTES.stream(cameraId)`. Cutover updates `CAMERA_ROUTES.stream` helper. |
| NETA-06 | `GET /api/v1/netatmo/camera/{camera_id}/snapshot` | v1 route exists (returns JSON `{ snapshot_url }`). **RESPONSE SHAPE DIVERGES from legacy (302 redirect).** Consumers: `CameraCard.tsx:46,90` + `CameraDashboard.tsx:87` use `CAMERA_ROUTES.snapshot(id)` as `<img src>`. Simple URL swap WILL BREAK rendering — requires fetch + render of `snapshot_url` instead. See "Response-Shape Parity". |
| NETA-07 | `POST /api/v1/netatmo/camera/{camera_id}/monitoring` | v1 route exists (cameraId in path, not body). Consumers: `CameraCard.tsx:111` + `CameraDashboard.tsx:155` via `CAMERA_ROUTES.monitoring` + body `{ camera_id, monitoring }`. Cutover requires URL construction change (path segment) and body change (remove `camera_id`). |
| NETA-08 | `POST /api/v1/netatmo/renamehome` | v1 route exists. **No current frontend consumer.** Orphan — requirement satisfied by route existence + grep sweep. |
| NETA-09 | `GET /api/v1/netatmo/gethomedata` | v1 route exists. **No current frontend consumer.** Orphan — requirement satisfied by route existence + grep sweep. |
</phase_requirements>

---

## Summary

Phase 168 is a URL-cutover phase, but the CONTEXT.md scope understates the touch surface by roughly 10x. CONTEXT identifies 4 production-code files + 2 debug panels; the real production surface is **16 files** importing `NETATMO_ROUTES`/`CAMERA_ROUTES` from `lib/routes.ts`, plus `lib/commands/deviceCommands.tsx` (command palette), plus 2 debug panels (42 refs each), plus 1 test file CONTEXT missed. The hook `useThermostatData` does NOT consume v1 — it consumes legacy via `NETATMO_ROUTES.homesData`/`homeStatus` (CONTEXT D-14 is wrong).

The root cause of the underestimate is that CONTEXT grepped for literal `/api/netatmo/` string matches but missed consumers that use the `NETATMO_ROUTES` / `CAMERA_ROUTES` constant indirection. Updating `lib/routes.ts` values alone would flip all 16 consumers at once, but doing so naively will break runtime behavior because of two orthogonal issues surfaced below.

**Two response-shape divergences block a pure URL-swap migration:**

1. **`homesdata`:** legacy returns `success({ home_id, home_name, rooms, modules, schedules })` (flattened from `homesResponse.body.homes[0]`) + side-effects (Firebase topology write). V1 returns the raw proxy response `{ body: { homes, user }, status, time_exec, time_server }`. `useThermostatData.checkConnection()` reads `data.home_id` and `data.reconnect` — neither exists on the v1 shape. The hook would report `connected=false` forever after cutover and skip saving topology to Firebase, breaking `homestatus` enrichment downstream. [VERIFIED: reading both route handlers]

2. **`camera/snapshot`:** legacy returns a **302 redirect** to the Netatmo CDN JPEG URL, enabling `<img src={CAMERA_ROUTES.snapshot(id)}>` to render the image directly. V1 returns JSON `{ camera_id, snapshot_url }`, which rendered as `<img src>` would display broken. `CameraCard.tsx:46,90` and `CameraDashboard.tsx:87` rely on the redirect behavior. Either keep a 302-emitting legacy-compat v1 route, add a client-side fetch-then-assign pattern, or (simpler) rewrite the v1 snapshot route to redirect (matching the legacy behavior that the existing `<img>` consumers depend on).

**Three secondary shape divergences** (more mechanical but still observable):

3. **`homestatus`:** legacy returns `{ rooms: EnrichedRoom[], modules, lowBatteryModules, hasLowBattery, hasCriticalBattery, updated_at, data_freshness }` with topology-enriched fields (`room_type` from Firebase, `stoveSync` flags). V1 returns the raw proxy response `{ rooms: NetatmoRoomMeasurement[], data_freshness }`. Any consumer reading `room_type`, `heating`, `lowBatteryModules`, or `stoveSync` breaks.

4. **`camera/monitoring`:** legacy body is `{ camera_id, monitoring }`, route URL is `/api/netatmo/camera/monitoring`. V1 body is `{ monitoring }`, cameraId lives in path `/api/v1/netatmo/camera/{cameraId}/monitoring`. The `CAMERA_ROUTES.monitoring` constant is a plain string; need to switch to a function `monitoring(cameraId: string)` and strip `camera_id` from POST bodies at the 2 call sites.

5. **Write routes (`setroomthermpoint`, `setthermmode`, `switchhomeschedule`, `valves/calibrate`):** legacy returns 200 with `{ success: true, ... }`. V1 returns **202 Accepted** with `{ ..., suggested_poll_delay_s: 1 }`. Consumers read `response.ok` (still true for 202) and `data.error`/`data.message` (absent in v1 success) — functionally equivalent. Low risk.

**Primary recommendation:** Do NOT execute CONTEXT's 3-plan structure as specified — it will produce silent breakage. Either (a) revisit with the user to add a Plan 0 that harmonizes the response shapes (wrap v1 routes to match legacy enriched output, OR rewrite consumers to unwrap v1), or (b) rewrite `lib/routes.ts` to point at v1 paths AND simultaneously rewrite the 6 consumers that read CamelCase enrichment fields (homesdata topology, homestatus enrichment, camera snapshot redirect, camera monitoring body+URL). Plan 02 of the current structure is the correct home for the consumer rewrites; Plan 03 deletion must block on Plan 02 completing.

---

## Project Constraints (from CLAUDE.md)

- **NEVER run `npm run build` or `npm install`** — execution limited to `npm run dev` and `npm test`. [VERIFIED: `./CLAUDE.md`]
- **NEVER commit/push without explicit user request.** [VERIFIED]
- **PREFER editing existing files over creating new** — this phase should avoid any new files beyond the mandatory test updates. [VERIFIED]
- **ALWAYS create/update unit tests** — each file modified in this phase must have its tests updated in lockstep. [VERIFIED]
- **Firebase pattern:** `filterUndefined()` for RTDB writes — inapplicable here (no new Firebase writes). [VERIFIED]
- **Use design system components** — inapplicable here (no UI rendering changes). [VERIFIED]
- **Client directive:** All touched hooks/components already have `'use client'`. No change needed. [VERIFIED]

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| V1 route wrappers (auth, path/body extraction, proxy delegation) | Frontend Server (Next.js App Router route handlers) | — | `withAuthAndErrorHandler` gates access server-side [VERIFIED: existing v1 routes] |
| HA proxy communication | API / Backend (HA proxy over HA_API_KEY) | Frontend Server (via `netatmoProxy.ts`) | Netatmo Cloud calls and SQLite cache live in the HA proxy, not in Next.js [VERIFIED: `lib/netatmo/netatmoProxy.ts`] |
| URL construction (centralized) | Shared constants module | Frontend (consumers import) | `lib/routes.ts` exports `NETATMO_ROUTES` and `CAMERA_ROUTES` for all frontend callers [VERIFIED: 16 importers] |
| Fetch URL + response unwrapping | Browser / Client (React hooks, components, pages) | — | Hooks + components run with `'use client'` [VERIFIED] |
| Legacy-tree deletion | Frontend Server (App Router dir rm) | — | `rm -rf app/api/netatmo/` after cutover |
| Debug panel tiles (URL copy + fetch) | Browser / Client (React components) | — | `NetatmoTab.tsx` is a dashboard tab |
| Service worker cache rules | Browser / Service Worker | — | `app/sw.ts` is compiled to `public/sw.js` |

**Tier-correctness sanity check:** No tier migration; only URL strings + response-shape adapters change.

---

## Standard Stack

### Core (all pre-existing, no new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 15.5 | `/api/v1/netatmo/**` route handlers | Project framework [VERIFIED: `./CLAUDE.md` header] |
| `lib/core` | in-repo | `withAuthAndErrorHandler`, `success`, `parseJson`, `getPathParam`, `HTTP_STATUS` | Every v1 route uses this [VERIFIED: 21 v1 Netatmo routes] |
| `lib/netatmo/netatmoProxy.ts` | in-repo | Complete proxy layer (homesdata, homestatus, valves, camera, setRoomThermpoint, etc.) | Phase 161 output; no changes needed [VERIFIED: grep of proxy imports] |
| `types/netatmoProxy.ts` | in-repo | DTOs for request/response | Fully typed [VERIFIED: imports in v1 routes] |
| Jest 30.x + `@testing-library/react` | installed | Unit tests for hook + page changes | Existing pattern [VERIFIED: existing test files] |

### Version verification

Not applicable — no new package dependencies. **Do NOT run `npm install` or `npm run build`** per CLAUDE.md.

### Alternatives Considered

| Instead of | Could Use | Tradeoff — why rejected |
|------------|-----------|-------------------------|
| Mechanical URL swap (CONTEXT plan) | Shape-aware consumer rewrite | CONTEXT rejected; reality demands consumer rewrite for `homesdata`, `homestatus`, `camera/snapshot`, `camera/monitoring`. See Response-Shape Parity. |
| Modify v1 routes to match legacy enriched shape | Rewrite consumers to unwrap raw proxy shape | Prefer route-wrapper change over consumer change — it's one location vs 5, and keeps the "v1 = thin proxy" invariant intact only if we accept that consumers must change. Recommend the wrapper approach for `homesdata` specifically (preserves Firebase side-effect); accept consumer change for `homestatus` (simpler). |
| Next.js `rewrites()` in `next.config` | Explicit v1 routes | Rejected because response shapes differ — a rewrite would mask the shape divergence, not fix it. |
| Keep legacy route tree (no deletion) | Delete it | Required by CONTEXT D-12 and success criterion "Zero `/api/netatmo/` references in production". |

**Installation:** None.

---

## CONTEXT Scope Corrections

This section enumerates every divergence between the CONTEXT.md scope and the actual codebase state, so the planner can size plans correctly. **Each correction is codebase-verified.**

| # | CONTEXT Claim | Reality | Impact |
|---|---------------|---------|--------|
| C-1 | "`useThermostatData` already consumes `/api/v1/netatmo/*` — no rewrite needed" | `useThermostatData.ts:107,173` imports `NETATMO_ROUTES` and fetches `.homesData` / `.homeStatus`, which are legacy `/api/netatmo/homesdata` / `/homestatus`. | Hook requires rewrite OR `NETATMO_ROUTES` values need swap; either way, a shape change is needed because the hook reads `data.home_id` and `data.reconnect`. |
| C-2 | "No `lib/routes.ts` entry for Netatmo (Netatmo always used direct `/api/netatmo/*` strings)" | `lib/routes.ts:62` exports `NETATMO_ROUTES` (7 keys) + `CAMERA_ROUTES` (6 keys). 16 files import these. | `lib/routes.ts` MUST be included in the cutover. Either swap URL values (bulk flip) or update all 16 consumer files. Planner must pick one. |
| C-3 | "No command-palette integration for Netatmo commands" | `lib/commands/deviceCommands.tsx:70` has `executeThermostatAction(endpoint, body)` that fetches `/api/netatmo/${endpoint}` — called 3 times with `'set-therm-mode'` (lines 228, 234, 240). | Command palette must be rewritten to `/api/v1/netatmo/${endpoint}` OR `executeThermostatAction` inlined. Missed touchpoint. |
| C-4 | "`app/thermostat/page.test.tsx` is the only production test that references legacy URLs" | `__tests__/components/devices/thermostat/ThermostatCard.schedule.test.tsx:211-217` also has `/api/netatmo/` string assertions. | Second test file requires updates (or the assertion logic must accept v1). |
| C-5 | "V1 routes already follow whatever logging pattern Phase 161 established. No new logging work." | True for write routes. But the **side-effect disparity** (legacy `homesdata` saves `home_id` + `topology` to Firebase; v1 does not) affects Firebase cache state. | Must be called out explicitly — dropping the legacy route without porting the Firebase-write side-effect will break `homestatus` consumers that read `topology` from Firebase. |
| C-6 | "Response shapes identical to what frontend already expects" | FALSE for `homesdata`, `homestatus`, `camera/snapshot`, `camera/monitoring`. See Response-Shape Parity. | 5 consumer-side changes required. |
| C-7 | "`app/components/devices/camera/CameraCard.tsx` — 1 JSDoc comment mentioning `/api/netatmo/camera/snapshot` (no active fetch)" | The file has 5 runtime references to `CAMERA_ROUTES.*` (lines 46, 62, 90, 111, plus the JSDoc on 270). | CameraCard requires active runtime changes, not just a comment edit. |
| C-8 | "42 refs each [in debug panels]" | VERIFIED ACCURATE — grep confirms 42 hits in both files, identical content lines 54-243. |  |
| C-9 | "≈18 route.ts files [legacy tree]" | VERIFIED ACCURATE — `find app/api/netatmo -name route.ts` returns exactly 18 (excluding `__tests__/` subdirs). |  |

**Total correction impact:** CONTEXT identifies 4 production-code files + 2 debug panels + 1 test file (≈7 target files). Reality is **19 files** (4 CONTEXT + 2 debug + 1 test CONTEXT + 12 additional production/test consumers). Plan 02 must be sized for the larger surface, or the phase must be re-discussed before planning.

---

## Grep Inventory (per target file, with line numbers)

All strings are exact as they appear in the file. Line numbers verified 2026-04-20.

### Group A — Files CONTEXT.md Listed

#### A1. `app/registry/devices/page.tsx` (1 occurrence)
| Line | Exact String | After |
|------|--------------|-------|
| 155 | `` `const res = await fetch('/api/netatmo/homesdata');` `` | `` `fetch('/api/v1/netatmo/homesdata')` `` + possible response-shape unwrap (reads `.homes[0]` vs `.rooms` directly — verify at implementation time) |

#### A2. `app/components/devices/camera/CameraCard.tsx` (6 occurrences — CONTEXT said 1!)
| Line | Exact String | After |
|------|--------------|-------|
| 6 | `import { CAMERA_ROUTES } from '@/lib/routes';` | unchanged (if routes.ts swapped) |
| 46 | `setSnapshotUrl(CAMERA_ROUTES.snapshot(selectedCameraId));` | runtime: fetch v1, read `snapshot_url`, setState — OR (preferred) v1 route emits 302 to match legacy |
| 62 | `const response = await fetch(CAMERA_ROUTES.stream(cameraId));` | unchanged if `CAMERA_ROUTES.stream` helper returns v1 path |
| 90 | `setSnapshotUrl(CAMERA_ROUTES.snapshot(selectedCameraId) + `` `&t=${Date.now()}`);`` | cache-bust pattern relies on `?cameraId=X&t=Y` query shape — v1 is path-only; cache-bust needs `?t=` |
| 111 | `const res = await fetch(CAMERA_ROUTES.monitoring, { method: 'POST', ... body: { camera_id, monitoring } })` | URL: `CAMERA_ROUTES.monitoring(cameraId)` helper + body drops `camera_id` |
| 270 | JSDoc: `// Snapshot mode — URL points to /api/netatmo/camera/snapshot which redirects to Netatmo CDN` | comment update |

#### A3. `app/sw.ts` (1 occurrence)
| Line | Exact String | After |
|------|--------------|-------|
| 622 | `if (url.pathname === '/api/netatmo/status' && event.request.method === 'GET') {` | **DELETE** entire branch (lines 621-641). Route has never existed. |

#### A4. `app/thermostat/page.test.tsx` (6 occurrences — CONTEXT said 4)
| Line | Exact String | After |
|------|--------------|-------|
| 21 | `homesData: '/api/netatmo/homes-data',` | `homesData: '/api/v1/netatmo/homesdata',` (drop hyphen) |
| 22 | `homeStatus: '/api/netatmo/home-status',` | `homeStatus: '/api/v1/netatmo/homestatus',` |
| 23 | `setThermMode: '/api/netatmo/set-therm-mode',` | `setThermMode: '/api/v1/netatmo/setthermmode',` |
| 146 | `` `expect(global.fetch).toHaveBeenCalledWith('/api/netatmo/homes-data');` `` | `` `/api/v1/netatmo/homesdata` `` |
| 180-184 | Mock response body for homesdata returns `{ home_id: '123', home_name: 'Test Home', rooms: [], modules: [] }` | If shape unwrap is chosen, update mock to v1 shape `{ body: { homes: [{ id: '123', name: 'Test Home', rooms: [], modules: [] }] } }` |
| 189 | Mock response body for homestatus returns `{ mode: 'schedule', rooms: [], modules: [] }` | If shape unwrap chosen, update to v1 shape `{ rooms: [], data_freshness: 'LIVE' }` — note v1 has NO `mode` or `modules` keys |

#### A5. `app/debug/api/components/tabs/NetatmoTab.tsx` (42 occurrences)
| Lines | Pattern Group | After |
|-------|---------------|-------|
| 54 | `fetchGetEndpoint('health', '/api/netatmo/health');` | `/api/v1/netatmo/health` |
| 55 | `fetchGetEndpoint('homesdata', '/api/netatmo/homesdata');` | `/api/v1/netatmo/homesdata` |
| 56 | `fetchGetEndpoint('homestatus', '/api/netatmo/homestatus');` | `/api/v1/netatmo/homestatus` |
| 57 | `fetchGetEndpoint('valves', '/api/netatmo/valves');` | `/api/v1/netatmo/valves` |
| 58 | `fetchGetEndpoint('cameraStatus', '/api/netatmo/camera/status');` | `/api/v1/netatmo/camera/status` |
| 59 | `fetchGetEndpoint('schedules', '/api/netatmo/schedules');` | **DROP call** (per D-10) |
| 129, 133, 134, 135 | `/api/netatmo/health` tile (url, onRefresh, copy, copied) | `/api/v1/netatmo/health` (4 refs, lockstep) |
| 140, 144, 145, 146 | `/api/netatmo/homesdata` tile | `/api/v1/netatmo/homesdata` (4 refs) |
| 151, 155, 156, 157 | `/api/netatmo/homestatus` tile | `/api/v1/netatmo/homestatus` (4 refs) |
| 162, 166, 167, 168 | `/api/netatmo/valves` tile | `/api/v1/netatmo/valves` (4 refs) |
| 173, 177, 178, 179 | `/api/netatmo/camera/status` tile | `/api/v1/netatmo/camera/status` (4 refs) |
| 184, 188, 189, 190 | `/api/netatmo/schedules` tile (4 refs) | **DROP ENTIRE TILE** per D-04, D-10 |
| 203, 216, 217, 218 | `/api/netatmo/setthermmode` tile | `/api/v1/netatmo/setthermmode` (4 refs) |
| 223, 230, 231, 232 | `/api/netatmo/setroomthermpoint` tile | `/api/v1/netatmo/setroomthermpoint` (4 refs) |
| 237, 241, 242, 243 | `/api/netatmo/calibrate` tile | `/api/v1/netatmo/valves/calibrate` per D-04 (4 refs) |

Net new URL count after rewrite: `42 (initial) - 1 (dropped loader call) - 4 (dropped schedules tile) = 37 remaining references`.

#### A6. `app/debug/components/tabs/NetatmoTab.tsx` (42 occurrences — identical to A5)

Same line numbers and patterns as A5. The two files are near-duplicates (both files have 42 matches on identical line numbers 54-243 per grep output comparison). Apply the exact same edits in lockstep.

### Group B — Files CONTEXT.md MISSED (production code relying on `NETATMO_ROUTES` / `CAMERA_ROUTES`)

#### B1. `lib/routes.ts` (4 occurrences — the source of truth)

```
 61-75: NETATMO_ROUTES object
  62:   homesData:         `${API_BASE}/netatmo/homesdata`
  67:   homeStatus:        `${API_BASE}/netatmo/homestatus`
  68:   schedules:         `${API_BASE}/netatmo/schedules`       ← MUST DELETE KEY (per D-04)
  69:   switchHomeSchedule:`${API_BASE}/netatmo/switchhomeschedule`
  72:   setRoomThermpoint: `${API_BASE}/netatmo/setroomthermpoint`
  73:   setThermMode:      `${API_BASE}/netatmo/setthermmode`
  74:   calibrate:         `${API_BASE}/netatmo/calibrate`       ← renaming key value to `/api/v1/netatmo/valves/calibrate`
 78-87: CAMERA_ROUTES object
  79:   status:     `${API_BASE}/netatmo/camera/status`
  80:   allEvents:  `${API_BASE}/netatmo/camera/events`
  81:   monitoring: `${API_BASE}/netatmo/camera/monitoring`      ← SHAPE CHANGE: must become `monitoring: (id) => .../camera/${id}/monitoring`
  84:   stream:     (cameraId) => `${API_BASE}/netatmo/camera/stream?cameraId=${enc}`   ← URL-shape change to path segment
  85:   snapshot:   (cameraId) => `${API_BASE}/netatmo/camera/snapshot?cameraId=${enc}` ← URL-shape change + response-shape change
  86:   eventSnapshot:(eventId)=> `${API_BASE}/netatmo/camera/events/${enc}/snapshot`
```

#### B2. `lib/commands/deviceCommands.tsx` (1 occurrence — command palette)
| Line | String | After |
|------|--------|-------|
| 70 | `` `const response = await fetch(`/api/netatmo/${endpoint}`, { ... })` `` in `executeThermostatAction` | `` `` `/api/v1/netatmo/${endpoint}` ``. Callers at lines 228, 234, 240 pass `endpoint='set-therm-mode'` — note the hyphen; the real endpoint is `setthermmode`. The callers must also change `'set-therm-mode'` to `'setthermmode'`. |

#### B3. `app/thermostat/page.tsx` (2 occurrences)
| Line | String | After |
|------|--------|-------|
| 11 | `import { NETATMO_ROUTES } from '@/lib/routes';` | unchanged (if routes.ts values swapped) |
| 61 | `const response = await fetch(NETATMO_ROUTES.setThermMode, { method: 'POST', ... body: { home_id, mode } });` | URL unchanged (indirect); body unchanged; response-shape unchanged (write route) |

#### B4. `app/components/devices/thermostat/ThermostatCard.tsx` (5 occurrences)
| Line | Pattern | After |
|------|---------|-------|
| 6 | `import { NETATMO_ROUTES } from '@/lib/routes';` | unchanged |
| 188 | `netatmoModeCmd.execute(NETATMO_ROUTES.setThermMode, ...)` | unchanged via indirection |
| 213 | `netatmoTempCmd.execute(NETATMO_ROUTES.setRoomThermpoint, ...)` | unchanged via indirection |
| 246 | `netatmoCalibrateCmd.execute(NETATMO_ROUTES.calibrate, ...)` | URL target changes to `/api/v1/netatmo/valves/calibrate` via routes.ts rewrite (D-04) |
| 291 | `netatmoScheduleCmd.execute(NETATMO_ROUTES.switchHomeSchedule, ...)` | unchanged via indirection |

#### B5. `app/components/devices/thermostat/hooks/useThermostatData.ts` (3 occurrences) — **CRITICAL: CONTEXT D-14 WRONG**
| Line | Pattern | After |
|------|---------|-------|
| 10 | `import { NETATMO_ROUTES } from '@/lib/routes';` | unchanged |
| 107 | `const response = await fetch(NETATMO_ROUTES.homesData);` then reads `data.home_id`, `data.reconnect` | Either: (a) v1 `homesdata` route gets a legacy-compat wrapper that returns `{ home_id, home_name, rooms, modules, schedules }`; OR (b) hook rewrites to read v1 shape `data.body.homes[0].id`. See Response-Shape Parity. |
| 173 | `const response = await fetch(NETATMO_ROUTES.homeStatus);` then reads `data.reconnect` and passes entire `data` to `setStatus()` as `NetatmoStatus` | Either: (a) v1 `homestatus` adds enrichment wrapper matching legacy; OR (b) hook + `NetatmoStatus` type flattens to v1 shape. See Response-Shape Parity. |

#### B6. `app/components/netatmo/RoomCard.tsx` (4 occurrences — all write calls)
| Line | Pattern | After |
|------|---------|-------|
| 7 | `import { NETATMO_ROUTES } from '@/lib/routes';` | unchanged |
| 105, 136, 165 | `fetch(NETATMO_ROUTES.setRoomThermpoint, { method: 'POST', body: { home_id, room_id, mode, temp? } })` + reads `data.error` | URL unchanged via indirection; body unchanged; response: v1 returns 202 instead of 200, body has no `error` on success. `data.error` check still safe (undefined ≠ truthy). |

#### B7. `app/components/netatmo/PidAutomationPanel.tsx` (2 occurrences)
| Line | Pattern | After |
|------|---------|-------|
| 17 | `import { NETATMO_ROUTES } from '@/lib/routes';` | unchanged |
| 482 | `const roomsResponse = await fetch(NETATMO_ROUTES.homeStatus);` | Same shape problem as B5 — reads current status; verify what it reads from body |

#### B8. `app/thermostat/schedule/components/ActiveOverrideBadge.tsx` (2 occurrences)
| Line | Pattern | After |
|------|---------|-------|
| 4 | `import { NETATMO_ROUTES } from '@/lib/routes';` | unchanged |
| 56 | `fetch(NETATMO_ROUTES.setRoomThermpoint, { method: 'POST', body: { ... } })` | URL unchanged via indirection; 200→202 (transparent) |

#### B9. `app/thermostat/schedule/components/ScheduleSelector.tsx` (2 occurrences)
| Line | Pattern | After |
|------|---------|-------|
| 4 | `import { NETATMO_ROUTES } from '@/lib/routes';` | unchanged |
| 44 | `fetch(NETATMO_ROUTES.switchHomeSchedule, { method: 'POST', body: { home_id, schedule_id } })` | URL unchanged via indirection; 200→202 (transparent) |

#### B10. `app/thermostat/schedule/components/ManualOverrideSheet.tsx` (2 occurrences)
| Line | Pattern | After |
|------|---------|-------|
| 4 | `import { NETATMO_ROUTES } from '@/lib/routes';` | unchanged |
| 77 | `fetch(NETATMO_ROUTES.setRoomThermpoint, { method: 'POST', body: { ... } })` | URL unchanged via indirection; 200→202 (transparent) |

#### B11. `lib/hooks/useRoomStatus.ts` (2 occurrences) — SHAPE ISSUE
| Line | Pattern | After |
|------|---------|-------|
| 3 | `import { NETATMO_ROUTES } from '@/lib/routes';` | unchanged |
| 49 | `fetch(NETATMO_ROUTES.homeStatus)` then reads `data.rooms[].{room_id,room_name,temperature,setpoint,mode,heating,endtime}` | Same shape problem as B5. `room_name` exists on both; `setpoint`, `mode`, `heating`, `endtime` are legacy-enriched fields that v1 does NOT provide directly. |

#### B12. `lib/hooks/useScheduleData.ts` (2 occurrences) — SHAPE ISSUE + ENDPOINT DROP
| Line | Pattern | After |
|------|---------|-------|
| 4 | `import { NETATMO_ROUTES } from '@/lib/routes';` | unchanged |
| 74 | `fetch(NETATMO_ROUTES.schedules)` then reads `data.schedules`, `data.home_id`, `data._source` | **Endpoint being dropped (D-04).** Hook MUST be rewritten: fetch `/api/v1/netatmo/homesdata` and read `data.body.homes[0].schedules` + `data.body.homes[0].id`. This is a meaningful rewrite, not a URL swap. |

#### B13. `app/components/devices/camera/EventPreviewModal.tsx` (2 occurrences)
| Line | Pattern | After |
|------|---------|-------|
| 6 | `import { CAMERA_ROUTES } from '@/lib/routes';` | unchanged |
| 27 | `const previewUrl = event.snapshot_url ?? CAMERA_ROUTES.eventSnapshot(event.event_id);` | URL unchanged via indirection — both legacy and v1 return identical binary JPEG |

#### B14. `app/components/devices/camera/hooks/useCameraData.ts` (2 occurrences)
| Line | Pattern | After |
|------|---------|-------|
| 6 | `import { CAMERA_ROUTES } from '@/lib/routes';` | unchanged |
| 49 | `fetch(CAMERA_ROUTES.status)` reads `data.cameras`, `data.data_freshness`, `data.error` | URL unchanged via indirection; response shape IDENTICAL for `/camera/status` [VERIFIED] |

#### B15. `app/(pages)/camera/CameraDashboard.tsx` (6 occurrences)
| Line | Pattern | After |
|------|---------|-------|
| 5 | `import { CAMERA_ROUTES } from '@/lib/routes';` | unchanged |
| 60 | `fetch(CAMERA_ROUTES.status)` | URL unchanged via indirection; shape IDENTICAL |
| 61 | `fetch(CAMERA_ROUTES.allEvents)` | URL unchanged via indirection; shape IDENTICAL |
| 87 | `urls[camera.camera_id] = CAMERA_ROUTES.snapshot(camera.camera_id) + cacheParam;` (used as `<img src>`) | SAME SHAPE PROBLEM as CameraCard — relies on 302 redirect |
| 109 | `fetch(CAMERA_ROUTES.stream(cameraId))` + reads `.vpn_streams.high`, `.is_local`, `.local_streams.high` | URL shape change (query→path); response shape IDENTICAL |
| 155 | `fetch(CAMERA_ROUTES.monitoring, { method: 'POST', body: { camera_id, monitoring } })` | URL shape change + body shape change (drop `camera_id`) |

#### B16. `app/(pages)/camera/events/CameraEventsPage.tsx` (3 occurrences)
| Line | Pattern | After |
|------|---------|-------|
| 5 | `import { CAMERA_ROUTES } from '@/lib/routes';` | unchanged |
| 51 | `fetch(CAMERA_ROUTES.allEvents)` | URL unchanged via indirection; shape IDENTICAL |
| 52 | `fetch(CAMERA_ROUTES.status)` | URL unchanged via indirection; shape IDENTICAL |

### Group C — Tests CONTEXT.md MISSED

#### C1. `__tests__/components/devices/thermostat/ThermostatCard.schedule.test.tsx` (8 occurrences)
| Line | String | After |
|------|--------|-------|
| 211 | `` `expect(NETATMO_ROUTES.switchHomeSchedule).toBe('/api/netatmo/switchhomeschedule');` `` | `/api/v1/netatmo/switchhomeschedule` |
| 212 | `` `expect((NETATMO_ROUTES as any).schedules).toBe('/api/netatmo/schedules');` `` | **DELETE** — `schedules` key is being removed |
| 217 | `` `return urlStr.includes('/api/netatmo/schedules') && ...;` `` | **DELETE** assertion or update to match v1 path; since `schedules` endpoint is dropped entirely, remove the whole `schedulePostCall` guard |

### Group D — Comment-Only References (Out of Scope, documentation)

These are informational references in comments/logs that do NOT require updates for cutover but should be noted:

| File | Line | Context |
|------|------|---------|
| `lib/version.ts` | 1508 | Changelog text mentioning `/api/netatmo/callback` — historical record; leave alone |
| `lib/netatmo/netatmoCameraApi.ts` | 6 | JSDoc says `See: app/api/netatmo/camera/` — should update to `/api/v1/netatmo/camera/` at the same time as CameraCard JSDoc (D-06) for consistency |

---

## Response-Shape Parity (legacy vs v1 per endpoint)

Every endpoint the frontend consumes, with the exact shape divergence and consumer impact.

### Write endpoints (minor, transparent)

| Endpoint | Legacy status | Legacy body | V1 status | V1 body | Consumer impact |
|----------|---------------|-------------|-----------|---------|------------------|
| `POST /setroomthermpoint` | 200 | `success({})` (empty) | **202** | `{ ...proxyResult, suggested_poll_delay_s: 1 }` | **Transparent.** `response.ok` true for both; `data.error` still undefined on success. [VERIFIED: `setroomthermpoint/route.ts` vs `v1/setroomthermpoint/route.ts`] |
| `POST /setthermmode` | 200 `success({})` | same | **202** with `suggested_poll_delay_s` | same | **Transparent.** [VERIFIED] |
| `POST /switchhomeschedule` | 200 `success({ success:true, scheduleId, message })` | — | **202** raw proxy `{ ..., suggested_poll_delay_s }` | — | **Minor divergence.** Legacy returned `data.scheduleId` and `data.message`; v1 does not. `ScheduleSelector.tsx:44` currently only inspects `response.ok` via the retry helper — safe. `ThermostatCard.tsx:298` reads `data.message`. Low impact but flag. [VERIFIED] |
| `POST /synchomeschedule` | 200 raw proxy | — | 202 | — | **Transparent** — no consumer reads the body. [VERIFIED] |
| `POST /createnewhomeschedule` | 200 raw proxy | — | 202 | — | **Transparent** — no frontend consumer. [VERIFIED] |
| `POST /calibrate` (bulk) | 200 raw proxy `{ status:'accepted', results, poll_endpoint }` | — | **202** `{ ...raw, suggested_poll_delay_s }` at path `/valves/calibrate` | — | **Transparent for `ThermostatCard.tsx:246`.** It reads `data.error` and `data.success`. Neither is set on v1 success; `data.success` was set by legacy **when the proxy-side result was success**, but looking at legacy calibrate route, it just returns `success(result)` which wraps proxy result — doesn't add `success: true`. Actually safe. [VERIFIED: reading both routes] |
| `POST /camera/monitoring` (legacy) / `POST /camera/[cameraId]/monitoring` (v1) | 200 raw proxy | body `{ camera_id, monitoring }` → forwards `monitoring` to proxy | **202** raw proxy `{ camera_id, monitoring, status:'applied', suggested_poll_delay_s }` | path has `cameraId`; body is `{ monitoring }` only | **URL+body rewrite required.** See B2/B15 items. |

### Read endpoints (material, consumer-blocking)

| Endpoint | Legacy shape | V1 shape | Consumer reads | Impact |
|----------|--------------|----------|----------------|--------|
| `GET /health` | raw proxy `{ token_status, expires_at, provider_status, data_freshness, ... }` | **identical** raw proxy | debug panel displays JSON | **Transparent.** [VERIFIED: `health/route.ts` identical to `v1/health/route.ts`] |
| `GET /homesdata` | `success({ home_id, home_name, rooms, modules, schedules })` — **flattened from `homesResponse.body.homes[0]`**; also WRITES `home_id` + `topology` to Firebase as side-effect | `success(raw)` = `{ body: { homes: [{ id, name, rooms, modules, schedules }], user }, status, time_exec, time_server }` — NO Firebase writes | `useThermostatData.ts:107` reads `data.home_id`, `data.reconnect`; `registry/devices/page.tsx:155` reads something from the response | **BLOCKER.** Consumer reads flat fields that don't exist on v1 response. Also, side-effect loss breaks `homestatus` route's enrichment logic which reads `topology` from Firebase. **Recommended fix: keep v1 route thin (raw proxy) AND rewrite `useThermostatData.checkConnection()` to read `data.body.homes[0].id` / `data.body.homes[0].name` etc.; separately port the Firebase topology-write side-effect into v1 route OR deprecate it if `homestatus` changes.** |
| `GET /homestatus` | `success({ rooms: EnrichedRoom[], modules, lowBatteryModules, hasLowBattery, hasCriticalBattery, updated_at, data_freshness })` where EnrichedRoom has `room_id, room_name, room_type, temperature, setpoint, heating, stoveSync, stoveSyncSetpoint`; ALSO reads `topology` + `stoveSync` from Firebase; writes `currentStatus` back to Firebase | `success(raw)` = `{ rooms: [{home_id, room_id, room_name, temperature, therm_setpoint_temperature, heating_power_request, timestamp, custom_name, device_type}], data_freshness }` | `useThermostatData.ts:173` passes entire `data` to `setStatus(data as NetatmoStatus)`; `useRoomStatus.ts:49` reads `data.rooms[].{room_id, room_name, temperature, setpoint, mode, heating, endtime}`; `PidAutomationPanel.tsx:482` reads something from `data` | **BLOCKER.** V1 uses `therm_setpoint_temperature`, not `setpoint`; has no `heating` boolean, only `heating_power_request` number; has NO `modules`, no `lowBatteryModules`, no `mode`, no `endtime`, no `stoveSync`. Consumer code expects all these. Must either (a) keep legacy-enrichment wrapper at v1 path, or (b) rewrite 3 consumers to map from v1 shape. |
| `GET /schedules` | `success({ schedules, home_id })` — extracts from `homesdata.body.homes[0].schedules` | **N/A** — no v1 route; data embedded in `homesdata` | `useScheduleData.ts:74` reads `data.schedules`, `data.home_id`, `data._source` | **Hook rewrite required** — switch to `fetch('/api/v1/netatmo/homesdata')` and extract `data.body.homes[0].schedules` + `data.body.homes[0].id`. |
| `GET /valves` | raw proxy `{ valves, data_freshness }` | **identical** raw proxy | no current frontend consumer beyond debug panel | **Transparent.** [VERIFIED] |
| `GET /camera/status` | raw proxy `{ cameras, data_freshness }` | **identical** raw proxy | `useCameraData.ts:49` reads `data.cameras`, `data.data_freshness`, `data.error` | **Transparent.** [VERIFIED] |
| `GET /camera/events` | raw proxy `{ events, count }` | **identical** raw proxy | `CameraDashboard.tsx:61`, `CameraEventsPage.tsx:51` | **Transparent.** [VERIFIED] |
| `GET /camera/events/[eventId]/snapshot` | binary JPEG passthrough with `Content-Type: image/jpeg` | **identical** — byte-for-byte | `EventPreviewModal.tsx:27` used as `<img src>` | **Transparent.** [VERIFIED] |
| `GET /camera/stream?cameraId=X` (legacy) / `GET /camera/[cameraId]/stream` (v1) | raw proxy `{ camera_id, vpn_streams, is_local, local_streams? }` | **identical** raw proxy | `CameraCard.tsx:62`, `CameraDashboard.tsx:109` | **URL shape change only.** Consumer body-reading unchanged. [VERIFIED] |
| `GET /camera/snapshot?cameraId=X` (legacy) | **302 redirect** to Netatmo CDN JPEG URL | v1: `success({ camera_id, snapshot_url })` as JSON | `CameraCard.tsx:46`, `CameraCard.tsx:90`, `CameraDashboard.tsx:87` — all use as `<img src>` | **BLOCKER.** Consumer expects a URL that, when loaded by `<img>`, returns an image. V1 returns JSON. Three options: (1) rewrite v1 route to 302 like legacy; (2) add a new v1 route that matches legacy behavior (e.g., `/camera/[id]/snapshot/redirect`); (3) rewrite 3 consumers to fetch JSON then set `<img src>` to the returned `snapshot_url`. **Recommend option (1)** — modify v1 route to emit 302; it's the least invasive change and matches the pragmatic `<img>` usage pattern. |
| `GET /getroommeasure` | raw proxy + validation | raw proxy + similar validation | no current frontend consumer | **Transparent.** [VERIFIED] |
| `GET /gethomedata` | N/A (no legacy route) | raw proxy | no consumer | **N/A** |
| `GET /getthermstate` | N/A | raw proxy | no consumer | **N/A** |

---

## Service Worker Impact

**File:** `app/sw.ts`, line 622 (branch 621-641).

**Legacy code:**
```typescript
if (url.pathname === '/api/netatmo/status' && event.request.method === 'GET') {
  event.respondWith(
    fetch(event.request).then(async (response) => {
      if (response.ok) {
        const clone = response.clone();
        try { const data = await clone.json(); await cacheDeviceState('thermostat', data); } catch {}
      }
      return response;
    }).catch(...)
  );
}
```

**Analysis:**
- The path `/api/netatmo/status` has **never existed** in either the legacy `app/api/netatmo/` tree or the v1 tree. [VERIFIED: `ls app/api/netatmo` returns no `status/` subdir; `find app/api/netatmo -name 'status' -type d` returns only `camera/status`, which is a different path.]
- This branch **never fires at runtime** — no request matches the path.
- The `cacheDeviceState('thermostat', ...)` IndexedDB write is therefore **never executed** via the service worker path. If any consumer reads the cached thermostat state, it reads a stale record that has never been updated. [VERIFIED: `cacheDeviceState` is called in the sibling stove branch at line 600 matching `/api/v1/thermorossi/status`; the Netatmo path is dead.]

**Impact of deletion (per D-07):**
- **Runtime:** Zero. No request currently hits this branch; removing it does not change observable behavior.
- **Offline/cached state:** If any downstream reader of `deviceState.thermostat` existed, it's already reading an empty record. Removing the dead branch preserves that state, which matches existing runtime.
- **Tests:** The sw.ts test coverage (if any) should be checked. Grep for `sw.ts` tests:
  ```bash
  find __tests__ app -name '*sw*' -name '*.test.*' 2>/dev/null
  ```

**Recommendation:** Delete the branch outright (lines 621-641). No replacement needed. Matches Phase 109 cleanup precedent.

**Pitfall to watch for:** If a future requirement wants to cache thermostat state offline, it should target the canonical v1 path (`/api/v1/netatmo/homestatus`), not recreate the stale path. Leave a 1-line comment in sw.ts noting the deletion so future readers don't resurrect it.

---

## Verification Commands

### Grep Sweep (Plan 03 gate)

The final grep sweep must prove ZERO references to legacy `/api/netatmo/` outside `.planning/` and `docs/`:

```bash
# Primary sweep — should return ZERO lines after Plan 03
grep -rn "/api/netatmo/" app/ lib/ components/ __tests__/ \
  --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
  2>/dev/null | grep -v ".planning/" | grep -v "docs/" | grep -v "node_modules/"

# Secondary sweep — NETATMO_ROUTES / CAMERA_ROUTES must not point to legacy paths
grep -rn "NETATMO_ROUTES\|CAMERA_ROUTES" lib/routes.ts

# Verify no remaining legacy route files exist
find app/api/netatmo -name "route.ts" 2>/dev/null
# Must return zero lines after Plan 03 deletion.

# Verify v1 routes still present
find app/api/v1/netatmo -name "route.ts" 2>/dev/null | wc -l
# Must return 21 before AND after this phase.
```

### Jest Smoke (Plan 02 & Plan 03 gate)

```bash
# Quick test pass — all Netatmo-related specs
npm test -- --testPathPattern="netatmo|thermostat|camera" --passWithNoTests

# Full test suite (Plan 03 only)
npm test

# Specific files likely to catch regressions
npm test -- app/thermostat/page.test.tsx
npm test -- __tests__/components/devices/thermostat/ThermostatCard.schedule.test.tsx
npm test -- __tests__/app/api/netatmo  # BEFORE deletion — they should all exist and pass on legacy code
npm test -- __tests__/api/netatmo       # same
```

**Note:** The legacy `__tests__/app/api/netatmo/*` and `__tests__/api/netatmo/*` test files (11 files per the initial grep) will need to be deleted alongside the legacy route tree in Plan 03, OR retargeted to v1 routes. Confirm Plan 03 scope covers them.

### Playwright Smoke (Plan 03 gate)

```bash
# Netatmo pages — thermostat, camera, registry
npx playwright test -g "thermostat" --headed=false
npx playwright test -g "camera" --headed=false
npx playwright test -g "registry" --headed=false

# Full smoke run
npm run test:e2e
```

**Key interactions to exercise manually in browser after cutover (fallback if Playwright @smoke grep fails):**
1. Visit `/thermostat` — verify topology loads (`useThermostatData.checkConnection()` returns `connected=true`), verify room list renders with temperatures and setpoints, verify battery warnings present.
2. Visit `/camera` — verify camera card renders snapshot image (not broken), verify `Live` button fetches stream URL, verify monitoring toggle applies.
3. Visit `/registry/devices` — verify Netatmo provider filters populate.
4. Exercise thermostat: change mode (away/schedule), set setpoint for a room, toggle manual override, switch schedule via dropdown.
5. Exercise valves: click "Calibrate" button on ThermostatCard; verify 202 response; verify no error toast.
6. Visit `/debug` and `/debug/api` (NetatmoTab) — exercise Health, HomesData, HomeStatus, Valves, CameraStatus, SetThermMode, SetRoomThermpoint, Calibrate tiles.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 30.x with React Testing Library, ts-jest [VERIFIED: `jest.config.ts`] |
| Config file | `jest.config.ts` at repo root |
| Quick run command | `npm test -- --testPathPattern="netatmo\|thermostat\|camera" --passWithNoTests` |
| Full suite command | `npm test` |
| E2E framework | Playwright, config at `playwright.config.ts` |
| E2E command | `npm run test:e2e` |

### Phase Requirements → Test/Grep/Playwright Assertion Map

| Req ID | Behavior | Test Type | Automated Assertion | File Exists? |
|--------|----------|-----------|---------------------|-------------|
| NETA-01 | `getthermstate` route reachable | grep | `grep -rn '/api/v1/netatmo/getthermstate' app/api/v1/netatmo/getthermstate/route.ts` must return ≥ 1 | ✅ (no frontend consumer — route existence proves requirement) |
| NETA-02 | Bulk valve calibrate works from UI | integration | `npm test -- ThermostatCard` with assertion `expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/v1/netatmo/valves/calibrate'), expect.objectContaining({method:'POST'}))` | ✅ (existing ThermostatCard tests — update URL assertion in Plan 02) |
| NETA-03 | Single-valve calibrate route reachable | grep | `grep -rn '/api/v1/netatmo/valves/\\[moduleId\\]/calibrate' app/api/v1/netatmo` must return ≥ 1 | ✅ route file exists |
| NETA-04 | Event snapshot binary works | integration | `npm test -- EventPreviewModal` — snapshot URL assertion | ✅ existing test likely covers via CAMERA_ROUTES.eventSnapshot |
| NETA-05 | Camera stream URL returned | integration | `npm test -- CameraCard` — verify `fetch(CAMERA_ROUTES.stream(id))` targets `/api/v1/netatmo/camera/[cameraId]/stream` | ⚠️ review existing CameraCard tests |
| NETA-06 | Camera snapshot renders in `<img>` | Playwright | `await page.goto('/camera'); await expect(page.locator('img').first()).toBeVisible();` (image element loads without broken icon) | ⚠️ requires visual/network assertion — flag if Playwright @smoke tag absent |
| NETA-07 | Camera monitoring toggle applies | integration | `npm test -- CameraMonitoringToggle` (`__tests__/app/components/devices/camera/CameraMonitoringToggle.test.tsx` exists) — verify POST to `/api/v1/netatmo/camera/.../monitoring` with body `{ monitoring }` | ✅ update assertion |
| NETA-08 | `renamehome` route reachable | grep | `grep -rn '/api/v1/netatmo/renamehome' app/api/v1/netatmo/renamehome/route.ts` ≥ 1 | ✅ route exists |
| NETA-09 | `gethomedata` route reachable | grep | `grep -rn '/api/v1/netatmo/gethomedata' app/api/v1/netatmo/gethomedata/route.ts` ≥ 1 | ✅ route exists |
| ALL | Zero `/api/netatmo/` refs in production code | grep (Plan 03 gate) | `grep -rn "/api/netatmo/" app/ lib/ --include="*.ts" --include="*.tsx" \| grep -v ".planning/" \| grep -v "docs/"` returns **0 lines** | grep-only |
| ALL | Zero legacy route handlers exist | find (Plan 03 gate) | `find app/api/netatmo -name route.ts` returns **0 lines** | find-only |
| ALL | All v1 routes still present | find | `find app/api/v1/netatmo -name route.ts \| wc -l` returns `21` | find-only |
| ALL | Jest suite green | Jest | `npm test` exits 0 | — |

### Sampling Rate
- **Per task commit (Plan 01, 02):** `npm test -- --testPathPattern="netatmo\|thermostat\|camera" --passWithNoTests`
- **Per wave merge:** `npm test` (full suite)
- **Phase gate (Plan 03 completion):** `npm test` green + full grep sweep returns 0 legacy refs + manual browser smoke of /thermostat, /camera, /registry + `/debug`

### Wave 0 Gaps
- [ ] Confirm Playwright `@smoke` tag support exists (CONTEXT discretion bullet says Phase 167 found it missing). If absent, fall back to `npm run test:e2e` with `-g 'camera|thermostat|registry'` pattern filter.
- [ ] Confirm test file `__tests__/components/devices/thermostat/ThermostatCard.schedule.test.tsx` is reachable by CI test runner (not excluded by jest config).
- [ ] Confirm the 11 legacy route test files (`__tests__/app/api/netatmo/**` + `__tests__/api/netatmo/**`) are included in Plan 03 deletion scope, or retargeted to v1 equivalents.

---

## Risks & Gotchas

### Risk 1: CONTEXT scope underestimate (CRITICAL)
**What goes wrong:** Planner sizes Plan 02 for 4 files but execution must touch 16 files. Plan 02 commits half-migrated, Plan 03 grep sweep surfaces the untouched consumers, deletion either blocks or breaks.
**Why:** CONTEXT grep missed `NETATMO_ROUTES`/`CAMERA_ROUTES` indirection through `lib/routes.ts`.
**Prevention:** Planner reads the Grep Inventory Group B (B1-B16) as authoritative scope. Plan 02 must size for ~19 target files, not 4.
**Warning signs:** After Plan 02 merges, `grep -rn '/api/netatmo/' app/` still returns hits in files not listed in CONTEXT D-05..D-11.

### Risk 2: Response-shape divergence silent breakage (CRITICAL)
**What goes wrong:** Pure URL swap (`lib/routes.ts` values changed) causes `useThermostatData.checkConnection()` to always return `connected=false`, `useRoomStatus` to return rooms with no setpoint/heating fields, `CameraCard` snapshot `<img>` to display broken.
**Why:** Legacy `homesdata`/`homestatus` did backend enrichment that v1 routes don't; legacy `camera/snapshot` was a 302 redirect; v1 is JSON.
**Prevention:** For each endpoint in Response-Shape Parity, choose either route-wrapper adaptation OR consumer rewrite; document the choice before writing plans. For `camera/snapshot`, strongly recommend making v1 route emit a 302 redirect like legacy.
**Warning signs:** After cutover, `/thermostat` page shows "Non connesso" banner; `<img>` elements show broken icons; `useScheduleData` returns empty schedules.

### Risk 3: Firebase side-effect loss
**What goes wrong:** Legacy `homesdata` writes `home_id` + `topology` to Firebase paths `getEnvironmentPath('netatmo/home_id')` and `getEnvironmentPath('netatmo/topology')`. Legacy `homestatus` reads `topology` from Firebase to enrich room_type. V1 does neither.
**Why:** V1 routes are thin proxy wrappers (intentional Phase 161 design).
**Prevention:** Either port Firebase writes into v1 `homesdata` route wrapper, OR rewrite `homestatus` route / consumer to not need Firebase enrichment, OR accept that the `room_type` field will be lost from UI.
**Warning signs:** After cutover, RoomCard labels show "Stanza" (fallback) instead of actual room types like "Soggiorno/Cucina"; `stoveSync` badges disappear.

### Risk 4: `schedules` endpoint drop without consumer update
**What goes wrong:** `useScheduleData.ts:74` fetches `NETATMO_ROUTES.schedules` which will become undefined/404 after key deletion. Schedules never load; `/thermostat` schedule switcher empty.
**Why:** `/api/netatmo/schedules` is being dropped per D-04 without a direct replacement.
**Prevention:** Rewrite `useScheduleData` to fetch `/api/v1/netatmo/homesdata` and read `data.body.homes[0].schedules`.
**Warning signs:** ScheduleSelector empty; ThermostatCard.schedule tests fail.

### Risk 5: Test file lockstep
**What goes wrong:** Test file `ThermostatCard.schedule.test.tsx` hardcodes `/api/netatmo/schedules` assertion; after cutover the assertion fails even if implementation is correct.
**Why:** CONTEXT D-11 missed this file.
**Prevention:** Include in Plan 02 test updates.
**Warning signs:** Jest reports 2 failing tests in ThermostatCard.schedule after Plan 02.

### Risk 6: Camera snapshot cache-bust pattern
**What goes wrong:** `CameraCard.tsx:90` appends `+ &t=${Date.now()}` to the snapshot URL to cache-bust. If the URL shape changes from `?cameraId=X` to `/[cameraId]/snapshot`, the cache-bust string `&t=Y` is no longer a query-param — it's appended to the path.
**Why:** Legacy URL had a query-param; v1 URL has path segments.
**Prevention:** Update cache-bust to `?t=${Date.now()}` (leading `?` to start a new query), OR use a separate query param URL shape.
**Warning signs:** Refresh button on CameraCard doesn't reload snapshot; stale image persists.

### Risk 7: Debug panel `camera_id` input for snapshot/stream/monitoring
**What goes wrong:** Debug panels have no cameraId input. Dropping 3 tiles (per D-10) is safest, but if a user needs to exercise those endpoints ad-hoc they cannot.
**Why:** V1 endpoints require `[cameraId]` in path; debug tiles are static.
**Prevention:** Accept the drop; future phase can restore with input.
**Warning signs:** None (accepted loss per D-10).

### Risk 8: Legacy tree deletion with outstanding tests
**What goes wrong:** 11 test files under `__tests__/app/api/netatmo/**` + `__tests__/api/netatmo/**` currently test legacy handlers. Plan 03 deletes legacy routes but leaves test files, causing compilation failures.
**Why:** Jest config compiles test files against source modules that no longer exist.
**Prevention:** Plan 03 deletes the test files in the same commit as the route tree, OR retargets them to v1 handlers.
**Warning signs:** Jest fails with "cannot find module '@/app/api/netatmo/.../route'".

### Risk 9: Command palette hyphen mismatch
**What goes wrong:** `deviceCommands.tsx:228,234,240` passes `'set-therm-mode'` to `executeThermostatAction`, which interpolates into `/api/netatmo/set-therm-mode`. That path does NOT exist (real path is `/api/netatmo/setthermmode` without hyphens). The command palette's thermostat mode commands have been broken since their introduction — they return 404 silently.
**Why:** Typo / hyphenation convention mismatch.
**Prevention:** During cutover, fix both the function body (`/api/v1/netatmo/${endpoint}`) AND the 3 callers (`'setthermmode'` without hyphens). Two bugs fixed in one edit.
**Warning signs:** None currently — bug is silent (console.error but no user feedback).

### Risk 10: `thermostat/page.test.tsx` hyphenated mock URLs never matched real paths
**What goes wrong:** Same root cause as Risk 9 — the test mocks `NETATMO_ROUTES` with hyphenated paths (`/api/netatmo/homes-data`) that don't match real routes. Tests pass because they compare mock-against-mock, but assertions don't reflect reality.
**Why:** Stale test scaffolding.
**Prevention:** Covered by D-08 update.
**Warning signs:** Covered.

### Risk 11: Side-effect inheritance from legacy routes
**What goes wrong:** Legacy `setroomthermpoint` + `setthermmode` write error logs to Firebase via `adminDbPush('log', ...)` on failure (lines 63-81 / 52-70). V1 routes do not. Deleting legacy routes loses error-trail logging.
**Why:** V1 design is thin-proxy-only.
**Prevention:** Accept loss (not in scope per D-13) OR port logging to v1 routes before deletion.
**Warning signs:** After cutover, Firebase `log` node has no new Netatmo-error entries; debugging future thermostat failures gets harder.

---

## Open Questions (RESOLVED)

1. **How to resolve the `homesdata` shape mismatch?**
   - What we know: CONTEXT D-14 asserts shapes are identical; they are not. `useThermostatData.checkConnection()` reads `data.home_id`; v1 response has `data.body.homes[0].id`.
   - What's unclear: Should the planner (a) rewrite `useThermostatData` to unwrap `body.homes[0]`, or (b) rewrite v1 `/api/v1/netatmo/homesdata/route.ts` to emit the flattened shape + Firebase side-effect?
   - Recommendation: Option (b) preserves Firebase-topology side-effect that `homestatus` enrichment depends on; is less invasive to consumers (just URL swap); maintains existing E2E behavior. Cost: v1 route is no longer a "thin proxy" (Phase 161 invariant). **Flag to user before writing plans.**
   - **RESOLVED:** Plan 02 Task 2 Edit 2A rewrites `useThermostatData.checkConnection()` to unwrap `data.body?.homes?.[0]` and flatten it into the `NetatmoTopology` shape the rest of the hook expects. Option (a) was chosen over option (b) to preserve the v1 route's thin-proxy invariant (Phase 161). Trade-off: the Firebase topology side-effect (legacy home_id/topology persistence) is NOT ported to v1; accept documented UI regression (see Q2 resolution + WARNING 5 resolution).
   - **Additional resolution:** Plan 02 adds a new Task 2E (or extends Task 2) to rewrite `lib/hooks/useRoomStatus.ts:80-89` to map v1 `/homestatus` field names: `setpoint ← therm_setpoint_temperature`, `heating ← (heating_power_request ?? 0) > 0`. Consumer grep confirmed `mode` and `endtime` are dereferenced by `app/thermostat/schedule/page.tsx:33`, `ActiveOverrideBadge.tsx:35,40`, and `ManualOverrideSheet.tsx:146` — set both fields to `null` with an inline comment rather than drop from `RoomListItem` (consumers gracefully handle `null` via existing falsy guards).

2. **How to resolve the `homestatus` shape mismatch?**
   - Similar question for enriched fields (`setpoint`, `heating`, `room_type`, `lowBatteryModules`, `stoveSync`).
   - Recommendation: Same route-wrapper preservation approach — modify v1 `/api/v1/netatmo/homestatus/route.ts` to include topology enrichment and Firebase reads. Cost: same as Q1.
   - **RESOLVED:** Plan 02 Task 2 Edit 2B rewrites `useThermostatData.fetchStatus()` to map v1 rooms (`therm_setpoint_temperature → setpoint`, `heating_power_request > 0 → heating`) and DROPS the Firebase topology/stoveSync side-effect entirely (option (a) again, preserving thin-proxy invariant). **Documented UI regression:** `stoveSync` badges in `RoomCard.tsx`/`ThermostatCard.tsx` will silently report `false` after cutover because v1 `/homestatus` does not enrich rooms with the stove-sync Firebase lookup. Logged in `168-DEFERRED.md` for a follow-up phase (port topology write-read into v1 routes if the badge signal is missed in production).

3. **How to preserve camera snapshot `<img>` compatibility?**
   - Recommendation: Modify `/api/v1/netatmo/camera/[cameraId]/snapshot/route.ts` to emit 302 redirect (copy logic from legacy `camera/snapshot/route.ts`). One-line change, no consumer rewrite, no shape drift.
   - **RESOLVED:** Plan 02 Task 1 Edit 1D rewrites `app/api/v1/netatmo/camera/[cameraId]/snapshot/route.ts` to emit `NextResponse.redirect(snapshot_url, { status: 302, headers: { 'Cache-Control': 'no-cache, no-store' } })`. Consumers using `<img src={CAMERA_ROUTES.snapshot(id)}>` continue to render without client-side rewrite.

4. **Scope of legacy test file deletion in Plan 03?**
   - 11 legacy test files under `__tests__/app/api/netatmo/**` and `__tests__/api/netatmo/**`. Delete outright, or retarget each to its v1 handler?
   - Recommendation: Delete outright. V1 routes have their own co-located `__tests__/route.test.ts` per Phase 161's output pattern; legacy tests are redundant coverage.
   - **RESOLVED:** Plan 03 Task 1 Step 4 runs `rm -rf __tests__/api/netatmo/` and `rm -rf __tests__/app/api/netatmo/` alongside the route-tree deletion. Total 13 legacy test files removed. Coverage preserved via Phase 161's co-located v1 route tests.

5. **Is `lib/netatmo/netatmoCameraApi.ts:6` comment update required?**
   - Comment says `See: app/api/netatmo/camera/`. After tree deletion this points to nothing.
   - Recommendation: Include as micro-edit in Plan 02 (co-located with CameraCard JSDoc per D-06).
   - **RESOLVED:** Plan 02 Task 3 extended to cover `lib/netatmo/netatmoCameraApi.ts:6` JSDoc — rewrite `* See: app/api/netatmo/camera/` → `* See: app/api/v1/netatmo/camera/`. Prevents Plan 03's repo-wide grep sweep from matching on this comment string and failing the Wave 3 gate.

6. **Command palette: fix the latent hyphen bug?**
   - `deviceCommands.tsx:228,234,240` send `'set-therm-mode'` to `/api/netatmo/set-therm-mode` which has never existed. Cutover is natural time to fix.
   - Recommendation: YES — fix both URL prefix AND endpoint name together in Plan 02.
   - **RESOLVED:** Plan 02 Task 1 Edit 1C fixes both: `executeThermostatAction` body rewritten to `fetch(\`/api/v1/netatmo/${endpoint}\`, ...)` (prefix) AND the 3 callers at lines 228, 234, 240 rewritten from `'set-therm-mode'` to `'setthermmode'` (hyphen bug). Acceptance criteria enforce both via grep (zero `'set-therm-mode'` + exactly 3 `'setthermmode'`).

---

## Environment Availability

Step 2.6: SKIPPED (no external tool/CLI dependencies beyond Node + Jest + Playwright already present in the project).

---

## Runtime State Inventory

This is a URL-cutover phase, not a rename of persistent identifiers. Scope:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — the Firebase paths `netatmo/home_id`, `netatmo/topology`, `netatmo/currentStatus`, `netatmo/userSelectedScheduleId`, `netatmo/stoveSync` are NOT changing. They continue to use the same keys. | None — but BE AWARE that legacy `homesdata`/`homestatus` WRITE to those paths; v1 currently does NOT. See Risk 3. |
| Live service config | None. Netatmo API uses proxy delegation; no Datadog tags, Tailscale ACLs, or Cloudflare configs reference the legacy path. | None. |
| OS-registered state | None. The scheduler GitHub Actions cron job calls `/api/scheduler/check` — not a Netatmo path. | None. |
| Secrets/env vars | None. X-API-Key for HA proxy is used by `haGet`/`haPost` transport; no env var names change. | None. |
| Build artifacts | Service worker (`app/sw.ts`) compiles to `public/sw.js`. The dead branch removal in line 622-641 means a new SW version ships. | Normal SW update flow — bump SW version if explicit versioning is used. |

**Nothing found in category "Runtime state needs migration":** Verified by grep across `lib/firebase*`, `lib/scheduler*`, `app/sw.ts`, `.env*`, and search for `netatmo` in env-related files.

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | `withAuthAndErrorHandler` — all v1 routes inherit Auth0 gating [VERIFIED: every v1 route wrapper] |
| V3 Session Management | no | — |
| V4 Access Control | yes | Existing auth wrapper enforces; no new permission model |
| V5 Input Validation | yes (camera monitoring body change) | `parseJson<SetMonitoringRequest>` typed cast; Pydantic validation in HA proxy |
| V6 Cryptography | no | — |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthenticated access to migrated endpoints | Elevation of Privilege | `withAuthAndErrorHandler` (same guard) — already present on all v1 routes |
| Path traversal via `cameraId` path segment | Tampering | `getPathParam(context, 'cameraId')` returns raw string; proxy forwards to Netatmo Cloud which validates. Low risk (not directly filesystem-adjacent) |
| Snapshot redirect open-redirect | Tampering | 302 redirect target is `snapshot_url` from proxy which comes from Netatmo Cloud — an attacker cannot control it; same trust boundary as legacy. [VERIFIED: legacy route does same thing] |

---

## Sources

### Primary (HIGH confidence — direct codebase read)
- `app/api/netatmo/**/route.ts` — all 18 legacy route files read
- `app/api/v1/netatmo/**/route.ts` — all 21 v1 route files read
- `lib/routes.ts` — `NETATMO_ROUTES`, `CAMERA_ROUTES` exports verified
- `lib/commands/deviceCommands.tsx` — command palette integration verified
- `lib/hooks/useRoomStatus.ts`, `useScheduleData.ts` — shape-read verification
- `app/components/devices/thermostat/hooks/useThermostatData.ts` — hook body verified
- `app/components/devices/thermostat/ThermostatCard.tsx`, `app/components/netatmo/RoomCard.tsx`, `PidAutomationPanel.tsx` — production consumers
- `app/components/devices/camera/CameraCard.tsx`, `CameraDashboard.tsx`, `CameraEventsPage.tsx`, `EventPreviewModal.tsx`, `useCameraData.ts` — camera consumers
- `app/debug/api/components/tabs/NetatmoTab.tsx`, `app/debug/components/tabs/NetatmoTab.tsx` — debug panels (42 refs each)
- `app/sw.ts` line 622 — service worker branch
- `app/thermostat/page.tsx`, `page.test.tsx`, `ActiveOverrideBadge.tsx`, `ScheduleSelector.tsx`, `ManualOverrideSheet.tsx` — thermostat page consumers
- `__tests__/components/devices/thermostat/ThermostatCard.schedule.test.tsx` — test file CONTEXT missed
- `docs/api/netatmo.md` — authoritative API spec for v1 shapes (read pages 1-30, confirmed shape discrepancies)
- `.planning/config.json` — confirmed `nyquist_validation: true`
- `.planning/phases/168-netatmo-frontend-cutover/168-CONTEXT.md` — CONTEXT source
- `.planning/phases/167-sonos-frontend-cutover/167-RESEARCH.md` — template shape
- `.planning/phases/166-hue-frontend-cutover/166-RESEARCH.md` — alternate template
- `./CLAUDE.md` — project rules

### Secondary (MEDIUM confidence)
- None — all claims verified by direct codebase inspection.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | CONTEXT's 3-plan structure is preserved at the user's option despite scope corrections | Summary | If user accepts scope corrections but plans stay 3-sized, Plan 02 will be oversized and may straddle natural commit boundaries — recommend discussion |
| A2 | The recommended fix for `homesdata`/`homestatus` shape mismatch is to preserve legacy-style enrichment in v1 route wrappers | Open Questions Q1, Q2 | If user prefers consumer rewrites instead, the plan shape changes significantly — flag before writing plans |
| A3 | V1 `camera/[cameraId]/snapshot` can be modified to emit 302 redirect without breaking any other consumer | Risk 2, Open Question Q3 | If v1 route tests assume JSON body, they will fail after the route change; verify v1 `camera/[cameraId]/snapshot/__tests__/route.test.ts` before recommending |
| A4 | All 11 legacy test files (`__tests__/app/api/netatmo/**`, `__tests__/api/netatmo/**`) are safe to delete outright because v1 routes have co-located tests | Open Question Q4 | If v1 routes lack co-located tests for some endpoints, coverage regresses — verify before deletion |
| A5 | `lib/version.ts:1508` changelog reference does not require update (historical record) | Grep Inventory Group D | If project conventions demand updating all references including historical, flag as an additional edit |
| A6 | Playwright `@smoke` tag absence (Phase 167 finding) still holds | Validation Architecture | If tag was added between phases, the fallback `-g` pattern is unnecessary; plan can use `@smoke` directly |

**All other claims verified by direct codebase inspection.**

---

## Metadata

**Confidence breakdown:**
- Grep inventory (19 files × exact line numbers): HIGH — verified by targeted greps
- Response-shape parity: HIGH — verified by reading both legacy and v1 route implementations side-by-side
- CONTEXT scope corrections: HIGH — 9 discrepancies documented with verification source
- Service worker impact: HIGH — verified path `/api/netatmo/status` doesn't exist in either tree
- Runtime state inventory: HIGH — no persistent state identifiers changing
- Risk inventory: HIGH — each risk traced to a specific file+line

**Research date:** 2026-04-20
**Valid until:** 2026-05-20 (stable codebase — no external dependencies)
**Next recommended action:** Re-run /gsd-discuss-phase with scope corrections in hand, or have planner explicitly accept the expanded surface before writing Plan 02.
