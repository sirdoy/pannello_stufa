---
phase: 123
slug: room-device-assignment
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 123 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | jest.config.ts |
| **Quick run command** | `npm test -- --testPathPattern="rooms"` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --testPathPattern="rooms"`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 123-01-01 | 01 | 1 | ROOM-05 | unit | `npm test -- --testPathPattern="rooms/\\[room_id\\]"` | ❌ W0 | ⬜ pending |
| 123-01-02 | 01 | 1 | ROOM-06 | unit | `npm test -- --testPathPattern="rooms/\\[room_id\\]"` | ❌ W0 | ⬜ pending |
| 123-01-03 | 01 | 1 | ROOM-07 | unit | `npm test -- --testPathPattern="rooms/\\[room_id\\]"` | ❌ W0 | ⬜ pending |
| 123-01-04 | 01 | 1 | ROOM-05 | unit | `npm test -- --testPathPattern="rooms/__tests__/page"` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `app/rooms/[room_id]/__tests__/page.test.tsx` — stubs for ROOM-05, ROOM-06, ROOM-07
- [ ] Test mocks for fetch calls to room devices, registry devices, and room metadata APIs

*Existing infrastructure covers test framework and config.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual layout matches SettingsLayout pattern | ROOM-05 | Visual comparison | Open /rooms/{id}, verify back button, heading, table layout |
| Toast messages display correctly | ROOM-06, ROOM-07 | Toast timing/visibility | Assign and remove devices, verify toast text and dismissal |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
