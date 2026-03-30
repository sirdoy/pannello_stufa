---
phase: 147
slug: tuya-infrastructure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-30
---

# Phase 147 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | `jest.config.ts` |
| **Quick run command** | `npx jest --testPathPattern tuya --no-coverage` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds (tuya only) |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern tuya --no-coverage`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 147-01-01 | 01 | 1 | TUYA-01 | unit | `npx jest tuyaProxy --no-coverage` | ❌ W0 | ⬜ pending |
| 147-01-02 | 01 | 1 | TUYA-02 | unit | `npx jest tuyaProxy --no-coverage` | ❌ W0 | ⬜ pending |
| 147-02-01 | 02 | 1 | TUYA-03 | unit | `npx jest tuya/health --no-coverage` | ❌ W0 | ⬜ pending |
| 147-02-02 | 02 | 1 | TUYA-04 | unit | `npx jest tuya/plugs --no-coverage` | ❌ W0 | ⬜ pending |
| 147-02-03 | 02 | 1 | TUYA-05 | unit | `npx jest tuya/plugs --no-coverage` | ❌ W0 | ⬜ pending |
| 147-02-04 | 02 | 1 | TUYA-06 | unit | `npx jest tuya/plugs --no-coverage` | ❌ W0 | ⬜ pending |
| 147-02-05 | 02 | 1 | TUYA-07 | unit | `npx jest tuya/plugs --no-coverage` | ❌ W0 | ⬜ pending |
| 147-02-06 | 02 | 1 | TUYA-08 | unit | `npx jest tuya/plugs --no-coverage` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `lib/tuya/__tests__/tuyaProxy.test.ts` — unit tests for proxy client functions
- [ ] `app/api/tuya/health/__tests__/route.test.ts` — health route test
- [ ] `app/api/tuya/plugs/__tests__/route.test.ts` — plugs list route test
- [ ] `app/api/tuya/plugs/[device_id]/__tests__/route.test.ts` — single plug route test
- [ ] `app/api/tuya/plugs/[device_id]/state/__tests__/route.test.ts` — state command route test
- [ ] `app/api/tuya/plugs/[device_id]/timer/__tests__/route.test.ts` — timer command route test
- [ ] `app/api/tuya/plugs/[device_id]/history/__tests__/route.test.ts` — history route test

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Health endpoint returns live data | TUYA-03 | Requires running HA proxy | `curl localhost:3000/api/tuya/health` |
| Plug list returns real devices | TUYA-04 | Requires running HA proxy | `curl -H "X-API-Key: KEY" localhost:3000/api/tuya/plugs` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
