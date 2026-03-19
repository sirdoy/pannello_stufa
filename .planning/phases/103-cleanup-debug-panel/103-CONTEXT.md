# Phase 103: Cleanup & Debug Panel - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Delete all WiNet infrastructure (direct cloud client, sandbox mode, dead API routes, API key) and update the debug panel to show proxy endpoints with new response formats. No new functionality — purely removal and documentation update.

</domain>

<decisions>
## Implementation Decisions

### WiNet client deletion
- Delete `lib/stoveApi.ts` entirely — all consumers now use `lib/thermorossiProxy.ts`
- Delete `lib/__tests__/stoveApi.test.ts` and `__tests__/stoveApi.sandbox.test.ts`
- Remove any remaining imports of `stoveApi` across the codebase

### Sandbox mode removal
- Delete `lib/sandboxService.ts` entirely
- Delete `__tests__/sandboxService.test.ts`
- Delete `app/components/sandbox/SandboxPanel.tsx` and `SandboxToggle.tsx`
- Remove `SANDBOX_MODE` env var references
- Remove `isLocalEnvironment()` references that were only used for sandbox routing
- Remove sandbox-related imports from any remaining consumers

### Dead API route deletion
- Delete `app/api/stove/getRoomTemperature/route.ts` — no proxy equivalent, WiNet-only endpoint
- Delete `app/api/stove/getActualWaterTemperature/route.ts` — no proxy equivalent
- Delete `app/api/stove/getWaterSetTemperature/route.ts` — no proxy equivalent
- Delete `app/api/stove/settings/route.ts` — no proxy equivalent (settings are per-endpoint now)
- Delete `app/api/stove/setSettings/route.ts` — no proxy equivalent

### Environment cleanup
- Remove `API_KEY` export from codebase (was hardcoded in `lib/stoveApi.ts`)
- Remove WiNet base URL references (`wsthermorossi.cloudwinet.it`)
- Check `.env.local` for any WiNet-specific env vars to remove

### Debug panel update
- Rewrite `app/debug/components/tabs/StoveTab.tsx` to show proxy endpoints
- GET endpoints: status, getPower (power), getFan (fan-level), health, history
- POST endpoints: ignite (commands/ignit), shutdown (commands/shutdown), setPower (settings/power), setFan (settings/fan-level), setWaterTemperature (settings/temperature/water)
- External URL mapping should point to HA proxy paths (`HA_API_URL/api/v1/thermorossi/...`) instead of WiNet cloud URLs
- Remove `isSandbox` response cleaning — proxy responses don't have sandbox fields
- Remove `API_KEY` import from StoveTab
- Document new response format: `stove_state` (string), `data_freshness`, `error_code`/`error_description` for status; 202 Accepted for commands
- Check `app/debug/api/components/tabs/StoveTab.tsx` — may be a duplicate that also needs updating or deletion

### Claude's Discretion
- Whether to show HA_API_URL in debug panel or just the Next.js API route paths
- Exact layout of proxy endpoint documentation in the debug panel
- Whether `app/debug/stove/page.tsx` needs updates or deletion

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Proxy API specification
- `docs/api/thermorossi.md` — Complete Thermorossi proxy API: 10 endpoints, response interfaces, state mapping table
- `docs/api/README.md` — HA proxy authentication (X-API-Key), RFC 9457 error format

### Current proxy client (keep)
- `lib/thermorossiProxy.ts` — Proxy client with convenience wrappers (getStatus, getPower, getFan, getHealth, getHistory, sendIgnit, sendShutdown, setPower, setFanLevel, setWaterTemperature)
- `types/thermorossiProxy.ts` — TypeScript interfaces for all proxy responses

### Files to delete
- `lib/stoveApi.ts` — WiNet direct cloud client (376 lines)
- `lib/sandboxService.ts` — Sandbox simulation service (515 lines)
- `app/components/sandbox/SandboxPanel.tsx` — Sandbox UI panel
- `app/components/sandbox/SandboxToggle.tsx` — Sandbox toggle component

</canonical_refs>

<code_context>
## Existing Code Insights

### Files referencing stoveApi (to clean up imports)
- `lib/services/StoveService.ts` — may still import from stoveApi
- `lib/healthMonitoring.ts` — may still import from stoveApi
- `lib/version.ts` — references stoveApi or sandbox
- `__tests__/semiAutoMode.test.ts` — test referencing stoveApi
- `__tests__/lib/healthMonitoring.test.ts` — test referencing stoveApi
- `lib/services/__tests__/StoveService.test.ts` — test referencing stoveApi
- `app/debug/stove/page.tsx` — debug page may reference stoveApi

### Files referencing sandbox (to clean up)
- `app/components/devices/stove/StoveCard.tsx` — sandbox reference
- `app/components/devices/stove/hooks/useStoveData.ts` — sandbox reference
- `app/stove/page.tsx` — sandbox reference
- `app/components/devices/stove/components/StoveStatus.tsx` — sandbox reference
- `lib/maintenanceService.ts` — sandbox reference
- `lib/repositories/StoveStateRepository.ts` — sandbox reference
- `app/settings/page.tsx` — sandbox reference
- `app/page.tsx` — sandbox reference
- `app/sw.ts` — sandbox reference

### Debug panel structure
- `app/debug/components/tabs/StoveTab.tsx` — Main debug tab (304 lines, WiNet URLs)
- `app/debug/api/components/tabs/StoveTab.tsx` — Appears to be a second debug tab variant
- `app/debug/api/page.tsx` — API debug page
- `app/debug/stove/page.tsx` — Standalone stove debug page

### Established Patterns
- Other debug tabs (Fritz!Box, Netatmo, Raspi) show proxy endpoints with HA_API_URL paths
- EndpointCard/PostEndpointCard components from `app/debug/components/ApiTab` are reused

### Integration Points
- No functional changes needed — all consumers already migrated to proxy in Phases 99-102
- This phase is purely deletion + debug panel documentation update

</code_context>

<specifics>
## Specific Ideas

No specific requirements — this is a deterministic cleanup phase. Delete everything listed, update debug panel to reflect proxy architecture.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 103-cleanup-debug-panel*
*Context gathered: 2026-03-19*
