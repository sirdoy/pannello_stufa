---
phase: 168
slug: netatmo-frontend-cutover
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-20
---

# Phase 168 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x + Playwright (smoke) |
| **Config file** | `jest.config.ts`, `playwright.config.ts` |
| **Quick run command** | `npx jest --findRelatedTests <files>` |
| **Full suite command** | `npm test` (Jest only — never `npm run build`) |
| **Estimated runtime** | ~90s Jest full / ~45s Playwright smoke |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --findRelatedTests <modified>` for Jest tests touched; for pure URL-swap commits in debug panels, run `npx tsc --noEmit` equivalent via `npm test` on subset.
- **After every plan wave:** Run full Jest suite.
- **Before `/gsd-verify-work`:** Full Jest + Playwright smoke must be green; repo-wide `grep -rn "/api/netatmo/" app/ lib/ types/` returns zero outside `.planning/`.
- **Max feedback latency:** ~90s

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 168-01-01 | 01 | 1 | NETA-01..NETA-09 | — | Debug panel `app/debug/api/components/tabs/NetatmoTab.tsx` references only `/api/v1/netatmo/*` | grep | `! grep -n "/api/netatmo/" app/debug/api/components/tabs/NetatmoTab.tsx` | ✅ | ⬜ pending |
| 168-01-02 | 01 | 1 | NETA-01..NETA-09 | — | Debug panel `app/debug/components/tabs/NetatmoTab.tsx` references only `/api/v1/netatmo/*` | grep | `! grep -n "/api/netatmo/" app/debug/components/tabs/NetatmoTab.tsx` | ✅ | ⬜ pending |
| 168-02-01 | 02 | 2 | NETA-09 | — | `app/registry/devices/page.tsx` fetch targets v1 | grep | `grep -n "/api/v1/netatmo/homesdata" app/registry/devices/page.tsx` | ✅ | ⬜ pending |
| 168-02-02 | 02 | 2 | — | — | `lib/routes.ts` NETATMO_ROUTES emits v1 paths | grep | `grep -n "/api/v1/netatmo" lib/routes.ts` | ✅ | ⬜ pending |
| 168-02-03 | 02 | 2 | NETA-06 | — | `CameraCard.tsx` JSDoc references v1 path | grep | `grep -n "/api/v1/netatmo/camera/" app/components/devices/camera/CameraCard.tsx` | ✅ | ⬜ pending |
| 168-02-04 | 02 | 2 | — | — | `app/sw.ts` has no `/api/netatmo/` branch | grep | `! grep -n "/api/netatmo/" app/sw.ts` | ✅ | ⬜ pending |
| 168-02-05 | 02 | 2 | — | — | `app/thermostat/page.test.tsx` mocks match v1 endpoints | grep + jest | `grep -n "/api/v1/netatmo/homesdata" app/thermostat/page.test.tsx && npx jest app/thermostat/page.test.tsx` | ✅ | ⬜ pending |
| 168-02-06 | 02 | 2 | — | — | Command palette `deviceCommands.tsx` POSTs to v1 setthermmode (fix hyphen bug) | grep | `grep -n "/api/v1/netatmo/setthermmode" lib/commands/deviceCommands.tsx` | ✅ | ⬜ pending |
| 168-02-07 | 02 | 2 | NETA-09 | — | `useThermostatData` consumes v1 routes | grep | `grep -nE "/api/v1/netatmo/(homesdata\|homestatus)" hooks/useThermostatData.ts` | ✅ | ⬜ pending |
| 168-02-08 | 02 | 2 | — | — | `useScheduleData.ts` derives schedules from `homesdata.body.homes[0].schedules` | grep | `grep -n "homesdata" hooks/useScheduleData.ts` | ✅ | ⬜ pending |
| 168-03-01 | 03 | 3 | — | — | Entire `app/api/netatmo/` tree deleted | fs | `! test -d app/api/netatmo` | ✅ | ⬜ pending |
| 168-03-02 | 03 | 3 | NETA-01..NETA-09 | — | Repo-wide grep sweep returns zero legacy refs outside `.planning/` | grep | `! grep -rn "/api/netatmo/" app/ lib/ types/ hooks/ components/` | ✅ | ⬜ pending |
| 168-03-03 | 03 | 3 | NETA-01..NETA-09 | — | Jest full suite green | jest | `npm test -- --ci --bail` | ✅ | ⬜ pending |
| 168-03-04 | 03 | 3 | NETA-01..NETA-09 | — | Playwright smoke green | playwright | `npx playwright test tests/e2e/smoke/` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] None — existing Jest + Playwright infrastructure covers all phase requirements.

*Note: v1 route wrappers from Phase 161 may need light shape adjustments (wrap `homesdata`/`homestatus`, add 302 redirect to `camera/[cameraId]/snapshot`) — these live in Plan 02 as executor tasks, not Wave 0 stubs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Thermostat setpoint change via UI | NETA-01 | Requires live Netatmo hardware | Open `/thermostat`, change setpoint, verify RTDB + physical valve response |
| Valve calibration trigger | NETA-02, NETA-03 | Requires live valve | Trigger bulk calibrate from debug panel; trigger per-module calibrate |
| Camera snapshot `<img>` display | NETA-06 | Requires live camera + 302 redirect behavior | Load camera panel, confirm snapshot renders in `<img src>` without CORS errors |
| Camera monitoring toggle | NETA-07 | Requires live camera | Toggle monitoring on/off, confirm RTDB + camera state update |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references — N/A (no Wave 0 needed)
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter after planner sign-off

**Approval:** pending
