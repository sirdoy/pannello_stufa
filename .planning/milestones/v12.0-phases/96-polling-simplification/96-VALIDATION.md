---
phase: 96
slug: polling-simplification
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 96 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | jest.config.ts |
| **Quick run command** | `npx jest --testPathPattern="(stove|lights|thermostat|network|raspi|staleness|adaptive)" --no-coverage` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="(stove|lights|thermostat|network|raspi|staleness|adaptive)" --no-coverage`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 96-01-01 | 01 | 1 | POLL-01 | unit | `npx jest --testPathPattern="useStoveData" --no-coverage` | TBD | ⬜ pending |
| 96-01-02 | 01 | 1 | POLL-02 | unit | `npx jest --testPathPattern="useStoveData" --no-coverage` | TBD | ⬜ pending |
| 96-01-03 | 01 | 1 | POLL-03 | unit | `npx jest --testPathPattern="useStoveData" --no-coverage` | TBD | ⬜ pending |
| 96-02-01 | 02 | 1 | POLL-04 | unit | `npx jest --testPathPattern="ThermostatCard" --no-coverage` | TBD | ⬜ pending |
| 96-02-02 | 02 | 1 | POLL-05 | unit | `npx jest --testPathPattern="useLightsData" --no-coverage` | TBD | ⬜ pending |
| 96-02-03 | 02 | 1 | POLL-06 | unit | `npx jest --testPathPattern="useNetworkData" --no-coverage` | TBD | ⬜ pending |
| 96-02-04 | 02 | 1 | POLL-07 | unit | `npx jest --testPathPattern="useRaspiData" --no-coverage` | TBD | ⬜ pending |
| 96-02-05 | 02 | 1 | POLL-08 | unit | `npx jest --testPathPattern="useDeviceStaleness" --no-coverage` | TBD | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. Jest is configured and all target files have existing test suites.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Stove card loads data at 60s intervals in browser | POLL-01 | Requires real browser timing observation | Open dashboard, verify network tab shows /api/stove calls ~60s apart |
| No Firebase RTDB connection for stove | POLL-02 | Firebase connection is runtime behavior | Check browser DevTools for absence of Firebase WebSocket connection to stove path |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
