---
phase: 108
slug: frontend-hooks-rewrite
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 108 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | jest.config.ts |
| **Quick run command** | `npx jest --testPathPattern="lights" --bail` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~45 seconds (lights tests), ~120 seconds (full) |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="lights" --bail`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 108-01-01 | 01 | 1 | UI-01 | unit | `npx jest --testPathPattern="useLightsData"` | ✅ | ⬜ pending |
| 108-01-02 | 01 | 1 | UI-02 | unit | `npx jest --testPathPattern="useLightsCommands"` | ✅ | ⬜ pending |
| 108-01-03 | 01 | 1 | UI-03 | unit | `npx jest --testPathPattern="useLightsData"` | ✅ | ⬜ pending |
| 108-01-04 | 01 | 1 | UI-04 | unit | `npx jest --testPathPattern="useLightsCommands"` | ✅ | ⬜ pending |
| 108-01-05 | 01 | 1 | UI-05 | unit | `npx jest --testPathPattern="useLightsCommands"` | ✅ | ⬜ pending |
| 108-01-06 | 01 | 1 | UI-06 | unit | `npx jest --testPathPattern="useLightsData"` | ✅ | ⬜ pending |
| 108-02-01 | 02 | 2 | UI-01..06 | integration | `npx jest --testPathPattern="LightsCard"` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements. Test files already exist:*
- `__tests__/components/devices/lights/hooks/useLightsData.test.ts`
- `__tests__/components/devices/lights/hooks/useLightsCommands.test.ts`
- `__tests__/components/devices/lights/LightsCard.orchestrator.test.tsx`
- `__tests__/components/devices/lights/components/LightsRoomControl.test.tsx`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Brightness slider smooth drag | UI-03 | Requires visual interaction | Drag slider, verify 0-100% display while API receives 0-254 |
| No visible behavior change | All | Full visual parity check | Compare LightsCard appearance/behavior before and after migration |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
