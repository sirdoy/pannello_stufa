---
phase: 140
slug: stove-migration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 140 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | jest.config.ts |
| **Quick run command** | `npx jest --testPathPattern="stove" --bail` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds (stove tests) |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="stove" --bail`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 140-01-01 | 01 | 1 | MIG-01 | unit | `npx jest useStoveData` | ✅ | ⬜ pending |
| 140-01-02 | 01 | 1 | MIG-02 | unit | `npx jest useStoveData` | ✅ | ⬜ pending |
| 140-01-03 | 01 | 1 | MIG-03 | unit | `npx jest useStoveData` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.* Test file `__tests__/components/devices/stove/hooks/useStoveData.test.ts` already exists and will be updated with WS-specific test cases.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Stove card updates within ~1s of WS state change | MIG-01 | Real-time latency requires live WS server | Open app, change stove state on device, observe card update timing |
| Tab-hidden polling continues | MIG-03 | Requires manual tab switching | Open app, switch to another tab, verify polling continues in Network tab |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
