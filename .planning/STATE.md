# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-18)

**Core value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).
**Current focus:** v9.0 Performance Optimization — Phase 70 ready to plan

## Current Position

Phase: 70 of 74 (Measurement Baseline + Quick Wins)
Plan: 0 of 2 in current phase
Status: Ready to plan
Last activity: 2026-02-18 — v9.0 roadmap created (5 phases, 21 requirements, phases 70-74)

Progress: [░░░░░░░░░░] 0% (v9.0 — 0/8 plans)

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

### Pending Todos

None.

### Blockers/Concerns

- [Phase 74]: Suspense streaming has a known conflict between `deviceConfig` server-fetch pattern and per-card Suspense boundaries. Requires dedicated research before planning. Use `/gsd:research-phase` for Phase 74.
- [Phase 73]: `useAdaptivePolling` hook must be read before planning Phase 73 to confirm `initialDelay` is achievable without architectural changes. Confirm stove hook uses Firebase RTDB listener (not polling) as primary path — safety-critical.

## Session Continuity

Last session: 2026-02-18
Stopped at: Phase 70 context gathered
Resume file: .planning/phases/70-measurement-baseline-quick-wins/70-CONTEXT.md
