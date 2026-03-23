---
phase: 119
slug: rooms-infrastructure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 119 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | jest.config.ts |
| **Quick run command** | `npx jest --passWithNoTests --testPathPattern='rooms'` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --passWithNoTests --testPathPattern='rooms'`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 119-01-01 | 01 | 1 | INFRA-03 | unit | `npx tsc --noEmit types/rooms.ts` | ❌ W0 | ⬜ pending |
| 119-01-02 | 01 | 1 | INFRA-04 | unit | `npx tsc --noEmit lib/rooms/roomsProxy.ts` | ❌ W0 | ⬜ pending |
| 119-02-01 | 02 | 1 | INFRA-06 | unit | `npx tsc --noEmit app/api/rooms/route.ts` | ❌ W0 | ⬜ pending |
| 119-02-02 | 02 | 1 | INFRA-06 | unit | `npx tsc --noEmit app/api/rooms/health/route.ts` | ❌ W0 | ⬜ pending |
| 119-02-03 | 02 | 1 | INFRA-06 | unit | `npx tsc --noEmit app/api/rooms/house/status/route.ts` | ❌ W0 | ⬜ pending |
| 119-02-04 | 02 | 1 | INFRA-06 | unit | `npx tsc --noEmit 'app/api/rooms/[room_id]/route.ts'` | ❌ W0 | ⬜ pending |
| 119-02-05 | 02 | 1 | INFRA-06 | unit | `npx tsc --noEmit 'app/api/rooms/[room_id]/devices/route.ts'` | ❌ W0 | ⬜ pending |
| 119-02-06 | 02 | 1 | INFRA-06 | unit | `npx tsc --noEmit 'app/api/rooms/[room_id]/devices/[device_registry_id]/route.ts'` | ❌ W0 | ⬜ pending |
| 119-02-07 | 02 | 1 | INFRA-06 | unit | `npx tsc --noEmit 'app/api/rooms/[room_id]/status/route.ts'` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
