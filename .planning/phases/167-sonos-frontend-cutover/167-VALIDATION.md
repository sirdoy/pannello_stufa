---
phase: 167
slug: sonos-frontend-cutover
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-20
---

# Phase 167 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x (unit/integration) + Playwright (smoke) |
| **Config file** | `jest.config.ts` + `playwright.config.ts` |
| **Quick run command** | `npm test -- --findRelatedTests <changed-files>` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~60s jest full suite; ~120s Playwright smoke |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --findRelatedTests <changed-files>`
- **After every plan wave:** Run `npm test` (full Jest suite)
- **Before `/gsd-verify-work`:** Full Jest suite + `npx playwright test --grep @smoke` must be green
- **Max feedback latency:** 60s

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 167-01-01 | 01 | 1 | SONOS-01 | T-167-01 | `/api/v1/sonos/health` requires X-API-Key via `withAuthAndErrorHandler` | unit | `npm test -- app/api/v1/sonos/health/__tests__/route.test.ts` | ❌ W0 | ⬜ pending |
| 167-01-02 | 01 | 1 | SONOS-02 | T-167-01 | `/api/v1/sonos/devices` requires auth; returns `{ devices: [] }` envelope | unit | `npm test -- app/api/v1/sonos/devices/__tests__/route.test.ts` | ❌ W0 | ⬜ pending |
| 167-01-03 | 01 | 1 | SONOS-03 | T-167-01 | `/api/v1/sonos/zones` requires auth; returns `{ zones: [] }` envelope | unit | `npm test -- app/api/v1/sonos/zones/__tests__/route.test.ts` | ❌ W0 | ⬜ pending |
| 167-01-04 | 01 | 1 | SONOS-04, SONOS-08 | T-167-01 | `speakers/[uid]/volume` GET+PUT auth; PUT returns 202+suggested_poll_delay_s | unit | `npm test -- app/api/v1/sonos/speakers/[uid]/volume/__tests__/route.test.ts` | ❌ W0 | ⬜ pending |
| 167-01-05 | 01 | 1 | SONOS-08 | T-167-01 | `speakers/[uid]/mute` PUT auth; 202 response | unit | `npm test -- app/api/v1/sonos/speakers/[uid]/mute/__tests__/route.test.ts` | ❌ W0 | ⬜ pending |
| 167-01-06 | 01 | 1 | SONOS-12 | T-167-01 | `speakers/[uid]/eq` GET+PUT auth; 202 on PUT | unit | `npm test -- app/api/v1/sonos/speakers/[uid]/eq/__tests__/route.test.ts` | ❌ W0 | ⬜ pending |
| 167-01-07 | 01 | 1 | SONOS-12 | T-167-01 | `speakers/[uid]/home-theater` GET+PUT auth; 202 on PUT | unit | `npm test -- app/api/v1/sonos/speakers/[uid]/home-theater/__tests__/route.test.ts` | ❌ W0 | ⬜ pending |
| 167-01-08 | 01 | 1 | SONOS-12 | T-167-01 | `speakers/[uid]/source` POST auth; 202 response | unit | `npm test -- app/api/v1/sonos/speakers/[uid]/source/__tests__/route.test.ts` | ❌ W0 | ⬜ pending |
| 167-01-09 | 01 | 1 | SONOS-13 | T-167-01 | `speakers/[uid]/join` POST auth; 202 response | unit | `npm test -- app/api/v1/sonos/speakers/[uid]/join/__tests__/route.test.ts` | ❌ W0 | ⬜ pending |
| 167-01-10 | 01 | 1 | SONOS-13 | T-167-01 | `speakers/[uid]/unjoin` POST auth; 202 response | unit | `npm test -- app/api/v1/sonos/speakers/[uid]/unjoin/__tests__/route.test.ts` | ❌ W0 | ⬜ pending |
| 167-01-11 | 01 | 1 | SONOS-07 | T-167-01 | `/api/v1/sonos/history` GET auth; passes through type/start/end/limit query params | unit | `npm test -- app/api/v1/sonos/history/__tests__/route.test.ts` | ❌ W0 | ⬜ pending |
| 167-02-01 | 02 | 2 | SONOS-01, SONOS-03, SONOS-04 | T-167-02 | useSonosData fetches only `/api/v1/sonos/*` | unit | `npm test -- app/components/devices/sonos/hooks/__tests__/useSonosData.test.ts` | ✅ | ⬜ pending |
| 167-02-02 | 02 | 2 | SONOS-02, SONOS-04, SONOS-12 | T-167-02 | useSonosFullData fetches only `/api/v1/sonos/*` | unit | `npm test -- app/components/devices/sonos/hooks/__tests__/useSonosFullData.test.ts` | ✅ | ⬜ pending |
| 167-02-03 | 02 | 2 | SONOS-05, SONOS-06, SONOS-08, SONOS-09, SONOS-10, SONOS-11, SONOS-12, SONOS-13 | T-167-02 | useSonosCommands posts/puts only to `/api/v1/sonos/*` | unit | `npm test -- app/components/devices/sonos/hooks/__tests__/useSonosCommands.test.ts` | ✅ | ⬜ pending |
| 167-02-04 | 02 | 2 | SONOS-11 | T-167-02 | useSonosQueue fetches `/api/v1/sonos/zones/{gid}/queue` | unit | `npm test -- app/components/devices/sonos/hooks/__tests__/useSonosQueue.test.ts` | ✅ | ⬜ pending |
| 167-02-05 | 02 | 2 | SONOS-07 | T-167-02 | useSonosHistory fetches `/api/v1/sonos/history` | manual | `grep -n "/api/v1/sonos/history" app/components/devices/sonos/hooks/useSonosHistory.ts` | ✅ | ⬜ pending |
| 167-03-01 | 03 | 3 | ALL | T-167-03 | `app/api/sonos/` directory does not exist after deletion | unit | `test ! -d app/api/sonos` | ✅ | ⬜ pending |
| 167-03-02 | 03 | 3 | ALL | T-167-03 | Zero `/api/sonos/` references remain in `app/` and `components/` | unit | `! grep -rn '/api/sonos/' app/ components/ 2>/dev/null \| grep -v 'planning/\\|node_modules\\|.next'` | ✅ | ⬜ pending |
| 167-03-03 | 03 | 3 | ALL | T-167-03 | Full Jest suite green | integration | `npm test` | ✅ | ⬜ pending |
| 167-03-04 | 03 | 3 | SC-3, SC-4 | T-167-03 | Playwright smoke green | e2e | `npx playwright test --grep @smoke` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `app/api/v1/sonos/health/__tests__/route.test.ts` — stubs for SONOS-01
- [ ] `app/api/v1/sonos/devices/__tests__/route.test.ts` — stubs for SONOS-02
- [ ] `app/api/v1/sonos/zones/__tests__/route.test.ts` — stubs for SONOS-03
- [ ] `app/api/v1/sonos/speakers/[uid]/volume/__tests__/route.test.ts` — stubs for SONOS-04, SONOS-08
- [ ] `app/api/v1/sonos/speakers/[uid]/mute/__tests__/route.test.ts` — stubs for SONOS-08
- [ ] `app/api/v1/sonos/speakers/[uid]/eq/__tests__/route.test.ts` — stubs for SONOS-12
- [ ] `app/api/v1/sonos/speakers/[uid]/home-theater/__tests__/route.test.ts` — stubs for SONOS-12
- [ ] `app/api/v1/sonos/speakers/[uid]/source/__tests__/route.test.ts` — stubs for SONOS-12
- [ ] `app/api/v1/sonos/speakers/[uid]/join/__tests__/route.test.ts` — stubs for SONOS-13
- [ ] `app/api/v1/sonos/speakers/[uid]/unjoin/__tests__/route.test.ts` — stubs for SONOS-13
- [ ] `app/api/v1/sonos/history/__tests__/route.test.ts` — stubs for SONOS-07

*Existing hook tests cover Plan 02 URL assertions — no new hook-test files required.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| useSonosHistory URL rewrite | SONOS-07 | No existing test file (Phase 167 CONTEXT D-16 — not adding coverage in-phase) | `grep -n "/api/v1/sonos/history" app/components/devices/sonos/hooks/useSonosHistory.ts` must match; `grep -n "/api/sonos/" app/components/devices/sonos/hooks/useSonosHistory.ts` must be empty |
| Browser smoke: transport controls | SC-3 | E2E interaction, post-deletion | Manually open /sonos page in dev server, verify play/pause/next/previous on at least one zone |
| Browser smoke: queue + play-mode + sleep-timer | SC-3 | E2E interaction | Exercise queue page, toggle play-mode, set+cancel sleep timer via UI |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (11 new route test files)
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
