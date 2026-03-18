---
gsd_state_version: 1.0
milestone: v11.1
milestone_name: Test Suite & Tech Debt Cleanup
status: planning
stopped_at: Phase 92 context gathered
last_updated: "2026-03-18T11:24:42.305Z"
last_activity: 2026-03-18 — Roadmap created, ready to plan Phase 92
progress:
  total_phases: 4
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-18)

**Core value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).
**Current focus:** v11.1 Test Suite & Tech Debt Cleanup — Phase 92 ready to plan

## Current Position

Phase: 92 of 95 (Jest Configuration)
Plan: —
Status: Ready to plan
Last activity: 2026-03-18 — Roadmap created, ready to plan Phase 92

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed (all milestones): 361
- v11.0 average: 1.6 plans/phase (13 plans / 8 phases)
- v10.0 average: 2.0 plans/phase (18 plans / 9 phases)
- v9.0 average: 1.6 plans/phase (8 plans / 5 phases)

**By Milestone (recent):**

| Milestone | Phases | Plans | Duration |
|-----------|--------|-------|----------|
| v9.0 Performance Optimization | 70-74 | 8 | 2 days |
| v10.0 Netatmo API Migration | 75-83 | 18 | 2 days |
| v11.0 API Unification & Raspberry Pi | 84-91 | 13 | 2 days |

## Accumulated Context

### Decisions

See PROJECT.md Key Decisions table for full history.

Recent decisions affecting v11.1:
- [v11.0]: React Compiler 1.0 handles all memoization — manual useMemo/useCallback deferred for removal here
- [v11.0]: 8 stale env vars (HOMEASSISTANT_*, NETATMO_*) remain in .env.local after migration, flagged for cleanup

### Phase Structure

- Phase 92: Jest Configuration (JEST-01, JEST-02) — foundational, must run first
- Phase 93: API & Infrastructure Test Fixes (TFIX-01 through TFIX-08) — 8 suites, ~27 failing tests
- Phase 94: Component & Hook Test Fixes (TFIX-09 through TFIX-12) — 4 suites, ~10 failing tests
- Phase 95: Tech Debt Cleanup (DEBT-01, DEBT-02) — safe last, after all tests green

### Pending Todos

None.

### Blockers/Concerns

None.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 31 | Hide debug and design-system pages in production | 2026-02-18 | 991f470 | [31-hide-debug-and-design-system-pages-in-pr](./quick/31-hide-debug-and-design-system-pages-in-pr/) |
| 32 | controlla e pulisci tutta la documentazione inutile | 2026-03-14 | c2940eb | [32-controlla-e-pulisci-tutta-la-documentazi](./quick/32-controlla-e-pulisci-tutta-la-documentazi/) |

## Session Continuity

Last session: 2026-03-18T11:24:42.299Z
Stopped at: Phase 92 context gathered
Resume file: .planning/phases/92-jest-configuration/92-CONTEXT.md
