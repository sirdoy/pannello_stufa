---
phase: 80-fix-env-var-schedule-wiring
verified: 2026-03-15T18:45:00Z
status: passed
score: 6/6 must-haves verified
re_verification: false
---

# Phase 80: Fix Env Var & Schedule Wiring Verification Report

**Phase Goal:** Env var names are consistent across validator/docs/runtime, and schedule switching works end-to-end from frontend through the proxy switchhomeschedule route
**Verified:** 2026-03-15T18:45:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `envValidator.ts` checks `NETATMO_PROXY_API_KEY` matching runtime | VERIFIED | Lines 47, 85, 94 in `lib/envValidator.ts` all use `NETATMO_PROXY_API_KEY` |
| 2 | `.env.example` documents `NETATMO_PROXY_API_KEY` | VERIFIED | Line 33 of `.env.example`: `NETATMO_PROXY_API_KEY=your-proxy-api-key` |
| 3 | All docs reference `NETATMO_PROXY_API_KEY` consistently | VERIFIED | `docs/api-routes.md:150`, `docs/deployment.md:35`, `docs/setup/netatmo-setup.md:12,62,64` — no stale `NETATMO_API_KEY` found |
| 4 | `NETATMO_ROUTES` includes `switchHomeSchedule` key pointing to `/api/netatmo/switchhomeschedule` | VERIFIED | `lib/routes.ts:73`: `switchHomeSchedule: \`${API_BASE}/netatmo/switchhomeschedule\`` |
| 5 | `ScheduleSelector.tsx` calls `/api/netatmo/switchhomeschedule` with `{ home_id, schedule_id }` body | VERIFIED | Lines 44, 47 of `ScheduleSelector.tsx`; homeId guard at line 32; home_id flows from `useScheduleData` -> page -> prop |
| 6 | `ThermostatCard.tsx` calls `/api/netatmo/switchhomeschedule` with `{ home_id, schedule_id }` body | VERIFIED | Lines 406 (guard), 416 (URL), 419 (body) in `ThermostatCard.tsx` |

**Score:** 6/6 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `lib/envValidator.ts` | Netatmo env validation using `NETATMO_PROXY_API_KEY` | VERIFIED | All 4 occurrences (optional array, JSDoc, process.env read, warning string) use correct name |
| `.env.example` | Environment template with `NETATMO_PROXY_API_KEY` | VERIFIED | Line 33 correct |
| `lib/routes.ts` | `NETATMO_ROUTES` with `switchHomeSchedule` key | VERIFIED | Key added at line 73, points to `/api/netatmo/switchhomeschedule` |
| `app/thermostat/schedule/components/ScheduleSelector.tsx` | Schedule switching UI with correct endpoint | VERIFIED | Uses `NETATMO_ROUTES.switchHomeSchedule`, body `{ home_id, schedule_id }`, guards on missing `homeId` |
| `app/components/devices/thermostat/ThermostatCard.tsx` | Dashboard thermostat card with correct schedule switching | VERIFIED | `handleScheduleChange` uses `switchHomeSchedule`, body `{ home_id: topology.home_id, schedule_id }`, guards on missing `topology?.home_id` |
| `lib/hooks/useScheduleData.ts` | Hook exposing `homeId` from GET /schedules response | VERIFIED | `homeId` state added, populated from `data.home_id`, returned in hook interface |
| `app/api/netatmo/schedules/route.ts` | GET /schedules returns `home_id` alongside schedules | VERIFIED | Line 16: `return success({ schedules, home_id: home?.id })` |
| `app/thermostat/schedule/page.tsx` | Passes `homeId` from hook to ScheduleSelector | VERIFIED | Line 28 destructures `homeId`, line 97 passes `homeId={homeId ?? undefined}` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `lib/envValidator.ts` | `lib/netatmoProxy.ts` | Same env var name `NETATMO_PROXY_API_KEY` | WIRED | Both files use identical var name; zero stale `NETATMO_API_KEY` references remain in lib/, docs/, or .env.example |
| `ScheduleSelector.tsx` | `/api/netatmo/switchhomeschedule` | `fetch(NETATMO_ROUTES.switchHomeSchedule, { method: 'POST', body: { home_id, schedule_id } })` | WIRED | Lines 44-47; full POST with correct body shape confirmed |
| `ThermostatCard.tsx` | `/api/netatmo/switchhomeschedule` | `netatmoScheduleCmd.execute(NETATMO_ROUTES.switchHomeSchedule, { method: 'POST', body: { home_id, schedule_id } })` | WIRED | Lines 416-419; topology.home_id guard at line 406 ensures value is present before call |
| `GET /schedules` | `useScheduleData` | `data.home_id` set into `homeId` state | WIRED | `useScheduleData.ts:73`: `setHomeId(data.home_id \|\| null)` |
| `useScheduleData.homeId` | `ScheduleSelector.homeId` prop | schedule page destructures and passes prop | WIRED | `page.tsx:28` + `page.tsx:97` |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| API-02 | 80-01 | Authentication uses API Key (`X-API-Key` header) instead of Netatmo OAuth tokens | SATISFIED | `envValidator.ts` now validates `NETATMO_PROXY_API_KEY` — the key that the proxy uses for `X-API-Key` auth; no stale references remain |
| CLEAN-06 | 80-01 | Remove Netatmo OAuth env vars (`NETATMO_CLIENT_SECRET`, `NEXT_PUBLIC_NETATMO_CLIENT_ID`, `NEXT_PUBLIC_NETATMO_REDIRECT_URI`) | SATISFIED | Phase 79 removed OAuth vars; phase 80-01 corrected the validator to reference `NETATMO_PROXY_API_KEY` rather than the stale `NETATMO_API_KEY` placeholder — completing the clean-up |
| ENERGY-05 | 80-02 | Switch schedule via proxy `/switchhomeschedule` | SATISFIED | `NETATMO_ROUTES.switchHomeSchedule` added; both `ScheduleSelector` and `ThermostatCard` POST to `/api/netatmo/switchhomeschedule` with `{ home_id, schedule_id }` body |
| CLEAN-02 | (Phase 81, not Phase 80) | Delete `lib/netatmoCredentials.ts` | NOT IN SCOPE | Assigned to Phase 81 in REQUIREMENTS.md — not an orphaned requirement for this phase |

### Anti-Patterns Found

None. Anti-pattern scan across all modified files returned no TODO/FIXME/placeholder/stub patterns.

### Human Verification Required

#### 1. Live schedule switch on /thermostat/schedule page

**Test:** With a real Netatmo thermostat connected, navigate to `/thermostat/schedule`. Select a different schedule from the dropdown and confirm the switch button. Observe the network tab for a POST to `/api/netatmo/switchhomeschedule`.
**Expected:** Request completes with `{ success: true }`, active schedule updates in the UI.
**Why human:** Requires real Netatmo credentials, proxy, and hardware — cannot verify programmatically.

#### 2. Live schedule switch from ThermostatCard on main dashboard

**Test:** On the main dashboard, find the thermostat card. Select a different schedule from the schedule dropdown.
**Expected:** POST to `/api/netatmo/switchhomeschedule` with `{ home_id, schedule_id }`, UI reflects new active schedule.
**Why human:** Same as above — requires live environment.

#### 3. homeId guard behavior when Netatmo disconnected

**Test:** Navigate to `/thermostat/schedule` when the Netatmo proxy is unreachable (GET /schedules returns error). Attempt to switch a schedule.
**Expected:** Italian error message "Home ID non disponibile" displayed; no network request made to switchhomeschedule.
**Why human:** Requires controlled failure environment.

### Gaps Summary

No gaps. All 6 observable truths are verified, all artifacts are substantive and wired, all 3 requirements (API-02, CLEAN-06, ENERGY-05) are satisfied. Commits 931b86c, 779782c, and 9c0540c verified in git history.

The only items flagged require human testing in a live environment with real Netatmo credentials — automated checks pass cleanly.

---

_Verified: 2026-03-15T18:45:00Z_
_Verifier: Claude (gsd-verifier)_
