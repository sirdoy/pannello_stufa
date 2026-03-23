---
phase: 122
slug: room-management-ui
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 122 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | jest.config.ts |
| **Quick run command** | `npx jest --testPathPattern rooms` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern rooms`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 122-01-01 | 01 | 1 | ROOM-01 | unit | `npx jest --testPathPattern rooms` | ❌ W0 | ⬜ pending |
| 122-01-02 | 01 | 1 | ROOM-02 | unit | `npx jest --testPathPattern rooms` | ❌ W0 | ⬜ pending |
| 122-01-03 | 01 | 1 | ROOM-03 | unit | `npx jest --testPathPattern rooms` | ❌ W0 | ⬜ pending |
| 122-01-04 | 01 | 1 | ROOM-04 | unit | `npx jest --testPathPattern rooms` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/app/rooms/page.test.tsx` — test stubs for ROOM-01 through ROOM-04
- [ ] Mock setup for DataTable, FormModal, ConfirmationDialog, Toast

*Existing Jest infrastructure covers all framework needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual layout matches SettingsLayout pattern | ROOM-01 | Visual verification | Navigate to /rooms, verify layout matches /registry/types |

*Most behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
