---
phase: 89
slug: raspberry-pi-dashboard-card
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-17
---

# Phase 89 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29 + React Testing Library |
| **Config file** | `jest.config.ts` |
| **Quick run command** | `npm test -- --testPathPattern=raspi` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --testPathPattern=raspi --passWithNoTests`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 89-01-01 | 01 | 1 | RASPI-04 | unit | `npm test -- --testPathPattern=deviceTypes` | ❌ W0 | ⬜ pending |
| 89-01-02 | 01 | 1 | RASPI-04 | unit | `npm test -- --testPathPattern=useRaspiData` | ❌ W0 | ⬜ pending |
| 89-01-03 | 01 | 1 | RASPI-04 | unit | `npm test -- --testPathPattern=useRaspiData` | ❌ W0 | ⬜ pending |
| 89-02-01 | 02 | 1 | RASPI-05 | unit | `npm test -- --testPathPattern=RaspiCard` | ❌ W0 | ⬜ pending |
| 89-02-02 | 02 | 1 | RASPI-05 | unit | `npm test -- --testPathPattern=RaspiCard` | ❌ W0 | ⬜ pending |
| 89-02-03 | 02 | 1 | RASPI-07 | unit | `npm test -- --testPathPattern=RaspiCard` | ❌ W0 | ⬜ pending |
| 89-02-04 | 02 | 1 | RASPI-07 | unit | `npm test -- --testPathPattern=RaspiCard` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `app/components/devices/raspi/__tests__/RaspiCard.test.tsx` — stubs for RASPI-05, RASPI-07
- [ ] `app/components/devices/raspi/hooks/__tests__/useRaspiData.test.ts` — stubs for RASPI-04

*Existing `lib/raspi/__tests__/raspiClient.test.ts` covers Phase 88 scope, not Phase 89.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual card layout matches design system | RASPI-05 | CSS visual correctness | Open dashboard, verify 4-metric grid, health badge, accent bar |
| Skeleton shimmer animation | RASPI-07 | Animation rendering | Throttle network, observe skeleton on load |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
