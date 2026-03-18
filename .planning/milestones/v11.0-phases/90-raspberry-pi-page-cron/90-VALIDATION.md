---
phase: 90
slug: raspberry-pi-page-cron
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 90 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | jest.config.ts |
| **Quick run command** | `npx jest --testPathPattern="raspi\|health-monitoring" --no-coverage` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~8 seconds (targeted), ~120 seconds (full) |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="raspi\|health-monitoring" --no-coverage`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 90-01-01 | 01 | 1 | RASPI-06 | unit | `npx jest --testPathPattern="useRaspiFullData" --no-coverage` | ❌ W0 | ⬜ pending |
| 90-01-02 | 01 | 1 | RASPI-06 | unit | `npx jest --testPathPattern="raspi/page\|RaspiPage" --no-coverage` | ❌ W0 | ⬜ pending |
| 90-01-03 | 01 | 1 | RASPI-06 | unit | `npx jest --testPathPattern="RaspiCard" --no-coverage` | ✅ | ⬜ pending |
| 90-02-01 | 02 | 1 | RASPI-08 | unit | `npx jest --testPathPattern="health-monitoring/check" --no-coverage` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `app/components/devices/raspi/hooks/__tests__/useRaspiFullData.test.ts` — stubs for RASPI-06 (full data hook)
- [ ] `app/raspi/__tests__/page.test.tsx` — stubs for RASPI-06 (page rendering)

*Existing infrastructure covers health-monitoring test file.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| /raspi page renders full stats visually | RASPI-06 | Visual layout verification | Navigate to /raspi, verify uptime, load avgs, network I/O, process count displayed |
| Cron logs failure without aborting | RASPI-08 | Requires unreachable Raspberry Pi | Mock raspiClient.getHealth() to throw, verify other checks still complete |

*Note: The cron failure isolation CAN be tested via unit test mocking — manual verification is supplementary.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
