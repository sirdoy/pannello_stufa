# Phase 166: Hue Frontend Cutover - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrate all frontend Hue consumers (`useLightsData`, `useLightsCommands`, `app/lights/page.tsx`, `app/lights/scenes/page.tsx`, scene modals, debug panels) from legacy `/api/hue/*` paths to canonical `/api/v1/hue/*` paths. Create 2 missing v1 list routes (lights, scenes). Delete legacy `/api/hue/*` route tree. Firebase command logging already exists server-side in v1 write routes.

</domain>

<decisions>
## Implementation Decisions

### Missing V1 Routes
- **D-01:** Create `app/api/v1/hue/lights/route.ts` (GET — list all lights) mirroring `app/api/hue/lights/route.ts` but using `withAuthAndErrorHandler` + `getLights()` proxy function
- **D-02:** Create `app/api/v1/hue/scenes/route.ts` (GET — list all scenes) mirroring `app/api/hue/scenes/route.ts` but using `withAuthAndErrorHandler` + `getScenes()` proxy function

### URL Mapping (legacy → v1)
- **D-03:** Direct rewrite in hooks and pages — same mechanical pattern as thermorossi cutover (Phase 164)
- **D-04:** Path mapping:
  - `/api/hue/status` → `/api/v1/hue/health`
  - `/api/hue/lights` → `/api/v1/hue/lights`
  - `/api/hue/lights/${id}` GET → `/api/v1/hue/lights/${id}`
  - `/api/hue/lights/${id}` PUT → `/api/v1/hue/lights/${id}/state` (path split: GET vs PUT now separate routes)
  - `/api/hue/rooms` → `/api/v1/hue/groups`
  - `/api/hue/rooms/${id}` PUT → `/api/v1/hue/groups/${id}/action`
  - `/api/hue/scenes` → `/api/v1/hue/scenes`
  - `/api/hue/groups/${gid}/scenes/${sid}` POST → `/api/v1/hue/groups/${gid}/scenes/${sid}`

### Firebase Command Logging
- **D-05:** No frontend changes needed — v1 write routes (`lights/[lightId]/state`, `groups/[groupId]/action`, `groups/[groupId]/scenes/[sceneId]`) already call `adminDbPush('log', ...)` server-side. Cutover inherits logging automatically.

### Frontend Files to Rewrite
- **D-06:** Hooks: `useLightsData.ts` (6 fetch calls), `useLightsCommands.ts` (4 execute calls)
- **D-07:** Pages: `app/lights/page.tsx` (3 fetch calls), `app/lights/scenes/page.tsx` (3 fetch calls)
- **D-08:** Scene modals: `CreateSceneModal.tsx` (1 call), `EditSceneModal.tsx` (1 call)
- **D-09:** Debug panels: `app/debug/components/tabs/HueTab.tsx` + `app/debug/api/components/tabs/HueTab.tsx` (both identical, ~15 URL refs each)
- **D-10:** Debug panel tests: both `__tests__/HueTab.test.tsx` files (3 assertions each)

### Legacy Route Cleanup
- **D-11:** Delete entire `app/api/hue/` directory tree after frontend cutover confirmed. Includes: status, lights, lights/[id], rooms, rooms/[id], scenes, groups/[groupId]/scenes/[sceneId], history routes + all __tests__
- **D-12:** `lights/page.tsx` currently does PUT to `/api/hue/lights/${lightId}` — must split to separate GET (read) and PUT (state) calls since v1 separates these into `/api/v1/hue/lights/[lightId]` and `/api/v1/hue/lights/[lightId]/state`

### Claude's Discretion
- Response shape alignment if v1 routes return slightly different JSON structure than legacy
- Test assertion updates for changed URLs
- Order of operations (create missing routes first, then rewrite frontend, then delete legacy)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### API Specification
- `docs/api/hue.md` — Authoritative Hue API spec with all endpoints, request/response shapes
- `docs/api/README.md` — API authentication patterns (X-API-Key)

### Existing V1 Routes (pattern reference)
- `app/api/v1/hue/health/route.ts` — Health endpoint pattern
- `app/api/v1/hue/lights/[lightId]/route.ts` — Single light GET pattern
- `app/api/v1/hue/lights/[lightId]/state/route.ts` — Light state PUT with adminDbPush logging
- `app/api/v1/hue/groups/[groupId]/action/route.ts` — Group action PUT with adminDbPush logging
- `app/api/v1/hue/groups/[groupId]/scenes/[sceneId]/route.ts` — Scene activation POST with adminDbPush

### Frontend Files to Modify
- `app/components/devices/lights/hooks/useLightsData.ts` — Primary data hook (WS + polling)
- `app/components/devices/lights/hooks/useLightsCommands.ts` — Command hook (room toggle, brightness, scenes)
- `app/lights/page.tsx` — Lights detail page with per-light controls
- `app/lights/scenes/page.tsx` — Scene management page
- `app/components/lights/CreateSceneModal.tsx` — Scene creation modal
- `app/components/lights/EditSceneModal.tsx` — Scene edit modal
- `app/debug/components/tabs/HueTab.tsx` — Debug panel (legacy paths)
- `app/debug/api/components/tabs/HueTab.tsx` — API debug panel (legacy paths)

### Prior Phase Context
- `.planning/phases/159-hue-gap-closure/159-CONTEXT.md` — Phase 159 created v1 routes; D-01 says "do NOT delete old /api/hue/* routes" — this phase reverses that by completing the cutover and deleting legacy

### Proxy Layer
- `lib/hue/hueProxy.ts` — All proxy functions (getLights, getGroups, getScenes, etc.)
- `types/hueProxy.ts` — All Hue TypeScript types

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/hue/hueProxy.ts`: Complete proxy layer — getLights(), getGroups(), getScenes(), getHealth(), setLightState(), setGroupAction(), activateScene()
- `lib/core`: withAuthAndErrorHandler, getPathParam, parseJson — standard route wrappers
- `lib/hue/hueWsAdapter.ts`: adaptWsLights/adaptWsGroups — WebSocket adapters (not affected by URL change)

### Established Patterns
- v1 routes: `export const dynamic = 'force-dynamic'` + `withAuthAndErrorHandler` wrapper + proxy function delegation
- Write routes: 202 Accepted + `suggested_poll_delay_s` + `adminDbPush` logging
- Frontend hooks: WS-primary + polling-fallback pattern (interval = isWsConnected ? null : pollInterval)

### Integration Points
- `useLightsData` checkConnection: `/api/hue/status` → `/api/v1/hue/health` (response shape may differ: `connected`/`data_freshness` vs health endpoint format)
- `useLightsCommands` room toggle/brightness: `/api/hue/rooms/${groupId}` PUT → `/api/v1/hue/groups/${groupId}/action` PUT
- `lights/page.tsx` per-light PUT: `/api/hue/lights/${id}` PUT → `/api/v1/hue/lights/${id}/state` PUT (path split)

</code_context>

<specifics>
## Specific Ideas

- Path split for lights: legacy `/api/hue/lights/[id]` handles both GET and PUT; v1 separates GET (`/lights/[lightId]`) from PUT (`/lights/[lightId]/state`). Frontend PUT calls must target `/state` sub-path.
- Health response shape: verify that v1 `/api/v1/hue/health` returns same `{ connected, data_freshness }` fields that `useLightsData.checkConnection()` expects, or adapt the hook.
- Two identical HueTab files exist (debug/components/tabs and debug/api/components/tabs) — both need updating.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 166-hue-frontend-cutover*
*Context gathered: 2026-04-16*
