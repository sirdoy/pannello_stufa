# Phase 168: Netatmo Frontend Cutover - Context

**Gathered:** 2026-04-20
**Status:** Ready for planning
**Mode:** auto (gray areas auto-selected, recommended options chosen)

<domain>
## Phase Boundary

Migrate all frontend consumers of legacy `/api/netatmo/*` to canonical `/api/v1/netatmo/**`, then delete the legacy route tree. The v1 route surface already exists end-to-end — Phase 161 shipped all 9 NETA-XX endpoints (thermostat state, valve calibration bulk + per-module, camera events/snapshot/stream/monitoring, renamehome, gethomedata) and prior infrastructure (homesdata, homestatus, setroomthermpoint, setthermmode, schedule CRUD, valves, getroommeasure, health) also lives under `/api/v1/netatmo/*`. This phase is a mechanical URL cutover + legacy tree deletion, matching the Phase 166 (Hue) and Phase 167 (Sonos) pattern.

Frontend consumer surface (production code):
- `app/registry/devices/page.tsx` — 1 fetch (`/api/netatmo/homesdata`)
- `app/components/devices/camera/CameraCard.tsx` — 1 JSDoc comment mentioning `/api/netatmo/camera/snapshot` (no active fetch)
- `app/sw.ts` — 1 stale reference to non-existent `/api/netatmo/status` (likely dead / typo — confirm + fix)
- `app/thermostat/page.test.tsx` — 4 hyphenated mock URL constants (`/api/netatmo/homes-data`, `/home-status`, `/set-therm-mode`) that do not match any real endpoint

Debug-panel surface (2 near-duplicate files, ~42 refs each — per success criterion SC-2 "debug panel may remain if explicitly scoped"):
- `app/debug/api/components/tabs/NetatmoTab.tsx`
- `app/debug/components/tabs/NetatmoTab.tsx`

`useThermostatData` hook already consumes `/api/v1/netatmo/*` — no rewrite needed.

</domain>

<decisions>
## Implementation Decisions

### V1 Route Coverage (no new routes needed)
- **D-01:** Phase 161 already shipped every v1 route the frontend needs. Verified by `find app/api/v1/netatmo -name route.ts`: 21 route handlers covering every NETA-01..NETA-09 requirement plus pre-existing `homesdata`, `homestatus`, `setroomthermpoint`, `setthermmode`, `switchhomeschedule`, `synchomeschedule`, `createnewhomeschedule`, `getroommeasure`, `camera/status`, `health`, `valves`, `valves/calibrate`, `valves/[moduleId]/calibrate`, `camera/[cameraId]/snapshot`, `camera/[cameraId]/stream`, `camera/[cameraId]/monitoring`, `camera/events`, `camera/events/[eventId]/snapshot`, `getthermstate`, `gethomedata`, `renamehome`. No v1 wrapper creation work in this phase (diverges from Phase 167 D-01..D-11 which had to build 11 missing wrappers).

### URL Mapping (legacy → v1) — direct rewrite with path-shape changes for camera
- **D-02:** `/api/netatmo/*` flat endpoints map 1:1 via prefix swap:
  - `/api/netatmo/health` → `/api/v1/netatmo/health`
  - `/api/netatmo/homesdata` → `/api/v1/netatmo/homesdata`
  - `/api/netatmo/homestatus` → `/api/v1/netatmo/homestatus`
  - `/api/netatmo/valves` → `/api/v1/netatmo/valves`
  - `/api/netatmo/setroomthermpoint` → `/api/v1/netatmo/setroomthermpoint`
  - `/api/netatmo/setthermmode` → `/api/v1/netatmo/setthermmode`
  - `/api/netatmo/switchhomeschedule` → `/api/v1/netatmo/switchhomeschedule`
  - `/api/netatmo/synchomeschedule` → `/api/v1/netatmo/synchomeschedule`
  - `/api/netatmo/createnewhomeschedule` → `/api/v1/netatmo/createnewhomeschedule`
  - `/api/netatmo/getroommeasure` → `/api/v1/netatmo/getroommeasure`
  - `/api/netatmo/camera/status` → `/api/v1/netatmo/camera/status`
  - `/api/netatmo/camera/events` → `/api/v1/netatmo/camera/events`
  - `/api/netatmo/camera/events/[eventId]/snapshot` → `/api/v1/netatmo/camera/events/[eventId]/snapshot`
- **D-03:** Path-shape changes (legacy was flat, v1 requires `[cameraId]`):
  - `/api/netatmo/camera/snapshot` → `/api/v1/netatmo/camera/{cameraId}/snapshot` — caller must supply `cameraId`
  - `/api/netatmo/camera/stream` → `/api/v1/netatmo/camera/{cameraId}/stream`
  - `/api/netatmo/camera/monitoring` → `/api/v1/netatmo/camera/{cameraId}/monitoring`
- **D-04:** Superseded/alias mappings:
  - `/api/netatmo/calibrate` (bulk) → `/api/v1/netatmo/valves/calibrate` (semantic equivalent — both calibrate all valves)
  - `/api/netatmo/schedules` → **drop** (no v1 equivalent; schedule data is available as `schedules` array embedded in `/api/v1/netatmo/homesdata` response — debug panel drops the separate tile)

### Frontend Files to Rewrite (production code — 4 files)
- **D-05:** `app/registry/devices/page.tsx` — swap `fetch('/api/netatmo/homesdata')` → `fetch('/api/v1/netatmo/homesdata')`. Single call site.
- **D-06:** `app/components/devices/camera/CameraCard.tsx` — update JSDoc comment at line 270 to reference `/api/v1/netatmo/camera/[cameraId]/snapshot` (comment-only fix; no runtime change).
- **D-07:** `app/sw.ts` line 622 — the `/api/netatmo/status` branch references a route that has never existed in either tree. **Remove the dead branch entirely** (matches Phase 109 Hue cleanup pattern where `app/sw.ts` stale cache rules were deleted, not rewritten).
- **D-08:** `app/thermostat/page.test.tsx` — replace 4 hyphenated mock URL constants to match real v1 endpoints:
  - `/api/netatmo/homes-data` → `/api/v1/netatmo/homesdata` (no hyphen — real endpoint shape)
  - `/api/netatmo/home-status` → `/api/v1/netatmo/homestatus`
  - `/api/netatmo/set-therm-mode` → `/api/v1/netatmo/setthermmode`
  - 4th line 146 assertion `toHaveBeenCalledWith('/api/netatmo/homes-data')` → `'/api/v1/netatmo/homesdata'`

### Debug Panel Scope (include in cutover per Hue Phase 112 precedent)
- **D-09:** Both `app/debug/api/components/tabs/NetatmoTab.tsx` and `app/debug/components/tabs/NetatmoTab.tsx` get migrated to v1 URLs in this phase. Matches Phase 112 Hue debug-panel gap closure discipline — debug surfaces stay in sync with production. Diverges from ROADMAP SC-2's "debug panel may remain if explicitly scoped" by explicitly scoping them in. Rationale: leaving two debug panels on legacy paths guarantees future confusion and defeats the "zero `/api/netatmo/` refs in production" invariant once the legacy tree is deleted (the debug tabs would 404).
- **D-10:** In each debug NetatmoTab:
  - Rewrite every `/api/netatmo/X` URL string (including ~21 occurrences in `copyUrlToClipboard`, `copiedUrl ===`, `url=`, `fetchGetEndpoint`/`callPostEndpoint` args, and the comparable mirror entries)
  - For camera operations (`snapshot`, `stream`, `monitoring`) — the debug panel currently has no cameraId input; either (a) hard-code a `[cameraId]=default` sentinel the user edits, or (b) drop those tiles. **Recommended: drop camera/snapshot, camera/stream, camera/monitoring tiles** — the debug panel already lacks UI for the cameraId param, and no existing tile fetches them (grep confirmed). Keep `camera/status` (no param) and `camera/events` (no param).
  - Drop the `schedules` tile per D-04 (no v1 equivalent).
  - Rewrite `calibrate` tile: `url="/api/netatmo/calibrate"` → `url="/api/v1/netatmo/valves/calibrate"` and `callPostEndpoint('calibrate', '/api/netatmo/calibrate', {})` → `callPostEndpoint('calibrate', '/api/v1/netatmo/valves/calibrate', {})`.

### Test Updates
- **D-11:** `app/thermostat/page.test.tsx` is the only production test that references legacy URLs — covered by D-08. No hook test file touches `/api/netatmo/*` (useThermostatData already on v1).

### Legacy Route Cleanup
- **D-12:** Delete entire `app/api/netatmo/` directory tree after frontend cutover verified. Includes: `calibrate`, `camera/{events,events/[eventId]/snapshot,monitoring,snapshot,status,stream}`, `createnewhomeschedule`, `getroommeasure`, `health`, `homesdata`, `homestatus`, `schedules`, `setroomthermpoint` (+ `__tests__`), `setthermmode` (+ `__tests__`), `switchhomeschedule`, `synchomeschedule`, `valves`. Count ≈18 route.ts files. Final repo-wide grep proving zero `/api/netatmo/` refs outside archived `.planning/` docs.

### Firebase Command Logging
- **D-13:** Not applicable — Netatmo v1 routes already follow whatever logging pattern Phase 161 established. No new logging work. Diverges from Hue (Phase 166 D-05) intentionally; Netatmo success criteria do not mention Firebase logging.

### Response Shape Consistency
- **D-14:** V1 routes are thin wrappers over `lib/netatmo/netatmoProxy.ts`. Response shapes identical to what frontend already expects — confirmed by `useThermostatData` already consuming v1 successfully. No adapter work.

### Plan Structure (3 plans — mirror Phase 167)
- **D-15:** Three-plan wave structure:
  1. **Plan 168-01 (Wave 1):** Rewrite debug panel NetatmoTab (×2 files) — 42+42 URL swaps, drop `schedules` + 3 camera-param tiles, rewrite `calibrate` tile to `valves/calibrate`.
  2. **Plan 168-02 (Wave 2):** Rewrite production consumers — `registry/devices/page.tsx` (1 fetch), `camera/CameraCard.tsx` (JSDoc), `app/sw.ts` (delete dead branch), `app/thermostat/page.test.tsx` (4 mock URLs).
  3. **Plan 168-03 (Wave 3):** Delete `app/api/netatmo/` legacy tree + repo-wide grep sweep + Jest/Playwright smoke green.
- **D-16:** Alternative considered and rejected: single wave. Three waves picked to match 166/167 pattern and isolate risk — debug-panel churn (biggest diff-count) isolates from production-consumer churn, and deletion runs last so any missed ref surfaces via 404 before tree removal.

### Claude's Discretion
- Whether to refactor `app/debug/components/tabs/NetatmoTab.tsx` and `app/debug/api/components/tabs/NetatmoTab.tsx` into one shared component during cutover (they look near-identical). Recommended: leave separate this phase; collapse in a future dedupe phase.
- Exact wording of `app/sw.ts` cleanup comment.
- Whether to add a Playwright `@smoke` tag grep target during this phase (Phase 167 discovered the tag doesn't exist) — out of scope here; handle in a future test-harness phase.
- Order of sub-steps within each plan; plan 168-01 can touch both debug files in parallel or sequentially.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### API Specification
- `docs/api/netatmo.md` — Authoritative Netatmo API spec (all v1 endpoints, request/response DTOs)
- `docs/api/README.md` — API authentication patterns (X-API-Key)

### Existing V1 Routes (all already shipped by Phase 161 — read for pattern and to confirm no wrapper work remains)
- `app/api/v1/netatmo/health/route.ts`
- `app/api/v1/netatmo/homesdata/route.ts`
- `app/api/v1/netatmo/homestatus/route.ts`
- `app/api/v1/netatmo/getthermstate/route.ts` (NETA-01)
- `app/api/v1/netatmo/valves/route.ts`
- `app/api/v1/netatmo/valves/calibrate/route.ts` (NETA-02)
- `app/api/v1/netatmo/valves/[moduleId]/calibrate/route.ts` (NETA-03)
- `app/api/v1/netatmo/camera/status/route.ts`
- `app/api/v1/netatmo/camera/events/route.ts`
- `app/api/v1/netatmo/camera/events/[eventId]/snapshot/route.ts` (NETA-04)
- `app/api/v1/netatmo/camera/[cameraId]/stream/route.ts` (NETA-05)
- `app/api/v1/netatmo/camera/[cameraId]/snapshot/route.ts` (NETA-06)
- `app/api/v1/netatmo/camera/[cameraId]/monitoring/route.ts` (NETA-07)
- `app/api/v1/netatmo/renamehome/route.ts` (NETA-08)
- `app/api/v1/netatmo/gethomedata/route.ts` (NETA-09)
- `app/api/v1/netatmo/setroomthermpoint/route.ts`
- `app/api/v1/netatmo/setthermmode/route.ts`
- `app/api/v1/netatmo/switchhomeschedule/route.ts`
- `app/api/v1/netatmo/synchomeschedule/route.ts`
- `app/api/v1/netatmo/createnewhomeschedule/route.ts`
- `app/api/v1/netatmo/getroommeasure/route.ts`

### Legacy Route Tree (targets for D-12 deletion)
- `app/api/netatmo/health/route.ts`
- `app/api/netatmo/homesdata/route.ts`
- `app/api/netatmo/homestatus/route.ts`
- `app/api/netatmo/valves/route.ts`
- `app/api/netatmo/calibrate/route.ts` (superseded by v1 `valves/calibrate`)
- `app/api/netatmo/schedules/route.ts` (superseded by `homesdata.schedules`)
- `app/api/netatmo/setroomthermpoint/route.ts` + `__tests__/`
- `app/api/netatmo/setthermmode/route.ts` + `__tests__/`
- `app/api/netatmo/switchhomeschedule/route.ts`
- `app/api/netatmo/synchomeschedule/route.ts`
- `app/api/netatmo/createnewhomeschedule/route.ts`
- `app/api/netatmo/getroommeasure/route.ts`
- `app/api/netatmo/camera/status/route.ts`
- `app/api/netatmo/camera/events/route.ts`
- `app/api/netatmo/camera/events/[eventId]/snapshot/route.ts`
- `app/api/netatmo/camera/snapshot/route.ts` (no v1 equivalent at flat path — was legacy-only contract)
- `app/api/netatmo/camera/stream/route.ts` (same)
- `app/api/netatmo/camera/monitoring/route.ts` (same)

### Proxy Layer
- `lib/netatmo/netatmoProxy.ts` — Netatmo API proxy functions (all NETA-XX covered)
- `lib/netatmo/netatmoCameraApi.ts` — Camera-specific helpers
- `lib/netatmo/netatmoCalibrationService.ts` — Valve calibration service
- `lib/netatmo/netatmoWsAdapter.ts` — WS payload adapter (not touched in this phase)
- `types/netatmoProxy.ts` — DTOs

### Frontend Files to Modify
- `app/registry/devices/page.tsx` (D-05)
- `app/components/devices/camera/CameraCard.tsx` (D-06, comment only)
- `app/sw.ts` (D-07, delete dead branch)
- `app/thermostat/page.test.tsx` (D-08, 4 mock URL swaps)
- `app/debug/api/components/tabs/NetatmoTab.tsx` (D-09, D-10)
- `app/debug/components/tabs/NetatmoTab.tsx` (D-09, D-10)

### Prior Phase Context
- `.planning/phases/161-netatmo-gap-closure/` — Phase 161 created the 9 v1 routes that close NETA-01..NETA-09. This phase closes the orphan gap by migrating consumers.
- `.planning/phases/167-sonos-frontend-cutover/167-CONTEXT.md` — Direct structural template (3-plan wave shape, grep-sweep discipline, legacy-tree deletion protocol).
- `.planning/phases/166-hue-frontend-cutover/166-CONTEXT.md` — Earlier cutover reference; Phase 112 gap closure informed the "include debug panels" decision (D-09).
- `.planning/phases/112-hue-tech-debt/` — Precedent for including debug panels in cutover scope (vs leaving them stale).

### Core Utilities
- `lib/core` — `withAuthAndErrorHandler`, `success`, `parseJson` (used by v1 routes — reference only, no changes here)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- All 9 NETA requirements already have v1 route wrappers (Phase 161 output). Zero wrapper creation work.
- `useThermostatData` already consumes v1 URLs — no hook rewrite needed (diverges from Phase 167 where all 5 hooks needed rewriting).
- `lib/netatmo/netatmoProxy.ts`, `netatmoCameraApi.ts`, `netatmoCalibrationService.ts` — intact, no touching.
- Debug panel URL-copy/refresh/call pattern is established (rewrite-only, no new interactions).

### Established Patterns
- Debug tile URL rewrite: search-and-replace the `url=`, `copyUrlToClipboard(...)`, `copiedUrl === ...`, `onRefresh/onExecute` callback arguments in lockstep per tile.
- Legacy tree deletion (Phase 167 D-17): single `rm -rf app/api/<vendor>/` commit after all consumers migrated, then `grep -rn "/api/<vendor>/" app/ lib/ types/` returning zero, then full Jest suite, then Playwright smoke.
- Path-shape changes with new URL params (D-03) require either: (a) caller provides `cameraId` (production consumers do not currently call these endpoints), or (b) debug tile is dropped (D-10 chosen).

### Integration Points
- `useThermostatData` — already on v1, not touched.
- `useCameraData` / CameraCard — the live camera fetches (if any) must be verified during planning. Current grep shows only a JSDoc comment reference to legacy.
- `app/sw.ts` — one dead reference. Service worker cache rule structure is intact; just delete the stale branch.
- `app/thermostat/page.test.tsx` — this is a test file (not production runtime), but its mock URL constants are out of sync with real endpoints. Cutover brings both into alignment.
- No `lib/routes.ts` entry for Netatmo (Netatmo always used direct `/api/netatmo/*` strings).
- No command-palette (`lib/commands/*`) integration for Netatmo commands.

</code_context>

<specifics>
## Specific Ideas

- Netatmo differs from Sonos in that legacy URL touchpoints exist **outside hooks** — production pages (`registry/devices/page.tsx`), service worker (`app/sw.ts`), JSDoc comments (`CameraCard.tsx`), and debug panels (2 files). The hook layer is already on v1 via Phase 161. This inverts Phase 167's pattern (where hooks were the whole rewrite surface).
- `app/debug/api/components/tabs/NetatmoTab.tsx` and `app/debug/components/tabs/NetatmoTab.tsx` appear to be near-duplicates (same 42 `/api/netatmo/` count, same lines 54–190 match in the grep output). Rewrite each in lockstep so drift does not accumulate during this phase. Consolidation is a follow-up.
- The camera flat endpoints (`/api/netatmo/camera/snapshot`, `/stream`, `/monitoring`) were legacy-only shapes — v1 always requires `[cameraId]`. Since debug tiles have no cameraId input and no production code fetches these, drop the tiles (D-10) rather than invent a sentinel.
- `/api/netatmo/schedules` has no v1 route because `/api/v1/netatmo/homesdata` response includes a `schedules` array. Drop the tile rather than creating a redundant v1 wrapper.
- `/api/netatmo/calibrate` is the legacy bulk-calibrate endpoint; v1's `/api/v1/netatmo/valves/calibrate` is the semantic equivalent (D-04).
- `app/thermostat/page.test.tsx` uses hyphenated mock URLs (`homes-data`, `home-status`, `set-therm-mode`) that do not match the real snake-case endpoints. Aligning them during cutover fixes a latent test-smell and lands zero-cost.

</specifics>

<deferred>
## Deferred Ideas

- Dedupe `app/debug/api/components/tabs/NetatmoTab.tsx` and `app/debug/components/tabs/NetatmoTab.tsx` into one shared component — structural dedupe, not scope of this phase.
- Add `cameraId` selector to debug panel to restore `/api/v1/netatmo/camera/[cameraId]/{snapshot,stream,monitoring}` coverage — future debug-panel UX phase.
- Add Playwright `@smoke` tag system to the repo (discovered missing in Phase 167) — future test-harness phase.
- Recreate a v1 `schedules` endpoint if a consumer ever needs the array in isolation (currently available via `homesdata.schedules`).

</deferred>

---

*Phase: 168-netatmo-frontend-cutover*
*Context gathered: 2026-04-20*
*Auto-mode decisions — user review recommended before planning*
