---
phase: 106
slug: proxy-client-types-read-endpoints
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 106 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.x |
| **Config file** | jest.config.ts |
| **Quick run command** | `npm test -- --testPathPattern="hue" --passWithNoTests` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --testPathPattern="hue" --passWithNoTests`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 106-01-01 | 01 | 1 | CLIENT-01 | unit | `npm test -- --testPathPattern="hueProxy"` | ❌ W0 | ⬜ pending |
| 106-01-02 | 01 | 1 | CLIENT-02 | tsc | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 106-01-03 | 01 | 1 | CLIENT-03 | unit | `npm test -- --testPathPattern="hueProxy"` | ❌ W0 | ⬜ pending |
| 106-02-01 | 02 | 1 | READ-01 | unit | `npm test -- --testPathPattern="hue/lights"` | ❌ W0 | ⬜ pending |
| 106-02-02 | 02 | 1 | READ-02 | unit | `npm test -- --testPathPattern="hue/lights"` | ❌ W0 | ⬜ pending |
| 106-02-03 | 02 | 1 | READ-03 | unit | `npm test -- --testPathPattern="hue/rooms"` | ❌ W0 | ⬜ pending |
| 106-02-04 | 02 | 1 | READ-04 | unit | `npm test -- --testPathPattern="hue/rooms"` | ❌ W0 | ⬜ pending |
| 106-02-05 | 02 | 1 | READ-05 | unit | `npm test -- --testPathPattern="hue/scenes"` | ❌ W0 | ⬜ pending |
| 106-02-06 | 02 | 1 | READ-06 | unit | `npm test -- --testPathPattern="hue/status"` | ❌ W0 | ⬜ pending |
| 106-02-07 | 02 | 1 | READ-07 | unit | `npm test -- --testPathPattern="hue/history"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `lib/hue/__tests__/hueProxy.test.ts` — unit tests for all 7 convenience wrappers (CLIENT-01, CLIENT-03)
- [ ] `app/api/hue/lights/__tests__/route.test.ts` — READ-01
- [ ] `app/api/hue/lights/[id]/__tests__/route.test.ts` — READ-02
- [ ] `app/api/hue/rooms/__tests__/route.test.ts` — READ-03
- [ ] `app/api/hue/rooms/[id]/__tests__/route.test.ts` — READ-04
- [ ] `app/api/hue/scenes/__tests__/route.test.ts` — READ-05
- [ ] `app/api/hue/status/__tests__/route.test.ts` — READ-06
- [ ] `app/api/hue/history/__tests__/route.test.ts` — READ-07

*(TypeScript compilation CLIENT-02 is verified by the full `npx tsc --noEmit` run — no dedicated test file needed)*

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
