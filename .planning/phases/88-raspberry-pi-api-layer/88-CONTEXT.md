# Phase 88: Raspberry Pi API Layer - Context

**Gathered:** 2026-03-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Create proxy client functions, TypeScript types, and Next.js API routes for all Raspberry Pi endpoints (health, cpu, memory, disk, system). The server side can reach and type all Raspberry Pi endpoints — routes ready for frontend consumption. Dashboard card and dedicated page are separate phases (89, 90).

</domain>

<decisions>
## Implementation Decisions

### Client module structure
- Function module pattern with exported convenience wrappers calling `haGet` internally — matches Fritz!Box (Phase 85) and Netatmo (Phase 86) patterns
- Export as object with methods: `raspiClient.getHealth()`, `raspiClient.getCpu()`, `raspiClient.getMemory()`, `raspiClient.getDisk()`, `raspiClient.getSystem()`
- File location: `lib/raspi/raspiClient.ts` with barrel `lib/raspi/index.ts`
- No response transformation needed — Raspberry Pi API responses are already clean (unlike Fritz!Box which needed status→active, bps→Mbps conversions)
- All endpoints are GET-only (no POST needed for Raspberry Pi)

### API route design
- 5 routes matching the 5 HA proxy endpoints: health, cpu, memory, disk, system
- Route path: `/api/raspi/[endpoint]` — consistent with `/api/fritzbox/` and `/api/netatmo/` patterns
- All routes use `withAuthAndErrorHandler` wrapper and `success()` response helper
- All routes set `export const dynamic = 'force-dynamic'` (live data, no caching)
- No caching layer needed — Raspberry Pi data is collected live via psutil on each request (no database, no staleness concept)
- No rate limiting needed — data is local to the HA server, no external API throttling

### Type organization
- Types file: `types/raspi.ts` — mirrors `types/haClient.ts` and `types/netatmoProxy.ts` patterns
- Interfaces match API response schemas exactly from `docs/api/raspberry-pi.md`:
  - `RaspiHealthResponse` — status + data_freshness
  - `CpuResponse` — cpu_percent + data_freshness
  - `MemoryResponse` — used_bytes, total_bytes, percent + data_freshness
  - `DiskResponse` — used_bytes, total_bytes, percent, mount_point + data_freshness
  - `SystemResponse` — cpu_temperature, uptime_seconds, load averages, process_count, network + data_freshness
  - `NetworkStats` — bytes_sent, bytes_recv, interface (nested in SystemResponse)

### Health endpoint behavior
- Minimal transformation — return status and data_freshness
- Consistent with Fritz!Box health route pattern (`fritzboxClient.ping()` → status transformation)

### Claude's Discretion
- Whether to include a `ping()` convenience method (like Fritz!Box) or just use `getHealth()`
- Exact error messages for Raspberry Pi-specific failures
- Whether routes need any response enrichment beyond raw proxy data

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Raspberry Pi API specification
- `docs/api/raspberry-pi.md` — Complete endpoint documentation: 5 endpoints (health, cpu, memory, disk, system), response schemas, TypeScript interfaces, authentication requirements

### Shared transport (Phase 84)
- `lib/haClient.ts` — Shared `haGet<T>` and `haPost<T>` with X-API-Key auth, AbortController timeout, RFC 9457 error mapping
- `types/haClient.ts` — `RFC9457ProblemDetail` and `HaRequestOptions` types

### Fritz!Box client reference (Phase 85)
- `lib/fritzbox/fritzboxClient.ts` — Completed migration to haGet — reference pattern for client module structure (object with methods)
- `lib/fritzbox/index.ts` — Barrel export pattern

### API route reference
- `app/api/fritzbox/health/route.ts` — Reference pattern for health route (withAuthAndErrorHandler + success)
- `app/api/fritzbox/wan/route.ts` — Reference pattern for data route

### Core utilities
- `lib/core/apiErrors.ts` — `ApiError`, `ERROR_CODES`, `HTTP_STATUS` used by haClient error mapping
- `lib/core/index.ts` — `withAuthAndErrorHandler`, `success` used by all API routes

### Device registry
- `lib/devices/deviceTypes.ts` — Device type registry (Phase 89 will add 'raspi' here, not this phase)

### HA proxy API overview
- `docs/api/README.md` — HA proxy authentication and base URL documentation

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/haClient.ts` (`haGet<T>`): Direct transport for all Raspberry Pi GET calls — handles auth, timeout, error mapping automatically
- `lib/fritzbox/fritzboxClient.ts`: Reference implementation — object with methods pattern, each calling `haGet` with typed generics
- `lib/core` (`withAuthAndErrorHandler`, `success`): Route handler wrapper used by all existing API routes

### Established Patterns
- Function module with object export: `export const raspiClient = { getHealth, getCpu, ... }` — matches `fritzboxClient` pattern
- Barrel re-export: `lib/raspi/index.ts` exports `raspiClient` for clean route imports
- Routes import from barrel: `import { raspiClient } from '@/lib/raspi'`
- All routes: `export const dynamic = 'force-dynamic'` + `withAuthAndErrorHandler` wrapper
- Types alongside client: separate `types/raspi.ts` file with response interfaces

### Integration Points
- `app/api/raspi/` — New route directory (5 routes)
- `lib/raspi/` — New client module directory
- `types/raspi.ts` — New types file
- Endpoint paths: `/api/v1/raspi/health`, `/api/v1/raspi/cpu`, `/api/v1/raspi/memory`, `/api/v1/raspi/disk`, `/api/v1/raspi/system`

</code_context>

<specifics>
## Specific Ideas

No specific requirements — straightforward new client following the established Fritz!Box pattern from Phase 85. The Raspberry Pi API is simpler than Fritz!Box (all GET, no transformations needed, no caching/rate-limiting) making this the most mechanical of the three provider implementations.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 88-raspberry-pi-api-layer*
*Context gathered: 2026-03-17*
