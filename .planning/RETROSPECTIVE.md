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

## Milestone: v11.1 — Test Suite & Tech Debt Cleanup

**Shipped:** 2026-03-18
**Phases:** 4 | **Plans:** 9

### What Was Built
- Jest runner scoped correctly: Playwright .spec.ts excluded, test ordering independence verified with `test:random`
- 12 failing test suites fixed across API/infrastructure (8) and component/hook (4) layers — 37 tests total
- ~179 useMemo/useCallback call-sites removed across 63 files (React Compiler handles it)
- 8 stale environment variables deleted from .env.local

### What Worked
- Foundational-first ordering: Phase 92 (Jest config) before 93-94 (test fixes) before 95 (cleanup) prevented cascading failures
- Root cause analysis on each failing suite (not just patching assertions) — e.g., TFIX-01 was two separate issues (dynamic import + missing NextResponseMock properties)
- Phase 95 ran last (after all tests green) so memoization removal could be verified against a clean baseline
- Small focused plans (1-2 tasks each, most completing in seconds to minutes) — fast cycle times

### What Was Inefficient
- summary-extract tool returned null for all one_liners — frontmatter field either missing or not in expected format
- STATE.md progress percent stuck at 0% despite all 9 plans being complete — same frontmatter sync issue from v11.0
- Phase 95-02 needed a small follow-up commit (CameraEventsPage.tsx) caught during documentation — easy to miss files in large refactoring sweeps

### Patterns Established
- `resetAllMocks` + explicit `beforeEach` resets as standard for preventing mock bleed between tests
- Static imports required for Jest mock interception — dynamic `await import()` bypasses module mocks
- getByRole (not getByText) for testing disabled state on buttons (inner span has no disabled attribute)

### Key Lessons
1. **Mock bleed is the #1 flaky test cause** — clearAllMocks doesn't reset mockReturnValue, only call counts. Use resetAllMocks or explicit beforeEach.
2. **React Compiler makes manual memoization pure tech debt** — removal across 63 files caused zero test failures
3. **Cleanup milestones are fast** — 4 phases, 9 plans, 1 day. Budget them after feature milestones to keep the codebase healthy.
4. **SUMMARY frontmatter needs standardization** — one_liner field not consistently populated, affecting milestone tooling

### Cost Observations
- Model mix: balanced profile (sonnet executors, sonnet verifiers)
- Notable: Entire milestone completed in 1 day — smallest milestone yet (net -264 LOC), typical for cleanup work

---

## Milestone: v12.0 — Data Fetching Simplification & E2E Verification

**Shipped:** 2026-03-19
**Phases:** 3 | **Plans:** 4

### What Was Built
- Stove hook rewritten: Firebase RTDB real-time listener + sync-external-state replaced with useAdaptivePolling(60s, alwaysActive:true)
- All device hooks unified to 60s intervals (from 30s), useDeviceStaleness polling reduced from 5s to 60s
- Playwright E2E smoke tests for all 9 app pages with console error collection
- Audit gap closure: stale test assertion, Playwright selector fixes, JSDoc cleanup

### What Worked
- Smallest milestone yet in scope (3 phases, 4 plans) — focused and well-scoped
- Milestone audit ran before shipping, caught 2 integration gaps that Phase 98 fixed cleanly
- useAdaptivePolling was already battle-tested across 4 devices, so stove migration was straightforward
- Playwright page-load tests are a good foundation for future E2E expansion

### What Was Inefficient
- Phase 98 gap closure could have been avoided if Phase 96 executor had caught the stale test assertion (30000→60000ms) during execution
- SUMMARY one_liner field still not populated by extractors — recurring issue across milestones

### Patterns Established
- collectConsoleErrors helper for Playwright: attach before goto, cleanup before assertion
- Stove-specific staleness thresholds (90s on, 180s off) via optional thresholdMs parameter
- E2E-09 /admin maps to /debug — requirement mapping should document route aliases

### Key Lessons
1. **Polling unification is simple when the abstraction exists** — useAdaptivePolling made all device hooks consistent with minimal code changes
2. **Removing Firebase RTDB listener simplifies architecture** — stove hook went from dual data source (RTDB + polling) to single source (polling)
3. **Playwright smoke tests are cheap to add** — 1 plan for 9 pages, 59s execution. Worth adding early.
4. **Gap closure phases are getting smaller** — from 4 phases (v10.0) to 1 phase (v12.0), showing improved execution quality

### Cost Observations
- Model mix: balanced profile (sonnet executors, sonnet verifiers)
- Notable: 3 phases in 2 days — lightweight milestone, no complex migrations or architecture changes

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v9.0 | 5 | 8 | Performance optimization — measurement-first |
| v10.0 | 9 | 18 | API migration — audit-driven gap closure |
| v11.0 | 8 | 13 | Transport unification + new device onboarding |
| v11.1 | 4 | 9 | Test cleanup + memoization removal |
| v12.0 | 3 | 4 | Polling unification + E2E smoke tests |

### Cumulative Quality

| Milestone | Tests | Coverage Notes | Net LOC |
|-----------|-------|----------------|---------|
| v9.0 | 4,004+ | React Compiler zero regressions | +7,920 |
| v10.0 | 4,000+ | 28/28 requirements | -3,848 |
| v11.0 | 4,000+ | 18/18 requirements | +11,425 |
| v11.1 | 4,000+ | 16/16 requirements | -264 |
| v12.0 | 4,000+ | 18/18 requirements | +2,709 |

### Top Lessons (Verified Across Milestones)

1. **Audit before shipping** — milestone audit catches integration gaps that phase verification misses (verified v10.0, v11.0)
2. **Parallel execution** — independent phases run well in parallel with agent-based execution (verified v5.0, v8.0, v10.0)
3. **Proxy pattern is reliable** — server-side proxy with rate limiting works for Fritz!Box, Netatmo, and Raspberry Pi (verified v8.0, v10.0, v11.0)
4. **Established patterns accelerate** — new device onboarding follows Fritz!Box's proxy/card/page/cron template (verified v11.0)
5. **Cleanup milestones after feature milestones** — v11.1 cleaned up v9.0-v11.0 tech debt in 1 day, keeping codebase healthy (verified v11.1)
6. **Focused milestones ship faster** — v12.0 (3 phases, 4 plans) completed in 2 days with zero tech debt accumulated (verified v12.0)
