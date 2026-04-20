---
phase: 168-netatmo-frontend-cutover
created: 2026-04-20
purpose: Documented regressions and follow-up items deferred from Phase 168 scope.
---

# Phase 168 — Deferred Items

This file captures behaviors that Phase 168 intentionally regresses or does not port, along with the rationale and follow-up trigger conditions.

---

## 1. stoveSync / topology enrichment regression

**What is lost:** Legacy `/api/netatmo/homestatus` enriched each room in the response with `stoveSync: boolean` (a Firebase RTDB lookup against `netatmo/stoveSync/{room_id}`) and `room_type` (from `netatmo/topology/{room_id}`). V1 `/api/v1/netatmo/homestatus` is a thin proxy over the HA adapter and does NOT perform these Firebase reads.

**Where the loss is visible:**
- `app/components/netatmo/RoomCard.tsx` — the "Sincronizzata con stufa" badge always reads `false` after cutover because `room.stoveSync` is `undefined`.
- `app/components/devices/thermostat/ThermostatCard.tsx` — same badge, same outcome.
- `lib/hooks/useRoomStatus.ts` — `mode` and `endtime` fields are null-fallback (v1 does not emit them); ActiveOverrideBadge and ManualOverrideSheet short-circuit on `room.mode === 'manual'` so override countdown UI does not render.

**Rationale for accepting the loss:**
- RESEARCH.md Open Questions Q1 and Q2 RESOLVED in favor of preserving the Phase 161 thin-proxy invariant on v1 routes. Moving the topology enrichment into v1 would turn v1 routes into stateful Firebase-reading wrappers — a new invariant to maintain across every future phase.
- The `stoveSync` signal is a UX hint, not a correctness signal. Scheduler/override logic does not depend on it.
- Test Q1/Q2: Consumers already null-guard the missing fields (existing ternaries and `=== 'manual'` comparisons).

**Follow-up trigger (port topology write-read into v1 routes if ALL of the following hold):**
- User reports the stoveSync badge signal is missed in production (likely after a firmware re-pairing event).
- Override countdown UI (ActiveOverrideBadge, ManualOverrideSheet) is requested back.
- A new phase schedules the work without compromising the thin-proxy invariant (e.g., by moving enrichment into a separate `/api/v1/netatmo/homestatus/enriched` route that reads Firebase on top of the thin proxy).

**Not a follow-up trigger:** Temperature or setpoint display regressions — Phase 168 Task 2E maps those fields correctly (`therm_setpoint_temperature` → `setpoint`, `heating_power_request` → `heating`).

---

## 2. Debug panel camera tiles with `[cameraId]` path param

**What is lost:** Legacy debug panels had three camera tiles (`camera/snapshot`, `camera/stream`, `camera/monitoring`) but those legacy routes had flat URL shapes. V1 requires `[cameraId]` in the path. Debug panels have no camera selector UI, so the tiles were DROPPED in Plan 01 per CONTEXT D-10 rather than hard-coded to a sentinel `cameraId`.

**Follow-up trigger:** Build a camera selector widget into the debug-panel chrome and restore the three tiles as function calls (`CAMERA_ROUTES.snapshot(selectedCameraId)` etc.). Defer until a debug-panel UX phase.

---

## 3. `/api/netatmo/schedules` legacy endpoint

**What is lost:** The schedules GET endpoint is dropped entirely per D-04. Schedules are now derived from `homesdata.body.homes[0].schedules`. If a future consumer needs the schedules array in isolation without fetching the full topology, a new v1 wrapper would be needed.

**Follow-up trigger:** A new use case that cannot reuse the homesdata response (e.g., a schedule picker that polls more aggressively than topology polling). No consumer is currently in that state.

---

## 4. Playwright `@smoke` tag coverage

**What is lost:** The `@smoke` tag infrastructure was discovered absent in Phase 167. Phase 168 Plan 03 uses a fallback `-g "thermostat|camera|registry"` name-pattern matcher. The fallback exercises the right flows but is brittle if a test file gets renamed.

**Follow-up trigger:** A future test-harness phase that adds explicit `@smoke` tags to the Playwright suite (out of scope for cutover phases).

---

*Last updated: 2026-04-20 during phase 168 planning revision (post-checker BLOCKER 1 / WARNING 5).*
