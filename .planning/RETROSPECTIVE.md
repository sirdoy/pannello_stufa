# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v10.0 — Netatmo API Migration

**Shipped:** 2026-03-16
**Phases:** 9 | **Plans:** 18

### What Was Built
- New Netatmo proxy client replacing OAuth with API Key auth (X-API-Key header)
- All 28 Netatmo endpoints migrated: energy (7), camera (6), valve (2), health (2), API client (4), cleanup (7)
- Dead OAuth infrastructure removed: token helper, credentials, rate limiter, cache service, callback route, coordination chain
- Audit-driven gap closure: 4 phases (80-83) fixing integration issues found post-migration

### What Worked
- Parallel agent execution across independent phases (75-78 all depend on 75 only, so 76-78 could run in parallel)
- Milestone audit caught 2 critical integration gaps (home_id missing, camera toggle missing) before shipping — prevented runtime-breaking production bugs
- Server-side proxy pattern (same as Fritz!Box) was a well-known pattern that made migration straightforward
- Gap closure phases were small and focused (1-2 plans each), quick to plan and execute

### What Was Inefficient
- Phase 76 verification marked ENERGY-03/04 as "passed" at route level, missing that frontend callers were broken — verification needs to check E2E flow, not just route
- Audit was needed twice (first audit found 4 gaps, then re-audit found 2 more) — ideally audit catches all gaps in one pass
- SUMMARY frontmatter quality inconsistent — some plans missing one_liner, requirements_completed fields

### Patterns Established
- Audit-driven gap closure: run `/gsd:audit-milestone` → create gap closure phases → re-verify → ship
- Proxy client as function module (not class) — simpler for stateless API key auth
- homeId threading as optional prop through component trees — single source of truth from topology

### Key Lessons
1. **Phase verification must check E2E flows, not just individual routes** — a route passing tests doesn't mean the frontend caller passes the right data
2. **Milestone audits are essential** — they caught integration gaps that phase-level verification missed
3. **Net negative LOC is a sign of healthy cleanup** — v10.0 deleted more code than it added (-3,848 lines net)
4. **Gap closure phases should be planned during original roadmap** — budget 1-2 phases for integration fixes after migration work

### Cost Observations
- Model mix: balanced profile (sonnet executors, sonnet verifiers)
- Notable: 9 phases in 2 days — fast for a migration milestone, partly because proxy pattern was established

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v9.0 | 5 | 8 | Performance optimization — measurement-first |
| v10.0 | 9 | 18 | API migration — audit-driven gap closure |

### Cumulative Quality

| Milestone | Tests | Coverage Notes | Net LOC |
|-----------|-------|----------------|---------|
| v9.0 | 4,004+ | React Compiler zero regressions | +7,920 |
| v10.0 | 4,000+ | 28/28 requirements | -3,848 |

### Top Lessons (Verified Across Milestones)

1. **Audit before shipping** — milestone audit catches integration gaps that phase verification misses (verified v10.0)
2. **Parallel execution** — independent phases run well in parallel with agent-based execution (verified v5.0, v8.0, v10.0)
3. **Proxy pattern is reliable** — server-side proxy with rate limiting works for both Fritz!Box and Netatmo (verified v8.0, v10.0)
