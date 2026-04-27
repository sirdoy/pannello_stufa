# Phase 159: Hue Gap Closure - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Create canonical `/api/v1/hue/*` routes for all 10 Hue endpoints (health, lights list, single light GET/PUT, groups list, single group, group action, scene activation, scenes list, history). Fill the 3 missing route gaps (groups listing, single group, group action) that have proxy functions but no Next.js routes.

</domain>

<decisions>
## Implementation Decisions

### Route Migration Strategy
- **D-01:** Create new route files under `app/api/v1/hue/` following the established proxy pattern (withAuthAndErrorHandler + proxy function call). Do NOT move or delete old `/api/hue/*` routes — those remain for backwards compatibility.
- **D-02:** All new v1 routes follow the same structure as `app/api/v1/thermorossi/` routes: `export const dynamic = 'force-dynamic'`, `withAuthAndErrorHandler` wrapper, proxy function delegation.

### Missing Group Routes
- **D-03:** Create `app/api/v1/hue/groups/route.ts` (GET — calls `getGroups()`) — no existing old-path equivalent
- **D-04:** Create `app/api/v1/hue/groups/[groupId]/route.ts` (GET — calls `getGroup(groupId)`) — no existing old-path equivalent
- **D-05:** Create `app/api/v1/hue/groups/[groupId]/action/route.ts` (PUT — calls `setGroupAction(groupId, body)`) with Firebase log and 202 response — no existing old-path equivalent

### Test Strategy
- **D-06:** Each new v1 route gets a `__tests__/route.test.ts` co-located test file, adapting patterns from existing `app/api/hue/lights/__tests__/route.test.ts` and similar.

### Claude's Discretion
- Log messages for group action commands (Italian descriptions like existing light commands)
- Test assertion granularity and mock structure
- Whether to wrap response in `{ groups: data }` or return array directly (follow existing lights pattern: `{ lights: data }`)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### API Specification
- `docs/api/hue.md` — Authoritative Hue API spec with all 10 endpoints, request/response shapes, and field verification status
- `docs/api/README.md` — API authentication patterns (JWT Bearer, X-API-Key)

### Existing Implementation (patterns to follow)
- `lib/hue/hueProxy.ts` — All proxy functions already exist (getHealth, getLight, getLights, getGroups, getGroup, getScenes, setLightState, setGroupAction, activateScene, getHistory)
- `types/hueProxy.ts` — All TypeScript types already defined (HueLight, HueGroup, HueScene, HueBridgeHealth, HueHistoryResponse, HueLightStateRequest, HueCommandResponse)
- `app/api/v1/thermorossi/health/route.ts` — Reference pattern for v1 health routes
- `app/api/hue/lights/[id]/route.ts` — Reference pattern for single-resource GET + PUT with Firebase logging

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/hue/hueProxy.ts`: All 9 proxy functions already implemented — routes just need to call them
- `types/hueProxy.ts`: Complete type coverage — no new types needed
- `lib/core`: `withAuthAndErrorHandler`, `success`, `getPathParam`, `parseJson` utilities
- `lib/firebaseAdmin`: `adminDbPush` for action logging
- `lib/devices/deviceTypes`: `DEVICE_TYPES.LIGHTS` constant

### Established Patterns
- v1 route structure: `app/api/v1/{provider}/{resource}/route.ts`
- Auth wrapper: `withAuthAndErrorHandler(async (request, context) => { ... }, 'Tag')`
- Read routes: `success(data as unknown as Record<string, unknown>)`
- Command routes: `NextResponse.json(proxyResponse, { status: 202 })`
- Path params: `await getPathParam(context, 'paramName')`
- Firebase logging: `adminDbPush('log', { action, device, timestamp, source: 'manual' })`

### Integration Points
- Old routes at `app/api/hue/*` continue to work (no frontend migration needed in this phase)
- New v1 routes are for HA proxy alignment — frontend can migrate later
- Groups routes are net-new (no old-path equivalent exists)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. The phase is straightforward: create v1 route wrappers around existing proxy functions.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 159-hue-gap-closure*
*Context gathered: 2026-04-09*
