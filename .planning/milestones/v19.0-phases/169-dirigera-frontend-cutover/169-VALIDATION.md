---
phase: 169
slug: dirigera-frontend-cutover
status: draft
nyquist_compliant: false
wave_0_complete: true
created: 2026-04-22
---

# Phase 169 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x (unit + integration) + Playwright (smoke) |
| **Config file** | `jest.config.js` + `playwright.config.ts` (both present) |
| **Quick run command** | `npx jest --findRelatedTests <changed-files> --silent` |
| **Full suite command** | `npx jest` (≈ 3000 tests) |
| **Smoke command** | `npx playwright test tests/smoke/page-loads.spec.ts` |
| **Estimated runtime (quick)** | ~8 s (targeted) |
| **Estimated runtime (full jest)** | ~90 s |
| **Estimated runtime (smoke)** | ~45 s |

---

## Sampling Rate

- **After every task commit:** `npx jest --findRelatedTests <changed-files> --silent` (quick, targeted).
- **After every plan wave:** full `npx jest` + Playwright smoke run.
- **Before `/gsd-verify-work`:** full Jest + full Playwright smoke must be green; repo-wide `grep -rn "/api/dirigera/" app/ lib/ types/ hooks/ components/ __tests__/` must return zero matches (post-wave-3 invariant).
- **Max feedback latency:** 90 s (full jest at wave boundary).

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 169-01-01 | 01 | 1 | DIR-01..03 (prereq) | — | `withAuthAndErrorHandler` wraps every new v1 wrapper; no unauth leakage | unit (route) | `npx jest app/api/v1/dirigera/health/__tests__/route.test.ts` | ❌ W0 | ⬜ pending |
| 169-01-02 | 01 | 1 | DIR-01..03 (prereq) | — | auth guard preserved | unit (route) | `npx jest app/api/v1/dirigera/sensors/__tests__/route.test.ts` | ❌ W0 | ⬜ pending |
| 169-01-03 | 01 | 1 | DIR-01..03 (prereq) | — | auth guard preserved | unit (route) | `npx jest app/api/v1/dirigera/sensors/summary/__tests__/route.test.ts` | ❌ W0 | ⬜ pending |
| 169-01-04 | 01 | 1 | DIR-01..03 (prereq) | — | auth guard preserved | unit (route) | `npx jest app/api/v1/dirigera/sensors/contact/__tests__/route.test.ts` | ❌ W0 | ⬜ pending |
| 169-01-05 | 01 | 1 | DIR-01..03 (prereq) | — | auth guard preserved | unit (route) | `npx jest app/api/v1/dirigera/sensors/motion/__tests__/route.test.ts` | ❌ W0 | ⬜ pending |
| 169-01-06 | 01 | 1 | — | — | hooks hit v1 URLs (SC-1 prereq) | unit (hook) | `npx jest app/components/devices/dirigera/hooks/__tests__/useDirigeraData.test.ts` | ✅ | ⬜ pending |
| 169-01-07 | 01 | 1 | — | — | add Playwright smoke case for `/dirigera` | integration (smoke) | `npx playwright test tests/smoke/page-loads.spec.ts -g "/dirigera"` | ❌ W0 | ⬜ pending |
| 169-02-01 | 02 | 2 | DIR-01 | — | history hook emits correct URL + offset param | unit (hook) | `npx jest app/components/devices/dirigera/hooks/__tests__/useDirigeraHistory.test.ts` | ❌ W0 | ⬜ pending |
| 169-02-02 | 02 | 2 | DIR-02 | — | stats hook emits correct URL | unit (hook) | `npx jest app/components/devices/dirigera/hooks/__tests__/useDirigeraStats.test.ts` | ❌ W0 | ⬜ pending |
| 169-02-03 | 02 | 2 | DIR-03 | — | telemetry hook emits correct URL + offset param | unit (hook) | `npx jest app/components/devices/dirigera/hooks/__tests__/useDirigeraTelemetry.test.ts` | ❌ W0 | ⬜ pending |
| 169-02-04 | 02 | 2 | DIR-01 | — | `DirigeraHistoryPanel` renders table + "Load more" + empty/error states | unit (component) | `npx jest app/components/devices/dirigera/components/__tests__/DirigeraHistoryPanel.test.tsx` | ❌ W0 | ⬜ pending |
| 169-02-05 | 02 | 2 | DIR-02 | — | `DirigeraStatsPanel` renders aggregation + retention tiles | unit (component) | `npx jest app/components/devices/dirigera/components/__tests__/DirigeraStatsPanel.test.tsx` | ❌ W0 | ⬜ pending |
| 169-02-06 | 02 | 2 | DIR-03 | — | `DirigeraTelemetryPanel` renders table + "Load more" + empty/error states | unit (component) | `npx jest app/components/devices/dirigera/components/__tests__/DirigeraTelemetryPanel.test.tsx` | ❌ W0 | ⬜ pending |
| 169-02-07 | 02 | 2 | DIR-01..03 | — | `/dirigera` renders all 3 new panels without console errors | integration (smoke) | `npx playwright test tests/smoke/page-loads.spec.ts -g "/dirigera"` | ✅ (after 169-01-07) | ⬜ pending |
| 169-03-01 | 03 | 3 | — | — | legacy `app/api/dirigera/` tree deleted; repo has zero matches | integration (grep) | `! grep -rn "/api/dirigera/" app/ lib/ types/ hooks/ components/ __tests__/` | ✅ | ⬜ pending |
| 169-03-02 | 03 | 3 | — | — | v1 route count stays at 8 | integration (shell) | `[ $(find app/api/v1/dirigera -name route.ts \| wc -l) -eq 8 ]` | ✅ | ⬜ pending |
| 169-03-03 | 03 | 3 | — | — | full Jest + Playwright smoke green post-deletion | integration | `npx jest && npx playwright test tests/smoke/page-loads.spec.ts` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Minimal — existing frameworks and configs cover everything. Waves 1/2 *create* the test files listed above as part of their own deliverables (TDD-adjacent); there is no separate Wave 0 install step.

- [x] Jest configured (existing)
- [x] Playwright configured (existing)
- [x] `tests/smoke/page-loads.spec.ts` present — needs a new `/dirigera` case added in Wave 1 (task 169-01-07)
- [x] No new dependencies

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual hierarchy + Ember Noir fidelity of new panels | UI-SPEC §Visuals / §Color | UI-SPEC §Checker Sign-Off already covers automated contract checks; pixel-level fidelity requires human review | Open `/dirigera` in dev (`npm run dev`), verify: (1) stats subsections stack with `gap-6`; (2) "Load more" uses ember-500 accent on hover/focus only; (3) "Nessun evento" and "Nessuna telemetria" appear when backends report empty payloads |
| Italian copy review | UI-SPEC §Copywriting | Linguistic judgement | Native speaker reads panel headings, empty states, error copy; confirms tone matches existing DIRIGERA page |

---

## Validation Sign-Off

- [x] All tasks have automated verify commands (Jest + Playwright + grep)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 gap (new `/dirigera` Playwright case) promoted to Wave 1 task 169-01-07 so wave 2 has a smoke target to assert against
- [x] No watch-mode flags in commands
- [x] Feedback latency < 90 s (full jest bound)
- [ ] `nyquist_compliant: true` — set after executor completes wave 0 items + per-wave sampling confirmed in execution logs

**Approval:** pending
