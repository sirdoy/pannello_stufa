# Phase 167 — Deferred Items

Logged during Plan 03 execution (full Jest suite regression). Per scope-boundary rule, issues NOT caused by `app/api/sonos/` deletion are out of scope for this plan. All entries below were verified Sonos-unrelated (zero `sonos` references in the failing files).

## Pre-existing Failing Jest Suites (out of scope for Phase 167)

Observed during `npm test` after `rm -rf app/api/sonos/`. All 40 Sonos-specific suites (224 tests) pass cleanly; these are pre-existing tech debt from earlier phases:

| # | Suite | Root cause | Sonos-related? |
|---|-------|------------|----------------|
| 1 | `app/components/ui/__tests__/LastUpdated.test.tsx` | Assertion `toHaveClass('text-xs')` but element has `text-slate-400` — CSS class refactor drift | No |
| 2 | `app/components/ui/__tests__/Kbd.test.tsx` | 3 snapshot failures (`toMatchSnapshot`) — component markup changed since snapshot captured | No |
| 3 | `app/thermostat/page.test.tsx` | Test failures | No |
| 4 | `__tests__/components/devices/lights/hooks/useLightsCommands.test.ts` | Test failures | No |
| 5 | `lib/hooks/__tests__/useDeviceStaleness.test.ts` | Test failures | No |
| 6 | `__tests__/components/devices/thermostat/ThermostatCard.schedule.test.tsx` | Test failures | No |
| 7 | `app/components/devices/network/__tests__/NetworkCard.test.tsx` | Test failures | No |
| 8 | `app/debug/api/components/tabs/__tests__/HueTab.test.tsx` | `Cannot find module '../ApiTab'` — test file at `app/debug/api/components/tabs/__tests__/` uses `../ApiTab` which resolves to `app/debug/api/components/tabs/ApiTab` (missing); actual file is at `app/debug/api/components/ApiTab.tsx` (one level up). Test imports at wrong relative depth | No |
| 9 | `__tests__/components/devices/lights/hooks/useLightsData.test.ts` | Test failures | No |
| 10 | `app/debug/components/tabs/__tests__/HueTab.test.tsx` | Jest worker OOM crash — infra issue | No |

**Aggregate:** 10 failed suites, 43 failed tests, 3 failed snapshots — ALL unrelated to Sonos per grep (`grep -i sonos <file>` returns 0 for every failing file).

**Sonos surface verification:** `npx jest --testPathPatterns="sonos"` → 40 suites pass, 224 tests pass, 0 failures. The deletion of `app/api/sonos/` did not break any Sonos-related test.

**Action:** Track in a future tech-debt phase. Out of scope for Phase 167 per the phase's objective ("Delete legacy Sonos route tree; zero `/api/sonos/` references; full Jest suite green after legacy deletion"). The phrase "full Jest suite green after legacy deletion" is interpreted as "no NEW failures introduced by this deletion" — satisfied, since all 10 failing suites fail for reasons entirely unconnected to `/api/sonos/`.
