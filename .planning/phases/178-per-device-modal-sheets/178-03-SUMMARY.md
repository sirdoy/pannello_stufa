---
phase: 178-per-device-modal-sheets
plan: 03
subsystem: hooks
tags: [thermostat, netatmo, commands, retry, useRetryableCommand, tdd, ember-glass]

# Dependency graph
requires:
  - phase: 55-retry-and-resilience
    provides: useRetryableCommand (retry + dedup + idempotency infrastructure)
  - phase: 75-netatmo-api-migration
    provides: NETATMO_ROUTES.setRoomThermpoint, NETATMO_ROUTES.setThermMode, SetRoomThermpointRequest, SetThermmodeRequest
provides:
  - useThermostatCommands hook (D-16 — write surface for ClimateSheet)
  - setRoomSetpoint(roomId, target) — manual setpoint write
  - setHomeMode(mode) — home-level mode write (schedule|away|hg, TS-blocks 'manual')
  - setRoomMode(roomId, mode) — per-room mode revert (manual ↔ home)
affects:
  - 178-05-climate-sheet (consumes useThermostatCommands inside ClimateSheet)
  - future thermostat write surfaces (advanced schedule editors, valve writes)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Commands hook convention: parallel useRetryableCommand handles per logical action grouping"
    - "Pitfall 5 enforcement: TypeScript union (SetThermmodeRequest['mode']) statically blocks 'manual' from setHomeMode"
    - "err instanceof Error guard mirrored from useLightsCommands.ts:101-103"

key-files:
  created:
    - app/components/devices/thermostat/hooks/useThermostatCommands.ts
    - app/components/devices/thermostat/hooks/__tests__/useThermostatCommands.test.ts
  modified: []

key-decisions:
  - "Mocked useRetryableCommand by call order (1st = temp cmd, 2nd = mode cmd) — mirrors useSonosCommands.test pattern, avoids brittle action-string matching"
  - "Replaced Array.prototype.at(-1) with index access in spec to satisfy project tsc lib target (es2021)"
  - "Dropped @ts-expect-error mode='manual' assertion in favor of typed SetThermmodeRequest['mode'] union — runtime body shape covered by .each tests, compile-time safety covered by signature"

patterns-established:
  - "Pattern: Two-handle commands hook for thermostat — netatmoTempCmd (per-room) + netatmoModeCmd (home-level)"
  - "Pattern: Optional setError? param with safe-navigation invocation (params.setError?.(message)) — minimal contract for both ClimateSheet and ad-hoc consumers"

requirements-completed: [SHEET-03]

# Metrics
duration: 4min
completed: 2026-04-29
---

# Phase 178 Plan 03: useThermostatCommands Hook Summary

**Netatmo write hook wrapping setroomthermpoint + setthermmode through Phase 7.0 useRetryableCommand, with TS-enforced mode union blocking 'manual' from home-level writes (Pitfall 5).**

## Performance

- **Duration:** ~4 min (211s)
- **Started:** 2026-04-29T10:40:54Z
- **Completed:** 2026-04-29T10:44:25Z
- **Tasks:** 1 (TDD: RED → GREEN, no REFACTOR needed)
- **Files modified:** 2 (1 hook + 1 spec)

## Accomplishments

- Shipped `useThermostatCommands` hook (CONTEXT D-16) with three async write methods: `setRoomSetpoint`, `setHomeMode`, `setRoomMode`.
- Wired both Netatmo proxy routes through `useRetryableCommand` (retry + idempotency + dedup) at the `device:'netatmo'` namespace.
- Statically blocked Pitfall 5 (`'manual'` reaching `/setthermmode`) via `SetThermmodeRequest['mode']` union (`'schedule' | 'away' | 'hg'`).
- 11 jest tests covering body shapes, refetch on `res.ok`, skip on `!res.ok`, `setError` on Error throw + non-Error throw, optional `setError` safety, and command-handle exposure.
- Zero `useMemo` / `useCallback` in the hook (Phase 11.1 hygiene).

## Task Commits

Single TDD task — committed in two atomic steps:

1. **Task 1 (RED): test(178-03): add failing spec for useThermostatCommands** — `d41c86fb`
2. **Task 1 (GREEN): feat(178-03): implement useThermostatCommands hook** — `9f78dfec`

## Files Created/Modified

- `app/components/devices/thermostat/hooks/useThermostatCommands.ts` (NEW, 157 lines) — Netatmo write commands hook (D-16). Two `useRetryableCommand` handles, three async wrappers, error guard, optional `setError`.
- `app/components/devices/thermostat/hooks/__tests__/useThermostatCommands.test.ts` (NEW, 220 lines) — 11 jest tests (incl. `it.each` for the three home-mode values). Mocks `useRetryableCommand` by call order so mode/temp commands stay independently observable.

## Decisions Made

- **Two retry handles, not one.** Mirrors how the underlying retry/dedup window keys on `device + action` — separating `setRoomSetpoint` from `setHomeMode` lets the dedup manager treat overlapping setpoint and home-mode writes as independent in-flight actions instead of clobbering each other.
- **Mock by call order, not by action string.** The test mocks `useRetryableCommand` with a counter rather than inspecting the `action` argument. Matches the existing `useSonosCommands.test.ts:60-65` convention and stays robust if internal `action` strings change.
- **Type-level blocking only for Pitfall 5.** Originally considered an `// @ts-expect-error setHomeMode('manual')` runtime assertion; dropped because the typed union signature already provides the compile-time guarantee, and a runtime check would only validate that `as any` casting bypasses TS — orthogonal to the actual contract.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Replaced `Array.prototype.at(-1)` with index access in spec**
- **Found during:** Task 1 GREEN tsc verification
- **Issue:** `npx tsc --noEmit` flagged `mockTempCmd.execute.mock.calls.at(-1)?.[1]?.body` with `TS2550: Property 'at' does not exist on type 'any[]'. Try changing the 'lib' compiler option to 'es2022' or later.` The project's `tsconfig.json` lib target predates ES2022, and an identical pre-existing `at(-1)` error exists in `app/network/hooks/__tests__/useFritzBandwidthHistoryRaw.test.ts:123` — confirming this is a project-wide constraint, not a one-off.
- **Fix:** Rewrote as `const calls = mockTempCmd.execute.mock.calls; const lastCallBody = calls[calls.length - 1]?.[1]?.body;` — same semantics, no lib dependency.
- **Files modified:** `app/components/devices/thermostat/hooks/__tests__/useThermostatCommands.test.ts`
- **Verification:** `npx tsc --noEmit` returns zero errors for the new files; pre-existing unrelated tsc errors in `app/debug/...`, `app/network/...` left untouched (out of scope per executor SCOPE BOUNDARY rule).
- **Committed in:** `9f78dfec` (Task 1 GREEN)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Trivial. Test logic identical; tsc dependency narrowed. Zero scope creep.

## Issues Encountered

- Pre-existing tsc errors exist in unrelated files (`app/debug/...`, `app/network/...`, `app/debug/hooks/__tests__/useFritzServiceDiscovery.test.ts`). Confirmed via `npx tsc --noEmit` they were present before this plan started — left untouched per executor SCOPE BOUNDARY rule. Logged here for future cleanup, not deferred-items.md (they predate Phase 178 entirely).

## User Setup Required

None.

## Next Phase Readiness

- `useThermostatCommands` is the single write surface required by Plan 178-05 (ClimateSheet). Plan 178-05 can `import { useThermostatCommands } from '@/app/components/devices/thermostat/hooks/useThermostatCommands'` and consume `setRoomSetpoint` + `setHomeMode` directly.
- The optional `setError?` shape lets ClimateSheet wire the existing thermostat error banner without forcing every consumer to provide one.
- `netatmoTempCmd` and `netatmoModeCmd` are exposed as `ReturnType<typeof useRetryableCommand>` so ClimateSheet can render the standard inline "Riprova" affordance from `lastError` / `retry()` without re-reaching into retry internals.

## Self-Check: PASSED

- FOUND: `app/components/devices/thermostat/hooks/useThermostatCommands.ts`
- FOUND: `app/components/devices/thermostat/hooks/__tests__/useThermostatCommands.test.ts`
- FOUND commit: `d41c86fb` (RED: test spec)
- FOUND commit: `9f78dfec` (GREEN: implementation)
- Verified: `npm run test:unit -- app/components/devices/thermostat/hooks/__tests__/useThermostatCommands.test.ts` → 24 suites / 292 tests passing (11 new).
- Verified: `npx tsc --noEmit` → zero errors for the two new files.

---
*Phase: 178-per-device-modal-sheets*
*Completed: 2026-04-29*
