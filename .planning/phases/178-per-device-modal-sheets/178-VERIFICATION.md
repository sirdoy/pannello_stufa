---
phase: 178-per-device-modal-sheets
verified: 2026-04-29T00:00:00Z
status: human_needed
score: 12/12 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Open dashboard at /, tap StoveCard → StoveSheet opens. Click + on Livello fiamma stepper. Visually verify the Thermorossi power-set request fires (DevTools Network panel) and the value increments by 1 in the UI."
    expected: "Sheet opens with FlameViz hero, In funzione/Spenta cap, powerLevel/5 readout (54px display), 2 SheetRows for Livello fiamma + Ventola, Orari/Manutenzione SheetBtn grid, primary Accendi/Spegni button. Stepper click POSTs to /api/v1/thermorossi/settings/power."
    why_human: "Visual sheet open animation, FlameViz behaviour, and the live API roundtrip cannot be verified by jest alone. The Playwright spec (178-10) covers this but its runtime requires a server."
  - test: "Tap ClimateCard → ClimateSheet opens. Click radial-dial-plus, wait 500ms, verify /api/v1/netatmo/setroomthermpoint POST fires with correct {home_id, room_id, mode: 'manual', temp} body."
    expected: "Zone chip strip, RadialDial with #5eafff color, Tipo SheetRow with InlineToggle, Modalità globale eyebrow, 4 mode pills. Manuale pill never fires setHomeMode."
    why_human: "Live debounce timing + API roundtrip not jest-coverable; jest spec uses fake timers. Playwright spec 178-10 covers it but needs a dev server."
  - test: "Tap LightsCard → LightsSheet opens. Click 'Tutte off' → verify Hue group action endpoint hits. Verify scene buttons reflect actual Hue catalog state (disabled when scene name not present)."
    expected: "Accese count card + Tutte on/Tutte off pills, 4 scene buttons with correct gradients, per-room sections with InlineToggles."
    why_human: "Real scene catalog state + API roundtrip require live data."
  - test: "Tap SonosCard → SonosSheet opens. Drag volume slider; verify single coalesced /api/v1/sonos/zones/{groupId}/volume PUT fires after 250ms. Click play/pause on a group row; verify it does not change selection AND fires the play/pause endpoint."
    expected: "Group list with album-art tiles + PlayingBars when playing, volume strip with #b080ff accentColor, Pausa/Riproduci ovunque master button using Promise.allSettled."
    why_human: "Live volume drag + debounce + master allSettled tolerance under real network conditions need human/E2E verification."
  - test: "Tap TuyaCard → PlugsSheet opens. Click first plug toggle. Verify /api/tuya/plugs/{deviceId}/state POST fires AND verify TuyaCard tile itself has zero toggle controls (DASH-10 cross-check)."
    expected: "2-col summary grid (Accese / Consumo with kW boundary), per-plug list with name + power-only subtitle (no room segment per Pitfall 8), InlineToggle in #ffb84a."
    why_human: "Live togglePlug roundtrip + DASH-10 cross-check on dashboard render need a running app."
  - test: "Run Playwright spec end-to-end: `npm run test:e2e -- tests/smoke/dashboard-glass-cards.spec.ts -g \"SHEET-0[2-6]\"` to confirm 5 SHEET-* describes pass under the dev server."
    expected: "All 5 describes green; zero console errors; existing DASH-* tests still pass."
    why_human: "Playwright runtime requires `npm run dev` server + Playwright's Auth0 storageState configured; cannot be invoked from a verifier sandbox."
---

# Phase 178: Per-Device Modal Sheets — Verification Report

**Phase Goal:** Build the five device-specific control sheets that the dashboard cards open into, each with its documented controls and using the Sheet primitive from Phase 175.

**Verified:** 2026-04-29
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (merged ROADMAP SC + PLAN must-haves)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | StoveSheet exists with hero (FlameViz + state caps + powerLevel/5 readout), Livello fiamma + Ventola SheetRows wired to handlePowerChange/handleFanChange via Stepper, 2-col Orari/Manutenzione SheetBtn grid → /stove/scheduler + /stove/maintenance, primary action button toggles Accendi↔Spegni and disables to "Manutenzione richiesta" when needsMaintenance | VERIFIED | StoveSheet.tsx lines 119-262 contain all required testids (`stove-sheet`, `stove-sheet-state`, `stove-sheet-temp`, `stove-sheet-power-stepper`, `stove-sheet-fan-stepper`, `stove-sheet-primary-action`, `stove-sheet-skeleton`, `stove-sheet-error`); `<FlameViz on={isAccesa} intensity={powerLevel/5} />` at line 134; literal route strings at lines 209/214; jest spec passes with 12 it() cases covering state/wiring/loading/error |
| 2 | ClimateSheet exists with horizontal zone-chip selector, Apple-Home RadialDial (15..28, #5eafff), Tipo SheetRow with InlineToggle, 4-pill Modalità globale grid (Auto/Manuale/Eco/Off); setpoint debounced 500ms; mode pills map IT→Netatmo (schedule/away/hg); Manuale pill is UI-only (Pitfall 5); per-zone Tipo toggle uses 'home' / 'manual'; zone.kind derived from module type (NATherm1 / NRV) | VERIFIED | ClimateSheet.tsx contains `useThermostatData()`, `useThermostatCommands({ homeId, refetch: data.refetch })`, `useDebounce(pendingTarget, 500)`, MODE_PILLS table with `backend: null` for 'Manuale', RadialDial at line 235 with `color="#5eafff"`, empty state "Nessuna zona configurata", skeleton + error states; jest spec passes with 18 it() cases including debounce-fake-timer assertions |
| 3 | LightsSheet exists with Accese count card + Tutte on/off pills, 4 scene buttons (Rilassante/Concentrato/Cena/Notte) with bundle-verbatim gradients, scene-disabled state with tooltip "Crea scena '{name}' su Hue", per-room sections from groups[] (Pitfall 9), per-light row InlineToggle wires to handleRoomToggle(group_id, next) | VERIFIED | LightsSheet.tsx contains SCENES table with all 4 gradients, `findSceneByName` import, Italian copy verbatim, byRoom built from groups filtered by `type === 'Room'`, `cmds.handleRoomToggle(section.group.group_id, ...)`, all required testids; 13 jest it() cases pass |
| 4 | SonosSheet exists with group list (album-art tile + name + track/artist + 34×34 play/pause), volume strip (native input range, accentColor #b080ff, debounced 250ms), master action toggling Pausa↔Riproduci ovunque with Promise.allSettled; field adapter uses flat `zone.coordinator_uid` (Pitfall 7); per-group play/pause uses e.stopPropagation() | VERIFIED | SonosSheet.tsx contains `useSonosFullData()`, `useDebounce(pendingVolume, 250)`, `Promise.allSettled` at line 136, `accentColor: '#b080ff'` at line 274, `e.stopPropagation()` at line 218, no `coordinator.uid` (nested) reference; 12 jest it() cases pass |
| 5 | PlugsSheet exists with 2-col summary grid (Accese count + Consumo total power with W/kW boundary at 1000W), per-plug list with name + power-only subtitle (no room segment per Pitfall 8), InlineToggle (#ffb84a) wires to togglePlug(deviceId, currentState); field adapter maps device_id/custom_name/switch_on/power_w | VERIFIED | PlugsSheet.tsx contains `formatPowerSummary` (toFixed(2) for ≥1000), `formatPowerRow` (toFixed(1) for ≥1000), no `p.room` or `plug.room` references, `cmds.togglePlug(p.id, p.on)` at line 302, `#ffb84a` at lines 261/300; 16 jest it() cases pass |
| 6 | Card swap: StoveCard, ClimateCard, LightsCard, SonosCard, TuyaCard all mount the real sheet bodies (StoveSheet/ClimateSheet/LightsSheet/SonosSheet/PlugsSheet) instead of SheetPlaceholderBody | VERIFIED | Each card file imports from `../sheets/{Name}Sheet` (verified via grep); `<StoveSheet />` etc. render at the documented line numbers; no `<SheetPlaceholderBody phase="178" device="stove\|thermostat\|lights\|sonos\|plugs-tuya" />` references remain |
| 7 | DirigeraCard, CameraCard, NetworkCard remain UNCHANGED — still mount SheetPlaceholderBody (no SHEET-* requirement for these in v20.0; deferred per CONTEXT.md `<deferred>` list) | VERIFIED | DirigeraCard.tsx:88 still `<SheetPlaceholderBody phase="178" device="plugs-dirigera" />`, CameraCard.tsx:107 still `phase="178" device="camera"`, NetworkCard.tsx:75 still `phase="178" device="network"` |
| 8 | useThermostatCommands hook exists wrapping setroomthermpoint + setthermmode via useRetryableCommand; exposes setRoomSetpoint/setHomeMode/setRoomMode + netatmoTempCmd/netatmoModeCmd; SetThermmodeRequest['mode'] union blocks 'manual' at compile time | VERIFIED | useThermostatCommands.ts lines 60-157 contain three async write methods + two useRetryableCommand handles, `NETATMO_ROUTES.setRoomThermpoint`, `NETATMO_ROUTES.setThermMode`, `mode: SetThermmodeRequest['mode']` typed union, error guard `err instanceof Error ? err.message : String(err)`; jest spec passes with 7+ it() and it.each() cases |
| 9 | Six sheet sub-primitives ship under primitives/ (SheetRow/Stepper/Slider/RadialDial/SheetBtn/QuickActionButton) with bundle-verbatim inline styles + AUDIT-EXCEPTION comments; all interactive controls carry data-sheet-focusable="true"; globals.css contains the [data-sheet-focusable="true"]:focus-visible rule | VERIFIED | All 6 .tsx files exist with ARIA labels, lucide icons, AUDIT-EXCEPTION comments tagged to sheets.jsx line numbers; 7 occurrences of `data-sheet-focusable="true"` across primitives; globals.css line 385 contains the focus-visible rule with outline + outline-offset |
| 10 | findSceneByName helper + sheets barrel + EmberGlass top-level barrel re-export ship | VERIFIED | findSceneByName.ts ships with case-insensitive match + null fallback (6 jest cases pass); sheets/index.ts exports 5 sheet bodies + 6 primitives + Props types + helper; EmberGlass/index.ts:38 contains `export * from './sheets';` |
| 11 | Playwright smoke spec extended with 5 SHEET-02..06 describe blocks (D-31 — no new spec file); each describe mocks the relevant API endpoint, opens the card, asserts the sheet visible, clicks one wired control, asserts the mock received a request, asserts zero console errors | VERIFIED | tests/smoke/dashboard-glass-cards.spec.ts lines 309/351/394/441/505 contain `test.describe('SHEET-0X ...'`; 5 page.route mocks present; 5 expect.poll request-count assertions present; 5 collectConsoleErrors usages present; SHEET-06 includes the DASH-10 cross-check (line 531); existing Phase 177 DASH-* describes intact (line 4 header preserved) |
| 12 | Zero useMemo / useCallback in any new Phase 178 source file (D-33 React Compiler 1.0 hygiene) | VERIFIED | Single grep match across all primitives + sheets + helper + hook is a JSDoc comment in useThermostatCommands.ts:16 — no actual hook usage |

**Score:** 12/12 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/components/EmberGlass/sheets/primitives/SheetRow.tsx` | Sheet row primitive (D-10), ≥25 LOC | VERIFIED | 50 LOC; testid+borderBottom present |
| `app/components/EmberGlass/sheets/primitives/Stepper.tsx` | 36×36 ± stepper (D-11), ≥35 LOC | VERIFIED | 78 LOC; aria-labels + data-sheet-focusable + Minus/Plus icons present |
| `app/components/EmberGlass/sheets/primitives/Slider.tsx` | 140×6 gradient slider (D-12), ≥25 LOC | VERIFIED | 40 LOC; default `color = 'var(--accent)'`, gradient fill present |
| `app/components/EmberGlass/sheets/primitives/RadialDial.tsx` | 220×220 SVG arc + ± (D-13), ≥70 LOC | VERIFIED | 135 LOC; rotate(135deg), r=92, 44×44 buttons present |
| `app/components/EmberGlass/sheets/primitives/SheetBtn.tsx` | Icon + label flat button (D-14), ≥20 LOC | VERIFIED | 48 LOC; data-component + slugged data-testid present |
| `app/components/EmberGlass/sheets/primitives/QuickActionButton.tsx` | Yellow-active pill (D-15), ≥20 LOC | VERIFIED | 45 LOC; rgba(245,200,74,0.18) + #f5c84a active state present |
| `app/components/EmberGlass/sheets/lib/findSceneByName.ts` | Case-insensitive scene lookup, ≥10 LOC | VERIFIED | 21 LOC; toLowerCase comparison + null fallback |
| `app/components/EmberGlass/sheets/index.ts` | Barrel for 5 bodies + 6 primitives + helper, ≥15 LOC | VERIFIED | 23 LOC; all 12 exports + 6 type re-exports present |
| `app/components/devices/thermostat/hooks/useThermostatCommands.ts` | New thermostat write hook (D-16), ≥70 LOC | VERIFIED | 157 LOC; three async writes + two retryable handles |
| `app/components/EmberGlass/sheets/StoveSheet.tsx` | SHEET-02 body, ≥120 LOC | VERIFIED | 263 LOC; bundle-verbatim hero + steppers + SheetBtn grid + primary action |
| `app/components/EmberGlass/sheets/ClimateSheet.tsx` | SHEET-03 body, ≥180 LOC | VERIFIED | 324 LOC; zone chips + RadialDial + Tipo + 4 mode pills + debounce |
| `app/components/EmberGlass/sheets/LightsSheet.tsx` | SHEET-04 body, ≥200 LOC | VERIFIED | 396 LOC; summary + 4 scene buttons + per-room sections |
| `app/components/EmberGlass/sheets/SonosSheet.tsx` | SHEET-05 body, ≥200 LOC | VERIFIED | 322 LOC; group list + debounced volume + master allSettled |
| `app/components/EmberGlass/sheets/PlugsSheet.tsx` | SHEET-06 body, ≥130 LOC | VERIFIED | 312 LOC; 2-col summary + plug list with kW/W boundary |
| `tests/smoke/dashboard-glass-cards.spec.ts` | Extended with 5 SHEET-* describes | VERIFIED | grep -cE "test\\.describe\\('SHEET-0[2-6]" returns 5 |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| StoveCard.tsx | sheets/StoveSheet.tsx | `import { StoveSheet } from '../sheets/StoveSheet';` | WIRED | Line 34 import + line 100 `<StoveSheet />` render |
| ClimateCard.tsx | sheets/ClimateSheet.tsx | `import { ClimateSheet } from '../sheets/ClimateSheet';` | WIRED | Line 34 import + line 117 render |
| LightsCard.tsx | sheets/LightsSheet.tsx | `import { LightsSheet } from '../sheets/LightsSheet';` | WIRED | Line 38 import + line 146 render |
| SonosCard.tsx | sheets/SonosSheet.tsx | `import { SonosSheet } from '../sheets/SonosSheet';` | WIRED | Line 31 import + line 125 render |
| TuyaCard.tsx | sheets/PlugsSheet.tsx | `import { PlugsSheet } from '../sheets/PlugsSheet';` | WIRED | Line 27 import + line 95 render; JSDoc updated to reference PlugsSheet |
| useThermostatCommands.ts | /api/v1/netatmo/setroomthermpoint | useRetryableCommand.execute(NETATMO_ROUTES.setRoomThermpoint, ...) | WIRED | Lines 92, 138 |
| useThermostatCommands.ts | /api/v1/netatmo/setthermmode | useRetryableCommand.execute(NETATMO_ROUTES.setThermMode, ...) | WIRED | Line 111 |
| LightsSheet.tsx | sheets/lib/findSceneByName.ts | `import { findSceneByName }` | WIRED | Used at line 245 to resolve scene name → id |
| EmberGlass/index.ts | sheets/index.ts | `export * from './sheets';` | WIRED | Line 38 |
| globals.css | primitives | [data-sheet-focusable="true"]:focus-visible | WIRED | Rule at line 385 + 7 primitive elements carry the attribute |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|---------------------|--------|
| StoveSheet | stoveData (powerLevel, fanLevel, isAccesa, needsMaintenance) | `useStoveData({ checkVersion, userId: user?.sub })` | Yes — existing Phase 13.0 + 17.0 hook (Thermorossi proxy via WS + 60s polling) | FLOWING |
| ClimateSheet | data (topology, status, error, refetch) | `useThermostatData()` | Yes — existing Phase 10.0 + 17.0 hook (Netatmo proxy via WS + polling) | FLOWING |
| LightsSheet | lightsData (lights, groups, scenes, error) | `useLightsData()` | Yes — existing Phase 14.0 + 17.0 hook (Hue proxy via WS + polling) | FLOWING |
| SonosSheet | sonosData (data.zones, data.playback, data.volumes) | `useSonosFullData()` | Yes — existing Phase 16.0 + 17.0 hook (Sonos proxy via WS + polling) | FLOWING |
| PlugsSheet | tuyaData (plugs) | `useTuyaData()` | Yes — existing v15+ hook (Tuya proxy) | FLOWING |
| useThermostatCommands | netatmoTempCmd / netatmoModeCmd | `useRetryableCommand({ device, action })` | Yes — existing Phase 7.0 retry/idempotency infra | FLOWING |
| LightsSheet | scenes catalog | `lightsData.scenes` → findSceneByName | Yes — falls back to `[]` if hook returns nothing; scene buttons disable correctly when missing | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| All sheet jest specs pass | `npm run test:components -- app/components/EmberGlass/sheets/` | 13 suites, 117 tests passed | PASS |
| All affected card jest specs pass with new sheet mocks | `npm run test:components -- app/components/EmberGlass/cards/__tests__/{Stove,Climate,Lights,Sonos,Tuya}Card.test.tsx` | 6 suites, 40 tests passed | PASS |
| useThermostatCommands jest spec passes | `npm run test:unit -- app/components/devices/thermostat/hooks/__tests__/useThermostatCommands.test.ts` | 24 suites, 292 tests passed | PASS |
| Phase 178 source files type-check clean | `npx tsc --noEmit \| grep -cE "EmberGlass/sheets\|thermostat/hooks/useThermostatCommands\|cards/(Stove\|Climate\|Lights\|Sonos\|Tuya)Card\|smoke/dashboard"` | 0 Phase 178 errors (9 unrelated pre-existing errors in app/debug/* + app/network/* test files, documented in deferred-items.md) | PASS |
| Zero useMemo/useCallback in Phase 178 sources | `grep -nE "useMemo\|useCallback" {primitives,sheets,hook source files}` | Single hit is a JSDoc comment in useThermostatCommands.ts:16 | PASS |
| Zero `coordinator.uid` (nested) in SonosSheet | `grep -E "coordinator\\.uid" SonosSheet.tsx` | No hits — only `coordinator_uid` (flat, Pitfall 7) | PASS |
| Zero `p.room` / `plug.room` in PlugsSheet | `grep -E "p\\.room\|plug\\.room" PlugsSheet.tsx` | No hits — Pitfall 8 enforced | PASS |
| Zero `setHomeMode('manual')` in ClimateSheet | `grep -E "setHomeMode\\(['\\\"]manual['\\\"]\\)" ClimateSheet.tsx` | No hits — Pitfall 5 enforced | PASS |
| Zero `data.fetchData` / `data.setError` references in ClimateSheet (uses verified `data.refetch`) | `grep -E "data\\.fetchData\|data\\.setError" ClimateSheet.tsx` | No hits; `data.refetch` is used at line 56 | PASS |
| Zero literal STOVE_ROUTES references in StoveSheet (Pitfall 2) | `grep -E "STOVE_ROUTES" StoveSheet.tsx` | No hits — uses literal `/stove/scheduler` and `/stove/maintenance` per Pitfall 2 | PASS |
| Five SHEET-* describes appended to Playwright spec | `grep -cE "test\\.describe\\('SHEET-0[2-6]" tests/smoke/dashboard-glass-cards.spec.ts` | Returns 5 | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| SHEET-02 | 178-01, 178-04, 178-09, 178-10 | StoveSheet — large flame-power readout (powerLevel/5) + FlameViz hero, fan/power steppers, Orari/Manutenzione buttons, large Accendi/Spegni primary button (room temperature deferred) | SATISFIED | StoveSheet.tsx implements all controls; T-OBS-1 reword acknowledged in REQUIREMENTS.md and CONTEXT.md `<deferred>` |
| SHEET-03 | 178-01, 178-03, 178-05, 178-09, 178-10 | ClimateSheet — horizontal zone selector chips, Apple-Home radial dial, mode picker, per-zone toggle | SATISFIED | ClimateSheet.tsx + useThermostatCommands.ts ship; jest specs cover debounce + mode mapping + Manuale UI-only behavior |
| SHEET-04 | 178-01, 178-02, 178-06, 178-09, 178-10 | LightsSheet — accese count card + Tutte on/off + 4 scene buttons + per-room grouped list | SATISFIED | LightsSheet.tsx + findSceneByName helper ship; scene-disabled state + per-room toggle (Pitfall 9) covered by jest spec |
| SHEET-05 | 178-01, 178-07, 178-09, 178-10 | SonosSheet — group list (album-art + name + track + play/pause), volume slider, master button | SATISFIED | SonosSheet.tsx ships with debounced volume + master allSettled; flat coordinator_uid (Pitfall 7) honored |
| SHEET-06 | 178-01, 178-08, 178-09, 178-10 | PlugsSheet — accese count + total consumption summary + per-plug list (room mapping deferred); no toggles on dashboard card | SATISFIED | PlugsSheet.tsx ships with kW/W boundary + power-only subtitle (Pitfall 8 deviation logged in REQUIREMENTS.md, CONTEXT D-09, deferred-items entry); DASH-10 cross-check in Playwright |

### Anti-Patterns Found

None of consequence. Documented deviations:

- **Plan 178-04/178-08 cross-plan worktree commit race** (3d51f710 carries both StoveSheet and PlugsSheet GREEN diffs) — file content at HEAD is correct (verified via 117 jest tests passing); commit attribution is mislabeled. Documented honestly in 178-04-SUMMARY.md §Deviations and 178-08-SUMMARY.md §Worktree Race. Not a code defect — purely an artifact of the parallel `branching_strategy: "none"` execution.

### Human Verification Required

See `human_verification` block in frontmatter. The Playwright spec (178-10) covers each sheet's API wiring end-to-end but its runtime requires `npm run dev` plus Playwright's storageState configuration; cannot be invoked from a verifier sandbox. Six items need human sign-off:

1. **StoveSheet end-to-end** — open dashboard → tap stove-card → verify FlameViz/state cap/powerLevel readout → click Stepper → verify network roundtrip.
2. **ClimateSheet end-to-end** — tap climate-card → verify zone chips/RadialDial/Tipo toggle/mode pills → drag dial → verify debounced setroomthermpoint POST.
3. **LightsSheet end-to-end** — tap lights-card → verify Accese/Tutte pills/scene gradients/per-room sections → click Tutte off → verify Hue group action POST → spot-check that scenes missing from the user's catalog show as disabled with the "Crea scena …" tooltip.
4. **SonosSheet end-to-end** — tap sonos-card → verify group list/volume strip/master button → drag slider → verify single coalesced volume PUT after 250ms → click play/pause → verify it does not change selection AND fires the play/pause endpoint.
5. **PlugsSheet end-to-end + DASH-10 cross-check** — verify TuyaCard dashboard tile has zero toggle controls; tap card → verify 2-col summary + per-plug list with no room segment + kW boundary at 1000W → click toggle → verify /api/tuya/plugs/{id}/state POST.
6. **Playwright smoke spec runs green** — `npm run test:e2e -- tests/smoke/dashboard-glass-cards.spec.ts -g "SHEET-0[2-6]"` exits 0; existing DASH-* tests still pass.

### Gaps Summary

No gaps. All 12 must-haves verified; all 5 SHEET-02..06 requirements satisfied (with two contractual deviations explicitly logged in REQUIREMENTS.md, 178-CONTEXT.md, and the deferred-items list: T-OBS-1 stove room-temperature drop and Pitfall 8 plug room-segment drop). All 117 jest tests for sheet primitives + bodies + commands pass; all 40 affected card tests pass with new sheet mocks; zero TS errors attributable to Phase 178 sources. Playwright spec is correctly extended but its runtime verification requires a developer sandbox — see `human_verification`.

---

_Verified: 2026-04-29_
_Verifier: Claude (gsd-verifier)_
