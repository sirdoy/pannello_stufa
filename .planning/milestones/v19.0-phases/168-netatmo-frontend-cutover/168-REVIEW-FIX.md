---
phase: 168-netatmo-frontend-cutover
fixed_at: 2026-04-21T00:00:00Z
review_path: .planning/phases/168-netatmo-frontend-cutover/168-REVIEW.md
iteration: 1
findings_in_scope: 7
fixed: 7
skipped: 0
status: all_fixed
---

# Phase 168: Code Review Fix Report

**Fixed at:** 2026-04-21T00:00:00Z
**Source review:** .planning/phases/168-netatmo-frontend-cutover/168-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 7 (critical + warning)
- Fixed: 7
- Skipped: 0

Critical findings: 0 (nothing to do)
Warning findings: 7 (all fixed)
Info findings: 11 (out of scope, deferred)

## Fixed Issues

### WR-01: `fetchAllGetEndpoints` dependency causes infinite refresh loop

**Files modified:** `app/debug/api/components/tabs/NetatmoTab.tsx`, `app/debug/components/tabs/NetatmoTab.tsx`
**Commits:** `387162a0` (debug/api), `3b2e07b4` (debug)
**Applied fix:** Wrapped both `fetchGetEndpoint` and `fetchAllGetEndpoints` in `useCallback` so the effect dependencies are stable references. Added explanatory comments. The three `useEffect` hooks (initial fetch, refreshTrigger, auto-refresh) now only re-fire when their true intent changes. Each file was committed independently since they are siblings (not the same file).

### WR-02: `CameraMonitoringToggle` test harness does not test production code

**Files modified:** `app/components/devices/camera/hooks/useCameraMonitoringToggle.ts` (new), `app/components/devices/camera/CameraCard.tsx`, `app/(pages)/camera/CameraDashboard.tsx`, `__tests__/app/components/devices/camera/CameraMonitoringToggle.test.tsx`
**Commit:** `ea8c3a65` (combined with WR-03)
**Applied fix:** Extracted the monitoring-toggle logic into a shared custom hook `useCameraMonitoringToggle` with optimistic update + rollback + disabled/loading guards. Re-wrote the test to use `renderHook` on the real hook, eliminating the parallel in-test reimplementation. `CameraCard` now consumes the hook directly; `CameraDashboard` keeps a per-row inline implementation (multi-row state is keyed by cameraId, outside the single-camera hook's API shape) but is marked with a comment pointing to the hook as the canonical reference.

### WR-03: `CameraCard` snapshot `useEffect` misses `snapshotUrl` cache-busting on refresh

**Files modified:** `app/components/devices/camera/CameraCard.tsx`
**Commit:** `ea8c3a65` (combined with WR-02)
**Applied fix:** Introduced a top-level `buildSnapshotUrl(cameraId, bust?)` helper used by both the selection effect and `handleRefresh`. Added a guard clause (`if (!selectedCameraId) return;`) at the top of `handleRefresh` to avoid the no-op `refreshing` toggle when no camera is selected. Disabled the refresh button overlay when `!selectedCameraId || refreshing`.

### WR-04: `useThermostatData` WS effect re-subscribes on every topology change

**Files modified:** `app/components/devices/thermostat/hooks/useThermostatData.ts`
**Commit:** `14a89b61`
**Applied fix:** Documented the WebSocketContext stability contract directly above the WS subscription effect. The comment explicitly states that `subscribe`/`unsubscribe` MUST be stable (useCallback in the provider) and notes that topology is read via a ref so topology changes do not invalidate the subscription. No runtime change — this is a defensive comment per the review suggestion ("Not a current bug if the context provider is correctly implemented, but brittle").
**Status:** fixed: requires human verification — this is a contract comment, not a behavior fix. A human should confirm that `WebSocketContext` does in fact wrap `subscribe`/`unsubscribe` in `useCallback` (if not, that is a separate latent bug).

### WR-05: `CameraDashboard.fetchData` empty dependency array masks stale closures

**Files modified:** `app/(pages)/camera/CameraDashboard.tsx`
**Commit:** `07929414`
**Applied fix:** Added an explicit `// eslint-disable-next-line react-hooks/exhaustive-deps` directive with a rationale comment on the mount-only effect. Removed the dead `fetchedRef.current = false` reset line from `handleRefresh` (it had no functional purpose since `handleRefresh` calls `fetchData` directly, bypassing the effect entirely).

### WR-06: `useScheduleData` source field never returns 'cache'

**Files modified:** `lib/hooks/useScheduleData.ts`, `lib/hooks/__tests__/useScheduleData.test.ts`
**Commit:** `8f09a145`
**Applied fix:** Dropped the `source` state, setter, and return-type field entirely from `useScheduleData`. Updated the JSDoc to document the removal with a migration note for any consumers that used to branch on `source === 'cache'`. Grep-verified no production consumers read `.source` from this hook; only one test assertion referenced it, which was removed. `app/thermostat/schedule/page.tsx` destructures `{ schedules, activeSchedule, homeId, loading, error, refetch }` — `source` was never used.

### WR-07: `thermostat/page.test.tsx` uses outdated mock for `NETATMO_ROUTES`

**Files modified:** `app/thermostat/page.test.tsx`
**Commit:** `6d408d2d`
**Applied fix:** Replaced the partial `jest.mock('@/lib/routes', ...)` factory (which listed only three fields and omitted `CAMERA_ROUTES`) with `jest.mock('@/lib/routes', () => ({ ...jest.requireActual('@/lib/routes') }))`. The mock is now forward-compatible with future route additions without silent `undefined` reads.

## Skipped Issues

None — all 7 in-scope findings were fixed.

## Notes for next iteration

- WR-04 is a contract comment, not a behavior fix. A separate audit of `WebSocketContext` is recommended to confirm that `subscribe` and `unsubscribe` are wrapped in `useCallback`. If they are not, that is a latent bug that should be addressed in a follow-up.
- The `CameraDashboard` per-row monitoring toggle was intentionally kept as an inline implementation (not converted to use the shared hook) because its state shape is keyed by `cameraId` for many rows simultaneously, which is outside the hook's single-camera API. A future refactor could introduce a second `useCameraMonitoringToggleMany` variant that returns a record keyed by id, but that was out of scope for this review.
- Tests were NOT run (`npm test` / `npm run build` are explicitly forbidden by project rules). Human verifier should run the suite.
- Info-level findings (IN-01 through IN-11) are out of this fix scope and remain for the next review iteration or a dedicated tech-debt pass.

---

_Fixed: 2026-04-21T00:00:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
