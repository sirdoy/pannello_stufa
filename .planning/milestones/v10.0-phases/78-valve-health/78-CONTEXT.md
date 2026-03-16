# Phase 78: Valve + Health - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Dedicated valve status from proxy `/valves` endpoint, valve calibration via proxy `/valves/calibrate` (replacing the OAuth-based schedule-switching workaround), and health monitoring from proxy `/health` — replacing custom token checks. Frontend gets valve badges in RoomCards and a health indicator on ThermostatCard + debug page.

</domain>

<decisions>
## Implementation Decisions

### Calibration migration
- All-valves calibration only: use `POST /valves/calibrate` (no per-valve `/valves/{module_id}/calibrate`)
- Fire-and-forget: show toast "Calibrazione avviata" on HTTP 202, no polling for completion
- Migrate both manual route (`app/api/netatmo/calibrate/route.ts`) AND cron auto-calibration (`netatmoCalibrationService.ts`) to use proxy endpoint
- Rewrite `netatmoCalibrationService.ts` to call `netatmoProxyPost('/valves/calibrate')` directly (no HTTP self-call)
- Failure-only logging: `adminDbPush` on errors only, no success logging (proxy handles its own audit)
- CalibrationModal frontend stays as single "calibrate all" button

### Valve status display
- New dedicated API route: `GET /api/netatmo/valves` → proxy `GET /valves`
- Valve badges surface in existing RoomCard components (battery, signal strength)
- Battery string mapping: high→green, medium→yellow, low→orange, very_low→red — extend BatteryWarning component
- Subtle unreachable indicator on affected RoomCards when `reachable: false`
- Fetched separately from homestatus (parallel request, not merged)

### Health dashboard integration
- Replace OAuth info in debug NetatmoTab with proxy health data (token_status, data_freshness, rate_limit_usage, consecutive_failures, last_poll_at)
- Add subtle health indicator dot on ThermostatCard: green (ok+LIVE), yellow (STALE or failures>0), red (UNREACHABLE or provider not ok)
- Health data polled at ~60s frequency via `useAdaptivePolling` for dashboard dot
- New API route: `GET /api/netatmo/health` → proxy `GET /health`

### Cron health check migration
- Cron calls proxy `GET /health` every run, writes snapshot to Firebase path (e.g., `netatmo/proxyHealth`) with provider_status + data_freshness + rate_limit_usage
- On proxy /health failure (timeout/network): write `{ provider_status: 'unreachable', timestamp }` to Firebase — dashboard dot shows red
- No push notifications on health degradation — dashboard dot is sufficient
- Removes dependency on custom token validation code (cleaned up fully in Phase 79)

### Claude's Discretion
- Exact TypeScript types for valve and health proxy responses
- Test structure and mock patterns
- useAdaptivePolling configuration for health polling
- RoomCard badge layout and exact positioning
- Health dot component design (likely reuse existing indicator patterns)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/netatmoProxy.ts`: `netatmoProxyGet`/`netatmoProxyPost` — add valve and health convenience wrappers
- `types/netatmoProxy.ts`: Add valve and health response types here
- `app/components/devices/thermostat/BatteryWarning.tsx`: Extend for string-based battery levels
- `app/components/devices/thermostat/RoomCard.tsx`: Add valve badges here
- `lib/hooks/useAdaptivePolling.ts`: Use for health polling on dashboard
- `lib/core/apiErrors.ts`: Reuse for route error handling
- `lib/netatmoCalibrationService.ts`: Rewrite to call proxy instead of OAuth API

### Established Patterns
- Phase 75-77 proxy migration: `netatmoProxyGet<T>()` → typed response, `withAuthAndErrorHandler` route wrapper
- Double assertion `as unknown as Record<string, unknown>` for POST body types passed to `success()`
- Failure-only logging: `adminDbPush` in catch block with error field
- `export const dynamic = 'force-dynamic'` on all API routes
- `getEnvironmentPath()` for Firebase paths

### Integration Points
- `app/api/netatmo/calibrate/route.ts`: Rewrite to call proxy `/valves/calibrate`
- `lib/netatmoCalibrationService.ts`: Rewrite `calibrateValvesServer()` to use proxy
- `app/api/scheduler/check/route.ts`: Add health check call, write snapshot to Firebase
- `app/components/devices/thermostat/ThermostatCard.tsx`: Add health indicator dot
- `app/components/devices/thermostat/RoomCard.tsx`: Add valve status badges
- `app/debug/api/components/tabs/NetatmoTab.tsx` + `app/debug/components/tabs/NetatmoTab.tsx`: Replace OAuth info with proxy health
- Proxy API docs: `docs/api/netatmo.md` — reference for exact response shapes

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 78-valve-health*
*Context gathered: 2026-03-15*
