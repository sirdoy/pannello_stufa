---
phase: 148
slug: tuya-frontend
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-30
---

# Phase 148 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | jest.config.ts |
| **Quick run command** | `npx jest --testPathPattern="tuya\|Tuya" --no-coverage` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds (tuya subset) |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="tuya\|Tuya" --no-coverage`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 148-01-01 | 01 | 1 | TUYA-09 | unit | `npx jest useTuyaData` | ❌ W0 | ⬜ pending |
| 148-01-02 | 01 | 1 | TUYA-10 | unit | `npx jest useTuyaCommands` | ❌ W0 | ⬜ pending |
| 148-02-01 | 02 | 1 | TUYA-11 | unit | `npx jest TuyaCard` | ❌ W0 | ⬜ pending |
| 148-02-02 | 02 | 1 | UX-02 | unit | `npx jest TuyaCard --testNamePattern=LastUpdated` | ❌ W0 | ⬜ pending |
| 148-03-01 | 03 | 2 | TUYA-12 | unit | `npx jest tuya/page` | ❌ W0 | ⬜ pending |
| 148-03-02 | 03 | 2 | TUYA-14 | unit | `npx jest TuyaEnergyChart` | ❌ W0 | ⬜ pending |
| 148-01-02 | 01 | 1 | TUYA-13 | grep | `grep tuya lib/devices/deviceTypes.ts` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `app/components/devices/tuya/hooks/__tests__/useTuyaData.test.ts` — stubs for TUYA-09
- [ ] `app/components/devices/tuya/hooks/__tests__/useTuyaCommands.test.ts` — stubs for TUYA-10
- [ ] `app/components/devices/tuya/__tests__/TuyaCard.test.tsx` — stubs for TUYA-11, UX-02
- [ ] `app/tuya/__tests__/page.test.tsx` — stubs for TUYA-12, TUYA-14

*Existing infrastructure covers test framework — only test files needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| WS live update | TUYA-09 | Needs running WS server | Connect to dev, verify data updates without refresh |
| On/off toggle reflects immediately | TUYA-10 | Needs real Tuya proxy | Toggle plug, verify state change in UI |
| Energy chart renders correctly | TUYA-14 | Visual verification | Select 24h/7d/30d, verify chart populates |
| Nav menu entry works | TUYA-13 | Navigation test | Click Tuya in nav, verify /tuya loads without 404 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
