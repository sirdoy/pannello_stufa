# Phase 147: Tuya Infrastructure - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Server-side Tuya smart plug integration: a `tuyaProxy.ts` function module with haGet/haPost transport, and 6 API route proxies that the frontend hooks can consume in Phase 148. No frontend work in this phase.

</domain>

<decisions>
## Implementation Decisions

### Response Mapping
- **D-01:** POST command routes (`/state`, `/timer`) return **200 pass-through** (not 202 Accepted). The Tuya backend returns 200 with a `data_confirmed` boolean that signals whether the re-poll succeeded, which is a different confirmation pattern from Thermorossi's fire-and-forget 202. Pass through the upstream status code.

### Route Organization
- **D-02:** Routes nest under `app/api/tuya/` matching the upstream API path structure: `health/route.ts`, `plugs/route.ts`, `plugs/[device_id]/route.ts`, `plugs/[device_id]/state/route.ts`, `plugs/[device_id]/timer/route.ts`, `plugs/[device_id]/history/route.ts`.

### Error Handling
- **D-03:** Upstream 503 (UNREACHABLE device) is mapped through haClient's standard RFC 9457 error mapping to `ApiError(SERVICE_UNAVAILABLE)`. No custom error handling needed beyond what haClient already provides.

### Health Endpoint Auth
- **D-04:** `GET /api/tuya/health` calls `haGet` without auth requirement on the Next.js side (the upstream endpoint requires no auth). All other routes require standard session auth via middleware.

### Proxy Client Pattern
- **D-05:** `lib/tuya/tuyaProxy.ts` function module following the established pattern (sonosProxy, dirigeraProxy, hueProxy). Imports `haGet`/`haPost` from `@/lib/haClient`. Types already exist in `types/tuyaProxy.ts`.

### Claude's Discretion
- JSDoc comment depth and internal helper organization within tuyaProxy.ts
- Whether to export individual route handlers or use inline handlers (follow whichever pattern is most common in recent providers)
- Test file organization (co-located vs `__tests__/lib/`)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Tuya API Specification
- `docs/api/tuya.md` -- Authoritative API spec with all 6 endpoints, request/response shapes, error codes, and TypeScript interfaces

### Existing Types
- `types/tuyaProxy.ts` -- All TypeScript interfaces already created in Phase 145 (TuyaPlug, TuyaPlugMutation, TuyaHealth, TuyaHistoryResponse, etc.)

### Shared Transport
- `lib/haClient.ts` -- Shared haGet/haPost/haPut transport with X-API-Key auth, RFC 9457 error mapping, timeout handling

### Reference Implementations (proxy client pattern)
- `lib/sonos/sonosProxy.ts` -- Most recent and comprehensive proxy client (28 functions, read+write+history)
- `lib/hue/hueProxy.ts` -- Proxy client with haPut for command wrappers

### WebSocket Types
- `docs/api/websocket.md` -- WS topic reference (tuya topic already declared)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/haClient.ts`: haGet/haPost transport -- all proxy functions are thin wrappers around these
- `types/tuyaProxy.ts`: All 8 TypeScript interfaces already exist (TuyaPlug, TuyaPlugMutation, TuyaHealth, TuyaDeviceHealth, TuyaHistoryItem, TuyaHistoryResponse, TuyaSetStateRequest, TuyaSetTimerRequest)
- `lib/core/apiErrors.ts`: ApiError class and ERROR_CODES/HTTP_STATUS constants

### Established Patterns
- Function module proxy: each provider has a `{name}Proxy.ts` with named exports wrapping haGet/haPost calls
- API routes: `export const dynamic = 'force-dynamic'` + JSON response helpers
- Route path matches upstream API path (e.g., `/api/v1/sonos/health` -> `app/api/sonos/health/route.ts`)
- Types imported from `@/types/{name}Proxy`

### Integration Points
- `app/api/tuya/` directory (does not exist yet -- needs creation)
- `lib/tuya/` directory (does not exist yet -- needs creation)
- Upstream base path: `/api/v1/tuya/...` on HA proxy

</code_context>

<specifics>
## Specific Ideas

No specific requirements -- follows the well-established proxy client + route pattern used by all 7 existing providers.

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope.

</deferred>

---

*Phase: 147-tuya-infrastructure*
*Context gathered: 2026-03-30*
