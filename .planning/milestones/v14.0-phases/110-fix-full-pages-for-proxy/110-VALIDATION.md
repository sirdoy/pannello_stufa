---
phase: 110
slug: fix-full-pages-for-proxy
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 110 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x + @testing-library/react |
| **Config file** | jest.config.ts |
| **Quick run command** | `npm test -- --testPathPattern="colorUtils\|useLightsData\|useLightsCommands" --no-coverage` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --testPathPattern="colorUtils\|useLightsData\|useLightsCommands\|hue/rooms" --no-coverage`
- **After every plan wave:** Run `npm test -- --testPathPattern="hue\|lights" --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 110-01-01 | 01 | 1 | CMD-01, CMD-02, UI-01, UI-02, CLEAN-04, CLEAN-05, CLEAN-06 | unit + grep | `npm test -- --testPathPattern="useLightsData\|useLightsCommands" --no-coverage` | ✅ | ⬜ pending |
| 110-01-02 | 01 | 1 | CLIENT-02 | unit | `npm test -- --testPathPattern="colorUtils" --no-coverage` | ✅ | ⬜ pending |
| 110-02-01 | 02 | 2 | CMD-03, UI-04, READ-03 | unit + grep | `npm test -- --testPathPattern="useLightsCommands\|hue/rooms" --no-coverage` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements. The colorUtils.test.ts already has the 4 failing tests that need to be fixed (they exist, they just assert the wrong shapes).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| No calls to deleted routes in page source | CLEAN-04, CLEAN-05, CLEAN-06 | Static analysis, not runtime | `grep -r "api/hue/discover\|api/hue/pair\|api/hue/disconnect\|api/hue/remote\|remoteApiAvailable\|pairingStep" app/lights/` should return 0 matches |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
