# Phase 107: Control Endpoints - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Add control endpoint wrappers to the Hue proxy client and migrate the three existing write routes (light state, group action, scene activate) from direct Bridge API (CLIP v2) to the HomeAssistant proxy. All control endpoints return 202 Accepted with suggested_poll_delay_s. Frontend hooks are a separate phase (108).

</domain>

<decisions>
## Implementation Decisions

### Command wrapper design
- Add to existing `lib/hue/hueProxy.ts` — three new exports: `setLightState`, `setGroupAction`, `activateScene`
- `setLightState(lightId, body)` → `haPut<HueCommandResponse>('/api/v1/hue/lights/{lightId}/state', body)`
- `setGroupAction(groupId, body)` → `haPut<HueCommandResponse>('/api/v1/hue/groups/{groupId}/action', body)`
- `activateScene(groupId, sceneId)` → `haPost<HueCommandResponse>('/api/v1/hue/groups/{groupId}/scenes/{sceneId}', {})`
- Note: light state and group action use PUT (not POST) — check if haClient has `haPut` or need to add it

### Response and request types
- Add `HueLightStateRequest` interface to `types/hueProxy.ts` — fields: `on?`, `bri?`, `ct?`, `hue?`, `sat?`, `effect?`, `alert?` (v1 flat format, not CLIP v2 nested objects)
- Add `HueCommandResponse` interface to `types/hueProxy.ts` — fields: `command`, `status`, `suggested_poll_delay_s`, `poll_endpoint` + endpoint-specific fields (`light_id`/`group_id`/`scene_id`, `requested_state`)
- Body format is v1 flat: `{ on: true, bri: 200, ct: 370 }` — NOT CLIP v2 `{ on: { on: true }, dimming: { brightness: 80 } }`

### Route rewrite strategy
- **lights/[id]/route.ts PUT**: Rewrite to use `setLightState` via hueProxy — replace HueConnectionStrategy + CLIP v2 body format
- **rooms/[id]/route.ts PUT**: Rewrite to use `setGroupAction` via hueProxy — replace HueConnectionStrategy + CLIP v2 body format
- **Scene activation path change**: Old path was `PUT scenes/[id]/activate` — new path is `POST groups/[gid]/scenes/[sid]`. Create new route at `app/api/hue/groups/[groupId]/scenes/[sceneId]/route.ts` with POST handler
- Old scene activate route (`scenes/[id]/activate/route.ts`) left in place until Phase 109 cleanup (or can be deleted now since route path changes)
- All migrated routes use `withAuthAndErrorHandler` (not `withHueHandler` which depends on HueConnectionStrategy)

### 202 Accepted response pattern
- Routes return `NextResponse.json(proxyResponse, { status: 202 })` — pass through proxy's 202 response body
- Response includes `suggested_poll_delay_s` (typically 2) and `poll_endpoint` — frontend uses these for delayed refresh (Phase 108)
- Fire-and-forget: no logging change needed, existing adminDbPush logging pattern preserved

### Error handling
- 409 Conflict from proxy (light unreachable) — let haClient throw ApiError, route catches and returns 409 to frontend with `error: "light_unreachable"` detail
- 409 only applies to light state (PUT /lights/{id}/state) — group actions skip unreachable members silently
- 422 from proxy (empty body or invalid values) — pass through as 422
- 502/503/504 from proxy — haClient maps these to ApiError automatically
- No idempotency keys needed for Hue commands (Hue is idempotent by nature — setting state twice is harmless)

### Body format migration
- Current routes accept CLIP v2 body: `{ on: { on: boolean }, dimming: { brightness: number } }`
- New routes accept v1 flat body: `{ on: boolean, bri: number, ct: number }` — matching proxy API spec
- This is a breaking change for frontend callers — Phase 108 hooks will send v1 format
- During Phase 107, the routes expect v1 format. Frontend calls will break until Phase 108 completes

### Logging
- Preserve existing `adminDbPush('log', ...)` pattern for audit trail
- Adapt log extraction for v1 body format: `body.on` (boolean) instead of `body.on.on`, `body.bri` instead of `body.dimming.brightness`

### Claude's Discretion
- Whether to add `haPut` to haClient.ts or reuse haPost with method override
- Unit test structure for control wrappers
- Whether to delete old scene activate route now or defer to Phase 109

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Hue Proxy API (control endpoints)
- `docs/api/hue.md` §Control Endpoints — PUT /lights/{id}/state, PUT /groups/{id}/action request/response shapes, 409 Conflict handling, HueLightStateRequest interface
- `docs/api/hue.md` §Scenes — POST /groups/{gid}/scenes/{sid} activation endpoint, 202 response shape
- `docs/api/hue.md` §Polling After Commands — suggested_poll_delay_s and poll_endpoint pattern
- `docs/api/README.md` — API authentication patterns (X-API-Key header)

### Existing Phase 106 code (foundation)
- `lib/hue/hueProxy.ts` — Current read wrappers, add control wrappers here
- `types/hueProxy.ts` — Current type definitions, add HueLightStateRequest and HueCommandResponse here
- `lib/haClient.ts` — Shared transport: haGet<T>/haPost<T> — check if haPut exists or needs adding

### Routes to migrate (current legacy implementation)
- `app/api/hue/lights/[id]/route.ts` — PUT handler uses HueConnectionStrategy + CLIP v2 body format
- `app/api/hue/rooms/[id]/route.ts` — PUT handler uses HueConnectionStrategy + CLIP v2 body format + withIdempotency
- `app/api/hue/scenes/[id]/activate/route.ts` — PUT handler uses HueConnectionStrategy (scene activation)

### Established patterns (reference implementations)
- `lib/thermorossiProxy.ts` — Command wrappers pattern (sendIgnit, setPower, etc.) using haPost

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/hue/hueProxy.ts`: Phase 106 read wrappers — add control wrappers in COMMAND WRAPPERS section
- `types/hueProxy.ts`: Phase 106 type definitions — add request/response types
- `lib/haClient.ts`: haGet/haPost shared transport — may need haPut for PUT endpoints
- `lib/core/apiErrors.ts`: ApiError class with ERROR_CODES for error mapping
- `lib/core/index.ts`: withAuthAndErrorHandler, success, getPathParam, parseJson utilities

### Established Patterns
- Thermorossi command wrappers: `haPost<ThermorossiCommandResponse>('/api/v1/thermorossi/commands/ignit', {})` — 202 Accepted pattern
- Route migration: Phase 106 rewrote GET handlers using `withAuthAndErrorHandler` replacing `withHueHandler`
- Body format: proxy uses v1 flat keys (`on`, `bri`, `ct`) — not CLIP v2 nested objects

### Integration Points
- `app/api/hue/lights/[id]/route.ts`: PUT handler — existing CLIP v2 body format, uses HueConnectionStrategy
- `app/api/hue/rooms/[id]/route.ts`: PUT handler — existing CLIP v2 body format, uses HueConnectionStrategy + withIdempotency
- `app/api/hue/scenes/[id]/activate/route.ts`: PUT handler — uses HueConnectionStrategy
- New route needed: `app/api/hue/groups/[groupId]/scenes/[sceneId]/route.ts` — POST handler for scene activation (new path pattern)
- Frontend hooks (`useLightsCommands.ts`) will call these routes — body format change is a breaking change resolved in Phase 108

</code_context>

<specifics>
## Specific Ideas

No specific requirements — follows the exact same pattern as Thermorossi (v13.0 Phase 100) proxy command migration. The proxy API doc (docs/api/hue.md) provides all request/response shapes with verified TypeScript interfaces. Key difference from Thermorossi: Hue uses PUT for state control (not POST), and has 409 Conflict for unreachable lights.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 107-control-endpoints*
*Context gathered: 2026-03-20*
