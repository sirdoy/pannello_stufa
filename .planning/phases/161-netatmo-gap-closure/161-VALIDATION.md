---
phase: 161
slug: netatmo-gap-closure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-09
---

# Phase 161 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | jest.config.ts |
| **Quick run command** | `npx jest --testPathPattern="app/api/v1/netatmo" --bail` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds (v1 route tests only) |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="app/api/v1/netatmo" --bail`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 161-01-01 | 01 | 1 | NETA-01 | — | N/A | unit | `npx jest --testPathPattern="v1/netatmo/getthermstate"` | ❌ W0 | ⬜ pending |
| 161-01-02 | 01 | 1 | NETA-02 | — | N/A | unit | `npx jest --testPathPattern="v1/netatmo/valves/calibrate"` | ❌ W0 | ⬜ pending |
| 161-01-03 | 01 | 1 | NETA-03 | — | N/A | unit | `npx jest --testPathPattern="v1/netatmo/valves/\\[moduleId\\]"` | ❌ W0 | ⬜ pending |
| 161-01-04 | 01 | 1 | NETA-04 | — | N/A | unit | `npx jest --testPathPattern="v1/netatmo/camera/events/\\[eventId\\]"` | ❌ W0 | ⬜ pending |
| 161-01-05 | 01 | 1 | NETA-05 | — | N/A | unit | `npx jest --testPathPattern="v1/netatmo/camera/\\[cameraId\\]/stream"` | ❌ W0 | ⬜ pending |
| 161-01-06 | 01 | 1 | NETA-06 | — | N/A | unit | `npx jest --testPathPattern="v1/netatmo/camera/\\[cameraId\\]/snapshot"` | ❌ W0 | ⬜ pending |
| 161-01-07 | 01 | 1 | NETA-07 | — | N/A | unit | `npx jest --testPathPattern="v1/netatmo/camera/\\[cameraId\\]/monitoring"` | ❌ W0 | ⬜ pending |
| 161-01-08 | 01 | 1 | NETA-08 | — | N/A | unit | `npx jest --testPathPattern="v1/netatmo/renamehome"` | ❌ W0 | ⬜ pending |
| 161-01-09 | 01 | 1 | NETA-09 | — | N/A | unit | `npx jest --testPathPattern="v1/netatmo/gethomedata"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Co-located `__tests__/route.test.ts` files for each new v1 route
- [ ] Mock setup for `lib/netatmo/netatmoProxy.ts` proxy functions

*Existing infrastructure covers test framework and runner.*

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
