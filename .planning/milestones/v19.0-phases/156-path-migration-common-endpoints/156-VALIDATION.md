---
phase: 156
slug: path-migration-common-endpoints
status: partial_accepted
nyquist_compliant: false
accepted_as: partial
accepted_by: phase-165-hygiene
accepted_date: 2026-04-15
wave_0_complete: false
created: 2026-04-07
---

# Phase 156 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | jest.config.ts |
| **Quick run command** | `npm test -- --testPathPattern="stove\|health\|devices" --bail` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --testPathPattern="stove\|health\|devices" --bail`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 156-01-01 | 01 | 1 | PATH-01 | — | N/A | integration | `npm test -- --testPathPattern="thermorossi"` | ❌ W0 | ⬜ pending |
| 156-01-02 | 01 | 1 | PATH-02 | — | N/A | grep | `grep -r "/api/stove/" lib/ app/ --include="*.ts" --include="*.tsx"` | ✅ | ⬜ pending |
| 156-02-01 | 02 | 2 | COMMON-01 | — | N/A | integration | `npm test -- --testPathPattern="health"` | ❌ W0 | ⬜ pending |
| 156-02-02 | 02 | 2 | COMMON-02 | — | N/A | integration | `npm test -- --testPathPattern="devices"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Test stubs for new `/api/v1/thermorossi/*` routes
- [ ] Test stubs for aggregated `/health` endpoint
- [ ] Test stubs for `/api/v1/devices` endpoint

*Existing test infrastructure covers framework setup.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Service worker uses new paths | PATH-02 | SW caching is runtime-only | 1. Build PWA, 2. Go offline, 3. Verify stove status loads from cache |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

---

## Resolution (Phase 165 Hygiene Closeout)

**Resolved:** 2026-04-15
**Verdict:** `partial_accepted` -- `nyquist_compliant: false`

**Tests present (covering phase requirements):**
- `app/api/v1/thermorossi/**/__tests__/route.test.ts` -- canonical path-migration routes (PATH-01)
- `__tests__/components/devices/stove/hooks/useStoveData.test.ts` -- hook targets canonical paths (PATH-02)
- `app/health/route.ts` / `app/api/v1/devices/route.ts` -- aggregator routes exist, smoke-tested during verification (COMMON-01, COMMON-02)

**Tests acceptably missing:**
- Integration tests for `/health` aggregator fan-out -- deferred to phases 166-171 frontend cutovers where consumer UIs create observable test entry points. Not a Nyquist gap for a backend-boundary phase.
- E2E test for service-worker legacy-path cache eviction -- manual verification already documented in 156-VALIDATION.md Manual-Only Verifications table.

**Accepted-as:** partial. PATH-01/PATH-02 regression closed in Phase 164; COMMON-01 spec divergence reconciled in Phase 165 plan-01. Backend behaviour matches spec.

**Reference:** Phase 165 CONTEXT D-11, D-12. v19.0 audit `nyquist.partial_phases` entry.
