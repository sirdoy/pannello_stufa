# Phase 102: Scheduler Update - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrate the scheduler/cron route (`app/api/scheduler/check/route.ts`) from direct WiNet API calls (`lib/stoveApi.ts`) to the proxy client (`lib/thermorossiProxy.ts`). All state-based decisions use `stove_state` exact strings. Alarm notifications use `error_code`/`error_description`. No new scheduler features — this is a transport and response-format adaptation.

</domain>

<decisions>
## Implementation Decisions

### Import migration
- Replace all `lib/stoveApi` imports with `lib/thermorossiProxy` equivalents
- Mapping: `getStoveStatus` → `getStatus`, `getFanLevel`/`getPowerLevel` → removed (status includes both), `igniteStove` → `sendIgnit`, `shutdownStove` → `sendShutdown`, `setPowerLevel` → `setPower`, `setFanLevel` → `setFan`
- No stoveApi imports should remain in the scheduler route after migration

### State string mapping (exact equality)
- All `.includes('WORK')` checks → `=== 'working'`
- All `.includes('START')` checks → `=== 'igniting'`
- All `.includes('MODULATION')` checks → `=== 'modulating'`
- `isOn` derived as: `stove_state === 'working' || stove_state === 'igniting' || stove_state === 'modulating'`
- No substring matching, no regex, no `.toUpperCase()` — exact equality against `StoveState` union type

### API call consolidation (fetchStoveData)
- Replace 3 parallel calls (`getStoveStatus`, `getFanLevel`, `getPowerLevel`) with single `getStatus()` from thermorossiProxy
- `getStatus()` returns `{ stove_state, power_level, fan_level, data_freshness, error_code, error_description }`
- `currentStatus` becomes `statusData.stove_state` (lowercase string, not `StatusDescription`)
- `currentPowerLevel` becomes `statusData.power_level` (direct field, not `Result`)
- `currentFanLevel` becomes `statusData.fan_level` (direct field, not `Result`)
- Catch block: if `getStatus()` throws, set `statusFetchFailed = true` (same safety behavior)

### Command signature changes
- `igniteStove(active.power)` → `sendIgnit()` (no power argument — proxy ignit takes no params)
- After `sendIgnit()`, call `setPower(active.power)` separately to set the desired power level
- `shutdownStove()` → `sendShutdown()`
- `setPowerLevel(level)` → `setPower(level)` (same semantics, different function name)
- `setFanLevel(level)` → `setFan(level)` (same semantics, different function name)

### handleIgnition confirmation check
- Confirmation re-fetch uses `getStatus()` from thermorossiProxy instead of `getStoveStatus()` from stoveApi
- Check `confirmStatus.stove_state === 'working' || confirmStatus.stove_state === 'igniting'` for already-on detection

### updateStoveState strings
- `updateStoveState({ status: 'START' })` → `updateStoveState({ status: 'igniting' })`
- `updateStoveState({ status: 'STANDBY' })` → `updateStoveState({ status: 'standby' })`
- These are Firebase state entries used internally — align with proxy stove_state values for consistency

### sendStoveStatusWorkNotification
- `currentStatus.includes('WORK')` → `currentStatus === 'working'`
- Notification message update: replace "stato WORK" with "stato working" (or keep Italian equivalent)

### Alarm/error notification (CRON-02)
- After `getStatus()` in `fetchStoveData`, check `stove_state === 'alarm'`
- When alarm detected, extract `error_code` and `error_description` from status response
- Pass error details to a notification trigger (use existing `triggerStoveUnexpectedOffServer` or create alarm-specific path)
- Error description text goes directly into notification message body

### trackUsageHours adaptation
- `trackUsageHours(currentStatus)` still receives a string — now receives `stove_state` value
- Update `maintenanceServiceAdmin.ts`: `stoveStatus.includes('WORK') || stoveStatus.includes('MODULATION')` → `stoveStatus === 'working' || stoveStatus === 'modulating'`
- This is a 2-line change in a dependent file, justified because the scheduler passes the status string

### PID automation
- `currentStatus.includes('WORK')` → `currentStatus === 'working'`
- `setPowerLevel(targetPower as any)` → `setPower(targetPower)`
- No other PID logic changes — PID reads from Firebase/Netatmo, only the stove power command changes

### Thermorossi proxy health check
- Add thermorossi proxy health alongside existing Netatmo proxy health in the cron
- Use `getHealth()` from thermorossiProxy, save to Firebase at `thermorossi/proxyHealth`
- Same pattern as Netatmo health check (lines 993-1014): try/catch with unreachable fallback

### Claude's Discretion
- Whether to add the thermorossi health check in this phase or defer to Phase 103
- Exact alarm notification trigger (reuse existing trigger or add new one)
- Whether `updateStoveState` type needs updating for new status strings
- Test file updates for the scheduler route

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Proxy API specification
- `docs/api/thermorossi.md` — Complete Thermorossi proxy API: status response shape (stove_state, power_level, fan_level, data_freshness, error_code, error_description), command endpoints, state mapping table
- `docs/api/README.md` — HA proxy authentication (X-API-Key), RFC 9457 error format

### Proxy client (use this)
- `lib/thermorossiProxy.ts` — All convenience wrappers: getStatus, sendIgnit, sendShutdown, setPower, setFan, getHealth
- `types/thermorossiProxy.ts` — TypeScript types: ThermorossiStatusResponse, ThermorossiCommandResponse, StoveState union

### Scheduler route (to modify)
- `app/api/scheduler/check/route.ts` — Main scheduler route (~1032 lines), all stoveApi calls to migrate
- `app/api/scheduler/check/__tests__/route.test.ts` — Existing test suite, must be updated for new imports and response shapes

### Dependent file (to modify)
- `lib/maintenanceServiceAdmin.ts` — `trackUsageHours()` uses `.includes('WORK')` / `.includes('MODULATION')` — needs exact equality

### WiNet client (being replaced)
- `lib/stoveApi.ts` — Current import source for stove functions in scheduler — all imports removed after this phase

### Prior phase context
- `.planning/phases/99-proxy-client-foundation/99-CONTEXT.md` — Client pattern, type definitions, stove_state union
- `.planning/phases/100-control-endpoints/100-CONTEXT.md` — Command wrapper decisions, 202 Accepted pattern
- `.planning/phases/101-frontend-hooks/101-CONTEXT.md` — State string mapping precedent (stoveStatusUtils rewrite)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/thermorossiProxy.ts`: All stove API functions ready (getStatus, sendIgnit, sendShutdown, setPower, setFan, getHealth)
- `types/thermorossiProxy.ts`: `ThermorossiStatusResponse` type with all fields including `stove_state`, `error_code`, `error_description`
- `StoveState` union type: `"off" | "igniting" | "working" | "standby" | "cleaning" | "alarm" | "modulating"`

### Established Patterns
- Phase 101 already established stove_state exact equality pattern in `stoveStatusUtils.ts` — same approach here
- Netatmo proxy health check pattern at scheduler route lines 993-1014 — reuse for thermorossi health
- Fire-and-forget async tasks in scheduler (weather, token cleanup, calibration) — same pattern for health check

### Integration Points
- 8 import targets from `lib/stoveApi` to replace: getStoveStatus, getFanLevel, getPowerLevel, igniteStove, shutdownStove, setPowerLevel, setFanLevel
- `fetchStoveData()` — central data fetch function, consolidate to single `getStatus()` call
- `handleIgnition()`, `handleShutdown()`, `handleLevelChanges()` — command functions using stoveApi
- `runPidAutomationIfEnabled()` — PID automation using `.includes('WORK')` and `setPowerLevel`
- `trackUsageHours()` in `lib/maintenanceServiceAdmin.ts` — receives status string from scheduler
- `updateStoveState()` — Firebase state writes with status string values

</code_context>

<specifics>
## Specific Ideas

- The 3→1 API call consolidation in `fetchStoveData()` mirrors what Phase 101 did for `useStoveData` — same efficiency win
- `sendIgnit()` takes no power argument (proxy ignit is fire-only) — must set power separately via `setPower()` after ignition, which is actually cleaner than the old API
- The scheduler test file (`route.test.ts`) mocks `lib/stoveApi` functions — all mocks need updating to mock `lib/thermorossiProxy` instead

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 102-scheduler-update*
*Context gathered: 2026-03-19*
