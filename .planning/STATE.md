# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-18)

**Core value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).
**Current focus:** v9.0 Performance Optimization — Phase 72 in progress (Plan 01 complete)

## Current Position

Phase: 72 of 74 (Code Splitting)
Plan: 1 of 1 in current phase (COMPLETE)
Status: Phase complete
Last activity: 2026-02-18 - Completed 72-01: Dynamic imports for all Recharts chart components

Progress: [████░░░░░░] 50% (v9.0 — 4/8 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 322 (phases 1-69, all complete)
- Average duration: ~6 min (recent trend)
- Total execution time: ~78 hours across 12 milestones

**By Milestone (recent):**

| Milestone | Phases | Plans | Duration |
|-----------|--------|-------|----------|
| v7.0 Performance & Resilience | 55-60 | 22 | 2 days |
| v8.0 Fritz!Box Network Monitor | 61-67 | 18 | 3 days |
| v8.1 Masonry Dashboard | 68-69 | 3 | 1 day |
| v9.0 Performance Optimization | 70-74 | 8 (est.) | TBD |

## Accumulated Context

### Decisions

See PROJECT.md Key Decisions table for full history.

Recent decisions affecting v9.0:
- [v9.0 research]: `next/dynamic` does NOT reduce First Load JS for always-visible dashboard cards (Client Components in App Router) — only effective on sub-page Recharts components
- [v9.0 research]: React Compiler must be isolated in Phase 71 alone for clean regression attribution
- [v9.0 research]: Phase 74 (Suspense) is conditional — only execute if Phase 70-73 results show LCP/TTI still insufficient
- [70-01]: Phase 70 is the fixed reference baseline for --compare in all v9.0 phases (not rolling)
- [70-01]: @next/bundle-analyzer added to package.json only (npm install not run per project rules)
- [70-01]: Shared chunk detection uses multi-route reference counting to match Next.js First Load JS accounting
- [70-02]: Web Vitals are not consent-gated — treated as technical infrastructure data, not user behavioral analytics
- [70-02]: adjustFontFallback: true on both fonts prevents CLS during font swap window
- [70-02]: No weight array needed for variable fonts (Outfit, Space Grotesk) — single WOFF2 covers all weights
- [71-01]: All 28 failing tests are pre-existing (confirmed by toggling reactCompiler flag) — no compiler regressions
- [71-01]: No "use no memo" opt-outs required — 271/271 components pass healthcheck, zero new failures
- [71-01]: React Compiler causes zero new failures; COMP-01, COMP-02, COMP-03 all satisfied
- [72-01]: SPLIT-03 (consent-gated non-fetch) achieved with zero extra code — existing {hasConsent && (...)} gate prevents component mount, browser never requests chunk
- [72-01]: Loading skeleton heights match actual chart ResponsiveContainer heights to prevent layout shift (380px, 360px, 300px, 300px, 350px)

### Pending Todos

None.

### Blockers/Concerns

- [Phase 74]: Suspense streaming has a known conflict between `deviceConfig` server-fetch pattern and per-card Suspense boundaries. Requires dedicated research before planning. Use `/gsd:research-phase` for Phase 74.
- [Phase 73]: `useAdaptivePolling` hook must be read before planning Phase 73 to confirm `initialDelay` is achievable without architectural changes. Confirm stove hook uses Firebase RTDB listener (not polling) as primary path — safety-critical.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 31 | Hide debug and design-system pages in production | 2026-02-18 | 991f470 | [31-hide-debug-and-design-system-pages-in-pr](./quick/31-hide-debug-and-design-system-pages-in-pr/) |

## Session Continuity

Last session: 2026-02-18
Stopped at: Completed 72-01-PLAN.md (Code Splitting — dynamic imports for Recharts)
Resume file: .planning/phases/72-code-splitting/ (phase complete, next: 73)
