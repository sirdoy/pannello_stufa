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

## Milestone: v11.0 — API Unification & Raspberry Pi Monitor

**Shipped:** 2026-03-18
**Phases:** 8 | **Plans:** 13

### What Was Built
- Shared HomeAssistant API client (`haGet`/`haPost`) replacing duplicated fetch logic in Fritz!Box and Netatmo clients
- Fritz!Box and Netatmo migrated to shared transport — JWT login and separate env vars eliminated
- Raspberry Pi as 5th monitored device: API layer, dashboard card, /raspi detail page, cron health integration
- Camera snapshot 302 redirect and schedule 503 retry bug fixes formally verified

### What Worked
- Shared client extraction (Phase 84) before migration (85-86) was clean — both providers migrated independently with no conflicts
- knip-based dead export verification (Phase 87) caught 4 unused exports that would have been tech debt
- Raspberry Pi phases (88-90) followed established patterns (Fritz!Box had paved the way) — device registry, orchestrator hooks, presentational components all reused
- Bug fix verification phase (91) efficiently formalized debug session work without re-coding anything

### What Was Inefficient
- SUMMARY frontmatter `requirements_completed` consistently empty across 7/8 phases — executor agents not populating this field
- Nyquist validation still not completing during execution — 0/8 phases compliant despite validation infrastructure existing
- STATE.md progress percent stuck at 43% even though all phases were complete — frontmatter not kept in sync

### Patterns Established
- Shared API client extraction → provider migration → cleanup as a 3-step pattern for transport unification
- New device onboarding path: types → client → routes → hook → card → page → cron (7-step sequence, phases 88-90)
- Informational cron checks (console.warn, isolated try/catch) for non-safety-critical devices

### Key Lessons
1. **Established patterns accelerate new devices** — Raspberry Pi integration was fast because Fritz!Box had established the proxy/card/page/cron pattern
2. **Transport unification should happen before adding new devices** — having the shared client ready meant Raspberry Pi could use it directly
3. **Debug session formalization is valuable** — Phase 91 converted ad-hoc fixes into documented, verified, maintainable code
4. **SUMMARY frontmatter quality needs attention** — executor agents should populate requirements_completed during plan execution

### Cost Observations
- Model mix: balanced profile (sonnet executors, sonnet verifiers)
- Notable: 8 phases in 2 days — fast execution, partly because established patterns reduced research/planning overhead

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v9.0 | 5 | 8 | Performance optimization — measurement-first |
| v10.0 | 9 | 18 | API migration — audit-driven gap closure |
| v11.0 | 8 | 13 | Transport unification + new device onboarding |

### Cumulative Quality

| Milestone | Tests | Coverage Notes | Net LOC |
|-----------|-------|----------------|---------|
| v9.0 | 4,004+ | React Compiler zero regressions | +7,920 |
| v10.0 | 4,000+ | 28/28 requirements | -3,848 |
| v11.0 | 4,000+ | 18/18 requirements | +11,425 |

### Top Lessons (Verified Across Milestones)

1. **Audit before shipping** — milestone audit catches integration gaps that phase verification misses (verified v10.0, v11.0)
2. **Parallel execution** — independent phases run well in parallel with agent-based execution (verified v5.0, v8.0, v10.0)
3. **Proxy pattern is reliable** — server-side proxy with rate limiting works for Fritz!Box, Netatmo, and Raspberry Pi (verified v8.0, v10.0, v11.0)
4. **Established patterns accelerate** — new device onboarding follows Fritz!Box's proxy/card/page/cron template (verified v11.0)
