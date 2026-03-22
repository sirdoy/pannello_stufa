---
phase: 114
slug: type-safety-lib
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 114 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest (next/jest transformer) |
| **Config file** | `jest.config.ts` |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~60 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npm test -- --testPathPattern="useNetworkQuality\|useRoomStatus\|unifiedDeviceConfig\|notificationActions" --passWithNoTests` + `npx tsc --noEmit`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 114-01-01 | 01 | 1 | TYPE-01 | unit (tsc) | `npx tsc --noEmit` | N/A — compile check | ⬜ pending |
| 114-01-02 | 01 | 1 | TYPE-02 | unit | `npm test -- --testPathPattern="useNetworkQuality"` | ✅ | ⬜ pending |
| 114-01-03 | 01 | 1 | TYPE-03 | unit (tsc) | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 114-01-04 | 01 | 1 | TYPE-04 | unit | `npm test -- --testPathPattern="useRoomStatus"` | ✅ | ⬜ pending |
| 114-01-05 | 01 | 1 | TYPE-05 | unit (tsc) | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 114-01-06 | 01 | 1 | TYPE-06 | unit (tsc) | `npx tsc --noEmit` | N/A — compile check | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `lib/notifications/__tests__/notificationActions.test.ts` — covers TYPE-03 (`supportsNotificationActions()` and `getNotificationCapabilities()` compile and return expected values)
- [ ] `lib/services/__tests__/unifiedDeviceConfigService.test.ts` — covers TYPE-05 (`getVisibleDashboardCards` and `getAllDevicesForSettings` return typed metadata)

*These tests verify behavior, not just compilation — useful for regression protection after the type changes.*

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
