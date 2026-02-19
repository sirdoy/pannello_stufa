---
phase: 70-measurement-baseline-quick-wins
plan: 02
subsystem: ui
tags: [next/font, web-vitals, firebase-rtdb, analytics, performance, fonts, preconnect]

# Dependency graph
requires:
  - phase: 54-gdpr-analytics
    provides: analytics types and Firebase RTDB event logging pattern
provides:
  - Self-hosted Outfit and Space Grotesk fonts via next/font/google (no CDN request)
  - Preconnect hints for Firebase RTDB, Firebase Auth, Auth0 domains
  - Web Vitals client component (useReportWebVitals + sendBeacon pipeline)
  - POST /api/vitals endpoint storing vitals to Firebase RTDB
  - GET /api/vitals/summary endpoint with median aggregation per metric
  - WebVitalsCard dashboard section (5 metric cards, not consent-gated)
affects:
  - phase 71 (React Compiler) — font variables on html element must be preserved
  - phase 74 (Suspense) — WebVitalsCard data flow uses client fetch pattern

# Tech tracking
tech-stack:
  added: [next/font/google (Outfit, Space_Grotesk), next/web-vitals (useReportWebVitals)]
  patterns:
    - "next/font CSS variable injection via className on <html> element"
    - "sendBeacon fire-and-forget for non-blocking metric delivery"
    - "adminDbSet fire-and-forget for server-side analytics storage"
    - "Non-consent-gated technical metrics (Web Vitals as infrastructure data)"

key-files:
  created:
    - app/fonts.ts
    - app/_components/WebVitals.tsx
    - app/api/vitals/route.ts
    - app/api/vitals/summary/route.ts
    - app/components/analytics/WebVitalsCard.tsx
  modified:
    - app/globals.css
    - app/layout.tsx
    - app/analytics/page.tsx
    - types/analytics.ts

key-decisions:
  - "Web Vitals are not consent-gated — treated as technical infrastructure data, not user analytics"
  - "sendBeacon used as primary delivery mechanism (survives page unload), with fetch keepalive fallback"
  - "adjustFontFallback: true on both fonts to prevent CLS during font swap window"
  - "No weight array needed for variable fonts — single WOFF2 covers all weights automatically"

patterns-established:
  - "Font definition pattern: centralized in app/fonts.ts, imported in layout, applied as CSS variables on <html>"
  - "Web Vitals pattern: useReportWebVitals in client component, sendBeacon to API route, adminDbSet fire-and-forget to RTDB"
  - "Vitals aggregation: sort by timestamp descending, last 50 for median, latest for display"

requirements-completed: [FONT-01, FONT-02, FONT-03, MEAS-03]

# Metrics
duration: 20min
completed: 2026-02-18
---

# Phase 70 Plan 02: Self-hosted Fonts + Web Vitals Pipeline Summary

**Self-hosted Outfit and Space Grotesk via next/font (zero CDN roundtrip), preconnect hints for Firebase/Auth0, and a full Web Vitals pipeline (useReportWebVitals + sendBeacon + Firebase RTDB + 5-metric dashboard card)**

## Performance

- **Duration:** 20 min
- **Started:** 2026-02-18T10:34:59Z
- **Completed:** 2026-02-18T10:54:59Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Eliminated Google Fonts CDN network request on cold load by self-hosting via next/font/google
- Added preconnect hints for Firebase RTDB, Firebase Auth, and Auth0 domains to reduce connection latency
- Built a complete Web Vitals measurement pipeline: collection (useReportWebVitals) → delivery (sendBeacon) → storage (Firebase RTDB) → display (WebVitalsCard)
- Web Vitals dashboard section visible on /analytics regardless of GDPR consent state

## Task Commits

Each task was committed atomically:

1. **Task 1: Self-host fonts with next/font/google + preconnect hints** - `824111c` (feat)
2. **Task 2: Web Vitals pipeline + analytics dashboard section** - `14a7c71` (feat)

## Files Created/Modified
- `app/fonts.ts` — Centralized next/font/google definitions for Outfit and Space Grotesk with CSS variable names matching globals.css @theme block
- `app/globals.css` — Removed Google Fonts @import, replaced with comment
- `app/layout.tsx` — Added font CSS variable classes to html element, preconnect links, WebVitals component
- `app/_components/WebVitals.tsx` — Client boundary with useReportWebVitals hook, console logging in dev, sendBeacon POST to /api/vitals
- `app/api/vitals/route.ts` — POST endpoint with basic validation, fire-and-forget adminDbSet to Firebase RTDB
- `app/api/vitals/summary/route.ts` — GET endpoint reading all vitalsEvents, aggregating latest + median of last 50 per metric
- `app/components/analytics/WebVitalsCard.tsx` — 5 metric cards (LCP, INP, CLS, FCP, TTFB) with loading/empty states, rating color coding
- `app/analytics/page.tsx` — Added Web Performance section with WebVitalsCard before consent-gated content
- `types/analytics.ts` — Added WebVitalName, WebVitalRating, WebVitalEvent types

## Decisions Made
- Web Vitals are not consent-gated: treated as technical/infrastructure measurement data, not user behavioral analytics
- sendBeacon used as primary delivery (non-blocking, survives page unload) with fetch keepalive fallback
- adjustFontFallback: true on both fonts generates size-adjust fallback metric to prevent CLS during font swap window
- No weight array specified for Outfit or Space Grotesk — both are variable fonts, single WOFF2 covers all weights automatically

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered
None — pre-existing TypeScript errors in .next/types (netatmo camera route) and test files are out of scope and were not touched.

## User Setup Required
None — no external service configuration required. Web Vitals data will auto-populate under `vitalsEvents/` (or `dev/vitalsEvents/` in development) in Firebase RTDB once the app receives page loads.

## Next Phase Readiness
- Font self-hosting complete: FONT-01, FONT-02, FONT-03 satisfied
- Web Vitals pipeline complete: MEAS-03 satisfied
- Baseline measurement infrastructure ready for Phase 71 (React Compiler)
- WebVitalsCard will show real data after the first few page loads populate vitalsEvents in RTDB

---
*Phase: 70-measurement-baseline-quick-wins*
*Completed: 2026-02-18*
