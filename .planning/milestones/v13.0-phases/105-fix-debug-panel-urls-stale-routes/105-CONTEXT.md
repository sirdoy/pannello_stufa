# Phase 105: Fix Debug Panel URLs & Stale Routes - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix StoveTab POST URLs that point to HA proxy internal paths (will 404) and remove stale route entries from lib/routes.ts for deleted API routes. Gap closure for BROKEN-01 and BROKEN-03 from v13.0 audit.

</domain>

<decisions>
## Implementation Decisions

### StoveTab POST URL fix (BROKEN-01)
- Both StoveTab files must be updated: `app/debug/components/tabs/StoveTab.tsx` and `app/debug/api/components/tabs/StoveTab.tsx`
- POST URLs must point to Next.js API routes, not HA proxy internal paths:
  - `/api/stove/commands/ignit` → `/api/stove/ignite`
  - `/api/stove/commands/shutdown` → `/api/stove/shutdown`
  - `/api/stove/settings/power` → `/api/stove/setPower`
  - `/api/stove/settings/fan-level` → `/api/stove/setFan`
  - `/api/stove/settings/temperature/water` → `/api/stove/setWaterTemperature`
- Each URL appears 3 times per endpoint per file (url prop, onExecute callback, onCopyUrl/isCopied)

### Stale routes cleanup (BROKEN-03)
- Remove 3 entries from `STOVE_ROUTES` in `lib/routes.ts`:
  - `getRoomTemperature` — route file deleted in Phase 103
  - `getSettings` — route file deleted in Phase 103
  - `setSettings` — route file deleted in Phase 103
- Verify no remaining imports of these route keys exist

### Claude's Discretion
- Whether to also add missing route entries for new proxy endpoints (health, history, setWaterTemperature) to STOVE_ROUTES — these don't exist yet but would improve completeness

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Audit findings
- `.planning/v13.0-MILESTONE-AUDIT.md` — Defines BROKEN-01 (StoveTab POST URLs) and BROKEN-03 (stale routes.ts entries)

### Actual Next.js routes (target URLs)
- `app/api/stove/ignite/route.ts` — POST ignite command
- `app/api/stove/shutdown/route.ts` — POST shutdown command
- `app/api/stove/setPower/route.ts` — POST set power level
- `app/api/stove/setFan/route.ts` — POST set fan level
- `app/api/stove/setWaterTemperature/route.ts` — POST set water temperature

### Files to modify
- `app/debug/components/tabs/StoveTab.tsx` — Main debug panel StoveTab (257 lines)
- `app/debug/api/components/tabs/StoveTab.tsx` — API debug panel StoveTab (257 lines, identical copy)
- `lib/routes.ts` — Centralized route definitions (120 lines)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- EndpointCard/PostEndpointCard components already handle the URL display, refresh, and copy patterns
- Both StoveTab files are identical — changes must be applied to both

### Established Patterns
- Other debug tabs (Fritz!Box, Netatmo, Raspi) use Next.js API route paths, not proxy internal paths
- STOVE_ROUTES in lib/routes.ts is exported and consumed by frontend hooks (useStoveCommands, useStoveData)

### Integration Points
- `STOVE_ROUTES.ignite` already correct at `/api/stove/ignite` — used by useStoveCommands
- `STOVE_ROUTES.getFan` and `STOVE_ROUTES.getPower` already correct — used by useStoveData
- StoveTab bypasses STOVE_ROUTES and hardcodes URLs directly — the fix is straightforward string replacement

</code_context>

<specifics>
## Specific Ideas

No specific requirements — this is a deterministic bug fix. URL mappings are dictated by existing Next.js route file structure.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 105-fix-debug-panel-urls-stale-routes*
*Context gathered: 2026-03-20*
