# Phase 90: Raspberry Pi Page + Cron - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Dedicated /raspi page showing full system stats (uptime, load averages, network I/O, process count) and Raspberry Pi health included in the 5-minute GitHub Actions cron monitoring check. If the Raspberry Pi is unreachable during cron, the failure is logged without aborting other health checks.

</domain>

<decisions>
## Implementation Decisions

### Page layout
- Orchestrator pattern matching /network page: thin page orchestrator + presentational stat cards
- Sections: CPU & Temperature, Memory, Disk, System Info (uptime, load averages, process count), Network I/O
- Use existing design system components (PageLayout, Card, Heading, Text, Skeleton, Button)
- Back button "← Indietro" linking to dashboard, same as /network page header pattern
- Loading skeleton guard on initial load, same pattern as /network page

### Data fetching
- Create `useRaspiFullData` hook that fetches ALL data from all 4 endpoints (cpu, memory, disk, system)
- Returns full SystemResponse fields (uptime_seconds, load_avg_1/5/15, process_count, network bytes_sent/bytes_recv, interface) plus cpu/memory/disk data
- Reuses useAdaptivePolling with 30s visible / 300s hidden intervals (same as useRaspiData)
- useRaspiData (Phase 89) stays unchanged — it powers the dashboard RaspiCard with card-level summary

### Cron integration
- Add raspiClient.getHealth() call inside existing `app/api/health-monitoring/check/route.ts`
- Wrap in isolated try/catch so Raspberry Pi failure does NOT abort stove/thermostat health checks
- Include Raspberry Pi status in the response summary (raspiStatus: 'ok' | 'unreachable')
- Log failure with console.warn (fire-and-forget, no notification — Raspberry Pi is informational, not safety-critical like stove)
- No separate cron step in GitHub Actions — single /api/health-monitoring/check endpoint handles all devices

### Page navigation
- RaspiCard on dashboard links to /raspi when tapped (same pattern as NetworkCard → /network)
- /raspi page has back button to dashboard

### Claude's Discretion
- Exact stat card layout and grouping within the page
- How to format uptime (days/hours/minutes display)
- How to format network I/O bytes (human-readable MB/GB)
- Whether to show load averages as a mini visualization or plain text

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Raspberry Pi API specification
- `docs/api/raspberry-pi.md` — Complete endpoint documentation: 5 endpoints, response schemas, TypeScript interfaces

### Existing Raspberry Pi code (Phases 88-89)
- `lib/raspi/raspiClient.ts` — Client module with getHealth/getCpu/getMemory/getDisk/getSystem methods
- `types/raspi.ts` — TypeScript interfaces (SystemResponse, CpuResponse, MemoryResponse, DiskResponse, NetworkStats)
- `app/components/devices/raspi/hooks/useRaspiData.ts` — Dashboard-level hook (card summary only, NOT for full page)
- `app/components/devices/raspi/__tests__/RaspiCard.test.tsx` — Existing card tests

### Reference patterns
- `app/network/page.tsx` — /network page orchestrator pattern (full-page reference for /raspi)
- `app/api/health-monitoring/check/route.ts` — Existing cron health check (where Raspberry Pi health will be added)
- `.github/workflows/cron-scheduler.yml` — GitHub Actions cron workflow (NO changes needed — already calls /api/health-monitoring/check)

### Shared infrastructure
- `lib/haClient.ts` — Shared `haGet<T>` transport used by raspiClient
- `lib/core/index.ts` — `withAuthAndErrorHandler`, `success`, `withCronSecret` route wrappers
- `lib/hooks/useAdaptivePolling.ts` — Polling hook used by useRaspiData and new useRaspiFullData

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useRaspiData` hook: Fetches cpu/memory/disk/system for card — useRaspiFullData can follow same structure but expose all fields
- `raspiClient`: All 5 endpoint methods ready, including `getHealth()` needed for cron
- `PageLayout`, `Card`, `Heading`, `Text`, `Skeleton`, `Button`: Design system components used by /network page
- `useAdaptivePolling` + `useVisibility`: Same polling pattern for /raspi page data

### Established Patterns
- Orchestrator pattern: page.tsx as thin coordinator, hooks for data, presentational components for display (~80 LOC pages)
- /network page: WanStatusCard, DeviceListTable, BandwidthChart as separate components — /raspi should follow same decomposition
- Health check route: Promise.allSettled for parallel checks, fire-and-forget logging, withCronSecret wrapper
- Loading skeleton guard: check loading && !data before rendering content

### Integration Points
- `app/raspi/page.tsx` — New page file
- `app/raspi/components/` — New presentational components
- `app/components/devices/raspi/hooks/useRaspiFullData.ts` — New extended hook
- `app/api/health-monitoring/check/route.ts` — Add raspiClient.getHealth() call
- `app/components/devices/raspi/` — RaspiCard needs onClick/link to /raspi

</code_context>

<specifics>
## Specific Ideas

No specific requirements — straightforward new page following the established /network pattern and cron integration following the existing health check pattern. Both success criteria are well-defined with exact data fields required.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 90-raspberry-pi-page-cron*
*Context gathered: 2026-03-18*
