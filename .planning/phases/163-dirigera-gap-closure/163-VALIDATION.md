---
phase: 163
slug: dirigera-gap-closure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-14
---

# Phase 163 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.x (project-configured in `jest.config.js`) |
| **Config file** | `jest.config.js` |
| **Quick run command** | `npm test -- lib/dirigera app/api/v1/dirigera` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~8 seconds (targeted), ~60 seconds (full) |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- lib/dirigera app/api/v1/dirigera`
- **After every plan wave:** Run `npm test -- lib app/api/v1` (broader smoke catches mock bleed)
- **Before `/gsd-verify-work`:** Full suite must be green (`npm test`)
- **Max feedback latency:** ~10s for targeted runs

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 163-01-01 | 01 | 1 | DIR-01/02/03 | — | N/A (types only) | type-check | `npx tsc --noEmit` | ❌ W0 (edit) | ⬜ pending |
| 163-01-02 | 01 | 1 | DIR-01/02/03 | — | N/A | unit | `npm test -- lib/dirigera/__tests__/dirigeraProxy.test.ts` | ❌ W0 (edit) | ⬜ pending |
| 163-01-03 | 01 | 2 | DIR-01 | T-163-01 | 401 without session | unit+route | `npm test -- app/api/v1/dirigera/history` | ❌ W0 (new) | ⬜ pending |
| 163-01-04 | 01 | 2 | DIR-02 | T-163-01 | 401 without session | unit+route | `npm test -- app/api/v1/dirigera/stats` | ❌ W0 (new) | ⬜ pending |
| 163-01-05 | 01 | 2 | DIR-03 | T-163-01 | 401 without session | unit+route | `npm test -- app/api/v1/dirigera/telemetry` | ❌ W0 (new) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `types/dirigeraProxy.ts` — append `SensorHistoryParams` and `SensorTelemetryParams` interfaces (file exists)
- [ ] `lib/dirigera/dirigeraProxy.ts` — append `getHistory`, `getStats`, `getTelemetry` (file exists)
- [ ] `lib/dirigera/__tests__/dirigeraProxy.test.ts` — extend with 3 describe blocks (file exists)
- [ ] `app/api/v1/dirigera/history/route.ts` + `__tests__/route.test.ts` — new
- [ ] `app/api/v1/dirigera/stats/route.ts` + `__tests__/route.test.ts` — new
- [ ] `app/api/v1/dirigera/telemetry/route.ts` + `__tests__/route.test.ts` — new

Framework install: N/A — Jest already configured; auth0 mock factory, `jest.mocked`, console silencing all reused.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Live HA proxy response shape matches declared types | DIR-01/02/03 | Requires running HA proxy instance with DIRIGERA hub | After deploy, curl each endpoint with a valid token and verify JSON matches `SensorHistoryResponse`, `DirigeraStatsResponse`, `SensorTelemetryResponse` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
