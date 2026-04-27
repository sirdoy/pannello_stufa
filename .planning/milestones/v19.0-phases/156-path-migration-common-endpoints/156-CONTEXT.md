# Phase 156: Path Migration & Common Endpoints - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrate all thermorossi API routes from `/api/stove/*` to `/api/v1/thermorossi/*` following the documented path structure, update all frontend references, and create two cross-provider aggregate endpoints: unified health and aggregated device list.

</domain>

<decisions>
## Implementation Decisions

### Migration Strategy
- **D-01:** Remove old `/api/stove/*` routes entirely after creating new `/api/v1/thermorossi/*` routes. No redirects — the success criteria requires 404 on old paths, and this is a local PWA with no external consumers.
- **D-02:** The service worker (`app/sw.ts`) references `/api/stove/status` and must be updated to the new path.

### Path Mapping
- **D-03:** Follow `docs/api/thermorossi.md` path structure exactly. Current route names differ significantly from the documented API:
  - `GET /api/stove/status` → `GET /api/v1/thermorossi/status`
  - `GET /api/stove/health` → `GET /api/v1/thermorossi/health`
  - `GET /api/stove/getPower` → `GET /api/v1/thermorossi/power`
  - `GET /api/stove/getFan` → `GET /api/v1/thermorossi/fan-level`
  - `GET /api/stove/history` → `GET /api/v1/thermorossi/history`
  - `POST /api/stove/ignite` → `POST /api/v1/thermorossi/commands/ignit`
  - `POST /api/stove/shutdown` → `POST /api/v1/thermorossi/commands/shutdown`
  - `POST /api/stove/setPower` → `POST /api/v1/thermorossi/settings/power`
  - `POST /api/stove/setFan` → `POST /api/v1/thermorossi/settings/fan-level`
  - `POST /api/stove/setWaterTemperature` → `POST /api/v1/thermorossi/settings/temperature/water`
- **D-04:** The proxy client (`lib/stove/thermorossiProxy.ts`) itself does NOT change — it calls the HA proxy, not the Next.js routes. Only the Next.js route file locations and frontend fetch paths change.

### Aggregated Health
- **D-05:** `GET /health` replaces the current simple connectivity check with an aggregated status covering all 8 registered providers (Thermorossi, Netatmo, Fritz!Box, Raspberry Pi, Hue, Sonos, DIRIGERA, Tuya). Each provider contributes its health status to the response.
- **D-06:** The existing `/api/health` route stays as-is for backward compatibility (simple connectivity check). The new aggregated health is at `GET /health` as documented in `docs/api/README.md` Common module.

### Aggregated Devices
- **D-07:** `GET /api/v1/devices` returns a unified device list combining all providers. This is a new route — the existing `/api/devices/config` and `/api/devices/preferences` are unrelated (device registry config).

### Claude's Discretion
- Response shapes for /health and /api/v1/devices — follow whatever the HA proxy returns or match documented shapes in docs/api/
- Error handling patterns — use existing `withErrorHandler` + `success()` pattern from `lib/core`
- Test file organization — follow existing patterns

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Thermorossi API
- `docs/api/thermorossi.md` — Defines all 10 endpoint paths, request/response shapes, and state gating table
- `docs/api/scheduler.md` — Thermorossi scheduler endpoints (excluded from this phase but shares the `/api/v1/thermorossi` prefix)

### Common Endpoints
- `docs/api/README.md` §Platform Modules — Defines Common module with /health and /api/v1/devices

### API Patterns
- `docs/api-routes.md` — Project API route conventions and patterns

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/stove/thermorossiProxy.ts` — Proxy client for Thermorossi, calls HA proxy. Does NOT need changes (it talks to HA, not Next.js routes).
- `lib/core` — `withErrorHandler`, `success()`, `noContent()` for API route boilerplate
- `lib/hooks/useRetryableCommand.ts` — References `/api/stove/` in JSDoc example (update needed)
- `lib/commands/deviceCommands.tsx` — Stove command paths (update needed)

### Files Requiring Updates (22 references to /api/stove/)
- **API routes (delete old, create new):** `app/api/stove/` — 10 route files
- **Frontend hooks/commands:** `lib/commands/deviceCommands.tsx` (fetch calls), `lib/hooks/useRetryableCommand.ts` (JSDoc only)
- **Debug panels:** `app/debug/components/tabs/StoveTab.tsx`, `app/debug/api/components/tabs/StoveTab.tsx`
- **Service worker:** `app/sw.ts` (2 references to `/api/stove/status`)
- **Tests:** `__tests__/components/devices/stove/hooks/useStoveData.test.ts`, `useStoveCommands.test.ts`, `useRetryableCommand.test.ts`, `idempotencyManager.test.ts`
- **Changelog (skip):** `lib/version.ts` — historical changelog strings, do NOT update
- **API response types:** `types/api/responses.ts`

### Established Patterns
- API routes use `withErrorHandler` wrapper + `success()` response helper
- `export const dynamic = 'force-dynamic'` on all API routes
- Proxy clients are function modules in `lib/{provider}/` calling `haGet`/`haPost`/`haPut`/`haDelete`
- Provider health routes exist per-provider (e.g., `/api/fritzbox/health`, `/api/hue/health`)

### Integration Points
- `app/api/v1/` directory doesn't exist yet — this phase creates the first routes under it
- Device registry (`app/api/registry/`, `lib/registry/registryProxy.ts`) may provide device data for aggregated /api/v1/devices
- Each provider has its own proxy health function that can be called for aggregated /health

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches following the documented API structure.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 156-path-migration-common-endpoints*
*Context gathered: 2026-04-07*
