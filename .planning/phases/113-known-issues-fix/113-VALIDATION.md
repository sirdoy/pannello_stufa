---
phase: 113
slug: known-issues-fix
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 113 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | `jest.config.ts` |
| **Quick run command** | `npx jest --bail --testPathPattern` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --bail --testPathPattern {changed_files}`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 113-01-01 | 01 | 1 | ISSUE-01 | grep | `grep -n 'data.connected' app/debug/components/tabs/HueTab.tsx` | ✅ | ⬜ pending |
| 113-01-02 | 01 | 1 | ISSUE-01 | grep | `grep -n 'data.connected' app/debug/api/components/tabs/HueTab.tsx` | ✅ | ⬜ pending |
| 113-01-03 | 01 | 1 | ISSUE-02 | grep | `grep -n "name: 'bri'" app/debug/components/tabs/HueTab.tsx` | ✅ | ⬜ pending |
| 113-02-01 | 02 | 1 | ISSUE-03 | grep | `grep -c 'cachedAt' app/components/devices/stove/components/StoveStatus.tsx` | ✅ | ⬜ pending |
| 113-02-02 | 02 | 1 | ISSUE-04 | grep | `grep -n 'StoveState' app/components/devices/stove/hooks/useStoveData.ts` | ✅ | ⬜ pending |
| 113-03-01 | 03 | 1 | ISSUE-05 | grep | `grep -c '<button' app/network/components/CopyableIp.tsx` | ✅ | ⬜ pending |
| 113-04-01 | 04 | 1 | ISSUE-06 | unit | `npx jest --bail app/components/ui/__tests__/FormModal.test.tsx` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Stove `last_poll_at` populates at runtime | ISSUE-03 | Requires live proxy response | Check dev tools network tab for `last_poll_at` field in stove status response |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
