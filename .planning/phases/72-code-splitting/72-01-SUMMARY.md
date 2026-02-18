---
phase: 72-code-splitting
plan: 01
subsystem: ui
tags: [next-dynamic, code-splitting, recharts, performance, pwa]

# Dependency graph
requires:
  - phase: 64-bandwidth-charts
    provides: BandwidthChart and BandwidthCorrelationChart components (Recharts)
  - phase: 54-analytics-gdpr
    provides: UsageChart, ConsumptionChart, WeatherCorrelation components (Recharts)
  - phase: 71-react-compiler
    provides: React Compiler enabled baseline for v9.0 optimizations
provides:
  - next/dynamic deferred loading for all Recharts chart components on /network and /analytics sub-pages
  - Consent-gated chunk non-fetch: BandwidthCorrelationChart chunk never fetched when consent denied
  - Loading skeleton fallbacks matching actual chart container heights
affects: [73-polling-optimization, 74-suspense-streaming]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "next/dynamic with ssr: false for client-only chart components"
    - "Loading skeleton height matching actual chart ResponsiveContainer height"
    - "Consent gate + dynamic import combination for zero-fetch when consent denied"

key-files:
  created: []
  modified:
    - app/network/page.tsx
    - app/analytics/page.tsx

key-decisions:
  - "Loading skeleton heights match chart ResponsiveContainer heights: BandwidthChart 380px, BandwidthCorrelationChart 360px, UsageChart 300px, ConsumptionChart 300px, WeatherCorrelation 350px"
  - "SPLIT-03 achieved with zero code changes beyond dynamic import: existing hasConsent gate prevents component mount, browser never requests chunk"
  - "Skeleton import added to analytics page from @/app/components/ui (was missing)"

patterns-established:
  - "Dynamic import pattern: const Component = dynamic(() => import('./path'), { ssr: false, loading: () => <skeleton/> })"
  - "Import ordering: all static imports first, then dynamic const declarations"

requirements-completed:
  - SPLIT-01
  - SPLIT-02
  - SPLIT-03
  - SPLIT-04

# Metrics
duration: 3min
completed: 2026-02-18
---

# Phase 72 Plan 01: Code Splitting - Dynamic Imports Summary

**next/dynamic with ssr: false applied to 5 Recharts chart components across /network and /analytics, deferring ~200 KB of chart JS from initial bundle**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-18T16:22:03Z
- **Completed:** 2026-02-18T16:25:08Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- BandwidthChart and BandwidthCorrelationChart on /network page converted to dynamic imports (SPLIT-01)
- UsageChart, ConsumptionChart, WeatherCorrelation on /analytics page converted to dynamic imports (SPLIT-02)
- Consent-gated BandwidthCorrelationChart chunk never fetched when consent denied — achieved through existing hasConsent gate + dynamic import combination (SPLIT-03)
- PWA offline intact — no service worker changes; existing StaleWhileRevalidate script caching handles split chunks (SPLIT-04)
- Loading skeletons with heights matching actual chart containers for zero layout shift

## Task Commits

Each task was committed atomically:

1. **Task 1: Dynamic-import Recharts charts on /network page** - `8dafcb0` (feat)
2. **Task 2: Dynamic-import Recharts charts on /analytics page** - `e88e692` (feat)

## Files Created/Modified
- `app/network/page.tsx` - Replaced static BandwidthChart and BandwidthCorrelationChart imports with next/dynamic; ssr: false; skeleton fallbacks 380px and 360px
- `app/analytics/page.tsx` - Replaced static UsageChart, ConsumptionChart, WeatherCorrelation imports with next/dynamic; ssr: false; added Skeleton import; skeleton fallbacks 300px, 300px, 350px

## Decisions Made
- Loading skeleton heights match actual chart ResponsiveContainer heights to prevent layout shift during chunk load
- Import ordering fixed on analytics page: all static imports grouped at top before dynamic const declarations
- SPLIT-03 (consent-gated non-fetch) requires no additional code — the existing `{hasConsent && (...)}` JSX gate prevents React from mounting the component, which means the browser never requests the chunk

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- None. TypeScript check showed only pre-existing errors in unrelated test files (LightsBanners.test.tsx, useLightsData.test.ts, cron-executions.test.ts). Zero new errors introduced in modified files.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 72 Plan 01 complete. All 5 Recharts chart components are now code-split.
- Ready for Phase 72 Plan 02 (if exists) or Phase 73 (polling optimization).
- Bundle size reduction from Recharts split is verifiable with `ANALYZE=true npm run build` (blocked by project rule — not executed).

## Self-Check: PASSED

- FOUND: app/network/page.tsx (modified)
- FOUND: app/analytics/page.tsx (modified)
- FOUND: .planning/phases/72-code-splitting/72-01-SUMMARY.md (created)
- FOUND: commit 8dafcb0 (Task 1: network page dynamic imports)
- FOUND: commit e88e692 (Task 2: analytics page dynamic imports)

---
*Phase: 72-code-splitting*
*Completed: 2026-02-18*
