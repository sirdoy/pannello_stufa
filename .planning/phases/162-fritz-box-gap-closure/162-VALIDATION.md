---
phase: 162
slug: fritz-box-gap-closure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-09
---

# Phase 162 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | `jest.config.ts` |
| **Quick run command** | `npx jest --testPathPattern="fritzbox" --bail` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="fritzbox" --bail`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 162-01-01 | 01 | 1 | FRITZ-01 | — | N/A | unit | `npx jest --testPathPattern="telephony/dect"` | ❌ W0 | ⬜ pending |
| 162-01-02 | 01 | 1 | FRITZ-02 | — | N/A | unit | `npx jest --testPathPattern="telephony/calls"` | ❌ W0 | ⬜ pending |
| 162-01-03 | 01 | 1 | FRITZ-03 | — | N/A | unit | `npx jest --testPathPattern="telephony/tam"` | ❌ W0 | ⬜ pending |
| 162-01-04 | 01 | 1 | FRITZ-04 | — | N/A | unit | `npx jest --testPathPattern="history"` | ✅ | ⬜ pending |
| 162-01-05 | 01 | 1 | FRITZ-05 | — | N/A | unit | `npx jest --testPathPattern="history/devices"` | ❌ W0 | ⬜ pending |
| 162-01-06 | 01 | 1 | FRITZ-06 | — | N/A | unit | `npx jest --testPathPattern="device-events"` | ✅ | ⬜ pending |
| 162-01-07 | 01 | 1 | FRITZ-07 | — | N/A | unit | `npx jest --testPathPattern="service-discovery"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `app/api/fritzbox/telephony/dect/__tests__/route.test.ts` — stubs for FRITZ-01
- [ ] `app/api/fritzbox/telephony/calls/__tests__/route.test.ts` — stubs for FRITZ-02
- [ ] `app/api/fritzbox/telephony/tam/__tests__/route.test.ts` — stubs for FRITZ-03
- [ ] `app/api/fritzbox/service-discovery/__tests__/route.test.ts` — stubs for FRITZ-07

*Existing test infrastructure covers FRITZ-04 and FRITZ-06.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| TR-064 XML parsing | FRITZ-07 | HA proxy XML format unknown until runtime | Verify against real proxy response |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
